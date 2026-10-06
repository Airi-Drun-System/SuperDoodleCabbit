"use strict";
function updateInboxBadge(){
  const badge = document.getElementById('inboxBadge');
  if (!badge) return;
  badge.textContent = inboxUnread > 9 ? '9+' : String(inboxUnread);
  badge.classList.toggle('hidden', inboxUnread === 0);
}

function updateInboxBtn(){
  const btn = document.getElementById('inboxBtn');
  if (btn) btn.classList.toggle('hidden', !cloudReady());
}

const notifyOn = false;
const notifiedTs = {};
let swReg = null;

function notifySupported(){ return typeof Notification !== 'undefined'; }

function registerSw(){
  if (swReg || !('serviceWorker' in navigator)) return Promise.resolve(swReg);
  return navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; return r; }).catch(() => null);
}

function systemNotify(c){
  if (!notifyOn || !notifySupported() || Notification.permission !== 'granted') return;
  if (!document.hidden && state !== STATE.PLAY) return;
  const title = t('notifyTitle') + ' · ' + cleanText(c.nick);
  const opts = { body: cleanText(c.lastText).slice(0, 120), tag: 'conv-' + c.id, icon: 'hero.png', badge: 'hero.png', renotify: true,
    data: { other: c.other || '', nick: c.nick || '' } };
  const plain = () => {
    try {
      const n = new Notification(title, opts);
      n.onclick = () => { try { window.focus(); } catch (e) {} n.close(); openChatFromNotify(c.other, c.nick); };
    } catch (e) {}
  };
  const viaSw = swReg && swReg.showNotification ? swReg.showNotification(title, opts) : null;
  if (viaSw && viaSw.catch) viaSw.catch(plain);
  else if (!viaSw) plain();
}

let notifyOpenPending = null;
let notifyOpenTimer = null;

function openChatFromNotify(code, nick){
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 24);
  if (!code) return;
  notifyOpenPending = { code, nick: String(nick || '').slice(0, 40), tries: 0 };
  clearInterval(notifyOpenTimer);
  const attempt = () => {
    const pnd = notifyOpenPending;
    if (!pnd){ clearInterval(notifyOpenTimer); return; }
    pnd.tries++;
    if (!(cloudReady() && cloudCode)){
      if (pnd.tries > 60){ notifyOpenPending = null; clearInterval(notifyOpenTimer); }
      return;
    }
    notifyOpenPending = null;
    clearInterval(notifyOpenTimer);
    if (code === cloudCode) return;
    if (state === STATE.PLAY) pauseGame();
    const inboxEl = document.getElementById('inboxModal');
    if (inboxEl && !inboxEl.classList.contains('hidden')) closeInbox(true);
    const conv = inboxConvs.find(x => x.other === code);
    const pf = peerFields(code);
    const nk = (conv && conv.nick && conv.nick !== '?' ? conv.nick : '') || (pf && pf.nick && pf.nick.stringValue) || pnd.nick || '?';
    if (chatWithCode === code){ fetchChatMessages(); return; }
    if (chatWithCode) closeChat();
    openChat(code, nk, true);
  };
  attempt();
  if (notifyOpenPending) notifyOpenTimer = setInterval(attempt, 250);
}

if ('serviceWorker' in navigator && navigator.serviceWorker.addEventListener){
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e && e.data;
    if (d && d.type === 'openChat') openChatFromNotify(d.other, d.nick);
  });
}

(function(){
  try {
    const qs = new URLSearchParams(location.search);
    const code = qs.get('chat');
    if (code){
      const nick = qs.get('nick') || '';
      if (history.replaceState) history.replaceState(null, '', location.pathname);
      setTimeout(() => openChatFromNotify(code, nick), 0);
    }
  } catch (e) {}
})();

function refreshNotifyUI(){
  const btn = document.getElementById('notifyToggle');
  const note = document.getElementById('notifyNote');
  if (!btn) return;
  btn.textContent = notifyOn ? t('notifyOnTxt') : t('notifyOffTxt');
  btn.setAttribute('aria-pressed', notifyOn ? 'true' : 'false');
  if (note){
    if (!notifySupported()) note.textContent = t('notifyUnsupported');
    else if (Notification.permission === 'denied') note.textContent = t('notifyDenied');
    else note.textContent = notifyOn ? t('notifyHint') : '';
  }
}

async function toggleNotify(){
  if (notifyOn){
    notifyOn = false;
    Store.set('notify', '0');
    refreshNotifyUI();
    return;
  }
  if (!notifySupported()){ refreshNotifyUI(); return; }
  let perm = Notification.permission;
  if (perm === 'default'){
    try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; }
  }
  notifyOn = perm === 'granted';
  Store.set('notify', notifyOn ? '1' : '0');
  if (notifyOn) registerSw();
  refreshNotifyUI();
}

let inboxFetchedAt = 0;
async function fetchInbox(soft){
  if (!cloudReady() || !cloudCode) return;
  if (soft && Date.now() - inboxFetchedAt < 60000) return;
  inboxFetchedAt = Date.now();
  try {
    const res = await fetch(cloudBase() + ':runQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'conversations' }],
          where: { fieldFilter: { field: { fieldPath: 'members' }, op: 'ARRAY_CONTAINS', value: { stringValue: cloudCode } } },
          limit: 60
        }
      })
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = (Array.isArray(data) ? data : []).filter(r => r && r.document).map(r => parseConv(r.document)).filter(Boolean);
    list.sort((a, b) => b.lastTs - a.lastTs);
    const prevUnread = inboxUnread;
    const prevIncoming = new Set(inboxConvs.filter(c => c.status === 'incoming').map(c => c.id));
    inboxConvs = list;
    for (const c of list){
      if (c.legacy && !friendMigrated[c.id]){ friendMigrated[c.id] = true; setFriendFlag(c.other, c.nick, 'legacy'); }
    }
    if (inboxLoadedOnce){
      const newReq = list.find(c => c.status === 'incoming' && !prevIncoming.has(c.id));
      if (newReq){
        showToast(t('friendReqToast') + newReq.nick, () => openInbox());
        sfxPopupOpen();
        if (!notifiedTs['req_' + newReq.id]){ notifiedTs['req_' + newReq.id] = 1; systemNotify({ id: 'req_' + newReq.id, other: newReq.other, nick: newReq.nick, lastText: t('friendReqNotify') }); }
      }
    }
    recountInboxUnread();
    const inboxShown = !document.getElementById('inboxModal').classList.contains('hidden');
    if (inboxShown) ensurePeers(list.map(c => c.other));
    if (inboxLoadedOnce && inboxUnread > prevUnread){
      const c = list.find(x => x.unread && x.status === 'friend' && x.other !== chatWithCode);
      const inboxOpen = !document.getElementById('inboxModal').classList.contains('hidden');
      if (c && !inboxOpen){ showToast(t('newMsgToast') + c.nick, () => openChatFromNotify(c.other, c.nick)); sfxPopupOpen(); }
    }
    for (const c of list){
      if (!c.unread || c.status !== 'friend' || c.other === chatWithCode) continue;
      const prevTs = notifiedTs[c.id] || 0;
      if (inboxLoadedOnce && c.lastTs > prevTs) systemNotify(c);
      notifiedTs[c.id] = Math.max(prevTs, c.lastTs);
    }
    inboxLoadedOnce = true;
    const modal = document.getElementById('inboxModal');
    if (modal && !modal.classList.contains('hidden')) renderInbox();
    if (profileOpenCode) refreshProfileFriendBtn();
  } catch (e) {}
}

function renderInbox(){
  const box = document.getElementById('inboxList');
  if (!box) return;
  box.innerHTML = '';
  const reqs = inboxConvs.filter(c => c.status === 'incoming').sort((a, b) => b.frTs - a.frTs).slice(0, 20);
  const dialogs = inboxConvs.filter(c => c.status === 'friend');
  if (!reqs.length && !dialogs.length){
    box.innerHTML = '<div class="inboxEmpty">' + escapeHtml(t('inboxEmpty')) + '</div>';
    return;
  }
  if (reqs.length){
    const h = document.createElement('div');
    h.className = 'inboxSection';
    h.textContent = t('friendReqs') + ' · ' + reqs.length;
    box.appendChild(h);
    for (const c of reqs){
      const lb = peerFields(c.other);
      const avVal = lb ? shownAvatar(lb, c.other) : (c.av || AVATAR_LIST[0]);
      const frame = (lb && lb.frame && lb.frame.stringValue) || 'none';
      const row = document.createElement('div');
      row.className = 'inboxReqRow';
      row.dataset.code = c.other;
      row.innerHTML = avatarHtml(avVal, frame, '') +
        '<span class="inboxMain"><span class="inboxTop"><span class="inboxNick">' + escapeHtml(c.nick) + badgeImgHtml(lb && lb.badge && lb.badge.stringValue) + '</span></span>' +
        '<span class="inboxPreview">' + escapeHtml(t('friendReqNotify')) + '</span></span>' +
        '<span class="inboxReqBtns"><button type="button" class="inboxReqYes" aria-label="Принять">✓</button><button type="button" class="inboxReqNo" aria-label="Отклонить">✕</button></span>';
      const bs = row.querySelectorAll ? row.querySelectorAll('button') : [];
      if (bs[0]) bs[0].addEventListener('click', (e) => { e.stopPropagation(); setFriendFlag(c.other, c.nick, 'accept'); });
      if (bs[1]) bs[1].addEventListener('click', (e) => { e.stopPropagation(); setFriendFlag(c.other, c.nick, 'decline'); });
      box.appendChild(row);
    }
    if (dialogs.length){
      const h2 = document.createElement('div');
      h2.className = 'inboxSection';
      h2.textContent = t('dialogsTitle');
      box.appendChild(h2);
    }
  }
  for (const c of dialogs){
    const lb = peerFields(c.other);
    const avVal = lb ? shownAvatar(lb, c.other) : (c.av || AVATAR_LIST[0]);
    const frame = (lb && lb.frame && lb.frame.stringValue) || 'none';
    const preview = c.lastTs ? (c.lastFrom === cloudCode ? t('chatYou') : '') + cleanText(c.lastText) : t('friendsNow');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'inboxRow' + (c.unread ? ' unread' : '');
    btn.dataset.code = c.other;
    btn.innerHTML = avatarHtml(avVal, frame, '') +
      '<span class="inboxMain"><span class="inboxTop"><span class="inboxNick">' + escapeHtml(c.nick) +
      badgeImgHtml(lb && lb.badge && lb.badge.stringValue) +
      '</span><span class="inboxTime">' + (c.lastTs ? escapeHtml(shortTimeLabel(c.lastTs)) : '') + '</span></span>' +
      '<span class="inboxPreview">' + escapeHtml(preview) + '</span></span>' +
      (c.unread ? '<span class="inboxDot"></span>' : '');
    btn.addEventListener('click', () => {
      closeInbox(true);
      openChat(c.other, c.nick, true);
    });
    box.appendChild(btn);
  }
}

function openInbox(){
  const modal = document.getElementById('inboxModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  sfxPopupOpen();
  renderInbox();
  ensurePeers(inboxConvs.map(c => c.other));
  fetchInbox();
}

function closeInbox(silent){
  const modal = document.getElementById('inboxModal');
  if (!modal) return;
  modal.classList.add('hidden');
  if (!silent) sfxPopupClose();
}

document.getElementById('inboxBtn').addEventListener('click', openInbox);
document.getElementById('inboxClose').addEventListener('click', () => closeInbox(false));
document.getElementById('inboxModal').addEventListener('click', (e) => {
  if (e.target && e.target.id === 'inboxModal') closeInbox(false);
});

async function markIncomingRead(convId, list){
  if (!cloudReady()) return;
  const unread = (list || []).filter(m => m.id && m.from !== cloudCode && !m.read);
  if (!unread.length) return;
  try {
    await Promise.all(unread.map(m => fetch(
      cloudBase() + '/conversations/' + convId + '/messages/' + m.id + '?updateMask.fieldPaths=read&key=' + CLOUD.apiKey,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { read: { booleanValue: true } } })
      }
    )));
  } catch (e) {}
}

function refreshChatHeader(){
  if (!chatWithCode) return;
  const f = peerFields(chatWithCode);
  const realNick = f && f.nick && f.nick.stringValue;
  if (realNick && realNick !== chatWithNickName){
    chatWithNickName = realNick;
    document.getElementById('chatWithNick').textContent = realNick;
  }
  setBadgeImg(document.getElementById('chatBadge'), f && f.badge && f.badge.stringValue);
  const online = !!f && isOnline(f);
  const chatDotEl = document.getElementById('chatOnlineDot');
  if (chatDotEl){
    chatDotEl.classList.remove('hidden');
    chatDotEl.classList.toggle('isOnline', online);
  }
  const presenceEl = document.getElementById('chatPresence');
  const typing = Date.now() < chatTypingUntil;
  if (presenceEl){
    presenceEl.textContent = typing ? t('typingNow') : (online ? t('chatOnlineNow') : '');
    presenceEl.classList.toggle('typing', typing);
  }
  const avEl = document.getElementById('chatWithAvatar');
  if (avEl){
    const conv = inboxConvs.find(c => c.other === chatWithCode);
    const avVal = f ? shownAvatar(f, chatWithCode) : ((conv && conv.av) || AVATAR_LIST[0]);
    const frame = (f && f.frame && f.frame.stringValue) || 'none';
    avEl.innerHTML = avatarHtml(avVal, frame, '');
  }
}

function openChat(code, nick, fromInbox){
  chatWithCode = code;
  chatWithNickName = nick || '';
  chatFromInbox = !!fromInbox;
  chatLastSig = null;
  chatMessages = [];
  chatPending = [];
  cancelChatBar();
  closeMsgMenu();
  toggleChatMore(false);
  chatPin = { id: '', text: '', from: '' };
  renderPinBar();
  chatTypingSeen = null;
  chatTypingUntil = 0;
  chatLastIncomingTs = 0;
  applyChatTheme(chatTheme);
  document.getElementById('chatWithNick').textContent = nick || '?';
  refreshChatFriendMenu();
  refreshChatHeader();
  ensurePeers([code], 30000);
  const backBtn = document.getElementById('chatBackBtn');
  if (backBtn) backBtn.classList.toggle('hidden', !chatFromInbox);
  refreshChatBlockUI();
  const box = document.getElementById('chatMessagesList');
  if (box) box.innerHTML = '<div class="chatEmpty">' + t('cloudLoading') + '</div>';
  document.getElementById('chatModal').classList.remove('hidden');
  sfxPopupOpen();
  recountInboxUnread();
  fetchChatMessages();
  fetchConvState();
  clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => { if (document.hidden) return; fetchChatMessages(); fetchConvState(); }, 5000);
  if (!isTouchDevice){
    const inputEl = document.getElementById('chatInput');
    if (inputEl && inputEl.focus) inputEl.focus();
  }
}

function closeChat(){
  document.getElementById('chatModal').classList.add('hidden');
  sfxPopupClose();
  chatWithCode = '';
  chatWithNickName = '';
  chatPending = [];
  chatLastSig = null;
  cancelChatBar();
  closeMsgMenu();
  toggleChatMore(false);
  clearInterval(chatPollTimer);
  chatPollTimer = null;
  const inputEl = document.getElementById('chatInput');
  const statusEl = document.getElementById('chatStatus');
  if (inputEl) inputEl.value = '';
  if (statusEl) statusEl.textContent = '';
  fetchInbox();
}
document.getElementById('chatClose').addEventListener('click', closeChat);
document.getElementById('chatReplyBarClose').addEventListener('click', cancelChatBar);
document.getElementById('chatMoreBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleChatMore(); });
document.getElementById('chatMoreMenu').addEventListener('click', (e) => { e.stopPropagation(); });
document.getElementById('chatModal').addEventListener('click', () => toggleChatMore(false));
document.getElementById('chatMsgMenu').addEventListener('click', (e) => { if (e.target && e.target.id === 'chatMsgMenu') closeMsgMenu(); });
document.getElementById('chatPinBar').addEventListener('click', () => { if (chatPin.id) jumpToChatMsg(chatPin.id); });
document.getElementById('chatPinClose').addEventListener('click', (e) => { e.stopPropagation(); setChatPin(null); });
applyChatTheme(chatTheme);
document.getElementById('chatBackBtn').addEventListener('click', () => {
  closeChat();
  openInbox();
});
document.getElementById('chatModal').addEventListener('click', (e) => {
  if (e.target && e.target.id === 'chatModal') closeChat();
});

let adminChoiceCode = '';
function openAdminChoice(code, nick){
  adminChoiceCode = code;
  document.getElementById('adminChoiceNick').textContent = nick || '?';
  document.getElementById('adminChoiceModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeAdminChoice(){
  document.getElementById('adminChoiceModal').classList.add('hidden');
  sfxPopupClose();
  adminChoiceCode = '';
}
document.getElementById('adminChoiceProfileBtn').addEventListener('click', () => {
  const code = adminChoiceCode;
  closeAdminChoice();
  if (code) openProfile(code);
});
document.getElementById('adminChoicePanelBtn').addEventListener('click', () => {
  const code = adminChoiceCode;
  closeAdminChoice();
  if (code) adminLoad(code);
});
document.getElementById('adminChoiceCancelBtn').addEventListener('click', closeAdminChoice);
document.getElementById('adminChoiceModal').addEventListener('click', (e) => {
  if (e.target && e.target.id === 'adminChoiceModal') closeAdminChoice();
});

const DISCORD_URL = 'https://discord.gg/H6WcNMffZ';
const TELEGRAM_URL = 'https://t.me/CabbitJumpNews';
const TIKTOK_URL = 'https://www.tiktok.com/@cabbitgame';
let linkChoiceUrl = '';

function openLinkChoice(url, title){
  if (navigator.share){
    navigator.share({ url: url, title: title || url }).catch(() => {});
    return;
  }
  linkChoiceUrl = url;
  document.getElementById('linkChoiceTitle').textContent = title || url;
  document.getElementById('linkChoiceModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeLinkChoice(){
  document.getElementById('linkChoiceModal').classList.add('hidden');
  sfxPopupClose();
  linkChoiceUrl = '';
}
document.getElementById('discordBtn').addEventListener('click', () => openLinkChoice(DISCORD_URL, 'Discord'));
document.getElementById('passBtn').addEventListener('click', openPass);
document.getElementById('tiktokBtn').addEventListener('click', () => openLinkChoice(TIKTOK_URL, 'TikTok'));
document.getElementById('dailyBtn').addEventListener('click', openDaily);
document.getElementById('spearBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); spearLunge(); });
document.getElementById('howToOk').addEventListener('click', closeHowTo);
document.getElementById('dailyClose').addEventListener('click', closeDaily);
document.getElementById('dailyClaimBtn').addEventListener('click', claimDaily);
document.getElementById('dailyModal').addEventListener('click', (e) => { if (e.target && e.target.id === 'dailyModal') closeDaily(); });
document.getElementById('menuGearBtn').addEventListener('click', () => document.getElementById('settingsBtn').click());
refreshDailyBtn();
refreshMenuHint();
applyUiStyle(uiStyle);
document.getElementById('passClose').addEventListener('click', closePass);
document.getElementById('passBuyBtn').addEventListener('click', buyGoldPass);
document.getElementById('trophyClose').addEventListener('click', closeTrophyInfo);
document.getElementById('trophyModal').addEventListener('click', (e) => { if (e.target && e.target.id === 'trophyModal') closeTrophyInfo(); });
document.getElementById('telegramBtn').addEventListener('click', () => openLinkChoice(TELEGRAM_URL, 'Telegram'));
const CREDIT_URL = 'https://www.instagram.com/koty_vezde/';
document.getElementById('creditBtn').addEventListener('click', () => openLinkChoice(CREDIT_URL, 'Instagram'));
document.getElementById('linkChoiceOpenBtn').addEventListener('click', () => {
  const url = linkChoiceUrl;
  closeLinkChoice();
  if (url) window.open(url, '_blank');
});
document.getElementById('linkChoiceCopyBtn').addEventListener('click', () => {
  const url = linkChoiceUrl;
  if (!url || !navigator.clipboard || !navigator.clipboard.writeText){
    closeLinkChoice();
    return;
  }
  navigator.clipboard.writeText(url).then(() => {
    closeLinkChoice();
    showToast(t('linkCopied'));
  }).catch(() => {
    closeLinkChoice();
    showToast(t('linkCopyFailed'));
  });
});
document.getElementById('linkChoiceCancelBtn').addEventListener('click', closeLinkChoice);
document.getElementById('linkChoiceModal').addEventListener('click', (e) => {
  if (e.target && e.target.id === 'linkChoiceModal') closeLinkChoice();
});

async function postChatMessage(){
  if (chatEditing) return saveChatEdit();
  const input = document.getElementById('chatInput');
  const text = (input && input.value || '').trim();
  if (!text) return;
  return sendChatPayload({ text });
}

async function sendChatPayload(payload){
  if (!chatWithCode) return;
  if (isBlocked(chatWithCode)) return;
  if (friendStatusOf(chatWithCode) !== 'friend') return;
  const input = document.getElementById('chatInput');
  const statusEl = document.getElementById('chatStatus');
  let text = String(payload.text || '').trim();
  const sticker = payload.sticker && STICKER_IDS.indexOf(payload.sticker) !== -1 ? payload.sticker : '';
  const imgData = payload.imgData || '';
  if (!text && !sticker && !imgData) return;
  if (imgData && photoBanned()){
    if (statusEl) statusEl.textContent = t('photoBanned');
    return;
  }
  const spamKey = spamCheck(sticker ? 'sticker:' + sticker : (imgData ? 'photo:' + imgData.length : text));
  if (spamKey){
    if (statusEl) statusEl.textContent = t(spamKey);
    return;
  }
  if (text){
    text = cleanText(text);
    if (text.length > 200){
      if (statusEl) statusEl.textContent = t('chatTooLong');
      return;
    }
  }
  if (!cloudReady()){
    if (statusEl) statusEl.textContent = t('cloudErr');
    return;
  }
  if (!nickname){
    if (statusEl) statusEl.textContent = t('chatNeedNick');
    return;
  }
  spamCommit();
  const toCode = chatWithCode;
  const toNick = chatWithNickName;
  const id = chatConvId(cloudCode, toCode);
  const ts = Date.now();
  const reply = chatReplyTo;
  const pend = { tempId: 'p' + ts + Math.random().toString(36).slice(2, 7), text, ts, sticker, localImg: imgData,
    replyTo: reply ? reply.id : '', replyFrom: reply ? reply.from : '', replyText: reply ? reply.text : '' };
  if (reply) setChatReply(null);
  chatPending.push(pend);
  if (input && text) input.value = '';
  if (statusEl) statusEl.textContent = imgData ? t('photoSending') : '';
  renderChatMessages(chatMessages, true);
  const dropPending = () => {
    const i = chatPending.indexOf(pend);
    if (i >= 0) chatPending.splice(i, 1);
  };
  const fail = () => {
    dropPending();
    if (chatWithCode === toCode){
      if (statusEl) statusEl.textContent = t('chatError');
      if (text && input && !input.value) input.value = text;
      renderChatMessages(chatMessages, true);
    }
  };
  try {
    let imgRef = '';
    if (imgData){
      const ir = await fetch(cloudBase() + '/conversations/_images/messages?key=' + CLOUD.apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { data: { stringValue: imgData }, from: { stringValue: cloudCode }, convId: { stringValue: id }, ts: { integerValue: String(ts) } } })
      });
      if (!ir.ok){ fail(); return; }
      const idoc = await ir.json();
      imgRef = docCode(idoc);
      chatImgCache[imgRef] = { state: 'ok', data: imgData };
    }
    const fields = {
      from: { stringValue: cloudCode },
      fromNick: { stringValue: nickname },
      text: { stringValue: text },
      ts: { integerValue: String(ts) },
      read: { booleanValue: false }
    };
    if (sticker) fields.sticker = { stringValue: sticker };
    if (imgRef) fields.imgRef = { stringValue: imgRef };
    if (reply){
      fields.replyTo = { stringValue: reply.id };
      fields.replyFrom = { stringValue: reply.from };
      fields.replyText = { stringValue: String(reply.text).slice(0, 90) };
    }
    const res = await fetch(cloudBase() + '/conversations/' + id + '/messages?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    dropPending();
    if (res.ok){
      if (statusEl && imgData) statusEl.textContent = '';
      updateConvMeta(id, toCode, toNick, sticker ? t('msgSticker') : (imgRef ? t('msgPhoto') : text), ts);
      if (chatWithCode === toCode) fetchChatMessages();
    } else {
      fail();
    }
  } catch (e) {
    fail();
  }
}

document.getElementById('chatBlockBtn').addEventListener('click', toggleBlockChat);
document.getElementById('chatStickerBtn').addEventListener('click', () => toggleStickerPanel());
document.getElementById('chatPhotoBtn').addEventListener('click', () => {
  if (photoBanned()){ const st = document.getElementById('chatStatus'); if (st) st.textContent = t('photoBanned'); return; }
  document.getElementById('chatPhotoInput').click();
});
document.getElementById('chatPhotoInput').addEventListener('change', async (e) => {
  const inp = e.target;
  const file = inp.files && inp.files[0];
  inp.value = '';
  if (!file) return;
  const data = await compressPhoto(file);
  if (!data){ const st = document.getElementById('chatStatus'); if (st) st.textContent = t('photoTooBig'); return; }
  sendChatPayload({ imgData: data });
});
const chatSendBtnEl = document.getElementById('chatSendBtn');
if (chatSendBtnEl) chatSendBtnEl.addEventListener('click', postChatMessage);
const chatInputEl = document.getElementById('chatInput');
if (chatInputEl) chatInputEl.addEventListener('input', () => { if (chatInputEl.value.trim()) sendTyping(); });
if (chatInputEl) chatInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (chatEditing || chatReplyTo)){ cancelChatBar(); return; }
  if (e.key === 'Enter'){
    if (e.preventDefault) e.preventDefault();
    postChatMessage();
  }
});

function refreshCloudUI(){
  const section = document.getElementById('cloudSection');
  if (!section) return;
  section.style.display = cloudReady() ? 'flex' : 'none';
  if (!cloudReady()) return;
  const codeEl = document.getElementById('cloudCodeDisplay');
  if (codeEl) codeEl.textContent = cloudCode;
  refreshPwState();
  setCloudStatus('');
}

document.getElementById('cloudCopyBtn').addEventListener('click', () => {
  try {
    const pr = navigator.clipboard.writeText(cloudCode);
    if (pr && pr.catch) pr.catch(() => {});
    setCloudStatus(t('cloudCopied'));
  } catch (e) {}
});
document.getElementById('cloudRestoreBtn').addEventListener('click', () => {
  cloudRestore(document.getElementById('cloudRestoreInput').value, document.getElementById('cloudRestorePw').value);
});
document.getElementById('pwSaveBtn').addEventListener('click', savePassword);
document.getElementById('cloudRefreshBtn').addEventListener('click', () => { const b = document.getElementById('cloudRefreshBtn'); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); cloudFetchLeaderboard(false); });
document.getElementById('playerSearchBtn').addEventListener('click', runPlayerSearch);
document.getElementById('playerSearchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runPlayerSearch(); });

function setCatOpen(cat, open){
  if (!cat) return;
  cat.classList.toggle('open', open);
  const head = cat.querySelector ? cat.querySelector('.setCatHead') : null;
  if (head && head.setAttribute) head.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && cat.dataset && cat.dataset.cat === 'online' && cloudReady()) cloudFetchLeaderboard(true);
}

function collapseSettings(){
  document.querySelectorAll('.setCat').forEach((c) => setCatOpen(c, !!(c.dataset && c.dataset.cat === 'online')));
}

document.querySelectorAll('.setCatHead').forEach((head) => {
  head.addEventListener('click', () => {
    const cat = head.closest ? head.closest('.setCat') : head.parentElement;
    if (cat) setCatOpen(cat, !cat.classList.contains('open'));
  });
});

let settingsSaveTimer = null;
function saveSettings(){
  Store.set('gfxMode', gfxMode);
  cloudPushSoon();
  const st = document.getElementById('settingsSaveStatus');
  if (st){
    st.textContent = t('settingsSaved');
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(() => { st.textContent = ''; }, 1800);
  }
  sfxPopupClose();
}
document.getElementById('settingsSaveBtn').addEventListener('click', saveSettings);

function openSettings(){
  state = STATE.SETTINGS;
  hideAllScreens();
  show(settingsEl);
  reanimate(settingsEl);
  collapseSettings();
  const st = document.getElementById('settingsSaveStatus');
  if (st) st.textContent = '';
  refreshCloudUI();
  refreshStaffUI();
  refreshNotifyUI();
  if (cloudReady()) cloudFetchOwnTitle();
}

function closeSettings(){
  goToMenu();
}


document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('continueBtn').addEventListener('click', resumeGame);
document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('wardrobeBtn').addEventListener('click', openWardrobe);
document.getElementById('fruitsBtn').addEventListener('click', openFruits);
document.getElementById('fruitClose').addEventListener('click', closeFruits);
document.getElementById('bossChipBtn').addEventListener('click', openBestiary);
document.getElementById('seasonCard').addEventListener('click', () => openSeason('players'));
document.getElementById('seasonClose').addEventListener('click', closeSeason);
document.querySelectorAll('#seasonTabs [data-tab]').forEach(b => b.addEventListener('click', () => setSeasonTab(b.dataset.tab)));
setTimeout(() => { checkSeasonRewards(); }, 6000);
document.getElementById('bestiaryClose').addEventListener('click', closeBestiary);
document.getElementById('wheelBtn').addEventListener('click', () => spinWheel(1));
document.getElementById('wheelBtn5').addEventListener('click', () => spinWheel(5));
document.getElementById('wheelBtn10').addEventListener('click', () => spinWheel(10));
document.getElementById('wheelSkipBtn').addEventListener('click', toggleWheelSkip);
document.getElementById('chatTradeBtn').addEventListener('click', openTradeModal);
document.getElementById('tradeCloseBtn').addEventListener('click', closeTradeModal);
document.getElementById('tradeSendBtn').addEventListener('click', async () => {
  const g = tradeGiveSel, w = tradeWantSel;
  if (!g || !w) return;
  closeTradeModal();
  await sendTradeOffer(g, w);
});
setTimeout(() => { if (typeof settleTrades === 'function') settleTrades(true); }, 5000);
document.getElementById('pauseMenuBtn').addEventListener('click', goToMenu);
