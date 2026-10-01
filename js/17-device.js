"use strict";
const BAN_DOC = '_BANS';
const DEV_KEY = 'cabbitDevice';
const BAN_KEY = 'cabbitBlocked';
function readCookie(k){
  try { const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; } catch (e) { return ''; }
}
function writeCookie(k, v){
  try { document.cookie = k + '=' + encodeURIComponent(v) + '; max-age=315360000; path=/; SameSite=Lax'; } catch (e) {}
}
function idbGet(k){
  return new Promise((res) => {
    try {
      const rq = indexedDB.open('cabbitKeep', 1);
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore('kv'); } catch (e) {} };
      rq.onsuccess = () => {
        try {
          const tx = rq.result.transaction('kv', 'readonly');
          const g = tx.objectStore('kv').get(k);
          g.onsuccess = () => res(g.result || '');
          g.onerror = () => res('');
        } catch (e) { res(''); }
      };
      rq.onerror = () => res('');
    } catch (e) { res(''); }
  });
}
function idbSet(k, v){
  try {
    const rq = indexedDB.open('cabbitKeep', 1);
    rq.onupgradeneeded = () => { try { rq.result.createObjectStore('kv'); } catch (e) {} };
    rq.onsuccess = () => { try { rq.result.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) {} };
  } catch (e) {}
}
function lsGet(k){ try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
function hashStr(str){
  let h1 = 0x811c9dc5, h2 = 0x1b873593;
  for (let i = 0; i < str.length; i++){
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822507);
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).toUpperCase();
}
function newDeviceId(){
  const a = new Uint8Array(9);
  try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < 9; i++) a[i] = Math.floor(Math.random() * 256); }
  return 'D' + Array.from(a, (b) => (b % 36).toString(36)).join('').toUpperCase();
}
function deviceFingerprint(){
  const parts = [];
  try {
    const n = navigator;
    parts.push(n.userAgent || '', n.language || '', (n.languages || []).join(','), n.platform || '', n.hardwareConcurrency || 0, n.deviceMemory || 0, n.maxTouchPoints || 0);
    parts.push(screen.width + 'x' + screen.height + 'x' + screen.colorDepth, window.devicePixelRatio || 1);
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '', new Date().getTimezoneOffset());
  } catch (e) {}
  try {
    const c = document.createElement('canvas');
    c.width = 220; c.height = 40;
    const g = c.getContext('2d');
    g.textBaseline = 'top';
    g.font = '16px Arial';
    g.fillStyle = '#f60'; g.fillRect(100, 1, 62, 20);
    g.fillStyle = '#069'; g.fillText('Cabbit Jump 42 ~', 2, 15);
    g.fillStyle = 'rgba(102,204,0,.7)'; g.fillText('Cabbit Jump 42 ~', 4, 17);
    parts.push(hashStr(c.toDataURL()));
  } catch (e) {}
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (gl){
      const d = gl.getExtension('WEBGL_debug_renderer_info');
      parts.push(d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      parts.push(d ? gl.getParameter(d.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR));
    }
  } catch (e) {}
  return 'F' + hashStr(parts.join('|'));
}
let myDeviceId = lsGet(DEV_KEY) || readCookie('cjdev');
if (!/^D[A-Z0-9]{6,20}$/.test(myDeviceId)) myDeviceId = '';
let myDeviceFp = '';
function persistDevice(){
  lsSet(DEV_KEY, myDeviceId);
  writeCookie('cjdev', myDeviceId);
  idbSet('dev', myDeviceId);
}
async function initDevice(){
  if (!myDeviceId){
    const fromDb = await idbGet('dev');
    myDeviceId = /^D[A-Z0-9]{6,20}$/.test(fromDb) ? fromDb : newDeviceId();
  }
  persistDevice();
  if (!myDeviceFp) myDeviceFp = deviceFingerprint();
  if (lsGet(BAN_KEY) === '1' || readCookie('cjban') === '1' || (await idbGet('ban')) === '1') blockDevice(true);
  return myDeviceId;
}
let deviceBlocked = false;
function banExempt(){ return (typeof adminMode !== 'undefined' && adminMode) || (typeof myRole !== 'undefined' && (myRole === 'admin' || myRole === 'mod')) || isDevCode(cloudCode); }
function blockDevice(on){
  if (on && banExempt()) on = false;
  deviceBlocked = !!on;
  lsSet(BAN_KEY, on ? '1' : '0');
  writeCookie('cjban', on ? '1' : '0');
  idbSet('ban', on ? '1' : '0');
  const scr = document.getElementById('banScreen');
  if (scr){
    scr.hidden = !on;
    const code = document.getElementById('banDevCode');
    if (code) code.textContent = myDeviceId || '-';
  }
  if (on && typeof state !== 'undefined' && typeof STATE !== 'undefined' && (state === STATE.PLAY || state === STATE.PAUSED)){
    try { goToMenu(); } catch (e) {}
  }
}
function banListFrom(doc){
  const f = (doc && doc.fields) || {};
  const arr = (k) => (f[k] && f[k].arrayValue && Array.isArray(f[k].arrayValue.values)) ? f[k].arrayValue.values.map(v => v && v.stringValue).filter(Boolean) : [];
  return { devs: arr('devs'), fps: arr('fps') };
}
async function fetchBanList(){
  const res = await fetch(cloudBase() + '/players/' + BAN_DOC + '?key=' + CLOUD.apiKey);
  if (res.status === 404) return { devs: [], fps: [] };
  if (!res.ok) throw new Error('ban list ' + res.status);
  return banListFrom(await res.json());
}
async function checkDeviceBan(ownFields){
  if (!cloudReady()) return;
  await initDevice();
  if (banExempt()){ if (deviceBlocked) blockDevice(false); return; }
  if (ownFields && ownFields.banned && ownFields.banned.booleanValue){ blockDevice(true); return; }
  try {
    const bl = await fetchBanList();
    const hit = bl.devs.indexOf(myDeviceId) !== -1 || (myDeviceFp && bl.fps.indexOf(myDeviceFp) !== -1);
    if (hit) blockDevice(true);
    else if (deviceBlocked && !(ownFields && ownFields.banned && ownFields.banned.booleanValue)) blockDevice(false);
  } catch (e) {}
}
async function pushDeviceFields(){
  if (!cloudReady() || !myDeviceId) return;
  try {
    await fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=dev&updateMask.fieldPaths=fp&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { dev: { stringValue: myDeviceId }, fp: { stringValue: myDeviceFp || '' } } })
    });
  } catch (e) {}
}
async function saveBanList(bl){
  const body = { fields: {
    devs: { arrayValue: { values: bl.devs.map(v => ({ stringValue: v })) } },
    fps: { arrayValue: { values: bl.fps.map(v => ({ stringValue: v })) } }
  } };
  const res = await fetch(cloudBase() + '/players/' + BAN_DOC + '?updateMask.fieldPaths=devs&updateMask.fieldPaths=fps&key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return res.ok;
}

const ONLINE_THRESHOLD_MS = 220000;
function isOnline(f){
  const ls = parseInt((f && f.lastSeen && f.lastSeen.integerValue) || '0', 10) || 0;
  return ls > 0 && (Date.now() - ls) < ONLINE_THRESHOLD_MS;
}

async function updatePresence(force){
  if (!cloudReady() || accountGone || (!ownDocChecked && !force)) return;
  try {
    const res = await fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=lastSeen&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { lastSeen: { integerValue: String(Date.now()) } } })
    });
    if (res && res.ok && res.json){ const d = await res.json(); noteServerTime(d); }
  } catch (e) {}
}


function sha256Hex(str){
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = unescape(encodeURIComponent(str));
  const words = [];
  const len = bytes.length;
  for (let i = 0; i < len; i++) words[i >> 2] |= (bytes.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  const total = (((len + 8) >> 6) + 1) * 16;
  for (let i = words.length; i < total; i++) words[i] = words[i] | 0;
  words[total - 1] = len * 8;
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array(64);
  const rot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let b = 0; b < total; b += 16){
    for (let i = 0; i < 16; i++) w[i] = words[b + i] | 0;
    for (let i = 16; i < 64; i++){
      const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++){
      const S1 = rot(e, 6) ^ rot(e, 11) ^ rot(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rot(a, 2) ^ rot(a, 13) ^ rot(a, 22);
      const mj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + bb) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('');
}

function hashPassword(code, pw){
  let h = sha256Hex('cabbit|' + String(code).toUpperCase() + '|' + pw);
  for (let i = 0; i < 1500; i++) h = sha256Hex(h + pw);
  return h;
}

let myPwSet = Store.get('pwSet', '0') === '1';
let restoreLockUntil = 0;

function refreshPwState(){
  const el = document.getElementById('pwState');
  if (!el) return;
  el.textContent = myPwSet ? t('pwOn') : t('pwOff');
  el.className = 'pwState ' + (myPwSet ? 'ok' : 'warn');
}

async function savePassword(){
  const input = document.getElementById('pwNewInput');
  const pw = input ? input.value : '';
  if (!pw || pw.length < 4){ setCloudStatus(t('pwShort')); return; }
  if (!cloudReady()){ setCloudStatus(t('cloudErr')); return; }
  const hash = hashPassword(cloudCode, pw);
  try {
    const res = await fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=pwHash&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { pwHash: { stringValue: hash } } })
    });
    if (!res.ok){ setCloudStatus(t('cloudErr')); return; }
    myPwSet = true;
    Store.set('pwSet', '1');
    if (input) input.value = '';
    refreshPwState();
    setCloudStatus(t('pwSaved'));
  } catch (e) { setCloudStatus(t('cloudErr')); }
}

async function cloudRestore(rawCode, rawPw){
  if (!cloudReady()){ setCloudStatus(t('cloudErr')); return; }
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return;
  if (Date.now() < restoreLockUntil){ setCloudStatus(t('pwWait')); return; }
  setCloudStatus(t('cloudLoading'));
  try {
    if (code === cloudCode && ownDocChecked){ clearTimeout(cloudPushTimer); await cloudPush(); }
    const res = await fetch(cloudBase() + '/players/' + code + '?key=' + CLOUD.apiKey);
    if (!res.ok){ setCloudStatus(t('cloudNotFound')); return; }
    const doc = await res.json();
    const f = (doc && doc.fields) || {};
    if (f.deleted && f.deleted.booleanValue){ setCloudStatus(t('cloudNotFound')); return; }
    const storedHash = (f.pwHash && f.pwHash.stringValue) || '';
    if (storedHash){
      const pw = String(rawPw || '');
      if (!pw){ setCloudStatus(t('pwNeed')); return; }
      if (hashPassword(code, pw) !== storedHash){
        restoreLockUntil = Date.now() + 3000;
        setCloudStatus(t('pwWrong'));
        return;
      }
    }
    myPwSet = !!storedHash;
    Store.set('pwSet', myPwSet ? '1' : '0');
    coinsSpent = remoteSpent(f); Store.set('spent', coinsSpent);
    fruitState = parseFruitState(f.fruits && f.fruits.stringValue); Store.set('fruits', fruitStr());
    saveTradeOpen([]);
    if (f.coins) { coins = parseInt(f.coins.integerValue || '0', 10) || 0; Store.set('coins', coins); }
    if (f.best)  { best  = parseInt(f.best.integerValue  || '0', 10) || 0; Store.set('best', best); }
    trophies = estTrophies(f); Store.set('trophies', trophies);
    pass = normalizePass(parsePassStr(f.pass && f.pass.stringValue)); savePass();
    daily = parseDaily(f.daily && f.daily.stringValue); saveDaily();
    if (f.nick && f.nick.stringValue){ nickname = f.nick.stringValue; Store.set('nick', nickname); }
    if (f.frame && f.frame.stringValue && isValidFrame(f.frame.stringValue)){
      avatarFrame = f.frame.stringValue;
      Store.set('avatarFrame', avatarFrame);
    }
    if (f.avatar && f.avatar.stringValue && isValidAvatar(f.avatar.stringValue)){
      avatar = f.avatar.stringValue;
      Store.set('avatar', avatar);
    }
    refreshAvatarRow();
    refreshAvatarPreview();


    
    owned.clear();
    if (f.owned && f.owned.arrayValue && Array.isArray(f.owned.arrayValue.values)){
      for (const v of f.owned.arrayValue.values){
        if (v && v.stringValue) owned.add(v.stringValue);
      }
    }
    owned.add('hat:none'); owned.add('acc:none'); owned.add('acc:bowtie'); owned.add('tool:none'); owned.add('char:hero'); owned.add('perk:none'); owned.add('trail:none');
    saveOwned();
    for (const slotKey of ['hat', 'acc', 'tool', 'char', 'perk', 'trail']){
      const val = f[slotKey] && f[slotKey].stringValue;
      if (val && OUTFITS[slotKey] && OUTFITS[slotKey][val] && owned.has(slotKey + ':' + val)){
        outfit[slotKey] = val;
        Store.set(slotKey, val);
      } else if (!owned.has(slotKey + ':' + outfit[slotKey])){
        outfit[slotKey] = slotKey === 'char' ? 'hero' : 'none';
        Store.set(slotKey, outfit[slotKey]);
      }
    }
    
    
    const hat2Val = f.hat2 && f.hat2.stringValue;
    if (hat2Val && OUTFITS.hat[hat2Val]){
      outfit.hat2 = hat2Val;
      Store.set('hat2', hat2Val);
    }
    const acc2Val = f.acc2 && f.acc2.stringValue;
    if (acc2Val && OUTFITS.acc[acc2Val]){
      outfit.acc2 = acc2Val;
      Store.set('acc2', acc2Val);
    }
    myTitle = (f.title && f.title.stringValue) || '';
    myTitleColor = (f.titleColor && f.titleColor.stringValue) || '';
    Store.set('titleText', myTitle);
    Store.set('titleColor', myTitleColor);
    applyOwnBadgeFromFields(f);

    cloudCode = code;
    Store.set('cloudCode', cloudCode);
    Store.set('cloudSeen', cloudCode);
    ownDocChecked = true;
    const pwIn = document.getElementById('cloudRestorePw');
    if (pwIn) pwIn.value = '';
    dropUnownedLockedOutfit();
    previewChar = outfit.char;
    refreshCloudUI();
    refreshShopState();
    setCloudStatus(t('cloudRestored'));
  } catch (e) { setCloudStatus(t('cloudErr')); }
}

let grantCheckedAt = 0;
async function checkPendingGrant(soft){
  if (soft && Date.now() - grantCheckedAt < 60000) return;
  grantCheckedAt = Date.now();
  if (!cloudReady()) return;
  try {
    const res = await fetch(cloudBase() + '/players/' + cloudCode + '?key=' + CLOUD.apiKey);
    if (!res.ok || accountGone) return;
    const doc = await res.json();
    const f = (doc && doc.fields) || {};
    if (f.deleted && f.deleted.booleanValue) return;
    if (!(f.pending && f.pending.booleanValue)) return;

    if (f.coins) { coins = parseInt(f.coins.integerValue || '0', 10) || 0; Store.set('coins', coins); }
    coinsSpent = Math.max(coinsSpent, remoteSpent(f)); Store.set('spent', coinsSpent);
    if (f.best)  { best  = parseInt(f.best.integerValue  || '0', 10) || 0; Store.set('best', best); }
    if (f.trophies){ trophies = Math.max(0, parseInt(f.trophies.integerValue || '0', 10) || 0); Store.set('trophies', trophies); }
    if (f.pass && f.pass.stringValue){ const rp = normalizePass(parsePassStr(f.pass.stringValue)); pass = mergePass(rp); if (rp.s === pass.s && !rp.gold) pass.gold = false; savePass(); }
    if (f.nick && f.nick.stringValue){ nickname = f.nick.stringValue; Store.set('nick', nickname); }
    if (f.owned && f.owned.arrayValue && Array.isArray(f.owned.arrayValue.values)){
      owned.clear();
      for (const v of f.owned.arrayValue.values){
        if (v && v.stringValue) owned.add(v.stringValue);
      }
      owned.add('hat:none'); owned.add('acc:none'); owned.add('acc:bowtie'); owned.add('tool:none'); owned.add('char:hero'); owned.add('trail:none');
      saveOwned();
    }
    for (const slotKey of ['hat', 'acc', 'tool', 'char', 'perk', 'trail']){
      const val = f[slotKey] && f[slotKey].stringValue;
      if (val && OUTFITS[slotKey] && OUTFITS[slotKey][val]){
        outfit[slotKey] = val;
        Store.set(slotKey, val);
      }
    }
    const hat2Val = f.hat2 && f.hat2.stringValue;
    if (hat2Val && OUTFITS.hat[hat2Val]){
      outfit.hat2 = hat2Val;
      Store.set('hat2', hat2Val);
    }
    const acc2Val = f.acc2 && f.acc2.stringValue;
    if (acc2Val && OUTFITS.acc[acc2Val]){
      outfit.acc2 = acc2Val;
      Store.set('acc2', acc2Val);
    }
    myTitle = (f.title && f.title.stringValue) || '';
    myTitleColor = (f.titleColor && f.titleColor.stringValue) || '';
    Store.set('titleText', myTitle);
    Store.set('titleColor', myTitleColor);
    applyOwnBadgeFromFields(f);

    dropUnownedLockedOutfit();
    previewChar = outfit.char;
    refreshShopState();
    showToast('Админ обновил твой профиль!');

    await fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=pending&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { pending: { booleanValue: false } } })
    });
  } catch (e) {}
}


let lbFieldsByCode = {};

function buildPlayerRow(rowCode, f, rankText){
  const nick = (f.nick && f.nick.stringValue) || '?';
  const sc = statText(f, 'best', parseInt((f.best && f.best.integerValue) || '0', 10) || 0);
  const rowAvatarVal = shownAvatar(f, rowCode);
  const rowFrame = (f.frame && f.frame.stringValue) || 'none';
  const rowAvatar = avatarHtml(rowAvatarVal, rowFrame, 'lbAv');
  const isDev = isDevCode(rowCode);
  const titleText = (f.title && f.title.stringValue) || '';
  const titleColor = (f.titleColor && f.titleColor.stringValue) || '';
  const div = document.createElement('div');
  div.className = 'lbRow';
  let nameHtml;
  if (isDev){
    nameHtml = '<span class="devNick">' + escapeHtml(nick) + '</span><span class="devBadge">DEV</span>';
  } else if (titleText && titleColor){
    const isGrad = /gradient\(/i.test(titleColor);
    const nickStyle = isGrad
      ? 'background:' + titleColor + ';background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800;'
      : 'color:' + titleColor + ';font-weight:800;';
    const badgeStyle = isGrad
      ? 'background:' + titleColor + ';background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;'
      : 'color:' + titleColor + ';';
    nameHtml = '<span style="' + nickStyle + '">' + escapeHtml(nick) + '</span><span class="devBadge" style="' + badgeStyle + '">' + escapeHtml(titleText) + '</span>';
  } else {
    nameHtml = escapeHtml(cleanText(nick));
  }
  const rowBadge = badgeImgHtml(f.badge && f.badge.stringValue);
  div.innerHTML = '<div class="lbLeft"><span class="lbRank">' + escapeHtml(rankText) + '</span>' + rowAvatar + '<span>' + nameHtml + rowBadge + '</span></div><b>' + escapeHtml(sc) + '</b>';
  div.style.cursor = 'pointer';
  div.addEventListener('click', () => {
    if (isStaff()) openAdminChoice(rowCode, nick);
    else openProfile(rowCode);
  });
  return div;
}

function docCode(doc){
  const path = (doc && doc.name) || '';
  return path.substring(path.lastIndexOf('/') + 1);
}

async function searchPlayers(query){
  const q = String(query || '').trim();
  if (!q || !cloudReady()) return [];
  const found = new Map();
  const lower = q.toLowerCase();
  const runQ = (field, value, prefix) => fetch(cloudBase() + ':runQuery?key=' + CLOUD.apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: prefix ? {
        from: [{ collectionId: 'players' }],
        where: { compositeFilter: { op: 'AND', filters: [
          { fieldFilter: { field: { fieldPath: field }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: value } } },
          { fieldFilter: { field: { fieldPath: field }, op: 'LESS_THAN', value: { stringValue: value + '\uf8ff' } } }
        ] } },
        orderBy: [{ field: { fieldPath: field }, direction: 'ASCENDING' }],
        limit: 20
      } : {
        from: [{ collectionId: 'players' }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
        limit: 20
      }
    })
  }).then(r => r.ok ? r.json() : []).catch(() => []);
  const tasks = [runQ('nickLower', lower, true), runQ('nick', q, true), runQ('nick', q, false)];
  const codeGuess = q.toUpperCase();
  if (/^[A-Z0-9]{6,8}$/.test(codeGuess)){
    tasks.push(fetch(cloudBase() + '/players/' + codeGuess + '?key=' + CLOUD.apiKey)
      .then(r => r.ok ? r.json() : null).then(d => (d && d.fields) ? [{ document: d }] : []).catch(() => []));
  }
  const results = await Promise.all(tasks);
  for (const list of results){
    for (const row of (Array.isArray(list) ? list : [])){
      if (!row || !row.document) continue;
      const code = docCode(row.document);
      const df = row.document.fields || {};
      if (df.deleted && df.deleted.booleanValue) continue;
      if (df.banned && df.banned.booleanValue) continue;
      if (code && !found.has(code)) found.set(code, df);
    }
  }
  return Array.from(found.entries()).map(([code, f]) => ({ code, f }))
    .sort((a, b) => (parseInt((b.f.best && b.f.best.integerValue) || '0', 10) || 0) - (parseInt((a.f.best && a.f.best.integerValue) || '0', 10) || 0))
    .slice(0, 20);
}

let searchReqId = 0;
async function runPlayerSearch(){
  const input = document.getElementById('playerSearchInput');
  const box = document.getElementById('playerSearchRows');
  if (!input || !box) return;
  const q = input.value.trim();
  const id = ++searchReqId;
  if (!q){ box.innerHTML = ''; return; }
  box.innerHTML = '<div class="lbRow"><span>' + t('cloudLoading') + '</span></div>';
  const list = await searchPlayers(q);
  if (id !== searchReqId) return;
  box.innerHTML = '';
  if (!list.length){ box.innerHTML = '<div class="lbRow"><span>' + t('searchNone') + '</span></div>'; return; }
  for (const it of list){
    lbFieldsByCode[it.code] = it.f;
    box.appendChild(buildPlayerRow(it.code, it.f, '•'));
  }
}
