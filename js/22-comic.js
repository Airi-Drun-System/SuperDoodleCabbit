"use strict";
// ---------- Комикс-меню: скотч под выбранным пунктом и подпись к нему ----------
Object.assign(I18N.ru, {
  overTitleNormal: 'ПЛЮХ!', overTitleRecord: 'РЕКОРД!', coNewSticker: 'новая наклейка', coRecord: 'рекорд',
  capPlay: 'Сезон {n}, осталось {d} дн. Твой рекорд сезона: {b}.', capCont: 'Забег на паузе. Жми, и котокролик прыгает дальше.',
  capWardrobe: 'Монет: {c}. Наряды, шапки и персонажи.', capSeason: 'Рейтинг сезона, кланы и твой клан.', capFruits: 'Твои фрукты, колесо удачи и обмен.',
  capSettings: 'Звук, графика, язык и ссылки на канал.', capQuit: 'Закончить забег и выйти в меню.'
});
Object.assign(I18N.en, {
  overTitleNormal: 'SPLAT!', overTitleRecord: 'RECORD!', coNewSticker: 'new sticker', coRecord: 'record',
  capPlay: 'Season {n}, {d} days left. Your season best: {b}.', capCont: 'Run paused. Tap and the cabbit jumps on.',
  capWardrobe: 'Coins: {c}. Outfits, hats and characters.', capSeason: 'Season ranking, clans and your clan.', capFruits: 'Your fruits, lucky wheel and trades.',
  capSettings: 'Sound, graphics, language and channel links.', capQuit: 'End the run and go to the menu.'
});
(function(){
  const list = document.getElementById('cmList'), tape = document.getElementById('cmTape'), cap = document.getElementById('cmCapText');
  if (!list || !tape || !cap) return;
  const capText = (k) => {
    if (k === 'play') return t('capPlay').replace('{n}', seasonNumberOf(seasonKey())).replace('{d}', seasonDaysLeft()).replace('{b}', compactNum(loadSeasonBest()));
    if (k === 'wardrobe') return t('capWardrobe').replace('{c}', compactNum(coins));
    return t('cap' + k.charAt(0).toUpperCase() + k.slice(1));
  };
  const visible = () => Array.from(list.querySelectorAll('.cmItem')).filter(b => b.offsetParent !== null);
  function mark(b){
    if (!b || b.offsetParent === null) return;
    list.querySelectorAll('.cmItem.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    tape.style.transform = 'translateY(' + (b.offsetTop + b.offsetHeight * 0.06) + 'px)';
    tape.style.height = (b.offsetHeight * 0.88) + 'px';
    cap.textContent = capText(b.dataset.cap);
  }
  list.querySelectorAll('.cmItem').forEach(b => {
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mark(b); });
    b.addEventListener('focus', () => mark(b));
  });
  // при каждом показе меню ставим скотч на первый видимый пункт
  const menu = document.getElementById('menu');
  new MutationObserver(() => { if (!menu.classList.contains('hidden')) requestAnimationFrame(() => mark(visible()[0])); })
    .observe(menu, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => { const on = list.querySelector('.cmItem.on'); if (on) mark(on); });
})();
// голограмма рекорда переливается от мыши или наклона телефона
(function(){
  const set = v => document.querySelectorAll('.cmRec,.coNew').forEach(h => h.style.setProperty('--a', v + 'deg'));
  addEventListener('pointermove', e => set(e.clientX / innerWidth * 360));
  addEventListener('deviceorientation', e => { if (e.gamma != null) set((e.gamma + 90) * 2); });
})();

if (typeof applyStaticI18n === 'function') applyStaticI18n(); // подписи комикс-экранов появились после первого перевода
