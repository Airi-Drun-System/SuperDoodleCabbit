"use strict";
function paintFruit(g, x, y, r, id, tm){
  const f = FRUITS[id];
  if (!f) return;
  const T = tm || 0;
  g.save();
  g.translate(x, y);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const topY = id === 'star' ? -r * 1.05 : id === 'ice' ? -r * 1.05 : id === 'magnet' ? -r * 0.62 : id === 'cloud' ? -r * 0.82 : -r * 0.95;
  g.strokeStyle = '#5a3a1a';
  g.lineWidth = Math.max(1.5, r * 0.13);
  g.beginPath();
  g.moveTo(0, topY + r * 0.1);
  g.quadraticCurveTo(r * 0.05, topY - r * 0.3, r * 0.22, topY - r * 0.42);
  g.stroke();
  const leaf = id === 'ice' ? '#bfeaff' : id === 'star' ? '#7ad84a' : id === 'cloud' ? '#9fd6ff' : '#56c75a';
  g.fillStyle = leaf;
  g.beginPath();
  g.ellipse(r * 0.44, topY - r * 0.24, r * 0.36, r * 0.16, -0.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(43,34,56,.7)';
  g.lineWidth = Math.max(1, r * 0.07);
  g.stroke();
  if (id === 'ice' || id === 'spring'){
    g.fillStyle = id === 'ice' ? '#e2fbff' : '#8ae06a';
    g.beginPath();
    g.ellipse(-r * 0.3, topY - r * 0.16, r * 0.26, r * 0.12, 0.6, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  g.strokeStyle = 'rgba(43,34,56,.88)';
  g.lineWidth = Math.max(3, r * 0.22);
  fruitShape(g, r, id);
  g.stroke();
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
  gr.addColorStop(0, f.c1);
  gr.addColorStop(1, f.c2);
  g.fillStyle = gr;
  fruitShape(g, r, id);
  g.fill();

  g.save();
  fruitShape(g, r, id);
  g.clip();
  const a0 = g.globalAlpha;
  g.strokeStyle = f.sw;
  g.fillStyle = f.sw;
  g.lineWidth = Math.max(1.2, r * 0.14);
  if (id === 'spring'){
    g.globalAlpha = a0 * 0.55;
    for (let k = -2; k <= 2; k++){
      const yy = k * r * 0.38 + Math.sin(T * 3) * r * 0.05;
      g.beginPath();
      g.moveTo(-r, yy + r * 0.12);
      g.bezierCurveTo(-r * 0.4, yy - r * 0.2, r * 0.4, yy + r * 0.3, r, yy - r * 0.08);
      g.stroke();
    }
  } else if (id === 'cloud'){
    g.globalAlpha = a0 * 0.35;
    g.fillStyle = '#6f96e8';
    g.beginPath(); g.ellipse(0, r * 0.75, r * 1.1, r * 0.4, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = a0 * 0.9;
    g.fillStyle = '#ffffff';
    for (const [cx, cy, cr] of [[-0.3, -0.35, 0.28], [0.25, -0.3, 0.2], [-0.55, 0.05, 0.16]]){
      g.beginPath(); g.arc(cx * r, cy * r, cr * r, 0, Math.PI * 2); g.fill();
    }
  } else if (id === 'ice'){
    g.globalAlpha = a0 * 0.55;
    g.lineWidth = Math.max(1, r * 0.08);
    g.beginPath();
    for (let i = 0; i < 6; i++){
      const a = -Math.PI / 2 + i * Math.PI / 3;
      g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
    }
    g.stroke();
    g.globalAlpha = a0 * 0.5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 0.95, -r * 0.5); g.lineTo(0, -r * 1.1); g.closePath(); g.fill();
    const sp = (Math.sin(T * 2.4) + 1) / 2;
    g.globalAlpha = a0 * sp;
    g.fillStyle = '#ffffff';
    const qx = r * 0.36, qy = r * 0.34, qs = r * 0.1;
    g.beginPath();
    g.moveTo(qx, qy - qs * 2); g.quadraticCurveTo(qx, qy, qx + qs * 2, qy); g.quadraticCurveTo(qx, qy, qx, qy + qs * 2); g.quadraticCurveTo(qx, qy, qx - qs * 2, qy); g.quadraticCurveTo(qx, qy, qx, qy - qs * 2);
    g.fill();
  } else if (id === 'magnet'){
    g.globalAlpha = a0 * 0.8;
    g.lineWidth = Math.max(2, r * 0.3);
    g.strokeStyle = '#ffe6e6';
    g.beginPath();
    g.moveTo(-r * 0.45, -r * 0.3);
    g.lineTo(-r * 0.45, r * 0.12);
    g.arc(0, r * 0.12, r * 0.45, Math.PI, 0, true);
    g.lineTo(r * 0.45, -r * 0.3);
    g.stroke();
    g.fillStyle = '#e6ecf5';
    g.fillRect(-r * 0.62, -r * 0.5, r * 0.34, r * 0.24);
    g.fillRect(r * 0.28, -r * 0.5, r * 0.34, r * 0.24);
  } else if (id === 'portal'){
    g.globalAlpha = a0 * 0.6;
    for (let k = 0; k < 3; k++){
      g.beginPath();
      for (let i = 0; i <= 22; i++){
        const a = i / 22 * Math.PI * 2.1 + k * 2.09 + T * 1.6;
        const q = r * (0.12 + i / 22 * 0.85);
        const px = Math.cos(a) * q, py = Math.sin(a) * q;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.stroke();
    }
    g.globalAlpha = a0 * 0.9;
    g.fillStyle = '#2a0f5a';
    g.beginPath(); g.arc(0, 0, r * 0.18, 0, Math.PI * 2); g.fill();
  } else if (id === 'star'){
    g.globalAlpha = a0 * 0.55;
    g.lineWidth = Math.max(1, r * 0.09);
    g.beginPath();
    for (let i = 0; i < 5; i++){
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      g.moveTo(0, r * 0.06); g.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95 + r * 0.06);
    }
    g.stroke();
  }
  g.globalAlpha = a0;
  g.restore();

  g.fillStyle = 'rgba(255,255,255,.65)';
  g.beginPath();
  g.ellipse(-r * 0.36, -r * 0.4, r * 0.24, r * 0.12, -0.6, 0, Math.PI * 2);
  g.fill();
  if (f.rar >= 3){
    const tw = (Math.sin(T * 3.1) + 1) / 2;
    g.globalAlpha *= 0.4 + tw * 0.6;
    g.fillStyle = '#ffffff';
    const sx = r * 0.72, sy = -r * 0.62, s = r * (0.16 + tw * 0.12);
    g.beginPath();
    g.moveTo(sx, sy - s * 2); g.quadraticCurveTo(sx, sy, sx + s * 2, sy); g.quadraticCurveTo(sx, sy, sx, sy + s * 2); g.quadraticCurveTo(sx, sy, sx - s * 2, sy); g.quadraticCurveTo(sx, sy, sx, sy - s * 2);
    g.fill();
  }
  g.restore();
}
function fruitIconCanvas(id, size){
  const c = document.createElement('canvas');
  const k = 2;
  c.width = size * k; c.height = size * k;
  c.className = 'fruitIcon';
  c.style.width = size + 'px';
  c.style.height = size + 'px';
  try {
    const g = c.getContext('2d');
    g.scale(k, k);
    paintFruit(g, size / 2, size * 0.58, size * 0.34, id, 0);
  } catch (e) {}
  return c;
}

const fruitPickups = [];
const bolts = [];
let fruitSpawnedRun = 0;
let stormT = 0;
let starNext = 1000;
const STORM_EVERY = 6;
function maybeSpawnFruit(p){
  if (fruitSpawnedRun >= (weekEvent() === 'fruit' ? 2 : 1) || score < 400 || p.type !== 'normal' || p.spring) return;
  if (Math.random() < 0.0016){
    fruitSpawnedRun += 1;
    fruitPickups.push({ plat: p, x: p.x + p.w / 2, y: p.y - 36, id: rollFruit(), bob: 0, got: 0 });
  }
}
function resetFruitRun(){
  fruitPickups.length = 0;
  bolts.length = 0;
  fruitSpawnedRun = 0;
  stormT = 0;
  starNext = 1000;
}
function stormStrike(){
  let tx = null, ty = 0, kill = null, crawl = null, bd = 1e9;
  for (const m of monsters){
    if (m.frozen) continue;
    const sy = m.y - camY;
    if (sy < 0 || sy > VH) continue;
    const d = Math.abs(m.y - hero.y);
    if (d < bd){ bd = d; kill = m; crawl = null; tx = m.x; ty = m.y; }
  }
  for (const cr of crawlers){
    const sy = cr.y - camY;
    if (sy < 0 || sy > VH) continue;
    const d = Math.abs(cr.y - hero.y);
    if (d < bd){ bd = d; kill = null; crawl = cr; tx = cr.x; ty = cr.y; }
  }
  if (tx === null) return false;
  bolts.push({ x: tx, y: ty, life: 1, seed: Math.random() * 1000 });
  if (kill){ burstPixels(kill.x, kill.y, currentWorld().monster.burst); removeMonster(kill); }
  if (crawl){ const i = crawlers.indexOf(crawl); if (i >= 0) crawlers.splice(i, 1); burstPixels(tx, ty, ['#6be36b', '#2f8f2f', '#bff5a0']); }
  const bonus = Math.round(3 * coinMult());
  runCoins += bonus; coins += bonus;
  Store.set('coins', coins);
  coinPulse = 1;
  addToast('+' + bonus, tx + 20, ty - 30, '#fff27a');
  flash = Math.max(flash, 0.3); flashColor = '#fff7b0';
  shake = Math.max(shake, 6);
  ensureAudio();
  sweep(1800, 160, 0.28, 'sawtooth', 0.06);
  return true;
}
function updateFruits(dt){
  for (let i = fruitPickups.length - 1; i >= 0; i--){
    const fp = fruitPickups[i];
    fp.bob += dt * 2.2;
    if (fp.plat){
      if (fp.plat.broken) fp.plat = null;
      else { fp.x = fp.plat.x + fp.plat.w / 2; fp.y = fp.plat.y - 36; }
    }
    if (fp.got > 0){
      fp.got += dt * 3;
      if (fp.got > 1) fruitPickups.splice(i, 1);
      continue;
    }
    const dx = fp.x - hero.x, dy = fp.y + Math.sin(fp.bob) * 5 - hero.y;
    if (dx * dx + dy * dy < 36 * 36){
      fp.got = 0.01;
      addFruit(fp.id);
      burstSpark(fp.x, fp.y, FRUITS[fp.id].c1, 26, 1.3);
      burstSpark(fp.x, fp.y, '#ffffff', 12, 0.8);
      addToast(fruitName(fp.id), fp.x, fp.y - 40, RARITY_COL[FRUITS[fp.id].rar]);
      flash = Math.max(flash, 0.35); flashColor = FRUITS[fp.id].c1;
      ensureAudio();
      sfxFruit();
      if (typeof showToast === 'function') showToast(t('fruitGot').replace('{f}', fruitName(fp.id)));
      continue;
    }
    if (fp.y - camY > VH + 80) fruitPickups.splice(i, 1);
  }
  for (let i = bolts.length - 1; i >= 0; i--){
    bolts[i].life -= dt * 2.6;
    if (bolts[i].life <= 0) bolts.splice(i, 1);
  }
  if (hasFruit('storm')){
    stormT += dt;
    if (stormT >= STORM_EVERY){
      if (stormStrike()) stormT = 0;
      else stormT = STORM_EVERY;
    }
  }
  if (hasFruit('star') && score >= starNext){
    starNext = (Math.floor(score / 1000) + 1) * 1000;
    for (let k = 0; k < 14; k++){
      const a = k / 13;
      addCoin(clamp(hero.x + Math.sin(a * 6.2832) * 90, 24, VW - 24), hero.y - 120 - k * 38, null);
    }
    for (let k = 0; k < 10; k++) burstSpark(hero.x + rand(-90, 90), hero.y - rand(40, 220), pick(['#fff3b0', '#ffd34d', '#ffffff']), 6, 0.8);
    addToast(t('starShower'), hero.x, hero.y - 56, '#fff3b0');
    flash = Math.max(flash, 0.3); flashColor = '#fff3b0';
    sfxCoin();
  }
  if (hasFruit('cloud') && hero.vy > 60 && Math.random() < dt * 14) addParticle({ kind: 'puff', x: hero.x + rand(-12, 12), y: hero.y + hero.h * 0.45, vx: rand(-20, 20), vy: rand(10, 30), life: 1, decay: rand(1.8, 2.6), r: rand(6, 11), color: pick(['#ffffff', '#e8f0ff', '#dfe8ff']) });
}
function drawFruitPickups(){
  const tm = performance.now() / 1000;
  for (const fp of fruitPickups){
    const y = fp.y - camY + Math.sin(fp.bob) * 5;
    if (y < -60 || y > VH + 60) continue;
    const f = FRUITS[fp.id];
    const rc = RARITY_COL[f.rar];
    ctx.save();
    ctx.globalAlpha = fp.got > 0 ? Math.max(0, 1 - fp.got) : 1;
    const sc = fp.got > 0 ? 1 + fp.got * 0.8 : 1 + Math.sin(tm * 4) * 0.04;
    if (!lowGfx()){
      ctx.save();
      ctx.translate(fp.x, y);
      ctx.rotate(tm * 0.6);
      const rays = f.rar >= 3 ? 10 : 6;
      ctx.globalAlpha *= f.rar >= 3 ? 0.5 : 0.3;
      ctx.fillStyle = rc;
      ctx.beginPath();
      for (let i = 0; i < rays; i++){
        const a = i / rays * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 40 + (f.rar >= 3 ? 8 : 0), a - 0.12, a + 0.12);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
    const glow = ctx.createRadialGradient(fp.x, y, 2, fp.x, y, 36);
    glow.addColorStop(0, 'rgba(255,255,255,.6)');
    glow.addColorStop(0.5, rc + '55');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(fp.x, y, 36, 0, Math.PI * 2); ctx.fill();
    ctx.translate(fp.x, y);
    ctx.scale(sc, sc);
    paintFruit(ctx, 0, 0, 14, fp.id, tm);
    ctx.restore();
  }
}
function drawFruitAura(){
  if (!fruitState.eat || !FRUITS[fruitState.eat] || state !== STATE.PLAY || lowGfx()) return;
  const f = FRUITS[fruitState.eat];
  const tm = performance.now() / 1000;
  const hx = hero.x, hy = hero.y - camY;
  ctx.save();
  for (let i = 0; i < 3; i++){
    const a = tm * 2.2 + i * 2.094;
    const px = hx + Math.cos(a) * 30, py = hy + Math.sin(a) * 12 + 4;
    const front = Math.sin(a) > 0;
    ctx.globalAlpha = front ? 0.95 : 0.45;
    const r = front ? 3.4 : 2.4;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, f.c1);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawBolts(){
  for (const b of bolts){
    const y1 = b.y - camY;
    ctx.save();
    ctx.globalAlpha = clamp(b.life, 0, 1);
    ctx.strokeStyle = '#fff7b0';
    ctx.shadowColor = '#fff27a';
    ctx.shadowBlur = lowGfx() ? 0 : 14;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let x = b.x + Math.sin(b.seed) * 30, y = -10;
    ctx.moveTo(x, y);
    let k = 0;
    while (y < y1){
      y = Math.min(y1, y + 34);
      x = b.x + (y >= y1 ? 0 : Math.sin(b.seed + (++k) * 2.7) * 16);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }
}
function drawFruitHud(){
  if (!fruitState.eat || !FRUITS[fruitState.eat]) return;
  const f = FRUITS[fruitState.eat];
  const tm = performance.now() / 1000;
  const cx = VW - 28, cy = 70, R = 17;
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,40,.55)';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = RARITY_COL[f.rar];
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  if (fruitState.eat === 'star'){
    const k = clamp(1 - (starNext - score) / 1000, 0, 1);
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
  }
  paintFruit(ctx, cx, cy + 2, 9, fruitState.eat, tm);
  ctx.restore();
}

const WHEEL = [
  { k: 'c', v: 100, w: 22 },
  { k: 'f', r: 1, w: 18 },
  { k: 'c', v: 200, w: 20 },
  { k: 'f', r: 2, w: 9 },
  { k: 'c', v: 400, w: 16 },
  { k: 'f', r: 3, w: 4 },
  { k: 'c', v: 800, w: 8 },
  { k: 'f', r: 4, w: 1 },
  { k: 'c', v: 2000, w: 2 }
];
const WHEEL_PRICE = 400;
let wheelAngle = 0;
let wheelSpinning = false;
let wheelSkipNow = false;
let wheelSkipAnim = Store.get('wheelSkip', '0') === '1';
function wheelPickIndex(){
  const total = WHEEL.reduce((a, s) => a + s.w, 0);
  let x = Math.random() * total;
  for (let i = 0; i < WHEEL.length; i++){
    if (x < WHEEL[i].w) return i;
    x -= WHEEL[i].w;
  }
  return 0;
}
function drawWheel(){
  const c = document.getElementById('wheelCanvas');
  if (!c || !c.getContext) return;
  const g = c.getContext('2d');
  if (!g) return;
  const W = c.width, R = W / 2 - 8, cx = W / 2, cy = W / 2;
  const n = WHEEL.length, seg = Math.PI * 2 / n;
  g.clearRect(0, 0, W, W);
  g.save();
  g.translate(cx, cy);
  g.rotate(wheelAngle);
  for (let i = 0; i < n; i++){
    const s = WHEEL[i];
    const a0 = -Math.PI / 2 - seg / 2 + i * seg;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, a0, a0 + seg);
    g.closePath();
    g.fillStyle = s.k === 'f' ? RARITY_COL[s.r] : (i % 4 === 0 ? '#5b2d9e' : '#46207f');
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.35)';
    g.lineWidth = 3;
    g.stroke();
    g.save();
    g.rotate(a0 + seg / 2 + Math.PI / 2);
    if (s.k === 'f'){
      paintFruit(g, 0, -R * 0.66, R * 0.12, fruitsOfRarity(s.r)[0], 0);
      g.fillStyle = '#2b2238';
      g.font = 'bold ' + Math.round(R * 0.075) + 'px ' + GAME_FONT;
      g.textAlign = 'center';
      g.fillText(rarityName(s.r), 0, -R * 0.4);
    } else {
      g.fillStyle = '#ffd34d';
      g.beginPath(); g.arc(0, -R * 0.7, R * 0.07, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#b8860b'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#fdf6e8';
      g.font = 'bold ' + Math.round(R * 0.11) + 'px ' + GAME_FONT;
      g.textAlign = 'center';
      g.fillText(String(s.v), 0, -R * 0.46);
    }
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  g.lineWidth = 10;
  g.strokeStyle = '#ffd34d';
  g.stroke();
  g.restore();
  g.beginPath();
  g.arc(cx, cy, R * 0.13, 0, Math.PI * 2);
  g.fillStyle = '#ffd34d';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = '#8a5f00';
  g.stroke();
}
function refreshWheelBtn(){
  const b = document.getElementById('wheelBtn');
  if (!b) return;
  b.textContent = wheelSpinning ? t('wheelSkipNow') : t('wheelSpin').replace('{p}', WHEEL_PRICE);
  b.classList.toggle('cant', !wheelSpinning && coins < WHEEL_PRICE);
  for (const n of [5, 10]){
    const m = document.getElementById('wheelBtn' + n);
    if (!m) continue;
    m.textContent = t('wheelSpinN').replace('{n}', n).replace('{p}', WHEEL_PRICE * n);
    m.disabled = wheelSpinning;
    m.classList.toggle('cant', coins < WHEEL_PRICE * n);
  }
  const sk = document.getElementById('wheelSkipBtn');
  if (sk){ sk.textContent = wheelSkipAnim ? t('wheelSkipOn') : t('wheelSkipOff'); sk.setAttribute('aria-pressed', String(wheelSkipAnim)); }
}
function toggleWheelSkip(){
  wheelSkipAnim = !wheelSkipAnim;
  Store.set('wheelSkip', wheelSkipAnim ? '1' : '0');
  refreshWheelBtn();
}
function spinWheel(times){
  if (wheelSpinning){ wheelSkipNow = true; return false; }
  const n = times === 5 || times === 10 ? times : 1;
  const cost = WHEEL_PRICE * n;
  const res = document.getElementById('wheelResult');
  if (coins < cost){
    if (res) res.textContent = t('passNoCoins').replace('{p}', cost);
    return false;
  }
  coins -= cost;
  noteSpent(cost);
  let idx = 0, coinsWon = 0, fruitWon = '';
  const got = {}, order = [];
  for (let i = 0; i < n; i++){
    idx = wheelPickIndex();
    const s = WHEEL[idx];
    if (s.k === 'c') coinsWon += s.v;
    else {
      const f = pick(fruitsOfRarity(s.r));
      addFruit(f);
      if (!fruitWon) fruitWon = f;
      if (!got[f]){ got[f] = 0; order.push(f); }
      got[f]++;
    }
  }
  coins += coinsWon;
  const parts = [];
  if (coinsWon) parts.push('+' + coinsWon + ' ' + t('coinsWord'));
  for (const f of order) parts.push(fruitName(f) + (n > 1 ? ' ×' + got[f] : ' · ' + rarityName(FRUITS[f].rar)));
  const prize = parts.join(' · ');
  Store.set('coins', coins);
  cloudPushSoon();
  if (typeof refreshShopState === 'function') refreshShopState();
  wheelSpinning = true;
  whoosh('pass', 0.8);
  wheelSkipNow = false;
  refreshWheelBtn();
  if (res) res.textContent = '';
  ensureAudio();
  const seg = Math.PI * 2 / WHEEL.length;
  const start = wheelAngle;
  const baseTurns = Math.PI * 2 * 5;
  const cur = ((start % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const want = ((-idx * seg) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  let delta = want - cur;
  if (delta < 0) delta += Math.PI * 2;
  const jitter = (Math.random() - 0.5) * seg * 0.6;
  const end = start + baseTurns + delta + jitter;
  const dur = 3800;
  const t0 = performance.now();
  let lastSeg = Math.floor(start / seg);
  const finish = () => {
    wheelAngle = end;
    drawWheel();
    wheelSpinning = false;
    refreshWheelBtn();
    if (res) res.innerHTML = '<b>' + escapeHtml(t('wheelWon')) + '</b> ' + escapeHtml(prize);
    if (fruitWon){ for (let i = order.length - 1; i >= 0; i--) burstUiFruit(order[i]); sfxWin(); }
    else sfxCoin();
    buzz(30);
    renderFruitsScreen(true);
  };
  if (wheelSkipAnim){ finish(); return { idx, prize, fruit: fruitWon, fruits: got, coinsWon }; }
  const step = (now) => {
    if (!wheelSpinning) return;
    const k = wheelSkipNow ? 1 : Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    wheelAngle = start + (end - start) * e;
    const sgi = Math.floor(wheelAngle / seg);
    if (sgi !== lastSeg){ lastSeg = sgi; sfxTick(); }
    drawWheel();
    if (k < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
  return { idx, prize, fruit: fruitWon, fruits: got, coinsWon };
}
function burstUiFruit(id){
  const box = document.getElementById('wheelResult');
  if (!box) return;
  const ic = fruitIconCanvas(id, 44);
  ic.classList.add('fruitPop');
  box.insertBefore(ic, box.firstChild);
}

function renderFruitsScreen(keepWheel){
  const eatBox = document.getElementById('fruitEaten');
  if (eatBox){
    eatBox.innerHTML = '';
    if (fruitState.eat){
      const id = fruitState.eat;
      eatBox.appendChild(fruitIconCanvas(id, 64));
      const info = document.createElement('div');
      info.className = 'fruitEatInfo';
      info.innerHTML = '<div class="fruitEatLabel">' + escapeHtml(t('fruitEatenNow')) + '</div><div class="fruitName" style="color:' + RARITY_COL[FRUITS[id].rar] + '">' + escapeHtml(fruitName(id)) + '</div><div class="fruitDesc">' + escapeHtml(fruitDesc(id)) + '</div>';
      eatBox.appendChild(info);
    } else {
      eatBox.innerHTML = '<div class="fruitEatInfo"><div class="fruitDesc">' + escapeHtml(t('fruitNone')) + '</div></div>';
    }
  }
  const inv = document.getElementById('fruitInv');
  if (inv){
    inv.innerHTML = '';
    for (const id of FRUIT_IDS){
      const f = FRUITS[id];
      const n = fruitCount(id);
      const card = document.createElement('div');
      card.className = 'fruitCard' + (n || fruitState.eat === id ? '' : ' empty') + (fruitState.eat === id ? ' eaten' : '');
      card.style.setProperty('--rc', RARITY_COL[f.rar]);
      card.appendChild(fruitIconCanvas(id, 46));
      const body = document.createElement('div');
      body.className = 'fruitCardBody';
      const eatenNow = fruitState.eat === id;
      body.innerHTML = '<div class="fruitName">' + escapeHtml(fruitName(id)) + (n ? ' <span class="fruitCnt">×' + n + '</span>' : '') + (eatenNow ? ' <span class="fruitTag">' + escapeHtml(t('fruitEatenTag')) + '</span>' : '') + '</div><div class="fruitRar">' + escapeHtml(rarityName(f.rar)) + '</div><div class="fruitDesc">' + escapeHtml(fruitDesc(id)) + '</div>' + (!n && !eatenNow ? '<div class="fruitWhere">' + escapeHtml(t('fruitWhere')) + '</div>' : '');
      card.appendChild(body);
      if (n){
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn fruitEatBtn';
        b.textContent = t('fruitEat');
        b.addEventListener('click', () => askEatFruit(id));
        card.appendChild(b);
      }
      inv.appendChild(card);
    }
  }
  const odds = document.getElementById('wheelOdds');
  if (odds){
    const total = WHEEL.reduce((a, s) => a + s.w, 0);
    odds.textContent = t('wheelOdds') + ' ' + WHEEL.map(s => (s.k === 'c' ? s.v : rarityName(s.r)) + ' ' + (Math.round(s.w / total * 1000) / 10) + '%').join(' · ');
  }
  refreshWheelBtn();
  if (!keepWheel || !wheelSpinning) drawWheel();
}
function askEatFruit(id){
  if (fruitCount(id) <= 0) return;
  if (eatFruit(id)){
    showToast(t('fruitAte').replace('{f}', fruitName(id)));
    sfxCoin();
    renderFruitsScreen(true);
  }
}
function openFruits(){
  const m = document.getElementById('fruitModal');
  if (!m) return;
  m.classList.remove('hidden');
  sfxPopupOpen();
  renderFruitsScreen();
  const full = m.querySelector ? m.querySelector('.passFull') : null;
  if (full) full.scrollTop = 0;
  settleTrades();
}
function closeFruits(){
  const m = document.getElementById('fruitModal');
  if (m) m.classList.add('hidden');
  sfxPopupClose();
  if (typeof refreshShopState === 'function') refreshShopState();
}

function loadTradeOpen(){
  try { const a = JSON.parse(Store.get('tradeOpen', '[]')); return Array.isArray(a) ? a.filter(x => x && x.conv && x.id && FRUITS[x.give] && FRUITS[x.want]) : []; } catch (e) { return []; }
}
function saveTradeOpen(list){ Store.set('tradeOpen', JSON.stringify(list.slice(-30))); }
let tradeGiveSel = '', tradeWantSel = '';
function openTradeModal(){
  if (!chatWithCode || friendStatusOf(chatWithCode) !== 'friend') return;
  tradeGiveSel = ''; tradeWantSel = '';
  renderTradeModal();
  document.getElementById('tradeModal').classList.remove('hidden');
  sfxPopupOpen();
}
function closeTradeModal(){
  document.getElementById('tradeModal').classList.add('hidden');
}
function renderTradeModal(){
  const give = document.getElementById('tradeGive');
  const want = document.getElementById('tradeWant');
  const send = document.getElementById('tradeSendBtn');
  const note = document.getElementById('tradeNote');
  const chip = (id, sel, onPick, cnt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tradeChip' + (sel === id ? ' sel' : '');
    b.style.setProperty('--rc', RARITY_COL[FRUITS[id].rar]);
    b.appendChild(fruitIconCanvas(id, 38));
    const s = document.createElement('span');
    s.textContent = fruitName(id) + (cnt ? ' ×' + cnt : '');
    b.appendChild(s);
    b.addEventListener('click', () => { onPick(id); renderTradeModal(); });
    return b;
  };
  if (give){
    give.innerHTML = '';
    const mine = FRUIT_IDS.filter(id => fruitCount(id) > 0);
    if (!mine.length) give.innerHTML = '<div class="fruitDesc">' + escapeHtml(t('tradeNoFruits')) + '</div>';
    for (const id of mine) give.appendChild(chip(id, tradeGiveSel, (v) => { tradeGiveSel = v; }, fruitCount(id)));
  }
  if (want){
    want.innerHTML = '';
    for (const id of FRUIT_IDS) want.appendChild(chip(id, tradeWantSel, (v) => { tradeWantSel = v; }, 0));
  }
  if (send) send.disabled = !(tradeGiveSel && tradeWantSel && tradeGiveSel !== tradeWantSel && fruitCount(tradeGiveSel) > 0);
  if (note) note.textContent = tradeGiveSel && tradeGiveSel === tradeWantSel ? t('tradeSame') : '';
}
async function sendTradeOffer(give, want){
  if (!chatWithCode || friendStatusOf(chatWithCode) !== 'friend') return false;
  if (!FRUITS[give] || !FRUITS[want] || give === want) return false;
  if (!cloudReady() || !nickname) return false;
  const spamKey = spamCheck('trade:' + give + want + Date.now());
  if (spamKey){ showToast(t(spamKey)); return false; }
  if (!takeFruit(give)) return false;
  spamCommit();
  const toCode = chatWithCode, toNick = chatWithNickName;
  const conv = chatConvId(cloudCode, toCode);
  const ts = Date.now();
  const fields = {
    from: { stringValue: cloudCode }, fromNick: { stringValue: nickname }, text: { stringValue: '' },
    ts: { integerValue: String(ts) }, read: { booleanValue: false },
    tradeGive: { stringValue: give }, tradeWant: { stringValue: want }, tradeSt: { stringValue: 'open' }
  };
  try {
    const res = await fetch(cloudBase() + '/conversations/' + conv + '/messages?key=' + CLOUD.apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
    });
    if (!res.ok){ addFruit(give); showToast(t('chatError')); return false; }
    const doc = await res.json();
    const id = docCode(doc);
    const list = loadTradeOpen();
    list.push({ conv, id, give, want });
    saveTradeOpen(list);
    updateConvMeta(conv, toCode, toNick, t('msgTrade'), ts);
    if (chatWithCode === toCode) fetchChatMessages();
    return true;
  } catch (e) {
    addFruit(give);
    showToast(t('chatError'));
    return false;
  }
}
async function tradeCas(conv, id, st){
  const url = cloudBase() + '/conversations/' + conv + '/messages/' + id;
  const r = await fetch(url + '?key=' + CLOUD.apiKey);
  if (!r.ok) return { ok: false, gone: r.status === 404 };
  const doc = await r.json();
  const f = (doc && doc.fields) || {};
  const cur = (f.tradeSt && f.tradeSt.stringValue) || '';
  if (cur !== 'open') return { ok: false, st: cur, f };
  const p = await fetch(url + '?updateMask.fieldPaths=tradeSt&updateMask.fieldPaths=tradeBy&currentDocument.updateTime=' + encodeURIComponent(doc.updateTime) + '&key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { tradeSt: { stringValue: st }, tradeBy: { stringValue: cloudCode } } })
  });
  return { ok: !!(p && p.ok), f };
}
let tradeBusy = false;
async function tradeAction(m, action){
  if (tradeBusy || !m || !m.id || !m.tradeGive) return false;
  if (!chatWithCode) return false;
  const conv = chatConvId(cloudCode, chatWithCode);
  const isOwn = m.from === cloudCode;
  if (action === 'accept' && (isOwn || fruitCount(m.tradeWant) <= 0)){ showToast(t('tradeNeedFruit').replace('{f}', fruitName(m.tradeWant))); return false; }
  if (action === 'cancel' && !isOwn) return false;
  if (action === 'decline' && isOwn) return false;
  tradeBusy = true;
  try {
    const st = action === 'accept' ? 'done' : (action === 'decline' ? 'no' : 'cancel');
    const r = await tradeCas(conv, m.id, st);
    if (!r.ok){ showToast(t('tradeClosed')); return false; }
    if (action === 'accept'){
      takeFruit(m.tradeWant);
      addFruit(m.tradeGive);
      showToast(t('tradeDoneYou').replace('{f}', fruitName(m.tradeGive)));
      sfxWin();
    } else if (action === 'cancel'){
      const list = loadTradeOpen();
      const i = list.findIndex(x => x.id === m.id);
      if (i >= 0){ list.splice(i, 1); saveTradeOpen(list); addFruit(m.tradeGive); }
      showToast(t('tradeCancelled'));
    }
    return true;
  } catch (e) {
    showToast(t('chatError'));
    return false;
  } finally {
    tradeBusy = false;
    chatLastSig = null;
    fetchChatMessages();
  }
}
let settling = false;
let lastSettle = 0;
async function settleTrades(force){
  if (settling || !cloudReady()) return;
  if (!force && Date.now() - lastSettle < 8000) return;
  const list = loadTradeOpen();
  if (!list.length) return;
  settling = true;
  lastSettle = Date.now();
  try {
    const keep = [];
    for (const it of list){
      try {
        const r = await fetch(cloudBase() + '/conversations/' + it.conv + '/messages/' + it.id + '?key=' + CLOUD.apiKey);
        if (r.status === 404){ addFruit(it.give); continue; }
        if (!r.ok){ keep.push(it); continue; }
        const doc = await r.json();
        const f = (doc && doc.fields) || {};
        const st = (f.tradeSt && f.tradeSt.stringValue) || '';
        if (st === 'done'){ addFruit(it.want); showToast(t('tradeDoneThem').replace('{f}', fruitName(it.want))); }
        else if (st === 'no' || st === 'cancel'){ addFruit(it.give); showToast(t('tradeDeclined').replace('{f}', fruitName(it.give))); }
        else keep.push(it);
      } catch (e) { keep.push(it); }
    }
    const now = loadTradeOpen().filter(x => !list.some(y => y.id === x.id));
    saveTradeOpen(keep.concat(now));
  } finally {
    settling = false;
    if (document.getElementById('fruitModal') && !document.getElementById('fruitModal').classList.contains('hidden')) renderFruitsScreen(true);
  }
}
function makeTradeCard(m, isOwn){
  const box = document.createElement('div');
  box.className = 'tradeCard';
  const head = document.createElement('div');
  head.className = 'tradeHead';
  head.textContent = '⇄ ' + t('tradeTitle');
  box.appendChild(head);
  const row = document.createElement('div');
  row.className = 'tradeRow';
  const side = (id, label) => {
    const d = document.createElement('div');
    d.className = 'tradeSide';
    d.appendChild(fruitIconCanvas(id, 44));
    const s = document.createElement('span');
    s.innerHTML = '<small>' + escapeHtml(label) + '</small>' + escapeHtml(fruitName(id));
    s.style.color = RARITY_COL[FRUITS[id].rar];
    d.appendChild(s);
    return d;
  };
  row.appendChild(side(m.tradeGive, isOwn ? t('tradeYouGive') : t('tradeTheyGive')));
  const arrow = document.createElement('div');
  arrow.className = 'tradeArrow';
  arrow.textContent = '⇄';
  row.appendChild(arrow);
  row.appendChild(side(m.tradeWant, isOwn ? t('tradeYouGet') : t('tradeTheyWant')));
  box.appendChild(row);
  const st = m.tradeSt || 'open';
  if (st !== 'open'){
    const s = document.createElement('div');
    s.className = 'tradeStatus st-' + st;
    s.textContent = st === 'done' ? t('tradeStDone') : (st === 'no' ? t('tradeStNo') : t('tradeStCancel'));
    box.appendChild(s);
  } else {
    const btns = document.createElement('div');
    btns.className = 'tradeBtns';
    const mk = (txt, cls, act) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + cls;
      b.textContent = txt;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); tradeAction(m, act); });
      return b;
    };
    if (isOwn){
      const w = document.createElement('div');
      w.className = 'tradeWait';
      w.textContent = t('tradeWaiting');
      btns.appendChild(w);
      btns.appendChild(mk(t('tradeCancel'), 'ghost', 'cancel'));
    } else {
      btns.appendChild(mk(t('tradeAccept'), '', 'accept'));
      btns.appendChild(mk(t('tradeDecline'), 'ghost', 'decline'));
    }
    box.appendChild(btns);
  }
  return box;
}
