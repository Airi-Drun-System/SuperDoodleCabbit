"use strict";
function makeCloudCode(){
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += abc[Math.floor(Math.random() * abc.length)];
  return code;
}
let cloudCode = Store.get('cloudCode', '') || makeCloudCode();
Store.set('cloudCode', cloudCode);

let accountGone = false;
let ownDocChecked = false;
const ACCOUNT_KEEP_KEYS = ['lang', 'gfxMode', 'vibro', 'platformTheme', 'musicVolume', 'music', 'notify', 'chatTheme', 'blur', 'bgTheme', 'uiStyle', 'worldLight', 'sfxVolume'];

function wipeDeletedAccount(){
  if (accountGone) return;
  accountGone = true;
  try {
    const ls = window.localStorage;
    const drop = [];
    for (let i = 0; i < ls.length; i++){
      const k = ls.key(i);
      if (k && k.indexOf('doodlecabbit.') === 0 && ACCOUNT_KEEP_KEYS.indexOf(k.slice(13)) === -1) drop.push(k);
    }
    drop.forEach(k => ls.removeItem(k));
  } catch (e) {}
  Store.mem = {};
  try { alert(t('accountDeleted')); } catch (e) {}
  try { location.reload(); } catch (e) {}
}

function checkAccountAlive(status, f){
  if (status === 404){
    if (Store.get('cloudSeen', '') === cloudCode) wipeDeletedAccount();
    return !accountGone;
  }
  if (f && f.deleted && f.deleted.booleanValue){
    wipeDeletedAccount();
    return false;
  }
  if (status >= 200 && status < 300) Store.set('cloudSeen', cloudCode);
  return true;
}

let myTitle = Store.get('titleText', '');
let myTitleColor = Store.get('titleColor', '');
let myBadge = Store.get('badge', '');
let myRole = Store.get('role', '');

function applyOwnBadgeFromFields(f){
  myBadge = (f && f.badge && f.badge.stringValue) || '';
  Store.set('badge', myBadge);
}

async function cloudFetchOwnTitle(){
  if (!cloudReady() || accountGone) return;
  try {
    const res = await fetch(cloudBase() + '/players/' + cloudCode + '?key=' + CLOUD.apiKey);
    if (res.status === 404){ checkAccountAlive(404, null); ownDocChecked = true; return; }
    if (!res.ok) return;
    const doc = await res.json();
    const f = (doc && doc.fields) || {};
    if (!checkAccountAlive(res.status || 200, f)) return;
    ownDocChecked = true;
    const rSpent = remoteSpent(f);
    if (rSpent > coinsSpent){
      coins = Math.max(0, coins - (rSpent - coinsSpent));
      coinsSpent = rSpent;
      Store.set('coins', coins); Store.set('spent', coinsSpent);
      if (f.owned && f.owned.arrayValue && Array.isArray(f.owned.arrayValue.values)){
        for (const v of f.owned.arrayValue.values){ if (v && v.stringValue) owned.add(v.stringValue); }
        saveOwned();
      }
      if (typeof refreshShopState === 'function') refreshShopState();
      if (typeof cloudPushSoon === 'function') cloudPushSoon();
    }
    if (f.fruits && f.fruits.stringValue) mergeFruitsFrom(f.fruits.stringValue);
    mergeSeasonFromCloud(f);
    hwMergeCloud(f);
    if (f.daily && f.daily.stringValue){ mergeDaily(f.daily.stringValue); refreshDailyBtn(); }
    myTitle = (f.title && f.title.stringValue) || '';
    myTitleColor = (f.titleColor && f.titleColor.stringValue) || '';
    Store.set('titleText', myTitle);
    Store.set('titleColor', myTitleColor);
    applyOwnBadgeFromFields(f);
    checkDeviceBan(f);
    myNoImages = !!(f.noImages && f.noImages.booleanValue);
    if (myNoImages && ((f.role && (f.role.stringValue === 'mod' || f.role.stringValue === 'admin')) || adminMode || isDevCode(cloudCode))){
      myNoImages = false;
      fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=noImages&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { noImages: { booleanValue: false } } })
      }).catch(() => {});
    }
    Store.set('noImages', myNoImages ? '1' : '0');
    myAvatarOk = !!(f.avatarOk && f.avatarOk.booleanValue);
    Store.set('avatarOk', myAvatarOk ? '1' : '0');
    if (f.avatarRejected && f.avatarRejected.booleanValue){
      avatar = (f.avatar && f.avatar.stringValue && !isCustomAvatar(f.avatar.stringValue)) ? f.avatar.stringValue : AVATAR_LIST[0];
      Store.set('avatar', avatar);
      myAvatarOk = false;
      if (typeof showToast === 'function') showToast(t('avatarRejected'));
      fetch(cloudBase() + '/players/' + cloudCode + '?updateMask.fieldPaths=avatarRejected&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { avatarRejected: { booleanValue: false } } })
      }).catch(() => {});
      if (typeof refreshAvatarPreview === 'function'){ refreshAvatarRow(); refreshAvatarPreview(); }
    }
    myPwSet = !!(f.pwHash && f.pwHash.stringValue);
    Store.set('pwSet', myPwSet ? '1' : '0');
    if (typeof refreshPwState === 'function') refreshPwState();
    myRole = ['mod', 'admin'].indexOf((f.role && f.role.stringValue) || '') !== -1 ? f.role.stringValue : '';
    Store.set('role', myRole);
    if (typeof refreshStaffUI === 'function') refreshStaffUI();
  } catch (e) {}
}

function setCloudStatus(msg){
  const el = document.getElementById('cloudStatus');
  if (el) el.textContent = msg || '';
}




let cloudPushTimer = null;
function cloudPushSoon(){
  if (!cloudReady()) return;
  clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(cloudPush, 1200);
}
async function cloudPush(){
  if (!cloudReady() || accountGone) return;
  if (!ownDocChecked){
    await cloudFetchOwnTitle();
    if (accountGone || !ownDocChecked) return;
  }
  const fields = {
    nick:  { stringValue: nickname || 'Котокролик' },
    nickLower: { stringValue: String(nickname || 'Котокролик').toLowerCase() },
    coins: { integerValue: String(coins) },
    best:  { integerValue: String(best) },
    owned: { arrayValue: { values: Array.from(owned).map(v => ({ stringValue: v })) } },
    hat:   { stringValue: outfit.hat  },
    acc:   { stringValue: outfit.acc  },
    tool:  { stringValue: outfit.tool },
    char:  { stringValue: outfit.char },
    perk:  { stringValue: outfit.perk },
    hat2:  { stringValue: outfit.hat2 },
    acc2:  { stringValue: outfit.acc2 },
    title:      { stringValue: myTitle || '' },
    titleColor: { stringValue: myTitleColor || '' },
    avatar: { stringValue: avatar },
    avatarPending: { booleanValue: isCustomAvatar(avatar) && !myAvatarOk },
    frame:  { stringValue: avatarFrame },
    trail:  { stringValue: outfit.trail },
    daily:  { stringValue: JSON.stringify(daily) },
    trophies: { integerValue: String(trophies) },
    spent: { integerValue: String(coinsSpent) },
    fruits: { stringValue: fruitStr() }
  };
  const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  try {
    const pr = await fetch(cloudBase() + '/players/' + cloudCode + '?' + mask + '&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (pr && pr.ok){ Store.set('cloudSeen', cloudCode); pushSeasonFields(); pushDeviceFields(); pushHwFields(); }
  } catch (e) {  }
}
// поля ивента отдельным запросом, чтобы ошибка в них не ломала основное сохранение
async function pushHwFields(){
  if (!HW_ON && !hwCandies) return;
  try {
    const hf = hwCloudFields();
    const hm = Object.keys(hf).map(k => 'updateMask.fieldPaths=' + k).join('&');
    await fetch(cloudBase() + '/players/' + cloudCode + '?' + hm + '&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: hf })
    });
  } catch (e) {}
}
async function pushSeasonFields(){
  try {
    const sf = seasonCloudFields();
    const sm = Object.keys(sf).map(k => 'updateMask.fieldPaths=' + k).join('&');
    await fetch(cloudBase() + '/players/' + cloudCode + '?' + sm + '&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: sf })
    });
  } catch (e) {}
}
