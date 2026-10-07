"use strict";
const PUP_RIG = {"order":["legL","legR","torso","earL","earR","armL","armR","head"],"parts":{"legL":{"box":[168,366,268,470],"pivot":[226,380],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"168 366 100 104\" width=\"100\" height=\"104\"><defs><linearGradient id=\"pants\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4a4a5c\"/><stop offset=\"1\" stop-color=\"#34343f\"/></linearGradient><pattern id=\"sockStripes\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"22\" height=\"512\" patternTransform=\"rotate(8)\"><rect width=\"22\" height=\"512\" fill=\"#b9bccb\"/><rect width=\"9\" height=\"512\" fill=\"#f1f1f6\"/></pattern></defs><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M204 378 L202 420 Q222 426 244 420 L248 378 Z\" fill=\"url(#pants)\"/><path d=\"M180 446 Q178 418 206 414 L232 414 Q256 418 256 442 Q256 458 218 458 Q180 458 180 446 Z\" fill=\"url(#sockStripes)\"/></g><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.5\"><path d=\"M206 444 L206 452\"/><path d=\"M228 444 L228 452\"/></g></svg>"},"legR":{"box":[244,366,344,470],"pivot":[286,380],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"244 366 100 104\" width=\"100\" height=\"104\"><defs><linearGradient id=\"pants\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4a4a5c\"/><stop offset=\"1\" stop-color=\"#34343f\"/></linearGradient><pattern id=\"sockStripes\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"22\" height=\"512\" patternTransform=\"rotate(8)\"><rect width=\"22\" height=\"512\" fill=\"#b9bccb\"/><rect width=\"9\" height=\"512\" fill=\"#f1f1f6\"/></pattern></defs><g transform=\"translate(512 0) scale(-1 1)\"><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M204 378 L202 420 Q222 426 244 420 L248 378 Z\" fill=\"url(#pants)\"/><path d=\"M180 446 Q178 418 206 414 L232 414 Q256 418 256 442 Q256 458 218 458 Q180 458 180 446 Z\" fill=\"url(#sockStripes)\"/></g><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.5\"><path d=\"M206 444 L206 452\"/><path d=\"M228 444 L228 452\"/></g></g></svg>"},"torso":{"box":[144,274,368,398],"pivot":[0,0],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"144 274 224 124\" width=\"224\" height=\"124\"><defs><linearGradient id=\"shade\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#000\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#1a1530\" stop-opacity=\"0.28\"/></linearGradient><pattern id=\"stripes\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"296\" width=\"40\" height=\"38\"><rect width=\"40\" height=\"38\" fill=\"#ecebf2\"/><rect width=\"40\" height=\"19\" fill=\"#565b72\"/></pattern></defs><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M198 290 L314 290 Q340 290 340 316 L340 364 Q340 390 314 390 L198 390 Q172 390 172 364 L172 316 Q172 290 198 290 Z\" fill=\"url(#stripes)\"/><path d=\"M198 290 L314 290 Q340 290 340 316 L340 364 Q340 390 314 390 L198 390 Q172 390 172 364 L172 316 Q172 290 198 290 Z\" fill=\"url(#shade)\" stroke=\"none\"/><path d=\"M198 290 L314 290 Q340 290 340 316 L340 364 Q340 390 314 390 L198 390 Q172 390 172 364 L172 316 Q172 290 198 290 Z\" fill=\"none\"/></g></svg>"},"armL":{"box":[100,290,200,414],"pivot":[180,316],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"100 290 100 124\" width=\"100\" height=\"124\"><defs><linearGradient id=\"paw\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e3a549\"/><stop offset=\"1\" stop-color=\"#bb7f2e\"/></linearGradient><pattern id=\"stripes\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"296\" width=\"40\" height=\"38\"><rect width=\"40\" height=\"38\" fill=\"#ecebf2\"/><rect width=\"40\" height=\"19\" fill=\"#565b72\"/></pattern></defs><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M178 304 Q144 318 130 356 L126 372 L158 378 L162 362 Q168 344 186 334 Z\" fill=\"url(#stripes)\"/><ellipse cx=\"140\" cy=\"386\" rx=\"22\" ry=\"19\" fill=\"url(#paw)\"/></g><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.55\"><path d=\"M134 379 L134 393\"/><path d=\"M146 379 L146 393\"/></g></svg>"},"armR":{"box":[312,290,412,414],"pivot":[332,316],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"312 290 100 124\" width=\"100\" height=\"124\"><defs><linearGradient id=\"paw\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e3a549\"/><stop offset=\"1\" stop-color=\"#bb7f2e\"/></linearGradient><pattern id=\"stripes\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"296\" width=\"40\" height=\"38\"><rect width=\"40\" height=\"38\" fill=\"#ecebf2\"/><rect width=\"40\" height=\"19\" fill=\"#565b72\"/></pattern></defs><g transform=\"translate(512 0) scale(-1 1)\"><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M178 304 Q144 318 130 356 L126 372 L158 378 L162 362 Q168 344 186 334 Z\" fill=\"url(#stripes)\"/><ellipse cx=\"140\" cy=\"386\" rx=\"22\" ry=\"19\" fill=\"url(#paw)\"/></g><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.55\"><path d=\"M134 379 L134 393\"/><path d=\"M146 379 L146 393\"/></g></g></svg>"},"earL":{"box":[72,92,190,326],"pivot":[160,122],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"72 92 118 234\" width=\"118\" height=\"234\"><defs><linearGradient id=\"earOut\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9983c\"/><stop offset=\"1\" stop-color=\"#b37628\"/></linearGradient><linearGradient id=\"earIn\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e9ddcc\"/><stop offset=\"1\" stop-color=\"#f6efe4\"/></linearGradient></defs><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M160 112 Q110 100 92 150 Q72 212 96 290 Q106 318 128 306 Q146 290 146 250 Q150 190 178 140 Z\" fill=\"url(#earOut)\"/></g><path d=\"M150 128 Q116 128 106 168 Q94 222 112 282 Q120 296 128 286 Q136 270 136 240 Q140 186 162 146 Z\" fill=\"url(#earIn)\"/></svg>"},"earR":{"box":[322,92,440,326],"pivot":[352,122],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"322 92 118 234\" width=\"118\" height=\"234\"><defs><linearGradient id=\"earOut\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d9983c\"/><stop offset=\"1\" stop-color=\"#b37628\"/></linearGradient><linearGradient id=\"earIn\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e9ddcc\"/><stop offset=\"1\" stop-color=\"#f6efe4\"/></linearGradient></defs><g transform=\"translate(512 0) scale(-1 1)\"><g stroke=\"#2b2238\" stroke-width=\"9\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M160 112 Q110 100 92 150 Q72 212 96 290 Q106 318 128 306 Q146 290 146 250 Q150 190 178 140 Z\" fill=\"url(#earOut)\"/></g><path d=\"M150 128 Q116 128 106 168 Q94 222 112 282 Q120 296 128 286 Q136 270 136 240 Q140 186 162 146 Z\" fill=\"url(#earIn)\"/></g></svg>"},"head":{"box":[124,68,388,316],"pivot":[256,300],"svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"124 68 264 248\" width=\"264\" height=\"248\"><defs><radialGradient id=\"fur\" cx=\"45%\" cy=\"30%\" r=\"75%\"><stop offset=\"0\" stop-color=\"#f0b858\"/><stop offset=\"0.6\" stop-color=\"#d8993c\"/><stop offset=\"1\" stop-color=\"#b0752a\"/></radialGradient><linearGradient id=\"blaze\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf6ee\"/><stop offset=\"1\" stop-color=\"#ece0cd\"/></linearGradient><radialGradient id=\"muzzle\" cx=\"50%\" cy=\"35%\" r=\"70%\"><stop offset=\"0\" stop-color=\"#f3dcb4\"/><stop offset=\"1\" stop-color=\"#dcb57c\"/></radialGradient><radialGradient id=\"nose\" cx=\"40%\" cy=\"30%\" r=\"75%\"><stop offset=\"0\" stop-color=\"#5a5468\"/><stop offset=\"0.5\" stop-color=\"#2f2a3a\"/><stop offset=\"1\" stop-color=\"#1c1824\"/></radialGradient><radialGradient id=\"iris\" cx=\"50%\" cy=\"60%\" r=\"55%\"><stop offset=\"0\" stop-color=\"#b07a4a\"/><stop offset=\"0.7\" stop-color=\"#7a4a26\"/><stop offset=\"1\" stop-color=\"#4e2c14\"/></radialGradient></defs><path d=\"M256 76 C340 74 382 130 380 196 C378 262 330 306 256 306 C182 306 134 262 132 196 C130 130 172 78 256 76 Z\" fill=\"url(#fur)\"/><path d=\"M226 80 C236 77 276 77 286 80 C294 120 290 160 300 200 L212 200 C222 160 218 120 226 80 Z\" fill=\"url(#blaze)\"/><path d=\"M256 196 C312 194 336 226 334 256 C332 290 298 304 256 304 C214 304 180 290 178 256 C176 226 200 194 256 196 Z\" fill=\"url(#muzzle)\" stroke=\"#2b2238\" stroke-width=\"6\" stroke-opacity=\"0.35\"/><path d=\"M256 76 C340 74 382 130 380 196 C378 262 330 306 256 306 C182 306 134 262 132 196 C130 130 172 78 256 76 Z\" fill=\"none\" stroke=\"#2b2238\" stroke-width=\"9\"/><ellipse cx=\"208\" cy=\"176\" rx=\"25\" ry=\"28\" fill=\"#fdfbf7\" stroke=\"#2b2238\" stroke-width=\"6\"/><ellipse cx=\"304\" cy=\"176\" rx=\"25\" ry=\"28\" fill=\"#fdfbf7\" stroke=\"#2b2238\" stroke-width=\"6\"/><circle cx=\"211\" cy=\"180\" r=\"16\" fill=\"url(#iris)\"/><circle cx=\"301\" cy=\"180\" r=\"16\" fill=\"url(#iris)\"/><circle cx=\"211\" cy=\"181\" r=\"8.5\" fill=\"#1c1824\"/><circle cx=\"301\" cy=\"181\" r=\"8.5\" fill=\"#1c1824\"/><circle cx=\"205\" cy=\"172\" r=\"6\" fill=\"#fff\"/><circle cx=\"295\" cy=\"172\" r=\"6\" fill=\"#fff\"/><circle cx=\"217\" cy=\"189\" r=\"2.8\" fill=\"#fff\"/><circle cx=\"307\" cy=\"189\" r=\"2.8\" fill=\"#fff\"/><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"7\" stroke-linecap=\"round\"><path d=\"M188 136 Q200 128 214 134\"/><path d=\"M324 136 Q312 128 298 134\"/></g><path d=\"M256 214 C279 213 290 222 289 236 C288 252 272 265 256 265 C240 265 224 252 223 236 C222 222 233 213 256 214 Z\" fill=\"url(#nose)\" stroke=\"#2b2238\" stroke-width=\"6\"/><ellipse cx=\"245\" cy=\"225\" rx=\"10\" ry=\"5\" fill=\"#fff\" opacity=\"0.35\"/><g fill=\"none\" stroke=\"#2b2238\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M256 265 L256 280\"/><path d=\"M226 278 Q240 292 256 280 Q272 292 286 278\"/></g><g fill=\"#8a5a2a\" opacity=\"0.7\"><circle cx=\"206\" cy=\"262\" r=\"3.2\"/><circle cx=\"196\" cy=\"274\" r=\"3.2\"/><circle cx=\"214\" cy=\"278\" r=\"3.2\"/><circle cx=\"306\" cy=\"262\" r=\"3.2\"/><circle cx=\"316\" cy=\"274\" r=\"3.2\"/><circle cx=\"298\" cy=\"278\" r=\"3.2\"/></g></svg>"}}};
const RIG_CHARS = { hero11: PUP_RIG };
const RIG_OY = 36;
const RIG_HI = 1;
const RIG_LO = SPRITE_MAX_PX / 512;

function rasterRigPart(img, part, k){
  const b = part.box;
  const w = Math.max(1, Math.round((b[2] - b[0]) * k));
  const h = Math.max(1, Math.round((b[3] - b[1]) * k));
  try {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    return c;
  } catch (e) { return img; }
}

function loadRigChar(id){
  const def = RIG_CHARS[id];
  const rec = { rig: def, ready: false, hi: {}, lo: {}, left: def.order.length };
  charImgs[id] = rec;
  def.order.forEach((name) => {
    const part = def.parts[name];
    const img = new Image();
    img.onload = () => {
      rec.hi[name] = rasterRigPart(img, part, RIG_HI);
      rec.lo[name] = rasterRigPart(img, part, RIG_LO);
      rec.left--;
      if (rec.left <= 0) rec.ready = true;
    };
    img.onerror = () => { rec.ready = false; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(part.svg);
  });
}

for (const id of Object.keys(OUTFITS.char)){
  if (RIG_CHARS[id]) loadRigChar(id);
  else loadCharImage(id);
}

const RIG_CACHE_MAX = 72;
const RIG_FRAME_PAD = 0.2;
const RIG_FRAME_MAX_PX = 200;
const rigFrameCache = new Map();
let rigFrameScale = 0;
let rigU = 0, rigPhase = 0, rigLiveT = 0;
let rigDrawPose = null;
const rigLive = rigPoseFrom(0, 0);

function rigPoseFrom(u, phaseIdx){
  const rise = Math.max(0, -u), fall = Math.max(0, u);
  const ph = phaseIdx / 8 * Math.PI * 2;
  const ear = -0.3 * rise + 1.3 * fall + Math.sin(ph) * 0.22 * fall;
  return {
    armL: 0, armR: 0, legL: 0, legR: 0, head: 0, tuck: 0, blink: 0,
    earL: ear, earR: -ear,
    key: u + '|' + phaseIdx
  };
}

function rigIdlePose(){
  const now = performance.now() / 1000;
  const sway = Math.sin(now * 1.7 + 0.8) * 0.12;
  return { armL: 0, armR: 0, legL: 0, legR: 0, head: 0, tuck: 0, blink: 0, earL: sway, earR: -sway };
}

function updateRigPose(){
  const now = performance.now() / 1000;
  const dt = rigLiveT ? Math.min(0.05, Math.max(0, now - rigLiveT)) : 0.016;
  rigLiveT = now;
  const target = clamp(hero.vy / -JUMP_V, -1, 1);
  rigU += (target - rigU) * (1 - Math.exp(-dt * 14));
  rigPhase = (rigPhase + dt * 2.8) % 1;
  const uq = Math.round(rigU * 5) / 5;
  const phaseIdx = uq > 0 ? Math.floor(rigPhase * 8) % 8 : 0;
  const pose = rigPoseFrom(uq, phaseIdx);
  if (pose.key !== rigLive.key) Object.assign(rigLive, pose);
}

function rigPoseKey(){
  return rigLive.key;
}

function paintRigParts(c, s, rec, set, pose){
  const def = rec.rig;
  for (const name of def.order){
    const part = def.parts[name];
    const cv = set[name];
    if (!cv) continue;
    const b = part.box;
    const x0 = (b[0] - 256) * s, y0 = (b[1] - 256 + RIG_OY) * s;
    const bw = (b[2] - b[0]) * s, bh = (b[3] - b[1]) * s;
    const ang = pose[name] || 0;
    const sy = (name === 'legL' || name === 'legR') ? 1 - 0.2 * (pose.tuck || 0) : 1;
    if (!ang && sy === 1){ c.drawImage(cv, x0, y0, bw, bh); continue; }
    const px = (part.pivot[0] - 256) * s, py = (part.pivot[1] - 256 + RIG_OY) * s;
    c.save();
    c.translate(px, py);
    c.rotate(ang);
    if (sy !== 1) c.scale(1, sy);
    c.translate(-px, -py);
    c.drawImage(cv, x0, y0, bw, bh);
    c.restore();
  }
}

function rigFramePx(w){
  const px = Math.ceil(w * (1 + 2 * RIG_FRAME_PAD) * S * DPR);
  return Math.max(48, Math.min(RIG_FRAME_MAX_PX, px));
}

function getRigFrame(rec, pose, w){
  const px = rigFramePx(w);
  if (px !== rigFrameScale){ rigFrameCache.clear(); rigFrameScale = px; }
  const key = pose.key;
  let cv = rigFrameCache.get(key);
  if (cv){
    rigFrameCache.delete(key);
    rigFrameCache.set(key, cv);
    return cv;
  }
  try {
    cv = document.createElement('canvas');
    cv.width = px; cv.height = px;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.translate(px / 2, px / 2);
    paintRigParts(g, px / ((1 + 2 * RIG_FRAME_PAD) * 512), rec, rec.hi, pose);
  } catch (e) { return null; }
  rigFrameCache.set(key, cv);
  while (rigFrameCache.size > RIG_CACHE_MAX) rigFrameCache.delete(rigFrameCache.keys().next().value);
  return cv;
}

function paintRig(c, w, h, rec, pose){
  if (pose.key){
    const frame = getRigFrame(rec, pose, w);
    if (frame){
      const fw = w * (1 + 2 * RIG_FRAME_PAD);
      const q = c.imageSmoothingQuality;
      c.imageSmoothingQuality = 'medium';
      c.drawImage(frame, -fw / 2, -fw / 2, fw, fw);
      c.imageSmoothingQuality = q;
      return;
    }
  }
  paintRigParts(c, w / 512, rec, c === ctx ? rec.lo : rec.hi, pose);
}

function rigCharActive(){
  const rec = charImgs[outfit.char];
  return !!(rec && rec.rig && rec.ready);
}

const currentCharReady = () => !!(charImgs[outfit.char] && charImgs[outfit.char].ready);


const WEP_INK = '#2b2238';
function inkPath(g, fill, lw){
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = WEP_INK; g.lineWidth = lw || 3;
  g.stroke();
  g.fillStyle = fill;
  g.fill();
}
function paintMaceArt(){
  const K = 4, W = 64, H = 128;
  const c = document.createElement('canvas');
  c.width = W * K; c.height = H * K;
  const g = c.getContext('2d');
  if (!g) return c;
  g.scale(K, K);
  const wood = g.createLinearGradient(27, 0, 37, 0);
  wood.addColorStop(0, '#6e421f'); wood.addColorStop(0.45, '#b07840'); wood.addColorStop(1, '#5a3418');
  g.beginPath(); rr(g, 28, 48, 8, 70, 4); inkPath(g, wood, 3);
  g.save();
  g.beginPath(); rr(g, 28, 48, 8, 70, 4); g.clip();
  for (const y of [66, 80, 94, 108]){
    g.fillStyle = '#5b2f78';
    g.beginPath(); g.moveTo(26, y); g.lineTo(38, y - 5); g.lineTo(38, y + 1); g.lineTo(26, y + 6); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath(); g.moveTo(26, y); g.lineTo(38, y - 5); g.lineTo(38, y - 3.5); g.lineTo(26, y + 1.5); g.closePath(); g.fill();
  }
  g.restore();
  const gold = g.createRadialGradient(30, 118, 1, 32, 121, 8);
  gold.addColorStop(0, '#fff6c0'); gold.addColorStop(0.5, '#ffc83d'); gold.addColorStop(1, '#b8780e');
  g.beginPath(); g.arc(32, 121, 5.5, 0, 6.2832); inkPath(g, gold, 3);
  const band = g.createLinearGradient(0, 44, 0, 54);
  band.addColorStop(0, '#fff0a0'); band.addColorStop(1, '#c98a14');
  g.beginPath(); rr(g, 23, 44, 18, 8, 3); inkPath(g, band, 3);
  for (let i = 0; i < 8; i++){
    const a = i / 8 * 6.2832 - Math.PI / 2;
    const bx = 32 + Math.cos(a) * 18, by = 26 + Math.sin(a) * 18;
    const tx = 32 + Math.cos(a) * 27, ty = 26 + Math.sin(a) * 27;
    const nx = -Math.sin(a) * 6, ny = Math.cos(a) * 6;
    g.beginPath();
    g.moveTo(bx + nx, by + ny);
    g.quadraticCurveTo(tx + nx * 0.25, ty + ny * 0.25, tx, ty);
    g.quadraticCurveTo(tx - nx * 0.25, ty - ny * 0.25, bx - nx, by - ny);
    g.closePath();
    const sg = g.createLinearGradient(bx, by, tx, ty);
    sg.addColorStop(0, '#8d96aa'); sg.addColorStop(1, '#e9edf5');
    inkPath(g, sg, 2.6);
  }
  const head = g.createRadialGradient(25, 18, 2, 32, 26, 21);
  head.addColorStop(0, '#ffffff'); head.addColorStop(0.35, '#d9dee8'); head.addColorStop(0.8, '#8a93a8'); head.addColorStop(1, '#5d6478');
  g.beginPath(); g.arc(32, 26, 19, 0, 6.2832); inkPath(g, head, 3);
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.beginPath(); g.ellipse(24, 17, 6, 3, -0.6, 0, 6.2832); g.fill();
  const glow = g.createRadialGradient(32, 27, 1, 32, 27, 13);
  glow.addColorStop(0, 'rgba(210,140,255,.75)'); glow.addColorStop(1, 'rgba(210,140,255,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(32, 27, 13, 0, 6.2832); g.fill();
  const gem = g.createLinearGradient(26, 20, 38, 34);
  gem.addColorStop(0, '#f3dcff'); gem.addColorStop(0.45, '#b56bff'); gem.addColorStop(1, '#5a1fb0');
  g.beginPath(); g.moveTo(32, 18); g.lineTo(39, 27); g.lineTo(32, 36); g.lineTo(25, 27); g.closePath(); inkPath(g, gem, 2.4);
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath(); g.moveTo(32, 20); g.lineTo(35, 25); g.lineTo(32, 27); g.lineTo(29, 25); g.closePath(); g.fill();
  return c;
}
function paintSpearArt(){
  const K = 4, W = 128;
  const c = document.createElement('canvas');
  c.width = W * K; c.height = W * K;
  const g = c.getContext('2d');
  if (!g) return c;
  g.scale(K, K);
  g.translate(14, 114);
  g.rotate(-Math.PI / 4);
  const shaft = g.createLinearGradient(0, -3.5, 0, 3.5);
  shaft.addColorStop(0, '#c48a4e'); shaft.addColorStop(0.5, '#9a6232'); shaft.addColorStop(1, '#5e3a1c');
  g.beginPath(); rr(g, 0, -3.4, 116, 6.8, 3.4); inkPath(g, shaft, 2.6);
  for (let x = 26; x < 50; x += 5){
    g.fillStyle = '#3d7ad8';
    g.beginPath(); g.moveTo(x, -3.4); g.lineTo(x + 3, -3.4); g.lineTo(x + 1.5, 3.4); g.lineTo(x - 1.5, 3.4); g.closePath(); g.fill();
  }
  g.strokeStyle = WEP_INK; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(24, -3.4); g.lineTo(24, 3.4); g.moveTo(51, -3.4); g.lineTo(51, 3.4); g.stroke();
  const cap = g.createLinearGradient(0, -4, 0, 4);
  cap.addColorStop(0, '#e9edf5'); cap.addColorStop(1, '#7d869a');
  g.beginPath(); rr(g, -3, -4.4, 8, 8.8, 3); inkPath(g, cap, 2.4);
  const rib = g.createLinearGradient(106, 0, 118, 18);
  rib.addColorStop(0, '#ff6b7a'); rib.addColorStop(1, '#c2253a');
  g.beginPath();
  g.moveTo(110, 2); g.bezierCurveTo(104, 10, 112, 14, 104, 22); g.lineTo(109, 21);
  g.bezierCurveTo(116, 14, 110, 10, 115, 3); g.closePath();
  inkPath(g, rib, 2);
  const gold = g.createLinearGradient(0, -8, 0, 8);
  gold.addColorStop(0, '#fff3a8'); gold.addColorStop(1, '#c98a14');
  g.beginPath(); rr(g, 109, -8, 7, 16, 3); inkPath(g, gold, 2.6);
  const blade = g.createLinearGradient(0, -9, 0, 9);
  blade.addColorStop(0, '#ffffff'); blade.addColorStop(0.45, '#d5dbe6'); blade.addColorStop(1, '#7b8498');
  g.beginPath();
  g.moveTo(116, 0);
  g.bezierCurveTo(124, -10, 140, -8, 154, 0);
  g.bezierCurveTo(140, 8, 124, 10, 116, 0);
  g.closePath();
  inkPath(g, blade, 2.6);
  g.strokeStyle = 'rgba(80,90,120,.55)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(119, 0); g.lineTo(150, 0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.8)';
  g.beginPath(); g.moveTo(122, -2); g.bezierCurveTo(130, -6, 140, -5, 148, -1); g.bezierCurveTo(138, -3, 130, -3, 122, -2); g.fill();
  return c;
}
const maceArt = paintMaceArt();
const maceImg = { naturalWidth: maceArt.width, naturalHeight: maceArt.height };
let maceReady = true;
let maceDraw = maceArt;


const ANCHOR_SPRITE = { topY: -0.345, cx: 0.015, hw: 0.235, eyeY: -0.155, eyeDX: 0.085, neckY: 0.145, handX: 0.27, handY: 0.30 };
const ANCHOR_VECTOR = { topY: -0.400, cx: 0.000, hw: 0.290, eyeY: -0.040, eyeDX: 0.150, neckY: 0.330, handX: 0.21, handY: 0.38 };

const CHAR_ANCHORS = {
  // стандартный котокролик (hero.png): голова наклонена, вещи меньше и правее, как в Cabbit pet
  hero: { topY: -0.352, cx: 0.08, hw: 0.235, eyeY: -0.172, eyeDX: 0.105, neckY: 0.102, handX: 0.27, handY: 0.30,
          hatRot: -0.17, hatS: 0.78, accCx: 0.102, accRot: -0.12, accS: 0.8, eyeCx: 0.105, eyeRot: -0.165 },
  freehero3: { topY: -0.178, cx: -0.11, hw: 0.235, eyeY: -0.05, eyeDX: 0.053, neckY: 0.086, handX: 0.0, handY: 0.25,
          hatRot: 0, hatS: 0.55, accCx: -0.12, accRot: 0, accS: 0.56, eyeCx: -0.115, eyeRot: 0 },
  freehero4: { topY: -0.31, cx: -0.18, hw: 0.235, eyeY: -0.123, eyeDX: 0.0625, neckY: 0.057, handX: 0.0, handY: 0.3,
          hatRot: -0.2, hatS: 0.45, accCx: -0.15, accRot: -0.2, accS: 0.46, eyeCx: -0.156, eyeRot: -0.21 },
  hero2: { topY: -0.41, cx: 0.0, hw: 0.235, eyeY: -0.33, eyeDX: 0.09, neckY: -0.17, handX: 0.18, handY: 0.15, hatRot: 0, hatS: 0.53, accCx: 0.0, accRot: 0, accS: 0.55, eyeCx: -0.01, eyeRot: 0 },
  hero3: { topY: -0.39, cx: -0.02, hw: 0.235, eyeY: -0.12, eyeDX: 0.07, neckY: 0.07, handX: 0.2, handY: 0.3, hatRot: -0.1, hatS: 0.55, accCx: 0.0, accRot: -0.1, accS: 0.55, eyeCx: -0.05, eyeRot: -0.08 },
  hero4: { topY: -0.36, cx: -0.1, hw: 0.235, eyeY: -0.135, eyeDX: 0.165, neckY: 0.11, handX: 0.3, handY: 0.3, hatRot: 0.08, hatS: 0.85, accCx: -0.08, accRot: 0.08, accS: 0.85, eyeCx: -0.085, eyeRot: 0.08 },
  hero5: { topY: -0.42, cx: 0.2, hw: 0.235, eyeY: -0.1, eyeDX: 0.075, neckY: 0.06, handX: 0.3, handY: 0.3, hatRot: 0.05, hatS: 0.42, accCx: 0.2, accRot: 0.05, accS: 0.42, eyeCx: 0.205, eyeRot: 0.05 },
  hero6: { topY: -0.27, cx: 0.02, hw: 0.235, eyeY: -0.13, eyeDX: 0.095, neckY: 0.09, handX: 0.2, handY: 0.3, hatRot: 0, hatS: 0.48, accCx: 0.02, accRot: 0, accS: 0.5, eyeCx: 0.025, eyeRot: 0 },
  hero7: { topY: -0.42, cx: 0.0, hw: 0.235, eyeY: -0.27, eyeDX: 0.06, neckY: -0.11, handX: 0.18, handY: 0.15, hatRot: 0, hatS: 0.62, accCx: 0.0, accRot: 0, accS: 0.5, eyeCx: -0.01, eyeRot: 0 },
  hero8: { topY: -0.36, cx: 0.08, hw: 0.235, eyeY: -0.24, eyeDX: 0.07, neckY: -0.09, handX: 0.25, handY: 0.2, hatRot: 0.05, hatS: 0.5, accCx: 0.1, accRot: 0.05, accS: 0.5, eyeCx: 0.1, eyeRot: 0.05 },
  hero10: { topY: -0.25, cx: 0.05, hw: 0.235, eyeY: -0.13, eyeDX: 0.08, neckY: 0.06, handX: 0.25, handY: 0.3, hatRot: 0, hatS: 0.6, accCx: 0.05, accRot: 0, accS: 0.6, eyeCx: 0.05, eyeRot: 0 },
  hero11: { topY: -0.285, cx: 0.0, hw: 0.235, eyeY: -0.086, eyeDX: 0.094, neckY: 0.15, handX: 0.23, handY: 0.325 }
};
const anchors = () => {
  if (!currentCharReady()) return ANCHOR_VECTOR;
  return CHAR_ANCHORS[outfit.char] || ANCHOR_SPRITE;
};


const GRAV       = 1850;
const JUMP_V      = -790;   
const SPRING_V    = -1117;  
const MACE_LAUNCH = -2550;  
const KICK_LAUNCH = -2050;  
const MOVE_ACC = 1750;   
const MOVE_MAX = 340;    
const AIR_DRAG = 0.045;
const FIXED_DT = 1 / 120;



let glassUsedThisRun = false;
let fallSoundPlayed = false;
let deathPortal = null;
const PORTAL_DUR = 1.25;
const PORTAL_R = 60;
const PORTAL_CLOSE_AT = 0.92;
const multiOn = () => isOwned('perk', 'multiacc');
const hasHat  = (v) => (outfit.hat === v || (multiOn() && outfit.hat2 === v)) && isOwned('hat', v);
const hasAcc  = (v) => (outfit.acc === v || (multiOn() && outfit.acc2 === v)) && isOwned('acc', v);
const hasGlass = () => hasHat('glass') && !glassUsedThisRun;
const shownHat = (v) => (v === 'glass' && glassUsedThisRun) ? 'none' : v;
const gravityMult   = () => (hasHat('propeller') ? 0.55 : 1) * (typeof hasFruit === 'function' && hasFruit('cloud') && hero && hero.vy > 0 ? 0.55 : 1);
const scoreMult      = () => hasAcc('tie') ? 1.25 : 1;
const hasMace       = () => outfit.tool === 'mace' && isOwned('tool', 'mace');
const hasBow        = () => outfit.tool === 'bow'  && isOwned('tool', 'bow');
const hasSpear      = () => outfit.tool === 'spear' && isOwned('tool', 'spear');
const hasPerk       = (k) => outfit.perk === k && isOwned('perk', k);
let spearReady = true;
const SPEAR_CD = 6;
let spearCdLeft = 0;
let spearCdShown = -1;
const SPEAR_V = -1250;
const coinMult      = () => (hasHat('crown') ? 2 : 1);
const hasMagnet     = () => hasHat('halo') || (typeof hasFruit === 'function' && hasFruit('magnet'));
const hasDoubleJump = () => hasAcc('backpack');


const STATE = { MENU: 0, PLAY: 1, PAUSED: 2, OVER: 3, SETTINGS: 4, NICK: 5, WARDROBE: 6, DYING: 7 };
let state = STATE.NICK;
const motionBlurOn = false;

const hero = {
  x: VW / 2, y: 0, vx: 0, vy: 0,
  w: 56, h: 56,
  face: 1, sx: 1, sy: 1, tilt: 0,
  prop: 0, ghosts: [],
  spin: 0 
};

let platforms = [], particles = [], coinsOnMap = [], toasts = [], monsters = [];
let crawlers = [], arrows = [];      
let shootCd = 0, airJumps = 0;       
let camY = 0, camTarget = 0;
let hitStop = 0, speedFx = 0;
let startY = 0, minY = 0, score = 0, runCoins = 0;
let shake = 0, shakeX = 0, shakeY = 0;
let lastPlatY = 0, flash = 0, flashColor = '#fff3c4', blurAmount = 0, blurWanted = 0, coinPulse = 0;
let monsterTimer = 0;
const MONSTER_INTERVAL = 32;
function maxMonsters(){
  return 1;
}
let maceSwing = 0;
let tapEvent = false; 


let monsterEvent = null;
const SLOWMO_SCALE = 0.16;
const QTE_DURATION = 6;

const LASER_START = 5000;
const LASER_HARD = 7500;
const LASER_W = 30;
const LASER_FIRST_DELAY = 2.5;
let lasers = [];
let laserTimer = LASER_FIRST_DELAY;
let laserIntroShown = false;

function laserWarnDur(){ return score >= LASER_HARD ? 1.1 : 1.4; }
function laserFireDur(){ return 0.6; }
function laserCooldown(){ return score >= LASER_HARD ? rand(5.5, 8.5) : rand(8.5, 12.5); }

const LASER_GAP = 150;
function pickLaserXs(count){
  const lo = 40, hi = VW - 40;
  const first = rand(lo, hi);
  if (count < 2) return [first];
  const leftLen = Math.max(0, (first - LASER_GAP) - lo);
  const rightLen = Math.max(0, hi - (first + LASER_GAP));
  if (leftLen + rightLen <= 0) return [first];
  const r = Math.random() * (leftLen + rightLen);
  const second = r < leftLen ? lo + r : (first + LASER_GAP) + (r - leftLen);
  return [first, second];
}

function spawnLaserWave(){
  const count = (score >= LASER_HARD && Math.random() < 0.45) ? 2 : 1;
  for (const x of pickLaserXs(count)){
    lasers.push({ x, w: LASER_W, t: 0, warn: laserWarnDur(), fire: laserFireDur(), fired: false });
  }
  ensureAudio();
  sfxLaserWarn();
}

function laserHitsHero(L){
  return Math.abs(hero.x - L.x) < L.w / 2 + hero.w * 0.26;
}

function updateLasers(dt){
  if (score >= LASER_START && !laserIntroShown){
    laserIntroShown = true;
    addToast(t('laserToast'), VW / 2, camY + VH * 0.3, '#ff6b8a');
  }
  if (score >= LASER_START && lasers.length === 0 && !monsterEvent){
    laserTimer -= dt;
    if (laserTimer <= 0){
      spawnLaserWave();
      laserTimer = laserCooldown();
    }
  }
  for (let i = lasers.length - 1; i >= 0; i--){
    const L = lasers[i];
    L.t += dt;
    if (!L.fired && L.t >= L.warn){
      L.fired = true;
      sfxLaserFire();
      shake = Math.max(shake, 5);
    }
    if (L.t >= L.warn + L.fire){ lasers.splice(i, 1); continue; }
    if (L.fired && !monsterEvent && state === STATE.PLAY && laserHitsHero(L)){
      burstSpark(hero.x, hero.y, '#ff4d6d', 18, 1.2);
      flash = 0.6; flashColor = '#ff4d6d';
      lasers.length = 0;
      laserTimer = laserCooldown();
      handleFatalEvent();
      return;
    }
  }
}


const BAND = 1000;
let layers = [];


const WORLD_THEMES = [
  { name: 'Сумерки',   bg1: [30, 18, 58],  bg2: [96, 52, 132], glow: 'rgba(255,150,90,.22)',
    lbg1: [136, 156, 255], lbg2: [255, 196, 178], lglow: 'rgba(255,236,170,.55)',
    monster: { light: '#c56bd6', dark: '#6f1f85', spike: '#5a1a6b', stroke: '#3a0f4a',
               burst: ['#8a2be2', '#b268ff', '#d9a6ff', '#4b1a80'] } },
  { name: 'Ледяной мир', bg1: [8, 26, 52],  bg2: [26, 92, 132], glow: 'rgba(120,210,255,.24)',
    lbg1: [96, 178, 250], lbg2: [214, 242, 255], lglow: 'rgba(255,255,255,.55)',
    monster: { light: '#5fc9e8', dark: '#175a78', spike: '#12455c', stroke: '#0a2f3e',
               burst: ['#2ba8c9', '#7fe0ff', '#c9f6ff', '#0d5064'] } },
  { name: 'Огненный мир', bg1: [48, 10, 10], bg2: [138, 42, 20], glow: 'rgba(255,120,40,.28)',
    lbg1: [250, 128, 84], lbg2: [255, 214, 150], lglow: 'rgba(255,244,190,.55)',
    monster: { light: '#ff9a5c', dark: '#8a2a10', spike: '#6b2008', stroke: '#3f1204',
               burst: ['#ff5a2b', '#ffb26b', '#ffe3b0', '#7a1f06'] } },
  { name: 'Ядовитый мир', bg1: [8, 38, 16], bg2: [38, 108, 48], glow: 'rgba(140,255,120,.22)',
    lbg1: [96, 200, 150], lbg2: [222, 255, 188], lglow: 'rgba(255,255,210,.5)',
    monster: { light: '#8fe06a', dark: '#286b1e', spike: '#1d5c1d', stroke: '#123a12',
               burst: ['#4bbd4b', '#a6ff8a', '#eaffd6', '#1d5c1d'] } },
  { name: 'Космос',    bg1: [6, 6, 26],    bg2: [34, 22, 74],  glow: 'rgba(180,150,255,.26)',
    lbg1: [84, 104, 214], lbg2: [206, 176, 255], lglow: 'rgba(255,220,255,.5)',
    monster: { light: '#a08cf0', dark: '#3a2a7a', spike: '#2c1f5c', stroke: '#180f38',
               burst: ['#6a5acd', '#b0a4ff', '#e6dcff', '#2c1f5c'] } }
];
