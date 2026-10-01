"use strict";
let lbFetchedAt = 0;
async function cloudFetchLeaderboard(soft){
  const rows = document.getElementById('onlineLbRows');
  if (!rows || !cloudReady()) return;
  if (soft && lbFetchedAt && Date.now() - lbFetchedAt < 180000) return;
  lbFetchedAt = Date.now();
  rows.innerHTML = '<div class="lbRow"><span>' + t('cloudLoading') + '</span></div>';
  try {
    const lbQ = (field) => fetch(cloudBase() + ':runQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'players' }],
          orderBy: [{ field: { fieldPath: field }, direction: 'DESCENDING' }],
          limit: 100
        }
      })
    });
    const resB = await lbQ('best');
    const resT = { ok: false };
    if (!resB.ok){
      rows.innerHTML = '<div class="lbRow"><span>' + t('cloudErr') + '</span></div>';
      return;
    }
    const dataT = resT.ok ? await resT.json() : [];
    const dataB = resB.ok ? await resB.json() : [];
    const merged = new Map();
    for (const row of [].concat(Array.isArray(dataT) ? dataT : [], Array.isArray(dataB) ? dataB : [])){
      if (!row || !row.document) continue;
      const f = row.document.fields || {};
      if (f.deleted && f.deleted.booleanValue) continue;
      if (f.banned && f.banned.booleanValue) continue;
      const path = row.document.name || '';
      const rowCode = path.substring(path.lastIndexOf('/') + 1);
      if (!rowCode || rowCode.charAt(0) === '_' || merged.has(rowCode)) continue;
      merged.set(rowCode, f);
    }
    const sorted = Array.from(merged.entries()).sort((a, b) => ((parseInt((b[1].best && b[1].best.integerValue) || '0', 10) || 0) - (parseInt((a[1].best && a[1].best.integerValue) || '0', 10) || 0))).slice(0, 100);
    rows.innerHTML = '';
    lbFieldsByCode = {};
    let i = 0;
    for (const [rowCode, f] of sorted){
      lbFieldsByCode[rowCode] = f;
      i++;
      const div = buildPlayerRow(rowCode, f, i + '.');
      rows.appendChild(div);
    }
    if (i === 0) rows.innerHTML = '<div class="lbRow"><span>' + t('empty') + '</span></div>';
  } catch (e) {
    rows.innerHTML = '<div class="lbRow"><span>' + t('cloudErr') + '</span></div>';
  }
}

function renderProfileHero(canvas, f){
  if (!canvas || !canvas.getContext) return;
  const pctx = canvas.getContext('2d');
  pctx.setTransform(1, 0, 0, 1, 0, 0);
  pctx.clearRect(0, 0, canvas.width, canvas.height);

  const prevOutfit = Object.assign({}, outfit);
  const charVal = (f.char && f.char.stringValue && OUTFITS.char[f.char.stringValue]) ? f.char.stringValue : 'hero';
  outfit.char = charVal;
  outfit.hat  = (f.hat  && f.hat.stringValue  && OUTFITS.hat[f.hat.stringValue])   ? f.hat.stringValue  : 'none';
  outfit.acc  = (f.acc  && f.acc.stringValue  && OUTFITS.acc[f.acc.stringValue])   ? f.acc.stringValue  : 'none';
  outfit.tool = (f.tool && f.tool.stringValue && OUTFITS.tool[f.tool.stringValue]) ? f.tool.stringValue : 'none';
  const theirMulti = ((f.perk && f.perk.stringValue) || 'none') === 'multiacc';
  const hat2Val = (theirMulti && f.hat2 && f.hat2.stringValue && OUTFITS.hat[f.hat2.stringValue]) ? f.hat2.stringValue : 'none';
  const acc2Val = (theirMulti && f.acc2 && f.acc2.stringValue && OUTFITS.acc[f.acc2.stringValue]) ? f.acc2.stringValue : 'none';

  const A = anchors();
  pctx.save();
  pctx.translate(canvas.width / 2, canvas.height * 0.56);
  pctx.scale(2.9, 2.9);
  paintHeroBody(pctx, hero.w, hero.h, 0);
  paintAccessory(pctx, hero.w, hero.h, outfit.acc, A);
  if (acc2Val !== 'none') paintAccessory(pctx, hero.w, hero.h, acc2Val, A);
  paintHat(pctx, hero.w, hero.h, outfit.hat, A);
  if (hat2Val !== 'none'){
    pctx.save();
    pctx.translate(0, -hero.h * 0.20);
    pctx.scale(0.7, 0.7);
    paintHat(pctx, hero.w, hero.h, hat2Val, A);
    pctx.restore();
  }
  paintTool(pctx, hero.w, hero.h, outfit.tool, A, performance.now() / 1000);
  pctx.restore();

  Object.assign(outfit, prevOutfit);
}

let profileOpenCode = '';

let profileOpenNick = '';

function ownProfileFields(base){
  const f = Object.assign({}, base || {});
  for (const key of ['char', 'hat', 'acc', 'tool', 'perk', 'trail', 'hat2', 'acc2']){
    f[key] = { stringValue: outfit[key] || 'none' };
  }
  f.avatar = { stringValue: avatar };
  f.frame = { stringValue: avatarFrame };
  if (nickname) f.nick = { stringValue: nickname };
  f.best = { integerValue: String(best) };
  f.trophies = { integerValue: String(trophies) };
  f.coins = { integerValue: String(coins) };
  f.lastSeen = { integerValue: String(Date.now()) };
  f.title = { stringValue: myTitle || '' };
  f.titleColor = { stringValue: myTitleColor || '' };
  if (!f.badge && myBadge) f.badge = { stringValue: myBadge };
  return f;
}

function openProfile(code){
  let f = lbFieldsByCode[code];
  if (code === cloudCode) f = ownProfileFields(f);
  if (!f) return;
  profileOpenCode = code;
  const nick = (f.nick && f.nick.stringValue) || '?';
  profileOpenNick = nick;
  const titleText = (f.title && f.title.stringValue) || '';
  const titleColor = (f.titleColor && f.titleColor.stringValue) || '';
  const bestScore = (f.best && f.best.integerValue) || '0';
  const coinsVal = (f.coins && f.coins.integerValue) || '0';
  const profAvatarVal = shownAvatar(f, code);
  const profAvatarBox = document.getElementById('profileAvatar');
  if (profAvatarBox){
    if (isCustomAvatar(profAvatarVal)) profAvatarBox.innerHTML = '<img src="' + profAvatarVal + '" alt="">';
    else profAvatarBox.textContent = profAvatarVal;
  }
  setFrameClass(document.getElementById('profileAvatarFrame'), (f.frame && f.frame.stringValue) || 'none');

  document.getElementById('profileNick').textContent = nick;
  setBadgeImg(document.getElementById('profileBadge'), f.badge && f.badge.stringValue);
  const onlineDotEl = document.getElementById('profileOnlineDot');
  if (onlineDotEl){
    onlineDotEl.classList.remove('hidden');
    onlineDotEl.classList.toggle('isOnline', isOnline(f));
  }
  const titleEl = document.getElementById('profileTitleLine');
  if (titleText){
    titleEl.textContent = titleText;
    titleEl.style.color = titleColor && !/gradient\(/i.test(titleColor) ? titleColor : '';
  } else {
    titleEl.textContent = '';
    titleEl.style.color = '';
  }
  document.getElementById('profileBest').textContent = t('overRecordLabel') + ': ' + statText(f, 'best', bestScore);
  document.getElementById('profileCoins').textContent = statText(f, 'coins', coinsVal) + ' ' + t('profileCoinsLabel');

  renderProfileHero(document.getElementById('profileCanvas'), f);
  refreshProfileFriendBtn();
  loadConvStatusFor(code);
  document.getElementById('profileModal').classList.remove('hidden');
  sfxPopupOpen();
  fetchProfileComments(code);
}

function closeProfile(){
  document.getElementById('profileModal').classList.add('hidden');
  sfxPopupClose();
  profileOpenCode = '';
  profileOpenNick = '';
  const inputEl = document.getElementById('profileCommentInput');
  const statusEl = document.getElementById('profileCommentStatus');
  if (inputEl) inputEl.value = '';
  if (statusEl) statusEl.textContent = '';
}
const profileMessageBtnEl = document.getElementById('profileMessageBtn');
if (profileMessageBtnEl) profileMessageBtnEl.addEventListener('click', profileFriendAction);
document.getElementById('profileUnfriendBtn').addEventListener('click', () => {
  const b = document.getElementById('profileUnfriendBtn');
  if (!profileOpenCode) return;
  if (b.dataset.arm !== '1'){ b.dataset.arm = '1'; b.textContent = t('removeFriend') + '?'; setTimeout(() => { b.dataset.arm = ''; b.textContent = '✕ 👤'; }, 3000); return; }
  b.dataset.arm = ''; b.textContent = '✕ 👤';
  setFriendFlag(profileOpenCode, profileOpenNick, 'remove');
});
document.getElementById('chatUnfriendBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const b = document.getElementById('chatUnfriendBtn');
  if (!chatWithCode) return;
  if (b.dataset.arm !== '1'){ b.dataset.arm = '1'; b.textContent = t('removeFriend') + '?'; setTimeout(() => { b.dataset.arm = ''; refreshChatFriendMenu(); }, 3000); return; }
  b.dataset.arm = '';
  toggleChatMore(false);
  setFriendFlag(chatWithCode, chatWithNickName, 'remove');
});
document.getElementById('profileClose').addEventListener('click', closeProfile);
document.getElementById('profileModal').addEventListener('click', (e) => {
  if (e.target && e.target.id === 'profileModal') closeProfile();
});

function renderComments(list){
  const box = document.getElementById('profileCommentsList');
  if (!box) return;
  box.innerHTML = '';
  if (!list || !list.length){
    const empty = document.createElement('div');
    empty.className = 'profileCommentEmpty';
    empty.textContent = t('profileCommentEmpty');
    box.appendChild(empty);
    return;
  }
  for (const c of list){
    const row = document.createElement('div');
    row.className = 'profileCommentRow';
    row.innerHTML =
      '<div class="profileCommentAuthor">' + escapeHtml(cleanText(c.author || '?')) + '</div>' +
      '<div class="profileCommentText">' + escapeHtml(cleanText(c.text || '')) + '</div>';
    box.appendChild(row);
  }
}

async function fetchProfileComments(code){
  const box = document.getElementById('profileCommentsList');
  if (box) box.innerHTML = '<div class="profileCommentEmpty">' + t('cloudLoading') + '</div>';
  if (!cloudReady()){ renderComments([]); return; }
  try {
    const res = await fetch(cloudBase() + '/players/' + code + '/comments?pageSize=30&orderBy=ts%20desc&key=' + CLOUD.apiKey);
    if (!res.ok){ renderComments([]); return; }
    const data = await res.json();
    const docs = (data && data.documents) || [];
    const list = docs.map(d => {
      const f = d.fields || {};
      return {
        author: (f.author && f.author.stringValue) || '?',
        text: (f.text && f.text.stringValue) || '',
        ts: parseInt((f.ts && f.ts.integerValue) || '0', 10) || 0
      };
    });
    if (profileOpenCode === code) renderComments(list);
  } catch (e) {
    if (profileOpenCode === code) renderComments([]);
  }
}

let profileCommentBusy = false;
async function postProfileComment(){
  const code = profileOpenCode;
  if (!code || profileCommentBusy) return;
  const input = document.getElementById('profileCommentInput');
  const statusEl = document.getElementById('profileCommentStatus');
  let text = (input && input.value || '').trim();
  if (!text) return;
  const spamKeyC = spamCheck(text);
  if (spamKeyC){
    if (statusEl) statusEl.textContent = t(spamKeyC);
    return;
  }
  text = cleanText(text);
  spamCommit();
  if (text.length > 140){
    if (statusEl) statusEl.textContent = t('profileCommentTooLong');
    return;
  }
  if (!cloudReady()){
    if (statusEl) statusEl.textContent = t('cloudErr');
    return;
  }
  if (!nickname){
    if (statusEl) statusEl.textContent = t('profileCommentNeedNick');
    return;
  }
  const authorName = nickname;
  profileCommentBusy = true;
  const sendBtn = document.getElementById('profileCommentSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  if (statusEl) statusEl.textContent = t('profileCommentSending');
  try {
    const res = await fetch(cloudBase() + '/players/' + code + '/comments?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          author: { stringValue: authorName },
          authorCode: { stringValue: cloudCode },
          avatar: { stringValue: (isCustomAvatar(avatar) && !myAvatarOk) ? AVATAR_LIST[0] : avatar },
          text: { stringValue: text },
          ts: { integerValue: String(Date.now()) }
        }
      })
    });
    if (res.ok){
      if (input) input.value = '';
      if (statusEl) statusEl.textContent = '';
      fetchProfileComments(code);
    } else {
      if (statusEl) statusEl.textContent = t('profileCommentError');
    }
  } catch (e) {
    if (statusEl) statusEl.textContent = t('profileCommentError');
  }
  profileCommentBusy = false;
  if (sendBtn) sendBtn.disabled = false;
}

const profileCommentSendBtnEl = document.getElementById('profileCommentSendBtn');
if (profileCommentSendBtnEl) profileCommentSendBtnEl.addEventListener('click', postProfileComment);
const profileCommentInputEl = document.getElementById('profileCommentInput');
if (profileCommentInputEl) profileCommentInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') postProfileComment();
});

function chatConvId(codeA, codeB){
  return [codeA, codeB].sort().join('_');
}

let chatWithCode = '';
let chatWithNickName = '';
let chatPollTimer = null;
let chatLastSig = null;
let chatMessages = [];
let chatPending = [];
let chatFromInbox = false;
const convSeenSent = {};
const CHAT_PAGE = 60;

const pad2 = (n) => (n < 10 ? '0' : '') + n;
function fmtTime(ts){
  const d = new Date(ts);
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function dayKey(ts){
  const d = new Date(ts);
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
}
function dayLabel(ts){
  const now = new Date();
  if (dayKey(ts) === dayKey(now.getTime())) return t('dayToday');
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (dayKey(ts) === dayKey(y)) return t('dayYesterday');
  try {
    return new Date(ts).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long' });
  } catch (e) { return ''; }
}
function shortTimeLabel(ts){
  if (!ts) return '';
  if (dayKey(ts) === dayKey(Date.now())) return fmtTime(ts);
  return dayLabel(ts);
}

function chatSignature(list){
  return (list || []).map(m => m.id + (m.tradeSt || '') + (m.read ? 'r' : 'u') + (m.deleted ? 'd' : '') + (m.edited ? 'e' + m.text : '') + (m.reacts ? JSON.stringify(m.reacts) : '')).join(',') + '|' + chatPending.map(p => p.tempId).join(',');
}

const STICKERS = [
  { id: 'hi',     pose: { armR: -2.25, earL: 0.1, earR: -0.1 }, front: ['armR'], text: 'Привет!' },
  { id: 'love',   pose: { earL: 0.5, earR: -0.5, armL: 0.4, armR: -0.4 }, hearts: true },
  { id: 'lol',    pose: { earL: 0.9, earR: -0.9, armL: 1.1, armR: -1.1 }, rot: 0.12, text: 'ХА-ХА' },
  { id: 'gg',     pose: { armL: 2.1, armR: -2.1, earL: 0.4, earR: -0.4 }, front: ['armL', 'armR'], text: 'GG', gold: true },
  { id: 'sleep',  pose: { earL: -0.12, earR: 0.12 }, lids: true, zzz: true },
  { id: 'dance',  pose: { armL: 2.0, armR: -0.8, legL: 0.25, earL: 0.6, earR: -0.2 }, front: ['armL'], rot: -0.12, notes: true },
  { id: 'fly',    pose: { earL: 1.45, earR: -1.45, armL: 0.7, armR: -0.7 }, lift: true },
  { id: 'what',   pose: { earL: 0.2, earR: -0.7 }, rot: 0.16, text: '?!' },
  { id: 'thanks', pose: { earL: 0.3, earR: -0.3, armL: 0.3, armR: -0.3 }, text: 'Спасибо!', heart: true },
  { id: 'ok',     pose: { armR: -1.7, earL: 0.15, earR: -0.15 }, front: ['armR'], text: 'ОК' }
];
const STICKER_IDS = STICKERS.map(x => x.id);

function drawStickerHeart(g, x, y, r, col){
  g.save(); g.translate(x, y); g.scale(r / 10, r / 10);
  g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-12, -5, -6, -14, 0, -7); g.bezierCurveTo(6, -14, 12, -5, 0, 4); g.closePath();
  g.fillStyle = col; g.strokeStyle = '#2b2238'; g.lineWidth = 1.6; g.fill(); g.stroke(); g.restore();
}

function drawStickerText(g, text, x, y, size, rot, color){
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  g.font = size + 'px ' + GAME_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.2; g.strokeStyle = '#2b2238'; g.strokeText(text, 0, 0);
  g.fillStyle = color || '#fdf6e8'; g.fillText(text, 0, 0); g.restore();
}

function drawStickerPart(g, s, rec, name, ang){
  const part = rec.rig.parts[name];
  const cv = rec.hi[name];
  if (!part || !cv) return;
  const b = part.box;
  const x0 = (b[0] - 256) * s, y0 = (b[1] - 256 + RIG_OY) * s;
  const px = (part.pivot[0] - 256) * s, py = (part.pivot[1] - 256 + RIG_OY) * s;
  g.save(); g.translate(px, py); g.rotate(ang || 0); g.translate(-px, -py);
  g.drawImage(cv, x0, y0, (b[2] - b[0]) * s, (b[3] - b[1]) * s);
  g.restore();
}

function makeStickerCanvas(id, cssSize){
  const st = STICKERS.find(x => x.id === id);
  const cvs2 = document.createElement('canvas');
  const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  cvs2.width = Math.round(cssSize * k); cvs2.height = Math.round(cssSize * k);
  const g = cvs2.getContext('2d');
  if (!st || !g || !g.scale) return cvs2;
  g.scale(k * cssSize / 128, k * cssSize / 128);
  const rec = charImgs.hero11;
  if (!rec || !rec.ready){
    drawStickerText(g, st.text || '♥', 64, 64, 30, 0);
    return cvs2;
  }
  const dogSize = 100;
  const sc = dogSize / 512;
  const pose = Object.assign({ armL: 0, armR: 0, legL: 0, legR: 0, earL: 0, earR: 0, head: 0, tuck: 0 }, st.pose);
  const front = st.front || [];
  const drawPose = Object.assign({}, pose);
  for (const n of front) drawPose[n] = 0;
  g.save();
  g.translate(64, st.lift ? 70 : 76);
  g.rotate(st.rot || 0);
  if (front.length){
    for (const n of rec.rig.order){
      if (front.indexOf(n) !== -1) continue;
      if (n === 'lids') continue;
      drawStickerPart(g, sc, rec, n, pose[n] || 0);
    }
    for (const n of front) drawStickerPart(g, sc, rec, n, pose[n]);
  } else {
    paintRigParts(g, sc, rec, rec.hi, drawPose);
  }
  if (st.lids){
    for (const ex of [208, 304]){
      const x = (ex - 256) * sc, y = (176 - 256 + RIG_OY) * sc;
      g.fillStyle = '#dea449'; g.strokeStyle = '#2b2238'; g.lineWidth = 6 * sc;
      g.beginPath(); g.ellipse(x, y, 28 * sc, 31 * sc, 0, 0, 6.2832); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x - 20 * sc, y + 4 * sc); g.quadraticCurveTo(x, y + 18 * sc, x + 20 * sc, y + 4 * sc); g.stroke();
    }
  }
  g.restore();
  if (st.hearts){ drawStickerHeart(g, 22, 34, 12, '#ff6b9a'); drawStickerHeart(g, 104, 26, 14, '#ff9fc0'); drawStickerHeart(g, 108, 70, 9, '#ff6b9a'); }
  if (st.heart) drawStickerHeart(g, 106, 40, 12, '#ff6b9a');
  if (st.zzz){ drawStickerText(g, 'Z', 92, 36, 18, 0.2); drawStickerText(g, 'Z', 104, 20, 13, 0.2); drawStickerText(g, 'z', 112, 8, 10, 0.2); }
  if (st.notes){ drawStickerText(g, '♪', 18, 34, 22, -0.2); drawStickerText(g, '♫', 110, 24, 22, 0.2); }
  if (st.gold){ drawStickerText(g, '✦', 16, 30, 16, 0, '#ffd34d'); drawStickerText(g, '✦', 112, 44, 12, 0, '#ffd34d'); }
  if (st.text) drawStickerText(g, st.text, 64, 16, st.text.length > 5 ? 20 : 26, -0.06, st.gold ? '#ffd34d' : '#fdf6e8');
  return cvs2;
}

let stickerPanelBuilt = false;
function toggleStickerPanel(force){
  const panel = document.getElementById('stickerPanel');
  const btn = document.getElementById('chatStickerBtn');
  if (!panel) return;
  const show = typeof force === 'boolean' ? force : panel.classList.contains('hidden');
  if (show && !stickerPanelBuilt){
    panel.innerHTML = '';
    for (const st of STICKERS){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stickerPick';
      b.appendChild(makeStickerCanvas(st.id, 56));
      b.addEventListener('click', () => { sendChatPayload({ sticker: st.id }); toggleStickerPanel(false); });
      panel.appendChild(b);
    }
    stickerPanelBuilt = charImgs.hero11 && charImgs.hero11.ready;
  }
  panel.classList.toggle('hidden', !show);
  if (btn) btn.classList.toggle('active', show);
}

const chatImgCache = {};
const chatImgRevealed = {};
let myNoImages = Store.get('noImages', '0') === '1';
function photoBanned(){ return myNoImages && !(typeof isStaff === 'function' && isStaff()) && !isDevCode(cloudCode); }

function loadChatImage(convId, ref){
  if (!ref || chatImgCache[ref]) return;
  chatImgCache[ref] = { state: 'loading' };
  fetch(cloudBase() + '/conversations/_images/messages/' + ref + '?key=' + CLOUD.apiKey)
    .then(r => r.ok ? r.json() : null)
    .then((d) => {
      const f = (d && d.fields) || {};
      const data = (f.data && f.data.stringValue) || '';
      chatImgCache[ref] = (f.removed && f.removed.booleanValue) || !data
        ? { state: 'removed' }
        : { state: 'ok', data: data.indexOf('data:image/') === 0 ? data : '' };
      chatLastSig = null;
      renderChatMessages(chatMessages, false);
    })
    .catch(() => { chatImgCache[ref] = { state: 'error' }; });
}

function compressPhoto(file){
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const tries = [[720, 0.62], [520, 0.5], [380, 0.45]];
        for (const [max, q] of tries){
          const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
          const k = Math.min(1, max / Math.max(w0, h0));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          const url = c.toDataURL('image/jpeg', q);
          if (url.length < 320000){ resolve(url); return; }
        }
        resolve('');
      };
      img.onerror = () => resolve('');
      img.src = reader.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

async function reportChatPhoto(m){
  if (!cloudReady() || !m || !m.imgRef) return;
  const convId = chatConvId(cloudCode, chatWithCode);
  try {
    await fetch(cloudBase() + '/conversations/_reports/messages?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        convId: { stringValue: convId }, imgRef: { stringValue: m.imgRef }, msgId: { stringValue: m.id || '' },
        from: { stringValue: m.from || '' }, fromNick: { stringValue: chatWithNickName || '' },
        reporter: { stringValue: cloudCode }, ts: { integerValue: String(Date.now()) }
      } })
    });
    const st = document.getElementById('chatStatus');
    if (st) st.textContent = t('photoReported');
  } catch (e) {}
}

function refreshChatBlockUI(){
  const btn = document.getElementById('chatBlockBtn');
  if (!btn) return;
  const blocked = isBlocked(chatWithCode);
  btn.textContent = blocked ? t('unblockBtn') : t('blockBtn');
  btn.classList.toggle('isBlocked', blocked);
  const input = document.getElementById('chatInput');
  if (input) input.disabled = blocked;
  const send = document.getElementById('chatSendBtn');
  if (send) send.disabled = blocked;
}

function toggleBlockChat(){
  if (!chatWithCode) return;
  if (isBlocked(chatWithCode)) blockedSet.delete(chatWithCode);
  else blockedSet.add(chatWithCode);
  saveBlocked();
  refreshChatBlockUI();
  chatLastSig = null;
  renderChatMessages(chatMessages, true);
  fetchInbox();
}

let chatReplyTo = null;

function msgSnippet(m){
  if (!m) return '';
  if (m.sticker) return '[' + t('msgSticker').replace(/^\[|\]$/g, '') + ']';
  if (m.imgRef || m.localImg) return '[' + t('msgPhoto').replace(/^\[|\]$/g, '') + ']';
  return cleanText(String(m.text || '')).replace(/\s+/g, ' ').slice(0, 90);
}

function replyNameFor(from){
  return from === cloudCode ? t('replyYou') : (chatWithNickName || '?');
}

let chatEditing = null;
let chatPin = { id: '', text: '', from: '' };
let chatTypingSeen = null;
let chatTypingUntil = 0;
let chatTypingSentAt = 0;
let chatLastIncomingTs = 0;
let chatMenuMsg = null;
let chatMenuDelArm = false;
const CHAT_REACTS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];
const CHAT_THEMES = [
  { id: 'classic', a: '#2c1640', b: '#ffb366' },
  { id: 'tg', a: '#0e1621', b: '#2b5278' },
  { id: 'mint', a: '#0a1f1b', b: '#5fd9a5' },
  { id: 'sunset', a: '#1f0a1b', b: '#ff7f9c' },
  { id: 'ocean', a: '#081a29', b: '#4fc0f2' },
  { id: 'light', a: '#e6ebf1', b: '#9fdc8a' }
];
let chatTheme = Store.get('chatTheme', 'classic');
if (!CHAT_THEMES.some(x => x.id === chatTheme)) chatTheme = 'classic';

function applyChatTheme(id){
  if (!CHAT_THEMES.some(x => x.id === id)) id = 'classic';
  chatTheme = id;
  Store.set('chatTheme', id);
  ['chatModal', 'inboxModal'].forEach((mid) => { const el = document.getElementById(mid); if (el) el.dataset.ctheme = id; });
  const list = document.getElementById('chatThemeList');
  if (!list) return;
  list.innerHTML = '';
  for (const th of CHAT_THEMES){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chatThemePick' + (th.id === chatTheme ? ' active' : '');
    b.dataset.theme = th.id;
    b.innerHTML = '<i style="background:linear-gradient(135deg,' + th.a + ' 50%,' + th.b + ' 50%)"></i>' + escapeHtml(t('th_' + th.id));
    b.addEventListener('click', (e) => { e.stopPropagation(); applyChatTheme(th.id); });
    list.appendChild(b);
  }
}

function toggleChatMore(force){
  const menu = document.getElementById('chatMoreMenu');
  if (!menu) return;
  const show = force === undefined ? menu.classList.contains('hidden') : !!force;
  if (show) applyChatTheme(chatTheme);
  menu.classList.toggle('hidden', !show);
}

function refreshChatBar(){
  const bar = document.getElementById('chatReplyBar');
  if (!bar) return;
  const on = !!(chatReplyTo || chatEditing);
  bar.classList.toggle('hidden', !on);
  if (!on) return;
  document.getElementById('chatReplyBarIcon').textContent = chatEditing ? '✎' : '↩';
  document.getElementById('chatReplyBarName').textContent = chatEditing ? t('msgEditing') : replyNameFor(chatReplyTo.from);
  document.getElementById('chatReplyBarText').textContent = chatEditing ? chatEditing.orig : chatReplyTo.text;
}

function setChatReply(m){
  if (m && (m.pending || !m.id)) return;
  if (m && chatEditing){
    chatEditing = null;
    const inp = document.getElementById('chatInput');
    if (inp) inp.value = '';
  }
  chatReplyTo = m ? { id: m.id, from: m.from, text: msgSnippet(m) } : null;
  refreshChatBar();
  if (chatReplyTo){
    buzz(10);
    const inputEl = document.getElementById('chatInput');
    if (inputEl && inputEl.focus) inputEl.focus();
  }
}

function cancelChatBar(){
  if (chatEditing){
    chatEditing = null;
    const inp = document.getElementById('chatInput');
    if (inp) inp.value = '';
  }
  chatReplyTo = null;
  refreshChatBar();
}

function msgDocUrl(msgId, mask){
  const convId = chatConvId(cloudCode, chatWithCode);
  return cloudBase() + '/conversations/' + convId + '/messages/' + msgId + '?' + mask.map(f => 'updateMask.fieldPaths=' + f + '&').join('') + 'key=' + CLOUD.apiKey;
}

function startEditMsg(m){
  if (!m || m.from !== cloudCode || m.sticker || m.imgRef || m.pending) return;
  chatReplyTo = null;
  chatEditing = { id: m.id, orig: m.text || '' };
  const inp = document.getElementById('chatInput');
  if (inp){ inp.value = m.text || ''; if (inp.focus) inp.focus(); }
  refreshChatBar();
}

async function saveChatEdit(){
  const inp = document.getElementById('chatInput');
  const st = document.getElementById('chatStatus');
  const ed = chatEditing;
  if (!ed) return;
  const text = (inp && inp.value || '').trim();
  if (!text) return;
  if (text.length > 200){ if (st) st.textContent = t('chatTooLong'); return; }
  if (text === ed.orig){ cancelChatBar(); return; }
  if (!cloudReady() || !chatWithCode) return;
  chatEditing = null;
  if (inp) inp.value = '';
  refreshChatBar();
  const m = chatMessages.find(x => x.id === ed.id);
  if (m){ m.text = text; m.edited = true; }
  chatLastSig = null;
  renderChatMessages(chatMessages, false);
  try {
    const res = await fetch(msgDocUrl(ed.id, ['text', 'edited']), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { text: { stringValue: text }, edited: { booleanValue: true } } })
    });
    if (!res.ok && st) st.textContent = t('chatError');
  } catch (e) { if (st) st.textContent = t('chatError'); }
}

async function deleteChatMsg(m){
  if (!m || m.from !== cloudCode || !m.id || m.pending || !cloudReady() || !chatWithCode) return;
  const convId = chatConvId(cloudCode, chatWithCode);
  const wasLast = chatMessages.length && chatMessages[chatMessages.length - 1].id === m.id;
  chatMessages = chatMessages.filter(x => x.id !== m.id);
  chatLastSig = null;
  renderChatMessages(chatMessages, false);
  const H = { 'Content-Type': 'application/json' };
  try {
    await fetch(msgDocUrl(m.id, ['deleted', 'text', 'sticker', 'imgRef', 'replyTo', 'replyFrom', 'replyText']), {
      method: 'PATCH', headers: H, body: JSON.stringify({ fields: { deleted: { booleanValue: true }, text: { stringValue: '' } } })
    });
    if (m.imgRef){
      await fetch(cloudBase() + '/conversations/_images/messages/' + m.imgRef + '?updateMask.fieldPaths=data&updateMask.fieldPaths=removed&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: H, body: JSON.stringify({ fields: { data: { stringValue: '' }, removed: { booleanValue: true } } })
      });
    }
    if (wasLast){
      await fetch(cloudBase() + '/conversations/' + convId + '?updateMask.fieldPaths=lastText&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lastText: { stringValue: t('msgDeleted') } } })
      });
    }
    if (chatPin.id === m.id) await setChatPin(null);
  } catch (e) {}
}

function toggleReaction(m, emoji){
  if (!m || !m.id || m.pending || !cloudReady() || !chatWithCode) return;
  if (CHAT_REACTS.indexOf(emoji) === -1) return;
  const mine = m.reacts && m.reacts[cloudCode];
  const next = mine === emoji ? '' : emoji;
  m.reacts = Object.assign({}, m.reacts || {});
  if (next) m.reacts[cloudCode] = next; else delete m.reacts[cloudCode];
  chatLastSig = null;
  renderChatMessages(chatMessages, false);
  if (next) buzz(8);
  const field = 'react_' + cloudCode;
  const fields = {};
  if (next) fields[field] = { stringValue: next };
  fetch(msgDocUrl(m.id, [field]), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) }).catch(() => {});
}

function renderPinBar(){
  const bar = document.getElementById('chatPinBar');
  if (!bar) return;
  bar.classList.toggle('hidden', !chatPin.id);
  const tx = document.getElementById('chatPinText');
  if (tx) tx.textContent = chatPin.id ? cleanText(chatPin.text || '') : '';
}

async function setChatPin(m){
  if (!cloudReady() || !chatWithCode) return;
  const convId = chatConvId(cloudCode, chatWithCode);
  chatPin = m ? { id: m.id, text: msgSnippet(m), from: m.from } : { id: '', text: '', from: '' };
  renderPinBar();
  try {
    await fetch(cloudBase() + '/conversations/' + convId + '?updateMask.fieldPaths=pinId&updateMask.fieldPaths=pinText&updateMask.fieldPaths=pinFrom&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { pinId: { stringValue: chatPin.id }, pinText: { stringValue: chatPin.text }, pinFrom: { stringValue: chatPin.from } } })
    });
  } catch (e) {}
}

async function fetchConvState(){
  if (!chatWithCode || !cloudReady() || !cloudCode) return;
  const who = chatWithCode;
  const convId = chatConvId(cloudCode, who);
  try {
    const res = await fetch(cloudBase() + '/conversations/' + convId + '?key=' + CLOUD.apiKey);
    if (res.status === 404 && chatWithCode === who){
      if (friendStatusOf(who) === 'unknown'){ chatConvStatus[who] = 'none'; refreshFriendUI(who); }
      return;
    }
    if (!res.ok || chatWithCode !== who) return;
    const d = await res.json();
    if (chatWithCode !== who) return;
    const f = (d && d.fields) || {};
    const fst = convStatusFromFields(f, who).status;
    if (fst !== friendStatusOf(who)){
      const wasFriend = friendStatusOf(who) === 'friend';
      setLocalFriendStatus(who, fst);
      refreshFriendUI(who);
      if (fst === 'friend' && !wasFriend) fetchChatMessages();
    }
    const s = (k) => (f[k] && f[k].stringValue) || '';
    const np = { id: s('pinId'), text: s('pinText'), from: s('pinFrom') };
    if (np.id !== chatPin.id || np.text !== chatPin.text){ chatPin = np; renderPinBar(); }
    const tv = (f['typing_' + who] && f['typing_' + who].integerValue) || '';
    if (chatTypingSeen === null) chatTypingSeen = tv;
    else if (tv && tv !== chatTypingSeen){
      chatTypingSeen = tv;
      chatTypingUntil = Date.now() + 5000;
      refreshChatHeader();
      setTimeout(refreshChatHeader, 5100);
    }
  } catch (e) {}
}

function sendTyping(){
  if (!chatWithCode || !cloudReady() || !cloudCode || chatEditing || isBlocked(chatWithCode)) return;
  const now = Date.now();
  if (now - chatTypingSentAt < 2500) return;
  chatTypingSentAt = now;
  const convId = chatConvId(cloudCode, chatWithCode);
  const field = 'typing_' + cloudCode;
  const fields = {};
  fields[field] = { integerValue: String(now) };
  fetch(cloudBase() + '/conversations/' + convId + '?updateMask.fieldPaths=' + field + '&key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
  }).catch(() => {});
}

function copyChatText(text){
  const st = document.getElementById('chatStatus');
  const done = () => { if (st) st.textContent = t('msgCopied'); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done, done); return; }
  } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  } catch (e) {}
  done();
}

function closeMsgMenu(){
  const wrap = document.getElementById('chatMsgMenu');
  if (wrap) wrap.classList.add('hidden');
  const rows = document.querySelectorAll('.chatMsgRow');
  for (let i = 0; i < rows.length; i++) rows[i].classList.remove('menuOn');
  chatMenuMsg = null;
  chatMenuDelArm = false;
}

function msgMenuAction(act, btn){
  const m = chatMenuMsg;
  if (!m) return;
  if (act === 'del' && !chatMenuDelArm){
    chatMenuDelArm = true;
    if (btn) btn.innerHTML = '<span>🗑</span>' + escapeHtml(t('msgDeleteSure'));
    return;
  }
  closeMsgMenu();
  if (act === 'reply') setChatReply(m);
  else if (act === 'copy') copyChatText(cleanText(m.text || ''));
  else if (act === 'pin') setChatPin(chatPin.id === m.id ? null : m);
  else if (act === 'edit') startEditMsg(m);
  else if (act === 'del') deleteChatMsg(m);
}

function openMsgMenu(m, row){
  if (!m || m.pending || !m.id || m.tradeGive) return;
  const wrap = document.getElementById('chatMsgMenu');
  const panel = document.getElementById('chatMsgMenuPanel');
  if (!wrap || !panel) return;
  closeMsgMenu();
  chatMenuMsg = m;
  const isOwn = m.from === cloudCode;
  const isText = !m.sticker && !m.imgRef && !m.localImg;
  const mine = m.reacts && m.reacts[cloudCode];
  let html = '<div class="chatReactRow">' + CHAT_REACTS.map((e, i) => '<button type="button" class="chatReactPick' + (mine === e ? ' mine' : '') + '" data-i="' + i + '">' + e + '</button>').join('') + '</div>';
  const acts = [['reply', '↩', t('replyAction')]];
  if (isText) acts.push(['copy', '⧉', t('msgCopy')]);
  acts.push(['pin', '📌', chatPin.id === m.id ? t('msgUnpin') : t('msgPin')]);
  if (isOwn && isText) acts.push(['edit', '✎', t('msgEdit')]);
  if (isOwn) acts.push(['del', '🗑', t('msgDelete')]);
  html += acts.map(a => '<button type="button" class="chatMenuAct' + (a[0] === 'del' ? ' danger' : '') + '" data-act="' + a[0] + '"><span>' + a[1] + '</span>' + escapeHtml(a[2]) + '</button>').join('');
  panel.innerHTML = html;
  const picks = panel.querySelectorAll('.chatReactPick');
  for (let i = 0; i < picks.length; i++){
    const b = picks[i];
    b.addEventListener('click', (e) => { e.stopPropagation(); const em = CHAT_REACTS[parseInt(b.dataset.i, 10)]; closeMsgMenu(); toggleReaction(m, em); });
  }
  const actsEls = panel.querySelectorAll('.chatMenuAct');
  for (let i = 0; i < actsEls.length; i++){
    const b = actsEls[i];
    b.addEventListener('click', (e) => { e.stopPropagation(); msgMenuAction(b.dataset.act, b); });
  }
  wrap.classList.remove('hidden');
  if (row){
    row.classList.add('menuOn');
    const r = row.getBoundingClientRect();
    const pw = panel.offsetWidth || 228, ph = panel.offsetHeight || 260;
    const vw = window.innerWidth || 400, vh = window.innerHeight || 800;
    let top = r.bottom + 8;
    if (top + ph > vh - 12) top = r.top - ph - 8;
    if (top < 12) top = Math.max(12, Math.min(vh - ph - 12, r.top + 20));
    let left = isOwn ? r.right - pw : r.left;
    left = Math.max(8, Math.min(vw - pw - 8, left));
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
  }
  buzz(12);
}

function jumpToChatMsg(id){
  const box = document.getElementById('chatMessagesList');
  if (!box || !id) return;
  const rows = box.querySelectorAll('.chatMsgRow');
  let target = null;
  for (let i = 0; i < rows.length; i++) if (rows[i].dataset && rows[i].dataset.mid === id) target = rows[i];
  const st = document.getElementById('chatStatus');
  if (!target){ if (st) st.textContent = t('replyGone'); return; }
  if (target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
  setTimeout(() => target.classList.remove('flash'), 1200);
}

function attachReplyGestures(row, m, isOwn){
  if (m.pending || !m.id) return;
  const icon = document.createElement('span');
  icon.className = 'chatReplyIcon';
  icon.textContent = '↩';
  row.appendChild(icon);
  const hb = document.createElement('button');
  hb.type = 'button';
  hb.className = 'chatReplyHover';
  hb.title = t('replyAction');
  hb.textContent = '↩';
  hb.addEventListener('click', (e) => { e.stopPropagation(); setChatReply(m); });
  row.appendChild(hb);
  let sx = 0, sy = 0, dx = 0, mode = '', pressT = null, pressed = false;
  row.addEventListener('touchstart', (e) => {
    const tt = e.touches && e.touches[0];
    if (!tt) return;
    sx = tt.clientX; sy = tt.clientY; dx = 0; mode = '';
    clearTimeout(pressT);
    pressed = false;
    pressT = setTimeout(() => { if (!mode){ mode = 'press'; pressed = true; openMsgMenu(m, row); } }, 450);
  }, { passive: true });
  row.addEventListener('touchmove', (e) => {
    const tt = e.touches && e.touches[0];
    if (!tt) return;
    const mx = tt.clientX - sx, my = tt.clientY - sy;
    if (!mode){
      if (Math.abs(mx) > 10 || Math.abs(my) > 10){
        clearTimeout(pressT);
        mode = (Math.abs(mx) > Math.abs(my) * 1.3 && mx < 0) ? 'swipe' : 'scroll';
        if (mode === 'swipe') row.classList.add('swiping');
      }
    }
    if (mode === 'swipe'){
      dx = Math.max(-90, Math.min(0, mx));
      row.style.transform = 'translateX(' + dx + 'px)';
      icon.style.opacity = String(Math.min(1, Math.abs(dx) / 60));
    }
  }, { passive: true });
  const end = () => {
    clearTimeout(pressT);
    if (mode === 'swipe'){
      row.classList.remove('swiping');
      row.style.transform = '';
      icon.style.opacity = '0';
      if (Math.abs(dx) >= 55) setChatReply(m);
    }
    mode = '';
  };
  row.addEventListener('touchend', end);
  row.addEventListener('touchcancel', end);
  row.addEventListener('dblclick', (e) => { e.preventDefault(); setChatReply(m); });
  row.addEventListener('contextmenu', (e) => { e.preventDefault(); openMsgMenu(m, row); });
  row.addEventListener('click', (e) => { if (pressed){ pressed = false; e.stopPropagation(); e.preventDefault(); } }, true);
}

function makeQuoteEl(m){
  const q = document.createElement('div');
  q.className = 'chatQuote';
  q.innerHTML = '<span class="chatQuoteName">' + escapeHtml(replyNameFor(m.replyFrom)) + '</span><span class="chatQuoteText">' + escapeHtml(cleanText(m.replyText || '')) + '</span>';
  q.addEventListener('click', (e) => { e.stopPropagation(); jumpToChatMsg(m.replyTo); });
  return q;
}

function renderChatMessages(list, forceBottom){
  if (isBlocked(chatWithCode)){
    const bx = document.getElementById('chatMessagesList');
    if (bx) bx.innerHTML = '<div class="chatBlockedNote">' + escapeHtml(t('blockedNote')) + '</div>';
    chatLastSig = 'blocked';
    return;
  }
  if (chatWithCode){
    const fst = friendStatusOf(chatWithCode);
    setChatInputsEnabled(fst === 'friend');
    if (fst !== 'friend'){
      if (list) chatMessages = [];
      if (chatLastSig !== 'gate:' + fst || forceBottom) renderFriendGate(fst);
      return;
    }
  }
  const box = document.getElementById('chatMessagesList');
  if (!box) return;
  chatMessages = list || [];
  const sig = chatSignature(chatMessages);
  if (sig === chatLastSig && !forceBottom) return;
  const firstRender = chatLastSig === null;
  const nearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 90;
  chatLastSig = sig;

  const all = chatMessages.filter(m => !m.deleted).concat(chatPending.map(p => ({
    id: p.tempId, from: cloudCode, text: p.text, ts: p.ts, read: false, pending: true, sticker: p.sticker || '', localImg: p.localImg || '',
    replyTo: p.replyTo || '', replyFrom: p.replyFrom || '', replyText: p.replyText || ''
  })));
  const convIdNow = chatWithCode ? chatConvId(cloudCode, chatWithCode) : '';
  box.innerHTML = '';
  if (!all.length){
    const empty = document.createElement('div');
    empty.className = 'chatEmpty';
    empty.textContent = t('chatEmpty');
    box.appendChild(empty);
    return;
  }
  let prevDay = '';
  for (const m of all){
    if (m.ts){
      const dk = dayKey(m.ts);
      if (dk !== prevDay){
        prevDay = dk;
        const sep = document.createElement('div');
        sep.className = 'chatDay';
        sep.textContent = dayLabel(m.ts);
        box.appendChild(sep);
      }
    }
    const row = document.createElement('div');
    const isOwn = m.from === cloudCode;
    row.className = 'chatMsgRow ' + (isOwn ? 'own' : 'their') + (m.pending ? ' pending' : '');
    if (m.id) row.dataset.mid = m.id;
    const hasQuote = !!(m.replyTo && m.replyText);
    let meta = '<span class="chatMsgMeta">' + (m.edited ? '<span class="chatMsgEdited">' + escapeHtml(t('msgEditedMark')) + '</span>' : '') + (m.ts ? fmtTime(m.ts) : '');
    if (isOwn){
      if (m.pending) meta += '<span class="chatMsgTick">🕓</span>';
      else meta += '<span class="chatMsgTick' + (m.read ? ' isRead' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>';
    }
    meta += '</span>';
    if (m.tradeGive && m.tradeWant){
      row.className += ' trade';
      row.appendChild(makeTradeCard(m, isOwn));
      const metaEl3 = document.createElement('span');
      metaEl3.innerHTML = meta;
      row.appendChild(metaEl3.firstChild);
    } else if (m.sticker && STICKER_IDS.indexOf(m.sticker) !== -1){
      row.className += ' sticker';
      if (hasQuote) row.appendChild(makeQuoteEl(m));
      row.appendChild(makeStickerCanvas(m.sticker, 112));
      const metaEl = document.createElement('span');
      metaEl.innerHTML = meta;
      row.appendChild(metaEl.firstChild);
    } else if (m.imgRef || m.localImg){
      row.className += ' photo';
      if (hasQuote) row.appendChild(makeQuoteEl(m));
      const wrap = document.createElement('div');
      wrap.className = 'chatPhoto';
      const cached = m.imgRef ? chatImgCache[m.imgRef] : null;
      const src = m.localImg || (cached && cached.state === 'ok' ? cached.data : '');
      if (cached && cached.state === 'removed'){
        wrap.innerHTML = '<div class="chatPhotoNote">' + escapeHtml(t('photoRemoved')) + '</div>';
      } else if (!src){
        wrap.innerHTML = '<div class="chatPhotoNote">' + escapeHtml(t('photoLoading')) + '</div>';
        if (m.imgRef && convIdNow) loadChatImage(convIdNow, m.imgRef);
      } else {
        const hide = !isOwn && !chatImgRevealed[m.imgRef];
        if (hide) wrap.className += ' blurred';
        wrap.innerHTML = '<img src="' + src + '" alt="">' + (hide ? '<div class="chatPhotoCover">' + escapeHtml(t('photoTap')) + '</div>' : '');
        if (hide) wrap.addEventListener('click', () => { chatImgRevealed[m.imgRef] = true; chatLastSig = null; renderChatMessages(chatMessages, false); });
      }
      row.appendChild(wrap);
      if (!isOwn && m.imgRef && !(cached && cached.state === 'removed')){
        const rb = document.createElement('button');
        rb.type = 'button';
        rb.className = 'chatReportBtn';
        rb.textContent = '⚠ ' + t('photoReport');
        rb.addEventListener('click', () => reportChatPhoto(m));
        row.appendChild(rb);
      }
      const metaEl2 = document.createElement('span');
      metaEl2.innerHTML = meta;
      row.appendChild(metaEl2.firstChild);
    } else {
      row.innerHTML = '<span class="chatMsgText">' + escapeHtml(cleanText(m.text || '')) + '</span>' + meta;
      if (hasQuote) row.insertBefore(makeQuoteEl(m), row.firstChild);
    }
    const rk = m.reacts ? Object.keys(m.reacts) : [];
    if (rk.length){
      const counts = {};
      const order = [];
      for (const k of rk){ const e = m.reacts[k]; if (!counts[e]){ counts[e] = 0; order.push(e); } counts[e]++; }
      const rw = document.createElement('div');
      rw.className = 'chatReacts';
      for (const e of order){
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chatReactChip' + (m.reacts[cloudCode] === e ? ' mine' : '');
        chip.innerHTML = e + (counts[e] > 1 ? '<b>' + counts[e] + '</b>' : '');
        chip.addEventListener('click', (ev) => { ev.stopPropagation(); toggleReaction(m, e); });
        rw.appendChild(chip);
      }
      const metaNode = row.querySelector ? row.querySelector('.chatMsgMeta') : null;
      if (metaNode && metaNode.parentNode === row) row.insertBefore(rw, metaNode); else row.appendChild(rw);
    }
    attachReplyGestures(row, m, isOwn);
    box.appendChild(row);
  }
  if (firstRender || nearBottom || forceBottom) box.scrollTop = box.scrollHeight;
}

async function fetchChatMessages(){
  if (!chatWithCode) return;
  const requestedWith = chatWithCode;
  if (!cloudReady()){ renderChatMessages([]); return; }
  const id = chatConvId(cloudCode, requestedWith);
  if (friendStatusOf(requestedWith) !== 'friend'){ renderChatMessages(null, false); return; }
  try {
    const res = await fetch(cloudBase() + '/conversations/' + id + '/messages?pageSize=' + CHAT_PAGE + '&orderBy=ts%20desc&key=' + CLOUD.apiKey);
    if (!res.ok){ if (chatWithCode === requestedWith) renderChatMessages([]); return; }
    const data = await res.json();
    const docs = (data && data.documents) || [];
    const list = docs.map(d => {
      const f = d.fields || {};
      const path = d.name || '';
      return {
        id: path.substring(path.lastIndexOf('/') + 1),
        from: (f.from && f.from.stringValue) || '',
        text: (f.text && f.text.stringValue) || '',
        sticker: (f.sticker && f.sticker.stringValue) || '',
        tradeGive: (f.tradeGive && FRUITS[f.tradeGive.stringValue]) ? f.tradeGive.stringValue : '',
        tradeWant: (f.tradeWant && FRUITS[f.tradeWant.stringValue]) ? f.tradeWant.stringValue : '',
        tradeSt: (f.tradeSt && f.tradeSt.stringValue) || '',
        imgRef: (f.imgRef && f.imgRef.stringValue) || '',
        replyTo: (f.replyTo && f.replyTo.stringValue) || '',
        replyFrom: (f.replyFrom && f.replyFrom.stringValue) || '',
        replyText: (f.replyText && f.replyText.stringValue) || '',
        edited: !!(f.edited && f.edited.booleanValue),
        deleted: !!(f.deleted && f.deleted.booleanValue),
        reacts: (() => { const r = {}; let any = false; for (const k in f){ if (k.indexOf('react_') === 0 && f[k] && CHAT_REACTS.indexOf(f[k].stringValue) !== -1){ r[k.slice(6)] = f[k].stringValue; any = true; } } return any ? r : null; })(),
        ts: parseInt((f.ts && f.ts.integerValue) || '0', 10) || 0,
        read: !!(f.read && f.read.booleanValue)
      };
    });
    list.sort((a, b) => a.ts - b.ts);
    if (chatWithCode === requestedWith){
      let inTs = 0;
      for (const mm of list) if (mm.from === requestedWith && mm.ts > inTs) inTs = mm.ts;
      if (inTs > chatLastIncomingTs){
        if (chatLastIncomingTs && chatTypingUntil){ chatTypingUntil = 0; refreshChatHeader(); }
        chatLastIncomingTs = inTs;
      }
      renderChatMessages(list);
      if (list.some(x => x.tradeGive && x.from === cloudCode && x.tradeSt && x.tradeSt !== 'open')) settleTrades();
      markIncomingRead(id, list);
      markConvSeen(id, list);
    }
  } catch (e) {
    if (chatWithCode === requestedWith) renderChatMessages([]);
  }
}

function markConvSeen(convId, list){
  let latestIncoming = 0;
  for (const m of (list || [])) if (m.from !== cloudCode && m.ts > latestIncoming) latestIncoming = m.ts;
  if (!latestIncoming || latestIncoming <= (convSeenSent[convId] || 0)) return;
  convSeenSent[convId] = latestIncoming;
  for (const c of inboxConvs) if (c.id === convId) c.unread = false;
  recountInboxUnread();
  if (!cloudReady()) return;
  const field = 'seen_' + cloudCode;
  const body = { fields: {} };
  body.fields[field] = { integerValue: String(Date.now()) };
  fetch(cloudBase() + '/conversations/' + convId + '?updateMask.fieldPaths=' + field + '&key=' + CLOUD.apiKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {});
}

function updateConvMeta(convId, otherCode, otherNick, text, ts){
  if (!cloudReady()) return Promise.resolve();
  const fields = {
    members: { arrayValue: { values: [{ stringValue: cloudCode }, { stringValue: otherCode }] } },
    lastText: { stringValue: String(text).slice(0, 120) },
    lastFrom: { stringValue: cloudCode },
    lastTs: { integerValue: String(ts) }
  };
  fields['nick_' + cloudCode] = { stringValue: nickname || '' };
  if (otherNick) fields['nick_' + otherCode] = { stringValue: otherNick };
  fields['seen_' + cloudCode] = { integerValue: String(ts) };
  if (!isCustomAvatar(avatar)) fields['av_' + cloudCode] = { stringValue: avatar };
  const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  return fetch(cloudBase() + '/conversations/' + convId + '?' + mask + '&key=' + CLOUD.apiKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  }).catch(() => {});
}

let inboxConvs = [];
let inboxUnread = 0;
let inboxLoadedOnce = false;

const chatPeerFields = {};
const chatPeerFetchAt = {};

function peerFields(code){
  return chatPeerFields[code] || lbFieldsByCode[code] || null;
}

async function ensurePeers(codes, maxAgeMs){
  if (!cloudReady()) return;
  const now = Date.now();
  const age = maxAgeMs || 120000;
  const need = [];
  for (const c of codes || []){
    if (!c || need.indexOf(c) !== -1) continue;
    if (lbFieldsByCode[c] && !maxAgeMs) continue;
    if (chatPeerFetchAt[c] && now - chatPeerFetchAt[c] < age) continue;
    need.push(c);
  }
  if (!need.length) return;
  need.forEach(c => { chatPeerFetchAt[c] = now; });
  const got = await Promise.all(need.slice(0, 40).map(c =>
    fetch(cloudBase() + '/players/' + encodeURIComponent(c) + '?key=' + CLOUD.apiKey)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.fields){ chatPeerFields[c] = d.fields; return true; } return false; })
      .catch(() => false)
  ));
  if (got.indexOf(true) === -1) return;
  const inboxEl = document.getElementById('inboxModal');
  if (inboxEl && !inboxEl.classList.contains('hidden')) renderInbox();
  if (chatWithCode && need.indexOf(chatWithCode) !== -1) refreshChatHeader();
}

const FRIENDS_SINCE = Date.UTC(2026, 8, 28, 8, 25);
const chatConvStatus = {};
const friendMigrated = {};
const friendReqTimes = loadTimes('frReqTimes');

function convStatusFromFields(f, other){
  const b = (k) => !!(f[k] && f[k].booleanValue);
  const frMe = b('fr_' + cloudCode), frOther = b('fr_' + other), decl = b('decl_' + cloudCode);
  const hasFr = Object.keys(f).some(k => k.indexOf('fr_') === 0);
  const lastTs = parseInt((f.lastTs && f.lastTs.integerValue) || '0', 10) || 0;
  const legacy = !hasFr && lastTs > 0 && lastTs < FRIENDS_SINCE;
  let status = 'none';
  if ((frMe && frOther) || legacy) status = 'friend';
  else if (frOther && !frMe) status = decl ? 'declined' : 'incoming';
  else if (frMe && !frOther) status = 'outgoing';
  return { status, legacy };
}

function friendStatusOf(code){
  if (!code) return 'none';
  const c = inboxConvs.find(x => x.other === code);
  if (c) return c.status;
  return chatConvStatus[code] || 'unknown';
}

function setLocalFriendStatus(code, status){
  chatConvStatus[code] = status;
  const c = inboxConvs.find(x => x.other === code);
  if (c) c.status = status;
}

async function setFriendFlag(otherCode, otherNick, mode){
  if (!cloudReady() || !cloudCode || !otherCode || otherCode === cloudCode) return false;
  const st = document.getElementById('chatStatus');
  if (mode === 'request'){
    const now = Date.now();
    while (friendReqTimes.length && now - friendReqTimes[0] > 600000) friendReqTimes.shift();
    if (friendReqTimes.length >= 10){ showToast(t('friendReqLimit')); return false; }
    friendReqTimes.push(now);
    Store.set('frReqTimes', JSON.stringify(friendReqTimes.slice(-12)));
  }
  const convId = chatConvId(cloudCode, otherCode);
  const on = mode === 'request' || mode === 'accept' || mode === 'legacy';
  const fields = {
    members: { arrayValue: { values: [{ stringValue: cloudCode }, { stringValue: otherCode }] } }
  };
  fields['fr_' + cloudCode] = { booleanValue: on };
  fields['decl_' + cloudCode] = { booleanValue: mode === 'decline' || mode === 'remove' };
  fields['frTs_' + cloudCode] = { integerValue: String(Date.now()) };
  fields['nick_' + cloudCode] = { stringValue: nickname || '' };
  if (otherNick && otherNick !== '?') fields['nick_' + otherCode] = { stringValue: otherNick };
  if (!isCustomAvatar(avatar)) fields['av_' + cloudCode] = { stringValue: avatar };
  if (mode === 'legacy') fields['fr_' + otherCode] = { booleanValue: true };
  const prev = friendStatusOf(otherCode);
  let next = prev;
  if (mode === 'request') next = (prev === 'incoming' || prev === 'declined') ? 'friend' : 'outgoing';
  else if (mode === 'accept') next = 'friend';
  else if (mode === 'legacy') next = 'friend';
  else if (mode === 'decline') next = 'declined';
  else if (mode === 'cancel') next = 'none';
  else if (mode === 'remove') next = 'declined';
  setLocalFriendStatus(otherCode, next);
  refreshFriendUI(otherCode);
  const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  try {
    const res = await fetch(cloudBase() + '/conversations/' + convId + '?' + mask + '&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
    });
    if (!res.ok){ setLocalFriendStatus(otherCode, prev); refreshFriendUI(otherCode); if (st) st.textContent = t('chatError'); return false; }
    if (next === 'friend' && mode !== 'legacy'){ showToast(t('friendAdded')); buzz(15); }
    if (mode !== 'legacy') fetchInbox();
    return true;
  } catch (e) {
    setLocalFriendStatus(otherCode, prev); refreshFriendUI(otherCode);
    return false;
  }
}

function refreshFriendUI(code){
  if (profileOpenCode && profileOpenCode === code) refreshProfileFriendBtn();
  if (chatWithCode && chatWithCode === code){ chatLastSig = null; renderChatMessages(chatMessages, true); refreshChatFriendMenu(); }
  const modal = document.getElementById('inboxModal');
  if (modal && !modal.classList.contains('hidden')) renderInbox();
  recountInboxUnread();
}

function refreshProfileFriendBtn(){
  const btn = document.getElementById('profileMessageBtn');
  const un = document.getElementById('profileUnfriendBtn');
  if (!btn) return;
  const code = profileOpenCode;
  const self = !code || code === cloudCode;
  btn.classList.toggle('hidden', self);
  if (un) un.classList.add('hidden');
  if (self) return;
  const st = friendStatusOf(code);
  if (st === 'friend'){ btn.textContent = t('chatWriteBtn'); if (un){ un.classList.remove('hidden'); un.title = t('removeFriend'); } }
  else if (st === 'outgoing') btn.textContent = t('reqSent');
  else if (st === 'incoming' || st === 'declined') btn.textContent = t('acceptFriend');
  else if (st === 'unknown') btn.textContent = t('cloudLoading');
  else btn.textContent = t('addFriend');
}

async function loadConvStatusFor(code){
  if (!cloudReady() || !cloudCode || !code || code === cloudCode) return;
  const inInbox = inboxConvs.find(x => x.other === code);
  if (inInbox) return;
  try {
    const res = await fetch(cloudBase() + '/conversations/' + chatConvId(cloudCode, code) + '?key=' + CLOUD.apiKey);
    if (res.status === 404){ chatConvStatus[code] = 'none'; refreshFriendUI(code); return; }
    if (!res.ok) return;
    const d = await res.json();
    chatConvStatus[code] = convStatusFromFields((d && d.fields) || {}, code).status;
    refreshFriendUI(code);
  } catch (e) {}
}

function profileFriendAction(){
  const code = profileOpenCode;
  if (!code || code === cloudCode) return;
  const st = friendStatusOf(code);
  if (st === 'friend') openChat(code, profileOpenNick);
  else if (st === 'outgoing') setFriendFlag(code, profileOpenNick, 'cancel');
  else if (st === 'incoming' || st === 'declined') setFriendFlag(code, profileOpenNick, 'accept');
  else if (st === 'none') setFriendFlag(code, profileOpenNick, 'request');
}

function refreshChatFriendMenu(){
  const b = document.getElementById('chatUnfriendBtn');
  if (!b) return;
  const isF = friendStatusOf(chatWithCode) === 'friend';
  b.classList.toggle('hidden', !isF);
  b.textContent = t('removeFriend');
}

function renderFriendGate(st){
  const box = document.getElementById('chatMessagesList');
  if (!box) return;
  const nick = escapeHtml(chatWithNickName || '?');
  let html = '<div class="chatGate">';
  if (st === 'unknown') html += '<div>' + escapeHtml(t('cloudLoading')) + '</div>';
  else if (st === 'incoming' || st === 'declined') html += '<div class="chatGateIcon">🤝</div><div>' + escapeHtml(t('chatReqIncoming')).replace('{nick}', nick) + '</div><button type="button" class="btn" data-gate="accept">' + escapeHtml(t('acceptFriend')) + '</button>';
  else if (st === 'outgoing') html += '<div class="chatGateIcon">⏳</div><div>' + escapeHtml(t('chatReqOutgoing')).replace('{nick}', nick) + '</div>';
  else html += '<div class="chatGateIcon">🔒</div><div>' + escapeHtml(t('chatNotFriends')) + '</div><button type="button" class="btn" data-gate="request">' + escapeHtml(t('addFriend')) + '</button>';
  html += '</div>';
  box.innerHTML = html;
  const gb = box.querySelector ? box.querySelector('[data-gate]') : null;
  if (gb) gb.addEventListener('click', () => setFriendFlag(chatWithCode, chatWithNickName, gb.dataset.gate === 'accept' ? 'accept' : 'request'));
  chatLastSig = 'gate:' + st;
}

function setChatInputsEnabled(on){
  ['chatInput', 'chatSendBtn', 'chatStickerBtn', 'chatPhotoBtn'].forEach((id) => { const el = document.getElementById(id); if (el) el.disabled = !on; });
}

function parseConv(doc){
  const f = (doc && doc.fields) || {};
  const path = (doc && doc.name) || '';
  const id = path.substring(path.lastIndexOf('/') + 1);
  const vals = (f.members && f.members.arrayValue && f.members.arrayValue.values) || [];
  const members = vals.map(v => v && v.stringValue).filter(Boolean);
  const other = members.find(c => c !== cloudCode);
  if (!other || members.indexOf(cloudCode) === -1) return null;
  if (isBlocked(other)) return null;
  const s = (k) => (f[k] && f[k].stringValue) || '';
  const n = (k) => parseInt((f[k] && f[k].integerValue) || '0', 10) || 0;
  const lb = peerFields(other);
  const lastTs = n('lastTs');
  const lastFrom = s('lastFrom');
  const seen = Math.max(n('seen_' + cloudCode), convSeenSent[id] || 0);
  const fs = convStatusFromFields(f, other);
  chatConvStatus[other] = fs.status;
  return {
    id, other,
    nick: s('nick_' + other) || (lb && lb.nick && lb.nick.stringValue) || '?',
    av: s('av_' + other),
    lastText: s('lastText'), lastFrom, lastTs,
    status: fs.status, legacy: fs.legacy,
    frTs: n('frTs_' + other),
    unread: fs.status === 'friend' && lastFrom !== cloudCode && lastTs > seen
  };
}

function recountInboxUnread(){
  inboxUnread = inboxConvs.filter(c => (c.unread && c.status === 'friend' && c.other !== chatWithCode) || c.status === 'incoming').length;
  updateInboxBadge();
}
