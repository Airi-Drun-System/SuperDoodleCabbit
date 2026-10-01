"use strict";
let worldLight = Store.get('worldLight', '0') === '1';
function skyOf(w){
  if (worldLight && w && w.lbg1) return { bg1: w.lbg1, bg2: w.lbg2, glow: w.lglow };
  return w;
}
function setWorldLight(on){
  worldLight = !!on;
  Store.set('worldLight', worldLight ? '1' : '0');
  bgCacheKey = '';
  for (const k in worldGradCache) delete worldGradCache[k];
  if (typeof refreshWorldLightRow === 'function') refreshWorldLightRow();
  const vig = document.getElementById('vignette');
  if (vig) vig.classList.toggle('soft', worldLight);
}
const worldIndex   = () => Math.floor(Math.max(0, score) / 3000) % WORLD_THEMES.length;
const currentWorld = () => WORLD_THEMES[worldIndex()];
let lastWorldIdx = 0;


function checkWorldMilestone(){
  if (score >= 10000 && !owned.has('hat:starcrown')){
    owned.add('hat:starcrown');
    saveOwned();
    addToast('★ Новый мир! Получена Звёздная корона', hero.x, hero.y - 90, '#ffd34d');
    shake = Math.max(shake, 14);
    cloudPushSoon();
  }
}

function buildLayers(){
  const stars = { kind: 0, factor: 0.14, items: [] };
  for (let i = 0; i < 90; i++)
    stars.items.push({ x: rand(0, VW), y: rand(0, BAND), r: rand(0.7, 2.0), a: rand(0.25, 0.9), tw: rand(0, 6.28) });

  const far = { kind: 1, factor: 0.28, items: [] };
  for (let i = 0; i < 12; i++)
    far.items.push({ x: rand(-40, VW + 40), y: rand(0, BAND), r: rand(40, 78), a: rand(0.05, 0.11) });

  const near = { kind: 2, factor: 0.52, items: [] };
  for (let i = 0; i < 9; i++)
    near.items.push({ x: rand(-40, VW + 40), y: rand(0, BAND), r: rand(55, 105), a: rand(0.07, 0.14) });

  const leaves = { kind: 3, factor: 0.78, items: [] };
  for (let i = 0; i < 16; i++)
    leaves.items.push({ x: rand(0, VW), y: rand(0, BAND), r: rand(4, 9), a: rand(0.18, 0.4), rot: rand(0, 6.28), spin: rand(-1.2, 1.2) });

  layers = [stars, far, near, leaves];
}
buildLayers();


const PW = 76, PH = 16;

const BLINK_PERIOD = 2.4, BLINK_ON = 1.5;
function blinkSolid(p){ return (typeof hasFruit === 'function' && hasFruit('ice')) || ((p.blinkT || 0) % BLINK_PERIOD) < BLINK_ON + 0.1; }
function makePlatform(y, type, spring){
  return {
    x: rand(6, VW - PW - 6),
    y: y, w: PW, h: PH,
    type: type,
    vx: type === 'moving' ? rand(55, 112) * (Math.random() < 0.5 ? -1 : 1) : 0,
    spring: !!spring,
    springC: 0, springV: 0,
    broken: false, fallV: 0, rot: 0, alpha: 1, wobble: 0,
    skin: worldIndex()
  };
}


function difficulty(){
  const s = score;
  let t;
  if (s <= 0) t = 0;
  else if (s < 5000)  t = (s / 5000) * 0.5;
  else if (s < 10000) t = 0.5 + ((s - 5000) / 5000) * 0.3;
  else if (s < 16000) t = 0.8 + ((s - 10000) / 6000) * 0.2;
  else t = 1;
  return clamp(t, 0, 1);
}

function gapRange(){
  const d = difficulty();
  return [lerp(48, 70, d), lerp(62, 118, d)];
}

function addCoin(x, y, plat){
  coinsOnMap.push({ x: x, y: y, plat: plat || null, phase: rand(0, 6.28), got: 0, bob: rand(0, 6.28) });
}

function spawnAbove(){
  const d = difficulty();
  const g = gapRange();
  const y = lastPlatY - rand(g[0], g[1]);

  let type = 'normal';
  const r = Math.random();
  const pMoving = lerp(0.06, 0.26, d);
  const pBroken = lerp(0.02, 0.16, d);
  const pCloud = lerp(0.02, 0.08, d);
  const pBouncy = 0.045;
  const pBlink = lerp(0.0, 0.07, d);
  const pTele = hasFruit('portal') ? 0.14 : (score > 800 ? 0.022 : 0);
  let acc = pMoving;
  if (r < acc) type = 'moving';
  else if (r < (acc += pBroken)) type = 'broken';
  else if (r < (acc += pCloud)) type = 'cloud';
  else if (r < (acc += pBouncy)) type = 'bouncy';
  else if (r < (acc += pBlink)) type = 'blink';
  else if (r < (acc += pTele)) type = 'tele';

  const springChance = hasFruit('spring') ? 0.5 : lerp(0.05, 0.11, d);
  const p = makePlatform(y, type, (type === 'normal' || type === 'moving') && Math.random() < springChance);
  if (type === 'blink') p.blinkT = rand(0, 2.4);

  if (type === 'broken' || type === 'blink'){
    const safe = makePlatform(y - rand(4, 16), 'normal', false);
    safe.x = (p.x < VW / 2) ? rand(VW * 0.55, VW - PW - 6) : rand(6, VW * 0.45 - PW * 0.5);
    safe.x = clamp(safe.x, 6, VW - PW - 6);
    platforms.push(safe);
    if (Math.random() < 0.22) addCoin(safe.x + safe.w / 2, safe.y - 30, safe);
  }

  platforms.push(p);
  maybeSpawnFruit(p);

  
  if (hasBow() && type === 'normal' && !p.spring && Math.random() < 0.24){
    crawlers.push({ plat: p, x: p.x + p.w / 2, y: p.y - 13, phase: rand(0, 6.28) });
  }
  else if (type !== 'broken' && type !== 'blink' && type !== 'tele' && !p.spring && Math.random() < 0.20)
    addCoin(p.x + p.w / 2, p.y - 30, p);
  else if (Math.random() < 0.07)
    addCoin(rand(40, VW - 40), y - rand(20, 46), null);

  lastPlatY = y;
}


const MAX_PARTICLES = 70;
function addParticle(p){
  if (particles.length >= (lowGfx() ? 30 : MAX_PARTICLES)) return;
  particles.push(p);
}

function burstLeaves(x, y, power){
  const n = Math.round(4 * power);
  for (let i = 0; i < n; i++){
    const a = rand(-Math.PI, 0) + rand(-0.4, 0.4);
    const sp = rand(70, 210) * power;
    addParticle({
      kind: 'leaf', x: x + rand(-14, 14), y: y,
      vx: Math.cos(a) * sp * 0.9, vy: Math.abs(Math.sin(a)) * sp * 0.35 + rand(-40, 60),
      life: 1, decay: rand(1.1, 1.9),
      r: rand(3.5, 7.5), rot: rand(0, 6.28), spin: rand(-8, 8),
      color: pick(landColors())
    });
  }
}
const LAND_COLORS = [
  ['#7fe06b', '#58c24a', '#a6f08f', '#3f9a37'],
  ['#ffffff', '#dff4ff', '#bfe9ff', '#9fd8f5'],
  ['#ffb35c', '#ff7a2a', '#ffd08a', '#ff5a1f'],
  ['#b4f07a', '#8fe06a', '#d8ff9a', '#62b83a'],
  ['#9ff6ff', '#c9a8ff', '#ffffff', '#ffd9f0']
];
function landColors(){
  if (typeof sceneryEnabled === 'function' && sceneryEnabled()) return LAND_COLORS[worldFx.cur % LAND_COLORS.length];
  return LAND_COLORS[0];
}
function drawHeroGlow(x, y){
  if (lowGfx() || uiStyle !== 'classic') return;
  const th = WORLD_THEMES[worldFx.cur % WORLD_THEMES.length];
  const pulse = 0.85 + Math.sin(performance.now() / 420) * 0.15;
  const r = 62 * pulse;
  const g = ctx.createRadialGradient(x, y, 6, x, y, r);
  g.addColorStop(0, th.glow.replace(/,[.\d]+\)$/, ',.55)'));
  g.addColorStop(1, th.glow.replace(/,[.\d]+\)$/, ',0)'));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function burstSpark(x, y, color, n, spread){
  for (let i = 0; i < n; i++){
    const a = rand(0, Math.PI * 2);
    const sp = rand(60, 260) * spread;
    addParticle({
      kind: 'spark', x: x, y: y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 1, decay: rand(1.6, 3.0), r: rand(1.6, 3.6), color: color
    });
  }
}

function burstShards(p){
  for (let i = 0; i < 10; i++){
    addParticle({
      kind: 'shard', x: p.x + rand(0, p.w), y: p.y + rand(0, p.h),
      vx: rand(-210, 210), vy: rand(-250, -20),
      life: 1, decay: rand(0.85, 1.5),
      r: rand(3, 10), rot: rand(0, 6.28), spin: rand(-12, 12),
      color: pick(['#a9713f', '#8a5730', '#c98d55', '#7a4a28', '#6d4322'])
    });
  }
  for (let i = 0; i < 5; i++){
    addParticle({
      kind: 'puff', x: p.x + p.w / 2 + rand(-26, 26), y: p.y + rand(-4, 6),
      vx: rand(-70, 70), vy: rand(-30, 20),
      life: 1, decay: rand(1.4, 2.2), r: rand(5, 12), color: '#d8b48c'
    });
  }
}


function burstPixels(x, y, colors){
  for (let i = 0; i < 14; i++){
    addParticle({
      kind: 'pixel', x: x + rand(-16, 16), y: y + rand(-16, 16),
      vx: rand(-260, 260), vy: rand(-320, -40),
      life: 1, decay: rand(0.7, 1.3),
      r: rand(3, 7), rot: rand(0, 6.28), spin: rand(-9, 9),
      color: pick(colors)
    });
  }
}

function burstGlassShards(x, y){
  for (let i = 0; i < 12; i++){
    addParticle({
      kind: 'shard', x: x + rand(-16, 16), y: y + rand(-16, 16),
      vx: rand(-220, 220), vy: rand(-260, -30),
      life: 1, decay: rand(1.0, 1.8),
      r: rand(2, 6), rot: rand(0, 6.28), spin: rand(-14, 14),
      color: pick(['#bdeaff', '#d8f5ff', '#8fd3ec', '#ffffff'])
    });
  }
}

function landDust(x, y){
  if (lowGfx()) return;
  for (let k = -1; k <= 1; k += 2){
    for (let j = 0; j < 2; j++){
      addParticle({
        kind: 'puff', x: x + k * rand(6, 14), y: y - rand(0, 4),
        vx: k * rand(70, 130), vy: rand(-26, -6),
        life: 1, decay: rand(2.4, 3.4), r: rand(4, 7), color: '#fff6e2'
      });
    }
  }
}

function trailPuff(){
  addParticle({
    kind: 'puff', x: hero.x + rand(-10, 10), y: hero.y + hero.h * 0.35 + rand(-6, 6),
    vx: rand(-22, 22), vy: rand(30, 90),
    life: 1, decay: rand(1.6, 2.6), r: rand(5, 12),
    color: pick(['#ffe7b8', '#ffd08a', '#fff6e2', '#ffb0c7'])
  });
}

function addToast(text, x, y, color){
  toasts.push({ text, x, y, life: 1, color: color || '#fff' });
}



function spawnMonster(){
  monsters.push({
    x: rand(60, VW - 60),
    screenFrac: 1.12,               
    targetFrac: rand(0.6, 0.82),    
    y: camY + VH * 1.12,
    vx: rand(40, 80) * (Math.random() < 0.5 ? -1 : 1),
    bob: rand(0, 6.28),
    r: 22,
    w: worldIndex(),
    life: 60,                       
    frozen: false
  });
}

function removeMonster(m){
  const idx = monsters.indexOf(m);
  if (idx >= 0) monsters.splice(idx, 1);
  monsterTimer = Math.max(monsterTimer, MONSTER_INTERVAL);
}


function killMonster(m, success, perfect){
  removeMonster(m);

  if (success){

    const smash = hasMace();
    if (smash) maceSwing = 1;

    burstPixels(m.x, m.y, currentWorld().monster.burst);
    burstSpark(m.x, m.y, '#e0b3ff', smash ? 22 : 18, smash ? 1.4 : 1.15);
    burstSpark(m.x, m.y, '#fff3b0', smash ? 10 : 8, 0.8);
    addParticle({ kind: 'ring', x: m.x, y: m.y, vx: 0, vy: 0, life: 1, decay: 1.6, r: 6, color: '#d9a6ff' });
    if (perfect){
      addToast(t('perfectToast'), m.x, m.y - 52, '#ffe37a');
      burstSpark(m.x, m.y, '#ffe37a', 26, 1.6);
    }
    addToast(smash ? t('smashToast') : t('kickToast'), m.x, m.y - 30, smash ? '#d9a6ff' : '#e8d9ff');
    if (smash) sfxSmash(); else sfxSpring();
    if (perfect) sfxPerfect();
    shake = Math.max(shake, (smash ? 18 : 13) + (perfect ? 8 : 0));
    hitStop = perfect ? 0.11 : (smash ? 0.08 : 0.06);
    buzz(perfect ? 55 : 35);
    flash = (smash ? 0.65 : 0.45) + (perfect ? 0.2 : 0); flashColor = perfect ? '#ffe37a' : '#b268ff';
    const launchMult = perfect ? 1.22 : 1;
    hero.vy = (smash ? MACE_LAUNCH : KICK_LAUNCH) * launchMult;
    hero.vx *= 0.3;
    hero.sx = smash ? 0.58 : 0.68; hero.sy = smash ? 1.6 : 1.46;
    hero.spin = hero.face * 6.2832 * (smash ? 2.5 : 1.4);
    airJumps = hasDoubleJump() ? 1 : 0;


    const bonus = Math.round((smash ? 5 : 3) * coinMult() * (perfect ? 2 : 1));
    runCoins += bonus; coins += bonus;
    Store.set('coins', coins);
    coinPulse = 1;
    addToast('+' + bonus, m.x + 26, m.y - 46, '#ffd34d');
    sfxCoin();
  }
}


const QTE_ZONE_HALF = 0.085;
const QTE_BAR_SPEED = 1.35;

function startMonsterEvent(m){
  m.frozen = true;
  monsterEvent = {
    monster: m, elapsed: 0,
    barPos: 0, barDir: 1, barSpeed: QTE_BAR_SPEED,
    zoneStart: 0.5 - QTE_ZONE_HALF, zoneEnd: 0.5 + QTE_ZONE_HALF
  };
  hitBtn.classList.remove('hidden');
  hideTouchControls();
  ensureAudio();
  sfxAlert();
}

function resolveMonsterEvent(success){
  const ev = monsterEvent;
  monsterEvent = null;
  hitBtn.classList.add('hidden');
  if (state === STATE.PLAY) showTouchControls();
  if (!ev) return;

  if (success){
    const perfect = ev.barPos >= ev.zoneStart && ev.barPos <= ev.zoneEnd;
    killMonster(ev.monster, true, perfect);
  } else { removeMonster(ev.monster); handleFatalEvent(); }
}


function heroDoomed(){
  if (airJumps > 0) return false;
  if (hasSpear() && spearReady) return false;
  const feet = hero.y + hero.h * 0.5;
  const floor = camY + VH;
  for (let i = 0; i < platforms.length; i++){
    const p = platforms[i];
    if (!p.broken && p.y + 2 >= feet && p.y < floor) return false;
  }
  for (let i = 0; i < monsters.length; i++){
    if (monsters[i].y >= hero.y && monsters[i].y < floor + 30) return false;
  }
  return true;
}

function handleFatalEvent(){
  if (monsterEvent){
    removeMonster(monsterEvent.monster);
    monsterEvent = null;
    hitBtn.classList.add('hidden');
  }

  if (hasGlass()){
    burstGlassShards(hero.x, hero.y);
    sfxGlass();
    buzz(60);
    addToast(t('glassToast'), hero.x, hero.y - 30, '#bdeaff');
    shake = Math.max(shake, 10);
    flash = 0.55; flashColor = '#bdeaff';

    glassUsedThisRun = true;

    hero.y = camY + VH * 0.32;
    hero.vy = JUMP_V;
    return;
  }
  startDeathPortal();
}

const easeOutBack = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const easeInBack  = (x) => { const c = 1.9; return (c + 1) * x * x * x - c * x * x; };

function portalScale(t){
  const open = easeOutBack(clamp(t / 0.34, 0, 1));
  const close = 1 - easeInBack(clamp((t - PORTAL_CLOSE_AT) / (PORTAL_DUR - PORTAL_CLOSE_AT), 0, 1));
  return Math.max(0, open * close);
}

function portalSuck(t){
  const s = clamp((t - 0.12) / 0.62, 0, 1);
  return s * s * s;
}

function startDeathPortal(){
  if (state !== STATE.PLAY) return;
  state = STATE.DYING;
  pauseBtn.classList.add('hidden');
  hideTouchControls();
  hitBtn.classList.add('hidden');
  const sy = clamp(hero.y - camY + 55, 110, VH - 130);
  const sx = clamp(hero.x, PORTAL_R + 16, VW - PORTAL_R - 16);
  deathPortal = {
    x: sx, y: camY + sy, t: 0,
    hx: hero.x, hy: hero.y, tilt: hero.tilt + hero.spin,
    sx: hero.sx, sy: hero.sy, face: hero.face,
    gulped: false, closing: false, done: false, bits: [], bitAcc: 0
  };
  shake = Math.max(shake, 5);
  buzz([40, 60, 90]);
  sfxPortalOpen();
}

function updateDeathPortal(dt){
  const dp = deathPortal;
  if (!dp || dp.done) return;
  dp.t += dt;

  if (dp.t < PORTAL_CLOSE_AT){
    dp.bitAcc += dt * (lowGfx() ? 22 : 60);
    while (dp.bitAcc >= 1){
      dp.bitAcc -= 1;
      const a = rand(0, Math.PI * 2);
      const r = PORTAL_R * rand(1.3, 2.3);
      dp.bits.push({ a: a, r: r, r0: r, life: 1, spd: rand(1.6, 2.6), sz: rand(1.5, 3.4), hue: Math.random() < 0.35 });
    }
  }
  for (let i = dp.bits.length - 1; i >= 0; i--){
    const b = dp.bits[i];
    b.life -= dt * b.spd;
    b.r = b.r0 * Math.max(0, b.life);
    b.a += dt * (2.5 + 5 * (1 - b.life));
    if (b.life <= 0) dp.bits.splice(i, 1);
  }

  if (!dp.gulped && portalSuck(dp.t) >= 1){
    dp.gulped = true;
    shake = Math.max(shake, 4);
    sfxPortalGulp();
  }
  if (!dp.closing && dp.t >= PORTAL_CLOSE_AT){
    dp.closing = true;
    sfxPortalClose();
  }
  if (dp.t >= PORTAL_DUR){
    dp.done = true;
    dp.bits.length = 0;
    burstSpark(dp.x, dp.y, '#b6ff5c', lowGfx() ? 10 : 22, 0.9);
    burstSpark(dp.x, dp.y, '#effff0', lowGfx() ? 4 : 10, 0.6);
    flash = 0.5; flashColor = '#9dff5a';
    gameOver();
  }
}

function portalEdgePath(R, time){
  ctx.beginPath();
  const N = 64;
  for (let i = 0; i <= N; i++){
    const a = i / N * Math.PI * 2;
    const r = R * (1 + 0.045 * Math.sin(a * 6 + time * 7) + 0.03 * Math.sin(a * 11 - time * 10));
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawDeathPortal(){
  const dp = deathPortal;
  if (!dp || dp.done) return;
  const k = portalScale(dp.t);
  const y = dp.y - camY;
  const time = dp.t;
  const low = lowGfx();

  if (dp.bits.length){
    ctx.save();
    for (const b of dp.bits){
      ctx.globalAlpha = Math.min(1, b.life * 1.6) * 0.9;
      ctx.fillStyle = b.hue ? '#f2ffd8' : '#8dff4a';
      ctx.beginPath();
      ctx.arc(dp.x + Math.cos(b.a) * b.r, y + Math.sin(b.a) * b.r, b.sz, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }
  if (k <= 0.01) return;
  const R = PORTAL_R * k;

  ctx.save();
  ctx.translate(dp.x, y);

  if (!low){
    const glow = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.75);
    glow.addColorStop(0, 'rgba(150,255,90,0.5)');
    glow.addColorStop(1, 'rgba(150,255,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.75, 0, 6.2832);
    ctx.fill();
  }

  portalEdgePath(R, time);
  const body = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
  body.addColorStop(0, '#fbffe8');
  body.addColorStop(0.22, '#d6ff7a');
  body.addColorStop(0.55, '#79e63c');
  body.addColorStop(0.85, '#2fa22b');
  body.addColorStop(1, '#1b6d20');
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  portalEdgePath(R, time);
  ctx.clip();
  ctx.lineCap = 'round';
  const arms = low ? 4 : 6;
  const steps = low ? 12 : 22;
  for (let i = 0; i < arms; i++){
    const base = i / arms * Math.PI * 2 - time * 4.2;
    ctx.beginPath();
    for (let j = 0; j <= steps; j++){
      const f = j / steps;
      const r = R * (0.06 + 0.98 * f);
      const a = base + f * 4.4;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = i % 2 ? 'rgba(20,95,25,0.42)' : 'rgba(240,255,205,0.6)';
    ctx.lineWidth = Math.max(1.5, R * (i % 2 ? 0.07 : 0.09));
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  core.addColorStop(0, 'rgba(255,255,255,0.95)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.42, 0, 6.2832);
  ctx.fill();
  ctx.restore();

  portalEdgePath(R, time);
  ctx.lineWidth = Math.max(2, R * 0.08);
  ctx.strokeStyle = '#c4ff66';
  ctx.stroke();
  portalEdgePath(R * 1.04, time + 0.4);
  ctx.lineWidth = Math.max(1, R * 0.03);
  ctx.strokeStyle = 'rgba(25,110,30,0.75)';
  ctx.stroke();

  ctx.restore();
}

function drawDyingHero(){
  const dp = deathPortal;
  if (dp.done) return;
  const s = portalSuck(dp.t);
  if (s >= 1) return;
  const dx = dp.hx - dp.x, dy = dp.hy - dp.y;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx) + s * Math.PI * 3;
  const rad = dist * (1 - s);
  const x = dp.x + Math.cos(ang) * rad;
  const y = dp.y + Math.sin(ang) * rad - camY;
  const wob = Math.sin(dp.t * 30) * 0.06 * (1 - s);
  const k = 1 - s * 0.96;
  const tilt = dp.tilt + s * 11 + Math.sin(dp.t * 8) * 0.15 * (1 - s);
  const alpha = 1 - clamp((s - 0.8) / 0.2, 0, 1);
  drawHero(x, y, dp.sx * k * (1 + wob), dp.sy * k * (1 - wob), tilt, dp.face, alpha, 0, performance.now() / 1000);
}


const FRUITS = {
  spring: { rar: 1, c1: '#c4f79c', c2: '#2f9a3c', sw: '#f0ffe0' },
  cloud:  { rar: 1, c1: '#ffffff', c2: '#8fb4ff', sw: '#ffffff' },
  ice:    { rar: 2, c1: '#e2fbff', c2: '#3b8fdc', sw: '#ffffff' },
  magnet: { rar: 2, c1: '#ffc0c0', c2: '#d8323a', sw: '#fff0f0' },
  portal: { rar: 3, c1: '#f0d0ff', c2: '#6a2cc6', sw: '#f9eeff' },
  star:   { rar: 4, c1: '#fff8c8', c2: '#f59a0c', sw: '#ffffff' }
};
const FRUIT_IDS = Object.keys(FRUITS);
const RARITY_COL = { 1: '#c3cadb', 2: '#5fb4ff', 3: '#c77dff', 4: '#ffc33d' };
const fruitName = (id) => t('fr_' + id);
const fruitDesc = (id) => t('frd_' + id);
const rarityName = (r) => t('rar' + r);

function parseFruitState(str){
  let v = null;
  try { v = JSON.parse(str || 'null'); } catch (e) {}
  const inv = {};
  if (v && v.inv && typeof v.inv === 'object'){
    for (const k of FRUIT_IDS){
      const n = parseInt(v.inv[k], 10);
      if (n > 0) inv[k] = Math.min(99, n);
    }
  }
  return { inv, eat: v && FRUITS[v.eat] ? v.eat : '', rev: v && v.rev > 0 ? Math.floor(v.rev) : 0 };
}
const REMOVED_FRUITS = { flame: 200, storm: 400 };
function removedFruitRefund(str){
  let v = null;
  try { v = JSON.parse(str || 'null'); } catch (e) {}
  let c = 0;
  if (v && v.inv && typeof v.inv === 'object'){
    for (const k in REMOVED_FRUITS){ const n = parseInt(v.inv[k], 10); if (n > 0) c += Math.min(99, n) * REMOVED_FRUITS[k]; }
  }
  if (v && REMOVED_FRUITS[v.eat]) c += REMOVED_FRUITS[v.eat];
  return c;
}
let fruitRefundCoins = removedFruitRefund(Store.get('fruits', ''));
let fruitState = parseFruitState(Store.get('fruits', ''));
if (fruitRefundCoins){
  coins += fruitRefundCoins;
  Store.set('coins', coins);
  fruitState.rev += 1;
  Store.set('fruits', JSON.stringify(fruitState));
  const fr = fruitRefundCoins;
  setTimeout(() => { if (typeof showToast === 'function') showToast(t('fruitRefund').replace('{c}', fr)); if (typeof cloudPushSoon === 'function') cloudPushSoon(); }, 2200);
}
function fruitStr(){ return JSON.stringify(fruitState); }
function saveFruits(){
  fruitState.rev += 1;
  Store.set('fruits', fruitStr());
  if (typeof cloudPushSoon === 'function') cloudPushSoon();
}
function fruitCount(id){ return fruitState.inv[id] || 0; }
function addFruit(id, n){
  if (!FRUITS[id]) return false;
  fruitState.inv[id] = Math.min(99, fruitCount(id) + (n || 1));
  saveFruits();
  return true;
}
function takeFruit(id){
  if (fruitCount(id) <= 0) return false;
  fruitState.inv[id] -= 1;
  if (!fruitState.inv[id]) delete fruitState.inv[id];
  saveFruits();
  return true;
}
function hasFruit(id){ return fruitState.eat === id; }
function eatFruit(id){
  if (fruitCount(id) <= 0) return false;
  fruitState.inv[id] -= 1;
  if (!fruitState.inv[id]) delete fruitState.inv[id];
  fruitState.eat = id;
  saveFruits();
  return true;
}
function mergeFruitsFrom(str){
  const r = parseFruitState(str);
  if (r.rev > fruitState.rev){
    fruitState = r;
    Store.set('fruits', fruitStr());
    return true;
  }
  return false;
}
function fruitsOfRarity(r){ return FRUIT_IDS.filter(k => FRUITS[k].rar === r); }
function rollFruit(weights){
  const w = weights || [62, 27, 9, 2];
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  let rar = 4;
  for (let i = 0; i < 4; i++){
    if (x < w[i]){ rar = i + 1; break; }
    x -= w[i];
  }
  return pick(fruitsOfRarity(rar));
}

function fruitShape(g, r, id){
  g.beginPath();
  if (id === 'cloud'){
    for (const [cx, cy, cr] of [[-0.5, 0.2, 0.55], [0.5, 0.2, 0.55], [-0.2, -0.25, 0.62], [0.3, -0.2, 0.55], [0, 0.35, 0.6]]){
      g.moveTo(cx * r + cr * r, cy * r);
      g.arc(cx * r, cy * r, cr * r, 0, Math.PI * 2);
    }
  } else if (id === 'ice'){
    for (let i = 0; i < 6; i++){
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const k = i % 3 === 0 ? 1.12 : 0.98;
      const px = Math.cos(a) * r * k * 0.95, py = Math.sin(a) * r * k;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath();
  } else if (id === 'star'){
    for (let i = 0; i < 10; i++){
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const k = i % 2 ? 0.56 : 1.12;
      const px = Math.cos(a) * r * k, py = Math.sin(a) * r * k + r * 0.06;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath();
  } else if (id === 'magnet'){
    g.moveTo(0, -r * 0.62);
    g.bezierCurveTo(r * 0.35, -r * 1.05, r * 1.12, -r * 0.85, r * 1.02, -r * 0.05);
    g.bezierCurveTo(r * 0.95, r * 0.7, r * 0.45, r * 1.02, 0, r * 0.92);
    g.bezierCurveTo(-r * 0.45, r * 1.02, -r * 0.95, r * 0.7, -r * 1.02, -r * 0.05);
    g.bezierCurveTo(-r * 1.12, -r * 0.85, -r * 0.35, -r * 1.05, 0, -r * 0.62);
    g.closePath();
  } else if (id === 'spring'){
    g.ellipse(0, r * 0.04, r * 0.9, r * 1.02, 0, 0, Math.PI * 2);
  } else {
    g.arc(0, 0, r, 0, Math.PI * 2);
  }
}
