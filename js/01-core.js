"use strict";
const PERF_SALT = (() => { const s = String((typeof location !== 'undefined' && location.hostname) || '').toLowerCase(); const f = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; return [f(s), f(s.split('.').slice(-2).join('.'))]; })();
const PERF_OK = ([421386071, 22050618, 144953630, 2166136261].indexOf(PERF_SALT[0]) >= 0 || [22050618, 144953630, 2127349302, 4171553989, 2065001264, 1304914908].indexOf(PERF_SALT[1]) >= 0) ? 1 : 0;
const BUILD_TAG = 'Q2FiYml0IEp1bXAhIChjKSAyMDI2LiDQntGA0LjQs9C40L3QsNC70YzQvdCw0Y8g0LjQs9GA0LAg0Lgg0LDQstGC0L7RgDogdC5tZS9DYWJiaXRKdW1wTmV3cy4g0JrQvtC/0LjRgNC+0LLQsNC90LjQtSDQt9Cw0L/RgNC10YnQtdC90L4u';
const OPEN_AT = Date.UTC(2026, 8, 30, 12, 15, 0);
let GAME_CLOSED = Date.now() < OPEN_AT;
const closedEn = (() => { try { return window.localStorage.getItem('doodlecabbit.lang') === 'en'; } catch (e) { return false; } })();
function closedLeftText(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  return (d > 0 ? d + (closedEn ? 'd ' : ' д ') : '') + p2(h) + ':' + p2(m) + ':' + p2(x);
}
function showWelcome(){
  let seen = false;
  try { seen = window.localStorage.getItem('doodlecabbit.welcomeRemaster') === '1'; } catch (e) {}
  if (seen) return;
  const dlg = document.getElementById('welcomeDlg');
  if (!dlg) return;
  dlg.hidden = false;
  const btn = document.getElementById('welcomeBtn');
  if (btn) btn.onclick = () => {
    dlg.hidden = true;
    try { window.localStorage.setItem('doodlecabbit.welcomeRemaster', '1'); } catch (e) {}
  };
}
function playUnlock(){
  const scr = document.getElementById('closedScreen');
  const card = document.getElementById('closedCard');
  const fx = document.getElementById('unlockFx');
  const flash = document.getElementById('unlockFlash');
  if (!scr || !fx){ if (scr) scr.hidden = true; showWelcome(); return; }
  if (card) card.classList.add('unlocking');
  fx.hidden = false;
  const sp = document.getElementById('ufSparks');
  if (sp){
    for (let i = 0; i < 28; i++){
      const d = document.createElement('i');
      const a = i / 28 * Math.PI * 2, r = 140 + Math.random() * 180;
      d.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px');
      d.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px');
      d.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      sp.appendChild(d);
    }
  }
  const at = (ms, fn) => setTimeout(fn, ms);
  const step = (c) => fx.classList.add(c);
  at(60, () => step('f1'));
  at(800, () => step('f2'));
  at(1700, () => step('f3'));
  at(2500, () => step('f4'));
  at(3300, () => step('f5'));
  let flashDone = false;
  const endFlash = () => {
    if (flashDone || !flash) return;
    flashDone = true;
    flash.classList.add('out');
    setTimeout(() => { flash.hidden = true; flash.classList.remove('hold', 'out', 'msg'); }, 950);
  };
  at(3750, () => { step('f6'); if (flash){ flash.hidden = false; requestAnimationFrame(() => flash.classList.add('hold')); } });
  at(4050, () => { scr.hidden = true; fx.hidden = true; showWelcome(); });
  at(4500, () => { if (flash){ flash.classList.add('msg'); flash.onclick = endFlash; } });
  at(19000, endFlash);
}
(function closedGate(){
  const scr = document.getElementById('closedScreen');
  if (!GAME_CLOSED){ if (scr) scr.hidden = true; setTimeout(showWelcome, 600); return; }
  const stop = (e) => { if (!GAME_CLOSED) return; if (e && e.target && e.target.id === 'closedPin') return; if (e && e.stopImmediatePropagation) e.stopImmediatePropagation(); if (e && e.cancelable && e.preventDefault) e.preventDefault(); };
  ['keydown', 'keyup', 'keypress'].forEach((ev) => window.addEventListener(ev, stop, true));
  const tEl = document.getElementById('closedTimer');
  const tick = () => {
    const left = OPEN_AT - Date.now();
    if (left <= 0){
      GAME_CLOSED = false;
      clearInterval(iv);
      if (tEl) tEl.textContent = '00:00:00';
      playUnlock();
      return;
    }
    if (tEl) tEl.textContent = closedLeftText(left);
  };
  const iv = setInterval(tick, 1000);
  tick();
})();



const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });
const blurCvs = document.createElement('canvas');
const blurCtx = blurCvs.getContext('2d');

const GAME_FONT = '"BIPs","Baloo 2","Segoe UI Rounded","Trebuchet MS",sans-serif';
if (document.fonts && document.fonts.load) document.fonts.load('20px "BIPs"').catch(() => {});
const VW = 420;
let   VH = 740;
let   DPR = 1, S = 1, cssW = 0, cssH = 0;
const IDLE_RENDER_MS = 1000;
const IDLE_FULL_MS = 1200;
let sceneState = -1, sceneFullUntil = 0, lastIdleRender = 0;

const GFX_MODES = ['auto', 'high', 'low', 'ultra'];
let gfxMode = 'auto';
try { gfxMode = window.localStorage.getItem('doodlecabbit.gfxMode') || 'auto'; } catch (e) {}
if (GFX_MODES.indexOf(gfxMode) === -1) gfxMode = 'auto';
let autoLowGfx = false;
const AUTO_DPR_MAX = 1.75, AUTO_DPR_MIN = 1;
let autoDprCap = AUTO_DPR_MAX;
try { const v = parseFloat(window.localStorage.getItem('doodlecabbit.autoDpr')); if (v >= AUTO_DPR_MIN && v <= AUTO_DPR_MAX) autoDprCap = v; } catch (e) {}
function lowGfx(){ return gfxMode === 'low' || (gfxMode === 'auto' && autoLowGfx); }
function ultraGfx(){ return gfxMode === 'ultra'; }

const isTouchDevice = (navigator.maxTouchPoints > 0) ||
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  ('ontouchstart' in window);

const MIN_VIEW_H = 740;
let OX = 0;
function resize(){
  cssW = window.innerWidth  || cssW || VW;
  cssH = window.innerHeight || cssH || VH;
  if (!(cssW > 0)) cssW = VW;
  if (!(cssH > 0)) cssH = VH;
  DPR  = lowGfx() ? 1 : Math.min(window.devicePixelRatio || 1, gfxMode === 'auto' ? autoDprCap : 2);
  cvs.width  = Math.round(cssW * DPR);
  cvs.height = Math.round(cssH * DPR);
  blurCvs.width  = lowGfx() ? 1 : cvs.width;
  blurCvs.height = lowGfx() ? 1 : cvs.height;
  S  = cssW / VW;
  if (cssH / S < MIN_VIEW_H) S = cssH / MIN_VIEW_H;
  if (!(S > 0) || !isFinite(S)) S = 1;
  OX = Math.max(0, (cssW - VW * S) / 2);
  VH = cssH / S;
  if (!(VH > 0) || !isFinite(VH)) VH = 740;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = lowGfx() ? 'low' : 'medium';
}
resize();

const worldTransform = () => ctx.setTransform(S * DPR, 0, 0, S * DPR, OX * DPR, 0);
const pixelTransform = () => ctx.setTransform(1, 0, 0, 1, 0, 0);


const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = arr => arr[(Math.random() * arr.length) | 0];
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

function rr(c, x, y, w, h, r){
  r = Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}


const Store = {
  mem: {},
  get(key, def){
    try {
      const v = window.localStorage.getItem('doodlecabbit.' + key);
      return v === null ? def : v;
    } catch (e) { return (key in this.mem) ? this.mem[key] : def; }
  },
  set(key, val){
    this.mem[key] = String(val);
    try { window.localStorage.setItem('doodlecabbit.' + key, String(val)); } catch (e) {}
  }
};

try {
  window.addEventListener('storage', (e) => {
    if (e && e.key && /^doodlecabbit\.(coins|owned|spent|pass|daily|trophies)$/.test(e.key)) location.reload();
  });
} catch (e) {}
let best  = parseInt(Store.get('best', '0'), 10) || 0;
let coins = parseInt(Store.get('coins', '0'), 10) || 0;
let coinsSpent = parseInt(Store.get('spent', '0'), 10) || 0;
function noteSpent(n){ coinsSpent += Math.max(0, n | 0); Store.set('spent', coinsSpent); }
function remoteSpent(f){ return Math.max(0, parseInt((f && f.spent && f.spent.integerValue) || '0', 10) || 0); }

const TROPHY_STEPS = [[2, 12, 'trophyRowX2'], [1.5, 10, 'trophyRowX15'], [1.2, 8, 'trophyRowX12'], [1, 6, 'trophyRowX1'], [0.8, 5, 'trophyRowX08'], [0.6, 4, 'trophyRowX06'], [0.4, 3, 'trophyRowX04'], [0.2, 2, 'trophyRowX02'], [0, 0, 'trophyRowX0']];
let trophies = parseInt(Store.get('trophies', ''), 10);
if (!isFinite(trophies) || trophies < 0){ trophies = Math.min(800, Math.floor(best / 12)); Store.set('trophies', trophies); }
let lastTrophyDelta = 0;

function trophyTarget(tr){ return 400 + Math.max(0, tr) * 5; }
function trophyDelta(sc, tr){
  const r = Math.max(0, sc) / trophyTarget(tr);
  let d = 0;
  for (const st of TROPHY_STEPS){ if (r >= st[0]){ d = st[1]; break; } }
  return Math.max(0, d);
}
function estTrophies(f){
  if (f && f.trophies && f.trophies.integerValue !== undefined) return parseInt(f.trophies.integerValue, 10) || 0;
  const b = parseInt((f && f.best && f.best.integerValue) || '0', 10) || 0;
  return Math.min(800, Math.floor(b / 12));
}

function openTrophyInfo(){
  const box = document.getElementById('trophyInfo');
  if (!box) return;
  const tgt = trophyTarget(trophies);
  let rows = '';
  for (const st of TROPHY_STEPS){
    const d = st[1];
    rows += '<span>' + escapeHtml(t(st[2])) + '</span><b class="' + (d > 0 ? 'up' : (d < 0 ? 'down' : '')) + '">' + (d > 0 ? '+' : (d < 0 ? '−' : '')) + Math.abs(d) + '</b>';
  }
  box.innerHTML = '<div style="font-size:18px;font-weight:800">' + escapeHtml(t('trophiesTitle')) + '</div><div class="tiBig">🏆 ' + trophies + '</div>' +
    '<div class="tiText">' + t('trophyInfoTxt').replace('{t}', String(tgt)) + '</div><div class="trophyTable">' + rows + '</div>';
  document.getElementById('trophyModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeTrophyInfo(){ document.getElementById('trophyModal').classList.add('hidden'); sfxPopupClose(); }

const PASS_EPOCH = Date.UTC(2026, 8, 28, 0, 0);
const PASS_SEASON_MS = 30 * 86400000;
const PASS_XP_PER_LVL = 250;
const PASS_LEVELS = 30;
const PASS_GOLD_PRICE = 15000;
const PASS_FREE = [{ c: 100 }, { c: 150 }, { i: 'acc:tie' }, { c: 150 }, { c: 200 }, { i: 'acc:pearls' }, { c: 200 }, { c: 250 }, { i: 'acc:scarf' }, { c: 300 },
  { c: 250 }, { i: 'acc:hearteye' }, { c: 300 }, { c: 300 }, { i: 'hat:cowboy' }, { c: 300 }, { c: 350 }, { i: 'hat:flowercrown' }, { c: 350 }, { c: 400 },
  { c: 400 }, { i: 'hat:sunhat' }, { c: 400 }, { c: 450 }, { i: 'hat:propeller' }, { c: 450 }, { c: 500 }, { i: 'acc:backpack' }, { c: 500 }, { c: 1000 }];
const PASS_GOLD = [{ c: 500 }, { c: 500 }, { i: 'hat:crown' }, { c: 600 }, { i: 'tool:mace' }, { c: 600 }, { c: 600 }, { i: 'hat:tophat' }, { c: 700 }, { i: 'hat:halo' },
  { c: 700 }, { c: 700 }, { i: 'tool:bow' }, { c: 800 }, { c: 800 }, { i: 'hat:bow' }, { c: 800 }, { c: 900 }, { c: 900 }, { i: 'perk:multiacc' },
  { c: 900 }, { c: 1000 }, { c: 1000 }, { i: 'hat:glass' }, { c: 1000 }, { i: 'char:hero2' }, { c: 1200 }, { c: 1200 }, { c: 1500 }, { t: 1 }];
const SLOT_ICON = { hat: '🎩', acc: '🎀', tool: '🏹', char: '🐰', perk: '✨' };
const ITEM_ICON = { 'hat:crown': '👑', 'hat:halo': '😇', 'hat:cowboy': '🤠', 'hat:flowercrown': '🌸', 'hat:sunhat': '👒', 'hat:propeller': '🚁', 'hat:bow': '🎀', 'hat:tophat': '🎩', 'acc:pearls': '📿', 'acc:scarf': '🧣', 'acc:hearteye': '😍', 'acc:backpack': '🎒', 'acc:tie': '👔', 'tool:mace': '🔨', 'tool:bow': '🏹', 'char:hero2': '🐰', 'perk:multiacc': '✨' };

let serverOffset = null;
function nowServer(){ return Date.now() + (serverOffset || 0); }
function passSeasonNow(){ return Math.max(1, Math.floor((nowServer() - PASS_EPOCH) / PASS_SEASON_MS) + 1); }
function passDaysLeft(){ return Math.max(1, Math.ceil((PASS_EPOCH + passSeasonNow() * PASS_SEASON_MS - nowServer()) / 86400000)); }
function normalizePass(p){
  const s = passSeasonNow();
  if (!p || typeof p !== 'object' || p.s !== s) return { s, xp: 0, gold: false, cf: [], cg: [] };
  const lv = (a) => Array.isArray(a) ? a.map(x => parseInt(x, 10)).filter(x => x >= 1 && x <= PASS_LEVELS).filter((x, i, arr) => arr.indexOf(x) === i) : [];
  return { s, xp: Math.max(0, Math.min(PASS_LEVELS * PASS_XP_PER_LVL, parseInt(p.xp, 10) || 0)), gold: !!p.gold, cf: lv(p.cf), cg: lv(p.cg) };
}
function parsePassStr(str){ try { return JSON.parse(str || 'null'); } catch (e) { return null; } }
let pass = normalizePass(parsePassStr(Store.get('pass', '')));
function savePass(){ Store.set('pass', JSON.stringify(pass)); }
function passLevel(){ pass = normalizePass(pass); return Math.min(PASS_LEVELS, Math.floor(pass.xp / PASS_XP_PER_LVL)); }
function mergePass(remote){
  const r = normalizePass(remote);
  const l = normalizePass(pass);
  if (r.s !== l.s) return l;
  const uni = (a, b) => a.concat(b.filter(x => a.indexOf(x) === -1));
  return { s: l.s, xp: Math.max(l.xp, r.xp), gold: l.gold || r.gold, cf: uni(l.cf, r.cf), cg: uni(l.cg, r.cg) };
}
function passClaimableCount(){
  const lvl = passLevel();
  let n = 0;
  for (let L = 1; L <= lvl; L++){
    if (pass.cf.indexOf(L) === -1) n++;
    if (pass.gold && pass.cg.indexOf(L) === -1) n++;
  }
  return n;
}
function addPassXp(x){
  const before = passLevel();
  pass.xp = Math.min(PASS_LEVELS * PASS_XP_PER_LVL, pass.xp + Math.max(0, Math.floor(x)));
  savePass();
  const after = passLevel();
  if (after > before) showToast(t('passLvlUp').replace('{l}', after));
  refreshPassCard();
  return after > before;
}
function rewardLabel(r){
  if (r.t) return { icon: '👑', text: t('passTitleReward') };
  if (r.c) return { icon: '🪙', text: r.c + ' ' + t('coinsWord') };
  const k = r.i.indexOf(':');
  const slot = r.i.slice(0, k), val = r.i.slice(k + 1);
  return { icon: ITEM_ICON[r.i] || SLOT_ICON[slot] || '🎁', text: ti(slot, val).n };
}
function grantReward(r){
  if (r.t){
    if (!myTitle){ myTitle = 'Cabbit Pass'; myTitleColor = 'linear-gradient(90deg,#ffe07a,#ff9f45,#ffe07a)'; Store.set('titleText', myTitle); Store.set('titleColor', myTitleColor); }
    else { coins += 3000; Store.set('coins', coins); }
    return;
  }
  if (r.c){ coins += r.c; Store.set('coins', coins); return; }
  if (owned.has(r.i)){
    const k = r.i.indexOf(':');
    const info = OUTFITS[r.i.slice(0, k)] && OUTFITS[r.i.slice(0, k)][r.i.slice(k + 1)];
    coins += Math.max(100, (info && info.price) || 0);
    Store.set('coins', coins);
    return;
  }
  owned.add(r.i);
  saveOwned();
}
function claimPassReward(line, L){
  pass = normalizePass(pass);
  if (L < 1 || L > passLevel()) return false;
  const arr = line === 'gold' ? pass.cg : pass.cf;
  if (line === 'gold' && !pass.gold) return false;
  if (arr.indexOf(L) !== -1) return false;
  const r = (line === 'gold' ? PASS_GOLD : PASS_FREE)[L - 1];
  grantReward(r);
  arr.push(L);
  savePass();
  sfxCoin(); buzz(15);
  refreshShopState();
  renderPass();
  cloudPushSoon();
  return true;
}
function buyGoldPass(){
  pass = normalizePass(pass);
  if (pass.gold) return false;
  if (coins < PASS_GOLD_PRICE){ showToast(t('passNoCoins').replace('{p}', PASS_GOLD_PRICE)); return false; }
  coins -= PASS_GOLD_PRICE;
  noteSpent(PASS_GOLD_PRICE);
  Store.set('coins', coins);
  pass.gold = true;
  savePass();
  showToast(t('passBought'));
  sfxSpring(); buzz(25);
  refreshShopState();
  renderPass();
  cloudPushSoon();
  return true;
}

function questDayKey(){ const d = new Date(nowServer()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function questsForDay(key){
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const runs = h % 2 ? 5 : 3;
  const sc = [1500, 2500, 3500][h % 3];
  const cn = (h >> 3) % 2 ? 80 : 40;
  return [
    { id: 'runs', n: runs, xp: runs === 5 ? 90 : 60, text: t(runs === 5 ? 'qRuns5' : 'qRuns3') },
    { id: 'score', n: sc, xp: sc >= 3500 ? 120 : (sc >= 2500 ? 90 : 70), text: t('qScore').replace('{n}', sc) },
    { id: 'coins', n: cn, xp: cn >= 80 ? 90 : 60, text: t('qCoins').replace('{n}', cn) }
  ];
}
function loadQuestState(){
  let q = parsePassStr(Store.get('quests', ''));
  const key = questDayKey();
  if (q && q.d !== key && serverOffset === null && cloudReady() && Array.isArray(q.done)) return q;
  if (!q || q.d !== key) q = { d: key, runs: 0, best: 0, coins: 0, done: [] };
  if (!Array.isArray(q.done)) q.done = [];
  return q;
}
function questProgress(q, id){ return id === 'runs' ? q.runs : (id === 'score' ? q.best : q.coins); }
const MIN_RUN_SCORE = 150;
function recordRunForPass(sc, runCoinsGot){
  const q = loadQuestState();
  if (sc >= MIN_RUN_SCORE) q.runs += 1;
  q.best = Math.max(q.best, sc);
  q.coins += Math.max(0, runCoinsGot);
  let questXp = 0;
  const done = [];
  for (const qu of questsForDay(q.d)){
    if (q.done.indexOf(qu.id) === -1 && questProgress(q, qu.id) >= qu.n){ q.done.push(qu.id); questXp += qu.xp; done.push(qu); }
  }
  Store.set('quests', JSON.stringify(q));
  const runXp = sc >= MIN_RUN_SCORE ? Math.round(Math.min(60, Math.floor(Math.max(0, sc) / 60)) * (typeof hasFruit === 'function' && hasFruit('star') ? 1.5 : 1) * (weekEvent() === 'pass' ? 1.5 : 1)) : 0;
  addPassXp(runXp + questXp);
  if (done.length) setTimeout(() => showToast(t('questDone').replace('{x}', done.reduce((a, b) => a + b.xp, 0))), 900);
  return { runXp, questXp };
}

function refreshPassCard(){
  const lvl = passLevel();
  const lv = document.getElementById('passCardLvl');
  if (lv) lv.textContent = lvl + ' / ' + PASS_LEVELS;
  const fill = document.getElementById('passCardFill');
  if (fill) fill.style.width = (lvl >= PASS_LEVELS ? 100 : Math.round((pass.xp % PASS_XP_PER_LVL) / PASS_XP_PER_LVL * 100)) + '%';
  const dot = document.getElementById('passCardDot');
  const n = passClaimableCount();
  if (dot){ dot.textContent = n > 9 ? '9+' : String(n); dot.classList.toggle('hidden', n === 0); }
  const tr = document.getElementById('menuTrophies');
  if (tr) tr.textContent = typeof compactNum === 'function' ? compactNum(trophies) : trophies;
}

function renderPass(){
  pass = normalizePass(pass);
  const lvl = passLevel();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('passSeason', t('passSeasonTxt').replace('{s}', pass.s).replace('{d}', passDaysLeft()));
  set('passLvlBadge', String(lvl));
  const fill = document.getElementById('passXpFill');
  if (fill) fill.style.width = (lvl >= PASS_LEVELS ? 100 : Math.round((pass.xp % PASS_XP_PER_LVL) / PASS_XP_PER_LVL * 100)) + '%';
  set('passXpText', lvl >= PASS_LEVELS ? t('passMaxTxt') : t('passXpTxt').replace('{x}', pass.xp % PASS_XP_PER_LVL).replace('{n}', PASS_XP_PER_LVL).replace('{l}', lvl + 1));
  const buy = document.getElementById('passBuyBtn');
  if (buy){ buy.textContent = pass.gold ? t('passOwned') : t('passBuy').replace('{p}', PASS_GOLD_PRICE); buy.classList.toggle('owned', pass.gold); }
  const qBox = document.getElementById('passQuests');
  if (qBox){
    const q = loadQuestState();
    let h = '<div class="passQTitle">' + escapeHtml(t('passQuestsTitle')) + '</div>';
    for (const qu of questsForDay(q.d)){
      const pr = Math.min(qu.n, questProgress(q, qu.id));
      const done = q.done.indexOf(qu.id) !== -1;
      h += '<div class="passQuest' + (done ? ' done' : '') + '"><span>' + (done ? '✅' : '🎯') + '</span><div class="qMain">' + escapeHtml(qu.text) + ' · ' + pr + '/' + qu.n +
        '<div class="qBar"><i style="width:' + Math.round(pr / qu.n * 100) + '%"></i></div></div><span class="qXp">+' + qu.xp + '</span></div>';
    }
    qBox.innerHTML = h;
  }
  const track = document.getElementById('passTrack');
  if (!track) return;
  track.innerHTML = '';
  let firstClaim = null;
  for (let L = 1; L <= PASS_LEVELS; L++){
    const row = document.createElement('div');
    row.className = 'passRow' + (L <= lvl ? ' reached' : '');
    row.dataset.lvl = String(L);
    const cell = (line) => {
      const r = (line === 'gold' ? PASS_GOLD : PASS_FREE)[L - 1];
      const lab = rewardLabel(r);
      const claimed = (line === 'gold' ? pass.cg : pass.cf).indexOf(L) !== -1;
      const canLine = line === 'free' || pass.gold;
      const claimable = !claimed && canLine && L <= lvl;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'passCell ' + line + (claimed ? ' claimed' : (claimable ? ' claimable' : (L > lvl || !canLine ? ' locked' : '')));
      b.dataset.line = line;
      b.innerHTML = '<span class="pcIcon">' + lab.icon + '</span><span class="pcText">' + escapeHtml(lab.text) + '</span><span class="pcState">' +
        (claimed ? '✓' : (claimable ? escapeHtml(t('passClaim')) : (!canLine ? '🔒' : ''))) + '</span>';
      if (claimable){ b.addEventListener('click', () => claimPassReward(line, L)); if (!firstClaim) firstClaim = row; }
      return b;
    };
    row.appendChild(cell('free'));
    const num = document.createElement('div');
    num.className = 'passLvlNum';
    num.textContent = String(L);
    row.appendChild(num);
    row.appendChild(cell('gold'));
    track.appendChild(row);
  }
  refreshPassCard();
  return firstClaim;
}
function openPass(){
  const m = document.getElementById('passModal');
  if (!m) return;
  m.classList.remove('hidden');
  sfxPopupOpen();
  const first = renderPass();
  const full = m.querySelector ? m.querySelector('.passFull') : null;
  if (full) full.scrollTop = 0;
  if (first && full && parseInt(first.dataset.lvl, 10) > 4 && first.getBoundingClientRect) setTimeout(() => {
    const fr = full.getBoundingClientRect(), rr = first.getBoundingClientRect();
    full.scrollTop = Math.max(0, full.scrollTop + rr.top - fr.top - fr.height * 0.4);
  }, 30);
}
function closePass(){ document.getElementById('passModal').classList.add('hidden'); sfxPopupClose(); refreshShopState(); }


const DAILY_REWARDS = [{ c: 100 }, { c: 150 }, { c: 200 }, { c: 250 }, { c: 300 }, { c: 400 }, { c: 600, i: 'trail:comet' }];
function padDay(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function noteServerTime(doc){
  const ut = doc && doc.updateTime ? Date.parse(doc.updateTime) : NaN;
  if (isFinite(ut)) serverOffset = ut - Date.now();
}
function todayKey(){ return padDay(new Date(nowServer())); }
function yesterdayKey(){ const d = new Date(nowServer()); d.setDate(d.getDate() - 1); return padDay(d); }
function parseDaily(str){
  let v = null;
  try { v = JSON.parse(str || 'null'); } catch (e) {}
  if (!v || typeof v !== 'object') return { last: '', streak: 0 };
  const last = /^\d{4}-\d{2}-\d{2}$/.test(v.last || '') ? v.last : '';
  return { last, streak: Math.max(0, Math.min(7, parseInt(v.streak, 10) || 0)) };
}
let daily = parseDaily(Store.get('daily', ''));
let dailyAutoShown = false;
function saveDaily(){ Store.set('daily', JSON.stringify(daily)); }
function dailyState(){
  const today = todayKey();
  if (daily.last === today || daily.last > today) return { can: false, day: daily.streak || 1 };
  const next = (daily.last === yesterdayKey() && daily.streak < 7) ? daily.streak + 1 : 1;
  return { can: true, day: next };
}
function mergeDaily(remote){
  const r = parseDaily(typeof remote === 'string' ? remote : JSON.stringify(remote));
  if (r.last > daily.last){ daily = r; saveDaily(); }
}
function dailyRewardText(r){
  let s = r.c + ' ' + t('coinsWord');
  if (r.i){ const k = r.i.indexOf(':'); s += ' + ' + ti(r.i.slice(0, k), r.i.slice(k + 1)).n; }
  return s;
}
let dailyBusy = false;
async function claimDaily(){
  if (dailyBusy) return false;
  dailyBusy = true;
  try { return await claimDailyNow(); } finally { dailyBusy = false; }
}
async function claimDailyNow(){
  if (serverOffset === null && cloudReady() && ownDocChecked){
    await updatePresence();
    if (serverOffset !== null){ renderDaily(); }
  }
  if (serverOffset === null && cloudReady()){ showToast(t('dailyNeedNet')); return false; }
  const st = dailyState();
  if (!st.can) return false;
  const r = DAILY_REWARDS[st.day - 1];
  coins += r.c;
  if (r.i){
    if (owned.has(r.i)) coins += r.c;
    else { owned.add(r.i); saveOwned(); }
  }
  Store.set('coins', coins);
  daily = { last: todayKey(), streak: st.day };
  saveDaily();
  showToast(t('dailyGot').replace('{r}', dailyRewardText(r)));
  sfxCoin(); buzz(20);
  refreshShopState();
  renderDaily();
  cloudPushSoon();
  return true;
}
function refreshDailyBtn(){
  const st = dailyState();
  const b = document.getElementById('dailyBtn');
  const dot = document.getElementById('dailyDot');
  if (b) b.classList.toggle('can', st.can);
  if (dot) dot.classList.toggle('hidden', !st.can);
}
function renderDaily(){
  const st = dailyState();
  const grid = document.getElementById('dailyGrid');
  const sub = document.getElementById('dailySub');
  if (sub) sub.textContent = t('dailySub');
  if (grid){
    grid.innerHTML = '';
    DAILY_REWARDS.forEach((r, i) => {
      const d = i + 1;
      const done = st.can ? d < st.day : d <= st.day;
      const today = st.can && d === st.day;
      const el = document.createElement('div');
      el.className = 'dailyTile' + (d === 7 ? ' big' : '') + (done ? ' done' : '') + (today ? ' today' : '');
      const cometSvg = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 21 L13 11" stroke="#bfe0ff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><path d="M6 21 L14 13" stroke="#bfe0ff" stroke-width="1.6" stroke-linecap="round" opacity=".4"/><circle cx="16" cy="8" r="4.2" fill="#eaf6ff" stroke="#9fd0ff" stroke-width="1.4"/></svg>';
      el.innerHTML = '<span>' + escapeHtml(t('dailyDay').replace('{d}', d)) + '</span><span class="dIcon">' + (r.i ? cometSvg : '<i class="coinDot"></i>') + '</span><b>' + r.c + (r.i ? ' + ' + escapeHtml(ti('trail', 'comet').n) : '') + '</b>';
      grid.appendChild(el);
    });
  }
  const btn = document.getElementById('dailyClaimBtn');
  if (btn){ btn.textContent = st.can ? t('dailyClaim') : t('dailyTomorrow'); btn.disabled = !st.can; }
  refreshDailyBtn();
}
function openDaily(){
  renderDaily();
  document.getElementById('dailyModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeDaily(){ document.getElementById('dailyModal').classList.add('hidden'); sfxPopupClose(); }
function maybeAutoDaily(){
  if (dailyAutoShown || state !== STATE.MENU || !nickname) return;
  if (!dailyState().can) return;
  dailyAutoShown = true;
  setTimeout(() => {
    const how = document.getElementById('howToModal');
    if (state === STATE.MENU && (!how || how.classList.contains('hidden'))) openDaily();
    else dailyAutoShown = false;
  }, 700);
}
function refreshMenuHint(){
  const h = document.getElementById('menuHint');
  if (h) h.classList.add('hidden');
}

let nickname = Store.get('nick', '');

const BG_THEMES = {
  auto:   { label: 'Авто',      swatch: 'linear-gradient(135deg,#301238,#7a3f84,#123252)' },
  white:  { bg1: [246, 248, 255], bg2: [214, 226, 246], glow: 'rgba(255,255,255,.28)', swatch: '#eef2fb' },
  blue:   { bg1: [10, 38, 88],    bg2: [36, 108, 198],  glow: 'rgba(120,180,255,.26)', swatch: '#1f5fb0' },
  purple: { bg1: [38, 14, 68],    bg2: [108, 58, 158],  glow: 'rgba(190,140,255,.26)', swatch: '#6c3a9e' },
  pink:   { bg1: [68, 14, 44],    bg2: [188, 78, 148],  glow: 'rgba(255,160,210,.26)', swatch: '#c14f92' },
  green:  { bg1: [8, 38, 20],     bg2: [38, 118, 58],   glow: 'rgba(140,255,150,.22)', swatch: '#379a49' },
  night:  { bg1: [6, 6, 12],      bg2: [28, 28, 40],    glow: 'rgba(150,150,190,.18)', swatch: '#141420' }
};
const PLATFORM_THEMES = {
  auto:   { label: 'Авто', c1: '#8ce678', c2: '#4cb43f', c3: '#2f7d2a', swatch: '#4cb43f' },
  violet: { c1: '#c9a8ff', c2: '#8f5fe0', c3: '#5c3aa0', swatch: '#8f5fe0' },
  orange: { c1: '#ffcf7a', c2: '#f5934a', c3: '#b85f1e', swatch: '#f5934a' },
  pink:   { c1: '#ffb3d9', c2: '#e0629f', c3: '#a83f74', swatch: '#e0629f' },
  yellow: { c1: '#fff3a0', c2: '#f0c93e', c3: '#b8901c', swatch: '#f0c93e' },
  silver: { c1: '#f5f5f8', c2: '#c9c9d4', c3: '#8f8f99', swatch: '#c9c9d4' }
};
const UI_STYLES = ['classic', 'aero', 'neon', 'paper'];
const STYLE_BG = {
  aero:  { bg1: [18, 124, 222], bg2: [220, 246, 255], glow: 'rgba(255,255,255,.42)' },
  neon:  { bg1: [10, 2, 26],    bg2: [62, 8, 90],     glow: 'rgba(255,60,200,.32)' },
  paper: { bg1: [252, 250, 242], bg2: [247, 244, 232], glow: 'rgba(255,255,255,0)' }
};
let uiStyle = 'classic';
Store.set('uiStyle', 'classic');
function applyUiStyle(id){
  id = 'classic';
  uiStyle = id;
  Store.set('uiStyle', id);
  const cl = document.body && document.body.classList;
  if (cl){ UI_STYLES.forEach(x => cl.remove('st-' + x)); cl.add('st-' + id); }
  const row = document.getElementById('styleRow');
  if (row){
    row.innerHTML = '';
    for (const x of UI_STYLES){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'styleCard' + (x === uiStyle ? ' active' : '');
      b.dataset.style = x;
      b.innerHTML = '<span>' + escapeHtml(t('st_' + x)) + '</span>';
      b.addEventListener('click', () => { applyUiStyle(x); if (typeof bgCacheKey !== 'undefined') bgCacheKey = ''; if (typeof wakeScene === 'function') wakeScene(400); });
      row.appendChild(b);
    }
  }
}
let bgTheme = Store.get('bgTheme', 'auto');
if (!BG_THEMES[bgTheme]) bgTheme = 'auto';
let platformTheme = Store.get('platformTheme', 'auto');
if (!PLATFORM_THEMES[platformTheme]) platformTheme = 'auto';

const AVATAR_LIST = ['🐰','🐱','🦊','🐻','🐼','🐨','🐸','🐯','🦁','🐵','🐹','🐷','🐮','🐔','🐧','🦄','🐙','⭐'];
const isCustomAvatar = (v) => typeof v === 'string' && v.indexOf('data:image/') === 0;

const LINK_RE = /(https?:\/\/|www\.|t\.me|discord\.gg|[a-z0-9-]{2,}\.(ru|com|net|org|io|me|gg|xyz|su|site|online|link|ly|рф)(?![a-z]))/i;
function cleanText(str){
  return String(str || '').replace(/(.)\1{5,}/g, '$1$1$1$1');
}
function loadTimes(key){ try { const a = JSON.parse(Store.get(key, '[]')); return Array.isArray(a) ? a.filter(x => typeof x === 'number' && x <= Date.now() + 60000) : []; } catch (e) { return []; } }
const spamState = { times: loadTimes('spamTimes'), last: '', repeat: 0 };
function spamCheck(text){
  const now = Date.now();
  spamState.times = spamState.times.filter(x => now - x < 20000);
  if (spamState.times.length && now - spamState.times[spamState.times.length - 1] < 1200) return 'spamFast';
  if (spamState.times.length >= 6) return 'spamMany';
  if (LINK_RE.test(text)) return 'spamLink';
  const norm = String(text).toLowerCase().replace(/\s+/g, ' ');
  if (norm === spamState.last){ if (++spamState.repeat >= 2) return 'spamRepeat'; }
  else { spamState.last = norm; spamState.repeat = 0; }
  return '';
}
function spamCommit(){ spamState.times.push(Date.now()); spamState.times = spamState.times.slice(-10); Store.set('spamTimes', JSON.stringify(spamState.times)); }

let blockedSet = new Set(String(Store.get('blocked', '')).split(',').filter(Boolean));
function saveBlocked(){ Store.set('blocked', Array.from(blockedSet).join(',')); }
const isBlocked = (code) => !!code && blockedSet.has(code);

let myAvatarOk = Store.get('avatarOk', '0') === '1';
function shownAvatar(f, code){
  const v = f && f.avatar && f.avatar.stringValue;
  if (!v || !isValidAvatar(v)) return AVATAR_LIST[0];
  if (!isCustomAvatar(v)) return v;
  if (code && code === cloudCode) return v;
  if (typeof isStaff === 'function' && isStaff()) return v;
  return (f.avatarOk && f.avatarOk.booleanValue) ? v : AVATAR_LIST[0];
}
const isValidAvatar = (v) => AVATAR_LIST.indexOf(v) !== -1 || isCustomAvatar(v);
let avatar = Store.get('avatar', '🐰');
if (!isValidAvatar(avatar)) avatar = '🐰';

const FRAME_LIST = ['none', 'gold', 'neon', 'rainbow', 'fire', 'frost', 'orbit', 'ears', 'crown', 'hearts'];
const isValidFrame = (v) => FRAME_LIST.indexOf(v) !== -1;
let avatarFrame = Store.get('avatarFrame', 'none');
if (!isValidFrame(avatarFrame)) avatarFrame = 'none';

function avatarHtml(avatarVal, frameId, extraClass){
  const av = isValidAvatar(avatarVal) ? avatarVal : AVATAR_LIST[0];
  const fr = isValidFrame(frameId) ? frameId : 'none';
  const inner = isCustomAvatar(av) ? '<img src="' + av + '" alt="">' : escapeHtml(av);
  return '<span class="avFrame frame-' + fr + (extraClass ? ' ' + extraClass : '') + '"><span class="avInner">' + inner + '</span></span>';
}

function badgeStarPoints(cx, cy, R, r, n){
  const pts = [];
  for (let i = 0; i < n * 2; i++){
    const a = Math.PI * i / n - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

const BADGE_ICONS = {
  bubble: (b) => '<path d="M38 40 H90 Q98 40 98 48 V74 Q98 82 90 82 H62 L46 95 L50 82 H38 Q30 82 30 74 V48 Q30 40 38 40 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<circle cx="48" cy="61" r="5.5" fill="' + b.c2 + '"/><circle cx="64" cy="61" r="5.5" fill="' + b.c2 + '"/><circle cx="80" cy="61" r="5.5" fill="' + b.c2 + '"/>',
  check: () => '<path d="M41 66 L57 81 L88 48" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
  star: () => '<polygon points="' + badgeStarPoints(64, 67, 28, 13, 5) + '" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>',
  heart: () => '<path d="M64 90 C 42 76 34 62 40 50 C 46 38 60 40 64 50 C 68 40 82 38 88 50 C 94 62 86 76 64 90 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>',
  flame: (b) => '<path d="M64 34 C 70 46 84 54 84 72 C 84 86 74 94 64 94 C 54 94 44 86 44 73 C 44 63 50 57 54 50 C 57 57 59 61 62 63 C 65 55 63 44 64 34 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M64 62 C 68 70 74 74 74 81 C 74 88 69 91 64 91 C 59 91 54 88 54 81 C 54 76 58 73 60 69 C 62 73 63 74 64 75 Z" fill="' + b.c2 + '"/>',
  crown: () => '<path d="M40 80 L37 50 L53 63 L64 42 L75 63 L91 50 L88 80 Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><rect x="40" y="84" width="48" height="8" rx="4" fill="#fff"/>',
  gem: (b) => '<path d="M64 92 L38 60 L48 44 L80 44 L90 60 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' +
    '<path d="M40 60 H88 M56 45 L64 60 L72 45 M64 60 L64 88" fill="none" stroke="' + b.c2 + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>',
  bolt: () => '<path d="M71 34 L44 70 H62 L57 94 L84 56 H66 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>',
  paw: () => '<ellipse cx="64" cy="77" rx="16" ry="13" fill="#fff"/><circle cx="44" cy="61" r="7.5" fill="#fff"/><circle cx="56" cy="48" r="7.5" fill="#fff"/><circle cx="72" cy="48" r="7.5" fill="#fff"/><circle cx="84" cy="61" r="7.5" fill="#fff"/>',
  note: () => '<path d="M58 84 V45 L86 39 V77" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="50" cy="84" rx="10" ry="8" fill="#fff"/><ellipse cx="78" cy="77" rx="10" ry="8" fill="#fff"/>',
  moon: () => '<path d="M74 36 A 29 29 0 1 0 91 76 A 23 23 0 1 1 74 36 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="84" cy="46" r="3.5" fill="#fff"/><circle cx="92" cy="58" r="2.5" fill="#fff"/>',
  trophy: () => '<path d="M46 40 H82 V56 C 82 68 74 76 64 76 C 54 76 46 68 46 56 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M46 46 H39 C 39 58 44 62 50 62 M82 46 H89 C 89 58 84 62 78 62" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="59" y="74" width="10" height="11" fill="#fff"/><rect x="48" y="84" width="32" height="8" rx="4" fill="#fff"/>',
  shield: (b) => '<path d="M64 34 C 74 40 84 42 90 42 C 90 68 80 84 64 94 C 48 84 38 68 38 42 C 44 42 54 40 64 34 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M52 64 L61 73 L77 55" fill="none" stroke="' + b.c2 + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  sparkle: () => '<path d="M64 32 Q 68 60 96 64 Q 68 68 64 96 Q 60 68 32 64 Q 60 60 64 32 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>',
  leaf: (b) => '<path d="M42 88 C 40 60 58 40 90 38 C 90 70 72 88 42 88 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M47 83 C 58 70 70 58 82 46" fill="none" stroke="' + b.c2 + '" stroke-width="4" stroke-linecap="round"/>',
  snow: () => '<g stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M64 36 V92 M40 50 L88 78 M40 78 L88 50"/><path d="M56 41 L64 49 L72 41 M56 87 L64 79 L72 87" stroke-width="5"/></g>',
  code: () => '<g fill="none" stroke="#8affc1" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M50 48 L36 64 L50 80"/><path d="M78 48 L92 64 L78 80"/><path d="M70 42 L58 86"/></g>',
  carrot: (b) => '<path d="M77 53 C 71 44 58 46 54 55 L 44 90 C 43 94 47 96 50 93 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M58 62 L64 64 M54 74 L60 76" stroke="' + b.c2 + '" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="75" cy="40" rx="5" ry="11" transform="rotate(25 75 40)" fill="#fff"/><ellipse cx="86" cy="48" rx="5" ry="11" transform="rotate(70 86 48)" fill="#fff"/>',
  bunny: (b) => '<ellipse cx="53" cy="44" rx="7" ry="16" fill="#fff"/><ellipse cx="75" cy="44" rx="7" ry="16" fill="#fff"/><circle cx="64" cy="72" r="21" fill="#fff"/>' +
    '<circle cx="56" cy="70" r="3.2" fill="' + b.c2 + '"/><circle cx="72" cy="70" r="3.2" fill="' + b.c2 + '"/><path d="M60 79 Q 64 83 68 79" fill="none" stroke="' + b.c2 + '" stroke-width="2.5" stroke-linecap="round"/>'
};
