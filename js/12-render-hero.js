"use strict";
const FUR = '#c9c9d4', FUR_LIT = '#eceaf2', FUR_DARK = '#a9a9b8', INK = '#4a4450', PINK = '#e59db0';

function paintEarsGap(){} 

// обёртки: для персонажей с наклонённой головой поворачиваем и масштабируем вещь вокруг точки крепления
function paintHat(c, w, h, kind, A){
  if (!kind || kind === 'none') return;
  if (!A || !(A.hatRot || A.hatS)) return paintHatRaw(c, w, h, kind, A);
  const px = A.cx * w, py = A.topY * h, k = A.hatS || 1;
  c.save();
  c.translate(px, py); c.rotate(A.hatRot || 0); c.scale(k, k); c.translate(-px, -py);
  paintHatRaw(c, w, h, kind, A);
  c.restore();
}
function paintAccessory(c, w, h, kind, A){
  if (!kind || kind === 'none') return;
  if (!A || !isFinite(w) || !isFinite(h)) return;
  if (!(A.accRot || A.accS || A.eyeRot) || kind === 'backpack') return paintAccessoryRaw(c, w, h, kind, A);
  const eye = kind === 'hearteye';
  const cxN = eye ? (A.eyeCx != null ? A.eyeCx : A.cx) : (A.accCx != null ? A.accCx : A.cx);
  const px = cxN * w, py = (eye ? A.eyeY : A.neckY) * h;
  const k = eye ? 1 : (A.accS || 1);
  c.save();
  c.translate(px, py); c.rotate((eye ? A.eyeRot : A.accRot) || 0); c.scale(k, k); c.translate(-px, -py);
  paintAccessoryRaw(c, w, h, kind, Object.assign({}, A, { cx: cxN }));
  c.restore();
}

function paintHatRaw(c, w, h, kind, A){
  if (!kind || kind === 'none') return;
  const cx = A.cx * w;
  const ty = A.topY * h;
  const hw = A.hw * w;

  c.save();
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(28,16,8,.5)';
  c.lineWidth = 1.5;

  if (kind === 'crown'){
    const cw = hw * 1.7, ch = h * 0.22;
    c.fillStyle = '#ffd34d';
    c.strokeStyle = 'rgba(120,70,0,.6)';
    c.beginPath();
    c.moveTo(cx - cw / 2, ty + 1);
    c.lineTo(cx - cw / 2, ty - ch * 0.55);
    c.lineTo(cx - cw * 0.26, ty - ch * 0.12);
    c.lineTo(cx, ty - ch * 1.1);
    c.lineTo(cx + cw * 0.26, ty - ch * 0.12);
    c.lineTo(cx + cw / 2, ty - ch * 0.55);
    c.lineTo(cx + cw / 2, ty + 1);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#ff6f91';
    c.beginPath(); c.arc(cx, ty - ch * 0.22, 2.4, 0, 6.2832); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.beginPath(); c.arc(cx - cw * 0.3, ty - ch * 0.3, 1.6, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(cx + cw * 0.3, ty - ch * 0.3, 1.6, 0, 6.2832); c.fill();

  } else if (kind === 'halo'){
    const ry = ty - h * 0.15;
    c.strokeStyle = 'rgba(255,225,130,.28)';
    c.lineWidth = 8;
    c.beginPath(); c.ellipse(cx, ry, hw * 1.2, h * 0.055, 0, 0, 6.2832); c.stroke();
    c.strokeStyle = 'rgba(255,245,190,.95)';
    c.lineWidth = 3;
    c.beginPath(); c.ellipse(cx, ry, hw * 1.2, h * 0.055, 0, 0, 6.2832); c.stroke();

  } else if (kind === 'party'){
    const ph = h * 0.46, pw = hw * 1.15;
    c.save();
    c.translate(cx, ty + 2);
    c.rotate(-0.16);
    c.beginPath();
    c.moveTo(-pw, 0); c.lineTo(0, -ph); c.lineTo(pw, 0);
    c.quadraticCurveTo(0, 5, -pw, 0);
    c.closePath();
    c.fillStyle = '#ff6f91';
    c.fill();
    c.save();
    c.clip();
    const cols = ['#ffd34d', '#6fd3ff', '#ffffff'];
    for (let k = 0; k < 5; k++){
      c.fillStyle = cols[k % 3];
      c.beginPath();
      const yy = -ph * (0.12 + k * 0.2);
      c.moveTo(-pw * 1.2, yy + 3); c.lineTo(pw * 1.2, yy - 5); c.lineTo(pw * 1.2, yy - 1); c.lineTo(-pw * 1.2, yy + 7);
      c.closePath(); c.fill();
    }
    c.restore();
    c.strokeStyle = 'rgba(90,20,40,.55)';
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-pw, 0); c.lineTo(0, -ph); c.lineTo(pw, 0); c.quadraticCurveTo(0, 5, -pw, 0); c.stroke();
    c.fillStyle = '#fff6d8';
    c.beginPath(); c.arc(0, -ph, 4.2, 0, 6.2832); c.fill();
    c.fillStyle = '#ffd34d';
    c.beginPath(); c.arc(-1.2, -ph - 1.2, 2, 0, 6.2832); c.fill();
    c.restore();

  } else if (kind === 'tophat'){
    const crownH = h * 0.36, crownW = hw * 1.42;
    c.fillStyle = '#251b30';
    rr(c, cx - hw * 2.05, ty - 3, hw * 4.1, 6.5, 3.2);
    c.fill(); c.stroke();
    rr(c, cx - crownW / 2, ty - crownH, crownW, crownH + 2, 4);
    c.fill(); c.stroke();
    c.fillStyle = '#e0466a';
    rr(c, cx - crownW / 2, ty - crownH * 0.28, crownW, crownH * 0.24, 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)';
    rr(c, cx - crownW * 0.34, ty - crownH * 0.88, crownW * 0.16, crownH * 0.55, 3);
    c.fill();

  } else if (kind === 'cowboy'){
    const crownH = h * 0.27;
    c.fillStyle = '#b5793f';
    c.beginPath();
    c.moveTo(cx - hw * 2.4, ty + 1);
    c.quadraticCurveTo(cx - hw * 1.5, ty + 10, cx, ty + 8);
    c.quadraticCurveTo(cx + hw * 1.5, ty + 10, cx + hw * 2.4, ty + 1);
    c.quadraticCurveTo(cx + hw * 1.2, ty - 4, cx, ty - 4);
    c.quadraticCurveTo(cx - hw * 1.2, ty - 4, cx - hw * 2.4, ty + 1);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#c98b4d';
    c.beginPath();
    c.moveTo(cx - hw * 1.05, ty + 1);
    c.quadraticCurveTo(cx - hw * 1.15, ty - crownH, cx - hw * 0.38, ty - crownH);
    c.quadraticCurveTo(cx, ty - crownH * 0.66, cx + hw * 0.38, ty - crownH);
    c.quadraticCurveTo(cx + hw * 1.15, ty - crownH, cx + hw * 1.05, ty + 1);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#6d4322';
    rr(c, cx - hw * 1.05, ty - crownH * 0.34, hw * 2.1, crownH * 0.2, 2);
    c.fill();

  } else if (kind === 'propeller'){
    const capR = hw * 1.28;
    c.save();
    c.beginPath();
    c.arc(cx, ty + 3, capR, Math.PI, 0);
    c.closePath();
    c.clip();
    const quarters = ['#e8453f', '#f6c33c', '#3fa9e8', '#5fc96b'];
    for (let i = 0; i < 4; i++){
      c.fillStyle = quarters[i];
      c.beginPath();
      c.moveTo(cx, ty + 3);
      c.arc(cx, ty + 3, capR, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4);
      c.closePath();
      c.fill();
    }
    c.restore();
    c.beginPath();
    c.arc(cx, ty + 3, capR, Math.PI, 0);
    c.closePath();
    c.stroke();
    c.fillStyle = '#ffffff';
    c.globalAlpha = 0.5;
    rr(c, cx - capR, ty + 0.5, capR * 2, 3.4, 1.7);
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = '#8c6239';
    rr(c, cx - 1.6, ty - capR * 0.62, 3.2, capR * 0.66, 1.4);
    c.fill();
    c.save();
    c.translate(cx, ty - capR * 0.60);
    c.rotate(hero.prop || 0);
    const bl = capR * 1.5;
    for (let i = 0; i < 2; i++){
      c.save();
      c.rotate(i * Math.PI);
      c.fillStyle = i === 0 ? '#ff6f91' : '#ffd34d';
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(bl * 0.6, -5.5, bl, -1.2);
      c.quadraticCurveTo(bl * 0.6, 3.2, 0, 1.6);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(28,16,8,.35)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    }
    c.fillStyle = '#c96a1d';
    c.beginPath();
    c.arc(0, 0, 2.4, 0, 6.2832);
    c.fill();
    c.restore();

  } else if (kind === 'bow'){
    
    const bw = hw * 0.95, bh = h * 0.12;
    c.save();
    c.translate(cx, ty - h * 0.02);
    c.strokeStyle = 'rgba(120,20,50,.4)';
    c.lineWidth = 1.2;
    c.fillStyle = '#ff6f91';
    for (const side of [-1, 1]){
      c.save();
      c.scale(side, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(bw * 0.55, -bh * 1.3, bw, -bh * 0.2);
      c.quadraticCurveTo(bw * 0.65, bh * 0.55, bw * 0.12, bh * 0.35);
      c.quadraticCurveTo(bw * 0.28, 0, 0, 0);
      c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.28)';
      c.beginPath();
      c.ellipse(bw * 0.5, -bh * 0.35, bw * 0.16, bh * 0.4, 0.5, 0, 6.2832);
      c.fill();
      c.restore();
      c.fillStyle = '#ff6f91';
    }
    c.fillStyle = '#e0466a';
    c.beginPath();
    c.ellipse(0, 0, bw * 0.14, bh * 0.62, 0, 0, 6.2832);
    c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath(); c.arc(-bw * 0.03, -bh * 0.18, 1.3, 0, 6.2832); c.fill();
    c.restore();

  } else if (kind === 'flowercrown'){
    
    const petals = ['#ff9fc2', '#ffd34d', '#c7a4ff', '#ff9fc2', '#ffd34d'];
    const n = petals.length;
    c.save();
    c.strokeStyle = '#5a8a3a';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(cx - hw * 1.15, ty + 3);
    c.quadraticCurveTo(cx, ty - h * 0.085, cx + hw * 1.15, ty + 3);
    c.stroke();
    for (let i = 0; i < n; i++){
      const fx = lerp(-hw * 1.02, hw * 1.02, i / (n - 1));
      const fy = ty + 2 - Math.sin((i / (n - 1)) * Math.PI) * h * 0.075;
      c.save();
      c.translate(cx + fx, fy);
      c.fillStyle = petals[i];
      for (let k = 0; k < 5; k++){
        c.save();
        c.rotate((k / 5) * 6.2832);
        c.beginPath();
        c.ellipse(0, -2.6, 1.7, 2.6, 0, 0, 6.2832);
        c.fill();
        c.restore();
      }
      c.fillStyle = '#ffe9a0';
      c.beginPath(); c.arc(0, 0, 1.5, 0, 6.2832); c.fill();
      c.restore();
    }
    c.restore();

  } else if (kind === 'sunhat'){
    
    const brimW = hw * 2.3, crownH = h * 0.2;
    c.save();
    c.fillStyle = '#e8c27a';
    c.beginPath();
    c.ellipse(cx, ty + 4, brimW, h * 0.075, 0, 0, 6.2832);
    c.fill(); c.stroke();
    c.fillStyle = '#f0cf8e';
    c.beginPath();
    c.moveTo(cx - hw * 0.9, ty + 3);
    c.quadraticCurveTo(cx - hw * 0.95, ty - crownH, cx, ty - crownH * 1.08);
    c.quadraticCurveTo(cx + hw * 0.95, ty - crownH, cx + hw * 0.9, ty + 3);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#ff9fc2';
    rr(c, cx - hw * 0.9, ty - crownH * 0.22, hw * 1.8, crownH * 0.3, 2);
    c.fill();
    c.fillStyle = '#ff6f91';
    c.beginPath();
    c.moveTo(cx + hw * 0.55, ty + crownH * 0.05);
    c.lineTo(cx + hw * 0.78, ty - crownH * 0.28);
    c.lineTo(cx + hw * 0.68, ty + crownH * 0.32);
    c.closePath();
    c.fill();
    c.restore();


  } else if (kind === 'beanie'){
    c.fillStyle = '#3fa7ff';
    c.beginPath();
    c.moveTo(cx - hw * 1.05, ty + 4);
    c.quadraticCurveTo(cx - hw * 1.12, ty - h * 0.22, cx, ty - h * 0.23);
    c.quadraticCurveTo(cx + hw * 1.12, ty - h * 0.22, cx + hw * 1.05, ty + 4);
    c.closePath();
    c.fill(); c.stroke();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(255,255,255,.3)';
    c.lineWidth = 1.2;
    for (let k = -3; k <= 3; k++){ c.beginPath(); c.moveTo(cx + k * hw * 0.3, ty + 4); c.lineTo(cx + k * hw * 0.22, ty - h * 0.25); c.stroke(); }
    c.restore();
    c.fillStyle = '#f4f7ff';
    rr(c, cx - hw * 1.1, ty - 3, hw * 2.2, 8, 4);
    c.fill(); c.stroke();
    c.fillStyle = '#ff6f91';
    c.beginPath(); c.arc(cx, ty - h * 0.25, hw * 0.34, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath(); c.arc(cx - hw * 0.1, ty - h * 0.27, hw * 0.1, 0, 6.2832); c.fill();

  } else if (kind === 'viking'){
    c.fillStyle = '#fff1cf';
    for (const sd of [-1, 1]){
      c.beginPath();
      c.moveTo(cx + sd * hw * 0.85, ty - h * 0.04);
      c.quadraticCurveTo(cx + sd * hw * 1.7, ty - h * 0.02, cx + sd * hw * 1.8, ty - h * 0.3);
      c.quadraticCurveTo(cx + sd * hw * 1.45, ty - h * 0.14, cx + sd * hw * 0.9, ty - h * 0.15);
      c.closePath();
      c.fill(); c.stroke();
    }
    c.fillStyle = '#aab6c2';
    c.beginPath();
    c.ellipse(cx, ty + 2, hw * 1.02, h * 0.2, 0, Math.PI, 0);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.ellipse(cx - hw * 0.35, ty - h * 0.1, hw * 0.25, h * 0.05, -0.5, 0, 6.2832); c.fill();
    c.fillStyle = '#8a6a3a';
    rr(c, cx - hw * 1.08, ty - 2, hw * 2.16, 7, 3);
    c.fill(); c.stroke();
    c.fillStyle = '#ffd34d';
    for (let k = -2; k <= 2; k++){ c.beginPath(); c.arc(cx + k * hw * 0.42, ty + 1.5, 1.4, 0, 6.2832); c.fill(); }

  } else if (kind === 'wizard'){
    c.fillStyle = '#5b2d9e';
    c.beginPath(); c.ellipse(cx, ty + 3, hw * 1.95, h * 0.065, 0, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#6f3cc8';
    c.beginPath();
    c.moveTo(cx - hw * 1.0, ty + 2);
    c.quadraticCurveTo(cx - hw * 0.35, ty - h * 0.35, cx + hw * 0.2, ty - h * 0.56);
    c.quadraticCurveTo(cx + hw * 0.55, ty - h * 0.62, cx + hw * 0.95, ty - h * 0.48);
    c.quadraticCurveTo(cx + hw * 0.4, ty - h * 0.42, cx + hw * 1.0, ty + 2);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#ffd34d';
    const star = (sx, sy, r) => { c.beginPath(); for (let k = 0; k < 10; k++){ const a = Math.PI * k / 5 - Math.PI / 2; const rad = k % 2 ? r * 0.45 : r; c.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); } c.closePath(); c.fill(); };
    star(cx - hw * 0.25, ty - h * 0.12, 3.4);
    star(cx + hw * 0.3, ty - h * 0.27, 2.6);
    star(cx - hw * 0.05, ty - h * 0.36, 2);
    c.fillStyle = '#ffe98a';
    c.beginPath(); c.arc(cx + hw * 0.95, ty - h * 0.48, 3, 0, 6.2832); c.fill();

  } else if (kind === 'witch'){
    c.fillStyle = '#2a1c3f';
    c.beginPath(); c.ellipse(cx, ty + 3, hw * 2.05, h * 0.07, -0.08, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#3b2758';
    c.beginPath();
    c.moveTo(cx - hw * 0.95, ty + 2);
    c.quadraticCurveTo(cx - hw * 0.5, ty - h * 0.3, cx - hw * 0.05, ty - h * 0.5);
    c.quadraticCurveTo(cx + hw * 0.35, ty - h * 0.66, cx + hw * 1.15, ty - h * 0.52);
    c.quadraticCurveTo(cx + hw * 0.55, ty - h * 0.42, cx + hw * 0.95, ty + 2);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#ff8a2a';
    c.beginPath();
    c.moveTo(cx - hw * 0.9, ty - h * 0.02); c.lineTo(cx + hw * 0.9, ty - h * 0.02);
    c.lineTo(cx + hw * 0.82, ty - h * 0.11); c.lineTo(cx - hw * 0.8, ty - h * 0.11);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd34d';
    rr(c, cx - hw * 0.16, ty - h * 0.12, hw * 0.32, h * 0.11, 2); c.fill(); c.stroke();
    c.fillStyle = '#3b2758';
    rr(c, cx - hw * 0.07, ty - h * 0.095, hw * 0.14, h * 0.06, 1); c.fill();

  } else if (kind === 'pumpkin'){
    const R = hw * 1.05;
    c.save();
    c.translate(cx, ty - R * 0.62);
    c.rotate(-0.08);
    hwPaintPumpkin(c, R, performance.now() / 1000, true);
    c.restore();

  } else if (kind === 'chef'){
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(cx - hw * 0.55, ty - h * 0.19, hw * 0.52, 0, 6.2832); c.fill(); c.stroke();
    c.beginPath(); c.arc(cx + hw * 0.55, ty - h * 0.19, hw * 0.52, 0, 6.2832); c.fill(); c.stroke();
    c.beginPath(); c.arc(cx, ty - h * 0.25, hw * 0.62, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#f4f4f8';
    rr(c, cx - hw * 0.95, ty - h * 0.12, hw * 1.9, h * 0.14, 3);
    c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.12)';
    c.beginPath(); c.moveTo(cx - hw * 0.3, ty - h * 0.1); c.lineTo(cx - hw * 0.3, ty + 1); c.moveTo(cx + hw * 0.3, ty - h * 0.1); c.lineTo(cx + hw * 0.3, ty + 1); c.stroke();

  } else if (kind === 'pirate'){
    c.fillStyle = '#2a2230';
    c.beginPath();
    c.moveTo(cx - hw * 1.75, ty + 3);
    c.quadraticCurveTo(cx - hw * 1.3, ty - h * 0.32, cx, ty - h * 0.24);
    c.quadraticCurveTo(cx + hw * 1.3, ty - h * 0.32, cx + hw * 1.75, ty + 3);
    c.quadraticCurveTo(cx, ty - h * 0.05, cx - hw * 1.75, ty + 3);
    c.closePath();
    c.fill(); c.stroke();
    c.strokeStyle = '#ffd34d';
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(cx - hw * 1.65, ty + 1); c.quadraticCurveTo(cx, ty - h * 0.08, cx + hw * 1.65, ty + 1); c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(cx, ty - h * 0.15, hw * 0.24, 0, 6.2832); c.fill();
    c.fillStyle = '#2a2230';
    c.beginPath(); c.arc(cx - hw * 0.09, ty - h * 0.155, 1.3, 0, 6.2832); c.arc(cx + hw * 0.09, ty - h * 0.155, 1.3, 0, 6.2832); c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(cx - hw * 0.35, ty - h * 0.06); c.lineTo(cx + hw * 0.35, ty - h * 0.01); c.moveTo(cx + hw * 0.35, ty - h * 0.06); c.lineTo(cx - hw * 0.35, ty - h * 0.01); c.stroke();

  } else if (kind === 'headphones'){
    c.strokeStyle = '#2b2f3a';
    c.lineWidth = 4;
    c.beginPath(); c.ellipse(cx, ty + h * 0.08, hw * 1.12, h * 0.21, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    c.strokeStyle = 'rgba(28,16,8,.5)';
    c.lineWidth = 1.5;
    for (const sd of [-1, 1]){
      c.fillStyle = '#ff4f7a';
      rr(c, cx + sd * hw * 1.12 - 5, ty + h * 0.02, 10, h * 0.14, 4);
      c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.45)';
      rr(c, cx + sd * hw * 1.12 - 2.5, ty + h * 0.04, 3, h * 0.07, 1.5);
      c.fill();
    }
  } else if (kind === 'glass'){
    
    const s = hw * 1.9;
    const bx = cx - s / 2, by = ty - s * 0.92;
    c.fillStyle = 'rgba(180,225,240,.38)';
    c.fillRect(bx, by, s, s);
    c.strokeStyle = 'rgba(255,255,255,.85)';
    c.lineWidth = 1.6;
    c.strokeRect(bx, by, s, s);
    c.strokeStyle = 'rgba(255,255,255,.45)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(bx, by + s * 0.5); c.lineTo(bx + s, by + s * 0.5);
    c.moveTo(bx + s * 0.5, by); c.lineTo(bx + s * 0.5, by + s);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath();
    c.moveTo(bx + s * 0.14, by + s * 0.14);
    c.lineTo(bx + s * 0.34, by + s * 0.14);
    c.lineTo(bx + s * 0.14, by + s * 0.5);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function paintAccessoryRaw(c, w, h, kind, A){
  if (!kind || kind === 'none') return;
  if (!A || !isFinite(w) || !isFinite(h)) return;
  const cx = A.cx * w;

  if (kind === 'bowtie'){
    const y = A.neckY * h;
    const s = w * 0.2;
    c.save();
    c.strokeStyle = 'rgba(40,10,20,.45)';
    c.lineWidth = 1.3;
    c.fillStyle = '#e0466a';
    c.beginPath();
    c.moveTo(cx - 1.5, y);
    c.lineTo(cx - s, y - s * 0.62);
    c.lineTo(cx - s, y + s * 0.62);
    c.closePath();
    c.moveTo(cx + 1.5, y);
    c.lineTo(cx + s, y - s * 0.62);
    c.lineTo(cx + s, y + s * 0.62);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#b52f50';
    rr(c, cx - 3.6, y - 4.2, 7.2, 8.4, 2.6);
    c.fill();
    c.restore();

  } else if (kind === 'vampire'){
    const y = A.neckY * h;
    const s = w * 0.3;
    c.save();
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(20,0,10,.55)';
    c.lineWidth = 1.4;
    for (const sd of [-1, 1]){
      c.fillStyle = '#1e1428';
      c.beginPath();
      c.moveTo(cx, y + s * 0.15);
      c.lineTo(cx + sd * s * 1.05, y - s * 0.95);
      c.lineTo(cx + sd * s * 0.78, y - s * 0.35);
      c.lineTo(cx + sd * s * 1.12, y - s * 0.12);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#b3123a';
      c.beginPath();
      c.moveTo(cx + sd * s * 0.12, y + s * 0.05);
      c.lineTo(cx + sd * s * 0.86, y - s * 0.7);
      c.lineTo(cx + sd * s * 0.66, y - s * 0.28);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ffd34d';
    c.beginPath(); c.arc(cx, y + s * 0.12, s * 0.16, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#e0204a';
    c.beginPath(); c.arc(cx, y + s * 0.12, s * 0.09, 0, 6.2832); c.fill();
    c.restore();

  } else if (kind === 'tie'){
    
    const y = A.neckY * h;
    const knotW = w * 0.10, knotH = h * 0.09;
    const tailW = w * 0.09, tailLen = h * 0.34;
    c.save();
    c.strokeStyle = 'rgba(20,10,30,.4)';
    c.lineWidth = 1;
    c.fillStyle = '#2b3a67';
    rr(c, cx - knotW / 2, y - knotH * 0.3, knotW, knotH, 2);
    c.fill(); c.stroke();
    c.beginPath();
    c.moveTo(cx - tailW / 2, y + knotH * 0.5);
    c.lineTo(cx + tailW / 2, y + knotH * 0.5);
    c.lineTo(cx + tailW * 0.32, y + knotH * 0.5 + tailLen);
    c.lineTo(cx, y + knotH * 0.5 + tailLen + tailW * 0.55);
    c.lineTo(cx - tailW * 0.32, y + knotH * 0.5 + tailLen);
    c.closePath();
    c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.25)';
    c.lineWidth = 1.4;
    for (let i = 1; i <= 3; i++){
      const yy = y + knotH * 0.5 + (tailLen / 4) * i;
      c.beginPath();
      c.moveTo(cx - tailW * 0.4, yy);
      c.lineTo(cx + tailW * 0.4, yy + tailW * 0.2);
      c.stroke();
    }
    c.restore();

  } else if (kind === 'pearls'){
    
    const y = A.neckY * h;
    const n = 7, spread = w * 0.30;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < n; i++){
      const tI = i / (n - 1);
      const px = cx + lerp(-spread, spread, tI);
      const py = y + Math.sin(tI * Math.PI) * h * 0.045;
      const r = 2.3 - Math.abs(tI - 0.5) * 1.2;
      const grad = c.createRadialGradient(px - r * 0.4, py - r * 0.4, 0.3, px, py, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#d8d0e6');
      c.fillStyle = grad;
      c.beginPath(); c.arc(px, py, r, 0, 6.2832); c.fill();
    }
    c.restore();

  } else if (kind === 'hearteye'){
    
    const y  = A.eyeY * h;
    const dx = A.eyeDX * w;
    const s = dx * 0.85;
    c.save();
    c.strokeStyle = '#c22a55';
    c.lineWidth = 1.6;
    for (const side of [-1, 1]){
      const hx = cx + side * dx;
      c.fillStyle = 'rgba(255,111,145,.88)';
      c.beginPath();
      c.moveTo(hx, y + s * 0.75);
      c.bezierCurveTo(hx - s * 1.3, y - s * 0.35, hx - s * 0.55, y - s * 1.15, hx, y - s * 0.35);
      c.bezierCurveTo(hx + s * 0.55, y - s * 1.15, hx + s * 1.3, y - s * 0.35, hx, y + s * 0.75);
      c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.beginPath(); c.ellipse(hx - s * 0.32, y - s * 0.42, s * 0.22, s * 0.32, -0.5, 0, 6.2832); c.fill();
    }
    c.strokeStyle = '#c22a55';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(cx - dx + s * 0.9, y - s * 0.1);
    c.lineTo(cx + dx - s * 0.9, y - s * 0.1);
    c.stroke();
    c.restore();

  } else if (kind === 'scarf'){
    
    const y = A.neckY * h;
    const s = w * 0.24;
    c.save();
    c.strokeStyle = 'rgba(30,20,60,.4)';
    c.lineWidth = 1.2;
    c.fillStyle = '#7fb4e6';
    c.beginPath();
    c.moveTo(cx - s, y - s * 0.55);
    c.lineTo(cx + s, y - s * 0.55);
    c.lineTo(cx + s * 0.18, y + s * 0.78);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (const [dxp, dyp] of [[-0.42, -0.1], [0.05, 0.15], [-0.1, 0.42], [0.35, -0.22]]){
      c.beginPath(); c.arc(cx + dxp * s, y + dyp * s, s * 0.09, 0, 6.2832); c.fill();
    }
    c.fillStyle = '#5a8ec2';
    c.beginPath();
    c.ellipse(cx + s * 0.85, y - s * 0.3, s * 0.22, s * 0.16, 0.6, 0, 6.2832);
    c.fill(); c.stroke();
    c.restore();

  } else if (kind === 'backpack'){
    const y = A.neckY * h;
    const bx = cx + w * 0.235;
    const tankW = w * 0.09, tankH = h * 0.26, gapX = w * 0.06;
    c.save();
    c.strokeStyle = 'rgba(16,12,40,.5)';
    c.lineWidth = 1.3;

    c.fillStyle = '#5a6472';
    rr(c, bx - gapX * 0.5 - tankW * 1.05, y - h * 0.03, gapX * 1.1, tankH * 0.5, 4);
    c.fill(); c.stroke();

    for (const side of [-1, 1]){
      const tx = bx + side * (tankW * 0.5 + gapX * 0.5);
      const grad = c.createLinearGradient(tx - tankW / 2, y, tx + tankW / 2, y);
      grad.addColorStop(0, '#7d8797');
      grad.addColorStop(0.5, '#dfe5ec');
      grad.addColorStop(1, '#7d8797');
      c.fillStyle = grad;
      rr(c, tx - tankW / 2, y - h * 0.02, tankW, tankH, tankW * 0.4);
      c.fill(); c.stroke();

      c.fillStyle = '#ffd34d';
      c.beginPath(); c.arc(tx, y + tankH * 0.16, 1.7, 0, 6.2832); c.fill();

      c.save();
      c.globalAlpha = 0.85;
      const flameGrad = c.createLinearGradient(tx, y + tankH * 0.85, tx, y + tankH * 1.35);
      flameGrad.addColorStop(0, '#ffe58a');
      flameGrad.addColorStop(0.55, '#ff9f45');
      flameGrad.addColorStop(1, 'rgba(255,90,45,0)');
      c.fillStyle = flameGrad;
      c.beginPath();
      c.moveTo(tx - tankW * 0.32, y + tankH * 0.88);
      c.lineTo(tx, y + tankH * 1.4);
      c.lineTo(tx + tankW * 0.32, y + tankH * 0.88);
      c.closePath();
      c.fill();
      c.restore();
    }

    c.strokeStyle = '#3b48a8';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(bx - tankW * 1.1, y + h * 0.04);
    c.lineTo(cx - w * 0.04, y + h * 0.12);
    c.stroke();
    c.restore();
  }
}


function paintTool(c, w, h, kind, A, phase){
  if (!kind || kind === 'none') return;

  if (kind === 'bow'){
    const bhx = A.handX * w, bhy = A.handY * h;
    c.save();
    c.translate(bhx, bhy);
    c.rotate(-0.22 + Math.sin(phase * 1.3) * 0.05);
    c.lineCap = 'round';

    const R = 15, a0 = -1.15, a1 = 1.15;
    c.strokeStyle = '#8b5a2b';
    c.lineWidth = 3.2;
    c.beginPath(); c.arc(0, -6, R, a0, a1); c.stroke();

    c.strokeStyle = 'rgba(255,248,220,.85)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(Math.cos(a0) * R, -6 + Math.sin(a0) * R);
    c.lineTo(Math.cos(a1) * R, -6 + Math.sin(a1) * R);
    c.stroke();

    c.strokeStyle = '#e8d9a0';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-7, -6); c.lineTo(13, -6); c.stroke();
    c.fillStyle = '#ffd34d';
    c.beginPath();
    c.moveTo(19, -6); c.lineTo(12, -9.5); c.lineTo(12, -2.5);
    c.closePath(); c.fill();

    c.restore();
    return;
  }

  if (kind === 'spear'){
    const sx = A.handX * w, sy = A.handY * h;
    c.save();
    c.translate(sx, sy);
    c.rotate(Math.sin(phase * 1.2) * 0.04);
    if (spearImg.ready){
      const L = h * 0.95;
      c.drawImage(spearImg.img, -L * 0.22, -L * 0.78, L, L);
    } else {
      c.rotate(0.55);
      const L = h * 0.78;
      c.fillStyle = '#7a5230';
      c.fillRect(-2, -L * 0.62, 4, L);
      c.fillStyle = '#5e3d22';
      for (let k = 0; k < 4; k++) c.fillRect(-2, -L * 0.5 + k * L * 0.2, 4, 2);
      c.fillStyle = '#cfd6de';
      c.beginPath(); c.moveTo(0, -L * 0.62 - 16); c.lineTo(6, -L * 0.62 + 1); c.lineTo(-6, -L * 0.62 + 1); c.closePath(); c.fill();
      c.fillStyle = '#ffffff';
      c.fillRect(-1, -L * 0.62 - 11, 2, 9);
      c.fillStyle = '#8f98a3';
      c.fillRect(-5, -L * 0.62, 10, 3);
    }
    c.restore();
    return;
  }

  if (kind !== 'mace') return;

  const hx = A.handX * w, hy = A.handY * h;

  c.save();
  c.translate(hx, hy);
  if (maceSwing > 0.001){
    const st = clamp(1 - maceSwing, 0, 1);
    const c4 = (2 * Math.PI) / 3;
    const ease = st <= 0 ? 0 : st >= 1 ? 1 : Math.pow(2, -10 * st) * Math.sin((st * 10 - 0.75) * c4) + 1;
    c.rotate(-2.5 + (0.30 - -2.5) * ease);
  } else {
    c.rotate(0.30 + Math.sin(phase * 1.4) * 0.05);
  }

  let headY;

  if (maceReady){
    
    
    const mw = w * 0.62;
    const mh = mw * (maceImg.naturalHeight / maceImg.naturalWidth);
    c.drawImage(maceDraw, -mw / 2, 8 - mh, mw, mh);
    headY = 8 - mh * 0.8;
  } else {
    
    headY = -24;

    c.fillStyle = '#6b4423';
    c.strokeStyle = '#3f2814';
    c.lineWidth = 1;
    rr(c, -2.2, -2, 4.4, 22, 2);
    c.fill(); c.stroke();

    const grad = c.createRadialGradient(-2, headY - 2, 1, 0, headY, 9);
    grad.addColorStop(0, '#e2e6ea');
    grad.addColorStop(1, '#787f88');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(0, headY, 8, 0, 6.2832);
    c.fill();
    c.strokeStyle = '#4a4f56';
    c.lineWidth = 1.2;
    c.stroke();

    for (let i = 0; i < 6; i++){
      const a = (i / 6) * 6.2832;
      c.save();
      c.translate(0, headY);
      c.rotate(a);
      c.fillStyle = '#9aa0a8';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(3, -9);
      c.lineTo(-3, -9);
      c.closePath();
      c.fill();
      c.restore();
    }
  }

  
  const pulse = 0.5 + 0.5 * Math.sin(phase * 4);
  c.globalAlpha = 0.32 + 0.22 * pulse;
  const glow = c.createRadialGradient(0, headY, 2, 0, headY, 16);
  glow.addColorStop(0, 'rgba(190,90,255,.9)');
  glow.addColorStop(1, 'rgba(190,90,255,0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, headY, 16, 0, 6.2832);
  c.fill();
  c.globalAlpha = 1;

  
  for (let i = 0; i < 3; i++){
    const a = phase * 2 + i * 2.1;
    const radius = 11 + Math.sin(phase * 3 + i) * 2;
    const sx = Math.cos(a) * radius;
    const sy = headY + Math.sin(a) * radius * 0.6;
    c.fillStyle = 'rgba(220,150,255,.9)';
    c.beginPath();
    c.arc(sx, sy, 1.4, 0, 6.2832);
    c.fill();
  }

  c.restore();
}

function paintCabbitVector(c, w, h, ear){
  c.lineJoin = 'round';

  c.fillStyle = FUR_LIT;
  c.strokeStyle = INK;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(-w * 0.42, h * 0.22, w * 0.11, 0, 6.2832);
  c.fill(); c.stroke();

  for (let side = -1; side <= 1; side += 2){
    c.save();
    c.translate(side * w * 0.26, -h * 0.14);
    c.rotate(side * (0.35 + ear * 0.22));
    c.fillStyle = FUR;
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(side * w * 0.08, h * 0.12, w * 0.11, h * 0.26, side * 0.25, 0, 6.2832);
    c.fill(); c.stroke();
    c.fillStyle = PINK;
    c.globalAlpha = 0.7;
    c.beginPath();
    c.ellipse(side * w * 0.08, h * 0.12, w * 0.055, h * 0.19, side * 0.25, 0, 6.2832);
    c.fill();
    c.globalAlpha = 1;
    c.restore();
  }

  c.fillStyle = FUR_DARK;
  c.strokeStyle = INK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(-w * 0.19, h * 0.40, w * 0.15, h * 0.1, 0.12, 0, 6.2832);
  c.fill(); c.stroke();
  c.beginPath();
  c.ellipse( w * 0.19, h * 0.40, w * 0.15, h * 0.1, -0.12, 0, 6.2832);
  c.fill(); c.stroke();

  const g = c.createRadialGradient(-w * 0.12, -h * 0.18, 3, 0, 0, w * 0.55);
  g.addColorStop(0, FUR_LIT);
  g.addColorStop(1, FUR);
  c.fillStyle = g;
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, w * 0.4, 0, 6.2832);
  c.fill(); c.stroke();

  c.fillStyle = '#2f2a34';
  c.beginPath();
  c.ellipse(-w * 0.15, -h * 0.04, 4, 5, 0, 0, 6.2832);
  c.ellipse( w * 0.15, -h * 0.04, 4, 5, 0, 0, 6.2832);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(-w * 0.13, -h * 0.08, 1.5, 0, 6.2832);
  c.arc( w * 0.17, -h * 0.08, 1.5, 0, 6.2832);
  c.fill();

  c.fillStyle = '#e88fa4';
  c.beginPath();
  c.moveTo(0, h * 0.07);
  c.lineTo(-3.2, h * 0.02);
  c.lineTo( 3.2, h * 0.02);
  c.closePath();
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(0, h * 0.08);
  c.quadraticCurveTo(-3.4, h * 0.15, -6, h * 0.09);
  c.moveTo(0, h * 0.08);
  c.quadraticCurveTo( 3.4, h * 0.15,  6, h * 0.09);
  c.stroke();
  c.fillStyle = '#fffaf0';
  rr(c, -3.4, h * 0.145, 3, 4.4, 1.2); c.fill();
  rr(c,  0.4, h * 0.145, 3, 4.4, 1.2); c.fill();

  c.strokeStyle = 'rgba(74,68,80,.45)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-w * 0.22, h * 0.03); c.lineTo(-w * 0.45, h * 0.01);
  c.moveTo(-w * 0.22, h * 0.10); c.lineTo(-w * 0.44, h * 0.14);
  c.moveTo( w * 0.22, h * 0.03); c.lineTo( w * 0.45, h * 0.01);
  c.moveTo( w * 0.22, h * 0.10); c.lineTo( w * 0.44, h * 0.14);
  c.stroke();
}

function paintHeroBody(c, w, h, ear){
  const rec = charImgs[outfit.char];
  if (rec && rec.ready && rec.rig) paintRig(c, w, h, rec, rigDrawPose || rigIdlePose());
  else if (rec && rec.ready) c.drawImage(rec.draw || rec.img, -w / 2, -h / 2, w, h);
  else paintCabbitVector(c, w, h, ear);
}

function drawHero(x, y, sx, sy, tilt, face, alpha, ear, phase){
  const A = anchors();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(face * sx, sy);
  rigDrawPose = rigLive;
  paintHeroBody(ctx, hero.w, hero.h, ear);
  paintAccessory(ctx, hero.w, hero.h, outfit.acc, A);
  if (outfit.acc2 !== 'none' && isOwned('perk', 'multiacc')) paintAccessory(ctx, hero.w, hero.h, outfit.acc2, A);
  paintHat(ctx, hero.w, hero.h, shownHat(outfit.hat), A);
  if (outfit.hat2 !== 'none' && isOwned('perk', 'multiacc')){
    ctx.save();
    ctx.translate(0, -hero.h * 0.20);
    ctx.scale(0.7, 0.7);
    paintHat(ctx, hero.w, hero.h, shownHat(outfit.hat2), A);
    ctx.restore();
  }
  paintTool(ctx, hero.w, hero.h, outfit.tool, A, phase);
  rigDrawPose = null;
  ctx.restore();
}

const HERO_SHADOW_SCALE = 2.6;
const HERO_SHADOW_SRC = 128;
const HERO_SHADOW_BLUR = 44;
const heroShadowTmp = document.createElement('canvas');
const heroShadowCvs = document.createElement('canvas');
let heroShadowKey = '';

function heroShadowKeyNow(){
  const multi = isOwned('perk', 'multiacc');
  return [outfit.char, currentCharReady() ? 1 : 0, shownHat(outfit.hat), outfit.acc, outfit.tool,
    multi ? shownHat(outfit.hat2) : '', multi ? outfit.acc2 : '', maceReady ? 1 : 0, rigCharActive() ? rigPoseKey() : ''].join('|');
}

function getHeroShadowCanvas(){
  const key = heroShadowKeyNow();
  if (key === heroShadowKey) return heroShadowCvs;
  heroShadowKey = key;
  const size = HERO_SHADOW_SRC;
  if (heroShadowTmp.width !== size) heroShadowTmp.width = size;
  if (heroShadowTmp.height !== size) heroShadowTmp.height = size;
  const g = heroShadowTmp.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, size, size);
  g.save();
  g.translate(size / 2, size / 2);
  const k = size / (hero.w * HERO_SHADOW_SCALE);
  g.scale(k, k);
  const A = anchors();
  rigDrawPose = rigLive;
  paintHeroBody(g, hero.w, hero.h, 0);
  paintAccessory(g, hero.w, hero.h, outfit.acc, A);
  const multi = isOwned('perk', 'multiacc');
  if (multi && outfit.acc2 !== 'none') paintAccessory(g, hero.w, hero.h, outfit.acc2, A);
  paintHat(g, hero.w, hero.h, shownHat(outfit.hat), A);
  if (multi && outfit.hat2 !== 'none'){
    g.save();
    g.translate(0, -hero.h * 0.20);
    g.scale(0.7, 0.7);
    paintHat(g, hero.w, hero.h, shownHat(outfit.hat2), A);
    g.restore();
  }
  paintTool(g, hero.w, hero.h, outfit.tool, A, 0);
  rigDrawPose = null;
  g.restore();
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#000';
  g.fillRect(0, 0, size, size);
  g.globalCompositeOperation = 'source-over';

  if (heroShadowCvs.width !== HERO_SHADOW_BLUR) heroShadowCvs.width = HERO_SHADOW_BLUR;
  if (heroShadowCvs.height !== HERO_SHADOW_BLUR) heroShadowCvs.height = HERO_SHADOW_BLUR;
  const b = heroShadowCvs.getContext('2d');
  b.clearRect(0, 0, HERO_SHADOW_BLUR, HERO_SHADOW_BLUR);
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = 'high';
  b.drawImage(heroShadowTmp, 0, 0, HERO_SHADOW_BLUR, HERO_SHADOW_BLUR);
  return heroShadowCvs;
}

function drawHeroShadow(x, y, sx, sy, tilt, face){
  const d = ultraDepthVector(x, y);
  const ox = d.dx * 1.6;
  const oy = d.dy * 1.6 + 5;
  const W = hero.w * HERO_SHADOW_SCALE;
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.translate(x + ox, y + oy);
  ctx.rotate(tilt);
  ctx.scale(face * sx, sy);
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(getHeroShadowCanvas(), -W / 2, -W / 2, W, W);
  ctx.imageSmoothingQuality = 'medium';
  ctx.restore();
}


const spearImg = { img: paintSpearArt(), ready: true };

const trailParts = [];
let trailAcc = 0;
let trailHist = [];
const TRAIL_COLORS = ['#ff5d5d', '#ffa53b', '#ffe14d', '#6fe36a', '#4fb8ff', '#b36bff'];

function heartPath(c, x, y, r){
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.35);
  c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.9);
  c.closePath();
}
function sparklePath(c, x, y, r){
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.closePath();
}
function drawTrailPart(c, p, a){
  const k = p.kind;
  c.globalAlpha = a;
  if (k === 'sparkle' || k === 'comet'){
    c.fillStyle = p.col;
    sparklePath(c, p.x, p.y, p.r);
    c.fill();
  } else if (k === 'bubbles'){
    c.strokeStyle = 'rgba(200,240,255,.95)';
    c.lineWidth = 1.3;
    c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.beginPath(); c.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, 6.2832); c.fill();
  } else if (k === 'hearts'){
    c.fillStyle = p.col;
    heartPath(c, p.x, p.y, p.r);
    c.fill();
  } else if (k === 'notes'){
    c.fillStyle = p.col;
    c.font = Math.round(p.r * 2.4) + 'px ' + GAME_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(p.g, p.x, p.y);
  } else if (k === 'fire'){
    c.fillStyle = p.col;
    c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
  }
}
const TRAIL_SPEC = {
  sparkle: { every: 0.035, life: 0.6, cols: ['#fff6b0', '#ffffff', '#ffd34d'] },
  comet:   { every: 0.02,  life: 0.5, cols: ['#bfe6ff', '#ffffff', '#8fb8ff'] },
  bubbles: { every: 0.07,  life: 1.1, cols: ['#fff'] },
  hearts:  { every: 0.06,  life: 0.8, cols: ['#ff5d8f', '#ff8fb6', '#ff3b6b'] },
  notes:   { every: 0.08,  life: 0.9, cols: ['#ffd34d', '#6fd3ff', '#ff8fd0', '#9dff8a'] },
  fire:    { every: 0.018, life: 0.4, cols: ['#ffe14d', '#ff9d2e', '#ff5a2a'] }
};
function updateTrail(dt){
  const kind = outfit.trail;
  if (!kind || kind === 'none' || !OUTFITS.trail[kind] || (state !== STATE.PLAY && state !== STATE.DYING) || deathPortal){
    if (trailParts.length) trailParts.length = 0;
    trailHist.length = 0;
    return;
  }
  const hx = hero.x, hy = hero.y + hero.h * 0.3;
  if (kind === 'rainbow' || kind === 'comet'){
    trailHist.push({ x: hx, y: hy });
    if (trailHist.length > 16) trailHist.shift();
    if (trailHist.length > 1 && Math.abs(trailHist[trailHist.length - 1].x - trailHist[trailHist.length - 2].x) > VW * 0.5) trailHist = trailHist.slice(-1);
  }
  const spec = TRAIL_SPEC[kind];
  if (spec){
    const moving = Math.abs(hero.vy) > 60 || Math.abs(hero.vx) > 40;
    trailAcc += dt;
    const every = lowGfx() ? spec.every * 2 : spec.every;
    while (moving && trailAcc >= every && trailParts.length < 60){
      trailAcc -= every;
      trailParts.push({
        kind, x: hx + (Math.random() - 0.5) * hero.w * 0.5, y: hy + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 40, vy: kind === 'bubbles' ? -30 - Math.random() * 30 : (kind === 'fire' ? 40 + Math.random() * 40 : (Math.random() - 0.3) * 30),
        r: kind === 'fire' ? 5 + Math.random() * 4 : (kind === 'bubbles' ? 3 + Math.random() * 5 : 3.5 + Math.random() * 3),
        col: spec.cols[(Math.random() * spec.cols.length) | 0], g: Math.random() < 0.5 ? '♪' : '♫',
        t: 0, life: spec.life * (0.8 + Math.random() * 0.4)
      });
    }
    if (!moving) trailAcc = 0;
  }
  for (let i = trailParts.length - 1; i >= 0; i--){
    const p = trailParts[i];
    p.t += dt;
    if (p.t >= p.life){ trailParts.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'fire') p.r *= Math.pow(0.2, dt);
  }
}
function drawTrail(){
  const kind = outfit.trail;
  if ((kind === 'rainbow' || kind === 'comet') && trailHist.length > 2){
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const bands = kind === 'rainbow' ? TRAIL_COLORS : ['rgba(160,210,255,.9)', 'rgba(255,255,255,.95)'];
    const bw = kind === 'rainbow' ? 3.2 : 5;
    for (let b = 0; b < bands.length; b++){
      const off = (b - (bands.length - 1) / 2) * bw;
      ctx.strokeStyle = bands[b];
      for (let i = 1; i < trailHist.length; i++){
        const k = i / trailHist.length;
        ctx.globalAlpha = k * 0.85;
        ctx.lineWidth = bw * (kind === 'comet' ? k * 1.6 : 1);
        ctx.beginPath();
        ctx.moveTo(trailHist[i - 1].x + off, trailHist[i - 1].y - camY);
        ctx.lineTo(trailHist[i].x + off, trailHist[i].y - camY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  if (!trailParts.length) return;
  ctx.save();
  for (const p of trailParts){
    const k = 1 - p.t / p.life;
    drawTrailPart(ctx, { kind: p.kind, x: p.x, y: p.y - camY, r: p.r * (p.kind === 'fire' ? 1 : 0.6 + 0.4 * k), col: p.col, g: p.g }, Math.max(0, k));
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
function paintTrailIcon(c, kind){
  const w = 44 / 0.62;
  c.save();
  if (kind === 'rainbow' || kind === 'comet'){
    const bands = kind === 'rainbow' ? TRAIL_COLORS : ['#a8d4ff', '#ffffff'];
    c.lineCap = 'round';
    for (let b = 0; b < bands.length; b++){
      c.strokeStyle = bands[b];
      c.lineWidth = kind === 'rainbow' ? 4 : 7;
      c.beginPath();
      const off = (b - (bands.length - 1) / 2) * (kind === 'rainbow' ? 4 : 6);
      c.moveTo(-w * 0.45, 20 + off);
      c.quadraticCurveTo(-w * 0.1, -18 + off, w * 0.35, -6 + off);
      c.stroke();
    }
  } else if (kind && kind !== 'none' && TRAIL_SPEC[kind]){
    const spec = TRAIL_SPEC[kind];
    const pts = [[-22, 16, 7], [-6, -4, 9], [14, -20, 6], [22, 10, 5], [-26, -18, 5]];
    pts.forEach((q, i) => drawTrailPart(c, { kind, x: q[0], y: q[1], r: kind === 'fire' ? q[2] * 1.3 : q[2], col: spec.cols[i % spec.cols.length], g: i % 2 ? '♪' : '♫' }, 1));
  } else {
    c.strokeStyle = 'rgba(255,255,255,.35)';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(-18, -18); c.lineTo(18, 18); c.stroke();
  }
  c.restore();
}

function drawHeroWithWrap(){
  if (rigCharActive() && (state === STATE.PLAY || state === STATE.DYING)) updateRigPose();
  if (deathPortal){ drawDyingHero(); return; }
  const y = hero.y - camY;
  const phase = performance.now() / 1000;
  drawHeroGlow(hero.x, y);

  if (ultraGfx()){
    const tilt0 = hero.tilt + hero.spin;
    drawHeroShadow(hero.x, y, hero.sx, hero.sy, tilt0, hero.face);
    if (hero.x < hero.w) drawHeroShadow(hero.x + VW + hero.w, y, hero.sx, hero.sy, tilt0, hero.face);
    else if (hero.x > VW - hero.w) drawHeroShadow(hero.x - VW - hero.w, y, hero.sx, hero.sy, tilt0, hero.face);
  }

  if (motionBlurOn && !lowGfx()){
    for (let i = hero.ghosts.length - 1; i >= 1; i--){
      const gph = hero.ghosts[i];
      const a = (1 - i / hero.ghosts.length) * 0.19;
      if (a <= 0.01) continue;
      drawHero(gph.x, gph.y - camY, gph.sx, gph.sy, gph.tilt, gph.face, a, 0, phase);
    }
  }

  const fullTilt = hero.tilt + hero.spin;
  drawHero(hero.x, y, hero.sx, hero.sy, fullTilt, hero.face, 1, 0, phase);

  if (hero.x < hero.w)
    drawHero(hero.x + VW + hero.w, y, hero.sx, hero.sy, fullTilt, hero.face, 1, 0, phase);
  else if (hero.x > VW - hero.w)
    drawHero(hero.x - VW - hero.w, y, hero.sx, hero.sy, fullTilt, hero.face, 1, 0, phase);
}


function drawCrawler(cr){
  const c = ctx;
  const y = cr.y - camY;
  if (y < -60 || y > VH + 60) return;
  const wob = Math.sin(cr.phase) * 1.8;
  c.save();
  c.translate(cr.x, y);
  c.lineJoin = 'round';

  c.strokeStyle = '#1d5c1d';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-6, -8); c.lineTo(-9 + wob * 0.4, -15);
  c.stroke();
  c.beginPath();
  c.moveTo(6, -8); c.lineTo(9 + wob * 0.4, -15);
  c.stroke();

  c.fillStyle = '#4bbd4b';
  c.strokeStyle = '#1d5c1d';
  c.lineWidth = 1.6;
  c.beginPath();
  c.ellipse(0, 0, 13, 11 + wob * 0.25, 0, 0, 6.2832);
  c.fill(); c.stroke();

  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath();
  c.ellipse(-4, -4, 4.5, 3, -0.5, 0, 6.2832);
  c.fill();

  for (const side of [-1, 1]){
    c.fillStyle = '#fdf6e8';
    c.beginPath(); c.arc(side * 4.6, -1.5, 3.4, 0, 6.2832); c.fill();
    c.fillStyle = '#11220f';
    c.beginPath(); c.arc(side * 4.6 + Math.sin(cr.phase * 0.7) * 1.1, -1.5, 1.7, 0, 6.2832); c.fill();
  }

  c.strokeStyle = '#11220f';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-4, 5); c.lineTo(-1.5, 7); c.lineTo(1.5, 5); c.lineTo(4, 7);
  c.stroke();
  c.restore();
}

function drawLasers(){
  if (!lasers.length) return;
  const now = performance.now() / 1000;
  for (const L of lasers){
    const x0 = L.x - L.w / 2;
    if (!L.fired){
      const p = clamp(L.t / L.warn, 0, 1);
      const blink = 0.5 + 0.5 * Math.sin(now * (14 + p * 22));
      ctx.globalAlpha = 0.08 + 0.16 * p;
      ctx.fillStyle = '#ff2d55';
      ctx.fillRect(x0, 0, L.w, VH);
      ctx.globalAlpha = 0.35 + 0.55 * blink;
      ctx.fillStyle = '#ff6b8a';
      for (let y = 0; y < VH; y += 26) ctx.fillRect(L.x - 1.5, y, 3, 14);
      ctx.globalAlpha = 1;
      for (const ey of [0, VH]){
        ctx.fillStyle = '#2a1a3a';
        rr(ctx, L.x - 16, ey === 0 ? -6 : VH - 14, 32, 20, 6);
        ctx.fill();
        ctx.fillStyle = blink > 0.5 ? '#ff4d6d' : '#8a1c33';
        ctx.beginPath();
        ctx.arc(L.x, ey === 0 ? 6 : VH - 6, 4.5, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 0.6 + 0.4 * blink;
      ctx.fillStyle = '#ffd34d';
      ctx.font = '26px ' + GAME_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', L.x, 34);
      ctx.globalAlpha = 1;
    } else {
      const ft = clamp((L.t - L.warn) / L.fire, 0, 1);
      const fade = ft < 0.8 ? 1 : 1 - (ft - 0.8) / 0.2;
      const jitter = 1 + Math.sin(now * 90) * 0.08;
      const bw = L.w * jitter * (ft < 0.08 ? ft / 0.08 : 1);
      ctx.globalAlpha = 0.28 * fade;
      ctx.fillStyle = '#ff2d55';
      ctx.fillRect(L.x - bw * 0.95, 0, bw * 1.9, VH);
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(L.x - bw / 2, 0, bw, VH);
      ctx.fillStyle = '#ffe0e8';
      ctx.fillRect(L.x - bw * 0.16, 0, bw * 0.32, VH);
      ctx.globalAlpha = 1;
    }
  }
}
