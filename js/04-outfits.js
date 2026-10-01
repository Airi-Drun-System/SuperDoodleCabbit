"use strict";
let lang = Store.get('lang', 'ru');
if (lang !== 'ru' && lang !== 'en') lang = 'ru';

const t  = key => (I18N[lang][key] !== undefined ? I18N[lang][key] : key);
const ti = (slot, val) => I18N[lang].items[slot + ':' + val] || { n: val, d: '' };

function applyStaticI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.chip[data-lang]').forEach(el => {
    el.setAttribute('aria-pressed', el.dataset.lang === lang ? 'true' : 'false');
  });
  if (typeof musicToggle !== 'undefined'){
    musicToggle.textContent = t('musicLabel') + ': ' + (musicOn ? t('on') : t('off'));
    musicToggle.setAttribute('aria-pressed', musicOn ? 'true' : 'false');
  }
}


const OUTFITS = {
  hat: {
    none:      { price: 0 },
    tophat:    { price: 60 },
    cowboy:    { price: 90 },
    glass:     { price: 100 },
    propeller: { price: 200 },
    bow:         { price: 80 },
    flowercrown: { price: 150 },
    sunhat:      { price: 130 },
    crown:       { price: 450 },
    halo:        { price: 700 },
    starcrown:   { price: 0, locked: true },
    party:       { price: 0, locked: true },
    beanie:      { price: 180 },
    chef:        { price: 160 },
    headphones:  { price: 220 },
    pirate:      { price: 280 },
    viking:      { price: 300 },
    wizard:      { price: 350 }
  },
  acc: {
    none:     { price: 0 },
    bowtie:   { price: 0 },
    tie:      { price: 120 },
    pearls:   { price: 90 },
    hearteye: { price: 110 },
    scarf:    { price: 95 },
    backpack: { price: 320 }
  },
  tool: {
    none: { price: 0 },
    mace: { price: 250 },
    bow:  { price: 1500 },
    spear: { price: 2500 }
  },
  char: {
    hero:   { price: 0 },
    hero2:  { price: 3000 },
    hero3:  { price: 0, locked: true, secret: true },
    hero4:  { price: 0, locked: true, secret: true },
    hero5:  { price: 0, locked: true, secret: true },
    hero6:  { price: 0, locked: true, secret: true },
    hero7:  { price: 0, locked: true, secret: true },
    hero8:  { price: 0, locked: true, secret: true },
    hero9:  { price: 0, locked: true, secret: true },
    hero10: { price: 0, locked: true, secret: true },
    hero11: { price: 0, locked: true, secret: true },
    freehero3: { price: 3000, needImg: true },
    freehero4: { price: 3000, needImg: true },
    freehero5: { price: 3000, needImg: true },
    freehero6: { price: 3000, needImg: true },
    freehero7: { price: 3000, needImg: true },
    freehero8: { price: 3000, needImg: true },
    freehero9: { price: 3000, needImg: true },
    freehero10: { price: 3000, needImg: true }
  },
  perk: {
    none:     { price: 0 },
    multiacc: { price: 2500 }
  },
  trail: {
    none:    { price: 0 },
    sparkle: { price: 150 },
    bubbles: { price: 200 },
    hearts:  { price: 250 },
    notes:   { price: 250 },
    fire:    { price: 350 },
    rainbow: { price: 500 },
    comet:   { price: 0, locked: true }
  }
};

const owned = new Set(String(Store.get('owned', 'hat:none,acc:none,acc:bowtie,tool:none,char:hero,perk:none,trail:none'))
  .split(',').filter(Boolean));
owned.add('hat:none'); owned.add('acc:none'); owned.add('acc:bowtie'); owned.add('tool:none'); owned.add('char:hero'); owned.add('perk:none'); owned.add('trail:none');
const REMOVED_PERKS = { magnet: 1800, lucky: 2200, extralife: 3500, springs: 1200, legs: 1600, dodger: 2000, passboost: 2800 };
let perkRefundCoins = 0;
for (const k in REMOVED_PERKS){
  if (owned.has('perk:' + k)) perkRefundCoins += REMOVED_PERKS[k];
}

const outfit = {
  hat:  Store.get('hat', 'none'),
  acc:  Store.get('acc', 'none'),
  tool: Store.get('tool', 'none'),
  char: Store.get('char', 'hero'),
  perk: Store.get('perk', 'none'),
  trail: Store.get('trail', 'none'),
  hat2: Store.get('hat2', 'none'), 
  acc2: Store.get('acc2', 'none')  
};




for (const slotKey of Object.keys(OUTFITS)){
  if (!OUTFITS[slotKey][outfit[slotKey]]){
    outfit[slotKey] = (slotKey === 'char') ? 'hero' : 'none';
    Store.set(slotKey, outfit[slotKey]);
  }
}


if (!OUTFITS.hat[outfit.hat2]) { outfit.hat2 = 'none'; Store.set('hat2', 'none'); }
if (!OUTFITS.acc[outfit.acc2]) { outfit.acc2 = 'none'; Store.set('acc2', 'none'); }

function isOwned(slot, val){ return owned.has(slot + ':' + val); }

function dropUnownedLockedOutfit(){
  let changed = false;
  for (const slotKey of Object.keys(OUTFITS)){
    const val = outfit[slotKey];
    const info = OUTFITS[slotKey][val];
    if (info && info.locked && !isOwned(slotKey, val)){
      outfit[slotKey] = (slotKey === 'char') ? 'hero' : 'none';
      Store.set(slotKey, outfit[slotKey]);
      changed = true;
    }
  }
  for (const baseSlot of ['hat', 'acc']){
    const secKey = baseSlot + '2';
    const info = OUTFITS[baseSlot][outfit[secKey]];
    if (info && info.locked && !isOwned(baseSlot, outfit[secKey])){
      outfit[secKey] = 'none';
      Store.set(secKey, 'none');
      changed = true;
    }
  }
  return changed;
}
dropUnownedLockedOutfit();
refreshMusicTrack();
function saveOwned(){
  for (const k in REMOVED_PERKS) owned.delete('perk:' + k);
  Store.set('owned', Array.from(owned).join(','));
}

const toastBanner = document.getElementById('toastBanner');
let toastBannerTimer = null;
function showToast(text, onTap){
  toastBanner.textContent = text;
  toastBanner.style.pointerEvents = onTap ? 'auto' : 'none';
  toastBanner.style.cursor = onTap ? 'pointer' : '';
  toastBanner.onclick = onTap ? () => { toastBanner.style.opacity = '0'; toastBanner.style.pointerEvents = 'none'; onTap(); } : null;
  toastBanner.classList.remove('hidden');
  toastBanner.style.opacity = '1';
  clearTimeout(toastBannerTimer);
  toastBannerTimer = setTimeout(() => {
    toastBanner.style.opacity = '0';
    setTimeout(() => toastBanner.classList.add('hidden'), 300);
  }, 2200);
}


const SPRITE_MAX_PX = 320;
function downscaleSprite(img){
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!(w > 0 && h > 0)) return img;
  const k = SPRITE_MAX_PX / Math.max(w, h);
  if (k >= 1) return img;
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } catch (e) { return img; }
}

const charImgs = {};
function loadCharImage(id){
  const rec = { img: new Image(), draw: null, ready: false };
  rec.img.onload  = () => {
    if (rec.img.naturalWidth > 0){
      rec.draw = downscaleSprite(rec.img);
      rec.ready = true;
    }
  };
  rec.img.onerror = () => { rec.ready = false; };
  rec.img.src = id + '.png';
  charImgs[id] = rec;
}
