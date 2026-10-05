"use strict";
const SEASON_START_Y = 2026, SEASON_START_M = 10;
const CLAN_PRICE = 1000;
const CLAN_MAX = 20;
const CLAN_COLORS = ['#ffd34d', '#ff6b8a', '#7fe06b', '#5fc9e8', '#c9a8ff', '#ff9a5c'];
const SEASON_REWARDS = [[1, 5000], [3, 3000], [10, 1500], [50, 700], [100, 400]];

const SEASON_ALIAS = { sb_2026_09: 'sb_2026_10' };
function seasonKeyOf(d){
  const k = 'sb_' + d.getUTCFullYear() + '_' + String(d.getUTCMonth() + 1).padStart(2, '0');
  return SEASON_ALIAS[k] || k;
}
function seasonKey(){ return seasonKeyOf(new Date()); }
function prevSeasonKey(){
  const m = /^sb_(\d{4})_(\d{2})$/.exec(seasonKey());
  const d = new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 2, 1));
  return seasonKeyOf(d);
}
function seasonNumberOf(key){
  const m = /^sb_(\d{4})_(\d{2})$/.exec(key || '');
  if (!m) return 1;
  return Math.max(1, (parseInt(m[1], 10) - SEASON_START_Y) * 12 + parseInt(m[2], 10) - SEASON_START_M + 1);
}
function seasonEndOf(key){
  const m = /^sb_(\d{4})_(\d{2})$/.exec(key || '');
  if (!m) return Date.now();
  return Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10), 1);
}
function seasonDaysLeft(){
  return Math.max(1, Math.ceil((seasonEndOf(seasonKey()) - Date.now()) / 86400000));
}
function sameSeason(a, b){ return (SEASON_ALIAS[a] || a) === (SEASON_ALIAS[b] || b); }
function loadSeasonBest(){
  try { const v = JSON.parse(Store.get('seasonBest', 'null')); if (v && sameSeason(v.k, seasonKey())) return Math.max(0, parseInt(v.v, 10) || 0); } catch (e) {}
  return 0;
}
function saveSeasonBest(v){ Store.set('seasonBest', JSON.stringify({ k: seasonKey(), v: Math.max(0, Math.floor(v)) })); }
function noteSeasonScore(sc){
  if (sc > loadSeasonBest()){ saveSeasonBest(sc); return true; }
  return false;
}

let myClan = Store.get('clan', '');
let myClanOwn = (() => { try { const v = JSON.parse(Store.get('clanOwn', 'null')); return v && v.name ? v : null; } catch (e) { return null; } })();
function saveClan(){
  Store.set('clan', myClan || '');
  Store.set('clanOwn', myClanOwn ? JSON.stringify(myClanOwn) : '');
}
function cleanClanName(s){ return String(s || '').replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }

function seasonCloudFields(){
  const f = {
    clan: { stringValue: myClan || '' },
    clanOwnName: { stringValue: myClanOwn ? myClanOwn.name : '' },
    clanOwnColor: { stringValue: myClanOwn ? myClanOwn.color : '' }
  };
  const sb = loadSeasonBest();
  if (sb > 0) f[seasonKey()] = { integerValue: String(sb) };
  return f;
}
function mergeSeasonFromCloud(f){
  if (!f) return;
  const k = seasonKey();
  let r = parseInt((f[k] && f[k].integerValue) || '0', 10) || 0;
  for (const old in SEASON_ALIAS){
    if (SEASON_ALIAS[old] === k && f[old] && f[old].integerValue) r = Math.max(r, parseInt(f[old].integerValue, 10) || 0);
  }
  if (r > loadSeasonBest()) saveSeasonBest(r);
  if (!myClan && f.clan && f.clan.stringValue){
    myClan = f.clan.stringValue;
    if (f.clanOwnName && f.clanOwnName.stringValue) myClanOwn = { name: f.clanOwnName.stringValue, color: (f.clanOwnColor && f.clanOwnColor.stringValue) || CLAN_COLORS[0] };
    saveClan();
  }
}

function fsInt(f, k){ return parseInt((f && f[k] && f[k].integerValue) || '0', 10) || 0; }
function fsStr(f, k){ return (f && f[k] && f[k].stringValue) || ''; }
function docCode(doc){ const p = (doc && doc.name) || ''; return p.substring(p.lastIndexOf('/') + 1); }
async function fsQuery(q){
  const res = await fetch(cloudBase() + ':runQuery?key=' + CLOUD.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: Object.assign({ from: [{ collectionId: 'players' }] }, q) }) });
  if (!res.ok) throw new Error('q ' + res.status);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).filter(r => r && r.document && !(r.document.fields && r.document.fields.deleted && r.document.fields.deleted.booleanValue) && !(r.document.fields && r.document.fields.banned && r.document.fields.banned.booleanValue)).map(r => ({ code: docCode(r.document), f: r.document.fields || {} })).filter(r => r.code && r.code.charAt(0) !== '_');
}
const seasonTopCache = {};
async function fetchSeasonTop(key, limit){
  const ck = key + '|' + (limit || 100);
  const c = seasonTopCache[ck];
  if (c && Date.now() - c.at < 180000) return c.rows;
  const rows = await fsQuery({ orderBy: [{ field: { fieldPath: key }, direction: 'DESCENDING' }], limit: limit || 100 });
  seasonTopCache[ck] = { at: Date.now(), rows };
  return rows;
}
async function fetchClanMembers(code){
  return fsQuery({ where: { fieldFilter: { field: { fieldPath: 'clan' }, op: 'EQUAL', value: { stringValue: code } } }, limit: 60 });
}
function groupClans(rows, key){
  const map = new Map();
  for (const r of rows){
    const c = fsStr(r.f, 'clan');
    if (!c) continue;
    if (!map.has(c)) map.set(c, { code: c, name: '', color: '', total: 0, members: 0 });
    const g = map.get(c);
    g.members++;
    g.total += fsInt(r.f, key);
    if (r.code === c){ g.name = fsStr(r.f, 'clanOwnName'); g.color = fsStr(r.f, 'clanOwnColor'); }
  }
  return Array.from(map.values()).filter(g => g.name).sort((a, b) => b.total - a.total);
}
async function fetchClanTop(){
  const rows = await fsQuery({ where: { fieldFilter: { field: { fieldPath: 'clan' }, op: 'GREATER_THAN', value: { stringValue: '' } } }, orderBy: [{ field: { fieldPath: 'clan' }, direction: 'ASCENDING' }], limit: 600 });
  return groupClans(rows, seasonKey());
}
async function fetchPlayerDoc(code){
  const res = await fetch(cloudBase() + '/players/' + encodeURIComponent(code) + '?key=' + CLOUD.apiKey);
  if (!res.ok) return null;
  const d = await res.json();
  return (d && d.fields) || null;
}

async function createClan(name, color){
  name = cleanClanName(name);
  if (name.length < 3) return { ok: false, err: 'clanErrName' };
  if (myClan) return { ok: false, err: 'clanErrAlready' };
  if (coins < CLAN_PRICE) return { ok: false, err: 'clanErrCoins' };
  coins -= CLAN_PRICE; noteSpent(CLAN_PRICE); Store.set('coins', coins);
  myClan = cloudCode;
  myClanOwn = { name, color: CLAN_COLORS.indexOf(color) !== -1 ? color : CLAN_COLORS[0] };
  saveClan();
  cloudPushSoon();
  if (typeof refreshShopState === 'function') refreshShopState();
  return { ok: true };
}
async function joinClan(code){
  code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) return { ok: false, err: 'clanErrCode' };
  if (myClan) return { ok: false, err: 'clanErrAlready' };
  let f = null;
  try { f = await fetchPlayerDoc(code); } catch (e) { return { ok: false, err: 'clanErrNet' }; }
  if (!f || !fsStr(f, 'clanOwnName') || fsStr(f, 'clan') !== code) return { ok: false, err: 'clanErrNotFound' };
  let members = [];
  try { members = await fetchClanMembers(code); } catch (e) { return { ok: false, err: 'clanErrNet' }; }
  if (members.length >= CLAN_MAX) return { ok: false, err: 'clanErrFull' };
  myClan = code;
  myClanOwn = null;
  saveClan();
  cloudPushSoon();
  return { ok: true };
}
function leaveClan(){
  myClan = '';
  myClanOwn = null;
  saveClan();
  cloudPushSoon();
}

function seasonRewardFor(rank){
  if (!rank) return 100;
  for (const [top, c] of SEASON_REWARDS) if (rank <= top) return c;
  return 100;
}
function loadSeasonBadges(){ try { const v = JSON.parse(Store.get('seasonBadges', '[]')); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
async function checkSeasonRewards(){
  const cur = seasonKey();
  const last = Store.get('seasonLastKey', '');
  if (last === cur) return;
  if (sameSeason(last, cur)){ Store.set('seasonLastKey', cur); return; }
  const prevBest = (() => { try { const v = JSON.parse(Store.get('seasonBest', 'null')); return v && v.k === last ? (parseInt(v.v, 10) || 0) : 0; } catch (e) { return 0; } })();
  if (!last || prevBest <= 0 || !cloudReady()){ Store.set('seasonLastKey', cur); return; }
  let rank = 0;
  try {
    const top = await fetchSeasonTop(last, 100);
    const i = top.findIndex(r => r.code === cloudCode);
    rank = i >= 0 ? i + 1 : 0;
  } catch (e) { return; }
  const gain = seasonRewardFor(rank);
  coins += gain; Store.set('coins', coins);
  const badges = loadSeasonBadges();
  badges.push({ s: seasonNumberOf(last), r: rank, b: prevBest });
  Store.set('seasonBadges', JSON.stringify(badges.slice(-24)));
  Store.set('seasonLastKey', cur);
  if (typeof showToast === 'function') showToast(t('seasonRewardToast').replace('{s}', seasonNumberOf(last)).replace('{r}', rank ? '#' + rank : t('seasonNoRank')).replace('{c}', gain));
  cloudPushSoon();
  if (typeof refreshShopState === 'function') refreshShopState();
}

function refreshSeasonCard(){
  const n = document.getElementById('seasonCardTitle');
  if (n) n.textContent = t('seasonTitle').replace('{n}', seasonNumberOf(seasonKey()));
  const d = document.getElementById('seasonCardDays');
  if (d) d.textContent = t('seasonDaysLeft').replace('{d}', seasonDaysLeft());
  const b = document.getElementById('seasonCardBest');
  if (b) b.textContent = compactNum(loadSeasonBest());
}

let seasonTab = 'players';
function openSeason(tab){
  const m = document.getElementById('seasonModal');
  if (!m) return;
  m.classList.remove('hidden');
  if (typeof sfxPopupOpen === 'function') sfxPopupOpen();
  setSeasonTab(tab || seasonTab);
}
function closeSeason(){
  const m = document.getElementById('seasonModal');
  if (m) m.classList.add('hidden');
  if (typeof sfxPopupClose === 'function') sfxPopupClose();
  refreshSeasonCard();
}
function setSeasonTab(tab){
  seasonTab = tab;
  document.querySelectorAll('#seasonTabs [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const head = document.getElementById('seasonHead');
  if (head) head.innerHTML = '<div class="seasonHeadTitle">' + escapeHtml(t('seasonTitle').replace('{n}', seasonNumberOf(seasonKey()))) + '</div><div class="seasonHeadSub">' + escapeHtml(t('seasonDaysLeft').replace('{d}', seasonDaysLeft())) + '</div>';
  if (tab === 'players') renderSeasonPlayers();
  else if (tab === 'clans') renderSeasonClans();
  else renderMyClan();
}
function seasonBox(){ return document.getElementById('seasonBody'); }
function seasonMsg(key){ const b = seasonBox(); if (b) b.innerHTML = '<div class="seasonEmpty">' + escapeHtml(t(key)) + '</div>'; }

async function renderSeasonPlayers(){
  const box = seasonBox();
  if (!box) return;
  seasonMsg('cloudLoading');
  const key = seasonKey();
  let rows;
  try { rows = await fetchSeasonTop(key, 100); } catch (e) { if (seasonTab === 'players') seasonMsg('cloudErr'); return; }
  if (seasonTab !== 'players') return;
  box.innerHTML = '';
  const badges = loadSeasonBadges();
  if (badges.length){
    const bw = document.createElement('div');
    bw.className = 'seasonBadges';
    bw.innerHTML = '<span class="sbLbl">' + escapeHtml(t('seasonMyBadges')) + '</span>' + badges.slice(-6).map(x => '<span class="sBadge">' + escapeHtml(t('seasonShort').replace('{n}', x.s)) + ' · ' + escapeHtml(x.r ? '#' + x.r : '—') + '</span>').join('');
    box.appendChild(bw);
  }
  if (!rows.length){ const e = document.createElement('div'); e.className = 'seasonEmpty'; e.textContent = t('seasonNoPlayers'); box.appendChild(e); return; }
  const list = document.createElement('div');
  list.className = 'seasonList';
  rows.forEach((r, i) => {
    const row = buildPlayerRow(r.code, r.f, (i + 1) + '.');
    const bEl = row.querySelector('b');
    if (bEl) bEl.textContent = String(fsInt(r.f, key));
    if (r.code === cloudCode) row.classList.add('me');
    if (i < 3) row.classList.add('top' + (i + 1));
    list.appendChild(row);
  });
  box.appendChild(list);
  const rw = document.createElement('div');
  rw.className = 'seasonRewards';
  rw.innerHTML = '<div class="sbLbl">' + escapeHtml(t('seasonRewardsTitle')) + '</div>' + SEASON_REWARDS.map(([top, c]) => '<span class="sReward">' + escapeHtml(t('seasonTopN').replace('{n}', top)) + ' <b>' + c + '</b></span>').join('');
  box.appendChild(rw);
}

async function renderSeasonClans(){
  const box = seasonBox();
  if (!box) return;
  seasonMsg('cloudLoading');
  let clans;
  try { clans = await fetchClanTop(); } catch (e) { if (seasonTab === 'clans') seasonMsg('cloudErr'); return; }
  if (seasonTab !== 'clans') return;
  box.innerHTML = '';
  if (!clans.length){ seasonMsg('clanNoneYet'); return; }
  const list = document.createElement('div');
  list.className = 'seasonList';
  clans.slice(0, 50).forEach((c, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'clanRow' + (c.code === myClan ? ' me' : '');
    row.style.setProperty('--cc', c.color || CLAN_COLORS[0]);
    row.innerHTML = '<span class="lbRank">' + (i + 1) + '.</span><span class="clanBadge"></span><span class="clanRowName">' + escapeHtml(c.name) + '<small>' + escapeHtml(t('clanMembersN').replace('{n}', c.members)) + '</small></span><b>' + c.total + '</b>';
    row.addEventListener('click', () => renderClanView(c.code));
    list.appendChild(row);
  });
  box.appendChild(list);
}

async function renderClanView(code){
  const box = seasonBox();
  if (!box) return;
  seasonMsg('cloudLoading');
  let members;
  try { members = await fetchClanMembers(code); } catch (e) { seasonMsg('cloudErr'); return; }
  const key = seasonKey();
  const lead = members.find(r => r.code === code);
  if (!lead || !fsStr(lead.f, 'clanOwnName')){
    if (code === myClan && !myClanOwn){ leaveClan(); seasonMsg('clanDisbanded'); return; }
    seasonMsg('clanErrNotFound');
    return;
  }
  members.sort((a, b) => fsInt(b.f, key) - fsInt(a.f, key));
  const total = members.reduce((a, r) => a + fsInt(r.f, key), 0);
  const color = fsStr(lead.f, 'clanOwnColor') || CLAN_COLORS[0];
  box.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'clanCard';
  card.style.setProperty('--cc', color);
  card.innerHTML = '<span class="clanBadge big"></span><div class="clanCardBody"><div class="clanName">' + escapeHtml(fsStr(lead.f, 'clanOwnName')) + '</div><div class="clanMeta">' + escapeHtml(t('clanMembersN').replace('{n}', members.length + ' / ' + CLAN_MAX)) + ' · ' + escapeHtml(t('clanPoints').replace('{n}', total)) + '</div>'
    + (code === myClan ? '<div class="clanCodeRow"><span>' + escapeHtml(t('clanCodeLbl')) + '</span><code id="clanCodeVal">' + escapeHtml(code) + '</code><button type="button" class="clanCopy" id="clanCopyBtn">' + escapeHtml(t('clanCopy')) + '</button></div>' : '') + '</div>';
  box.appendChild(card);
  const list = document.createElement('div');
  list.className = 'seasonList';
  members.forEach((r, i) => {
    const row = buildPlayerRow(r.code, r.f, (i + 1) + '.');
    const bEl = row.querySelector('b');
    if (bEl) bEl.textContent = String(fsInt(r.f, key));
    if (r.code === code) row.classList.add('leader');
    if (r.code === cloudCode) row.classList.add('me');
    list.appendChild(row);
  });
  box.appendChild(list);
  const cp = document.getElementById('clanCopyBtn');
  if (cp) cp.addEventListener('click', () => {
    const done = () => { cp.textContent = t('clanCopied'); };
    try { navigator.clipboard.writeText(code).then(done, () => {}); } catch (e) {}
  });
  if (code === myClan){
    const lv = document.createElement('button');
    lv.type = 'button';
    lv.className = 'btn ghost clanLeave';
    lv.textContent = myClanOwn ? t('clanDisband') : t('clanLeave');
    let armed = false;
    lv.addEventListener('click', () => {
      if (!armed){ armed = true; lv.textContent = t('clanLeaveSure'); return; }
      leaveClan();
      renderMyClan();
    });
    box.appendChild(lv);
  } else if (!myClan){
    const jn = document.createElement('button');
    jn.type = 'button';
    jn.className = 'btn clanJoinBtn';
    jn.textContent = t('clanJoin');
    jn.addEventListener('click', async () => { jn.disabled = true; const r = await joinClan(code); if (r.ok) renderClanView(code); else { jn.disabled = false; jn.textContent = t(r.err); } });
    box.appendChild(jn);
  }
}

function renderMyClan(){
  const box = seasonBox();
  if (!box) return;
  if (myClan){ renderClanView(myClan); return; }
  box.innerHTML = '';
  const make = document.createElement('div');
  make.className = 'clanForm';
  make.innerHTML = '<div class="sbLbl">' + escapeHtml(t('clanCreateTitle')) + '</div>'
    + '<input id="clanNameInput" class="adminInput clanInput" maxlength="16" autocomplete="off" placeholder="' + escapeHtml(t('clanNamePh')) + '">'
    + '<div class="clanSwatches" id="clanSwatches">' + CLAN_COLORS.map((c, i) => '<button type="button" class="clanSw' + (i === 0 ? ' on' : '') + '" data-c="' + c + '" style="--cc:' + c + '" aria-label="' + c + '"></button>').join('') + '</div>'
    + '<button type="button" class="btn clanCreateBtn" id="clanCreateBtn">' + escapeHtml(t('clanCreateBtn').replace('{p}', CLAN_PRICE)) + '</button>'
    + '<p class="clanErr" id="clanCreateErr"></p>';
  box.appendChild(make);
  const join = document.createElement('div');
  join.className = 'clanForm';
  join.innerHTML = '<div class="sbLbl">' + escapeHtml(t('clanJoinTitle')) + '</div>'
    + '<div class="clanJoinRow"><input id="clanCodeInput" class="adminInput clanInput" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="' + escapeHtml(t('clanCodePh')) + '"><button type="button" class="btn clanJoinBtn" id="clanJoinBtn">' + escapeHtml(t('clanJoin')) + '</button></div>'
    + '<p class="clanErr" id="clanJoinErr"></p><p class="clanHint">' + escapeHtml(t('clanJoinHint')) + '</p>';
  box.appendChild(join);
  let color = CLAN_COLORS[0];
  document.querySelectorAll('#clanSwatches .clanSw').forEach(b => b.addEventListener('click', () => {
    color = b.dataset.c;
    document.querySelectorAll('#clanSwatches .clanSw').forEach(x => x.classList.toggle('on', x === b));
  }));
  document.getElementById('clanCreateBtn').addEventListener('click', async () => {
    const r = await createClan(document.getElementById('clanNameInput').value, color);
    if (r.ok) renderMyClan(); else document.getElementById('clanCreateErr').textContent = t(r.err).replace('{p}', CLAN_PRICE);
  });
  document.getElementById('clanJoinBtn').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    const r = await joinClan(document.getElementById('clanCodeInput').value);
    e.currentTarget.disabled = false;
    if (r.ok) renderMyClan(); else document.getElementById('clanJoinErr').textContent = t(r.err).replace('{n}', CLAN_MAX);
  });
}
