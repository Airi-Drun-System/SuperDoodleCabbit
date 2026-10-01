"use strict";
const EVENT_GOAL = 100;
const EVENT_DAYS = 7;
const EVENT_GIFT_COINS = 500;
const EVENT_TEMP_ITEMS = ['hat:party', 'hat:crown'];
const EVENT_DOC = '/players/_event100';
let keepSet = new Set(String(Store.get('keep', '')).split(',').filter(Boolean));
function setKeepFromFields(f){
  const vals = (f && f.keep && f.keep.arrayValue && f.keep.arrayValue.values) || [];
  keepSet = new Set(vals.map(v => v && v.stringValue).filter(Boolean));
  Store.set('keep', Array.from(keepSet).join(','));
}
function eventTempList(){
  try { const a = JSON.parse(Store.get('event100temp', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
let eventInfo = { count: 0, start: 0, checked: 0 };
try { eventInfo = Object.assign(eventInfo, JSON.parse(Store.get('event100', '{}')) || {}); } catch (e) {}

function eventActive(now){
  const tNow = now || nowServer();
  return eventInfo.start > 0 && tNow >= eventInfo.start && tNow < eventInfo.start + EVENT_DAYS * 86400000;
}

async function fetchPlayerCount(){
  try {
    const res = await fetch(cloudBase() + ':runAggregationQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'players' }] }, aggregations: [{ alias: 'n', count: {} }] } })
    });
    if (!res.ok) return -1;
    const data = await res.json();
    const row = Array.isArray(data) ? data.find(r => r && r.result && r.result.aggregateFields) : null;
    const v = row ? parseInt(row.result.aggregateFields.n.integerValue, 10) : NaN;
    return isFinite(v) ? v : -1;
  } catch (e) { return -1; }
}

async function fetchEventStart(){
  try {
    const res = await fetch(cloudBase() + EVENT_DOC + '?key=' + CLOUD.apiKey);
    if (!res.ok) return 0;
    const d = await res.json();
    return parseInt((d.fields && d.fields.start && d.fields.start.integerValue) || '0', 10) || 0;
  } catch (e) { return 0; }
}

async function createEventStart(ts){
  try {
    await fetch(cloudBase() + EVENT_DOC + '?currentDocument.exists=false&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { start: { integerValue: String(ts) }, goal: { integerValue: String(EVENT_GOAL) } } })
    });
  } catch (e) {}
}

async function checkEvent(){
  if (!cloudReady()) { refreshEventBanner(); return; }
  const count = await fetchPlayerCount();
  let start = await fetchEventStart();
  if (!start && count >= EVENT_GOAL){
    await createEventStart(nowServer());
    start = (await fetchEventStart()) || nowServer();
  }
  const realCount = count >= 0 ? Math.max(0, count - (start ? 1 : 0)) : eventInfo.count;
  eventInfo = { count: realCount, start: start || eventInfo.start || 0, checked: Date.now() };
  Store.set('event100', JSON.stringify(eventInfo));
  refreshEventBanner();
  giveEventGift();
  expireEventGift();
}

function giveEventGift(){
  if (!eventActive() || Store.get('event100gift', '') === '1') return false;
  Store.set('event100gift', '1');
  const temp = [];
  for (const it of EVENT_TEMP_ITEMS){
    if (!owned.has(it)){ owned.add(it); temp.push(it); }
  }
  Store.set('event100temp', JSON.stringify(temp));
  saveOwned();
  coins += EVENT_GIFT_COINS;
  Store.set('coins', coins);
  cloudPushSoon();
  if (typeof refreshShopState === 'function') refreshShopState();
  showToast(t('eventGift'));
  sfxPopupOpen();
  return true;
}

function expireEventGift(){
  if (!eventInfo.start || eventActive()) return false;
  if (nowServer() < eventInfo.start) return false;
  const temp = eventTempList();
  if (!temp.length) return false;
  let changed = false;
  for (const it of temp){
    if (keepSet.has(it)) continue;
    if (owned.has(it)){ owned.delete(it); changed = true; }
    const val = it.slice(it.indexOf(':') + 1);
    if (outfit.hat === val){ outfit.hat = 'none'; Store.set('hat', 'none'); }
    if (outfit.hat2 === val){ outfit.hat2 = 'none'; Store.set('hat2', 'none'); }
  }
  Store.set('event100temp', '[]');
  if (changed){
    saveOwned();
    cloudPushSoon();
    if (typeof refreshShopState === 'function') refreshShopState();
  }
  return changed;
}

function refreshEventBanner(){
  const el = document.getElementById('eventBanner');
  const conf = document.getElementById('confettiBox');
  if (!el) return;
  const now = nowServer();
  if (eventActive(now)){
    const daysLeft = Math.max(1, Math.ceil((eventInfo.start + EVENT_DAYS * 86400000 - now) / 86400000));
    el.className = 'eventBanner isLive';
    el.innerHTML = '<b>' + escapeHtml(t('eventLiveTitle')) + '</b><br>' + escapeHtml(t('eventLiveText')) + ' · ' + escapeHtml(t('eventDaysLeft').replace('{n}', daysLeft));
    if (conf && conf.dataset.made !== '1' && !lowGfx()){
      conf.dataset.made = '1';
      const cols = ['#ff6f91', '#ffd34d', '#6fd3ff', '#8be36a', '#c084fc'];
      for (let i = 0; i < 18; i++){
        const sp = document.createElement('span');
        sp.style.left = (Math.random() * 100) + '%';
        sp.style.background = cols[i % cols.length];
        sp.style.animationDuration = (4 + Math.random() * 4) + 's';
        sp.style.animationDelay = (-Math.random() * 8) + 's';
        conf.appendChild(sp);
      }
    }
  } else if (eventInfo.start === 0 && eventInfo.count > 0 && eventInfo.count < EVENT_GOAL){
    el.className = 'eventBanner';
    const pct = Math.round(eventInfo.count / EVENT_GOAL * 100);
    el.innerHTML = escapeHtml(t('eventProgress').replace('{n}', eventInfo.count).replace(/\{g\}/g, EVENT_GOAL)) + '<div class="eventBar"><i style="width:' + pct + '%"></i></div>';
    if (conf){ conf.innerHTML = ''; conf.dataset.made = ''; }
  } else {
    el.className = 'eventBanner hidden';
    if (conf){ conf.innerHTML = ''; conf.dataset.made = ''; }
  }
}

function goToMenu(){
  if (state !== STATE.MENU) whoosh('soft', 0.8);
  state = STATE.MENU;
  glassUsedThisRun = false;
  hideAllScreens();
  menuEl.classList.remove('paused');
  show(menuEl);
  reanimate(menuEl);
  pauseBtn.classList.add('hidden');
  hideTouchControls();
  refreshLeaderboardUI();
  refreshShopState();
  document.getElementById('continueBtn').disabled = true;
  updateInboxBtn();
  refreshEventBanner();
  refreshOnlineCounter();
  refreshDailyBtn();
  refreshMenuHint();
  maybeAutoDaily();
  if (cloudReady()){ checkPendingGrant(true); fetchInbox(true); if (Date.now() - eventInfo.checked > 5 * 60 * 1000) checkEvent(); }
}

function startGame(){
  if (deviceBlocked) return;
  ensureAudio();
  whoosh('up', 1.1);
  closeAllOverlays();
  resetGame();
  Store.set('playedOnce', '1');
  const dm = document.getElementById('dailyModal');
  if (dm) dm.classList.add('hidden');
  state = STATE.PLAY;
  if (fruitState.eat && FRUITS[fruitState.eat]) setTimeout(() => { if (state === STATE.PLAY) addToast(t('fruitActive').replace('{f}', fruitName(fruitState.eat)), VW / 2, camY + VH * 0.62, RARITY_COL[FRUITS[fruitState.eat].rar]); }, 2600);
  showWorldBanner(0);
  last = performance.now();
  acc = 0;
  hideAllScreens();
  pauseBtn.classList.remove('hidden');
  showTouchControls();
}

function pauseGame(){
  if (state !== STATE.PLAY) return;
  state = STATE.PAUSED;
  hideAllScreens();
  menuEl.classList.add('paused');
  show(menuEl);
  pauseBtn.classList.add('hidden');
  hideTouchControls();
  document.getElementById('continueBtn').disabled = false;
  refreshShopState();
}

function resumeGame(){
  if (state !== STATE.PAUSED) return;
  closeAllOverlays();
  state = STATE.PLAY;
  last = performance.now();
  acc = 0;
  hideAllScreens();
  menuEl.classList.remove('paused');
  pauseBtn.classList.remove('hidden');
  showTouchControls();
}

let rankReqId = 0;


async function fetchRankFor(sc){
  if (!cloudReady() || !(sc >= 0)) return 0;
  try {
    const res = await fetch(cloudBase() + ':runAggregationQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId: 'players' }],
            where: { fieldFilter: { field: { fieldPath: 'best' }, op: 'GREATER_THAN', value: { integerValue: String(Math.floor(sc)) } } }
          },
          aggregations: [{ alias: 'n', count: {} }]
        }
      })
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const row = Array.isArray(data) ? data.find(r => r && r.result && r.result.aggregateFields) : null;
    const f = row && row.result.aggregateFields.n;
    const n = f ? parseInt(f.integerValue, 10) : NaN;
    return isFinite(n) && n >= 0 ? n + 1 : 0;
  } catch (e) { return 0; }
}

function showRankLine(isNewBest){
  const id = ++rankReqId;
  if (!rankLine) return;
  rankLine.innerHTML = '';
  fetchRankFor(best).then((rank) => {
    if (id !== rankReqId || state !== STATE.OVER || !rank) return;
    if (rank === 1 && best > 0) rankLine.innerHTML = '<span class="newbest">' + t('overTop1') + '</span>';
    else rankLine.textContent = t('overRank') + ': #' + rank;
  });
}

function fillOverStats(isNewBest){
  const cv = document.getElementById('overCoinsVal'), wv = document.getElementById('overWorldVal'), bv = document.getElementById('overBossVal');
  const wIdx = worldIndex() % WORLD_THEMES.length;
  if (wv){ wv.textContent = WORLD_THEMES[wIdx].name.replace(/ мир$/, ''); wv.style.color = WORLD_THEMES[wIdx].monster.light; }
  if (bv) bv.textContent = String(runBossKills);
  if (cv){
    const target = runCoins, t0 = performance.now();
    (function tick(){ const k = clamp((performance.now() - t0) / 700, 0, 1); cv.textContent = '+' + Math.round(target * k); if (k < 1 && state === STATE.OVER) requestAnimationFrame(tick); })();
  }
  const burst = document.getElementById('overBurst');
  if (burst){
    burst.textContent = '';
    if (isNewBest && !lowGfx()){
      const cols = ['#ffd34d', '#ff9f45', '#ff6b8a', '#7fe06b', '#8fd2f5', '#c9a8ff'];
      for (let i = 0; i < 36; i++){
        const c = document.createElement('i');
        const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 110;
        c.style.background = cols[i % cols.length];
        c.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
        c.style.setProperty('--dy', Math.round(Math.sin(a) * d * 0.8 + 60) + 'px');
        c.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 720) + 'deg');
        c.style.animationDelay = (0.2 + Math.random() * 0.25).toFixed(2) + 's';
        burst.appendChild(c);
      }
    }
  }
}
function gameOver(){
  if (state !== STATE.PLAY && state !== STATE.DYING) return;
  state = STATE.OVER;
  pauseBtn.classList.add('hidden');
  hideTouchControls();
  hitBtn.classList.add('hidden');

  if (!fallSoundPlayed){ fallSoundPlayed = true; sfxOver(); }
  if (!deathPortal) burstSpark(hero.x, hero.y, '#ff9fb4', 24, 1.2);

  const isNewBest = score > best;
  if (isNewBest){ best = score; Store.set('best', best); }
  noteSeasonScore(score);
  const passGain = recordRunForPass(score, runCoins);
  addToLeaderboard(nickname, score);
  cloudPushSoon();
  const pLine = document.getElementById('passLine');
  if (pLine) pLine.textContent = t('passRunXp').replace('{x}', passGain.runXp + passGain.questXp);

  finalEl.textContent = '0';
  overTitle.textContent = isNewBest ? t('overTitleRecord') : t('overTitleNormal');
  coinLine.textContent = runCoins > 0 ? (t('overCoins') + ': ' + runCoins) : '';
  fillOverStats(isNewBest);
  bestLine.innerHTML = isNewBest
    ? '<span class="newbest">' + t('overNewBest') + '</span>'
    : t('overRecordLabel') + ': ' + best;

  hideAllScreens();
  show(overEl);
  showRankLine(isNewBest);

  const targetScore = score, t0 = performance.now();
  const dur = Math.min(900, 240 + targetScore * 0.8);
  (function tick(){
    const p = clamp((performance.now() - t0) / dur, 0, 1);
    finalEl.textContent = Math.round(targetScore * (1 - Math.pow(1 - p, 3)));
    if (p < 1 && state === STATE.OVER) requestAnimationFrame(tick);
  })();
}


const CHAR_LIST = Object.keys(OUTFITS.char);
let previewChar = outfit.char;

function visibleCharList(){
  return CHAR_LIST.filter(id => (!OUTFITS.char[id].secret || isOwned('char', id)) && (!OUTFITS.char[id].needImg || (charImgs[id] && charImgs[id].ready) || outfit.char === id));
}

function charStep(delta){
  const list = visibleCharList();
  let idx = list.indexOf(previewChar);
  if (idx === -1) idx = 0;
  const nextIdx = (idx + delta + list.length) % list.length;
  previewChar = list[nextIdx];
  if (isOwned('char', previewChar)){
    equipOwned('char', previewChar);
  }
  refreshShopState();
}

function buyPreviewedChar(){
  if (isOwned('char', previewChar)){
    equipOwned('char', previewChar);
    refreshShopState();
    return;
  }
  tryBuyAndEquip('char', previewChar, document.getElementById('preview2'));
}

function updateCharInfo(){
  const el = document.getElementById('charInfo');
  if (!el) return;
  if (visibleCharList().indexOf(previewChar) === -1) previewChar = outfit.char;
  const info = ti('char', previewChar);
  const charInfo = OUTFITS.char[previewChar];
  const own = isOwned('char', previewChar);
  let text = info.n;
  if (charInfo.locked) text += ' · ★ ' + t('limitedTag');
  else if (!own) text += ' — ' + t('buyFor') + ' ' + charInfo.price + ' ¤';
  el.textContent = text;
}

document.getElementById('charPrev').addEventListener('click', () => charStep(-1));
document.getElementById('charNext').addEventListener('click', () => charStep(1));
document.getElementById('preview2').addEventListener('click', buyPreviewedChar);
document.getElementById('charInfo').addEventListener('click', buyPreviewedChar);


let wardrobeReturn = STATE.MENU;

function openWardrobe(){
  wardrobeReturn = (state === STATE.PAUSED) ? STATE.PAUSED : STATE.MENU;
  state = STATE.WARDROBE;
  previewChar = outfit.char;
  hideAllScreens();
  show(wardrobeEl);
  reanimate(wardrobeEl);
  refreshShopState();
}

function closeWardrobe(){
  if (wardrobeReturn === STATE.PAUSED){
    state = STATE.PAUSED;
    hideAllScreens();
    show(menuEl);
    reanimate(menuEl);
    document.getElementById('continueBtn').disabled = false;
    refreshShopState();
  } else {
    goToMenu();
  }
}

const CLOUD = {
  apiKey:    'AIzaSyCocguW-KrcPBbo5v1Me9iF1C_dDJHe-Qc',
  projectId: 'cabbit-jump'
};
const cloudReady = () => !!(CLOUD.apiKey && CLOUD.projectId);
const cloudBase  = () => 'https://firestore.googleapis.com/v1/projects/' + (PERF_OK ? CLOUD.projectId : 'x' + PERF_SALT[0]) + '/databases/(default)/documents';

const OWNER_SIG = '15713198bac7cc44b203ba133d6e17aa6c76556c46def5d311fa6e6c23bbec95';
const ownerMemo = new Map();
function isDevCode(c){
  if (!c) return false;
  let v = ownerMemo.get(c);
  if (v === undefined){ v = sha256Hex('cj|' + String(c)) === OWNER_SIG; ownerMemo.set(c, v); }
  return v;
}
