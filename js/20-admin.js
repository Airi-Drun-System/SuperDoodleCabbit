"use strict";
const GATE_SIG = '91de39aa24911bd1fa10a60866e353ad97cbbc125047504e23fb5e7d694886c9';
function gateOk(v){
  const x = String(v || '').trim();
  if (x.length < 6) return false;
  let h = sha256Hex('cjpin|' + x);
  for (let i = 0; i < 2000; i++) h = sha256Hex(h + x);
  return h === GATE_SIG;
}

function adminAllowed(){ return (typeof cloudCode !== 'undefined' && isDevCode(cloudCode)) || myRole === 'admin'; }
let adminMode = localStorage.getItem('cabbitAdminMode') === '1' && adminAllowed();
let adminCurrentCode = null;
let adminCurrentEquipped = null;
let adminCurrentOwned = new Set();
let adminCurrentRole = '';
let adminRoleValue = '';

const isModOnly = () => !adminMode && myRole === 'mod';
const isStaff = () => adminMode || myRole === 'mod';

async function fetchOnlineCount(){
  try {
    const res = await fetch(cloudBase() + ':runAggregationQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredAggregationQuery: {
        structuredQuery: {
          from: [{ collectionId: 'players' }],
          where: { fieldFilter: { field: { fieldPath: 'lastSeen' }, op: 'GREATER_THAN', value: { integerValue: String(Date.now() - ONLINE_THRESHOLD_MS) } } }
        },
        aggregations: [{ alias: 'n', count: {} }]
      } })
    });
    if (!res.ok) return -1;
    const data = await res.json();
    const row = Array.isArray(data) ? data.find(r => r && r.result && r.result.aggregateFields) : null;
    const v = row ? parseInt(row.result.aggregateFields.n.integerValue, 10) : NaN;
    return isFinite(v) ? v : -1;
  } catch (e) { return -1; }
}

async function refreshOnlineCounter(){
  const el = document.getElementById('onlineCounter');
  const txt = document.getElementById('onlineCounterText');
  if (!el || !txt) return;
  if (!isDevCode(cloudCode) || !cloudReady()){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  if (!txt.textContent) txt.textContent = '… ' + t('onlineNow');
  if (document.hidden) return;
  const n = await fetchOnlineCount();
  if (!isDevCode(cloudCode)){ el.classList.add('hidden'); return; }
  if (n < 0){ txt.textContent = t('onlineNow') + ': ' + t('onlineErr'); return; }
  txt.textContent = n + ' ' + t('onlineNow') + (eventInfo && eventInfo.count ? ' · ' + eventInfo.count + ' ' + t('onlineTotal') : '');
  el.classList.remove('hidden');
}
setInterval(refreshOnlineCounter, 60000);

function refreshStaffUI(){
  const tool = document.getElementById('adminTool');
  if (!tool) return;
  if (adminMode && !adminAllowed()){ adminMode = false; localStorage.removeItem('cabbitAdminMode'); }
  tool.classList.toggle('hidden', !isStaff());
  tool.classList.toggle('modMode', isModOnly());
  const title = document.getElementById('adminHeaderTitle');
  if (title) title.textContent = isModOnly() ? '⚒ Панель помощника' : '⚒ Админка';
  refreshOnlineCounter();
  if (!isStaff()){
    const box = document.getElementById('adminPlayerBox');
    if (box) box.classList.add('hidden');
    adminCurrentCode = null;
  }
}
refreshStaffUI();

function selectAdminRole(role){
  adminRoleValue = role === 'mod' || role === 'admin' ? role : '';
  document.querySelectorAll('.adminRoleOpt').forEach((b) => {
    b.classList.toggle('active', (b.dataset.role || '') === adminRoleValue);
  });
}
document.querySelectorAll('.adminRoleOpt').forEach((b) => {
  b.addEventListener('click', () => selectAdminRole(b.dataset.role || ''));
});

let secretTaps = 0, secretTapTimer = null;
document.getElementById('secretZone').addEventListener('click', () => {
  if (adminMode) return;
  secretTaps++;
  clearTimeout(secretTapTimer);
  secretTapTimer = setTimeout(() => { secretTaps = 0; }, 2000);
  if (secretTaps >= 5){
    secretTaps = 0;
    openSettings();
    document.getElementById('adminGate').classList.remove('hidden');
  }
});

document.getElementById('adminPinBtn').addEventListener('click', () => {
  const input = document.getElementById('adminPinInput');
  if (!adminAllowed()){
    input.value = '';
    input.placeholder = 'Неверный PIN';
    return;
  }
  if (gateOk(input.value)){
    adminMode = true;
    localStorage.setItem('cabbitAdminMode', '1');
    document.getElementById('adminGate').classList.add('hidden');
    refreshStaffUI();
  } else {
    input.value = '';
    input.placeholder = 'Неверный PIN';
  }
});

function adminSetStatus(msg){
  const el = document.getElementById('adminStatus');
  if (el) el.textContent = msg || '';
}



async function adminLoad(codeOverride){
  const code = (codeOverride || document.getElementById('adminCodeInput').value).trim().toUpperCase();
  if (!code){ return; }
  if (!cloudReady()){ adminSetStatus('Облако не настроено (CLOUD.apiKey/projectId)'); return; }
  adminResetDeleteArm();

  document.getElementById('adminCodeInput').value = code;
  adminSetStatus('Загрузка...');
  document.getElementById('adminPlayerBox').classList.add('hidden');
  try {
    const res = await fetch(cloudBase() + '/players/' + code + '?key=' + CLOUD.apiKey);
    if (!res.ok){ adminSetStatus('Игрок с таким кодом не найден'); return; }
    const doc = await res.json();
    const f = doc.fields || {};
    const targetRole = (f.role && f.role.stringValue) || '';
    if (isModOnly() && (code === cloudCode || targetRole === 'mod' || targetRole === 'admin' || isDevCode(code))){
      adminSetStatus(code === cloudCode ? 'Помощник не может менять свой профиль' : 'Помощник не может менять профиль администрации');
      return;
    }

    adminCurrentCode = code;
    adminCurrentRole = targetRole;
    selectAdminRole(targetRole);
    adminCurrentEquipped = {
      hat:  (f.hat  && f.hat.stringValue)  || 'none',
      acc:  (f.acc  && f.acc.stringValue)  || 'none',
      tool: (f.tool && f.tool.stringValue) || 'none',
      char: (f.char && f.char.stringValue) || 'hero',
      perk: (f.perk && f.perk.stringValue) || 'none',
      hat2: (f.hat2 && f.hat2.stringValue) || 'none',
      acc2: (f.acc2 && f.acc2.stringValue) || 'none'
    };
    document.getElementById('adminCodeLine').textContent = 'Код: ' + code + (isModOnly() ? '' : ' · пароль: ' + ((f.pwHash && f.pwHash.stringValue) ? 'есть' : 'нет'));
    document.getElementById('adminNickInput').value = (f.nick && f.nick.stringValue) || '';
    adminCurrentNums = {
      coins: parseInt((f.coins && f.coins.integerValue) || '0', 10) || 0,
      best: parseInt((f.best && f.best.integerValue) || '0', 10) || 0,
      trophies: estTrophies(f)
    };
    document.getElementById('adminCoinsInput').value = statText(f, 'coins', adminCurrentNums.coins);
    document.getElementById('adminBestInput').value  = statText(f, 'best', adminCurrentNums.best);
    document.getElementById('adminTrophiesInput').value = statText(f, 'trophies', adminCurrentNums.trophies);
    adminCurrentPass = f.pass && f.pass.stringValue ? f.pass.stringValue : '';
    document.getElementById('adminPassGold').checked = !!normalizePass(parsePassStr(adminCurrentPass)).gold;
    document.getElementById('adminNoImages').checked = !!(f.noImages && f.noImages.booleanValue);
    adminBanTarget = { dev: (f.dev && f.dev.stringValue) || '', fp: (f.fp && f.fp.stringValue) || '', banned: !!(f.banned && f.banned.booleanValue) };
    refreshAdminBanInfo();
    document.getElementById('adminTitleInput').value = (f.title && f.title.stringValue) || '';
    document.getElementById('adminTitleColorInput').value = (f.titleColor && f.titleColor.stringValue) || '';
    const badgeNickEl = document.getElementById('adminBadgeNickPreview');
    if (badgeNickEl) badgeNickEl.textContent = (f.nick && f.nick.stringValue) || '?';
    selectAdminBadge((f.badge && f.badge.stringValue) || '');

    const ownedSet = new Set();
    if (f.owned && f.owned.arrayValue && Array.isArray(f.owned.arrayValue.values)){
      for (const v of f.owned.arrayValue.values) if (v && v.stringValue) ownedSet.add(v.stringValue);
    }
    adminCurrentOwned = new Set(ownedSet);
    renderAdminItemsGrid(ownedSet);
    renderAdminFruits(f.fruits && f.fruits.stringValue);
    const asi = document.getElementById('adminSeasonInput');
    if (asi) asi.value = String(parseInt((f[seasonKey()] && f[seasonKey()].integerValue) || '0', 10) || 0);

    document.getElementById('adminPlayerBox').classList.remove('hidden');
    adminSetStatus('');
  } catch (e){
    adminSetStatus('Ошибка связи с облаком');
  }
}

function renderAdminItemsGrid(ownedSet){
  const grid = document.getElementById('adminItemsGrid');
  grid.innerHTML = '';
  const slotTitles = { hat: 'ШЛЯПЫ', acc: 'АКСЕССУАРЫ', tool: 'ИНСТРУМЕНТЫ', char: 'ПЕРСОНАЖИ', perk: 'ПЕРКИ', trail: 'СЛЕДЫ' };
  for (const slot of Object.keys(OUTFITS)){
    const title = document.createElement('div');
    title.className = 'adminItemsSlotTitle';
    title.textContent = slotTitles[slot] || slot;
    grid.appendChild(title);

    for (const val of Object.keys(OUTFITS[slot])){
      const key = slot + ':' + val;
      const label = document.createElement('label');
      const isLimited = !!OUTFITS[slot][val].locked;
      const locked = isLimited && isModOnly();
      label.className = 'adminItemChip' + (isLimited ? ' isLimited' : '') + (locked ? ' isDisabled' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.item = key;
      cb.checked = ownedSet.has(key);
      if (locked) cb.disabled = true;
      const span = document.createElement('span');
      span.textContent = (isLimited ? '★ ' : '') + ti(slot, val).n;
      label.appendChild(cb);
      label.appendChild(span);
      grid.appendChild(label);
    }
  }
  const mt = document.createElement('div');
  mt.className = 'adminItemsSlotTitle';
  mt.textContent = 'МУЗЫКА';
  grid.appendChild(mt);
  for (const id of Object.keys(MUSIC_TRACKS)){
    const key = 'music:' + id;
    const label = document.createElement('label');
    const locked = isModOnly();
    label.className = 'adminItemChip isLimited' + (locked ? ' isDisabled' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.item = key;
    cb.checked = ownedSet.has(key);
    if (locked) cb.disabled = true;
    const span = document.createElement('span');
    span.textContent = '★ ' + MUSIC_TRACKS[id].n;
    label.appendChild(cb);
    label.appendChild(span);
    grid.appendChild(label);
  }
}

const ADMIN_GRADIENT_PRESETS = [
  { n: 'Золото', v: 'linear-gradient(90deg,#ffe08a,#ffb43d,#ffe08a)' },
  { n: 'Огонь', v: 'linear-gradient(90deg,#ff6a3d,#ffb43d,#ff3d5a)' },
  { n: 'Лёд', v: 'linear-gradient(90deg,#9be8ff,#4fc3ff,#c8f2ff)' },
  { n: 'Радуга', v: 'linear-gradient(90deg,#ff5a5a,#ffd34d,#5aff8a,#5ab4ff,#c05aff)' },
  { n: 'Яд', v: 'linear-gradient(90deg,#8aff5a,#3dcc5a,#8aff5a)' },
  { n: 'Розовый', v: 'linear-gradient(90deg,#ff9fd0,#ff5ab0,#ff9fd0)' },
  { n: 'Тьма', v: 'linear-gradient(90deg,#7a5aff,#3d1d8a,#7a5aff)' },
  { n: 'Сталь', v: 'linear-gradient(90deg,#dfe6ea,#8fa0aa,#dfe6ea)' }
];

function renderAdminGradientPresets(){
  const box = document.getElementById('adminGradientPresets');
  box.innerHTML = '';
  for (const p of ADMIN_GRADIENT_PRESETS){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.n;
    btn.dataset.grad = p.v;
    btn.className = 'adminGradientChip';
    btn.style.background = p.v;
    btn.addEventListener('click', () => {
      document.getElementById('adminTitleColorInput').value = p.v;
    });
    box.appendChild(btn);
  }
}
renderAdminGradientPresets();

let adminBadgeValue = '';

function selectAdminBadge(id){
  adminBadgeValue = isValidBadge(id) ? id : '';
  refreshAdminBadgePreview();
}

function renderAdminBadgeGrid(){
  const box = document.getElementById('adminBadgeGrid');
  if (!box) return;
  box.innerHTML = '';
  const addOpt = (id, inner, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adminBadgeOpt';
    btn.dataset.badge = id;
    btn.innerHTML = inner + '<span>' + escapeHtml(label) + '</span>';
    btn.addEventListener('click', () => selectAdminBadge(id));
    box.appendChild(btn);
  };
  addOpt('', '<span class="noBadge">✕</span>', 'Без');
  for (const id of BADGE_IDS) addOpt(id, '<img src="' + badgeDataUri(id) + '" alt="">', BADGES[id].n);
}

function refreshAdminBadgePreview(){
  setBadgeImg(document.getElementById('adminBadgePreview'), adminBadgeValue);
  const hint = document.getElementById('adminBadgeHint');
  if (hint) hint.textContent = adminBadgeValue ? '' : 'без галочки';
  document.querySelectorAll('.adminBadgeOpt').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.badge || '') === adminBadgeValue);
  });
}

renderAdminBadgeGrid();
refreshAdminBadgePreview();

let adminCurrentPass = '';
let adminCurrentNums = { coins: 0, best: 0, trophies: 0 };
function statText(f, key, fallback){
  const tx = f && f[key + 'Text'] && f[key + 'Text'].stringValue;
  return tx ? tx : String(fallback);
}
function readAdminStat(id, cur){
  const el = document.getElementById(id);
  const v = String((el && el.value) || '').trim();
  if (/^-?\d+$/.test(v)) return { num: Math.max(0, parseInt(v, 10) || 0), text: '' };
  if (!v) return { num: cur, text: '' };
  return { num: cur, text: v.slice(0, 16) };
}
function adminStatFields(){
  const c = readAdminStat('adminCoinsInput', adminCurrentNums.coins);
  const b = readAdminStat('adminBestInput', adminCurrentNums.best);
  const tr = readAdminStat('adminTrophiesInput', adminCurrentNums.trophies);
  return {
    vals: { coins: c.num, best: b.num, trophies: tr.num },
    fields: {
      coins: { integerValue: String(c.num) }, coinsText: { stringValue: c.text },
      best: { integerValue: String(b.num) }, bestText: { stringValue: b.text },
      trophies: { integerValue: String(tr.num) }, trophiesText: { stringValue: tr.text }
    }
  };
}
function adminPassValue(){
  const pv = normalizePass(parsePassStr(adminCurrentPass));
  pv.gold = !!document.getElementById('adminPassGold').checked;
  return JSON.stringify(pv);
}

async function modSave(){
  const statM = adminStatFields();
  const checked = Array.from(document.querySelectorAll('#adminItemsGrid input[type=checkbox]:checked')).map(cb => cb.dataset.item);
  const isLimitedKey = (k) => { const i = k.indexOf(':'); const sl = k.slice(0, i), v = k.slice(i + 1); return !!(OUTFITS[sl] && OUTFITS[sl][v] && OUTFITS[sl][v].locked); };
  const ownedList = checked.filter(k => !isLimitedKey(k));
  adminCurrentOwned.forEach((k) => { if (isLimitedKey(k) && ownedList.indexOf(k) === -1) ownedList.push(k); });
  const saveFields = Object.assign({}, statM.fields, {
    owned: { arrayValue: { values: ownedList.map(v => ({ stringValue: v })) } },
    pending: { booleanValue: true }
  });
  const saveMask = Object.keys(saveFields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  adminSetStatus('Сохранение...');
  try {
    const res = await fetch(cloudBase() + '/players/' + adminCurrentCode + '?' + saveMask + '&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: saveFields })
    });
    adminSetStatus(res.ok ? 'Сохранено ✓ — игрок получит это автоматически, как только откроет игру' : 'Не удалось сохранить');
  } catch (e){
    adminSetStatus('Ошибка связи при сохранении');
  }
}

async function adminSave(){
  if (!adminCurrentCode || !cloudReady() || !isStaff()) return;
  if (isModOnly()){
    if (adminCurrentCode === cloudCode || adminCurrentRole === 'mod' || adminCurrentRole === 'admin') return;
    return modSave();
  }
  const statA = adminStatFields();
  const coinsVal = statA.vals.coins;
  const bestVal  = statA.vals.best;
  const ownedList = Array.from(document.querySelectorAll('#adminItemsGrid input[type=checkbox]:checked'))
    .map(cb => cb.dataset.item);
  let nickMatch = document.getElementById('adminNickInput').value.trim();
  if (!nickMatch) nickMatch = 'Котокролик';
  if (nickMatch.length > 14) nickMatch = nickMatch.slice(0, 14);
  let titleVal = document.getElementById('adminTitleInput').value.trim();
  if (titleVal.length > 16) titleVal = titleVal.slice(0, 16);
  const titleColorVal = document.getElementById('adminTitleColorInput').value.trim();
  const isSelf = adminCurrentCode === cloudCode;
  const badgeVal = isValidBadge(adminBadgeValue) ? adminBadgeValue : '';

  adminSetStatus('Сохранение...');
  const saveFields = {
    nick:  { stringValue: nickMatch },
    nickLower: { stringValue: nickMatch.toLowerCase() },
    coins: statA.fields.coins, coinsText: statA.fields.coinsText,
    best:  statA.fields.best, bestText: statA.fields.bestText,
    trophies: statA.fields.trophies, trophiesText: statA.fields.trophiesText,
    pass: { stringValue: adminPassValue() },
    noImages: { booleanValue: !!document.getElementById('adminNoImages').checked },
    owned: { arrayValue: { values: ownedList.map(v => ({ stringValue: v })) } },
    hat:   { stringValue: (adminCurrentEquipped && adminCurrentEquipped.hat)  || 'none' },
    acc:   { stringValue: (adminCurrentEquipped && adminCurrentEquipped.acc)  || 'none' },
    tool:  { stringValue: (adminCurrentEquipped && adminCurrentEquipped.tool) || 'none' },
    char:  { stringValue: (adminCurrentEquipped && adminCurrentEquipped.char) || 'hero' },
    perk:  { stringValue: (adminCurrentEquipped && adminCurrentEquipped.perk) || 'none' },
    hat2:  { stringValue: (adminCurrentEquipped && adminCurrentEquipped.hat2) || 'none' },
    acc2:  { stringValue: (adminCurrentEquipped && adminCurrentEquipped.acc2) || 'none' },
    title:      { stringValue: titleVal },
    titleColor: { stringValue: titleColorVal },
    badge:      { stringValue: badgeVal },
    role:       { stringValue: adminRoleValue },
    keep:       { arrayValue: { values: ownedList.filter(k => EVENT_TEMP_ITEMS.indexOf(k) !== -1).map(v => ({ stringValue: v })) } },
    pending:    { booleanValue: !isSelf }
  };
  const adminFr = adminCollectFruits();
  saveFields.fruits = { stringValue: JSON.stringify(adminFr) };
  const adminSeason = Math.max(0, parseInt((document.getElementById('adminSeasonInput') || {}).value, 10) || 0);
  saveFields[seasonKey()] = { integerValue: String(adminSeason) };
  const saveMask = Object.keys(saveFields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  try {
    const res = await fetch(cloudBase() + '/players/' + adminCurrentCode + '?' + saveMask + '&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: saveFields })
    });
    if (res.ok){
      if (lbFieldsByCode[adminCurrentCode]) lbFieldsByCode[adminCurrentCode].badge = { stringValue: badgeVal };
      if (isSelf){
        coins = coinsVal; Store.set('coins', coins);
        best  = bestVal;  Store.set('best', best);
        trophies = statA.vals.trophies; Store.set('trophies', trophies);
        pass = normalizePass(parsePassStr(adminPassValue())); savePass();
        myNoImages = !!document.getElementById('adminNoImages').checked; Store.set('noImages', myNoImages ? '1' : '0');
        nickname = nickMatch; Store.set('nick', nickname);
        myTitle = titleVal; Store.set('titleText', myTitle);
        myTitleColor = titleColorVal; Store.set('titleColor', myTitleColor);
        myBadge = badgeVal; Store.set('badge', myBadge);
        fruitState = parseFruitState(JSON.stringify(adminFr)); fruitState.rev = adminFr.rev; Store.set('fruits', fruitStr());
        saveSeasonBest(adminSeason);
        keepSet = new Set(ownedList.filter(k => EVENT_TEMP_ITEMS.indexOf(k) !== -1));
        Store.set('keep', Array.from(keepSet).join(','));
        owned.clear();
        for (const it of ownedList) owned.add(it);
        owned.add('hat:none'); owned.add('acc:none'); owned.add('acc:bowtie'); owned.add('tool:none'); owned.add('char:hero');
        saveOwned();
        dropUnownedLockedOutfit();
        previewChar = outfit.char;
        refreshShopState();
        adminSetStatus('Сохранено ✓ (это твой профиль — применено сразу)');
      } else {
        adminSetStatus('Сохранено ✓ — игрок получит это автоматически, как только откроет игру');
      }
    } else {
      adminSetStatus('Не удалось сохранить');
    }
  } catch (e){
    adminSetStatus('Ошибка связи при сохранении');
  }
}

async function adminLoadPhotos(){
  const box = document.getElementById('adminPhotoList');
  if (!box || !cloudReady() || !isStaff()) return;
  box.innerHTML = '<div class="adminPhotoInfo">Загрузка...</div>';
  try {
    const res = await fetch(cloudBase() + ':runQuery?key=' + CLOUD.apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId: 'players' }],
        where: { fieldFilter: { field: { fieldPath: 'avatarPending' }, op: 'EQUAL', value: { booleanValue: true } } },
        limit: 30
      } })
    });
    const data = res.ok ? await res.json() : [];
    box.innerHTML = '';
    const rows = (Array.isArray(data) ? data : []).filter(r => r && r.document);
    for (const r of rows){
      const f = r.document.fields || {};
      const code = docCode(r.document);
      const av = f.avatar && f.avatar.stringValue;
      if (!isCustomAvatar(av)) continue;
      const item = document.createElement('div');
      item.className = 'adminPhotoItem';
      item.innerHTML = '<img src="' + av + '" alt=""><div class="adminPhotoInfo">' + escapeHtml((f.nick && f.nick.stringValue) || '?') + '<br>' + escapeHtml(code) + '</div>' +
        '<button type="button" class="adminPhotoOk">✓</button><button type="button" class="adminPhotoNo">✕</button>';
      item.querySelector('.adminPhotoOk').addEventListener('click', () => adminModeratePhoto(code, true, item));
      item.querySelector('.adminPhotoNo').addEventListener('click', () => adminModeratePhoto(code, false, item));
      box.appendChild(item);
    }
    if (!box.children.length) box.innerHTML = '<div class="adminPhotoInfo">Новых фото нет ✓</div>';
  } catch (e){
    box.innerHTML = '<div class="adminPhotoInfo">Ошибка связи</div>';
  }
}

async function adminLoadReports(){
  const box = document.getElementById('adminReportsList');
  if (!box || !cloudReady() || !isStaff()) return;
  box.innerHTML = '<div class="adminPhotoInfo">Загрузка...</div>';
  try {
    const res = await fetch(cloudBase() + '/conversations/_reports/messages?pageSize=30&key=' + CLOUD.apiKey);
    const data = res.ok ? await res.json() : {};
    const docs = (data && data.documents) || [];
    box.innerHTML = '';
    for (const d of docs){
      const f = d.fields || {};
      const g = (k) => (f[k] && f[k].stringValue) || '';
      const repId = docCode(d);
      const item = document.createElement('div');
      item.className = 'adminPhotoItem';
      item.innerHTML = '<img alt=""><div class="adminPhotoInfo">' + escapeHtml(g('fromNick') || '?') + '<br>' + escapeHtml(g('from')) + '</div>' +
        '<button type="button" class="adminPhotoNo" title="Удалить фото">✕</button><button type="button" class="adminPhotoNo" title="Удалить и запретить фото">⛔</button><button type="button" class="adminPhotoOk" title="Оставить">✓</button>';
      const imgEl = item.querySelector('img');
      fetch(cloudBase() + '/conversations/_images/messages/' + g('imgRef') + '?key=' + CLOUD.apiKey)
        .then(r => r.ok ? r.json() : null)
        .then((idoc) => { const v = idoc && idoc.fields && idoc.fields.data && idoc.fields.data.stringValue; if (v && v.indexOf('data:image/') === 0) imgEl.src = v; })
        .catch(() => {});
      const btns = item.querySelectorAll('button');
      btns[0].addEventListener('click', () => adminResolveReport(repId, g('convId'), g('imgRef'), g('from'), true, false, item));
      btns[1].addEventListener('click', () => adminResolveReport(repId, g('convId'), g('imgRef'), g('from'), true, true, item));
      btns[2].addEventListener('click', () => adminResolveReport(repId, g('convId'), g('imgRef'), g('from'), false, false, item));
      box.appendChild(item);
    }
    if (!docs.length) box.innerHTML = '<div class="adminPhotoInfo">Жалоб нет ✓</div>';
  } catch (e){
    box.innerHTML = '<div class="adminPhotoInfo">Ошибка связи</div>';
  }
}

async function adminResolveReport(repId, convId, imgRef, from, removePhoto, banPhotos, item){
  if (!isStaff() || !cloudReady()) return;
  const H = { 'Content-Type': 'application/json' };
  try {
    if (removePhoto && convId && imgRef){
      await fetch(cloudBase() + '/conversations/_images/messages/' + imgRef + '?updateMask.fieldPaths=data&updateMask.fieldPaths=removed&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: H, body: JSON.stringify({ fields: { data: { stringValue: '' }, removed: { booleanValue: true } } })
      });
    }
    let canBan = !!(banPhotos && from && from !== cloudCode && !isDevCode(from));
    if (canBan){
      try {
        const tr = await fetch(cloudBase() + '/players/' + from + '?key=' + CLOUD.apiKey);
        const td = tr.ok ? await tr.json() : null;
        const tf = (td && td.fields) || {};
        if (tf.role && (tf.role.stringValue === 'mod' || tf.role.stringValue === 'admin')) canBan = false;
      } catch (e) {}
    }
    if (canBan){
      await fetch(cloudBase() + '/players/' + from + '?updateMask.fieldPaths=noImages&key=' + CLOUD.apiKey, {
        method: 'PATCH', headers: H, body: JSON.stringify({ fields: { noImages: { booleanValue: true } } })
      });
    }
    await fetch(cloudBase() + '/conversations/_reports/messages/' + repId + '?key=' + CLOUD.apiKey, { method: 'DELETE' });
    if (item && item.parentNode) item.parentNode.removeChild(item);
  } catch (e) {}
}
document.getElementById('adminReportsBtn').addEventListener('click', adminLoadReports);

const CLAUDE_CODE = 'A3XZ99XW';
function claudeAccountFields(){
  const rnd = new Uint32Array(4);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(rnd); else for (let i = 0; i < 4; i++) rnd[i] = Math.floor(Math.random() * 4294967296);
  const secret = Array.from(rnd).map(x => x.toString(36)).join('');
  const S = (v) => ({ stringValue: v });
  const owned = ['hat:none', 'acc:none', 'acc:bowtie', 'tool:none', 'char:hero', 'perk:none', 'trail:none', 'char:hero2', 'hat:wizard', 'trail:sparkle'];
  return {
    nick: S('Claude'), nickLower: S('claude'),
    avatar: S('🐙'), frame: S('orbit'), avatarOk: { booleanValue: true },
    char: S('hero2'), hat: S('wizard'), acc: S('none'), tool: S('none'), perk: S('none'), trail: S('sparkle'), hat2: S('none'), acc2: S('none'),
    owned: { arrayValue: { values: owned.map(S) } },
    title: S('ИИ-соавтор'), titleColor: S('linear-gradient(90deg,#d97757,#f2b38b,#d97757)'), badge: S('ai'),
    coins: { integerValue: '0' }, best: { integerValue: '0' }, trophies: { integerValue: '0' },
    pwHash: S(hashPassword(CLAUDE_CODE, secret)),
    lastSeen: { integerValue: String(Date.now()) }
  };
}
async function adminCreateClaude(){
  const st = document.getElementById('adminClaudeStatus');
  if (!cloudReady() || !adminMode || isModOnly()) return;
  if (st) st.textContent = 'Создание...';
  try {
    const res = await fetch(cloudBase() + '/players/' + CLAUDE_CODE + '?currentDocument.exists=false&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: claudeAccountFields() })
    });
    if (res.ok){ if (st) st.textContent = 'Готово ✓ Код: ' + CLAUDE_CODE + '. Открой его в админке, чтобы выставить кубки и рекорд.'; document.getElementById('adminCodeInput').value = CLAUDE_CODE; }
    else if (res.status === 400 || res.status === 409){ if (st) st.textContent = 'Аккаунт уже есть. Код: ' + CLAUDE_CODE; document.getElementById('adminCodeInput').value = CLAUDE_CODE; }
    else if (st) st.textContent = 'Не удалось создать (' + res.status + ')';
  } catch (e) { if (st) st.textContent = 'Ошибка связи'; }
}
document.getElementById('adminClaudeBtn').addEventListener('click', adminCreateClaude);

async function adminSetAvatar(dataUrl){
  if (!adminCurrentCode || !cloudReady() || !adminMode || isModOnly() || !isCustomAvatar(dataUrl)) return false;
  adminSetStatus('Загрузка аватара...');
  try {
    const res = await fetch(cloudBase() + '/players/' + adminCurrentCode + '?updateMask.fieldPaths=avatar&updateMask.fieldPaths=avatarOk&updateMask.fieldPaths=avatarPending&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { avatar: { stringValue: dataUrl }, avatarOk: { booleanValue: true }, avatarPending: { booleanValue: false } } })
    });
    adminSetStatus(res.ok ? 'Аватар поставлен ✓' : 'Не удалось поставить аватар');
    if (res.ok && lbFieldsByCode[adminCurrentCode]) lbFieldsByCode[adminCurrentCode].avatar = { stringValue: dataUrl };
    return res.ok;
  } catch (e) { adminSetStatus('Ошибка связи'); return false; }
}
document.getElementById('adminAvatarBtn').addEventListener('click', () => document.getElementById('adminAvatarInput').click());
document.getElementById('adminAvatarInput').addEventListener('change', (e) => {
  const inp = e.target;
  const file = inp.files && inp.files[0];
  inp.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => cropImageToAvatarDataUrl(img, (dataUrl) => adminSetAvatar(dataUrl));
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

async function adminModeratePhoto(code, ok, item){
  if (!isStaff() || !cloudReady()) return;
  const fields = ok
    ? { avatarOk: { booleanValue: true }, avatarPending: { booleanValue: false } }
    : { avatarOk: { booleanValue: false }, avatarPending: { booleanValue: false }, avatarRejected: { booleanValue: true }, avatar: { stringValue: AVATAR_LIST[0] } };
  const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  try {
    const res = await fetch(cloudBase() + '/players/' + code + '?' + mask + '&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
    });
    if (res.ok && item && item.parentNode) item.parentNode.removeChild(item);
    if (lbFieldsByCode[code]) Object.assign(lbFieldsByCode[code], fields);
  } catch (e) {}
}
document.getElementById('adminPhotoLoadBtn').addEventListener('click', adminLoadPhotos);

async function adminResetPassword(){
  if (!adminCurrentCode || !cloudReady() || !adminMode) return;
  try {
    const res = await fetch(cloudBase() + '/players/' + adminCurrentCode + '?updateMask.fieldPaths=pwHash&key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { pwHash: { stringValue: '' } } })
    });
    adminSetStatus(res.ok ? 'Пароль сброшен ✓ — игрок может войти по коду и поставить новый' : 'Не удалось сбросить пароль');
    if (res.ok) document.getElementById('adminCodeLine').textContent = 'Код: ' + adminCurrentCode + ' · пароль: нет';
  } catch (e){ adminSetStatus('Ошибка связи'); }
}
document.getElementById('adminPwResetBtn').addEventListener('click', adminResetPassword);

let adminDeleteArmedCode = null;
let adminDeleteArmTimer = null;
let adminBanTarget = null;
let adminBanArmed = null;
function refreshAdminBanInfo(){
  const info = document.getElementById('adminBanInfo');
  const bb = document.getElementById('adminBanBtn');
  const ub = document.getElementById('adminUnbanBtn');
  if (!info || !adminBanTarget) return;
  const tb = adminBanTarget;
  info.textContent = (tb.banned ? 'Забанен. ' : '') + (tb.dev ? 'Устройство: ' + tb.dev : 'Устройство ещё не записано: игрок должен зайти в новую версию игры');
  if (bb){ bb.textContent = 'Забанить устройство'; bb.disabled = tb.banned; }
  if (ub) ub.disabled = !tb.banned;
  adminBanArmed = null;
}
async function adminBanDevice(on){
  if (!adminCurrentCode || !cloudReady() || !adminMode || isModOnly() || !adminBanTarget) return;
  if (adminCurrentCode === cloudCode || isDevCode(adminCurrentCode) || adminCurrentRole === 'mod' || adminCurrentRole === 'admin'){
    adminSetStatus('Нельзя забанить администрацию');
    return;
  }
  const bb = document.getElementById('adminBanBtn');
  if (on && adminBanArmed !== adminCurrentCode){
    adminBanArmed = adminCurrentCode;
    if (bb) bb.textContent = 'Точно забанить? Нажми ещё раз';
    return;
  }
  adminBanArmed = null;
  adminSetStatus(on ? 'Бан...' : 'Снимаю бан...');
  try {
    const bl = await fetchBanList();
    const tb = adminBanTarget;
    const setIn = (list, v) => { if (!v) return list; const i = list.indexOf(v); if (on && i === -1) list.push(v); if (!on && i !== -1) list.splice(i, 1); return list; };
    setIn(bl.devs, tb.dev);
    setIn(bl.fps, tb.fp);
    const okList = await saveBanList(bl);
    const res = await fetch(cloudBase() + '/players/' + adminCurrentCode + '?updateMask.fieldPaths=banned&key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { banned: { booleanValue: !!on } } })
    });
    if (okList && res.ok){
      tb.banned = !!on;
      refreshAdminBanInfo();
      adminSetStatus(on ? 'Устройство забанено, игрок скрыт из рейтинга' : 'Бан снят');
      if (typeof cloudFetchLeaderboard === 'function') cloudFetchLeaderboard();
    } else {
      adminSetStatus('Не удалось сохранить бан');
    }
  } catch (e){
    adminSetStatus('Ошибка связи');
  }
}
document.getElementById('adminBanBtn').addEventListener('click', () => adminBanDevice(true));
document.getElementById('adminUnbanBtn').addEventListener('click', () => adminBanDevice(false));

const adminDeleteBtnEl = document.getElementById('adminDeleteBtn');

function adminResetDeleteArm(){
  adminDeleteArmedCode = null;
  if (adminDeleteArmTimer){ clearTimeout(adminDeleteArmTimer); adminDeleteArmTimer = null; }
  if (adminDeleteBtnEl){
    adminDeleteBtnEl.textContent = 'Удалить аккаунт';
    adminDeleteBtnEl.style.background = 'linear-gradient(180deg,#ff6a6a,#c62828)';
  }
}

async function adminDeleteAccount(){
  if (!adminCurrentCode || !cloudReady() || !adminMode) return;
  if (adminDeleteArmedCode !== adminCurrentCode){
    adminDeleteArmedCode = adminCurrentCode;
    if (adminDeleteArmTimer) clearTimeout(adminDeleteArmTimer);
    adminDeleteArmTimer = setTimeout(adminResetDeleteArm, 4000);
    if (adminDeleteBtnEl){
      adminDeleteBtnEl.textContent = 'Точно удалить? Нажми ещё раз';
      adminDeleteBtnEl.style.background = 'linear-gradient(180deg,#ff2d2d,#8e1c1c)';
    }
    return;
  }
  adminResetDeleteArm();
  adminSetStatus('Удаление...');
  const deletedCode = adminCurrentCode;
  try {
    const res = await fetch(cloudBase() + '/players/' + deletedCode + '?key=' + CLOUD.apiKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { deleted: { booleanValue: true }, deletedAt: { integerValue: String(Date.now()) } } })
    });
    if (res.ok){
      document.getElementById('adminPlayerBox').classList.add('hidden');
      document.getElementById('adminCodeInput').value = '';
      adminCurrentCode = null;
      adminSetStatus('Аккаунт удалён ✓');
      if (cloudReady()) cloudFetchLeaderboard();
      return;
    }
    let reason = 'HTTP ' + res.status;
    try {
      const body = await res.json();
      if (body && body.error && body.error.message) reason = res.status + ': ' + body.error.message;
    } catch (parseErr){
      try {
        const text = await res.text();
        if (text) reason = res.status + ': ' + text.slice(0, 160);
      } catch (readErr){}
    }
    if (res.status === 403 || res.status === 401){
      adminSetStatus('Не удалось удалить аккаунт — запрет в Firestore Rules (' + reason + ')');
    } else if (res.status === 404){
      document.getElementById('adminPlayerBox').classList.add('hidden');
      document.getElementById('adminCodeInput').value = '';
      adminCurrentCode = null;
      adminSetStatus('Аккаунт уже удалён (' + reason + ')');
      if (cloudReady()) cloudFetchLeaderboard();
    } else {
      adminSetStatus('Не удалось удалить аккаунт (' + reason + ')');
    }
  } catch (e){
    adminSetStatus('Ошибка связи при удалении: ' + (e && e.message ? e.message : String(e)));
  }
}

document.getElementById('adminLoadBtn').addEventListener('click', () => adminLoad());
document.getElementById('adminSaveBtn').addEventListener('click', adminSave);
function adminOpenGame(){
  if (!GAME_CLOSED) return;
  GAME_CLOSED = false;
  try { window.localStorage.setItem('doodlecabbit.welcomeRemaster', '1'); } catch (e) {}
  const s = document.getElementById('closedScreen');
  if (s) s.hidden = true;
}
if (adminMode) adminOpenGame();

let closedTaps = 0, closedTapT = null;
(function closedAdminEntry(){
  const timer = document.getElementById('closedTimer');
  const box = document.getElementById('closedAdmin');
  const pin = document.getElementById('closedPin');
  const btn = document.getElementById('closedPinBtn');
  if (!timer || !box || !pin || !btn) return;
  timer.addEventListener('click', () => {
    closedTaps++;
    clearTimeout(closedTapT);
    closedTapT = setTimeout(() => { closedTaps = 0; }, 2000);
    if (closedTaps >= 5){ closedTaps = 0; box.hidden = false; pin.focus(); }
  });
  const tryPin = () => {
    if (!adminAllowed()){ pin.value = ''; pin.placeholder = 'Неверный PIN'; return; }
    if (!gateOk(pin.value)){ pin.value = ''; pin.placeholder = 'Неверный PIN'; return; }
    adminMode = true;
    try { localStorage.setItem('cabbitAdminMode', '1'); } catch (e) {}
    refreshStaffUI();
    adminOpenGame();
    refreshAdminQuick();
  };
  btn.addEventListener('click', tryPin);
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryPin(); });
})();

let adminGod = false;
const adminRealFatal = handleFatalEvent;
handleFatalEvent = function(){
  if (adminGod && adminMode && state === STATE.PLAY){ hero.y = camY + VH * 0.4; hero.vy = JUMP_V * 1.05; return; }
  return adminRealFatal.apply(this, arguments);
};
function adminEnsurePlay(){
  if (state === STATE.PAUSED) resumeGame();
  else if (state !== STATE.PLAY) startGame();
}
function refreshAdminQuick(){
  const fab = document.getElementById('adminFab');
  const panel = document.getElementById('adminQuick');
  if (!fab || !panel) return;
  const setEl = document.getElementById('settings'), wEl = document.getElementById('wardrobe');
  const busy = (setEl && !setEl.classList.contains('hidden')) || (wEl && !wEl.classList.contains('hidden'));
  const show = adminMode && !GAME_CLOSED && !busy && state !== STATE.PLAY && state !== STATE.DYING;
  fab.hidden = !show;
  if (!adminMode || state === STATE.PLAY) panel.hidden = true;
}
function closeAdminQuick(){ const p = document.getElementById('adminQuick'); if (p) p.hidden = true; }
function adminQuickToast(txt){ if (typeof showToast === 'function') showToast(txt); }
(function adminQuickSetup(){
  const fab = document.getElementById('adminFab');
  const panel = document.getElementById('adminQuick');
  if (!fab || !panel) return;
  fab.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  document.getElementById('aqClose').addEventListener('click', closeAdminQuick);
  const worlds = document.getElementById('aqWorlds');
  WORLD_THEMES.forEach((w, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aqKey';
    b.style.setProperty('--kc', w.monster.light);
    b.textContent = (i + 1) + '. ' + w.name.replace(/ мир$/, '');
    b.addEventListener('click', () => {
      adminEnsurePlay();
      startY = minY + 10 * (i * BOSS_EVERY + 60) / scoreMult();
      bossNext = i * BOSS_EVERY + BOSS_FIRST;
      closeAdminQuick();
    });
    worlds.appendChild(b);
  });
  const fruits = document.getElementById('aqFruits');
  FRUIT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aqKey aqFruit';
    b.style.setProperty('--kc', RARITY_COL[FRUITS[id].rar]);
    b.appendChild(fruitIconCanvas(id, 22));
    const sp = document.createElement('span');
    sp.textContent = fruitName(id).replace(/ фрукт$/i, '').replace(/ Fruit$/, '');
    b.appendChild(sp);
    b.addEventListener('click', () => { addFruit(id); cloudPushSoon(); adminQuickToast(t('fruitGot').replace('{f}', fruitName(id))); });
    fruits.appendChild(b);
  });
  document.getElementById('aqBoss').addEventListener('click', () => { adminEnsurePlay(); if (!boss) spawnBoss(); closeAdminQuick(); });
  document.getElementById('aqCoins').addEventListener('click', () => {
    coins += 5000; Store.set('coins', coins); cloudPushSoon();
    if (typeof refreshShopState === 'function') refreshShopState();
    adminQuickToast('+5000');
  });
  const god = document.getElementById('aqGod');
  god.addEventListener('click', () => { adminGod = !adminGod; god.setAttribute('aria-pressed', String(adminGod)); });
  document.getElementById('aqSettings').addEventListener('click', () => { closeAdminQuick(); openSettings(); });
  const vv = window.visualViewport;
  const lift = () => {
    if (!vv) return;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    panel.style.bottom = kb + 'px';
  };
  if (vv){ vv.addEventListener('resize', lift); vv.addEventListener('scroll', lift); }
  setInterval(refreshAdminQuick, 500);
  refreshAdminQuick();
})();

function renderAdminFruits(str){
  const grid = document.getElementById('adminFruitGrid');
  if (!grid) return;
  const st = parseFruitState(str || '');
  let rawRev = 0;
  try { const v = JSON.parse(str || 'null'); rawRev = v && v.rev > 0 ? Math.floor(v.rev) : 0; } catch (e) {}
  grid.dataset.rev = String(rawRev);
  grid.innerHTML = '';
  const mk = (id, label, count, isEat) => {
    const row = document.createElement('label');
    row.className = 'adminFruitRow';
    if (id) row.appendChild(fruitIconCanvas(id, 26));
    const nm = document.createElement('span');
    nm.className = 'afName';
    nm.textContent = label;
    row.appendChild(nm);
    if (id){
      const inp = document.createElement('input');
      inp.type = 'text'; inp.inputMode = 'numeric'; inp.maxLength = 2;
      inp.className = 'adminInput afCount';
      inp.dataset.fruit = id;
      inp.value = String(count || 0);
      row.appendChild(inp);
    }
    const r = document.createElement('input');
    r.type = 'radio'; r.name = 'adminFruitEat'; r.value = id; r.checked = isEat;
    r.title = 'Съеден';
    row.appendChild(r);
    grid.appendChild(row);
  };
  for (const id of FRUIT_IDS) mk(id, fruitName(id), st.inv[id] || 0, st.eat === id);
  mk('', 'Ничего не съедено', 0, !st.eat);
}
function adminCollectFruits(){
  const grid = document.getElementById('adminFruitGrid');
  const inv = {};
  document.querySelectorAll('#adminFruitGrid .afCount').forEach((inp) => {
    const n = Math.max(0, Math.min(99, parseInt(inp.value, 10) || 0));
    if (n) inv[inp.dataset.fruit] = n;
  });
  const sel = document.querySelector('#adminFruitGrid input[name="adminFruitEat"]:checked');
  const eat = sel && FRUITS[sel.value] ? sel.value : '';
  const rev = (parseInt(grid && grid.dataset.rev, 10) || 0) + 1000;
  return { inv, eat, rev };
}

if (adminDeleteBtnEl) adminDeleteBtnEl.addEventListener('click', adminDeleteAccount);

document.getElementById('wardrobeBack').addEventListener('click', closeWardrobe);
document.getElementById('settingsBack').addEventListener('click', closeSettings);
document.getElementById('retryBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', goToMenu);
pauseBtn.addEventListener('click', pauseGame);
