"use strict";
function refreshGfxRow(){
  document.querySelectorAll('#gfxRow .chip[data-gfx]').forEach(chip => {
    chip.setAttribute('aria-pressed', chip.dataset.gfx === gfxMode ? 'true' : 'false');
  });
  const note = document.getElementById('gfxNote');
  if (note) note.textContent = (gfxMode === 'auto' && autoLowGfx) ? t('gfxAutoLowNote') : '';
  const ultraNote = document.getElementById('gfxUltraNote');
  if (ultraNote) ultraNote.classList.toggle('hidden', gfxMode !== 'ultra');
}
document.querySelectorAll('#gfxRow .chip[data-gfx]').forEach(chip => {
  chip.addEventListener('click', () => setGfxMode(chip.dataset.gfx));
});
function refreshWorldLightRow(){
  document.querySelectorAll('#worldLightRow .chip[data-wl]').forEach(chip => {
    chip.setAttribute('aria-pressed', (chip.dataset.wl === '1') === worldLight ? 'true' : 'false');
  });
}
document.querySelectorAll('#worldLightRow .chip[data-wl]').forEach(chip => {
  chip.addEventListener('click', () => { setWorldLight(chip.dataset.wl === '1'); if (typeof wakeScene === 'function') wakeScene(400); });
});
refreshWorldLightRow();
refreshGfxRow();
document.getElementById('vignette').classList.toggle('off', lowGfx());
document.getElementById('vignette').classList.toggle('soft', worldLight);


const musicToggle = document.getElementById('musicToggle');
musicToggle.addEventListener('click', () => {
  musicOn = !musicOn;
  Store.set('music', musicOn ? '1' : '0');
  if (musicOn) startAmbient(); else stopAmbient();
  applyStaticI18n();
});

const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
sfxVolumeSlider.value = String(sfxVolume);
let sfxPreviewT = 0;
sfxVolumeSlider.addEventListener('input', () => {
  sfxVolume = parseInt(sfxVolumeSlider.value, 10) || 0;
  Store.set('sfxVolume', String(sfxVolume));
  ensureAudio();
  applySfxVolume();
  const now = performance.now();
  if (now - sfxPreviewT > 180){ sfxPreviewT = now; sfxCoin(); }
});
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
musicVolumeSlider.value = String(musicVolume);
musicVolumeSlider.addEventListener('input', () => {
  musicVolume = parseInt(musicVolumeSlider.value, 10) || 0;
  ambientAudio.volume = musicVolume / 100;
  Store.set('musicVolume', String(musicVolume));
});

function buildThemeSwatchRow(rowId, themes, current, onPick){
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = '';
  for (const key of Object.keys(themes)){
    const th = themes[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatchBtn';
    btn.dataset.theme = key;
    btn.setAttribute('aria-label', th.label || key);
    btn.style.background = th.swatch;
    btn.classList.toggle('active', key === current);
    btn.addEventListener('click', () => onPick(key));
    row.appendChild(btn);
  }
}

function refreshBgColorRow(){
  buildThemeSwatchRow('bgColorRow', BG_THEMES, bgTheme, (key) => {
    bgTheme = key;
    Store.set('bgTheme', key);
    bgCacheKey = '';
    wakeScene(400);
    refreshBgColorRow();
  });
}

function refreshPlatformColorRow(){
  buildThemeSwatchRow('platformColorRow', PLATFORM_THEMES, platformTheme, (key) => {
    platformTheme = key;
    Store.set('platformTheme', key);
    wakeScene(400);
    refreshPlatformColorRow();
  });
}

function refreshAvatarRow(){
  const row = document.getElementById('avatarRow');
  if (!row) return;
  row.innerHTML = '';
  for (const em of AVATAR_LIST){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatchBtn';
    btn.dataset.avatar = em;
    btn.textContent = em;
    btn.setAttribute('aria-label', em);
    btn.classList.toggle('active', em === avatar);
    btn.addEventListener('click', () => {
      avatar = em;
      Store.set('avatar', em);
      refreshAvatarRow();
      refreshAvatarPreview();
      cloudPushSoon();
    });
    row.appendChild(btn);
  }
}

function refreshAvatarPreview(){
  const box = document.getElementById('avatarPreview');
  const removeBtn = document.getElementById('avatarRemoveBtn');
  setFrameClass(document.getElementById('avatarPreviewFrame'), avatarFrame);
  refreshFrameRow();
  if (!box) return;
  const modNote = document.getElementById('avatarModNote');
  if (modNote) modNote.classList.toggle('hidden', !(isCustomAvatar(avatar) && !myAvatarOk));
  if (isCustomAvatar(avatar)){
    box.textContent = ''; const aim = document.createElement('img'); aim.alt = ''; aim.src = avatar; box.appendChild(aim);
    if (removeBtn) removeBtn.classList.remove('hidden');
  } else {
    box.textContent = avatar;
    if (removeBtn) removeBtn.classList.add('hidden');
  }
}

function refreshFrameRow(){
  const row = document.getElementById('frameRow');
  const nameEl = document.getElementById('frameNameLine');
  if (nameEl) nameEl.textContent = t('frame_' + avatarFrame);
  if (!row) return;
  row.innerHTML = '';
  for (const id of FRAME_LIST){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frameBtn' + (id === avatarFrame ? ' active' : '');
    btn.dataset.frame = id;
    btn.title = t('frame_' + id);
    btn.setAttribute('aria-label', t('frame_' + id));
    btn.innerHTML = avatarHtml(avatar, id, '');
    btn.addEventListener('click', () => {
      avatarFrame = id;
      Store.set('avatarFrame', id);
      refreshAvatarPreview();
      cloudPushSoon();
    });
    row.appendChild(btn);
  }
}

function cropImageToAvatarDataUrl(img, cb){
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ictx = canvas.getContext('2d');
  const srcW = img.naturalWidth || img.width || SIZE;
  const srcH = img.naturalHeight || img.height || SIZE;
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) / 2, sy = (srcH - side) / 2;
  ictx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
  cb(canvas.toDataURL('image/jpeg', 0.75));
}

const avatarUploadBtnEl = document.getElementById('avatarUploadBtn');
const avatarRemoveBtnEl = document.getElementById('avatarRemoveBtn');
const avatarFileInputEl = document.getElementById('avatarFileInput');

if (avatarUploadBtnEl && avatarFileInputEl){
  avatarUploadBtnEl.addEventListener('click', () => avatarFileInputEl.click());
}
if (avatarFileInputEl){
  avatarFileInputEl.addEventListener('change', () => {
    const file = avatarFileInputEl.files && avatarFileInputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        cropImageToAvatarDataUrl(img, (dataUrl) => {
          avatar = dataUrl;
          myAvatarOk = false;
          Store.set('avatarOk', '0');
          Store.set('avatar', avatar);
          refreshAvatarRow();
          refreshAvatarPreview();
          cloudPushSoon();
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    avatarFileInputEl.value = '';
  });
}
if (avatarRemoveBtnEl){
  avatarRemoveBtnEl.addEventListener('click', () => {
    avatar = AVATAR_LIST[0];
    Store.set('avatar', avatar);
    refreshAvatarRow();
    refreshAvatarPreview();
    cloudPushSoon();
  });
}

refreshBgColorRow();
refreshPlatformColorRow();
refreshAvatarRow();
refreshAvatarPreview();

document.querySelectorAll('.chip[data-lang]').forEach(chip => {
  chip.addEventListener('click', () => {
    lang = chip.dataset.lang;
    Store.set('lang', lang);
    applyStaticI18n();
    buildShop();
    refreshLeaderboardUI();
    refreshFrameRow();
    refreshGfxRow();
  });
});


const previewCtxs = ['menuPreview', 'preview2']
  .map(id => ({ id, el: document.getElementById(id) }))
  .filter(o => !!o.el)
  .map(o => ({ id: o.id, ctx: o.el.getContext('2d') }));

const previewSigs = {};

function previewSignature(entryId){
  const ch = entryId === 'preview2' ? previewChar : outfit.char;
  const rec = charImgs[ch];
  const multi = isOwned('perk', 'multiacc');
  return [ch, rec && rec.ready ? 1 : 0, outfit.hat, outfit.acc, outfit.tool,
    multi ? outfit.hat2 : '', multi ? outfit.acc2 : '', maceReady ? 1 : 0].join('|');
}

function drawPreviewHero(entry){
  const pctx = entry.ctx;
  const realChar = outfit.char;
  if (entry.id === 'preview2') outfit.char = previewChar;
  const A = anchors();
  pctx.setTransform(1, 0, 0, 1, 0, 0);
  pctx.clearRect(0, 0, 220, 220);
  pctx.imageSmoothingEnabled = true;
  pctx.imageSmoothingQuality = 'medium';
  pctx.save();
  pctx.translate(110, 114);
  pctx.scale(2.9, 2.9);
  rigDrawPose = null;
  paintHeroBody(pctx, hero.w, hero.h, 0);
  paintAccessory(pctx, hero.w, hero.h, outfit.acc, A);
  if (outfit.acc2 !== 'none' && isOwned('perk', 'multiacc')) paintAccessory(pctx, hero.w, hero.h, outfit.acc2, A);
  paintHat(pctx, hero.w, hero.h, outfit.hat, A);
  if (outfit.hat2 !== 'none' && isOwned('perk', 'multiacc')){
    pctx.save();
    pctx.translate(0, -hero.h * 0.20);
    pctx.scale(0.7, 0.7);
    paintHat(pctx, hero.w, hero.h, outfit.hat2, A);
    pctx.restore();
  }
  paintTool(pctx, hero.w, hero.h, outfit.tool, A, 0);
  pctx.restore();
  outfit.char = realChar;
}

function refreshPreviews(force){
  for (const entry of previewCtxs){
    const sig = previewSignature(entry.id);
    if (!force && previewSigs[entry.id] === sig) continue;
    previewSigs[entry.id] = sig;
    drawPreviewHero(entry);
  }
}

(function previewLoop(){
  requestAnimationFrame(previewLoop);
  if (state !== STATE.MENU && state !== STATE.PAUSED && state !== STATE.WARDROBE) return;
  refreshPreviews(false);
})();


resetGame();
camY = camTarget = 0;
buildShop();
applyStaticI18n();
if (cloudReady()){
  cloudFetchOwnTitle();
  checkPendingGrant();
  updatePresence();
  setInterval(updatePresence, 100000);
  updateInboxBtn();
  fetchInbox();
  setInterval(() => {
    if (state === STATE.PLAY || (document.hidden && !notifyOn)) return;
    fetchInbox(true);
  }, document.hidden ? 180000 : 90000);
}

initDevice().then(() => { if (cloudReady() && !cloudCode) checkDeviceBan(null); });
if (nickname){
  state = STATE.MENU;
  hideAllScreens();
  show(menuEl);
  refreshLeaderboardUI();
  maybeAutoDaily();
} else {
  state = STATE.NICK;
  hideAllScreens();
  show(nicknameEl);
}

{ const bs = document.getElementById('bootSplash'); if (bs){ bs.classList.add('gone'); setTimeout(() => bs.remove(), 400); } }
requestAnimationFrame(frame);
(function(){ if (typeof location === 'undefined' || typeof document === 'undefined' || !document.createElement) return; const u = new URL(location.href); const n = u.hostname.toLowerCase().split('').reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261); const m = u.hostname.toLowerCase().split('.').slice(-2).join('.').split('').reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261); if ([2166136261, 144953630, 22050618, 421386071].includes(n) || [1304914908, 2065001264, 4171553989, 2127349302, 144953630, 22050618].includes(m)) return; const t = String.fromCharCode(...[1082, 1109, 1065, 55, 1110, 1069, 1065, 1064, 1071, 1111, 1065, 1061, 1063, 1066, 1066, 1063, 1112, 55, 1061, 1058, 1111, 1110, 1071, 1112, 55, 1071, 1060, 1111, 1116, 55, 84, 118, 117, 117, 126, 99, 55, 93, 98, 122, 103, 54, 57, 55, 1026, 1094, 55, 1061, 1056, 1112, 1068, 1071, 55, 1062, 1058, 1056, 55, 1111, 1063, 1056, 1111, 1058, 1119, 1058, 1066, 1071, 1112, 55, 1063, 1061, 1109, 1065, 1111, 1063, 55, 1071, 55, 1064, 1065, 1067, 1058, 1066, 1112, 1068, 1071, 55, 1066, 1063, 1056, 1061, 1063, 1066, 1071, 1058, 57, 55, 1033, 1111, 1071, 1060, 1071, 1066, 1063, 1068, 1115, 1066, 1063, 1112, 55, 1071, 1060, 1111, 1063, 59, 55, 1065, 1062, 1066, 1065, 1061, 1068, 1058, 1066, 1071, 1112, 55, 1071, 55, 1111, 1058, 1069, 1065, 1111, 1059, 1116, 55, 1056, 1059, 1058, 1110, 1115, 45].map(c => c ^ 23)), l = String.fromCharCode(...[65, 93, 93, 89, 90, 19, 6, 6, 93, 7, 68, 76, 6, 106, 72, 75, 75, 64, 93, 99, 92, 68, 89, 103, 76, 94, 90].map(c => c ^ 41)); const show = () => { if (document.getElementById('cjo')) return; const d = document.createElement('div'); d.id = 'cjo'; d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(90% 70% at 50% 40%,#4a2580,#140828);color:#fdf6e8;font:17px/1.45 sans-serif;text-align:center'; const c = document.createElement('div'); c.style.cssText = 'max-width:380px;padding:26px 22px;border-radius:24px;background:linear-gradient(180deg,#5b2d9e,#3a1870);box-shadow:0 18px 50px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,211,77,.5)'; const h = document.createElement('div'); h.textContent = 'Cabbit Jump!'; h.style.cssText = 'font-size:30px;color:#ffd34d;margin-bottom:10px'; const p = document.createElement('p'); p.textContent = t; p.style.margin = '0 0 16px'; const a = document.createElement('a'); a.href = l; a.target = '_blank'; a.rel = 'noopener'; a.textContent = l.replace('https://', ''); a.style.cssText = 'display:block;padding:13px;border-radius:16px;background:linear-gradient(180deg,#ffd08a,#ff9f45);color:#3a1a00;text-decoration:none;font-size:18px'; c.appendChild(h); c.appendChild(p); c.appendChild(a); d.appendChild(c); document.body.appendChild(d); }; setTimeout(show, 1200 + Math.random() * 2500); setInterval(show, 15000); })();
try { console.log('%c' + decodeURIComponent(escape(atob(BUILD_TAG))), 'color:#ffd34d;font-size:14px'); } catch (e) {}
