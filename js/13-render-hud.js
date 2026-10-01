"use strict";
function drawArrows(){
  const c = ctx;
  for (const a of arrows){
    const y = a.y - camY;
    if (y < -60 || y > VH + 60) continue;
    c.save();
    c.translate(a.x, y);
    c.rotate(a.ang);
    c.lineCap = 'round';
    c.strokeStyle = '#e8d9a0';
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(6, 0); c.stroke();
    c.fillStyle = '#ffd34d';
    c.beginPath(); c.moveTo(13, 0); c.lineTo(4, -4.2); c.lineTo(4, 4.2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,240,180,.6)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-15, 0); c.lineTo(-19, -4);
    c.moveTo(-15, 0); c.lineTo(-19, 4);
    c.stroke();
    c.restore();
  }
}


function drawParticles(){
  for (const q of particles){
    const y = q.y - camY;
    if (y < -40 || y > VH + 40) continue;
    const a = clamp(q.life, 0, 1);

    if (q.kind === 'leaf' || q.kind === 'shard' || q.kind === 'pixel'){
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(q.x, y);
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      if (q.kind === 'leaf'){
        ctx.beginPath();
        ctx.ellipse(0, 0, q.r, q.r * 0.52, 0, 0, 6.2832);
        ctx.fill();
      } else if (q.kind === 'shard'){
        ctx.beginPath();
        ctx.moveTo(-q.r, -q.r * 0.55);
        ctx.lineTo(q.r, -q.r * 0.2);
        ctx.lineTo(q.r * 0.35, q.r * 0.85);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-q.r * 0.5, -q.r * 0.5, q.r, q.r);
      }
      ctx.restore();
    } else if (q.kind === 'spark'){
      ctx.globalAlpha = a;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, y, q.r * a, 0, 6.2832);
      ctx.fill();
    } else if (q.kind === 'ring'){
      ctx.globalAlpha = a * 0.8;
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 3 * a;
      ctx.beginPath();
      ctx.arc(q.x, y, Math.max(0, q.r), 0, 6.2832);
      ctx.stroke();
    } else {
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, y, q.r * (1.1 - a * 0.3), 0, 6.2832);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawToasts(){
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px ' + GAME_FONT;
  ctx.lineJoin = 'round';
  for (const tst of toasts){
    const y = tst.y - camY;
    ctx.globalAlpha = clamp(tst.life, 0, 1);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(21,10,43,.7)';
    ctx.strokeText(tst.text, tst.x, y);
    ctx.fillStyle = tst.color;
    ctx.fillText(tst.text, tst.x, y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}


function drawHUD(){
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';

  ctx.font = '34px ' + GAME_FONT;
  ctx.lineWidth = 6;
  ctx.strokeStyle = uiStyle === 'paper' ? 'rgba(255,255,255,.9)' : uiStyle === 'aero' ? 'rgba(8,66,110,.75)' : 'rgba(21,10,43,.6)';
  ctx.fillStyle = uiStyle === 'paper' ? '#243b8c' : '#fdf6e8';
  ctx.strokeText(String(score), 18, 18);
  ctx.fillText(String(score), 18, 18);

  ctx.font = '15px ' + GAME_FONT;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 4;
  const bl = t('scoreWord') + ' ' + Math.max(best, score);
  ctx.strokeText(bl, 19, 58);
  ctx.fillText(bl, 19, 58);

  ctx.globalAlpha = 1;

  const s = 1 + coinPulse * 0.25;
  ctx.save();
  ctx.translate(VW - 26, 32);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(-9, -9, 9, 9);
  g.addColorStop(0, '#fff0a8');
  g.addColorStop(0.5, '#ffc42e');
  g.addColorStop(1, '#e09a10');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, 6.2832);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, 6.2832);
  ctx.stroke();
  ctx.restore();

  ctx.font = '22px ' + GAME_FONT;
  ctx.textAlign = 'right';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(21,10,43,.6)';
  ctx.fillStyle = '#ffd34d';
  ctx.strokeText(String(runCoins), VW - 42, 21);
  ctx.fillText(String(runCoins), VW - 42, 21);
  drawFruitHud();

  ctx.restore();
}


function drawMonsterEventUI(){
  if (!monsterEvent) return;

  const remain = Math.max(0, QTE_DURATION - monsterEvent.elapsed);
  const frac = remain / QTE_DURATION;
  const cx = VW / 2, cy = VH * 0.34;
  const urgent = remain < 5;

  ctx.save();
  ctx.fillStyle = 'rgba(10,5,20,.26)';
  ctx.fillRect(0, 0, VW, VH);

  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, 6.2832);
  ctx.stroke();

  ctx.strokeStyle = urgent ? '#ff6f91' : '#b268ff';
  ctx.beginPath();
  ctx.arc(cx, cy, 42, -Math.PI / 2, -Math.PI / 2 + frac * 6.2832);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '28px ' + GAME_FONT;
  ctx.fillStyle = urgent ? '#ff6f91' : '#fff';
  ctx.fillText(Math.ceil(remain), cx, cy);

  const barW = Math.min(260, VW * 0.72), barH = 20;
  const barX = cx - barW / 2, barY = cy + 118;
  const inPerfectZone = monsterEvent.barPos >= monsterEvent.zoneStart && monsterEvent.barPos <= monsterEvent.zoneEnd;

  ctx.save();
  ctx.fillStyle = 'rgba(10,5,20,.55)';
  rr(ctx, barX, barY, barW, barH, 10);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  rr(ctx, barX, barY, barW, barH, 10);
  ctx.stroke();

  const zoneX = barX + monsterEvent.zoneStart * barW;
  const zoneW = (monsterEvent.zoneEnd - monsterEvent.zoneStart) * barW;
  ctx.fillStyle = '#ffe37a';
  rr(ctx, zoneX, barY, zoneW, barH, 6);
  ctx.fill();

  const markerX = barX + monsterEvent.barPos * barW;
  ctx.fillStyle = inPerfectZone ? '#ffffff' : '#ff6f91';
  ctx.beginPath();
  ctx.moveTo(markerX, barY - 8);
  ctx.lineTo(markerX - 7, barY - 20);
  ctx.lineTo(markerX + 7, barY - 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(markerX - 2.2, barY - 2, 4.4, barH + 4);
  ctx.restore();

  const pulse = 0.86 + 0.16 * Math.sin(performance.now() / 130);
  ctx.save();
  ctx.translate(cx, cy + 76);
  ctx.scale(pulse, pulse);
  ctx.font = '32px ' + GAME_FONT;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(21,10,43,.7)';
  ctx.strokeText(t('tapPrompt'), 0, 0);
  ctx.fillStyle = '#ffd34d';
  ctx.fillText(t('tapPrompt'), 0, 0);
  ctx.restore();

  ctx.restore();
}


function render(){
  pixelTransform();
  ctx.globalAlpha = 1;

  worldTransform();
  ctx.save();
  drawBackground();
  ctx.restore();

  if (blurAmount > 0.01 && motionBlurOn && !lowGfx()){
    pixelTransform();
    ctx.globalAlpha = blurAmount;
    ctx.drawImage(blurCvs, 0, 0);
    ctx.globalAlpha = 1;
  }

  worldTransform();
  drawWeather();
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawShadows();
  const sq = ctx.imageSmoothingQuality;
  ctx.imageSmoothingQuality = 'low';
  for (const p of platforms) drawPlatform(p);
  for (const c of coinsOnMap) drawCoin(c);
  ctx.imageSmoothingQuality = sq;
  drawFruitPickups();
  for (const m of monsters) drawMonster(m);
  drawBoss();
  for (const cr of crawlers) drawCrawler(cr);
  drawLasers();
  drawArrows();
  drawParticles();
  drawBolts();
  drawDeathPortal();
  drawTrail();
  drawHeroWithWrap();
  drawFruitAura();
  drawToasts();
  ctx.restore();
  drawSpeedLines();

  if (flash > 0.01){
    ctx.globalAlpha = flash * 0.35;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalAlpha = 1;
  }

  if (motionBlurOn && !lowGfx() && (blurAmount > 0.01 || blurWanted > 0.01)){
    pixelTransform();
    blurCtx.setTransform(1, 0, 0, 1, 0, 0);
    blurCtx.clearRect(0, 0, blurCvs.width, blurCvs.height);
    blurCtx.drawImage(cvs, 0, 0);
  }

  if (OX > 0.5) drawSideCurtains();
  worldTransform();
  if (state === STATE.PLAY || state === STATE.DYING){ drawWorldBanner(); drawHUD(); drawBossHud(); }
  if (state === STATE.PLAY) drawMonsterEventUI();
}

function drawSideCurtains(){
  pixelTransform();
  const px = Math.round(OX * DPR), colW = Math.round(VW * S * DPR);
  const H = cvs.height;
  const cache = bgCacheCvs;
  if (cache && cache.width === cvs.width){
    ctx.drawImage(cache, 0, 0, px, H, 0, 0, px, H);
    ctx.drawImage(cache, px + colW, 0, cvs.width - px - colW, H, px + colW, 0, cvs.width - px - colW, H);
  }
  ctx.globalAlpha = uiStyle === 'paper' || uiStyle === 'aero' ? 0.12 : 0.32;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, px, H);
  ctx.fillRect(px + colW, 0, cvs.width - px - colW, H);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = uiStyle === 'paper' ? '#243b8c' : '#ffffff';
  ctx.fillRect(px - Math.round(DPR), 0, Math.round(DPR), H);
  ctx.fillRect(px + colW, 0, Math.round(DPR), H);
  ctx.globalAlpha = 1;
}


let last = performance.now(), acc = 0;
let perfSampleSum = 0, perfSampleCount = 0;
const PERF_SAMPLE_FRAMES = 90;
const PERF_SLOW_FRAME = 1 / 42;
const PERF_FAST_FRAME = 1 / 56;

let perfGoodRuns = 0, autoDprFail = 9;
function setAutoDpr(v){
  v = Math.round(clamp(v, AUTO_DPR_MIN, AUTO_DPR_MAX) * 100) / 100;
  if (v === autoDprCap) return false;
  autoDprCap = v;
  Store.set('autoDpr', v);
  applyGfxChange();
  return true;
}
function trackPerformance(realDt){
  if (gfxMode !== 'auto' || autoLowGfx || state !== STATE.PLAY || monsterEvent){
    perfSampleSum = 0; perfSampleCount = 0;
    return;
  }
  if (realDt <= 0 || realDt >= 0.09) return;
  perfSampleSum += realDt;
  perfSampleCount++;
  if (perfSampleCount < PERF_SAMPLE_FRAMES) return;
  const avg = perfSampleSum / perfSampleCount;
  perfSampleSum = 0; perfSampleCount = 0;
  if (avg > PERF_SLOW_FRAME){
    perfGoodRuns = 0;
    autoDprFail = Math.min(autoDprFail, autoDprCap);
    if (DPR > AUTO_DPR_MIN + 0.01 && setAutoDpr(Math.min(autoDprCap, DPR) - 0.25)) return;
    autoLowGfx = true;
    applyGfxChange();
    return;
  }
  if (avg < PERF_FAST_FRAME){
    perfGoodRuns++;
    const next = autoDprCap + 0.25;
    if (perfGoodRuns >= 4 && next < autoDprFail - 0.01 && (window.devicePixelRatio || 1) > autoDprCap + 0.01){
      perfGoodRuns = 0;
      setAutoDpr(next);
    }
  } else perfGoodRuns = 0;
}

function applyGfxChange(){
  resize();
  wakeScene(600);
  bgCacheKey = '';
  const vig = document.getElementById('vignette');
  if (vig) vig.classList.toggle('off', lowGfx());
  if (typeof refreshGfxRow === 'function') refreshGfxRow();
}

function setGfxMode(mode){
  if (GFX_MODES.indexOf(mode) === -1) return;
  gfxMode = mode;
  Store.set('gfxMode', mode);
  if (mode !== 'auto') autoLowGfx = false;
  perfSampleSum = 0; perfSampleCount = 0;
  applyGfxChange();
}


function wakeScene(ms){
  sceneFullUntil = Math.max(sceneFullUntil, performance.now() + (ms || IDLE_FULL_MS));
}

function sceneNeedsRender(now){
  if (state !== sceneState){ sceneState = state; wakeScene(); }
  if (state === STATE.PLAY || state === STATE.DYING) return true;
  if (now < sceneFullUntil) return true;
  if (now - lastIdleRender >= IDLE_RENDER_MS){ lastIdleRender = now; return true; }
  return false;
}

let lastRenderAt = -1e9;
function frame(now){
  requestAnimationFrame(frame);
  let realDt = (now - last) / 1000 * PERF_OK;
  last = now;
  trackPerformance(realDt);
  if (!(realDt > 0)) realDt = 0;
  else if (realDt > 0.1) realDt = 0.1;

  if (state === STATE.PLAY){
    let dt = realDt;

    if (monsterEvent){
      monsterEvent.elapsed += realDt;
      dt = realDt * SLOWMO_SCALE;

      monsterEvent.barPos += monsterEvent.barDir * monsterEvent.barSpeed * realDt;
      if (monsterEvent.barPos >= 1){ monsterEvent.barPos = 1; monsterEvent.barDir = -1; }
      else if (monsterEvent.barPos <= 0){ monsterEvent.barPos = 0; monsterEvent.barDir = 1; }

      if (tapEvent) resolveMonsterEvent(true);
      else if (monsterEvent.elapsed >= QTE_DURATION) resolveMonsterEvent(false);
    } else if (tapEvent){
      handleTapAction();
    }

    if (hitStop > 0){ hitStop -= realDt; dt = 0; }

    acc += dt;
    let steps = 0;
    while (acc >= FIXED_DT && steps < 8){
      stepPhysics(FIXED_DT);
      acc -= FIXED_DT;
      steps++;
    }
    if (steps === 8) acc = 0;
    updateWorld(dt);
  } else if (state !== STATE.PAUSED) {
    if (state === STATE.DYING) updateDeathPortal(realDt);
    flash = Math.max(0, flash - realDt * 2.2);
    shake = Math.max(0, shake - realDt * 30);
    camY = approach(camY, camTarget, 6, realDt);
    blurAmount = approach(blurAmount, 0, 8, realDt);
    for (let i = particles.length - 1; i >= 0; i--){
      const q = particles[i];
      q.life -= q.decay * realDt;
      if (q.life <= 0){ particles.splice(i, 1); continue; }
      q.x += q.vx * realDt; q.y += q.vy * realDt;
    }
    if (state === STATE.DYING){ shakeX = rand(-shake, shake); shakeY = rand(-shake, shake); }
    else shakeX = shakeY = 0;
  }

  if (sceneNeedsRender(now) && (now - lastRenderAt >= 15 || now < lastRenderAt)){ lastRenderAt = now; render(); }
  tapEvent = false;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden){ last = performance.now(); acc = 0; ensureAmbient(); }
  else { if (state === STATE.PLAY) pauseGame(); stopAmbient(); }
});

const rotateOverlayEl = document.getElementById('rotateOverlay');
let inLandscape = false;
function checkOrientation(){
  const scr = window.screen || {};
  const shortSide = Math.min(scr.width || window.innerWidth, scr.height || window.innerHeight);
  const landscape = isTouchDevice && window.innerWidth > window.innerHeight && shortSide < 520;
  if (landscape){
    if (state === STATE.PLAY) pauseGame();
    if (rotateOverlayEl) rotateOverlayEl.classList.remove('hidden');
    inLandscape = true;
  } else {
    if (rotateOverlayEl) rotateOverlayEl.classList.add('hidden');
    if (inLandscape){ last = performance.now(); acc = 0; }
    inLandscape = false;
    resize();
  }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 120));
checkOrientation();
