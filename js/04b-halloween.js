"use strict";
// ---------- Хэллоуин: «Ночь тыкв» ----------
// Работает с 1 октября по 3 ноября включительно. Для проверки можно открыть игру с #hw в адресе.
const HW_ON = (() => {
  try { if (location.hash === '#hw') return true; } catch (e) {}
  const d = new Date(), m = d.getMonth();
  return m === 9 || (m === 10 && d.getDate() <= 3);
})();
const HW_YEAR = new Date().getFullYear();

const HW_REWARDS = [
  { id: 'c300',  need: 30,  coins: 300 },
  { id: 'witch', need: 80,  item: 'hat:witch' },
  { id: 'vamp',  need: 160, item: 'acc:vampire' },
  { id: 'pump',  need: 300, item: 'hat:pumpkin' },
  { id: 'c1500', need: 500, coins: 1500 }
];
const HW_ITEMS = ['hat:witch', 'acc:vampire', 'hat:pumpkin'];

let hwCandies = parseInt(Store.get('hwCandies', '0'), 10) || 0;
let hwGot = String(Store.get('hwGot', '') || '').split(',').filter(Boolean);
let hwRunCandies = 0;
let hwPulse = 0;
const hwOnMap = [];

function hwSave(){
  Store.set('hwCandies', String(hwCandies));
  Store.set('hwGot', hwGot.join(','));
}

function hwDaysLeft(){
  const end = new Date(HW_YEAR, 10, 4, 0, 0, 0).getTime();
  return Math.max(1, Math.ceil((end - Date.now()) / 86400000));
}

function hwNextReward(){
  for (const r of HW_REWARDS) if (!hwGot.includes(r.id)) return r;
  return null;
}

function hwRewardName(r){
  if (r.coins) return t('hwCoins').replace('{n}', r.coins);
  const [slot, val] = r.item.split(':');
  return ti(slot, val).n;
}

function hwCheckRewards(inRun){
  let changed = false, gotItem = false;
  for (const r of HW_REWARDS){
    if (hwCandies < r.need || hwGot.includes(r.id)) continue;
    hwGot.push(r.id);
    changed = true;
    if (r.coins){
      coins += r.coins;
      Store.set('coins', coins);
      if (typeof coinPulse !== 'undefined') coinPulse = 1;
    }
    if (r.item){ owned.add(r.item); gotItem = true; }
    const msg = t('hwGot').replace('{r}', hwRewardName(r));
    if (inRun && typeof addToast === 'function' && typeof hero !== 'undefined') addToast(msg, VW / 2, hero.y - 110, '#ffb35c');
    showToast(msg, () => hwOpen());
  }
  if (!changed) return;
  if (gotItem){
    saveOwned();
    if (typeof buildShop === 'function') buildShop();
  }
  hwSave();
  if (typeof refreshShopState === 'function') refreshShopState();
  if (typeof cloudPushSoon === 'function') cloudPushSoon();
}

function hwAddCandies(n, x, y){
  hwCandies += n;
  hwRunCandies += n;
  hwPulse = 1;
  hwSave();
  if (typeof burstSpark === 'function'){
    burstSpark(x, y, '#ff9a3c', 12, 0.8);
    burstSpark(x, y, '#c08bff', 7, 0.5);
  }
  if (typeof addToast === 'function') addToast('+' + n, x + 14, y - 18, '#ffb35c');
  if (typeof sfxCoin === 'function') sfxCoin();
  hwCheckRewards(true);
}

// синхронизация с облаком: конфеты берём максимум, награды и ивентовые вещи объединяем
function hwCloudFields(){
  return {
    hwCandies: { integerValue: String(hwCandies) },
    hwGot: { stringValue: hwGot.join(',') }
  };
}
function hwMergeCloud(f){
  if (!f) return;
  let changed = false;
  const rc = parseInt((f.hwCandies && f.hwCandies.integerValue) || '0', 10) || 0;
  if (rc > hwCandies){ hwCandies = rc; changed = true; }
  const rg = String((f.hwGot && f.hwGot.stringValue) || '').split(',').filter(Boolean);
  for (const id of rg) if (!hwGot.includes(id)){ hwGot.push(id); changed = true; }
  let ownChanged = false;
  if (f.owned && f.owned.arrayValue && Array.isArray(f.owned.arrayValue.values)){
    for (const v of f.owned.arrayValue.values){
      const s = v && v.stringValue;
      if (s && HW_ITEMS.includes(s) && !owned.has(s)){ owned.add(s); ownChanged = true; }
    }
  }
  if (ownChanged){ saveOwned(); if (typeof buildShop === 'function') buildShop(); }
  if (changed){ hwSave(); hwCheckRewards(false); }
  if (changed || ownChanged){
    if (typeof refreshShopState === 'function') refreshShopState();
    hwRefreshCard();
  }
}

// ---------- в забеге ----------
function hwResetRun(){
  hwOnMap.length = 0;
  hwRunCandies = 0;
  hwPulse = 0;
}

function hwOnPlatform(p, coinAdded){
  if (!HW_ON) return;
  if (p.type === 'normal' && !p.spring && Math.random() < 0.13) p.hwDeco = Math.random() < 0.62 ? 1 : 2;
  if (coinAdded || p.spring || p.type === 'broken' || p.type === 'blink' || p.type === 'tele') return;
  const r = Math.random();
  if (r < 0.012) hwOnMap.push({ plat: p, x: p.x + p.w / 2, y: p.y - 30, v: 5, kind: 3, bob: Math.random() * 6.28, got: 0, spin: 0 });
  else if (r < 0.115) hwOnMap.push({ plat: p, x: p.x + p.w / 2, y: p.y - 28, v: 1, kind: (Math.random() * 3) | 0, bob: Math.random() * 6.28, got: 0, spin: Math.random() * 6.28 });
}

function hwUpdate(dt){
  if (!HW_ON) return;
  hwPulse = Math.max(0, hwPulse - dt * 3);
  for (let i = hwOnMap.length - 1; i >= 0; i--){
    const c = hwOnMap[i];
    c.bob += dt * 2.6;
    c.spin += dt * 1.8;
    if (c.plat){
      if (c.plat.broken) c.plat = null;
      else { c.x = c.plat.x + c.plat.w / 2; c.y = c.plat.y - (c.kind === 3 ? 30 : 28); }
    }
    if (c.got > 0){
      c.got += dt * 3.4;
      if (c.got > 1) hwOnMap.splice(i, 1);
      continue;
    }
    if (typeof hasMagnet === 'function' && hasMagnet()){
      const R = (typeof hasFruit === 'function' && hasFruit('magnet')) ? 240 : 160;
      const mdx = hero.x - c.x, mdy = hero.y - c.y, md2 = mdx * mdx + mdy * mdy;
      if (md2 < R * R){
        c.plat = null;
        const md = Math.sqrt(md2) || 1;
        c.x += (mdx / md) * 340 * dt; c.y += (mdy / md) * 340 * dt;
      }
    }
    const dx = c.x - hero.x, dy = (c.y + Math.sin(c.bob) * 4) - hero.y;
    if (dx * dx + dy * dy < 32 * 32){
      c.got = 0.01;
      hwAddCandies(c.v, c.x, c.y);
      continue;
    }
    if (c.y - camY > VH + 80) hwOnMap.splice(i, 1);
  }
}

const HW_CANDY_COLS = [['#ff8a2a', '#ffd08a'], ['#9b5cff', '#e2ccff'], ['#5fd36a', '#d6ffc4']];

function hwPaintCandy(g, kind, s){
  const [a, b] = HW_CANDY_COLS[kind] || HW_CANDY_COLS[0];
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(40,12,30,.55)';
  g.lineWidth = 1.4 * s;
  g.fillStyle = a;
  for (const sd of [-1, 1]){
    g.beginPath();
    g.moveTo(sd * 7 * s, 0);
    g.lineTo(sd * 15 * s, -6 * s);
    g.lineTo(sd * 13 * s, 0);
    g.lineTo(sd * 15 * s, 6 * s);
    g.closePath(); g.fill(); g.stroke();
  }
  g.beginPath(); g.ellipse(0, 0, 9 * s, 7 * s, 0, 0, 6.2832); g.fill(); g.stroke();
  g.save();
  g.beginPath(); g.ellipse(0, 0, 9 * s, 7 * s, 0, 0, 6.2832); g.clip();
  g.fillStyle = b;
  for (let k = -2; k <= 2; k++){
    g.beginPath();
    g.moveTo(k * 6 * s - 3 * s, -8 * s); g.lineTo(k * 6 * s, -8 * s); g.lineTo(k * 6 * s + 4 * s, 8 * s); g.lineTo(k * 6 * s + 1 * s, 8 * s);
    g.closePath(); g.fill();
  }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.beginPath(); g.ellipse(-3 * s, -3 * s, 3 * s, 1.6 * s, -0.4, 0, 6.2832); g.fill();
}

function hwPaintPumpkin(g, R, t, face, white){
  g.lineJoin = 'round';
  g.strokeStyle = white ? 'rgba(255,255,255,.9)' : 'rgba(70,20,0,.6)';
  g.lineWidth = Math.max(1.2, R * 0.09);
  const cols = white ? ['#ffffff', '#ffffff', '#ffffff'] : ['#e8661a', '#ff8a2a', '#f47820'];
  const lobes = [[-0.55, 0.62], [0.55, 0.62], [0, 0.72]];
  lobes.forEach(([ox, rw], i) => {
    g.fillStyle = cols[i];
    g.beginPath(); g.ellipse(ox * R, 0, rw * R, R * 0.86, 0, 0, 6.2832); g.fill(); g.stroke();
  });
  g.fillStyle = white ? '#ffffff' : '#4f7a2a';
  g.beginPath();
  g.moveTo(-R * 0.1, -R * 0.78); g.lineTo(R * 0.12, -R * 0.8); g.lineTo(R * 0.2, -R * 1.12); g.lineTo(R * 0.02, -R * 1.1);
  g.closePath(); g.fill(); g.stroke();
  if (!face) return;
  const glow = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
  g.fillStyle = 'rgba(255,' + Math.round(200 + 40 * glow) + ',80,' + (0.85 + 0.15 * glow) + ')';
  g.beginPath(); g.moveTo(-R * 0.48, -R * 0.08); g.lineTo(-R * 0.3, -R * 0.42); g.lineTo(-R * 0.12, -R * 0.08); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(R * 0.12, -R * 0.08); g.lineTo(R * 0.3, -R * 0.42); g.lineTo(R * 0.48, -R * 0.08); g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(-R * 0.55, R * 0.18);
  const tz = [[-0.38, 0.34], [-0.25, 0.22], [-0.1, 0.4], [0.05, 0.24], [0.2, 0.4], [0.34, 0.22], [0.55, 0.18]];
  for (const [a, b] of tz) g.lineTo(a * R, b * R);
  g.quadraticCurveTo(0, R * 0.75, -R * 0.55, R * 0.18);
  g.fill();
}

function hwDrawCandies(){
  if (!HW_ON || !hwOnMap.length) return;
  const tt = performance.now() / 1000;
  for (const c of hwOnMap){
    const y = c.y - camY + Math.sin(c.bob) * 4;
    if (y < -50 || y > VH + 50) continue;
    const grab = c.got > 0 ? c.got : 0;
    ctx.save();
    ctx.globalAlpha = 1 - grab;
    ctx.translate(c.x, y - grab * 34);
    if (grab > 0) ctx.scale(1 + grab * 1.4, 1 + grab * 1.4);
    if (!lowGfx()){
      const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, c.kind === 3 ? 30 : 22);
      gl.addColorStop(0, c.kind === 3 ? 'rgba(255,170,60,.55)' : 'rgba(255,200,120,.35)');
      gl.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, c.kind === 3 ? 30 : 22, 0, 6.2832); ctx.fill();
    }
    if (c.kind === 3) hwPaintPumpkin(ctx, 13, tt, true);
    else { ctx.rotate(Math.sin(c.spin) * 0.35); hwPaintCandy(ctx, c.kind, 1); }
    ctx.restore();
  }
}

function hwDrawPlatDecor(){
  if (!HW_ON) return;
  const tt = performance.now() / 1000;
  for (const p of platforms){
    if (!p.hwDeco || p.broken) continue;
    const y = p.y - camY;
    if (y < -40 || y > VH + 40) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha == null ? 1 : p.alpha;
    if (p.hwDeco === 1){
      ctx.translate(p.x + p.w - 13, y - 6);
      hwPaintPumpkin(ctx, 7.5, tt + p.x, true);
    } else {
      ctx.translate(p.x + 3, y + p.h - 1);
      ctx.strokeStyle = 'rgba(240,235,255,.7)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++){
        const a = Math.PI * 0.5 + k * 0.32;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * -22, Math.sin(a) * 22); ctx.stroke();
      }
      for (let ring = 1; ring <= 3; ring++){
        ctx.beginPath();
        for (let k = 0; k < 4; k++){
          const a = Math.PI * 0.5 + k * 0.32, rr2 = ring * 6.5;
          const x = Math.cos(a) * -rr2, yy = Math.sin(a) * rr2;
          if (k === 0) ctx.moveTo(x, yy); else ctx.quadraticCurveTo(x * 0.8 + 1, yy * 0.8, x, yy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#1d1633';
      const sy = 16 + Math.sin(tt * 2 + p.x) * 4;
      ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-14, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(-14, sy + 2.5, 3, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
}

// ночное небо поверх фона мира
const hwBats = [0, 1, 2].map(i => ({ ph: i * 2.3, sp: 0.06 + i * 0.025, y: 0.18 + i * 0.13 }));
function hwDrawSky(){
  if (!HW_ON) return;
  const tt = performance.now() / 1000;
  ctx.save();
  const tint = ctx.createLinearGradient(0, 0, 0, VH);
  tint.addColorStop(0, 'rgba(46,14,92,.42)');
  tint.addColorStop(0.55, 'rgba(46,14,92,.12)');
  tint.addColorStop(1, 'rgba(255,110,30,.14)');
  ctx.fillStyle = tint; ctx.fillRect(0, 0, VW, VH);

  if (worldIndex() !== 0){
    const mx = VW * 0.78, my = 104, mr = 30;
    if (!lowGfx()){
      const mg = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3);
      mg.addColorStop(0, 'rgba(255,214,140,.38)'); mg.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = '#ffe2a6';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(214,160,90,.35)';
    ctx.beginPath(); ctx.arc(mx - 9, my - 6, 6, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 8, my + 9, 4.5, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 11, my - 10, 3, 0, 6.2832); ctx.fill();
  }

  if (!lowGfx()){
    for (let i = 0; i < 4; i++){
      const span = VH + 220;
      let y = ((i * 260 - camY * 0.12) % span + span) % span - 110;
      const x = [VW * 0.12, VW * 0.88, VW * 0.3, VW * 0.66][i] + Math.sin(tt * 0.6 + i) * 10;
      ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(x, y); ctx.rotate(Math.sin(tt * 0.8 + i) * 0.12);
      hwPaintPumpkin(ctx, 11, tt + i, true);
      ctx.restore();
    }
    for (const b of hwBats){
      const k = ((tt * b.sp + b.ph) % 1.3) - 0.15;
      if (k < -0.1 || k > 1.1) continue;
      const x = k * (VW + 80) - 40, y = VH * b.y + Math.sin(tt * 2.2 + b.ph) * 18;
      const f = Math.sin(tt * 16 + b.ph);
      ctx.fillStyle = 'rgba(24,10,40,.85)';
      ctx.save(); ctx.translate(x, y);
      for (const sd of [-1, 1]){
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sd * 8, -8 - f * 6, sd * 18, -4 - f * 9);
        ctx.quadraticCurveTo(sd * 13, -1, sd * 11, 3);
        ctx.quadraticCurveTo(sd * 6, 0, 0, 3);
        ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(0, 1, 3.6, 4.5, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function hwDrawHud(){
  if (!HW_ON) return;
  ctx.save();
  const s = 1 + hwPulse * 0.25;
  ctx.translate(30, 84);
  ctx.save(); ctx.scale(s * 0.95, s * 0.95); hwPaintCandy(ctx, 0, 1); ctx.restore();
  ctx.font = '19px ' + GAME_FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = 'rgba(21,10,43,.6)';
  ctx.fillStyle = '#ffb35c';
  ctx.strokeText(String(hwCandies), 20, 1);
  ctx.fillText(String(hwCandies), 20, 1);
  ctx.restore();
}

// тыквенный король вместо короля сумерек
function hwPumpkinBoss(g, r, tt, look, hurt){
  g.save();
  const flashW = hurt > 0.5;
  const flap = Math.sin(tt * 3.2);
  for (const sd of [-1, 1]){
    g.save(); g.scale(sd, 1); g.translate(r * 0.7, -r * 0.1); g.rotate(-0.2 - flap * 0.3);
    g.fillStyle = flashW ? '#ffffff' : '#2b1840';
    g.strokeStyle = 'rgba(10,0,20,.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0);
    g.quadraticCurveTo(r * 0.7, -r * 0.9, r * 1.6, -r * 0.6);
    g.quadraticCurveTo(r * 1.35, -r * 0.2, r * 1.45, r * 0.15);
    g.quadraticCurveTo(r * 1.1, -r * 0.05, r * 0.95, r * 0.35);
    g.quadraticCurveTo(r * 0.7, r * 0.05, r * 0.45, r * 0.45);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  g.save();
  g.translate(look * r * 0.05, Math.sin(tt * 2.4) * 2);
  hwPaintPumpkin(g, r * 0.95, tt, !flashW, flashW);
  g.restore();
  g.fillStyle = '#ffd34d'; g.strokeStyle = 'rgba(120,70,0,.6)'; g.lineWidth = 2;
  g.beginPath();
  const cy = -r * 0.95;
  g.moveTo(-r * 0.4, cy); g.lineTo(-r * 0.45, cy - r * 0.35); g.lineTo(-r * 0.2, cy - r * 0.15); g.lineTo(0, cy - r * 0.42);
  g.lineTo(r * 0.2, cy - r * 0.15); g.lineTo(r * 0.45, cy - r * 0.35); g.lineTo(r * 0.4, cy);
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}

// ---------- меню ----------
function hwRefreshCard(){
  const card = document.getElementById('hwCard');
  if (!card) return;
  card.classList.toggle('hidden', !HW_ON);
  if (!HW_ON) return;
  document.getElementById('hwCardTitle').textContent = t('hwTitle');
  document.getElementById('hwCardDays').textContent = t('hwDays').replace('{d}', hwDaysLeft());
  document.getElementById('hwCardCount').textContent = String(hwCandies);
  document.getElementById('hwCardWord').textContent = t('hwCandyWord');
  const nx = hwNextReward();
  document.getElementById('hwCardNext').textContent = nx ? t('hwNext').replace('{n}', Math.max(0, nx.need - hwCandies)).replace('{r}', hwRewardName(nx)) : t('hwAllDone');
}

function hwOpen(){
  const m = document.getElementById('hwModal');
  if (!m) return;
  hwRenderModal();
  m.classList.remove('hidden');
  if (typeof sfxPopupOpen === 'function') sfxPopupOpen();
}
function hwClose(){
  const m = document.getElementById('hwModal');
  if (m) m.classList.add('hidden');
  if (typeof sfxPopupClose === 'function') sfxPopupClose();
  hwRefreshCard();
}

function hwRenderModal(){
  document.getElementById('hwSub').textContent = t('hwSub').replace('{d}', hwDaysLeft());
  document.getElementById('hwHave').textContent = t('hwHave').replace('{n}', hwCandies);
  const list = document.getElementById('hwList');
  list.innerHTML = '';
  for (const r of HW_REWARDS){
    const row = document.createElement('div');
    const done = hwGot.includes(r.id);
    row.className = 'hwRow' + (done ? ' done' : '');
    const cv = document.createElement('canvas');
    cv.width = 112; cv.height = 112; cv.className = 'hwIcon';
    const g = cv.getContext('2d');
    if (r.coins){
      g.translate(56, 58);
      g.fillStyle = '#e09a10'; g.beginPath(); g.arc(0, 3, 26, 0, 6.2832); g.fill();
      g.fillStyle = '#ffc42e'; g.beginPath(); g.arc(0, 0, 26, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 16, 0, 6.2832); g.stroke();
    } else if (typeof renderChipIcon === 'function'){
      const [slot, val] = r.item.split(':');
      try { renderChipIcon(cv, slot, val); } catch (e) {}
    }
    const info = document.createElement('div');
    info.className = 'hwInfo';
    const nm = document.createElement('b');
    nm.textContent = hwRewardName(r);
    const st = document.createElement('span');
    st.textContent = done ? t('hwDone') : t('hwLeft').replace('{n}', Math.max(0, r.need - hwCandies));
    const bar = document.createElement('div');
    bar.className = 'hwBar';
    const fill = document.createElement('i');
    fill.style.width = Math.min(100, Math.round(hwCandies / r.need * 100)) + '%';
    bar.appendChild(fill);
    info.append(nm, st, bar);
    const need = document.createElement('div');
    need.className = 'hwNeed';
    need.textContent = String(r.need);
    row.append(cv, info, need);
    list.appendChild(row);
  }
}

function hwMenuEnter(){
  hwRefreshCard();
  if (!HW_ON) return;
  const key = 'hwSeen' + HW_YEAR;
  if (Store.get(key, '') === '1') return;
  Store.set(key, '1');
  setTimeout(() => showToast(t('hwStart'), () => hwOpen()), 900);
}

(function hwInitUi(){
  const card = document.getElementById('hwCard');
  if (card) card.addEventListener('click', hwOpen);
  const cl = document.getElementById('hwClose');
  if (cl) cl.addEventListener('click', hwClose);
  if (HW_ON) document.documentElement.classList.add('hw');
  if (HW_ON) hwCheckRewards(false);
  hwRefreshCard();
})();

// полное восстановление аккаунта на новом устройстве: берём значения из облака как есть
function hwRestoreCloud(f){
  hwCandies = parseInt((f && f.hwCandies && f.hwCandies.integerValue) || '0', 10) || 0;
  hwGot = String((f && f.hwGot && f.hwGot.stringValue) || '').split(',').filter(Boolean);
  hwSave();
  hwRefreshCard();
}
