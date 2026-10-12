"use strict";
// ---------- Коллаба с My Flying Pig: подарок «Свиная шапка» ----------
(function(){
  I18N.ru.items['hat:pig'] = { n: 'Свиная шапка', d: 'Подарок за коллабу с My Flying Pig — не продаётся.' };
  I18N.en.items['hat:pig'] = { n: 'Pig Hat', d: 'Gift for the My Flying Pig collab — not for sale.' };
  I18N.ru.items['acc:hooves'] = { n: 'Свиные копытца', d: 'Лёгкий шаг: гравитация слабее на 12%, прыжки выше и дольше. Подарок за коллабу — не продаётся.' };
  I18N.en.items['acc:hooves'] = { n: 'Piggy Hooves', d: 'Light step: 12% weaker gravity, higher and longer jumps. Collab gift — not for sale.' };
  Object.assign(I18N.ru, {
    cpTitle: 'My Flying Pig', cpText: 'Коллаба: шапка и копытца в подарок', cpWord: 'забрать',
    cpGot: 'Шапка и копытца теперь в гардеробе!'
  });
  Object.assign(I18N.en, {
    cpTitle: 'My Flying Pig', cpText: 'Collab: pig hat and hooves as a gift', cpWord: 'claim',
    cpGot: 'Pig Hat and Hooves are in your wardrobe!'
  });

  const GIFTS = ['hat:pig', 'acc:hooves'];
  const gotAll = () => GIFTS.every(g => owned.has(g));

  function cpRefresh(){
    const card = document.getElementById('cpCard');
    if (!card) return;
    card.classList.toggle('hidden', gotAll());
    const a = document.getElementById('cpCardTitle'), b = document.getElementById('cpCardText'), w = document.getElementById('cpCardWord');
    if (a) a.textContent = t('cpTitle');
    if (b) b.textContent = t('cpText');
    if (w) w.textContent = t('cpWord');
  }

  function cpClaim(){
    if (gotAll()) return;
    GIFTS.forEach(g => owned.add(g));
    saveOwned();
    if (typeof buildShop === 'function') buildShop();
    if (typeof refreshShopState === 'function') refreshShopState();
    if (typeof cloudPushSoon === 'function') cloudPushSoon();
    if (typeof sfxPopupOpen === 'function') sfxPopupOpen();
    cpRefresh();
    showToast(t('cpGot'));
  }

  window.cpMenuEnter = function(){
    cpRefresh();
    if (gotAll() || Store.get('cpSeen', '') === '1') return;
    Store.set('cpSeen', '1');
    setTimeout(() => { if (!gotAll()) showToast(t('cpText'), cpClaim); }, 1500);
  };

  const card = document.getElementById('cpCard');
  if (card) card.addEventListener('click', cpClaim);
  cpRefresh();
})();
