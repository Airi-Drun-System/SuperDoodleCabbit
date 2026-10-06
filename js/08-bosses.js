"use strict";
const BOSS_FIRST = 2400;
const BOSS_EVERY = 3000;
const BOSS_LIFE = 60;
let boss = null;
let bossShots = [];
let bossOrbs = [];
let bossZaps = [];
let bossNext = BOSS_FIRST;
let bossWarn = 0;
let bossKillsTotal = parseInt(Store.get('bossKills', '0'), 10) || 0;
let runBossKills = 0;
let bossKillsById = (() => { try { const v = JSON.parse(Store.get('bossKillsBy', '{}')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } })();

const bossName = (w) => t('boss' + (w % WORLD_THEMES.length));
const bossTier = () => Math.floor(Math.max(0, score) / BOSS_EVERY);
function bossMaxHp(tier){ return Math.min(5, 2 + Math.floor(tier / 3)); }

function resetBoss(){
  boss = null;
  runBossKills = 0;
  bossShots.length = 0;
  bossOrbs.length = 0;
  bossZaps.length = 0;
  bossNext = BOSS_FIRST;
  bossWarn = 0;
}

function spawnBoss(){
  const tier = bossTier();
  const w = worldIndex();
  boss = {
    w, tier, x: VW / 2, vx: 55 + tier * 8, sf: -0.35, tsf: 0.21,
    r: 46, hp: bossMaxHp(tier), max: bossMaxHp(tier), t: 0,
    atkT: 2.6, orbT: 1.2, hurt: 0, st: 'in', dieT: 0, life: BOSS_LIFE
  };
  bossWarn = 0;
  addBossPlatform();
  addToast(t('bossIncoming').replace('{b}', bossName(w)), VW / 2, camY + VH * 0.34, '#ff6b6b');
  flash = 0.5; flashColor = '#ff3b3b';
  shake = Math.max(shake, 10);
  sfxBossIn();
  buzz(60);
}

function bossAttackEvery(){ const k = [1.05, 1.25, 1.1, 0.9, 1.35][boss.w % 5]; return 1.3 * k * Math.max(1.4, 2.4 - boss.tier * 0.06 - (1 - boss.hp / boss.max) * 0.3); }

function bossShoot(){
  const b = boss;
  const by = camY + VH * b.sf;
  const hard = b.tier >= 3 && b.hp <= b.max / 2;
  const wi = b.w % 5;
  const aim = clamp((hero.x - b.x) * 0.22, -70, 70);
  if (wi === 0){
    const n = hard ? 4 : 3;
    for (let i = 0; i < n; i++){
      const off = (i - (n - 1) / 2) * 55;
      bossShots.push({ x: b.x + off * 0.3, y: by + b.r * 0.5, vx: aim + off, vy: 125 + b.tier * 8, r: 9, t: 0, wave: 55, ph: i * 1.3 });
    }
    sfxBatSwarm();
  } else if (wi === 1){
    const n = hard ? 4 : 3;
    const xs = [clamp(hero.x + rand(-20, 20), 24, VW - 24)];
    while (xs.length < n){
      const x = rand(30, VW - 30);
      if (xs.every(q => Math.abs(q - x) > 70)) xs.push(x);
    }
    for (const x of xs) bossShots.push({ x, y: camY - 30, vx: 0, vy: 430, r: 9, t: 0, delay: 0.9, top: true });
    sfxIceWarn();
  } else if (wi === 2){
    const n = hard ? 3 : 2;
    for (let i = 0; i < n; i++){
      const tx = clamp(hero.x + (i - (n - 1) / 2) * 90, 20, VW - 20);
      bossShots.push({ x: b.x, y: by + b.r * 0.4, vx: (tx - b.x) / 1.3, vy: -170, g: 330, r: 12, t: 0 });
    }
    sfxLavaLob();
  } else if (wi === 3){
    const n = hard ? 2 : 1;
    for (let i = 0; i < n; i++){
      const dir = n > 1 ? (i ? 1 : -1) : (hero.x < b.x ? -1 : 1);
      bossShots.push({ x: b.x + dir * b.r * 0.5, y: by + b.r * 0.6, vx: dir * rand(110, 150), vy: 95 + b.tier * 6, r: 15, t: 0, bounce: true });
    }
    sfxSlimeSpit();
  } else {
    const n = hard ? 8 : 6;
    const a0 = rand(0, Math.PI * 2);
    for (let i = 0; i < n; i++){
      const a = a0 + i / n * Math.PI * 2;
      bossShots.push({ x: b.x, y: by, vx: Math.cos(a) * 105, vy: Math.sin(a) * 105 + 55, r: 9, t: 0 });
    }
    sfxStarBurst();
  }
}

function bossDropOrb(){
  const b = boss;
  bossOrbs.push({ x: clamp(hero.x + rand(-80, 80), 30, VW - 30), y: camY + VH * b.sf + b.r, vy: 85, t: 0, r: 18 });
}

function damageBoss(n, fx, fy){
  const b = boss;
  if (!b || b.st !== 'fight') return;
  b.hp = Math.max(0, b.hp - n);
  b.hurt = 1;
  const by = camY + VH * b.sf;
  bossZaps.push({ x1: fx, y1: fy, x2: b.x, y2: by, life: 1 });
  burstSpark(b.x, by, '#fff3b0', 16, 1.2);
  burstPixels(b.x, by, WORLD_THEMES[b.w].monster.burst);
  shake = Math.max(shake, 12);
  hitStop = 0.07;
  flash = 0.35; flashColor = '#ffe37a';
  sfxSmash();
  buzz(40);
  if (b.hp <= 0){
    b.st = 'die'; b.dieT = 0;
    bossShots.length = 0; bossOrbs.length = 0;
    sfxBossDie();
  }
}

function bossReward(){
  const b = boss;
  const gain = Math.round((40 + 20 * b.tier) * coinMult());
  runCoins += gain; coins += gain;
  Store.set('coins', coins);
  coinPulse = 1;
  const by = camY + VH * b.sf;
  addToast(t('bossDown'), VW / 2, by + 40, '#ffe37a');
  addToast('+' + gain, VW / 2, by + 70, '#ffd34d');
  for (let k = 0; k < 1; k++){
    const f = rollFruit([40, 38, 17, 5]);
    if (f && addFruit(f)) addToast(t('fruitGot').replace('{f}', fruitName(f)), VW / 2, by + 100 + k * 26, RARITY_COL[FRUITS[f].rar]);
  }
  bossKillsTotal += 1;
  runBossKills += 1;
  bossKillsById[b.w] = (bossKillsById[b.w] || 0) + 1;
  Store.set('bossKills', String(bossKillsTotal));
  Store.set('bossKillsBy', JSON.stringify(bossKillsById));
  if (typeof cloudPushSoon === 'function') cloudPushSoon();
  sfxCoin();
}

function addBossPlatform(){
  const w = Math.min(VW - 24, 340);
  const p = makePlatform(camY + VH * 0.8, 'normal', false);
  p.x = (VW - w) / 2; p.w = w; p.bossPlat = true;
  for (let i = platforms.length - 1; i >= 0; i--){
    const q = platforms[i];
    if (Math.abs(q.y - p.y) < 40) platforms.splice(i, 1);
  }
  platforms.push(p);
}

function endBoss(){
  boss = null;
  bossShots.length = 0;
  bossOrbs.length = 0;
  bossNext = Math.max(bossNext + BOSS_EVERY, Math.floor(Math.max(0, score)) + 1500);
}

function updateBoss(dt){
  for (let i = bossZaps.length - 1; i >= 0; i--){ bossZaps[i].life -= dt * 3; if (bossZaps[i].life <= 0) bossZaps.splice(i, 1); }
  if (!boss){
    if (state !== STATE.PLAY) return;
    if (score >= bossNext - 250 && !bossWarn){ bossWarn = 1; addToast(t('bossWarn'), VW / 2, camY + VH * 0.3, '#ff8a8a'); sfxBossWarn(); }
    if (score >= bossNext && !monsterEvent) spawnBoss();
    return;
  }
  const b = boss;
  b.t += dt;
  b.hurt = Math.max(0, b.hurt - dt * 3);
  monsterTimer = Math.max(monsterTimer, 1.5);
  laserTimer = Math.max(laserTimer, 2);

  if (b.st === 'die'){
    b.dieT += dt;
    const by = camY + VH * b.sf;
    if (Math.random() < dt * 14) burstSpark(b.x + rand(-b.r, b.r), by + rand(-b.r, b.r), pick(WORLD_THEMES[b.w].monster.burst), 10, 1);
    shake = Math.max(shake, 8);
    if (b.dieT > 1.2){
      burstPixels(b.x, by, WORLD_THEMES[b.w].monster.burst);
      burstSpark(b.x, by, '#ffe37a', 40, 2);
      addParticle({ kind: 'ring', x: b.x, y: by, vx: 0, vy: 0, life: 1, decay: 1.2, r: 20, color: '#ffe37a' });
      flash = 0.8; flashColor = '#ffffff';
      bossReward();
      endBoss();
    }
    return;
  }

  if (b.st === 'in'){ b.sf = approach(b.sf, b.tsf, 2.5, dt); if (Math.abs(b.sf - b.tsf) < 0.01){ b.st = 'fight'; } }
  else if (b.st === 'flee'){ b.sf -= dt * 0.8; if (b.sf < -0.5){ addToast(t('bossFled'), VW / 2, camY + VH * 0.3, '#c9c9d4'); endBoss(); return; } }
  else {
    b.life -= dt;
    if (b.life <= 0){ b.st = 'flee'; bossShots.length = 0; bossOrbs.length = 0; return; }
    b.atkT -= dt;
    if (b.atkT <= 0){ bossShoot(); b.atkT = bossAttackEvery(); }
    b.orbT -= dt;
    if (b.orbT <= 0 && bossOrbs.length < 4){ bossDropOrb(); b.orbT = 1.4; }
  }
  b.x += b.vx * dt * (b.st === 'fight' ? 1 : 0.4);
  if (b.x < b.r + 6){ b.x = b.r + 6; b.vx = Math.abs(b.vx); }
  if (b.x > VW - b.r - 6){ b.x = VW - b.r - 6; b.vx = -Math.abs(b.vx); }

  const hitR = hero.w * 0.22;
  for (let i = bossShots.length - 1; i >= 0; i--){
    const s = bossShots[i];
    s.t += dt;
    if (s.delay > 0){
      s.delay -= dt;
      if (s.top) s.y = camY - 30;
      if (s.delay <= 0 && s.top) sfxIceDrop();
      continue;
    }
    if (s.g) s.vy += s.g * dt;
    s.x += s.vx * dt + (s.wave ? Math.cos(s.t * 6 + (s.ph || 0)) * s.wave * dt : 0);
    s.y += s.vy * dt;
    if (s.bounce){
      if (s.x < s.r){ s.x = s.r; s.vx = Math.abs(s.vx); }
      if (s.x > VW - s.r){ s.x = VW - s.r; s.vx = -Math.abs(s.vx); }
    }
    if (s.y - camY > VH + 40 || s.y - camY < -80 || s.x < -60 || s.x > VW + 60){ bossShots.splice(i, 1); continue; }
    const dx = s.x - hero.x, dy = s.y - hero.y;
    if (state === STATE.PLAY && dx * dx + dy * dy < (s.r + hitR) * (s.r + hitR)){
      bossShots.splice(i, 1);
      burstSpark(s.x, s.y, WORLD_THEMES[b.w].monster.light, 14, 1);
      handleFatalEvent();
      return;
    }
  }
  for (let i = bossOrbs.length - 1; i >= 0; i--){
    const o = bossOrbs[i];
    o.t += dt; o.y += o.vy * dt;
    if (o.y - camY > VH + 40){ bossOrbs.splice(i, 1); continue; }
    const dx = o.x - hero.x, dy = o.y - hero.y;
    if (dx * dx + dy * dy < (o.r + hero.w * 0.55) * (o.r + hero.w * 0.55)){
      bossOrbs.splice(i, 1);
      hero.vy = Math.min(hero.vy, JUMP_V * 0.95);
      airJumps = hasDoubleJump() ? 1 : 0;
      damageBoss(1, o.x, o.y);
      if (!boss || boss.st !== 'fight') return;
    }
  }
  if (b.st === 'fight' && typeof arrows !== 'undefined'){
    const by = camY + VH * b.sf;
    for (let i = arrows.length - 1; i >= 0; i--){
      const a = arrows[i];
      const dx = a.x - b.x, dy = a.y - by;
      if (dx * dx + dy * dy < b.r * b.r){ arrows.splice(i, 1); damageBoss(0.34, a.x, a.y); if (!boss || boss.st !== 'fight') break; }
    }
  }
}

const MON_INK = '#2b2238';
function monEyes(g, pts, er, look, pupil, iris){
  for (const [x, y, s] of pts){
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(x, y, er * (s || 1), er * 1.12 * (s || 1), 0, 0, 6.2832); g.fill();
    g.strokeStyle = MON_INK; g.lineWidth = Math.max(1, er * 0.28); g.stroke();
    if (iris){ g.fillStyle = iris; g.beginPath(); g.arc(x + look * er * 0.35, y + er * 0.12, er * 0.62 * (s || 1), 0, 6.2832); g.fill(); }
    g.fillStyle = pupil || MON_INK;
    g.beginPath(); g.arc(x + look * er * 0.4, y + er * 0.15, er * 0.38 * (s || 1), 0, 6.2832); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(x + look * er * 0.4 - er * 0.18, y - er * 0.12, er * 0.14 * (s || 1), 0, 6.2832); g.fill();
  }
}
function monFangs(g, x, y, w, h, n){
  g.fillStyle = '#ffffff'; g.strokeStyle = MON_INK; g.lineWidth = 1.2;
  for (let i = 0; i < n; i++){
    const fx = x - w / 2 + (i + 0.5) * w / n;
    g.beginPath(); g.moveTo(fx - w / n * 0.4, y); g.lineTo(fx, y + h); g.lineTo(fx + w / n * 0.4, y); g.closePath(); g.fill(); g.stroke();
  }
}
function flamePath(g, r, t, n, amp){
  const cy = r * 0.2;
  const pts = [[-r, cy]];
  for (let i = 1; i < n; i++){
    const k = i / n;
    const x = -r * Math.cos(Math.PI * k) * 0.92;
    const wob = Math.sin(t * 9 + i * 1.7) * r * 0.1;
    const y = i % 2 ? -r * (0.7 + amp * Math.sin(Math.PI * k)) + wob : -r * (0.1 + 0.3 * Math.sin(Math.PI * k));
    pts.push([x + Math.sin(t * 6 + i) * r * 0.04, y]);
  }
  pts.push([r, cy]);
  g.beginPath();
  g.moveTo(r, cy);
  g.arc(0, cy, r, 0, Math.PI);
  for (let i = 1; i < pts.length; i++){
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2 + (y1 < y0 ? -1 : 1) * r * 0.05;
    const cyy = Math.max(y0, y1);
    g.quadraticCurveTo(cx, cyy, x1, y1);
  }
  g.closePath();
}
function monsterArt(g, w, r, t, look){
  const wi = ((w % 5) + 5) % 5;
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (wi === 0){
    const flap = Math.sin(t * 11);
    for (const s of [-1, 1]){
      g.save();
      g.scale(s, 1);
      g.translate(r * 0.7, -r * 0.1);
      g.rotate(-0.25 - flap * 0.45);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(r * 0.7, -r * 0.9, r * 1.35, -r * 0.35);
      g.quadraticCurveTo(r * 1.1, -r * 0.05, r * 1.15, r * 0.3);
      g.quadraticCurveTo(r * 0.85, r * 0.05, r * 0.7, r * 0.45);
      g.quadraticCurveTo(r * 0.45, r * 0.15, 0, r * 0.35);
      g.closePath();
      const wg = g.createLinearGradient(0, -r, r, r);
      wg.addColorStop(0, '#7a3a9a'); wg.addColorStop(1, '#3a1650');
      g.fillStyle = wg; g.fill();
      g.strokeStyle = MON_INK; g.lineWidth = 1.8; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(r * 0.1, r * 0.05); g.lineTo(r * 1.2, -r * 0.3); g.moveTo(r * 0.2, r * 0.2); g.lineTo(r * 0.8, r * 0.3); g.stroke();
      g.restore();
    }
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * r * 0.25, -r * 0.8); g.lineTo(s * r * 0.55, -r * 1.35); g.lineTo(s * r * 0.75, -r * 0.62); g.closePath();
      g.fillStyle = '#6a2a8a'; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 1.8; g.stroke();
      g.fillStyle = '#e59dd8'; g.beginPath(); g.moveTo(s * r * 0.36, -r * 0.8); g.lineTo(s * r * 0.54, -r * 1.12); g.lineTo(s * r * 0.64, -r * 0.72); g.closePath(); g.fill();
    }
    const bg = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    bg.addColorStop(0, '#c98af0'); bg.addColorStop(0.6, '#8a3fc0'); bg.addColorStop(1, '#4a1a70');
    g.beginPath(); g.ellipse(0, 0, r * 0.88, r * 0.92, 0, 0, 6.2832); g.fillStyle = bg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,220,250,.35)'; g.beginPath(); g.ellipse(0, r * 0.35, r * 0.45, r * 0.38, 0, 0, 6.2832); g.fill();
    monEyes(g, [[-r * 0.32, -r * 0.18], [r * 0.32, -r * 0.18]], r * 0.24, look, '#2a0a3a', '#ffd34d');
    g.strokeStyle = MON_INK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-r * 0.3, r * 0.3); g.quadraticCurveTo(0, r * 0.42, r * 0.3, r * 0.3); g.stroke();
    monFangs(g, 0, r * 0.33, r * 0.36, r * 0.16, 2);
  } else if (wi === 1){
    for (let i = 0; i < 3; i++){
      const a = t * 1.8 + i * 2.094;
      const sx = Math.cos(a) * r * 1.25, sy = Math.sin(a) * r * 0.45;
      g.save(); g.translate(sx, sy); g.rotate(a * 2);
      g.beginPath(); g.moveTo(0, -r * 0.2); g.lineTo(r * 0.1, 0); g.lineTo(0, r * 0.2); g.lineTo(-r * 0.1, 0); g.closePath();
      g.fillStyle = 'rgba(210,245,255,.9)'; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * r * 0.3, -r * 0.7); g.lineTo(s * r * 0.62, -r * 1.4); g.lineTo(s * r * 0.72, -r * 0.55); g.closePath();
      const hg = g.createLinearGradient(0, -r * 1.4, 0, -r * 0.5); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#7fd6f5');
      g.fillStyle = hg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 1.6; g.stroke();
    }
    g.beginPath();
    for (let i = 0; i < 8; i++){
      const a = i / 8 * 6.2832 - Math.PI / 2 + Math.PI / 8;
      const k = i % 2 ? 0.92 : 1.02;
      g.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k * 0.95);
    }
    g.closePath();
    const ig = g.createLinearGradient(-r, -r, r, r);
    ig.addColorStop(0, '#f2fcff'); ig.addColorStop(0.5, '#8fdcf7'); ig.addColorStop(1, '#2f84c0');
    g.fillStyle = ig; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-r * 0.7, -r * 0.2); g.lineTo(-r * 0.2, -r * 0.75); g.moveTo(r * 0.55, r * 0.5); g.lineTo(r * 0.8, r * 0.1); g.stroke();
    monEyes(g, [[-r * 0.3, -r * 0.08], [r * 0.3, -r * 0.08]], r * 0.22, look, '#0a3a5a', '#5ff4ff');
    g.fillStyle = '#1a4a6a';
    g.beginPath(); g.ellipse(0, r * 0.42, r * 0.2, r * 0.12, 0, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)';
    for (const s of [-1, 1]){ g.beginPath(); g.arc(s * r * 0.55, r * 0.3, r * 0.06, 0, 6.2832); g.fill(); }
  } else if (wi === 2){
    const gl = g.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
    gl.addColorStop(0, 'rgba(255,170,60,.45)'); gl.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(0, 0, r * 1.6, 0, 6.2832); g.fill();
    flamePath(g, r * 0.95, t, 6, 0.45);
    const fg = g.createLinearGradient(0, -r * 1.3, 0, r);
    fg.addColorStop(0, '#ffe36a'); fg.addColorStop(0.45, '#ff8a2a'); fg.addColorStop(1, '#c22a10');
    g.fillStyle = fg; g.fill(); g.strokeStyle = '#5a1004'; g.lineWidth = 2; g.stroke();
    g.save(); g.scale(0.62, 0.66); g.translate(0, r * 0.3);
    flamePath(g, r * 0.9, t + 1.3, 4, 0.2);
    g.fillStyle = 'rgba(255,245,180,.85)'; g.fill();
    g.restore();
    monEyes(g, [[-r * 0.3, 0], [r * 0.3, 0]], r * 0.2, look, '#3a0a00', null);
    g.strokeStyle = '#3a0a00'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-r * 0.52, -r * 0.3); g.lineTo(-r * 0.12, -r * 0.14); g.moveTo(r * 0.52, -r * 0.3); g.lineTo(r * 0.12, -r * 0.14); g.stroke();
    g.fillStyle = '#3a0a00';
    g.beginPath(); g.moveTo(-r * 0.24, r * 0.38); g.quadraticCurveTo(0, r * 0.2, r * 0.24, r * 0.38); g.quadraticCurveTo(0, r * 0.56, -r * 0.24, r * 0.38); g.fill();
  } else if (wi === 3){
    const wob = Math.sin(t * 4) * 0.06;
    g.beginPath();
    g.moveTo(-r * 0.95, r * 0.45);
    g.bezierCurveTo(-r * (1.05 + wob), -r * 0.6, -r * 0.5, -r * (1.08 - wob), 0, -r * (1.05 - wob));
    g.bezierCurveTo(r * 0.5, -r * (1.08 - wob), r * (1.05 + wob), -r * 0.6, r * 0.95, r * 0.45);
    for (let i = 0; i < 4; i++){
      const x0 = r * 0.95 - i * r * 0.475, x1 = x0 - r * 0.475;
      const dl = r * (0.18 + 0.14 * Math.abs(Math.sin(t * 2 + i * 1.9)));
      g.quadraticCurveTo((x0 + x1) / 2, r * 0.45 + dl * 2, x1, r * 0.45);
    }
    g.closePath();
    const sg = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    sg.addColorStop(0, '#d8ff9a'); sg.addColorStop(0.55, '#6fd34a'); sg.addColorStop(1, '#23701e');
    g.fillStyle = sg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.ellipse(-r * 0.45, -r * 0.55, r * 0.2, r * 0.1, -0.6, 0, 6.2832); g.fill();
    for (let i = 0; i < 3; i++){
      const by = r * 0.4 - ((t * 20 + i * 11) % (r * 1.1));
      g.strokeStyle = 'rgba(230,255,200,.7)'; g.lineWidth = 1;
      g.beginPath(); g.arc(r * (0.5 - i * 0.45), by, r * 0.07, 0, 6.2832); g.stroke();
    }
    monEyes(g, [[0, -r * 0.2, 1.5]], r * 0.3, look, '#12300e', '#c0ff4a');
    g.strokeStyle = MON_INK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-r * 0.25, r * 0.28); g.quadraticCurveTo(0, r * 0.46, r * 0.25, r * 0.28); g.stroke();
  } else {
    const beam = 0.25 + 0.15 * Math.sin(t * 5);
    const bm = g.createLinearGradient(0, r * 0.3, 0, r * 1.7);
    bm.addColorStop(0, 'rgba(150,255,230,' + beam + ')'); bm.addColorStop(1, 'rgba(150,255,230,0)');
    g.fillStyle = bm; g.beginPath(); g.moveTo(-r * 0.4, r * 0.35); g.lineTo(r * 0.4, r * 0.35); g.lineTo(r * 0.8, r * 1.7); g.lineTo(-r * 0.8, r * 1.7); g.closePath(); g.fill();
    const dome = g.createRadialGradient(-r * 0.2, -r * 0.6, r * 0.05, 0, -r * 0.25, r * 0.7);
    dome.addColorStop(0, 'rgba(255,255,255,.9)'); dome.addColorStop(1, 'rgba(160,220,255,.35)');
    g.beginPath(); g.arc(0, -r * 0.15, r * 0.6, Math.PI, 0); g.closePath();
    g.fillStyle = 'rgba(40,20,80,.55)'; g.fill();
    g.fillStyle = '#7fe06b';
    g.beginPath(); g.ellipse(0, -r * 0.28, r * 0.32, r * 0.3, 0, 0, 6.2832); g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 1.4; g.stroke();
    g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(0, -r * 0.75); g.stroke();
    g.fillStyle = '#ff6b8a'; g.beginPath(); g.arc(0, -r * 0.78, r * 0.06, 0, 6.2832); g.fill();
    monEyes(g, [[0, -r * 0.3]], r * 0.17, look, '#1a0a2a', '#b06bff');
    g.beginPath(); g.arc(0, -r * 0.15, r * 0.6, Math.PI, 0); g.closePath();
    g.fillStyle = dome; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 1.8; g.stroke();
    g.beginPath(); g.ellipse(0, r * 0.08, r * 1.05, r * 0.34, 0, 0, 6.2832);
    const sg = g.createLinearGradient(0, -r * 0.2, 0, r * 0.4);
    sg.addColorStop(0, '#e8ecf8'); sg.addColorStop(0.5, '#9aa4c8'); sg.addColorStop(1, '#4a5278');
    g.fillStyle = sg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 5; i++){
      const on = Math.floor(t * 6 + i) % 2 === 0;
      g.fillStyle = on ? ['#ffd34d', '#ff6b8a', '#5ff4ff'][i % 3] : '#3a3f5a';
      g.beginPath(); g.arc(-r * 0.7 + i * r * 0.35, r * 0.12, r * 0.07, 0, 6.2832); g.fill();
    }
  }
  g.restore();
}
function bossArt(g, w, r, t, look, hurt){
  const wi = ((w % 5) + 5) % 5;
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';
  const flashW = hurt > 0.5;
  if (wi === 0){
    const flap = Math.sin(t * 3.2);
    for (const s of [-1, 1]){
      g.save(); g.scale(s, 1); g.translate(r * 0.6, -r * 0.2); g.rotate(-0.15 - flap * 0.3);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(r * 0.8, -r * 1.1, r * 1.9, -r * 0.7);
      g.quadraticCurveTo(r * 1.6, -r * 0.3, r * 1.75, r * 0.15);
      g.quadraticCurveTo(r * 1.35, -r * 0.1, r * 1.2, r * 0.45);
      g.quadraticCurveTo(r * 0.95, r * 0.1, r * 0.7, r * 0.6);
      g.quadraticCurveTo(r * 0.45, r * 0.2, 0, r * 0.5);
      g.closePath();
      const wg = g.createLinearGradient(0, -r, r * 1.8, r * 0.6);
      wg.addColorStop(0, '#5a2080'); wg.addColorStop(1, '#1e0830');
      g.fillStyle = wg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(220,160,255,.3)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(r * 0.1, r * 0.1); g.lineTo(r * 1.85, -r * 0.65); g.moveTo(r * 0.2, r * 0.3); g.lineTo(r * 1.7, r * 0.1); g.moveTo(r * 0.3, r * 0.45); g.lineTo(r * 1.15, r * 0.42); g.stroke();
      g.restore();
    }
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * r * 0.3, -r * 0.75); g.lineTo(s * r * 0.75, -r * 1.45); g.lineTo(s * r * 0.85, -r * 0.5); g.closePath();
      g.fillStyle = '#4a1a6a'; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3; g.stroke();
    }
    const bg = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    bg.addColorStop(0, flashW ? '#ffffff' : '#b06ae0'); bg.addColorStop(0.6, '#6a2a9a'); bg.addColorStop(1, '#2e0e48');
    g.beginPath(); g.ellipse(0, 0, r * 0.95, r, 0, 0, 6.2832); g.fillStyle = bg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3.5; g.stroke();
    g.beginPath();
    g.moveTo(-r * 0.55, -r * 0.72); g.lineTo(-r * 0.6, -r * 1.25); g.lineTo(-r * 0.3, -r * 1.0); g.lineTo(0, -r * 1.4); g.lineTo(r * 0.3, -r * 1.0); g.lineTo(r * 0.6, -r * 1.25); g.lineTo(r * 0.55, -r * 0.72);
    g.closePath();
    const cg = g.createLinearGradient(0, -r * 1.4, 0, -r * 0.7); cg.addColorStop(0, '#fff3a0'); cg.addColorStop(1, '#e0a010');
    g.fillStyle = cg; g.fill(); g.strokeStyle = '#6a4200'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(0, -r * 0.95, r * 0.08, 0, 6.2832); g.fill();
    monEyes(g, [[-r * 0.35, -r * 0.15], [r * 0.35, -r * 0.15]], r * 0.2, look, '#20081f', '#ff3b5c');
    g.strokeStyle = MON_INK; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-r * 0.62, -r * 0.45); g.lineTo(-r * 0.15, -r * 0.3); g.moveTo(r * 0.62, -r * 0.45); g.lineTo(r * 0.15, -r * 0.3); g.stroke();
    g.fillStyle = '#20081f';
    g.beginPath(); g.moveTo(-r * 0.42, r * 0.3); g.quadraticCurveTo(0, r * 0.62, r * 0.42, r * 0.3); g.quadraticCurveTo(0, r * 0.42, -r * 0.42, r * 0.3); g.fill();
    monFangs(g, 0, r * 0.32, r * 0.6, r * 0.2, 2);
  } else if (wi === 1){
    for (let i = 0; i < 5; i++){
      const x = (i - 2) * r * 0.36, hgt = r * (0.5 + (i % 2 ? 0.25 : 0.55));
      g.beginPath(); g.moveTo(x - r * 0.16, -r * 0.8); g.lineTo(x, -r * 0.8 - hgt); g.lineTo(x + r * 0.16, -r * 0.8); g.closePath();
      const kg = g.createLinearGradient(0, -r * 0.8 - hgt, 0, -r * 0.8); kg.addColorStop(0, '#ffffff'); kg.addColorStop(1, '#5fc9e8');
      g.fillStyle = kg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 2.5; g.stroke();
    }
    g.beginPath();
    g.moveTo(-r * 0.75, -r * 0.9); g.lineTo(r * 0.75, -r * 0.9); g.lineTo(r * 1.05, -r * 0.3); g.lineTo(r * 0.95, r * 0.55);
    g.lineTo(r * 0.5, r * 1.0); g.lineTo(-r * 0.5, r * 1.0); g.lineTo(-r * 0.95, r * 0.55); g.lineTo(-r * 1.05, -r * 0.3); g.closePath();
    const ig = g.createLinearGradient(-r, -r, r, r);
    ig.addColorStop(0, flashW ? '#ffffff' : '#e8f8ff'); ig.addColorStop(0.5, '#7cc8ea'); ig.addColorStop(1, '#1f5f8e');
    g.fillStyle = ig; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3.5; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-r * 0.75, -r * 0.9); g.lineTo(-r * 0.3, -r * 0.3); g.lineTo(-r * 1.05, -r * 0.3); g.moveTo(r * 0.75, -r * 0.9); g.lineTo(r * 0.35, -r * 0.35); g.stroke();
    g.strokeStyle = 'rgba(20,60,100,.5)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(r * 0.6, r * 0.1); g.lineTo(r * 0.75, r * 0.4); g.lineTo(r * 0.6, r * 0.65); g.stroke();
    g.fillStyle = '#0e2a44';
    rr(g, -r * 0.62, -r * 0.35, r * 0.46, r * 0.3, r * 0.08); g.fill();
    rr(g, r * 0.16, -r * 0.35, r * 0.46, r * 0.3, r * 0.08); g.fill();
    const gl = 0.7 + 0.3 * Math.sin(t * 4);
    g.fillStyle = 'rgba(95,244,255,' + (gl * 0.35) + ')';
    g.beginPath(); g.ellipse(-r * 0.39 + look * r * 0.06, -r * 0.2, r * 0.22, r * 0.16, 0, 0, 6.2832); g.ellipse(r * 0.39 + look * r * 0.06, -r * 0.2, r * 0.22, r * 0.16, 0, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(95,244,255,' + gl + ')';
    g.beginPath(); g.ellipse(-r * 0.39 + look * r * 0.06, -r * 0.2, r * 0.13, r * 0.09, 0, 0, 6.2832); g.ellipse(r * 0.39 + look * r * 0.06, -r * 0.2, r * 0.13, r * 0.09, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#0e2a44';
    rr(g, -r * 0.45, r * 0.35, r * 0.9, r * 0.28, r * 0.08); g.fill();
    g.fillStyle = '#e8f8ff';
    for (let i = 0; i < 5; i++){ const x = -r * 0.4 + i * r * 0.2; g.beginPath(); g.moveTo(x, r * 0.35); g.lineTo(x + r * 0.08, r * 0.5); g.lineTo(x + r * 0.16, r * 0.35); g.closePath(); g.fill(); }
    for (let i = 0; i < 4; i++){
      const k = ((t * 0.8 + i * 0.25) % 1);
      g.fillStyle = 'rgba(230,250,255,' + (0.6 * (1 - k)) + ')';
      g.beginPath(); g.arc((i - 1.5) * r * 0.2 + Math.sin(t * 3 + i) * r * 0.1, r * 0.7 + k * r * 0.8, r * (0.08 + k * 0.12), 0, 6.2832); g.fill();
    }
  } else if (wi === 2){
    const gl = g.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.9);
    gl.addColorStop(0, 'rgba(255,140,40,.5)'); gl.addColorStop(1, 'rgba(255,60,10,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(0, 0, r * 1.9, 0, 6.2832); g.fill();
    g.save(); g.translate(0, -r * 0.45);
    flamePath(g, r * 1.15, t * 0.8, 8, 0.95);
    const fg = g.createLinearGradient(0, -r * 1.8, 0, r * 0.4);
    fg.addColorStop(0, '#fff07a'); fg.addColorStop(0.5, '#ff8a2a'); fg.addColorStop(1, '#c2200a');
    g.fillStyle = fg; g.fill(); g.strokeStyle = '#5a1004'; g.lineWidth = 3; g.stroke();
    g.restore();
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * r * 0.55, -r * 0.6); g.quadraticCurveTo(s * r * 1.2, -r * 0.9, s * r * 1.05, -r * 1.55); g.quadraticCurveTo(s * r * 0.95, -r * 1.0, s * r * 0.35, -r * 0.8); g.closePath();
      g.fillStyle = '#3a2a2a'; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3; g.stroke();
    }
    g.beginPath();
    g.moveTo(-r * 0.9, -r * 0.2); g.quadraticCurveTo(-r, -r * 0.85, -r * 0.2, -r * 0.9); g.quadraticCurveTo(r * 0.7, -r * 0.95, r * 0.95, -r * 0.3);
    g.quadraticCurveTo(r * 1.05, r * 0.5, r * 0.55, r * 0.9); g.quadraticCurveTo(0, r * 1.1, -r * 0.55, r * 0.9); g.quadraticCurveTo(-r * 1.05, r * 0.5, -r * 0.9, -r * 0.2);
    g.closePath();
    const rg = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
    rg.addColorStop(0, flashW ? '#ffffff' : '#6a4a4a'); rg.addColorStop(1, '#1e1012');
    g.fillStyle = rg; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3.5; g.stroke();
    g.save();
    g.strokeStyle = 'rgba(255,90,16,.35)'; g.lineWidth = 6;
    g.beginPath();
    g.moveTo(-r * 0.8, -r * 0.1); g.lineTo(-r * 0.55, r * 0.05); g.lineTo(-r * 0.62, r * 0.35);
    g.moveTo(r * 0.75, -r * 0.4); g.lineTo(r * 0.55, -r * 0.2); g.lineTo(r * 0.7, r * 0.1); g.lineTo(r * 0.55, r * 0.45);
    g.moveTo(-r * 0.2, -r * 0.85); g.lineTo(-r * 0.05, -r * 0.62); g.lineTo(r * 0.15, -r * 0.75);
    g.stroke();
    g.strokeStyle = '#ff9a2a'; g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-r * 0.8, -r * 0.1); g.lineTo(-r * 0.55, r * 0.05); g.lineTo(-r * 0.62, r * 0.35);
    g.moveTo(r * 0.75, -r * 0.4); g.lineTo(r * 0.55, -r * 0.2); g.lineTo(r * 0.7, r * 0.1); g.lineTo(r * 0.55, r * 0.45);
    g.moveTo(-r * 0.2, -r * 0.85); g.lineTo(-r * 0.05, -r * 0.62); g.lineTo(r * 0.15, -r * 0.75);
    g.stroke();
    g.fillStyle = '#ffd34d';
    g.beginPath(); g.ellipse(-r * 0.35 + look * r * 0.05, -r * 0.2, r * 0.18, r * 0.11, 0.25, 0, 6.2832); g.ellipse(r * 0.35 + look * r * 0.05, -r * 0.2, r * 0.18, r * 0.11, -0.25, 0, 6.2832); g.fill();
    g.fillStyle = '#ff4a10';
    g.beginPath(); g.moveTo(-r * 0.45, r * 0.35); g.quadraticCurveTo(0, r * 0.2, r * 0.45, r * 0.35); g.quadraticCurveTo(r * 0.3, r * 0.7, 0, r * 0.72); g.quadraticCurveTo(-r * 0.3, r * 0.7, -r * 0.45, r * 0.35); g.fill();
    g.restore();
    g.fillStyle = '#1e1012';
    for (let i = 0; i < 4; i++){ const x = -r * 0.33 + i * r * 0.22; g.beginPath(); g.moveTo(x, r * 0.3); g.lineTo(x + r * 0.11, r * 0.46); g.lineTo(x + r * 0.2, r * 0.3); g.closePath(); g.fill(); }
    const drip = (t * 0.7) % 1;
    g.fillStyle = 'rgba(255,120,30,' + (1 - drip) + ')';
    g.beginPath(); g.ellipse(r * 0.1, r * 0.75 + drip * r * 0.7, r * 0.06, r * 0.1, 0, 0, 6.2832); g.fill();
  } else if (wi === 3){
    const wb = Math.sin(t * 2.6);
    g.beginPath();
    g.moveTo(-r * 1.1, r * 0.55);
    g.bezierCurveTo(-r * (1.25 + wb * 0.05), -r * 0.5, -r * 0.7, -r * (1.15 - wb * 0.06), 0, -r * (1.12 - wb * 0.06));
    g.bezierCurveTo(r * 0.7, -r * (1.15 - wb * 0.06), r * (1.25 + wb * 0.05), -r * 0.5, r * 1.1, r * 0.55);
    for (let i = 0; i < 6; i++){
      const x0 = r * 1.1 - i * r * 0.3667, x1 = x0 - r * 0.3667;
      const dl = r * (0.12 + 0.12 * Math.abs(Math.sin(t * 1.6 + i * 1.3)));
      g.quadraticCurveTo((x0 + x1) / 2, r * 0.55 + dl * 2, x1, r * 0.55);
    }
    g.closePath();
    const sg = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.2);
    sg.addColorStop(0, flashW ? '#ffffff' : '#e0ff9a'); sg.addColorStop(0.5, '#78d84a'); sg.addColorStop(1, '#1e6a1a');
    g.fillStyle = sg; g.globalAlpha *= 0.96; g.fill(); g.globalAlpha /= 0.96; g.strokeStyle = MON_INK; g.lineWidth = 3.5; g.stroke();
    g.save(); g.clip();
    for (let i = 0; i < 6; i++){
      const by = r * 0.6 - ((t * 18 + i * 17) % (r * 1.7));
      g.strokeStyle = 'rgba(240,255,210,.6)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(r * (0.8 - i * 0.32), by, r * (0.05 + (i % 3) * 0.03), 0, 6.2832); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.ellipse(-r * 0.5, -r * 0.62, r * 0.22, r * 0.1, -0.5, 0, 6.2832); g.fill();
    monEyes(g, [[-r * 0.3, -r * 0.1, 1.4], [r * 0.38, -r * 0.2, 1], [r * 0.08, -r * 0.55, 0.75]], r * 0.17, look, '#12300e', '#e0ff4a');
    g.fillStyle = '#12300e';
    g.beginPath(); g.moveTo(-r * 0.35, r * 0.25); g.quadraticCurveTo(0, r * 0.6, r * 0.4, r * 0.22); g.quadraticCurveTo(0, r * 0.4, -r * 0.35, r * 0.25); g.fill();
  } else {
    g.save();
    g.rotate(-0.25);
    g.beginPath(); g.ellipse(0, 0, r * 1.7, r * 0.42, 0, Math.PI, 0);
    g.strokeStyle = 'rgba(200,170,255,.85)'; g.lineWidth = r * 0.14; g.stroke();
    g.restore();
    for (let i = 0; i < 5; i++){
      const x0 = (i - 2) * r * 0.35;
      g.strokeStyle = '#3a2a7a'; g.lineWidth = r * 0.16;
      g.beginPath(); g.moveTo(x0, r * 0.7);
      g.bezierCurveTo(x0 + Math.sin(t * 2 + i) * r * 0.4, r * 1.1, x0 - Math.sin(t * 2.3 + i) * r * 0.4, r * 1.35, x0 + Math.sin(t * 1.7 + i) * r * 0.3, r * 1.6);
      g.stroke();
      g.fillStyle = '#ffe37a'; g.beginPath(); g.arc(x0 + Math.sin(t * 1.7 + i) * r * 0.3, r * 1.6, r * 0.06, 0, 6.2832); g.fill();
    }
    const ng = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
    ng.addColorStop(0, flashW ? '#ffffff' : '#7a5aff'); ng.addColorStop(0.5, '#3a1a8a'); ng.addColorStop(1, '#0e0628');
    g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fillStyle = ng; g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3.5; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.clip();
    for (let i = 0; i < 14; i++){
      const a = i * 2.4 + t * 0.3, d = r * (0.3 + (i % 5) * 0.14);
      g.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))) + ')';
      g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.025 + (i % 3) * 0.6, 0, 6.2832); g.fill();
    }
    const sw = g.createRadialGradient(r * 0.3, r * 0.2, 0, r * 0.3, r * 0.2, r * 0.7);
    sw.addColorStop(0, 'rgba(255,120,200,.45)'); sw.addColorStop(1, 'rgba(255,120,200,0)');
    g.fillStyle = sw; g.fillRect(-r, -r, r * 2, r * 2);
    g.restore();
    g.save();
    g.rotate(-0.25);
    g.beginPath(); g.ellipse(0, 0, r * 1.7, r * 0.42, 0, 0, Math.PI);
    g.strokeStyle = 'rgba(220,200,255,.95)'; g.lineWidth = r * 0.14; g.stroke();
    g.restore();
    const ey = -r * 0.12;
    g.fillStyle = '#fff6e0';
    g.beginPath(); g.ellipse(0, ey, r * 0.42, r * 0.32, 0, 0, 6.2832); g.fill(); g.strokeStyle = MON_INK; g.lineWidth = 3; g.stroke();
    const px = look * r * 0.1;
    const irg = g.createRadialGradient(px, ey, 0, px, ey, r * 0.25);
    irg.addColorStop(0, '#ffe37a'); irg.addColorStop(1, '#ff6b2a');
    g.fillStyle = irg; g.beginPath(); g.arc(px, ey, r * 0.24, 0, 6.2832); g.fill();
    g.fillStyle = '#0e0628';
    g.beginPath();
    for (let i = 0; i < 8; i++){
      const a = i / 8 * 6.2832 - Math.PI / 2 + t * 0.5, k = i % 2 ? 0.05 : 0.14;
      g.lineTo(px + Math.cos(a) * r * k, ey + Math.sin(a) * r * k);
    }
    g.closePath(); g.fill();
    g.fillStyle = '#0e0628';
    g.beginPath(); g.ellipse(0, r * 0.48, r * 0.38, r * 0.16, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#ffe37a';
    for (let i = 0; i < 5; i++){ const x = -r * 0.3 + i * r * 0.15; g.beginPath(); g.moveTo(x - r * 0.05, r * 0.36); g.lineTo(x, r * 0.5); g.lineTo(x + r * 0.05, r * 0.36); g.closePath(); g.fill(); }
  }
  g.restore();
}

function drawBoss(){
  for (const z of bossZaps){
    ctx.save();
    ctx.globalAlpha = clamp(z.life, 0, 1);
    ctx.strokeStyle = '#fff7b0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const n = 6;
    for (let i = 0; i <= n; i++){
      const k = i / n;
      const x = z.x1 + (z.x2 - z.x1) * k + (i && i < n ? Math.sin(i * 7.3 + z.life * 20) * 10 : 0);
      const y = z.y1 + (z.y2 - z.y1) * k - camY;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  const now = performance.now() / 1000;
  for (const o of bossOrbs){
    const y = o.y - camY;
    const p = 1 + Math.sin(now * 8 + o.t) * 0.12;
    ctx.save();
    ctx.translate(o.x, y);
    if (!lowGfx()){
      const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, o.r * 2.4);
      gl.addColorStop(0, 'rgba(255,230,120,.7)');
      gl.addColorStop(1, 'rgba(255,230,120,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, o.r * 2.4, 0, 6.2832); ctx.fill();
    }
    ctx.rotate(now * 2);
    ctx.scale(p, p);
    ctx.fillStyle = '#ffe37a';
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++){
      const a = i / 10 * 6.2832 - 1.5708;
      const rr = i % 2 ? o.r * 0.45 : o.r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  const b = boss;
  const wm = b ? WORLD_THEMES[b.w].monster : currentWorld().monster;
  for (const s of bossShots){
    if (s.delay > 0){
      const k = 1 - s.delay / 0.9;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(s.delay * 14));
      const lg = ctx.createLinearGradient(0, 0, 0, VH);
      lg.addColorStop(0, 'rgba(160,230,255,.9)'); lg.addColorStop(1, 'rgba(160,230,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(s.x - 10, 0, 20, VH);
      ctx.globalAlpha = 1;
      ctx.translate(s.x, 14 + k * 8);
      const ig = ctx.createLinearGradient(0, -12, 0, 16); ig.addColorStop(0, '#ffffff'); ig.addColorStop(1, '#5fc9e8');
      ctx.fillStyle = ig; ctx.strokeStyle = MON_INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      continue;
    }
    const y = s.y - camY;
    ctx.save();
    ctx.translate(s.x, y);
    if (!lowGfx()){
      const gl = ctx.createRadialGradient(0, 0, 1, 0, 0, s.r * 2.2);
      gl.addColorStop(0, wm.light);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, s.r * 2.2, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const bw = b ? b.w % 5 : 0;
    const st = s.t || 0;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = MON_INK;
    ctx.lineWidth = 2;
    if (bw === 0){
      ctx.rotate(Math.sin(st * 12) * 0.3);
      ctx.fillStyle = '#b06ae0';
      ctx.beginPath(); ctx.moveTo(0, -s.r * 0.4); ctx.quadraticCurveTo(s.r * 0.8, -s.r * 1.1, s.r * 1.2, -s.r * 0.2); ctx.quadraticCurveTo(s.r * 0.5, 0, 0, s.r * 0.7);
      ctx.quadraticCurveTo(-s.r * 0.5, 0, -s.r * 1.2, -s.r * 0.2); ctx.quadraticCurveTo(-s.r * 0.8, -s.r * 1.1, 0, -s.r * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(-s.r * 0.2, -s.r * 0.1, s.r * 0.12, 0, 6.2832); ctx.arc(s.r * 0.2, -s.r * 0.1, s.r * 0.12, 0, 6.2832); ctx.fill();
    } else if (bw === 1){
      const ig = ctx.createLinearGradient(0, -s.r, 0, s.r * 1.4); ig.addColorStop(0, '#ffffff'); ig.addColorStop(1, '#5fc9e8');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.moveTo(-s.r * 0.55, -s.r * 0.7); ctx.lineTo(s.r * 0.55, -s.r * 0.7); ctx.lineTo(0, s.r * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (bw === 2){
      const fg = ctx.createRadialGradient(0, s.r * 0.2, 1, 0, 0, s.r * 1.2); fg.addColorStop(0, '#fff3a0'); fg.addColorStop(0.5, '#ff8a2a'); fg.addColorStop(1, '#c22a10');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.moveTo(s.r, s.r * 0.1); ctx.arc(0, s.r * 0.1, s.r, 0, Math.PI); ctx.quadraticCurveTo(-s.r * 0.6, -s.r * 1.1 - Math.sin(st * 20) * 2, 0, -s.r * 1.6); ctx.quadraticCurveTo(s.r * 0.6, -s.r * 1.1, s.r, s.r * 0.1); ctx.closePath(); ctx.fill();
    } else if (bw === 3){
      const sg = ctx.createRadialGradient(-s.r * 0.3, -s.r * 0.3, 1, 0, 0, s.r); sg.addColorStop(0, '#e0ff9a'); sg.addColorStop(1, '#3a9a2a');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(0, -s.r * 1.4); ctx.bezierCurveTo(s.r * 0.9, -s.r * 0.2, s.r * 1.1, s.r, 0, s.r); ctx.bezierCurveTo(-s.r * 1.1, s.r, -s.r * 0.9, -s.r * 0.2, 0, -s.r * 1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(-s.r * 0.3, 0, s.r * 0.2, 0, 6.2832); ctx.fill();
    } else {
      ctx.rotate(st * 6);
      ctx.fillStyle = '#ffe37a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++){ const a = i / 10 * 6.2832 - 1.5708, k = i % 2 ? 0.45 : 1.1; ctx.lineTo(Math.cos(a) * s.r * k, Math.sin(a) * s.r * k); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8a3cff'; ctx.stroke();
    }
    ctx.restore();
  }
  if (!b) return;
  const y = VH * b.sf;
  const bob = Math.sin(b.t * 2.4) * 5;
  const die = b.st === 'die' ? clamp(b.dieT / 1.2, 0, 1) : 0;
  ctx.save();
  ctx.translate(b.x + (die ? rand(-4, 4) : 0), y + bob);
  const sc = 1 + b.hurt * 0.12 + die * 0.25;
  ctx.scale(sc, sc * (1 - b.hurt * 0.08));
  ctx.globalAlpha = 1 - die * 0.6;
  if (!lowGfx()){
    const gl = ctx.createRadialGradient(0, 0, b.r * 0.5, 0, 0, b.r * 2.1);
    gl.addColorStop(0, WORLD_THEMES[b.w].glow);
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, 0, b.r * 2.1, 0, 6.2832); ctx.fill();
  }
  const look = clamp((hero.x - b.x) / 120, -1, 1);
  bossArt(ctx, b.w, b.r, b.t, look, b.hurt);
  ctx.restore();
}

function drawBossHud(){
  const b = boss;
  if (!b || b.st === 'die' && b.dieT > 1) return;
  const x = 60, w = VW - 120, y = 92;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '15px ' + GAME_FONT;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(21,10,43,.7)';
  ctx.fillStyle = '#ff8a8a';
  const nm = bossName(b.w);
  ctx.strokeText(nm, VW / 2, y - 3);
  ctx.fillText(nm, VW / 2, y - 3);
  ctx.fillStyle = 'rgba(21,10,43,.7)';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 3, y - 1, w + 6, 14, 7) : ctx.rect(x - 3, y - 1, w + 6, 14); ctx.fill();
  const k = clamp(b.hp / b.max, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#ff5a5a');
  g.addColorStop(1, '#ffb35c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y + 2, w * k, 8, 4) : ctx.rect(x, y + 2, w * k, 8); ctx.fill();
  if (b.st === 'fight' && b.life < 10){
    ctx.textBaseline = 'top';
    ctx.font = '13px ' + GAME_FONT;
    ctx.fillStyle = '#fdf6e8';
    ctx.globalAlpha = 0.8;
    ctx.fillText(t('bossTime').replace('{s}', Math.ceil(b.life)), VW / 2, y + 16);
  }
  ctx.restore();
}

const WB_IN = 0.45, WB_HOLD = 1.6, WB_OUT = 0.5;
let worldBanner = null;
function showWorldBanner(w){
  worldBanner = { w, t: 0 };
  const wm = WORLD_THEMES[w].monster;
  if (typeof hero !== 'undefined' && hero){
    for (let i = 0; i < 3; i++) burstSpark(hero.x, hero.y, wm.burst[i], 14, 1.3);
    addParticle({ kind: 'ring', x: hero.x, y: hero.y, vx: 0, vy: 0, life: 1, decay: 1.1, r: 12, color: wm.light });
  }
  sfxWorld();
}
function updateWorldBanner(dt){
  if (!worldBanner) return;
  worldBanner.t += dt;
  if (worldBanner.t > WB_IN + WB_HOLD + WB_OUT) worldBanner = null;
}
function drawWorldBanner(){
  const b = worldBanner;
  if (!b) return;
  const th = WORLD_THEMES[b.w];
  const tin = clamp(b.t / WB_IN, 0, 1);
  const tout = clamp((b.t - WB_IN - WB_HOLD) / WB_OUT, 0, 1);
  const ein = 1 - Math.pow(1 - tin, 3);
  const a = ein * (1 - tout);
  if (a <= 0.001) return;
  const cy = VH * 0.3 - tout * 30;
  const bandH = 104 * (0.3 + 0.7 * ein);
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, cy - bandH / 2, 0, cy + bandH / 2);
  g.addColorStop(0, 'rgba(10,4,24,0)');
  g.addColorStop(0.25, 'rgba(10,4,24,.62)');
  g.addColorStop(0.75, 'rgba(10,4,24,.62)');
  g.addColorStop(1, 'rgba(10,4,24,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-OX / S, cy - bandH / 2, cssW / S, bandH);
  const lw = VW * 0.42 * ein;
  const lg = ctx.createLinearGradient(VW / 2 - lw, 0, VW / 2 + lw, 0);
  lg.addColorStop(0, 'rgba(255,211,77,0)');
  lg.addColorStop(0.5, 'rgba(255,211,77,.95)');
  lg.addColorStop(1, 'rgba(255,211,77,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(VW / 2 - lw, cy - 38, lw * 2, 1.6);
  ctx.fillRect(VW / 2 - lw, cy + 38, lw * 2, 1.6);
  const sweepX = -80 + (VW + 160) * clamp((b.t - 0.2) / 0.9, 0, 1);
  if (b.t > 0.2 && b.t < 1.1){
    const sg = ctx.createLinearGradient(sweepX - 40, 0, sweepX + 40, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,.22)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sweepX - 40, cy - 36, 80, 72);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '14px ' + GAME_FONT;
  ctx.fillStyle = th.monster.light;
  ctx.fillText(t('worldLabel').replace('{n}', b.w + 1), VW / 2, cy - 22);
  const sc = 1.25 - 0.25 * ein;
  ctx.translate(VW / 2, cy + 8);
  ctx.scale(sc, sc);
  ctx.font = '34px ' + GAME_FONT;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(21,10,43,.85)';
  ctx.strokeText(th.name, 0, 0);
  ctx.fillStyle = '#fdf6e8';
  ctx.fillText(th.name, 0, 0);
  ctx.restore();
}

function paintBossPortrait(g, w, size, sil){
  const r = size * 0.25;
  g.save();
  g.clearRect(0, 0, size, size);
  if (!sil){
    const gl = g.createRadialGradient(size / 2, size / 2, r * 0.4, size / 2, size / 2, r * 1.9);
    gl.addColorStop(0, WORLD_THEMES[w % WORLD_THEMES.length].glow);
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl;
    g.fillRect(0, 0, size, size);
    g.translate(size / 2, size / 2 - r * 0.05);
    bossArt(g, w, r, 0.6, 0.3, 0);
  } else {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const cg = c.getContext('2d');
    if (cg){
      cg.translate(size / 2, size / 2 - r * 0.05);
      bossArt(cg, w, r, 0.6, 0, 0);
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.globalCompositeOperation = 'source-in';
      cg.fillStyle = '#140828';
      cg.fillRect(0, 0, size, size);
      g.drawImage(c, 0, 0);
    }
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.font = 'bold ' + Math.round(r * 0.9) + 'px ' + GAME_FONT;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', size / 2, size / 2);
  }
  g.restore();
}

function renderBestiary(){
  const list = document.getElementById('bestiaryList');
  if (!list) return;
  list.innerHTML = '';
  let seen = 0;
  for (let w = 0; w < WORLD_THEMES.length; w++){
    const kills = bossKillsById[w] || 0;
    if (kills) seen++;
    const card = document.createElement('div');
    card.className = 'bossCard' + (kills ? '' : ' unknown');
    card.style.setProperty('--bc', WORLD_THEMES[w].monster.light);
    const cv = document.createElement('canvas');
    const px = 144;
    cv.width = px; cv.height = px;
    cv.className = 'bossPortrait';
    const g = cv.getContext && cv.getContext('2d');
    if (g) paintBossPortrait(g, w, px, !kills);
    card.appendChild(cv);
    const body = document.createElement('div');
    body.className = 'bossCardBody';
    const worldLine = t('worldLabel').replace('{n}', w + 1) + ' · ' + WORLD_THEMES[w].name;
    body.innerHTML = '<div class="bossName">' + escapeHtml(kills ? bossName(w) : '???') + '</div>'
      + '<div class="bossWorld">' + escapeHtml(worldLine) + '</div>'
      + '<div class="bossMeta">' + (kills
        ? escapeHtml(t('bossWins').replace('{n}', kills))
        : escapeHtml(t('bossUnknown').replace('{s}', (w * BOSS_EVERY + BOSS_FIRST)))) + '</div>';
    card.appendChild(body);
    list.appendChild(card);
  }
  const sub = document.getElementById('bestiarySub');
  if (sub) sub.textContent = t('bestiarySub').replace('{a}', seen).replace('{b}', WORLD_THEMES.length).replace('{n}', bossKillsTotal);
}
function openBestiary(){
  const m = document.getElementById('bestiaryModal');
  if (!m) return;
  m.classList.remove('hidden');
  if (typeof sfxPopupOpen === 'function') sfxPopupOpen();
  renderBestiary();
}
function closeBestiary(){
  const m = document.getElementById('bestiaryModal');
  if (m) m.classList.add('hidden');
  if (typeof sfxPopupClose === 'function') sfxPopupClose();
}
