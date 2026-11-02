"use strict";
// Вход в облако. У каждого устройства свой анонимный аккаунт Firebase (uid).
// Все запросы в Firestore идут с токеном: правила на сервере проверяют, что игрок меняет только свой аккаунт.
// Персонал (вход по почте в админке) подписывает запросы своим токеном через sfetch.
const CJ_AUTH_KEY = 'doodlecabbit.auth';
let cjAuth = null;
try { cjAuth = JSON.parse(window.localStorage.getItem(CJ_AUTH_KEY) || 'null'); } catch (e) { cjAuth = null; }
let cjAuthBusy = null;

function cjAuthSave(){ try { window.localStorage.setItem(CJ_AUTH_KEY, JSON.stringify(cjAuth)); } catch (e) {} }
function cjApplyTokens(j, uid){
  const tok = j.idToken || j.id_token, ref = j.refreshToken || j.refresh_token;
  if (!tok || !ref) return false;
  cjAuth = { uid: uid || j.localId || j.user_id, token: tok, refresh: ref, exp: Date.now() + (parseInt(j.expiresIn || j.expires_in, 10) || 3600) * 1000 };
  cjAuthSave();
  return true;
}
const cjRawFetch = window.fetch.bind(window);

async function cjSignIn(){
  const key = CLOUD.apiKey;
  if (cjAuth && cjAuth.refresh){
    const r = await cjRawFetch('https://securetoken.googleapis.com/v1/token?key=' + key, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(cjAuth.refresh)
    });
    if (r.ok && cjApplyTokens(await r.json(), cjAuth.uid)) return;
    if (r.status !== 400) return; // сеть упала: не создаём новый аккаунт, иначе потеряем владельца
  }
  const r = await cjRawFetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + key, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true })
  });
  if (r.ok) cjApplyTokens(await r.json());
}
async function playerToken(){
  if (cjAuth && cjAuth.token && Date.now() < cjAuth.exp - 60000) return cjAuth.token;
  if (!cjAuthBusy) cjAuthBusy = cjSignIn().catch(() => {}).finally(() => { cjAuthBusy = null; });
  await cjAuthBusy;
  return cjAuth && cjAuth.token ? cjAuth.token : '';
}
const myUid = () => (cjAuth && cjAuth.uid) || '';

window.fetch = async function(url, opts){
  if (typeof url === 'string' && url.indexOf('https://firestore.googleapis.com/') === 0){
    const o = Object.assign({}, opts || {});
    const h = Object.assign({}, o.headers || {});
    if (!h.Authorization){
      let staff = '';
      try { if (staffAuth && typeof staffToken === 'function') staff = await staffToken(); } catch (e) {} // админка ещё не загружена
      const tok = staff || await playerToken();
      if (tok) h.Authorization = 'Bearer ' + tok;
    }
    o.headers = h;
    return cjRawFetch(url, o);
  }
  return cjRawFetch(url, opts);
};

// ---------- аккаунт игрока привязан к списку устройств uids ----------
let cjDocMissing = false;
let cjOwner = false;
const cjUids = (f) => ((f && f.uids && f.uids.arrayValue && f.uids.arrayValue.values) || []).map(v => v.stringValue).filter(Boolean);
const cjDoc = (code) => cloudBase() + '/players/' + encodeURIComponent(code);

async function cjAddUid(code, f){
  const list = cjUids(f).concat(myUid());
  const res = await fetch(cjDoc(code) + '?updateMask.fieldPaths=uids&key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { uids: { arrayValue: { values: list.map(v => ({ stringValue: v })) } } } })
  });
  return res.ok;
}
// пароль не лежит в открытом документе игрока: только в secrets, который сервер никому не отдаёт
async function cjWriteSecret(code, hash){
  const res = await fetch(cloudBase() + '/secrets/' + encodeURIComponent(code) + '?key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { h: { stringValue: hash } } })
  });
  return res.ok;
}
async function cjSetPwFlag(code, on){
  return fetch(cjDoc(code) + '?updateMask.fieldPaths=pwSet&updateMask.fieldPaths=pwHash&key=' + CLOUD.apiKey, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { pwSet: { booleanValue: !!on } } })
  });
}
// вызывается, когда свой документ прочитан: привязать устройство и перенести старый открытый хэш пароля
async function cjAfterOwnDoc(f){
  if (!myUid()) await playerToken();
  const uid = myUid();
  if (!uid || !cloudCode) return;
  cjOwner = cjUids(f).indexOf(uid) >= 0;
  if (!cjOwner && cjUids(f).length === 0) cjOwner = await cjAddUid(cloudCode, f);
  if (!cjOwner) return;
  const oldHash = f.pwHash && f.pwHash.stringValue;
  if (oldHash && await cjWriteSecret(cloudCode, oldHash)) await cjSetPwFlag(cloudCode, true);
}
// вход в аккаунт с другого устройства: доказываем знание пароля через claims, сервер сверяет с secrets
async function cjClaim(code, f, pwHash){
  if (!myUid()) await playerToken();
  const uid = myUid();
  if (!uid) return false;
  if (cjUids(f).indexOf(uid) >= 0) return true;
  if (pwHash){
    const c = await fetch(cloudBase() + '/claims/' + encodeURIComponent(code) + '/by/' + uid + '?key=' + CLOUD.apiKey, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { h: { stringValue: pwHash } } })
    });
    if (!c.ok) return false;
  }
  return cjAddUid(code, f);
}
