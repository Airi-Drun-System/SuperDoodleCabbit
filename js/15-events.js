"use strict";
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
  refreshOnlineCounter();
  refreshDailyBtn();
  refreshMenuHint();
  maybeAutoDaily();
  if (cloudReady()){ checkPendingGrant(true); fetchInbox(true); }
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
  addToLeaderboard(nickname, score);
  if (typeof lbFetchedAt !== 'undefined') lbFetchedAt = 0;
  cloudPushSoon();

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
