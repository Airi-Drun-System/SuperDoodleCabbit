"use strict";
const bgCacheCvs = document.createElement('canvas');
let bgCacheKey = '';
function getBgCache(w0){
  const w = skyOf(w0);
  const withGlow = !lowGfx();
  const key = w.bg1.join(',') + '|' + w.bg2.join(',') + '|' + w.glow + '|' + cvs.width + 'x' + cvs.height + '|' + withGlow + '|' + uiStyle;
  if (key === bgCacheKey) return bgCacheCvs;
  bgCacheKey = key;
  bgCacheCvs.width = cvs.width;
  bgCacheCvs.height = cvs.height;
  const b = bgCacheCvs.getContext('2d', { alpha: false });
  b.setTransform(S * DPR, 0, 0, S * DPR, OX * DPR, 0);
  const XL = -OX / S, XW = cssW / S;
  const g = b.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, 'rgb(' + w.bg1[0] + ',' + w.bg1[1] + ',' + w.bg1[2] + ')');
  g.addColorStop(1, 'rgb(' + w.bg2[0] + ',' + w.bg2[1] + ',' + w.bg2[2] + ')');
  b.fillStyle = g;
  b.fillRect(XL, 0, XW, VH);
  if (withGlow){
    const gl = b.createRadialGradient(VW * 0.5, VH * 1.05, 20, VW * 0.5, VH * 1.05, VH * 0.85);
    gl.addColorStop(0, w.glow);
    gl.addColorStop(1, w.glow.replace(/,[.\d]+\)$/, ',0)'));
    b.fillStyle = gl;
    b.fillRect(XL, 0, XW, VH);
  }
  if (uiStyle === 'aero'){
    const sun = b.createRadialGradient(VW * 0.12, VH * 0.02, 4, VW * 0.12, VH * 0.02, VH * 0.5);
    sun.addColorStop(0, 'rgba(255,255,255,.95)');
    sun.addColorStop(0.18, 'rgba(255,255,235,.5)');
    sun.addColorStop(0.5, 'rgba(190,240,255,.12)');
    sun.addColorStop(1, 'rgba(190,240,255,0)');
    b.fillStyle = sun;
    b.fillRect(XL, 0, XW, VH);
    b.save();
    b.translate(VW * 0.12, VH * 0.02);
    for (let i = 0; i < 4; i++){
      b.rotate(0.28);
      const rg = b.createLinearGradient(0, 0, VH * 0.9, 0);
      rg.addColorStop(0, 'rgba(255,255,255,.28)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      b.fillStyle = rg;
      b.fillRect(0, -6 - i * 2, VH * 0.9, 12 + i * 4);
    }
    b.restore();
  } else if (uiStyle === 'neon'){
    const hy = VH * 0.72;
    const sunG = b.createLinearGradient(0, hy - 150, 0, hy);
    sunG.addColorStop(0, '#ffe14d');
    sunG.addColorStop(1, '#ff4fd8');
    b.fillStyle = sunG;
    b.globalAlpha = 0.55;
    b.beginPath();
    b.arc(VW / 2, hy, 110, Math.PI, 0);
    b.fill();
    b.globalAlpha = 1;
    b.fillStyle = 'rgb(' + w.bg2.join(',') + ')';
    for (let i = 0; i < 6; i++) b.fillRect(VW / 2 - 120, hy - 12 - i * 16, 240, 2 + i * 0.8);
    b.fillStyle = 'rgba(10,0,24,.85)';
    b.fillRect(XL, hy, XW, VH - hy);
    b.strokeStyle = 'rgba(57,243,255,.45)';
    b.lineWidth = 1;
    for (let i = -10; i <= 10; i++){
      b.beginPath();
      b.moveTo(VW / 2 + i * 22, hy);
      b.lineTo(VW / 2 + i * 120, VH);
      b.stroke();
    }
    for (let k = 1; k < 9; k++){
      const yy = hy + Math.pow(k / 8, 1.8) * (VH - hy);
      b.globalAlpha = 0.25 + k * 0.05;
      b.beginPath();
      b.moveTo(XL, yy);
      b.lineTo(XL + XW, yy);
      b.stroke();
    }
    b.globalAlpha = 1;
    b.strokeStyle = 'rgba(255,79,216,.8)';
    b.lineWidth = 2;
    b.beginPath();
    b.moveTo(XL, hy);
    b.lineTo(XL + XW, hy);
    b.stroke();
  }
  return bgCacheCvs;
}

function drawBackground(){
  const styleBg = STYLE_BG[uiStyle];
  const themed = !styleBg && bgTheme !== 'auto' && BG_THEMES[bgTheme];
  const w = styleBg || (themed ? BG_THEMES[bgTheme] : currentWorld());
  const cache = getBgCache(w);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(cache, 0, 0);
  if (!styleBg && !themed && worldFx.prev >= 0 && worldFx.k < 1){
    ctx.globalAlpha = 1 - worldFx.k;
    ctx.drawImage(worldGrad(worldFx.prev), 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (uiStyle === 'paper'){
    const gap = 26;
    const off = ((-camY * 0.5) % gap + gap) % gap;
    ctx.strokeStyle = 'rgba(110,150,220,.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = off; y < VH; y += gap){ ctx.moveTo(-OX / S, y); ctx.lineTo(VW + OX / S, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,90,90,.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(34, 0); ctx.lineTo(34, VH);
    ctx.stroke();
    return;
  }

  const time = performance.now() / 1000;
  const low = lowGfx();
  const reps = Math.ceil(VH / BAND) + 2;

  for (const L of layers){
    const off = ((-camY * L.factor) % BAND + BAND) % BAND;
    for (let ii = 0; ii < L.items.length; ii++){
      if (low && L.kind === 0 && (ii % 3) !== 0) continue;
      const it = L.items[ii];
      for (let k = -1; k < reps; k++){
        const y = it.y + off + k * BAND;
        if (y < -120 || y > VH + 120) continue;

        if (L.kind === 0 && uiStyle === 'aero'){
          if (ii % 2) continue;
          const br = it.r * 4 + 4;
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = 'rgba(255,255,255,.85)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(it.x, y, br, 0, 6.2832);
          ctx.stroke();
          ctx.fillStyle = 'rgba(200,240,255,.18)';
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(it.x - br * 0.35, y - br * 0.38, br * 0.22, 0, 6.2832);
          ctx.fill();
        } else if (L.kind === 0){
          ctx.globalAlpha = it.a * (0.55 + 0.45 * Math.sin(time * 2 + it.tw));
          ctx.fillStyle = uiStyle === 'neon' ? (ii % 2 ? '#ff9ff5' : '#8ff6ff') : '#fff6d8';
          ctx.beginPath();
          ctx.arc(it.x, y, it.r, 0, 6.2832);
          ctx.fill();
        } else if (L.kind === 1 || L.kind === 2){
          if (uiStyle === 'neon') continue;
          const lightSky = worldLight && uiStyle === 'classic';
          ctx.globalAlpha = (uiStyle === 'aero' || lightSky) ? Math.min(0.85, it.a * (lightSky ? 3 : 2.2)) : it.a;
          ctx.fillStyle = (uiStyle === 'aero' || lightSky) ? '#ffffff' : ((L.kind === 1) ? '#b79bff' : '#ffd9f0');
          ctx.beginPath();
          ctx.ellipse(it.x, y, it.r, it.r * 0.44, 0, 0, 6.2832);
          ctx.ellipse(it.x - it.r * 0.5, y + it.r * 0.1, it.r * 0.6, it.r * 0.34, 0, 0, 6.2832);
          ctx.ellipse(it.x + it.r * 0.55, y + it.r * 0.06, it.r * 0.55, it.r * 0.3, 0, 0, 6.2832);
          ctx.fill();
        } else {
          if (uiStyle === 'neon' || (sceneryEnabled() && worldFx.cur % 5 !== 0)) continue;
          ctx.globalAlpha = it.a;
          ctx.save();
          ctx.translate(it.x, y);
          ctx.rotate(it.rot + time * it.spin * 0.4);
          ctx.fillStyle = '#7fe06b';
          ctx.beginPath();
          ctx.ellipse(0, 0, it.r, it.r * 0.5, 0, 0, 6.2832);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
  ctx.globalAlpha = 1;
  drawScenery();
}

const SCN_T = 900;
const scnCache = {};
const platSkinCache = {};
const worldFx = { cur: 0, prev: -1, k: 1 };

function scnRes(){ return Math.min(2, Math.max(1, S * DPR)); }
function mixRgb(a, b, k, m){ return 'rgb(' + [0, 1, 2].map(i => Math.round((a[i] + (b[i] - a[i]) * k) * (m || 1))).join(',') + ')'; }
function scnPeriodic(y, seed, amps){
  let v = 0;
  for (let i = 0; i < amps.length; i++) v += amps[i][0] * Math.sin(6.2832 * amps[i][1] * y / SCN_T + seed * (i + 1) * 1.7);
  return v;
}
function scnWallPath(g, side, base, amps, seed, step){
  g.beginPath();
  const edge = side < 0 ? -40 : VW + 40;
  g.moveTo(edge, -4);
  for (let y = -4; y <= SCN_T + 4; y += step || 6){
    let d = base + scnPeriodic(y, seed, amps);
    const x = side < 0 ? d : VW - d;
    g.lineTo(x, y);
  }
  g.lineTo(edge, SCN_T + 4);
  g.closePath();
}
function scnEach(n, seed, fn){
  for (let i = 0; i < n; i++){
    const y = hash01(i, seed) * SCN_T;
    for (const off of [-SCN_T, 0, SCN_T]) fn(i, y + off, hash01(i, seed + 1), hash01(i, seed + 2));
  }
}

function buildSceneryTile(w, depth){
  const R = scnRes();
  const c = document.createElement('canvas');
  c.width = Math.ceil(VW * R);
  c.height = Math.ceil(SCN_T * R);
  const g = c.getContext('2d');
  g.scale(R, R);
  const th = WORLD_THEMES[w];
  const near = depth === 1;
  const body = near ? mixRgb(th.bg1, [0, 0, 0], 0.35) : mixRgb(th.bg1, th.bg2, 0.32);
  g.globalAlpha = near ? 0.96 : 0.55;
  const wi = w % 5;
  if (wi === 4){
    g.globalAlpha = 1;
    if (!near){
      const neb = [['rgba(170,90,255,', 150], ['rgba(80,140,255,', 130], ['rgba(255,90,190,', 110]];
      scnEach(5, 91, (i, y, a, b) => {
        const n = neb[i % 3];
        const x = a * VW;
        const gr = g.createRadialGradient(x, y, 4, x, y, n[1]);
        gr.addColorStop(0, n[0] + '.22)');
        gr.addColorStop(1, n[0] + '0)');
        g.fillStyle = gr;
        g.fillRect(x - n[1], y - n[1], n[1] * 2, n[1] * 2);
      });
      scnEach(3, 71, (i, y, a, b) => {
        const x = 30 + a * (VW - 60), r = 8 + b * 16;
        const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
        gr.addColorStop(0, ['#b8c8ff', '#ffc9a8', '#c8ffd8'][i % 3]);
        gr.addColorStop(1, ['#3a3a7a', '#7a3a2a', '#2a6a4a'][i % 3]);
        g.globalAlpha = 0.55;
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      });
    } else {
      scnEach(2, 83, (i, y, a, b) => {
        const x = i ? VW - 20 - b * 30 : 20 + b * 30, r = 34 + a * 22;
        const cols = i ? ['#ffd9a8', '#b0552a'] : ['#c9b8ff', '#4a3a9a'];
        g.globalAlpha = 0.85;
        const gr = g.createRadialGradient(x - r * 0.45, y - r * 0.45, 2, x, y, r);
        gr.addColorStop(0, cols[0]);
        gr.addColorStop(1, cols[1]);
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.45)';
        g.lineWidth = 3;
        g.beginPath(); g.ellipse(x, y, r * 1.7, r * 0.38, -0.3, 0.25, 6.03); g.stroke();
      });
      scnEach(9, 87, (i, y, a, b) => {
        const x = a < 0.5 ? a * 70 : VW - (a - 0.5) * 70, r = 3 + b * 6;
        g.globalAlpha = 0.7;
        g.fillStyle = '#4a4466';
        g.beginPath(); g.ellipse(x, y, r * 1.3, r, a * 6, 0, 6.2832); g.fill();
      });
    }
    return c;
  }
  const P = {
    0: { base: near ? 34 : 70, amps: [[16, 3], [9, 7], [5, 13]], step: 6 },
    1: { base: near ? 30 : 64, amps: [[14, 2], [10, 9], [6, 17]], step: 18 },
    2: { base: near ? 36 : 72, amps: [[12, 2], [8, 5]], step: 22 },
    3: { base: near ? 30 : 62, amps: [[18, 2], [7, 6], [4, 11]], step: 8 }
  }[wi];
  for (const side of [-1, 1]){
    g.fillStyle = body;
    scnWallPath(g, side, P.base, P.amps, side * 3 + depth + w, P.step);
    g.fill();
    const edgeX = (y) => { const d = P.base + scnPeriodic(y, side * 3 + depth + w, P.amps); return side < 0 ? d : VW - d; };
    if (wi === 0){
      scnEach(near ? 7 : 5, 11 + side + depth * 5, (i, y, a, b) => {
        const x = edgeX(y) + side * -6, r = 18 + a * (near ? 26 : 20);
        g.fillStyle = body;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.arc(x - side * r * 0.7, y + r * 0.3, r * 0.7, 0, 6.2832); g.fill();
        if (near && b < 0.7){
          g.strokeStyle = body; g.lineWidth = 2;
          const len = 40 + b * 70;
          g.beginPath(); g.moveTo(x - side * r * 0.9, y); g.quadraticCurveTo(x - side * (r + 10), y + len * 0.5, x - side * (r + 2), y + len); g.stroke();
          g.fillStyle = mixRgb(th.bg1, [120, 200, 110], 0.35);
          for (let k = 1; k < 5; k++){ g.beginPath(); g.ellipse(x - side * (r + 6), y + len * k / 5, 4, 2.2, side * 0.6, 0, 6.2832); g.fill(); g.fillStyle = body; }
        }
      });
    } else if (wi === 1){
      scnEach(near ? 8 : 6, 21 + side + depth * 5, (i, y, a, b) => {
        const x = edgeX(y), L = 16 + a * (near ? 34 : 24), wd = 7 + b * 7;
        g.fillStyle = near ? mixRgb(th.bg2, [220, 250, 255], 0.35) : body;
        g.beginPath(); g.moveTo(x, y - wd); g.lineTo(x - side * L, y + (b - 0.5) * 10); g.lineTo(x, y + wd); g.closePath(); g.fill();
        if (near){ g.strokeStyle = 'rgba(230,250,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - wd); g.lineTo(x - side * L, y + (b - 0.5) * 10); g.stroke(); }
      });
      if (near){
        g.globalAlpha = 0.5;
        g.strokeStyle = 'rgba(210,245,255,.9)';
        g.lineWidth = 1.5;
        scnWallPath(g, side, P.base, P.amps, side * 3 + depth + w, P.step);
        g.stroke();
        g.globalAlpha = 0.96;
      }
    } else if (wi === 2){
      if (near){
        g.save();
        scnWallPath(g, side, P.base, P.amps, side * 3 + depth + w, P.step);
        g.clip();
        g.shadowColor = '#ff7a2a';
        g.shadowBlur = 8;
        g.strokeStyle = '#ff9a3c';
        g.lineWidth = 1.8;
        scnEach(9, 31 + side, (i, y, a, b) => {
          const x0 = side < 0 ? 2 + a * 20 : VW - 2 - a * 20;
          g.beginPath(); g.moveTo(x0, y);
          let x = x0, yy = y;
          for (let k = 0; k < 4; k++){ x += side * -(4 + hash01(i * 7 + k, 5) * 8); yy += 8 + hash01(i * 5 + k, 6) * 14; g.lineTo(x, yy); }
          g.stroke();
        });
        g.restore();
        g.globalAlpha = 0.96;
      }
      scnEach(near ? 5 : 4, 41 + side, (i, y, a, b) => {
        const x = edgeX(y), r = 8 + a * 10;
        g.fillStyle = body;
        g.beginPath();
        for (let k = 0; k < 6; k++){ const an = k / 6 * 6.2832; g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); }
        g.closePath(); g.fill();
      });
    } else {
      scnEach(near ? 5 : 4, 51 + side + depth * 3, (i, y, a, b) => {
        const x = edgeX(y) - side * 6, r = 22 + a * (near ? 26 : 18);
        g.fillStyle = body;
        g.fillRect(side < 0 ? x - 30 : x + 20, y, 10, 60);
        g.fillStyle = near ? mixRgb(th.bg2, [170, 255, 120], 0.35) : body;
        g.beginPath(); g.ellipse(x - side * r * 0.3, y, r, r * 0.5, 0, 3.1416, 6.2832); g.closePath(); g.fill();
        if (near){
          g.fillStyle = 'rgba(235,255,210,.55)';
          for (let k = 0; k < 3; k++){ g.beginPath(); g.arc(x - side * r * 0.3 + (k - 1) * r * 0.45, y - r * 0.22 - (k % 2) * 5, 2.5 + b * 2, 0, 6.2832); g.fill(); }
          g.fillStyle = mixRgb(th.bg2, [170, 255, 120], 0.35);
          g.beginPath(); g.ellipse(x - side * r * 0.3 + (a - 0.5) * r, y + 8 + b * 10, 2.4, 4, 0, 0, 6.2832); g.fill();
        }
      });
    }
  }
  return c;
}

function tileSpan(c){
  if (c.__span !== undefined) return c.__span;
  c.__span = null;
  try {
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H).data;
    const used = new Uint8Array(W);
    for (let y = 0; y < H; y += 2){
      const row = y * W * 4;
      for (let x = 0; x < W; x++) if (d[row + x * 4 + 3] > 2) used[x] = 1;
    }
    let bestA = -1, bestB = -1, runA = -1;
    for (let x = 0; x <= W; x++){
      if (x < W && !used[x]){ if (runA < 0) runA = x; }
      else if (runA >= 0){ if (x - runA > bestB - bestA){ bestA = runA; bestB = x; } runA = -1; }
    }
    if (bestA >= 0 && bestB - bestA > W * 0.2) c.__span = [bestA, bestB];
  } catch (e) { c.__span = null; }
  return c.__span;
}
function tileParts(tile, sp){
  if (tile.__parts) return tile.__parts;
  const out = [];
  const cut = (x, w) => {
    if (w <= 0) return;
    const c = document.createElement('canvas');
    c.width = w; c.height = tile.height;
    c.getContext('2d').drawImage(tile, x, 0, w, tile.height, 0, 0, w, tile.height);
    out.push({ c, x });
  };
  if (!sp) out.push({ c: tile, x: 0 });
  else { cut(0, sp[0]); cut(sp[1], tile.width - sp[1]); }
  tile.__parts = out;
  return out;
}

function sceneryTile(w, depth){
  const key = w + '|' + depth + '|' + scnRes() + '|' + VW;
  if (!scnCache[key]){
    const tag = '|' + scnRes() + '|' + VW;
    for (const k in scnCache) if (k.indexOf(tag) === -1) delete scnCache[k];
    scnCache[key] = buildSceneryTile(w, depth);
  }
  if (!worldLight) return scnCache[key];
  const lk = key + '|L';
  if (!scnCache[lk]){
    const src = scnCache[key];
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    const th = WORLD_THEMES[w % WORLD_THEMES.length];
    g.globalAlpha = depth ? 0.42 : 0.62;
    g.fillStyle = mixRgb(th.lbg1, th.lbg2, depth ? 0.75 : 0.5, depth ? 0.78 : 0.9);
    g.fillRect(0, 0, c.width, c.height);
    scnCache[lk] = c;
  }
  return scnCache[lk];
}

function sceneryEnabled(){ return !lowGfx() && uiStyle === 'classic' && bgTheme === 'auto'; }

function updateWorldFx(dt){
  const w = worldIndex();
  if (w !== worldFx.cur){ worldFx.prev = worldFx.cur; worldFx.cur = w; worldFx.k = 0; }
  if (worldFx.k < 1){ worldFx.k = Math.min(1, worldFx.k + dt / 1.6); if (worldFx.k >= 1) worldFx.prev = -1; }
}

function drawSceneryFor(w, alpha, time){
  const wi = w % 5;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (wi === 0){
    const mx = VW * 0.72, my = VH * 0.2 + (-camY * 0.02 % 40);
    const gl = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
    gl.addColorStop(0, 'rgba(255,230,190,.35)');
    gl.addColorStop(1, 'rgba(255,230,190,0)');
    ctx.fillStyle = gl; ctx.fillRect(mx - 120, my - 120, 240, 240);
    ctx.fillStyle = '#ffeccc';
    ctx.beginPath(); ctx.arc(mx, my, 34, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(200,170,150,.35)';
    ctx.beginPath(); ctx.arc(mx - 10, my - 6, 7, 0, 6.2832); ctx.arc(mx + 12, my + 9, 5, 0, 6.2832); ctx.fill();
  } else if (wi === 1){
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++){
      const base = VH * (0.18 + k * 0.16);
      const gr = ctx.createLinearGradient(0, base - 60, 0, base + 60);
      const col = k ? '120,255,200' : '120,200,255';
      gr.addColorStop(0, 'rgba(' + col + ',0)');
      gr.addColorStop(0.5, 'rgba(' + col + ',.22)');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      for (let x = -10; x <= VW + 10; x += 20){
        const y = base + Math.sin(x * 0.012 + time * (0.4 + k * 0.2) + k * 2) * 26 + Math.sin(x * 0.03 - time * 0.7) * 8;
        if (x === -10) ctx.moveTo(x, y - 50); else ctx.lineTo(x, y - 50);
      }
      for (let x = VW + 10; x >= -10; x -= 20){
        const y = base + Math.sin(x * 0.012 + time * (0.4 + k * 0.2) + k * 2) * 26 + Math.sin(x * 0.03 - time * 0.7) * 8;
        ctx.lineTo(x, y + 40);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } else if (wi === 2){
    const p = 0.75 + Math.sin(time * 1.6) * 0.25;
    const gl = ctx.createLinearGradient(0, VH * 0.6, 0, VH);
    gl.addColorStop(0, 'rgba(255,90,20,0)');
    gl.addColorStop(1, 'rgba(255,110,30,' + (0.35 * p) + ')');
    ctx.fillStyle = gl; ctx.fillRect(-OX / S, VH * 0.6, cssW / S, VH * 0.4);
  }
  const PX = S * DPR;
  for (const depth of [0, 1]){
    const tile = sceneryTile(w, depth);
    const f = depth ? 0.34 : 0.14;
    const off = ((-camY * f) % SCN_T + SCN_T) % SCN_T;
    const sp = tileSpan(tile);
    const exact = Math.abs(tile.width - Math.ceil(VW * PX)) <= 1;
    if (exact){
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const x0 = Math.round(OX * DPR);
      const parts = tileParts(tile, sp);
      for (let y = off - SCN_T; y < VH; y += SCN_T){
        if (y + SCN_T < 0) continue;
        const py = Math.round(y * PX);
        for (let i = 0; i < parts.length; i++) ctx.drawImage(parts[i].c, x0 + parts[i].x, py);
      }
      ctx.restore();
      continue;
    }
    const q = ctx.imageSmoothingQuality;
    ctx.imageSmoothingQuality = 'low';
    for (let y = off - SCN_T; y < VH; y += SCN_T){
      if (y + SCN_T < 0) continue;
      if (!sp) ctx.drawImage(tile, 0, y, VW, SCN_T);
      else {
        const k = VW / tile.width;
        if (sp[0] > 0) ctx.drawImage(tile, 0, 0, sp[0], tile.height, 0, y, sp[0] * k, SCN_T);
        if (sp[1] < tile.width) ctx.drawImage(tile, sp[1], 0, tile.width - sp[1], tile.height, sp[1] * k, y, (tile.width - sp[1]) * k, SCN_T);
      }
    }
    ctx.imageSmoothingQuality = q;
  }
  if (wi === 0){
    for (let i = 0; i < 14; i++){
      const r1 = hash01(i, 61), r2 = hash01(i, 62), r3 = hash01(i, 63);
      const x = (r1 * VW + Math.sin(time * (0.5 + r2) + i) * 30 + VW) % VW;
      const y = ((r3 * VH + Math.cos(time * (0.4 + r1) + i) * 24 - camY * 0.4) % VH + VH) % VH;
      const a = 0.4 + 0.6 * Math.max(0, Math.sin(time * (1.5 + r2 * 2) + i * 3));
      ctx.globalAlpha = alpha * a;
      ctx.fillStyle = 'rgba(255,240,140,.35)';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff6b0';
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.2832); ctx.fill();
    }
  } else if (wi === 3){
    for (let i = 0; i < 12; i++){
      const r1 = hash01(i, 71), r2 = hash01(i, 72), r3 = hash01(i, 73);
      const H = VH + 40;
      const y = H - ((r1 * H + time * (20 + r2 * 30) - camY * 0.3) % H + H) % H - 20;
      const x = r3 * VW + Math.sin(time + i) * 10, r = 3 + r2 * 6;
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = 'rgba(200,255,160,.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 6.2832); ctx.fill();
    }
  } else if (wi === 4){
    const cyc = time % 7;
    if (cyc < 0.9){
      const k = cyc / 0.9, sx = VW * (0.9 - k * 0.8), sy = VH * (0.1 + k * 0.25);
      const gr = ctx.createLinearGradient(sx, sy, sx + 70, sy - 22);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - k)) + ')');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = gr; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 70, sy - 22); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScenery(){
  if (!sceneryEnabled()) return;
  const time = performance.now() / 1000;
  if (worldFx.prev >= 0 && worldFx.k < 1) drawSceneryFor(worldFx.prev, 1 - worldFx.k, time);
  drawSceneryFor(worldFx.cur, worldFx.prev >= 0 ? worldFx.k : 1, time);
}

const worldGradCache = {};
function worldGrad(w){
  const key = w + '|' + cvs.width + 'x' + cvs.height;
  if (worldGradCache[key]) return worldGradCache[key];
  for (const k in worldGradCache) if (k.indexOf('|' + cvs.width + 'x' + cvs.height) === -1) delete worldGradCache[k];
  const c = document.createElement('canvas');
  c.width = cvs.width; c.height = cvs.height;
  const b = c.getContext('2d', { alpha: false });
  b.setTransform(S * DPR, 0, 0, S * DPR, OX * DPR, 0);
  const th = skyOf(WORLD_THEMES[w]);
  const g = b.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, 'rgb(' + th.bg1.join(',') + ')');
  g.addColorStop(1, 'rgb(' + th.bg2.join(',') + ')');
  b.fillStyle = g;
  b.fillRect(-OX / S, 0, cssW / S, VH);
  worldGradCache[key] = c;
  return c;
}

const PLAT_SKINS = [
  { top: ['#b8f28a', '#5cbf3e'], body: ['#8a5a36', '#5a3820'], deco: 'grass' },
  { top: ['#ffffff', '#dff4ff'], body: ['#a8e4ff', '#4a9ccc'], deco: 'ice' },
  { top: ['#5a4048', '#3a262c'], body: ['#2c1c22', '#170c10'], deco: 'lava' },
  { top: ['#b4f07a', '#62b83a'], body: ['#5c6e48', '#34422a'], deco: 'moss' },
  { top: ['#e8eeff', '#a8b4d8'], body: ['#6a7496', '#3a4262'], deco: 'metal' }
];
function platSkin(w){
  const R = scnRes();
  const key = w + '|' + R;
  if (platSkinCache[key]) return platSkinCache[key];
  const sk = PLAT_SKINS[w % PLAT_SKINS.length];
  const W = PW, H = PH, PADX = 6, PADT = 10, PADB = 22;
  const c = document.createElement('canvas');
  c.width = Math.ceil((W + PADX * 2) * R);
  c.height = Math.ceil((H + PADT + PADB) * R);
  const g = c.getContext('2d');
  g.scale(R, R);
  g.translate(PADX, PADT);
  g.fillStyle = 'rgba(0,0,0,.25)';
  rr(g, 2, 5, W - 4, H, 8); g.fill();
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, sk.body[0]); bg.addColorStop(1, sk.body[1]);
  g.fillStyle = bg;
  rr(g, 0, 0, W, H, 8); g.fill();
  const tg = g.createLinearGradient(0, 0, 0, 7);
  tg.addColorStop(0, sk.top[0]); tg.addColorStop(1, sk.top[1]);
  g.fillStyle = tg;
  if (sk.deco === 'grass' || sk.deco === 'moss'){
    g.beginPath();
    g.moveTo(0, 7);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, (x / 4) % 2 ? 9 : 6);
    g.lineTo(W, 3); g.quadraticCurveTo(W, -1, W - 6, -1); g.lineTo(6, -1); g.quadraticCurveTo(0, -1, 0, 3);
    g.closePath(); g.fill();
    for (let i = 0; i < 7; i++){
      const x = 5 + i * (W - 10) / 6;
      g.strokeStyle = sk.top[1]; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (i % 2 ? 2 : -2), -4 - (i % 3)); g.stroke();
    }
    if (sk.deco === 'grass'){
      for (const [x, col] of [[14, '#ffd1e8'], [W - 18, '#fff3a0'], [W * 0.55, '#ffffff']]){
        g.fillStyle = col; g.beginPath(); g.arc(x, -2, 2.2, 0, 6.2832); g.fill();
      }
    } else {
      g.fillStyle = '#9be36b';
      for (const x of [16, W * 0.5, W - 14]){ g.beginPath(); g.ellipse(x, H + 3, 2, 3.5, 0, 0, 6.2832); g.fill(); }
    }
  } else if (sk.deco === 'ice'){
    g.beginPath();
    g.moveTo(-2, 5);
    for (let x = 0; x <= W; x += 8) g.quadraticCurveTo(x + 4, 9, x + 8, 5);
    g.lineTo(W + 2, 2); g.quadraticCurveTo(W, -4, W - 8, -4); g.lineTo(8, -4); g.quadraticCurveTo(-2, -4, -2, 2);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(220,245,255,.9)';
    for (let i = 0; i < 5; i++){
      const x = 8 + i * (W - 16) / 4, L = 5 + (i % 3) * 4;
      g.beginPath(); g.moveTo(x - 3, H - 1); g.lineTo(x, H + L); g.lineTo(x + 3, H - 1); g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.6)';
    rr(g, 8, 8, W * 0.35, 2, 1); g.fill();
  } else if (sk.deco === 'lava'){
    rr(g, 0, 0, W, 5, 4); g.fill();
    g.shadowColor = '#ff6a1a'; g.shadowBlur = 6;
    g.strokeStyle = '#ffa040'; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(10, 4); g.lineTo(18, 9); g.lineTo(26, 6); g.lineTo(32, 12);
    g.moveTo(W - 12, 5); g.lineTo(W - 22, 10); g.lineTo(W - 30, 8);
    g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = '#ff8a2a';
    rr(g, 3, 0, W - 6, 1.6, 1); g.fill();
  } else {
    rr(g, 0, 0, W, 6, 5); g.fill();
    g.fillStyle = '#5ff4ff';
    g.shadowColor = '#5ff4ff'; g.shadowBlur = 6;
    rr(g, 8, H - 5, W - 16, 2, 1); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#2a3050';
    for (const x of [6, W - 6]){ g.beginPath(); g.arc(x, 9, 1.6, 0, 6.2832); g.fill(); }
    g.fillStyle = '#ffec7a';
    g.beginPath(); g.arc(W / 2, 9, 1.8, 0, 6.2832); g.fill();
  }
  const skin = { c, ox: -PADX, oy: -PADT, w: W + PADX * 2, h: H + PADT + PADB };
  platSkinCache[key] = skin;
  return skin;
}
function skinnedPlatform(p){ return p.type === 'normal' && platformTheme === 'auto' && uiStyle === 'classic'; }

const PLAT3D = [
  { cap: ['#d4fa96', '#7fd24a', '#3f8f24'], dirt: ['#b07a46', '#7c4c29', '#4a2a16'], peb: '#d8a878', side: '#3a2212', deep: 16, jag: 5, deco: 'grass' },
  { cap: ['#ffffff', '#e4f3ff', '#9fc8ea'], dirt: ['#8a7e86', '#5e5268', '#342c44'], peb: '#c8d8ee', side: '#241e34', deep: 14, jag: 4, deco: 'snow' },
  { cap: ['#6e4c52', '#4a3036', '#2a181c'], dirt: ['#402a2e', '#26161a', '#12080a'], peb: '#6a4a4e', side: '#0c0406', deep: 15, jag: 6, deco: 'lava' },
  { cap: ['#cff58e', '#86cc4e', '#4a8a2c'], dirt: ['#8a7456', '#5c4a34', '#32281a'], peb: '#b0a080', side: '#221a10', deep: 18, jag: 6, deco: 'moss' },
  { cap: ['#f4f7ff', '#bcc6e2', '#7a86aa'], dirt: ['#5c668c', '#3a4264', '#20263c'], peb: '#8e9ac4', side: '#141828', deep: 10, jag: 0, deco: 'metal' }
];
const PLAT3D_T = {
  broken: { cap: ['#e0b27a', '#b27c46', '#744a24'], dirt: ['#a06a3a', '#744824', '#462810'], peb: '#d8a878', side: '#301a0a', deep: 12, jag: 7, deco: 'dry' },
  moving: { cap: ['#d8f4ff', '#6cc4f4', '#2c7cc0'], dirt: ['#6c7c9c', '#46526e', '#262c44'], peb: '#a8c8e8', side: '#1a1e30', deep: 13, jag: 5, deco: 'crystal' },
  bouncy: { cap: ['#ffd6ee', '#ff78c0', '#c23a84'], dirt: ['#d85aa0', '#a0306e', '#601844'], peb: '#ffb0dc', side: '#40102c', deep: 10, jag: 0, deco: 'jelly' }
};
const plat3dCache = {};
function plat3dBody(g, W, H, deep, jag, rnd){
  g.beginPath();
  g.moveTo(0, 5);
  g.lineTo(-0.5, H - 2);
  const n = 10;
  for (let i = 0; i <= n; i++){
    const t = i / n;
    const bell = Math.pow(Math.sin(Math.PI * t), 0.85);
    const j = jag ? (rnd(i) - 0.5) * jag * bell : 0;
    g.lineTo(0.5 + t * (W - 1), H - 1 + bell * deep + j);
  }
  g.lineTo(W + 0.5, H - 2);
  g.lineTo(W, 5);
  g.closePath();
}
function plat3dSkin(w){
  const R = scnRes();
  const key = w + '|' + R;
  if (plat3dCache[key]) return plat3dCache[key];
  const sk = typeof w === 'number' ? PLAT3D[w % PLAT3D.length] : PLAT3D_T[w];
  const W = PW, H = PH, PADX = 9, PADT = 13, PADB = 40;
  const sd = typeof w === 'number' ? w + 3 : w.length * 7 + 1;
  const rnd = (i) => { const v = Math.sin((i + 1) * 12.9898 + sd * 78.233) * 43758.5453; return v - Math.floor(v); };
  const c = document.createElement('canvas');
  c.width = Math.ceil((W + PADX * 2) * R);
  c.height = Math.ceil((H + PADT + PADB) * R);
  const g = c.getContext('2d');
  g.scale(R, R);
  g.translate(PADX, PADT);
  const bottom = H - 1 + sk.deep;

  g.save();
  plat3dBody(g, W, H, sk.deep, sk.jag, rnd);
  const bg = g.createLinearGradient(0, 4, 0, bottom);
  bg.addColorStop(0, sk.dirt[0]);
  bg.addColorStop(0.45, sk.dirt[1]);
  bg.addColorStop(1, sk.dirt[2]);
  g.fillStyle = bg;
  g.fill();
  g.clip();
  g.globalAlpha = 0.28;
  g.strokeStyle = sk.dirt[2];
  g.lineWidth = 1.4;
  for (const yy of [H + 1, H + 7]){
    g.beginPath();
    g.moveTo(-2, yy);
    for (let x = 0; x <= W + 4; x += 6) g.quadraticCurveTo(x + 3, yy + (x / 6 % 2 ? 2.2 : -2.2), x + 6, yy);
    g.stroke();
  }
  g.globalAlpha = 1;
  if (sk.deco === 'metal'){
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
    for (const x of [W * 0.3, W * 0.7]){ g.beginPath(); g.moveTo(x, 8); g.lineTo(x, bottom); g.stroke(); }
    g.fillStyle = '#5ff4ff';
    g.shadowColor = '#5ff4ff'; g.shadowBlur = 6;
    rr(g, 10, H + 1, W - 20, 2.2, 1.1); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#ffec7a';
    for (const x of [W * 0.3, W * 0.5, W * 0.7]){ g.beginPath(); g.arc(x, H + 7, 1.3, 0, 6.2832); g.fill(); }
  } else {
    for (let i = 0; i < 9; i++){
      const x = 4 + rnd(i + 20) * (W - 8);
      const t = x / W;
      const maxY = H - 1 + Math.pow(Math.sin(Math.PI * t), 0.85) * sk.deep - 3;
      const y = 9 + rnd(i + 40) * Math.max(1, maxY - 9);
      const r = 1.1 + rnd(i + 60) * 1.8;
      g.fillStyle = sk.peb;
      g.globalAlpha = 0.55;
      g.beginPath(); g.ellipse(x, y, r * 1.3, r, rnd(i) * 3, 0, 6.2832); g.fill();
      g.globalAlpha = 0.35;
      g.fillStyle = sk.dirt[2];
      g.beginPath(); g.ellipse(x + 0.6, y + 0.8, r * 1.1, r * 0.6, 0, 0, 6.2832); g.fill();
    }
    g.globalAlpha = 1;
  }
  if (sk.deco === 'lava'){
    g.strokeStyle = '#ff8a2a'; g.lineWidth = 1.3;
    g.shadowColor = '#ff5a10'; g.shadowBlur = 7;
    g.beginPath();
    g.moveTo(W * 0.2, 9); g.lineTo(W * 0.26, 15); g.lineTo(W * 0.22, 20); g.lineTo(W * 0.3, 26);
    g.moveTo(W * 0.62, 10); g.lineTo(W * 0.56, 17); g.lineTo(W * 0.64, 23);
    g.moveTo(W * 0.82, 9); g.lineTo(W * 0.78, 14);
    g.stroke();
    g.shadowBlur = 0;
  }
  if (sk.deco === 'dry'){
    g.strokeStyle = 'rgba(40,20,6,.7)'; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(W * 0.36, 7); g.lineTo(W * 0.42, 13); g.lineTo(W * 0.38, 19); g.lineTo(W * 0.45, 24);
    g.moveTo(W * 0.66, 7); g.lineTo(W * 0.6, 14); g.lineTo(W * 0.65, 20);
    g.stroke();
  }
  if (sk.deco === 'grass'){
    g.strokeStyle = 'rgba(58,32,14,.55)'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(W * 0.3, 9); g.quadraticCurveTo(W * 0.27, 14, W * 0.33, 18);
    g.moveTo(W * 0.7, 9); g.quadraticCurveTo(W * 0.74, 13, W * 0.69, 17);
    g.stroke();
  }
  const sh = g.createLinearGradient(0, 0, W, 0);
  sh.addColorStop(0, 'rgba(255,240,210,.16)');
  sh.addColorStop(0.18, 'rgba(0,0,0,0)');
  sh.addColorStop(0.72, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,.38)');
  g.fillStyle = sh;
  g.fillRect(-2, 0, W + 4, bottom + 4);
  const ao = g.createLinearGradient(0, 6, 0, 13);
  ao.addColorStop(0, 'rgba(0,0,0,.4)');
  ao.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = ao;
  g.fillRect(-2, 6, W + 4, 8);
  g.restore();

  g.lineCap = 'round';
  if (sk.deco === 'grass' || sk.deco === 'moss'){
    g.strokeStyle = sk.deco === 'grass' ? '#5a3418' : '#3a2c1a';
    g.lineWidth = 1;
    const roots = sk.deco === 'grass' ? [[0.42, 9], [0.5, 13], [0.6, 8]] : [[0.36, 8], [0.52, 12]];
    for (const [tx, L] of roots){
      const x = W * tx, y0 = H - 2 + Math.pow(Math.sin(Math.PI * tx), 0.85) * sk.deep;
      g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x - 3, y0 + L * 0.4, x + 3, y0 + L * 0.7, x - 1, y0 + L); g.stroke();
    }
    if (sk.deco === 'moss'){
      g.strokeStyle = '#5aa83a'; g.lineWidth = 1.4;
      for (const [x, L] of [[5, 16], [W - 8, 22], [W * 0.66, 12]]){
        g.beginPath(); g.moveTo(x, 8); g.bezierCurveTo(x + 3, 8 + L * 0.35, x - 3, 8 + L * 0.7, x + 1, 8 + L); g.stroke();
        g.fillStyle = '#8ad85a';
        for (let k = 1; k <= 3; k++){ g.beginPath(); g.ellipse(x + (k % 2 ? 2 : -2), 8 + L * k / 3.2, 2, 1.1, k % 2 ? 0.6 : -0.6, 0, 6.2832); g.fill(); }
      }
    }
  } else if (sk.deco === 'snow'){
    g.fillStyle = 'rgba(210,240,255,.95)';
    for (let i = 0; i < 6; i++){
      const t = 0.16 + i * 0.136;
      const x = W * t, y0 = H - 3 + Math.pow(Math.sin(Math.PI * t), 0.85) * sk.deep;
      const L = 5 + rnd(i + 80) * 8;
      g.beginPath(); g.moveTo(x - 2.4, y0); g.lineTo(x + 0.3, y0 + L); g.lineTo(x + 2.4, y0); g.closePath(); g.fill();
    }
  } else if (sk.deco === 'lava'){
    g.shadowColor = '#ff6a1a'; g.shadowBlur = 6;
    for (const [tx, dy, r, col] of [[0.46, 5, 1.6, '#ffb040'], [0.55, 10, 1.2, '#ff7a20'], [0.4, 13, 0.9, '#ffd070']]){
      g.fillStyle = col;
      g.beginPath(); g.arc(W * tx, bottom + dy, r, 0, 6.2832); g.fill();
    }
    g.shadowBlur = 0;
  }

  const lip = g.createLinearGradient(0, 3, 0, 11);
  lip.addColorStop(0, sk.cap[1]);
  lip.addColorStop(1, sk.cap[2]);
  g.fillStyle = lip;
  g.beginPath();
  g.moveTo(-2, 2);
  g.lineTo(W + 2, 2);
  if (sk.deco === 'metal'){
    g.lineTo(W + 2, 8); g.lineTo(-2, 8);
  } else if (sk.deco === 'snow'){
    g.lineTo(W + 2, 7);
    for (let x = W + 2; x > -2; x -= 7){ g.quadraticCurveTo(x - 3.5, 13 + rnd(x) * 3, x - 7, 7); }
  } else if (sk.deco === 'jelly'){
    g.lineTo(W + 2, 7);
    for (let x = W + 2; x > -2; x -= 9){ g.quadraticCurveTo(x - 4.5, 12 + rnd(x) * 4, x - 9, 7); }
  } else if (sk.deco === 'lava' || sk.deco === 'dry' || sk.deco === 'crystal'){
    g.lineTo(W + 1, 8);
    for (let x = W + 1; x > -1; x -= 6){ g.lineTo(x - 3, 9 + rnd(x) * 2); g.lineTo(x - 6, 8); }
  } else {
    g.lineTo(W + 2, 7);
    for (let x = W + 2; x > -2; x -= 4){ g.lineTo(x - 2, 9 + rnd(x + 5) * 4); g.lineTo(x - 4, 7.5); }
  }
  g.closePath();
  g.fill();
  if (sk.deco === 'metal'){
    g.save();
    g.beginPath(); g.rect(-2, 4.5, W + 4, 3.5); g.clip();
    g.fillStyle = '#ffd34d'; g.fillRect(-2, 4.5, W + 4, 3.5);
    g.fillStyle = '#2a2230';
    for (let x = -6; x < W + 6; x += 7){ g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 3.5, 4.5); g.lineTo(x + 6, 4.5); g.lineTo(x + 2.5, 8); g.closePath(); g.fill(); }
    g.restore();
  }

  const tf = g.createLinearGradient(0, -4, 0, 5);
  tf.addColorStop(0, sk.cap[0]);
  tf.addColorStop(1, sk.cap[1]);
  g.fillStyle = tf;
  rr(g, -2, -4, W + 4, 9, 4.5);
  g.fill();
  g.globalAlpha = 0.5;
  g.fillStyle = '#ffffff';
  rr(g, 5, -3, W * 0.45, 1.6, 0.8); g.fill();
  g.globalAlpha = 1;

  if (sk.deco === 'grass' || sk.deco === 'moss'){
    g.strokeStyle = sk.cap[2]; g.lineWidth = 0.9; g.globalAlpha = 0.45;
    for (let i = 0; i < 12; i++){
      const x = 3 + rnd(i + 100) * (W - 6), y = -1 + rnd(i + 120) * 4;
      g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(x + (rnd(i) - 0.5) * 2, y - 1); g.stroke();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 16; i++){
      const x = 1 + i * (W - 2) / 15 + (rnd(i + 140) - 0.5) * 2;
      const L = 3 + rnd(i + 160) * 4;
      g.strokeStyle = i % 3 ? sk.cap[1] : sk.cap[0];
      g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(x, -2.5); g.quadraticCurveTo(x + (i % 2 ? 1 : -1), -2.5 - L * 0.6, x + (i % 2 ? 2.2 : -2.2), -2.5 - L); g.stroke();
    }
    if (sk.deco === 'grass'){
      for (const [x, y, col] of [[12, -1, '#ffd1e8'], [W * 0.58, 1.5, '#ffffff'], [W - 16, -0.5, '#fff3a0']]){
        g.fillStyle = col;
        for (let k = 0; k < 5; k++){ const a = k * 1.2566; g.beginPath(); g.arc(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.2, 1.2, 0, 6.2832); g.fill(); }
        g.fillStyle = '#ffb020'; g.beginPath(); g.arc(x, y, 0.9, 0, 6.2832); g.fill();
      }
    } else {
      for (const [x, s] of [[W * 0.22, 1], [W * 0.78, 0.8]]){
        g.fillStyle = '#f2e6d0'; rr(g, x - 0.8 * s, -3 - 3 * s, 1.6 * s, 3.5 * s, 0.6); g.fill();
        g.fillStyle = '#ff6a5a'; g.beginPath(); g.ellipse(x, -3 - 3 * s, 2.8 * s, 1.8 * s, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 1 * s, -4 - 3 * s, 0.5, 0, 6.2832); g.fill();
      }
    }
  } else if (sk.deco === 'snow'){
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++){ g.beginPath(); g.ellipse(6 + i * (W - 12) / 4, -3.5, 6, 2.4, 0, Math.PI, 0); g.fill(); }
    g.fillStyle = 'rgba(160,210,255,.9)';
    for (let i = 0; i < 6; i++){ const x = 4 + rnd(i + 200) * (W - 8), y = -2 + rnd(i + 220) * 5; g.beginPath(); g.arc(x, y, 0.7, 0, 6.2832); g.fill(); }
  } else if (sk.deco === 'dry'){
    g.strokeStyle = 'rgba(70,36,12,.75)'; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(W * 0.3, -3); g.lineTo(W * 0.36, 0); g.lineTo(W * 0.33, 4);
    g.moveTo(W * 0.36, 0); g.lineTo(W * 0.46, 1);
    g.moveTo(W * 0.7, -3); g.lineTo(W * 0.64, 1); g.lineTo(W * 0.68, 4);
    g.stroke();
    g.fillStyle = '#8a5a30';
    for (let i = 0; i < 5; i++){ g.beginPath(); g.arc(5 + rnd(i + 300) * (W - 10), -1 + rnd(i + 320) * 4, 0.9, 0, 6.2832); g.fill(); }
  } else if (sk.deco === 'crystal'){
    for (const [x, hgt, lean] of [[10, 7, -0.3], [15, 4.5, 0.25], [W - 13, 8, 0.3], [W - 18, 5, -0.2], [W * 0.5, 3.5, 0]]){
      g.save(); g.translate(x, 0); g.rotate(lean);
      const cg = g.createLinearGradient(-2.5, 0, 2.5, 0);
      cg.addColorStop(0, '#e8fbff'); cg.addColorStop(0.5, '#7ad8ff'); cg.addColorStop(1, '#2f8ddb');
      g.fillStyle = cg;
      g.beginPath(); g.moveTo(-2.5, 1); g.lineTo(-2.5, -hgt + 2); g.lineTo(0, -hgt - 1); g.lineTo(2.5, -hgt + 2); g.lineTo(2.5, 1); g.closePath(); g.fill();
      g.restore();
    }
  } else if (sk.deco === 'jelly'){
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (const [x, y, r] of [[12, -1, 1.8], [18, 0.5, 1], [W - 14, -0.5, 1.4], [W * 0.55, 1.5, 0.9]]){ g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
  } else if (sk.deco === 'lava'){
    g.strokeStyle = '#ffa040'; g.lineWidth = 1.2;
    g.shadowColor = '#ff6a1a'; g.shadowBlur = 6;
    g.beginPath();
    g.moveTo(8, 0); g.lineTo(16, 2); g.lineTo(24, -1); g.lineTo(32, 1.5);
    g.moveTo(W - 10, 1); g.lineTo(W - 20, -1.5); g.lineTo(W - 28, 1);
    g.stroke();
    g.shadowBlur = 0;
  } else {
    g.strokeStyle = 'rgba(80,90,130,.45)'; g.lineWidth = 0.8;
    g.beginPath();
    for (const x of [W * 0.33, W * 0.66]){ g.moveTo(x, -3.5); g.lineTo(x, 4.5); }
    g.stroke();
    g.fillStyle = '#6a7496';
    for (const x of [4, W * 0.33 - 3, W * 0.33 + 3, W * 0.66 - 3, W * 0.66 + 3, W - 4]){ g.beginPath(); g.arc(x, 0.5, 0.9, 0, 6.2832); g.fill(); }
  }

  const mkSide = (top, bot) => {
    const o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    const og = o.getContext('2d');
    og.drawImage(c, 0, 0);
    og.globalCompositeOperation = 'source-in';
    const lg = og.createLinearGradient(0, 0, 0, o.height);
    lg.addColorStop(0, top); lg.addColorStop(1, bot);
    og.fillStyle = lg;
    og.fillRect(0, 0, o.width, o.height);
    return o;
  };
  const s = mkSide(mixHex(sk.dirt[1], '#000000', 0.25), mixHex(sk.dirt[2], '#000000', 0.35));
  const s2 = mkSide(mixHex(sk.cap[1], '#000000', 0.3), mixHex(sk.cap[2], '#000000', 0.45));
  const skin = { c, s, s2, ox: -PADX, oy: -PADT, w: W + PADX * 2, h: H + PADT + PADB };
  plat3dCache[key] = skin;
  return skin;
}

let vignetteCvs = null, vignetteKey = '';
function drawVignette(){
  if (lowGfx()) return;
  const key = cvs.width + 'x' + cvs.height;
  if (key !== vignetteKey){
    vignetteKey = key;
    vignetteCvs = document.createElement('canvas');
    vignetteCvs.width = Math.max(1, Math.round(cvs.width / 4));
    vignetteCvs.height = Math.max(1, Math.round(cvs.height / 4));
    const v = vignetteCvs.getContext('2d');
    const W = vignetteCvs.width, H = vignetteCvs.height;
    const g = v.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(8,0,20,.42)');
    v.fillStyle = g;
    v.fillRect(0, 0, W, H);
  }
  pixelTransform();
  if (worldLight) ctx.globalAlpha = 0.4;
  ctx.drawImage(vignetteCvs, 0, 0, cvs.width, cvs.height);
  ctx.globalAlpha = 1;
  worldTransform();
}

const WEATHER = ['petals', 'snow', 'embers', 'spores', 'stars'];
const WEATHER_N = 32;

function hash01(i, k){
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function drawWeather(){
  if (lowGfx() || uiStyle === 'paper' || uiStyle === 'neon') return;
  if (uiStyle === 'aero'){
    const time = performance.now() / 1000;
    const H = VH + 60;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++){
      const r1 = hash01(i, 1), r2 = hash01(i, 2), r3 = hash01(i, 3);
      const y = H - ((r1 * H + time * (20 + r2 * 26) - camY * 0.35) % H + H) % H - 30;
      const x = r3 * VW + Math.sin(time * (0.7 + r2) + i) * 16;
      const r = 4 + r1 * 10;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.38, r * 0.24, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }
  const kind = WEATHER[worldIndex() % WEATHER.length];
  if (kind === 'petals') return;
  const time = performance.now() / 1000;
  const n = ultraGfx() ? WEATHER_N + 10 : WEATHER_N;
  const H = VH + 60;
  for (let i = 0; i < n; i++){
    const r1 = hash01(i, 1), r2 = hash01(i, 2), r3 = hash01(i, 3);
    let x, y, a;
    if (kind === 'embers' || kind === 'spores'){
      const sp = kind === 'embers' ? 60 + r2 * 70 : 18 + r2 * 22;
      y = H - ((r1 * H + time * sp - camY * 0.35) % H + H) % H - 30;
      x = r3 * VW + Math.sin(time * (0.8 + r2) + i) * (kind === 'embers' ? 10 : 22);
    } else {
      const sp = kind === 'snow' ? 34 + r2 * 40 : kind === 'petals' ? 40 + r2 * 45 : 8 + r2 * 10;
      y = ((r1 * H + time * sp - camY * 0.35) % H + H) % H - 30;
      x = ((r3 * VW + Math.sin(time * (0.6 + r2) + i * 1.7) * 26 + time * (kind === 'petals' ? 14 : 0)) % VW + VW) % VW;
    }
    if (kind === 'petals'){
      a = 0.7;
      ctx.globalAlpha = a;
      ctx.fillStyle = i % 2 ? '#ffc4dc' : '#ffe0ec';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * (1 + r2) + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5 + r1 * 3, 3, 0, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    } else if (kind === 'snow'){
      ctx.globalAlpha = 0.45 + r2 * 0.4;
      ctx.fillStyle = '#f4fbff';
      ctx.beginPath();
      ctx.arc(x, y, 2 + r1 * 3, 0, 6.2832);
      ctx.fill();
    } else if (kind === 'embers'){
      ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 6 + i));
      ctx.fillStyle = i % 3 ? '#ffb347' : '#ff6a3d';
      ctx.beginPath();
      ctx.arc(x, y, 1.8 + r1 * 2.6, 0, 6.2832);
      ctx.fill();
    } else if (kind === 'spores'){
      ctx.globalAlpha = 0.28 + 0.25 * Math.sin(time * 2 + i);
      ctx.fillStyle = '#b8ff8a';
      ctx.beginPath();
      ctx.arc(x, y, 2.6 + r1 * 3.4, 0, 6.2832);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(time * (2 + r2 * 3) + i * 2));
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
    }
  }
  drawSkyEvent(kind, time);
  ctx.globalAlpha = 1;
}

function drawSkyEvent(kind, time){
  if (kind === 'stars' || kind === 'snow'){
    const cyc = 7.5, ph = (time % cyc) / cyc;
    if (ph > 0.14) return;
    const k = Math.floor(time / cyc);
    const p = ph / 0.14;
    const sx = VW * (0.15 + 0.7 * hash01(k, 7)), sy = VH * (0.08 + 0.3 * hash01(k, 8));
    const hx = sx + p * 170, hy = sy + p * 90;
    const g = ctx.createLinearGradient(hx - 70, hy - 37, hx, hy);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,250,225,' + (0.9 * (1 - p)) + ')');
    ctx.globalAlpha = 1;
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 70, hy - 37);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    return;
  }
  const cyc = 13, ph = (time % cyc) / cyc;
  if (ph > 0.42) return;
  const k = Math.floor(time / cyc);
  const dir = hash01(k, 3) < 0.5 ? 1 : -1;
  const p = ph / 0.42;
  const baseX = dir > 0 ? -60 + p * (VW + 120) : VW + 60 - p * (VW + 120);
  const baseY = VH * (0.12 + 0.28 * hash01(k, 4)) + Math.sin(p * 9) * 6;
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = kind === 'embers' ? '#3a0f08' : '#1c1233';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let b = 0; b < 3; b++){
    const bx = baseX - dir * b * 22, by = baseY + (b === 1 ? -10 : b * 8);
    const flap = Math.sin(time * 11 + b * 1.3) * 5;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by - 2 - flap);
    ctx.quadraticCurveTo(bx - 4, by - 4, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by - 2 - flap);
    ctx.stroke();
  }
}

function drawSpeedLines(){
  if (speedFx < 0.02 || lowGfx() || state !== STATE.PLAY) return;
  const time = performance.now() / 1000;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fff6e2';
  for (let i = 0; i < 16; i++){
    const r1 = hash01(i, 11), r2 = hash01(i, 12);
    const side = i % 2 ? r1 * VW * 0.22 : VW - r1 * VW * 0.22;
    const len = 60 + r2 * 90;
    const y = ((r2 * VH + time * (900 + r1 * 700)) % (VH + len)) - len;
    ctx.globalAlpha = speedFx * (0.12 + 0.2 * r2);
    ctx.lineWidth = 1.5 + r1 * 2;
    ctx.beginPath();
    ctx.moveTo(side, y);
    ctx.lineTo(side, y + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawShadows(){
  if (ultraGfx()) return;
  const sy = hero.y - camY + hero.h * 0.42;
  if (sy < -40 || sy > VH + 40) return;
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(hero.x, sy, hero.w * 0.42, hero.w * 0.14, 0, 0, 6.2832);
  ctx.fill();
  ctx.globalAlpha = 1;
}


const platformGradCache = new Map();
function platformGradient(c1, c2, h){
  const key = c1 + '|' + c2 + '|' + h;
  let g = platformGradCache.get(key);
  if (!g){
    g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    if (platformGradCache.size > 40) platformGradCache.clear();
    platformGradCache.set(key, g);
  }
  return g;
}

const ULTRA_DEPTH_X = 13;
const ULTRA_DEPTH_Y = 14;
function ultraDepthVector(sx, sy){
  const vx = VW / 2;
  const vy = VH / 2;
  return {
    dx: clamp((vx - sx) * 0.055, -ULTRA_DEPTH_X, ULTRA_DEPTH_X),
    dy: clamp((vy - sy) * 0.045, -ULTRA_DEPTH_Y, ULTRA_DEPTH_Y)
  };
}

const hexRgbCache = new Map();
function hexToRgb(hex){
  let v = hexRgbCache.get(hex);
  if (!v){
    const n = parseInt(String(hex).replace('#', ''), 16) || 0;
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexRgbCache.set(hex, v);
  }
  return v;
}
function mixHex(a, b, t){
  const x = hexToRgb(a), y = hexToRgb(b);
  const k = clamp(t, 0, 1);
  return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' +
    Math.round(x[1] + (y[1] - x[1]) * k) + ',' +
    Math.round(x[2] + (y[2] - x[2]) * k) + ')';
}
const ULTRA_BLEND_BAND = 0.45;
function ultraSideBlend(dy){
  const tdep = clamp(dy / ULTRA_DEPTH_Y, -1, 1);
  const u = clamp((ULTRA_BLEND_BAND - tdep) / (2 * ULTRA_BLEND_BAND), 0, 1);
  return u * u * (3 - 2 * u);
}
function ultraSideStyle(dy, cTop, cUnder){
  const s = ultraSideBlend(dy);
  return { color: mixHex(cUnder, cTop, s), overlay: 0.35 + (0.12 - 0.35) * s, blend: s };
}

const CLOUD_PUFFS = [[0.13, 0.62, 0.62], [0.33, 0.52, 0.95], [0.55, 0.48, 1.08], [0.76, 0.55, 0.85], [0.9, 0.66, 0.58]];
function cloudShape(w, h, dx, dy, grow, t){
  ctx.beginPath();
  const bh = h * 0.95;
  rr(ctx, dx - grow, dy + h * 0.3 - grow, w + grow * 2, bh + grow * 2 - h * 0.2, (bh - h * 0.2) / 2 + grow);
  for (let i = 0; i < CLOUD_PUFFS.length; i++){
    const pf = CLOUD_PUFFS[i];
    const r = h * pf[2] * (1 + 0.04 * Math.sin(t * 1.7 + i * 1.9)) + grow;
    ctx.moveTo(dx + w * pf[0] + r, dy + h * pf[1]);
    ctx.arc(dx + w * pf[0], dy + h * pf[1], r, 0, Math.PI * 2);
  }
}
function drawCloudBody(p, w, h){
  const t = performance.now() / 1000 + p.x * 0.013;
  const a = ctx.globalAlpha;
  let fillTop = '#ffffff', fillBot = '#e3edf8', under = '#b9c9dd', line = null, lw = 0, glow = null, shine = 0.85;
  if (uiStyle === 'aero'){ fillTop = '#ffffff'; fillBot = '#d6efff'; under = '#8cc6ea'; line = 'rgba(255,255,255,.95)'; lw = 1.2; shine = 1; }
  else if (uiStyle === 'neon'){ fillTop = '#1d1640'; fillBot = '#120d2a'; under = null; line = '#e9f6ff'; lw = 2; glow = '#8fe6ff'; shine = 0; }
  else if (uiStyle === 'paper'){ fillTop = '#ffffff'; fillBot = '#ffffff'; under = null; line = '#3a4a6a'; lw = 1.6; shine = 0; }
  if (under){
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = under;
    cloudShape(w, h, 0, 4, 0, t);
    ctx.fill();
    ctx.globalAlpha = a;
  }
  if (line){
    ctx.save();
    if (glow && !lowGfx()){ ctx.shadowColor = glow; ctx.shadowBlur = 10; }
    ctx.fillStyle = line;
    cloudShape(w, h, 0, 0, lw, t);
    ctx.fill();
    ctx.restore();
  }
  const g = ctx.createLinearGradient(0, -h * 0.6, 0, h * 1.3);
  g.addColorStop(0, fillTop);
  g.addColorStop(1, fillBot);
  ctx.fillStyle = g;
  cloudShape(w, h, 0, 0, 0, t);
  ctx.fill();
  if (uiStyle === 'paper'){
    ctx.save();
    cloudShape(w, h, 0, 0, 0, t);
    ctx.clip();
    ctx.strokeStyle = 'rgba(58,74,106,.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -h; x < w + h; x += 6){ ctx.moveTo(x, h * 1.3); ctx.lineTo(x + h * 0.9, h * 0.35); }
    ctx.stroke();
    ctx.restore();
  }
  if (uiStyle === 'neon'){
    ctx.fillStyle = 'rgba(143,230,255,.55)';
    for (let i = 0; i < 3; i++){
      const px = w * (0.25 + i * 0.25), py = h * 0.55;
      ctx.beginPath(); ctx.arc(px, py, 1.4 + 0.6 * Math.sin(t * 3 + i), 0, Math.PI * 2); ctx.fill();
    }
  }
  if (shine > 0){
    ctx.globalAlpha = a * shine;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(w * 0.33, h * 0.12, h * 0.42, h * 0.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(w * 0.56, h * 0.02, h * 0.3, h * 0.14, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a;
  }
}

function drawPlat3D(p, key, w, h, y){
  const d = ultraDepthVector(p.x + w / 2, y + h / 2);
  const k3 = typeof key === 'number' ? PLAT3D[key % PLAT3D.length] : PLAT3D_T[key];
  const sk3 = plat3dSkin(key);
  const sx = w - PW;
  if (k3.deco === 'metal'){
    const tt = performance.now() / 1000 + p.x * 0.02;
    const by = h - 1 + k3.deep;
    const fl = 0.75 + 0.25 * Math.sin(tt * 14) + 0.1 * Math.sin(tt * 31);
    const jg = ctx.createRadialGradient(w / 2, by + 3, 1, w / 2, by + 3, 20 * fl);
    jg.addColorStop(0, 'rgba(200,252,255,.95)');
    jg.addColorStop(0.3, 'rgba(95,244,255,.5)');
    jg.addColorStop(1, 'rgba(95,244,255,0)');
    ctx.fillStyle = jg;
    ctx.beginPath(); ctx.ellipse(w / 2, by + 6 * fl, 12, 16 * fl, 0, 0, 6.2832); ctx.fill();
  }
  const ex = d.dx * 0.9, ey = d.dy * 0.75;
  if (Math.abs(ex) + Math.abs(ey) > 0.6){
    const bl = ultraSideBlend(d.dy);
    const a0 = ctx.globalAlpha;
    for (let st = 4; st >= 1; st--){
      const k = st / 4;
      const x = sk3.ox + ex * k, y = sk3.oy + ey * k;
      if (bl < 0.98){ ctx.globalAlpha = a0; ctx.drawImage(sk3.s, x, y, sk3.w + sx, sk3.h); }
      if (bl > 0.02){ ctx.globalAlpha = a0 * bl; ctx.drawImage(sk3.s2, x, y, sk3.w + sx, sk3.h); }
    }
    ctx.globalAlpha = a0;
  }
  ctx.drawImage(sk3.c, sk3.ox, sk3.oy, sk3.w + sx, sk3.h);
}

function drawPlatform(p){
  const y = p.y - camY;
  if (y < -70 || y > VH + 70) return;

  let c1, c2, c3;
  if (p.type === 'moving')      { c1 = '#7ad3ff'; c2 = '#2f8ddb'; c3 = '#1c5f9c'; }
  else if (p.type === 'broken') { c1 = '#c9915c'; c2 = '#9a6134'; c3 = '#6d4322'; }
  else if (p.type === 'cloud')  { c1 = '#ffffff'; c2 = '#e4ecf6'; c3 = '#aebbd0'; }
  else if (p.type === 'bouncy') { c1 = '#ffb3e0'; c2 = '#e8559f'; c3 = '#a3306a'; }
  else if (p.type === 'blink')  { c1 = '#b8fff4'; c2 = '#3fd6c2'; c3 = '#1f8f82'; }
  else if (p.type === 'tele')   { c1 = '#dcc6ff'; c2 = '#9a66f0'; c3 = '#5c34a8'; }
  else {
    const pt = PLATFORM_THEMES[platformTheme] || PLATFORM_THEMES.auto;
    c1 = pt.c1; c2 = pt.c2; c3 = pt.c3;
  }

  const w = p.w, h = p.h;

  ctx.save();
  ctx.globalAlpha = clamp(p.alpha, 0, 1);
  ctx.translate(p.x + w / 2, y + h / 2);
  ctx.scale(1 + p.wobble * 0.14, 1 - p.wobble * 0.22);
  if (p.broken) ctx.rotate(p.rot * clamp(p.fallV / 400, 0, 1));
  ctx.translate(-w / 2, -h / 2);

  if (p.type === 'cloud') drawCloudBody(p, w, h);
  else if (skinnedPlatform(p)){
    const skw = p.skin !== undefined ? p.skin : worldIndex();
    if (ultraGfx()) drawPlat3D(p, skw, w, h, y);
    else {
      const sk = platSkin(skw);
      ctx.drawImage(sk.c, sk.ox, sk.oy, sk.w + (w - PW), sk.h);
    }
  }
  else if (ultraGfx() && uiStyle === 'classic' && PLAT3D_T[p.type]) drawPlat3D(p, p.type, w, h, y);
  else if (uiStyle !== 'classic') drawStyledPlatformBody(p, w, h);
  else {
  if (ultraGfx()){
    const d = ultraDepthVector(p.x + w / 2, y + h / 2);
    const dx = d.dx, dy = d.dy;
    const a0 = ctx.globalAlpha;
    const shadowK = (1 - ultraSideBlend(dy)) * clamp(dy / ULTRA_DEPTH_Y, 0, 1);
    if (shadowK > 0.01){
      ctx.globalAlpha = a0 * 0.16 * shadowK;
      ctx.fillStyle = '#000';
      rr(ctx, dx * 1.8, dy * 2.2, w, h, 8);
      ctx.fill();
      ctx.globalAlpha = a0;
    }
    const side = ultraSideStyle(dy, c2, c3);
    ctx.fillStyle = side.color;
    for (let s = 4; s >= 1; s--){
      rr(ctx, dx * s / 4, dy * s / 4, w, h, 8);
      ctx.fill();
    }
    ctx.globalAlpha = a0 * side.overlay;
    ctx.fillStyle = '#000';
    rr(ctx, dx, dy, w, h, 8);
    ctx.fill();
    ctx.globalAlpha = a0;
  } else {
    ctx.fillStyle = c3;
    rr(ctx, 0, 4, w, h, 8);
    ctx.fill();
  }

  ctx.fillStyle = platformGradient(c1, c2, h);
  rr(ctx, 0, 0, w, h, 8);
  ctx.fill();

  const a = ctx.globalAlpha;
  ctx.globalAlpha = a * 0.45;
  ctx.fillStyle = '#ffffff';
  rr(ctx, 6, 3, w - 12, 4, 2);
  ctx.fill();
  ctx.globalAlpha = a;

  if (p.type === 'broken'){
    ctx.strokeStyle = 'rgba(60,32,14,.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(w * 0.32, 1);  ctx.lineTo(w * 0.40, h - 1);
    ctx.moveTo(w * 0.62, 1);  ctx.lineTo(w * 0.55, h - 1);
    ctx.moveTo(w * 0.46, 4);  ctx.lineTo(w * 0.76, 6);
    ctx.stroke();
  }
  }

  if (p.type === 'bouncy'){
    const sq = (p.springC || 0) * 3;
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, h * 0.5 + sq); ctx.quadraticCurveTo(w / 2, h * 0.5 + 4 + sq, w - 8, h * 0.5 + sq);
    ctx.stroke();
  }
  if (p.type === 'tele'){
    const tt = performance.now() / 600;
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++){
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 6 + k * 5, 2.5 + k * 1.2, 0, tt + k, tt + k + 3.6);
      ctx.stroke();
    }
  }
  if (p.spring){
    const c = clamp(p.springC, -0.3, 1);
    const baseH = 20 * (1 - c * 0.72);
    const sxp = w * 0.5, top = -baseH;
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 6; i++){
      const tt = i / 6;
      const yy = -baseH * (1 - tt);
      const xx = sxp + (i % 2 === 0 ? -8 : 8) * (1 - c * 0.35);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.fillStyle = '#ff8a3d';
    rr(ctx, sxp - 13, top - 6, 26, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    rr(ctx, sxp - 9, top - 5, 18, 2.4, 1.2);
    ctx.fill();
  }

  ctx.restore();
}


function drawStyledPlatformBody(p, w, h){
  const a0 = ctx.globalAlpha;
  const tp = p.type;
  if (uiStyle === 'aero'){
    const pt = PLATFORM_THEMES[platformTheme];
    const c = tp === 'moving' ? ['#c4f0ff', '#35b0f0', '#0d6cc0'] : tp === 'broken' ? ['#ffffff', '#d8f2ff', '#8fc9e8']
      : tp === 'cloud' ? ['#ffffff', '#f2f8ff', '#c8d8ea'] : tp === 'bouncy' ? ['#ffd0ec', '#ff6fb5', '#c2327a'] : tp === 'blink' ? ['#d8fff9', '#4fe0cc', '#1f9e8e'] : tp === 'tele' ? ['#eadcff', '#a878ff', '#6a3dc4']
      : (platformTheme !== 'auto' && pt ? [pt.c1, pt.c2, pt.c3] : ['#c8ff8a', '#4cc822', '#1f8a12']);
    const r = h / 2;
    ctx.globalAlpha = a0 * 0.22;
    ctx.fillStyle = '#003a70';
    rr(ctx, 2, 5, w - 2, h, r);
    ctx.fill();
    ctx.globalAlpha = a0;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c[0]);
    g.addColorStop(0.55, c[1]);
    g.addColorStop(1, c[2]);
    ctx.fillStyle = g;
    rr(ctx, 0, 0, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const hg = ctx.createLinearGradient(0, 1, 0, h * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,.95)');
    hg.addColorStop(1, 'rgba(255,255,255,.08)');
    ctx.fillStyle = hg;
    rr(ctx, w * 0.07, 1.5, w * 0.86, h * 0.44, h * 0.22);
    ctx.fill();
    ctx.globalAlpha = a0 * 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.72, 5, 2, 0, 0, 6.2832);
    ctx.fill();
    ctx.globalAlpha = a0;
    if (tp === 'broken'){
      ctx.strokeStyle = 'rgba(80,140,180,.7)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, 1); ctx.lineTo(w * 0.42, h * 0.5); ctx.lineTo(w * 0.38, h - 1);
      ctx.moveTo(w * 0.64, 1); ctx.lineTo(w * 0.58, h - 1);
      ctx.stroke();
    }
    return;
  }
  if (uiStyle === 'neon'){
    const col = tp === 'moving' ? '#ff4fd8' : tp === 'broken' ? '#ffb020' : tp === 'cloud' ? '#ffffff' : tp === 'bouncy' ? '#ff7ad9' : tp === 'blink' ? '#7dffb0' : tp === 'tele' ? '#b388ff' : '#39f3ff';
    const r = 6;
    ctx.globalAlpha = a0 * 0.2;
    ctx.fillStyle = col;
    rr(ctx, 0, 0, w, h, r);
    ctx.fill();
    if (tp === 'broken') ctx.setLineDash([7, 5]);
    ctx.strokeStyle = col;
    ctx.globalAlpha = a0 * 0.22;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.globalAlpha = a0 * 0.45;
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.globalAlpha = a0;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  const fill = tp === 'moving' ? '#a9dbff' : tp === 'broken' ? '#ecd2ad' : tp === 'cloud' ? '#ffffff' : tp === 'bouncy' ? '#ffc4e4' : tp === 'blink' ? '#c4f5ec' : tp === 'tele' ? '#dccbff' : '#b8ec9a';
  const ink = '#243b8c';
  const j = ((p.x * 7.3 + p.w * 3.1) % 1 + 1) % 1;
  ctx.fillStyle = fill;
  rr(ctx, 1, 1 + j, w - 2, h - 1, 5);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  rr(ctx, 1, 1 + j, w - 2, h - 1, 5);
  ctx.clip();
  ctx.strokeStyle = 'rgba(36,59,140,.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -h; x < w; x += 7){ ctx.moveTo(x, h); ctx.lineTo(x + h, 0); }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  if (tp === 'broken') ctx.setLineDash([6, 4]);
  rr(ctx, 0, j, w, h, 6);
  ctx.stroke();
  ctx.globalAlpha = a0 * 0.55;
  ctx.lineWidth = 1;
  rr(ctx, 1.5 - j, 1.2, w - 1, h - 0.5, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = a0;
  if (tp === 'broken'){
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(w * 0.4, 1); ctx.lineTo(w * 0.47, h * 0.45); ctx.lineTo(w * 0.42, h * 0.7); ctx.lineTo(w * 0.5, h - 1);
    ctx.stroke();
  }
}

const coinGlowCvs = document.createElement('canvas');
let coinGlowReady = false;
function getCoinGlow(){
  if (coinGlowReady) return coinGlowCvs;
  coinGlowReady = true;
  coinGlowCvs.width = 48;
  coinGlowCvs.height = 48;
  const gc = coinGlowCvs.getContext('2d');
  const gl = gc.createRadialGradient(24, 24, 1, 24, 24, 24);
  gl.addColorStop(0, 'rgba(255,214,90,.34)');
  gl.addColorStop(1, 'rgba(255,214,90,0)');
  gc.fillStyle = gl;
  gc.fillRect(0, 0, 48, 48);
  return coinGlowCvs;
}
let coinFaceGrad = null;
function getCoinFaceGradient(){
  if (coinFaceGrad) return coinFaceGrad;
  coinFaceGrad = ctx.createLinearGradient(-11, -11, 11, 11);
  coinFaceGrad.addColorStop(0, '#fff0a8');
  coinFaceGrad.addColorStop(0.45, '#ffc42e');
  coinFaceGrad.addColorStop(1, '#e09a10');
  return coinFaceGrad;
}

function drawCoin(c){
  const bob = Math.sin(c.bob) * 4;
  const y = c.y - camY + bob;
  if (y < -50 || y > VH + 50) return;

  const spin = Math.abs(Math.cos(c.phase));
  const grab = c.got > 0 ? c.got : 0;
  const alpha = 1 - grab;
  const R = 11;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(c.x, y - grab * 34);
  if (grab > 0) ctx.scale(1 + grab * 1.4, 1 + grab * 1.4);

  if (!lowGfx()) ctx.drawImage(getCoinGlow(), -R * 2.1, -R * 2.1, R * 4.2, R * 4.2);

  ctx.scale(clamp(spin, 0.14, 1), 1);

  ctx.fillStyle = '#b8770d';
  ctx.beginPath();
  ctx.arc(0, 1.6, R, 0, 6.2832);
  ctx.fill();

  ctx.fillStyle = getCoinFaceGradient();
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 6.2832);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.64, 0, 6.2832);
  ctx.stroke();

  ctx.fillStyle = 'rgba(160,100,10,.55)';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.14, R * 0.26, R * 0.21, 0, 0, 6.2832);
  ctx.ellipse(-R * 0.26, -R * 0.20, R * 0.10, R * 0.13, 0, 0, 6.2832);
  ctx.ellipse(-R * 0.02, -R * 0.30, R * 0.10, R * 0.13, 0, 0, 6.2832);
  ctx.ellipse( R * 0.24, -R * 0.20, R * 0.10, R * 0.13, 0, 0, 6.2832);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.ellipse(-R * 0.34, -R * 0.42, R * 0.2, R * 0.32, -0.6, 0, 6.2832);
  ctx.fill();

  ctx.restore();
}


function drawMonster(m){
  const y = m.y - camY;
  if (y < -60 || y > VH + 60) return;
  const squish = 1 + Math.sin(m.bob) * 0.06;

  
  const fade = m.life < 1.5 ? clamp(m.life / 1.5, 0, 1) : 1;

  ctx.save();
  ctx.translate(m.x, y);
  ctx.scale(1, squish);
  ctx.globalAlpha *= fade;

  if (m.frozen){
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 160);
    ctx.globalAlpha = 0.35 + 0.25 * pulse;
    const glow = ctx.createRadialGradient(0, 0, m.r * 0.6, 0, 0, m.r * 2.2);
    glow.addColorStop(0, 'rgba(217,166,255,.55)');
    glow.addColorStop(1, 'rgba(217,166,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, m.r * 2.2, 0, 6.2832);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const look = clamp((hero.x - m.x) / 100, -1, 1);
  monsterArt(ctx, m.w != null ? m.w : worldIndex(), m.r, performance.now() / 1000 + m.x * 0.013, look);

  ctx.restore();
}
