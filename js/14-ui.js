"use strict";
const nicknameEl = document.getElementById('nickname');
const menuEl     = document.getElementById('menu');
const settingsEl = document.getElementById('settings');
const wardrobeEl = document.getElementById('wardrobe');
const overEl     = document.getElementById('over');
const pauseBtn   = document.getElementById('pauseBtn');
const hitBtn     = document.getElementById('hitBtn');
const leftBtn    = document.getElementById('leftBtn');
const rightBtn   = document.getElementById('rightBtn');

hitBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  e.stopPropagation();
  tapEvent = true;
  ensureAudio();
});


function bindHoldButton(el, setter){
  const start = e => { e.preventDefault(); e.stopPropagation(); setter(true); ensureAudio(); };
  const end   = e => { e.preventDefault(); e.stopPropagation(); setter(false); };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);
}
bindHoldButton(leftBtn,  v => { keys.left = v; });
bindHoldButton(rightBtn, v => { keys.right = v; });

function refreshSpearBtn(){
  const b = document.getElementById('spearBtn');
  if (!b) return;
  b.classList.toggle('hidden', !(hasSpear() && state === STATE.PLAY));
  b.classList.toggle('used', !spearReady);
  const cd = document.getElementById('spearCd');
  if (cd) cd.textContent = spearReady ? '' : String(Math.max(1, Math.ceil(spearCdLeft)));
}
function showTouchControls(){
  refreshSpearBtn();
  if (!isTouchDevice) return; 
  leftBtn.classList.remove('hidden'); rightBtn.classList.remove('hidden');
}
function hideTouchControls(){
  const sb = document.getElementById('spearBtn');
  if (sb) sb.classList.add('hidden');
  leftBtn.classList.add('hidden'); rightBtn.classList.add('hidden');
  keys.left = false; keys.right = false;
}

const menuBest  = document.getElementById('menuBest');
const menuCoins = document.getElementById('menuCoins');
const finalEl   = document.getElementById('finalScore');
const bestLine  = document.getElementById('bestLine');
const rankLine  = document.getElementById('rankLine');
const coinLine  = document.getElementById('coinLine');
const overTitle = document.getElementById('overTitle');
const shopEl    = document.getElementById('shop');

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

function reanimate(el){
  el.querySelectorAll('.pop, .rise').forEach(n => {
    n.style.animation = 'none';
    void n.offsetWidth;
    n.style.animation = '';
  });
}

function hideAllScreens(){
  hide(nicknameEl); hide(menuEl); hide(settingsEl); hide(overEl); hide(wardrobeEl);
}


const nickInput = document.getElementById('nickInput');
document.getElementById('nickConfirm').addEventListener('click', confirmNick);
nickInput.addEventListener('keydown', e => { if (e.key === 'Enter') confirmNick(); });



let nickReturnToSettings = false;

function openNicknameScreen(fromSettings){
  nickReturnToSettings = !!fromSettings;
  nickInput.value = fromSettings ? nickname : '';
  hideAllScreens();
  show(nicknameEl);
  reanimate(nicknameEl);
  nickInput.focus();
}

function confirmNick(){
  let nick = cleanText(nickInput.value.trim());
  if (!nick) nick = 'Котокролик' + Math.floor(Math.random() * 900 + 100);
  if (nick.length > 14) nick = nick.slice(0, 14);
  const firstTime = !Store.get('nick', '') && Store.get('playedOnce', '') !== '1';
  nickname = nick;
  Store.set('nick', nickname);
  cloudPushSoon();
  if (nickReturnToSettings) openSettings();
  else {
    goToMenu();
    if (firstTime) openHowTo();
  }
}

function openHowTo(){
  dailyAutoShown = true;
  document.getElementById('howToModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeHowTo(){
  document.getElementById('howToModal').classList.add('hidden');
  sfxPopupClose();
  dailyAutoShown = false;
  maybeAutoDaily();
}

document.getElementById('changeNickBtn').addEventListener('click', () => openNicknameScreen(true));


function loadLeaderboard(){
  try {
    const raw = Store.get('leaderboard', '[]');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
(function refundRemovedPerks(){
  const refund = perkRefundCoins;
  perkRefundCoins = 0;
  for (const k in REMOVED_PERKS) owned.delete('perk:' + k);
  if (outfit.perk && REMOVED_PERKS[outfit.perk] !== undefined){ outfit.perk = 'none'; Store.set('perk', 'none'); }
  if (refund){ coins += refund; Store.set('coins', coins); saveOwned(); setTimeout(() => { if (typeof showToast === 'function') showToast(t('perkRefund').replace('{c}', refund)); if (typeof cloudPushSoon === 'function') cloudPushSoon(); }, 1500); }
})();
function saveLeaderboard(arr){ Store.set('leaderboard', JSON.stringify(arr)); }

function addToLeaderboard(nick, sc){
  if (sc <= 0) return;
  const arr = loadLeaderboard();
  arr.push({ nick: nick, score: sc });
  arr.sort((a, b) => b.score - a.score);
  saveLeaderboard(arr.slice(0, 5));
}

function refreshLeaderboardUI(){
  const rows = document.getElementById('lbRows');
  if (!rows) return; 
  const top = loadLeaderboard();
  rows.innerHTML = '';
  for (let i = 0; i < 5; i++){
    const row = document.createElement('div');
    row.className = 'lbRow';
    const entry = top[i];
    row.innerHTML = entry
      ? '<span>' + (i + 1) + '. ' + escapeHtml(entry.nick) + '</span><b>' + entry.score + '</b>'
      : '<span>' + (i + 1) + '. ' + t('empty') + '</span><b>' + t('empty') + '</b>';
    rows.appendChild(row);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
// Цвет титула приходит с сервера: пропускаем только простые цвета и градиенты, иначе пустая строка.
function safeCssColor(v){
  const s = String(v || '').trim();
  if (!s || s.length > 200) return '';
  if (!/^[#a-zA-Z0-9%.,\s()\-]+$/.test(s)) return '';
  if (/url|expression|javascript|import|var\(|attr\(|env\(/i.test(s)) return '';
  const fns = s.match(/[a-z-]+(?=\()/gi) || [];
  const okFn = ['rgb', 'rgba', 'hsl', 'hsla', 'linear-gradient', 'radial-gradient', 'conic-gradient'];
  for (const f of fns) if (okFn.indexOf(f.toLowerCase()) === -1) return '';
  return s;
}


let shopActiveSlot = 'hat';

function equipOwned(slot, val){
  const multi = (slot === 'hat' || slot === 'acc') && isOwned('perk', 'multiacc');
  const secKey = slot + '2';
  if (multi && val === 'none'){
    outfit[slot] = 'none';
    outfit[secKey] = 'none';
    Store.set(slot, 'none');
    Store.set(secKey, 'none');
  } else if (multi){
    if (outfit[slot] === val){
      outfit[slot] = outfit[secKey];
      outfit[secKey] = 'none';
    } else if (outfit[secKey] === val){
      outfit[secKey] = 'none';
    } else if (outfit[slot] === 'none'){
      outfit[slot] = val;
    } else if (outfit[secKey] === 'none'){
      outfit[secKey] = val;
    } else {
      outfit[secKey] = val;
    }
    Store.set(slot, outfit[slot]);
    Store.set(secKey, outfit[secKey]);
  } else {
    outfit[slot] = val;
    Store.set(slot, val);
  }
  cloudPushSoon();
}

function denyChip(chipEl){
  if (!chipEl) return;
  chipEl.classList.remove('denyShake');
  void chipEl.offsetWidth;
  chipEl.classList.add('denyShake');
}

function tryBuyAndEquip(slot, val, chipEl){
  if (OUTFITS[slot][val].locked){ denyChip(chipEl); return; }
  const price = OUTFITS[slot][val].price;
  if (coins < price){ denyChip(chipEl); return; }

  coins -= price;
  noteSpent(price);
  Store.set('coins', coins);
  owned.add(slot + ':' + val);
  saveOwned();
  equipOwned(slot, val);
  refreshShopState();
  cloudPushSoon();
}

function getBuyAllCandidates(slotKey){
  const list = OUTFITS[slotKey];
  if (!list) return [];
  return Object.keys(list).filter(val => !list[val].locked && list[val].price > 0 && !isOwned(slotKey, val) && (!list[val].needImg || (charImgs[val] && charImgs[val].ready)));
}

function refreshBuyAllRow(){
  const btn = document.getElementById('buyAllBtn');
  const costEl = document.getElementById('buyAllCost');
  if (!btn || !costEl) return;

  const candidates = getBuyAllCandidates(shopActiveSlot);
  if (candidates.length === 0){
    btn.disabled = true;
    btn.textContent = t('allBought');
    costEl.textContent = '';
    return;
  }

  const total = candidates.reduce((sum, val) => sum + OUTFITS[shopActiveSlot][val].price, 0);
  btn.disabled = coins < total;
  btn.textContent = t('buyAll');
  costEl.textContent = t('willSpend') + ': ' + total + ' ¤';
}

document.getElementById('buyAllBtn').addEventListener('click', () => {
  const candidates = getBuyAllCandidates(shopActiveSlot);
  if (candidates.length === 0) return;
  const total = candidates.reduce((sum, val) => sum + OUTFITS[shopActiveSlot][val].price, 0);
  if (coins < total){ denyChip(document.getElementById('buyAllBtn')); return; }

  coins -= total;
  noteSpent(total);
  Store.set('coins', coins);
  for (const val of candidates){
    owned.add(shopActiveSlot + ':' + val);
    equipOwned(shopActiveSlot, val);
  }
  saveOwned();
  refreshShopState();
  cloudPushSoon();
});

function renderChipIcon(canvas, slotKey, val){
  if (!canvas || !canvas.getContext) return;
  const ic = canvas.getContext('2d');
  ic.clearRect(0, 0, canvas.width, canvas.height);
  ic.save();
  ic.translate(canvas.width / 2, canvas.height * 0.58);
  ic.scale(0.62, 0.62);

  const prevChar = outfit.char;
  if (slotKey === 'char' && OUTFITS.char[val]) outfit.char = val;
  const A = anchors();

  paintHeroBody(ic, hero.w, hero.h, 0);
  if (slotKey === 'hat'){
    paintHat(ic, hero.w, hero.h, val, A);
  } else if (slotKey === 'acc'){
    paintAccessory(ic, hero.w, hero.h, val, A);
  } else if (slotKey === 'tool'){
    paintTool(ic, hero.w, hero.h, val, A, performance.now() / 1000);
  } else if (slotKey === 'trail'){
    paintTrailIcon(ic, val);
  } else {
    if (outfit.hat !== 'none') paintHat(ic, hero.w, hero.h, outfit.hat, A);
    if (outfit.acc !== 'none') paintAccessory(ic, hero.w, hero.h, outfit.acc, A);
  }

  outfit.char = prevChar;
  ic.restore();
}

function buildShop(){
  shopEl.innerHTML = '';
  const tabsEl = document.getElementById('shopTabs');
  tabsEl.innerHTML = '';

  const slots = [
    { key: 'hat',  label: t('slotHat') },
    { key: 'acc',  label: t('slotAcc') },
    { key: 'tool', label: t('slotTool') },
    { key: 'trail', label: t('slotTrail') },
    { key: 'perk', label: t('slotPerk') }
  ];
  if (!slots.some(s => s.key === shopActiveSlot)) shopActiveSlot = slots[0].key;

  for (const slotDef of slots){
    const tab = document.createElement('button');
    tab.className = 'shopTab';
    tab.type = 'button';
    tab.textContent = slotDef.label;
    tab.dataset.slot = slotDef.key;
    tab.addEventListener('click', () => { shopActiveSlot = slotDef.key; refreshShopTabs(); refreshBuyAllRow(); });
    tabsEl.appendChild(tab);

    const row = document.createElement('div');
    row.className = 'shopPanel';
    row.dataset.slot = slotDef.key;

    for (const val of Object.keys(OUTFITS[slotDef.key])){
      const priceInfo = OUTFITS[slotDef.key][val];
      if (priceInfo.locked && !isOwned(slotDef.key, val)) continue; 
      const info = ti(slotDef.key, val);
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.slot = slotDef.key;
      chip.dataset.val = val;

      let html = '<span class="iname">' + escapeHtml(info.n) + '</span>';
      if (info.d) html += '<span class="idesc">' + escapeHtml(info.d) + '</span>';
      chip.innerHTML = html;

      chip.addEventListener('click', () => {
        if (isOwned(slotDef.key, val)){
          equipOwned(slotDef.key, val);
          refreshShopState();
        } else {
          tryBuyAndEquip(slotDef.key, val, chip);
        }
      });

      row.appendChild(chip);
    }
    shopEl.appendChild(row);
  }

  refreshShopTabs();
  refreshShopState();
}

function refreshShopTabs(){
  document.querySelectorAll('.shopTab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.slot === shopActiveSlot);
  });
  document.querySelectorAll('.shopPanel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.slot === shopActiveSlot);
  });
}


function getLockedItems(){
  const result = [];
  for (const slot of Object.keys(OUTFITS)){
    const val = outfit[slot];
    if (val !== 'none' && !isOwned(slot, val)) result.push({ slot, val, displaySlot: slot });
  }
  
  for (const baseSlot of ['hat', 'acc']){
    const secKey = baseSlot + '2';
    const val = outfit[secKey];
    if (val && val !== 'none' && !isOwned(baseSlot, val)) result.push({ slot: baseSlot, val, displaySlot: secKey });
  }
  return result;
}

function buyItem(slot, val, field){
  field = field || slot;
  if (OUTFITS[slot][val].locked) return;
  const price = OUTFITS[slot][val].price;
  if (coins < price) return;

  coins -= price;
  noteSpent(price);
  Store.set('coins', coins);
  owned.add(slot + ':' + val);
  saveOwned();
  Store.set(field, val);
  refreshShopState();
  cloudPushSoon();
}


function compactNum(n){
  n = Math.floor(n) || 0;
  if (n >= 1000000) return (Math.floor(n / 100000) / 10) + 'M';
  if (n >= 100000 || (n >= 10000 && (window.innerWidth || 400) < 370)) return (n >= 100000 ? Math.floor(n / 1000) : Math.floor(n / 100) / 10) + 'K';
  return String(n);
}
function refreshShopState(){
  if (typeof refreshMusicTrack === 'function') refreshMusicTrack();
  menuBest.textContent  = best;
  const mbc = document.getElementById('menuBestChip'); if (mbc) mbc.textContent = compactNum(best);
  const mbo = document.getElementById('menuBossChip'); if (mbo) mbo.textContent = typeof bossKillsTotal === 'number' ? bossKillsTotal : 0;
  menuCoins.textContent = compactNum(coins);
  if (typeof refreshSeasonCard === 'function') refreshSeasonCard();

  shopEl.querySelectorAll('.chip').forEach(chip => {
    const slot = chip.dataset.slot, val = chip.dataset.val;
    if (!OUTFITS[slot] || !OUTFITS[slot][val]) return;
    const info = ti(slot, val);
    const priceInfo = OUTFITS[slot][val];
    const own = isOwned(slot, val);

    const isSecondary = own && (slot === 'hat' || slot === 'acc') && val !== 'none' && outfit[slot + '2'] === val;
    const isEquipped = own && (outfit[slot] === val || isSecondary);
    chip.setAttribute('aria-pressed', isEquipped ? 'true' : 'false');
    chip.classList.toggle('unowned', !own && priceInfo.price > 0);

    let html = '<canvas class="chipIcon" width="44" height="44"></canvas>';
    if (!own && priceInfo.price > 0) html += '<span class="price">' + priceInfo.price + ' ¤</span>';
    const mark = isEquipped ? ('✓ ' + (isSecondary ? '· ' : '')) : '';
    html += '<span class="iname">' + mark + escapeHtml(info.n) + '</span>';
    if (info.d) html += '<span class="idesc">' + escapeHtml(info.d) + '</span>';
    if (own && !isEquipped && priceInfo.price > 0) html += '<span class="ownedTag">✓</span>';
    chip.innerHTML = html;
    renderChipIcon(chip.querySelector('.chipIcon'), slot, val);
  });

  const wCoins = document.getElementById('wardrobeCoins');
  if (wCoins) wCoins.textContent = coins;
  updateCharInfo();

  
  const playBtnRaw      = document.getElementById('playBtn');
  const continueBtnRaw  = document.getElementById('continueBtn');
  const wardrobeBtnRaw  = document.getElementById('wardrobeBtn');
  const settingsBtnRaw  = document.getElementById('settingsBtn');
  const pauseMenuBtnRaw = document.getElementById('pauseMenuBtn');
  const playBtnEl      = playBtnRaw.closest('.menuBtnWrap');
  const continueBtnEl  = continueBtnRaw.closest('.menuBtnWrap');
  const wardrobeBtnEl  = wardrobeBtnRaw.closest('.menuBtnWrap');
  const settingsBtnEl  = settingsBtnRaw.closest('.menuBtnWrap');
  const pauseMenuBtnEl = pauseMenuBtnRaw.closest('.menuBtnWrap');
  const lockedPanel    = document.getElementById('lockedPanel');
  const buyAllRowEl    = document.getElementById('buyAllRow');
  const paused = state === STATE.PAUSED;

  const setBtnVisible = (wrapEl, rawEl, visible) => {
    wrapEl.classList.toggle('hidden', !visible);
    rawEl.classList.toggle('hidden', !visible);
  };

  if (paused){
    setBtnVisible(playBtnEl, playBtnRaw, false);
    setBtnVisible(wardrobeBtnEl, wardrobeBtnRaw, false);
    setBtnVisible(settingsBtnEl, settingsBtnRaw, false);
    setBtnVisible(pauseMenuBtnEl, pauseMenuBtnRaw, true);
    setBtnVisible(continueBtnEl, continueBtnRaw, true);
    lockedPanel.classList.add('hidden');
    buyAllRowEl.classList.add('hidden');
    return;
  }

  setBtnVisible(pauseMenuBtnEl, pauseMenuBtnRaw, false);
  setBtnVisible(continueBtnEl, continueBtnRaw, false);
  setBtnVisible(wardrobeBtnEl, wardrobeBtnRaw, true);
  setBtnVisible(settingsBtnEl, settingsBtnRaw, true);
  buyAllRowEl.classList.remove('hidden');
  refreshBuyAllRow();

  const locked = getLockedItems();

  if (locked.length > 0){
    setBtnVisible(playBtnEl, playBtnRaw, false);
    lockedPanel.classList.remove('hidden');
    lockedPanel.innerHTML = '';

    for (const item of locked){
      const info = ti(item.slot, item.val);
      const itemLocked = !!OUTFITS[item.slot][item.val].locked;
      const price = OUTFITS[item.slot][item.val].price;
      const can = !itemLocked && coins >= price;

      const row = document.createElement('div');
      row.className = 'lockedRow';

      const label = document.createElement('span');
      label.className = 'li-label';
      let statusText;
      if (itemLocked) statusText = t('notForSale');
      else if (can) statusText = t('buyFor') + ' ' + price;
      else statusText = t('notEnough') + ' ' + (price - coins) + ' ' + t('coinsWord');
      label.textContent = info.n + (item.displaySlot && item.displaySlot.endsWith('2') ? ' (2-й)' : '') + ' — ' + statusText;

      const actions = document.createElement('span');
      actions.className = 'li-actions';

      const buyOne = document.createElement('button');
      buyOne.className = 'lockedBuyOne';
      buyOne.disabled = !can;
      buyOne.textContent = String(price);
      buyOne.addEventListener('click', () => buyItem(item.slot, item.val, item.displaySlot));
      if (itemLocked) buyOne.classList.add('hidden');

      const revert = document.createElement('button');
      revert.className = 'lockedRevert';
      revert.setAttribute('aria-label', t('revert'));
      revert.textContent = '✕';
      revert.addEventListener('click', () => {
        const field = item.displaySlot;
        outfit[field] = (field === 'char') ? 'hero' : 'none';
        Store.set(field, outfit[field]);
        if (field === 'char') { previewChar = 'hero'; updateCharInfo(); }
        refreshShopState();
        cloudPushSoon();
      });

      actions.appendChild(buyOne);
      actions.appendChild(revert);
      row.appendChild(label);
      row.appendChild(actions);
      lockedPanel.appendChild(row);
    }
  } else {
    setBtnVisible(playBtnEl, playBtnRaw, true);
    lockedPanel.classList.add('hidden');
  }
}
