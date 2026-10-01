"use strict";
function resetGame(){
  resetFruitRun();
  worldBanner = null;
  resetBoss();
  platforms.length = 0;
  particles.length = 0;
  trailParts.length = 0;
  trailHist.length = 0;
  coinsOnMap.length = 0;
  toasts.length = 0;
  monsters.length = 0;
  crawlers.length = 0;
  arrows.length = 0;
  lastWorldIdx = 0;
  hero.ghosts.length = 0;

  camY = 0; camTarget = 0;
  shake = 0; flash = 0; blurAmount = 0; coinPulse = 0;
  monsterTimer = MONSTER_INTERVAL;
  monsterEvent = null;
  lasers.length = 0;
  laserTimer = LASER_FIRST_DELAY;
  laserIntroShown = false;
  glassUsedThisRun = false;
  spearReady = true;
  spearCdLeft = 0;
  fallSoundPlayed = false;
  deathPortal = null;
  hitStop = 0; speedFx = 0;
  maceSwing = 0;
  shootCd = 0;
  airJumps = 0;
  if (typeof hitBtn !== 'undefined') hitBtn.classList.add('hidden');

  hero.x = VW / 2;
  hero.y = VH - 180;
  hero.vx = 0; hero.vy = JUMP_V * 0.6;
  hero.sx = 1; hero.sy = 1; hero.tilt = 0; hero.spin = 0; hero.face = 1;

  startY = hero.y; minY = hero.y; score = 0; runCoins = 0;

  const base = makePlatform(VH - 100, 'normal', false);
  base.x = VW / 2 - PW / 2;
  base.w = PW + 26;
  platforms.push(base);
  lastPlatY = base.y;

  for (let i = 0; i < 6; i++){
    const y = lastPlatY - rand(56, 80);
    const p = makePlatform(y, 'normal', false);
    platforms.push(p);
    if (i === 3) addCoin(p.x + p.w / 2, p.y - 30, p);
    lastPlatY = y;
  }
  while (lastPlatY > camY - VH) spawnAbove();

  buildLayers();
}


const keys = { left: false, right: false };
const pointers = new Map();

function isTypingTarget(el){
  if (!el) return false;
  const tag = (el.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el.isContentEditable;
}

function anyOverlayOpen(){
  const list = document.querySelectorAll ? document.querySelectorAll('.profileOverlay') : [];
  for (const o of list) if (!o.classList.contains('hidden')) return true;
  return false;
}
function closeAllOverlays(){
  const list = document.querySelectorAll ? document.querySelectorAll('.profileOverlay') : [];
  for (const o of list) o.classList.add('hidden');
}
function visibleEl(el){ return !!el && !el.classList.contains('hidden') && !(el.closest && el.closest('.hidden')); }
function stepBack(){
  const ovs = Array.from(document.querySelectorAll('.profileOverlay')).filter(o => !o.classList.contains('hidden'));
  if (ovs.length){
    const top = ovs[ovs.length - 1];
    const btn = top.querySelector('[id$="Close"], [id$="CloseBtn"], .backIconBtn, [aria-label="Закрыть"], [aria-label="Назад"]');
    if (btn && visibleEl(btn)) btn.click(); else top.classList.add('hidden');
    return true;
  }
  if (state === STATE.PLAY){ pauseGame(); return true; }
  const wb = document.getElementById('wardrobeBack');
  if (visibleEl(document.getElementById('wardrobe')) && wb){ wb.click(); return true; }
  const sb = document.getElementById('settingsBack');
  if (visibleEl(document.getElementById('settings')) && sb){ sb.click(); return true; }
  return false;
}
let backArmed = false;
function armBack(){
  if (backArmed) return;
  try { history.pushState({ cabbit: 1 }, ''); backArmed = true; } catch (e) {}
}
window.addEventListener('pointerdown', armBack);
window.addEventListener('popstate', () => {
  backArmed = false;
  let handled = false;
  try { handled = stepBack(); } catch (e) {}
  if (handled) armBack();
});
window.addEventListener('keydown', e => {
  if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
  if (state !== STATE.PLAY && anyOverlayOpen()) return;
  if (e.code === 'ArrowLeft'  || e.code === 'KeyA'){ keys.left = true;  e.preventDefault(); }
  if (e.code === 'ArrowRight' || e.code === 'KeyD'){ keys.right = true; e.preventDefault(); }
  if ((e.code === 'ArrowUp' || e.code === 'KeyW') && state === STATE.PLAY){ spearLunge(); e.preventDefault(); }
  if (e.code === 'Space'){ if (!e.repeat) tapEvent = true; if (state === STATE.MENU || state === STATE.OVER) startGame(); e.preventDefault(); }
  if (e.code === 'Escape'){
    if (state === STATE.PLAY) pauseGame();
    else if (state === STATE.PAUSED) resumeGame();
  }
}, { passive: false });

window.addEventListener('keyup', e => {
  if (isTypingTarget(e.target)) return;
  if (e.code === 'ArrowLeft'  || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

cvs.addEventListener('pointerdown', e => {
  if (cvs.setPointerCapture) cvs.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, e.clientX);
  tapEvent = true;
});
cvs.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e.clientX);
});
const dropPointer = e => pointers.delete(e.pointerId);
cvs.addEventListener('pointerup', dropPointer);
cvs.addEventListener('pointercancel', dropPointer);
cvs.addEventListener('pointerleave', dropPointer);
window.addEventListener('blur', () => { pointers.clear(); keys.left = keys.right = false; });

function inputDir(){
  if (monsterEvent) return 0; 
  let d = 0;
  if (keys.left)  d -= 1;
  if (keys.right) d += 1;
  if (d !== 0) return d;
  let sum = 0;
  pointers.forEach(px => { sum += (px < cssW / 2) ? -1 : 1; });
  return clamp(sum, -1, 1);
}


function stepPhysics(dt){
  const dir = inputDir();
  if (dir !== 0){
    hero.vx = clamp(hero.vx + dir * MOVE_ACC * dt, -MOVE_MAX, MOVE_MAX);
    hero.face = dir;
  } else {
    hero.vx *= Math.pow(AIR_DRAG, dt);
    if (Math.abs(hero.vx) < 4) hero.vx = 0;
  }

  const prevBottom = hero.y + hero.h * 0.5;

  hero.vy += GRAV * gravityMult() * dt;
  hero.x  += hero.vx * dt;
  hero.y  += hero.vy * dt;

  if (hero.x < -hero.w * 0.5) hero.x += VW + hero.w;
  else if (hero.x > VW + hero.w * 0.5) hero.x -= VW + hero.w;

  if (hero.vy <= 0) return; 

  const bottom = hero.y + hero.h * 0.5;
  const L = hero.x - hero.w * 0.26, R = hero.x + hero.w * 0.26;

  for (let i = 0; i < platforms.length; i++){
    const p = platforms[i];
    if (p.broken) continue;
    if (p.type === 'blink' && !blinkSolid(p)) continue;

    const top = p.y;
    if (prevBottom > top + 2) continue;
    if (bottom < top || bottom > top + p.h + 14) continue;

    const over = (R > p.x && L < p.x + p.w) ||
                 (R - VW - hero.w > p.x && L - VW - hero.w < p.x + p.w) ||
                 (R + VW + hero.w > p.x && L + VW + hero.w < p.x + p.w);
    if (!over) continue;

    if (p.type === 'broken'){
      p.broken = true;
      p.fallV  = 70;
      p.rot    = rand(-0.55, 0.55);
      burstShards(p);
      shake = Math.max(shake, 6);
      sfxBreak();
      hero.sx = 1.16; hero.sy = 0.86;
      return; 
    }

    hero.y = top - hero.h * 0.5;
    airJumps = hasDoubleJump() ? 1 : 0; 
    p.wobble = 1;
    hero.sx = 1.35; hero.sy = 0.66;

    if (p.type === 'cloud'){
      p.broken = true; p.fallV = 0; p.rot = 0; p.vanish = true;
      hero.vy = JUMP_V;
      burstSpark(hero.x, top, '#ffffff', 14, 1);
      landDust(hero.x, top);
      sfxLand();
      sfxPoof();
      return;
    }
    if (p.type === 'bouncy'){
      hero.vy = JUMP_V * 1.5;
      p.springC = 1;
      burstSpark(hero.x, top, '#ff9ad5', 18, 1.2);
      shake = Math.max(shake, 5);
      buzz(14);
      sfxSpring();
      return;
    }
    if (p.type === 'tele'){
      let dest = null;
      for (const q of platforms){
        if (q === p || q.broken || q.type === 'blink' || q.type === 'tele') continue;
        const dy = p.y - q.y;
        if (hasFruit('portal') ? (dy > 420 && (!dest || q.y < dest.y)) : (dy > 420 && dy < 900 && (!dest || q.y > dest.y))) dest = q;
      }
      burstSpark(hero.x, top, '#c9a8ff', 20, 1.3);
      if (dest){
        hero.x = dest.x + dest.w / 2;
        hero.y = dest.y - hero.h * 0.5;
        burstSpark(hero.x, dest.y, '#c9a8ff', 20, 1.3);
        flash = 0.45; flashColor = '#e6d6ff';
      }
      hero.vy = JUMP_V;
      buzz(20);
      if (typeof sfxPortalOpen === 'function') sfxPortalOpen();
      return;
    }
    if (p.spring){
      hero.vy = SPRING_V;
      p.springC = 1; p.springV = -9;
      burstSpark(hero.x, top, '#ffe07a', 22, 1.35);
      burstLeaves(hero.x, top, 1.4);
      shake = Math.max(shake, 9);
      flash = 0.5; flashColor = '#fff3c4';
      hitStop = 0.035;
      buzz(20);
      sfxSpring();
    } else {
      hero.vy = JUMP_V;
      burstLeaves(hero.x, top, 1);
      burstSpark(hero.x, top, landColors()[2], 8, 0.7);
      if (!lowGfx()) addParticle({ kind: 'ring', x: hero.x, y: top, vx: 0, vy: 0, life: 1, decay: 3.4, r: 4, color: landColors()[0] });
      landDust(hero.x, top);
      shake = Math.max(shake, 3);
      sfxLand();
    }
    return;
  }
}


function handleTapAction(){
  if (state !== STATE.PLAY || monsterEvent) return;
  if (hasBow() && !(hasDoubleJump() && airJumps > 0 && hero.vy > 0)){ shootArrow(); return; }
  if (hasDoubleJump() && airJumps > 0 && hero.vy > -140){
    airJumps--;
    hero.vy = JUMP_V * 0.95;
    hero.sx = 0.78; hero.sy = 1.3;
    burstSpark(hero.x, hero.y + hero.h * 0.4, '#bdeaff', 14, 0.9);
    burstSpark(hero.x, hero.y + hero.h * 0.4, '#ffffff', 6, 0.5);
    sfxJump();
  }
}

function spearLunge(){
  if (state !== STATE.PLAY || monsterEvent || !hasSpear() || !spearReady) return false;
  spearReady = false;
  spearCdLeft = SPEAR_CD;
  refreshSpearBtn();
  hero.vy = Math.min(hero.vy, SPEAR_V);
  hero.sx = 0.72; hero.sy = 1.38;
  burstSpark(hero.x, hero.y + hero.h * 0.4, '#dfe8ff', 16, 1.1);
  burstSpark(hero.x, hero.y - hero.h * 0.3, '#ffffff', 8, 0.7);
  shake = Math.max(shake, 4);
  buzz(18);
  ensureAudio();
  sfxSpear();
  return true;
}

function shootArrow(){
  if (shootCd > 0) return;
  shootCd = 1.1;

  
  let tx = hero.x, ty = hero.y - 300, bestD = 1e9;
  for (const cr of crawlers){
    if (cr.y > hero.y - 12) continue;
    const dx = cr.x - hero.x, dy = cr.y - hero.y;
    const d = dx * dx + dy * dy;
    if (d < bestD && d < 210 * 210){ bestD = d; tx = cr.x; ty = cr.y; }
  }

  const dx = tx - hero.x, dy = ty - hero.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const sp = 1150;
  arrows.push({
    x: hero.x, y: hero.y - 6,
    vx: dx / len * sp, vy: dy / len * sp,
    ang: Math.atan2(dy, dx)
  });
  ensureAudio();
  sfxArrow();
}


function updateWorld(dt){
  updateWorldFx(dt);
  updateWorldBanner(dt);
  updateTrail(dt);
  if (spearCdLeft > 0){
    spearCdLeft = Math.max(0, spearCdLeft - dt);
    if (spearCdLeft === 0) spearReady = true;
    const shown = Math.ceil(spearCdLeft);
    if (shown !== spearCdShown){ spearCdShown = shown; refreshSpearBtn(); }
  }
  const lead = clamp(-hero.vy / 1100, 0, 1);
  const camT = hero.y - VH * (0.45 + 0.1 * lead);
  if (camT < camTarget) camTarget = camT;
  speedFx = approach(speedFx, clamp((-hero.vy - 800) / 350, 0, 1), 6, dt);
  camY = approach(camY, camTarget, 13, dt);

  if (hero.y < minY) minY = hero.y;
  score = Math.max(0, Math.floor((startY - minY) / 10 * scoreMult()));

  
  
  const wIdx = worldIndex();
  if (wIdx !== lastWorldIdx){
    lastWorldIdx = wIdx;
    if (score > 100){
      showWorldBanner(wIdx);
      flash = 0.4; flashColor = '#ffffff';
    }
  }
  checkWorldMilestone();

  const stretch = clamp(-hero.vy / 1100, 0, 1);
  hero.sx = approach(hero.sx, 1 - stretch * 0.22, 11, dt);
  hero.sy = approach(hero.sy, 1 + stretch * 0.30, 11, dt);
  hero.tilt = approach(hero.tilt, (hero.vx / MOVE_MAX) * 0.20, 7, dt);
  hero.spin = approach(hero.spin, 0, 2.4, dt);

  if (hasHat('propeller'))
    hero.prop += (7 + clamp(-hero.vy, 0, 1200) * 0.016) * dt * 6;

  if (motionBlurOn){
    hero.ghosts.unshift({
      x: hero.x, y: hero.y, sx: hero.sx, sy: hero.sy,
      tilt: hero.tilt, face: hero.face, prop: hero.prop
    });
    if (hero.ghosts.length > 7) hero.ghosts.pop();
  }

  blurWanted = motionBlurOn ? clamp((Math.abs(hero.vy) - 330) / 1100, 0, 1) * 0.52 : 0;
  blurAmount = approach(blurAmount, blurWanted, 14, dt);

  if (hero.vy < -420 && Math.random() < dt * 22) trailPuff();

  
  for (let i = platforms.length - 1; i >= 0; i--){
    const p = platforms[i];

    if (p.type === 'moving' && !p.broken && !hasFruit('ice')){
      p.x += p.vx * dt;
      if (p.x < 4){ p.x = 4; p.vx = Math.abs(p.vx); }
      if (p.x + p.w > VW - 4){ p.x = VW - 4 - p.w; p.vx = -Math.abs(p.vx); }
    }
    if (p.broken && p.vanish){
      p.alpha -= dt * 3.2;
      p.y -= dt * 12;
    } else if (p.broken){
      p.fallV += GRAV * 0.6 * dt;
      p.y     += p.fallV * dt;
      p.alpha -= dt * 1.5;
    }
    if (p.type === 'blink' && !p.broken && hasFruit('ice')){ p.alpha = 1; p.blinkT = 0; }
    else if (p.type === 'blink' && !p.broken){
      p.blinkT = (p.blinkT || 0) + dt;
      const ph = p.blinkT % BLINK_PERIOD;
      p.alpha = ph < BLINK_ON ? 1 : (ph < BLINK_ON + 0.25 ? 1 - (ph - BLINK_ON) / 0.25 * 0.8 : (ph > BLINK_PERIOD - 0.25 ? 0.2 + (ph - (BLINK_PERIOD - 0.25)) / 0.25 * 0.8 : 0.2));
    }
    if (p.type === 'bouncy') p.springC = Math.max(0, (p.springC || 0) - dt * 4);
    if (p.spring){
      p.springV += (0 - p.springC) * 70 * dt;
      p.springV *= Math.pow(0.02, dt);
      p.springC  = clamp(p.springC + p.springV * dt, -0.3, 1);
    }
    p.wobble = Math.max(0, p.wobble - dt * 3.2);

    if (p.y - camY > VH + 90 || p.alpha <= 0) platforms.splice(i, 1);
  }

  let guard = 0;
  while (lastPlatY > camY - 140 && guard++ < 40) spawnAbove();
  updateFruits(dt);

  
  for (let i = coinsOnMap.length - 1; i >= 0; i--){
    const c = coinsOnMap[i];
    c.phase += dt * 3.2;
    c.bob   += dt * 2.4;

    if (c.plat){
      if (c.plat.broken) c.plat = null;
      else { c.x = c.plat.x + c.plat.w / 2; c.y = c.plat.y - 30; }
    }

    if (c.got > 0){
      c.got += dt * 3.4;
      if (c.got > 1) coinsOnMap.splice(i, 1);
      continue;
    }

    
    if (hasMagnet()){
      const mdx = hero.x - c.x, mdy = hero.y - c.y;
      const md2 = mdx * mdx + mdy * mdy;
      if (md2 < (hasFruit('magnet') ? 240 : 160) * (hasFruit('magnet') ? 240 : 160)){
        c.plat = null;
        const md = Math.sqrt(md2) || 1;
        c.x += (mdx / md) * 340 * dt;
        c.y += (mdy / md) * 340 * dt;
      }
    }

    const dx = c.x - hero.x, dy = (c.y + Math.sin(c.bob) * 4) - hero.y;
    if (dx * dx + dy * dy < 30 * 30){
      c.got = 0.01;

      const gain = coinMult();
      runCoins += gain; coins += gain;
      Store.set('coins', coins);
      coinPulse = 1;
      burstSpark(c.x, c.y, '#ffd34d', 14, 0.8);
      burstSpark(c.x, c.y, '#fff3b0', 8, 0.5);
      addToast('+' + gain, c.x + 14, c.y - 18, '#ffd34d');
      sfxCoin();
      continue;
    }
    if (c.y - camY > VH + 80) coinsOnMap.splice(i, 1);
  }

  
  for (let i = crawlers.length - 1; i >= 0; i--){
    const cr = crawlers[i];
    if (!cr.plat || cr.plat.broken){ crawlers.splice(i, 1); continue; }
    cr.x = cr.plat.x + cr.plat.w / 2;
    cr.y = cr.plat.y - 13;
    cr.phase += dt * 4;
    if (cr.y - camY > VH + 90){ crawlers.splice(i, 1); continue; }

    
    const cdx = cr.x - hero.x, cdy = cr.y - hero.y;
    if (hero.vy > 0 && cdx * cdx + cdy * cdy < 24 * 24){
      crawlers.splice(i, 1);
      burstPixels(cr.x, cr.y, ['#6be36b', '#2f8f2f', '#bff5a0']);
      shake = Math.max(shake, 12);
      handleFatalEvent();
      continue;
    }
  }

  
  shootCd = Math.max(0, shootCd - dt);

  if (hasBow() && shootCd <= 0 && state === STATE.PLAY && !monsterEvent){
    for (const cr of crawlers){
      if (cr.y > hero.y - 12) continue;
      const dxa = cr.x - hero.x, dya = cr.y - hero.y;
      if (dxa * dxa + dya * dya < 280 * 280){ shootArrow(); break; }
    }
  }
  for (let i = arrows.length - 1; i >= 0; i--){
    const a = arrows[i];
    a.vy += GRAV * 0.22 * dt;
    a.x  += a.vx * dt;
    a.y  += a.vy * dt;
    a.ang = Math.atan2(a.vy, a.vx);

    let hit = false;
    for (let j = crawlers.length - 1; j >= 0; j--){
      const cr = crawlers[j];
      const dx2 = cr.x - a.x, dy2 = cr.y - a.y;
      if (dx2 * dx2 + dy2 * dy2 < 20 * 20){
        crawlers.splice(j, 1);
        hit = true;
        burstPixels(cr.x, cr.y, ['#6be36b', '#2f8f2f', '#bff5a0', '#f7ffd6']);
        burstSpark(cr.x, cr.y, '#bff5a0', 12, 1);
        const bonus = 3 * coinMult();
        runCoins += bonus; coins += bonus;
        Store.set('coins', coins);
        coinPulse = 1;
        addToast('+' + bonus, cr.x, cr.y - 26, '#ffd34d');
        sfxCoin();
        shake = Math.max(shake, 5);
        break;
      }
    }

    if (hit || a.y - camY > VH + 60 || a.y < camY - VH * 1.5 || a.x < -50 || a.x > VW + 50)
      arrows.splice(i, 1);
  }


  if (monsters.length === 0 && !monsterEvent) monsterTimer -= dt;
  if (monsterTimer <= 0 && monsters.length < maxMonsters() && !monsterEvent && !boss){
    spawnMonster();
    monsterTimer = MONSTER_INTERVAL;
  }

  for (let i = monsters.length - 1; i >= 0; i--){
    const m = monsters[i];

    if (!m.frozen){
      m.bob += dt * 3;
      const mw = (m.w != null ? m.w : worldIndex()) % 5;
      const spd = [1, 0.8, 1, 0.55, 1 + 0.9 * Math.max(0, Math.sin(m.bob * 0.6))][mw];
      m.x += m.vx * dt * spd * (hasFruit('ice') ? 0.3 : 1);
      if (m.x < m.r) { m.x = m.r; m.vx = Math.abs(m.vx); }
      if (m.x > VW - m.r) { m.x = VW - m.r; m.vx = -Math.abs(m.vx); }

      
      
      m.screenFrac = approach(m.screenFrac, m.targetFrac, 2.2, dt);
      const oy = mw === 0 ? Math.sin(m.bob * 0.8) * 24
        : mw === 1 ? Math.sin(m.bob * 0.4) * 6
        : mw === 2 ? -Math.abs(Math.sin(m.bob * 1.1)) * 28
        : mw === 3 ? Math.sin(m.bob * 0.6) * 4
        : Math.sin(m.bob * 1.6) * 9;
      m.y = camY + VH * m.screenFrac + oy;

      if (Math.random() < dt * 10){
        addParticle({
          kind: 'spark', x: m.x + rand(-14, 14), y: m.y + m.r * 0.7,
          vx: rand(-12, 12), vy: rand(20, 50),
          life: 1, decay: rand(1.4, 2.2), r: rand(1.4, 3),
          color: pick([WORLD_THEMES[mw].monster.light, WORLD_THEMES[mw].monster.dark, WORLD_THEMES[mw].monster.spike])
        });
      }

      if (!monsterEvent){
        const dx = m.x - hero.x, dy = m.y - hero.y;
        const hitDist = m.r + hero.w * 0.32;
        if (dx * dx + dy * dy < hitDist * hitDist && hero.vy > 0){
          startMonsterEvent(m);
        }
      }

      m.life -= dt;
      if (m.life <= 0) { removeMonster(m); continue; }
    }
  }

  updateBoss(dt);
  for (let i = particles.length - 1; i >= 0; i--){
    const q = particles[i];
    q.life -= q.decay * dt;
    if (q.life <= 0){ particles.splice(i, 1); continue; }
    if (q.kind === 'leaf' || q.kind === 'shard' || q.kind === 'pixel'){
      q.vy += GRAV * 0.35 * dt;
      q.rot += q.spin * dt;
    } else if (q.kind === 'spark'){
      q.vy += GRAV * 0.12 * dt;
      q.vx *= Math.pow(0.15, dt);
    } else if (q.kind === 'ring'){
      q.r += dt * 140; 
    } else {
      q.vx *= Math.pow(0.25, dt);
      q.r  += dt * 9;
    }
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }

  
  for (let i = toasts.length - 1; i >= 0; i--){
    const tst = toasts[i];
    tst.life -= dt * 0.7;
    tst.y -= dt * 26;
    if (tst.life <= 0) toasts.splice(i, 1);
  }

  shake  = Math.max(0, shake - dt * 26);
  shakeX = rand(-shake, shake);
  shakeY = rand(-shake, shake);
  flash  = Math.max(0, flash - dt * 2.2);
  coinPulse = Math.max(0, coinPulse - dt * 2.4);
  maceSwing = Math.max(0, maceSwing - dt * 3.1);

  updateLasers(dt);
  if (state !== STATE.PLAY){ tapEvent = false; return; }

  if (hero.vy > 120 && hero.y - camY > VH * 0.6 && heroDoomed()){
    handleFatalEvent();
    tapEvent = false;
    return;
  }

  if (!fallSoundPlayed && hero.y - camY > VH){
    fallSoundPlayed = true;
    sfxOver();
  }
  if (hero.y - camY > VH + 70) handleFatalEvent();

  tapEvent = false;
}
