(function(){
function apply(){
var q=(location.search.match(/[?&]theme=(day|night)/)||[])[1];
var h=new Date().getHours(),night=q?q==='night':(h>=20||h<7);
var c=document.body.classList;c.add('tt-on');c.toggle('tt-night',night);c.toggle('tt-day',!night);
var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',night?'#1b1650':'#bfe3ff');
}
function init(){apply();setInterval(apply,60000);}
if(document.body)init();else document.addEventListener('DOMContentLoaded',init);
})();
