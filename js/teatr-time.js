// Тема «Театр» включена всегда (смены дня и ночи нет).
(function(){
  function on(){document.body.classList.add('tt-on');var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content','#b3202a');}
  if(document.body)on();else document.addEventListener('DOMContentLoaded',on);
})();
