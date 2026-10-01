"use strict";
const BADGES = {
  verified: { n: 'Галочка',     c1: '#6ff0ff', c2: '#1a9dff', rim: '#0b6fb8', icon: 'check' },
  gold:     { n: 'Золото',      c1: '#ffe98f', c2: '#f4a51c', rim: '#b8740b', icon: 'star' },
  love:     { n: 'Сердце',      c1: '#ffa8d6', c2: '#e8409a', rim: '#9c1f5c', icon: 'heart' },
  fire:     { n: 'Огонь',       c1: '#ffd36b', c2: '#ff5a1f', rim: '#a8300a', icon: 'flame' },
  crown:    { n: 'Корона',      c1: '#d9a8ff', c2: '#7a3df0', rim: '#4b1fa0', icon: 'crown' },
  diamond:  { n: 'Алмаз',       c1: '#c9fbff', c2: '#39c6e8', rim: '#1478a0', icon: 'gem' },
  bolt:     { n: 'Молния',      c1: '#fff38a', c2: '#ffb000', rim: '#a86c00', icon: 'bolt' },
  paw:      { n: 'Лапка',       c1: '#ffd9b0', c2: '#ff9f45', rim: '#a8551a', icon: 'paw' },
  music:    { n: 'Музыка',      c1: '#b8f5d6', c2: '#2fbf7a', rim: '#157a4a', icon: 'note' },
  moon:     { n: 'Луна',        c1: '#a9b4ff', c2: '#3b3f9e', rim: '#23265e', icon: 'moon' },
  trophy:   { n: 'Кубок',       c1: '#ffe98f', c2: '#e0a100', rim: '#8a5f00', icon: 'trophy' },
  shield:   { n: 'Модератор',   c1: '#8cf0b0', c2: '#1f9e5a', rim: '#0e5c33', icon: 'shield' },
  sparkle:  { n: 'Сияние',      c1: '#ffd1f0', c2: '#b05cff', rim: '#6a2aa8', icon: 'sparkle' },
  leaf:     { n: 'Природа',     c1: '#d6ff9a', c2: '#5cc93b', rim: '#2f7d1a', icon: 'leaf' },
  snow:     { n: 'Снежинка',    c1: '#e8f9ff', c2: '#6ec8ff', rim: '#2f7fb0', icon: 'snow' },
  dev:      { n: 'Разраб',      c1: '#4a4a70', c2: '#15152a', rim: '#8affc1', icon: 'code' },
  carrot:   { n: 'Морковка',    c1: '#ffc27a', c2: '#ff7a1a', rim: '#a8450a', icon: 'carrot' },
  bunny:    { n: 'Котокролик',  c1: '#ffcfe6', c2: '#ff7ab8', rim: '#a83a72', icon: 'bunny' },
  ai:       { n: 'Нейросеть',   c1: '#f6b995', c2: '#d4683f', rim: '#8a3a1c', icon: 'bubble' },
  rainbow:  { n: 'Радуга',      c1: '#ff6b6b', c2: '#7a5cff', rim: '#5a3aa8', icon: 'check',
              stops: ['#ff6b6b', '#ffd34d', '#5aff8a', '#5ab4ff', '#c05aff'] }
};
const BADGE_IDS = Object.keys(BADGES);
const isValidBadge = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(BADGES, id);

let badgeSealPathCache = '';
function badgeSealPath(){
  if (badgeSealPathCache) return badgeSealPathCache;
  const pts = [];
  const N = 120;
  for (let i = 0; i < N; i++){
    const a = (i / N) * Math.PI * 2;
    const r = 53 + 3.2 * Math.cos(a * 8);
    pts.push((i === 0 ? 'M' : 'L') + (64 + r * Math.cos(a)).toFixed(2) + ' ' + (64 + r * Math.sin(a)).toFixed(2));
  }
  badgeSealPathCache = pts.join(' ') + ' Z';
  return badgeSealPathCache;
}

function badgeSvg(id){
  const b = BADGES[id];
  if (!b) return '';
  const stops = b.stops || [b.c1, b.c2];
  const stopsSvg = stops.map((c, i) => '<stop offset="' + (stops.length === 1 ? 0 : i / (stops.length - 1)) + '" stop-color="' + c + '"/>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' + stopsSvg + '</linearGradient></defs>' +
    '<path d="' + badgeSealPath() + '" fill="url(#g)" stroke="' + b.rim + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<circle cx="64" cy="64" r="43" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.5"/>' +
    '<ellipse cx="50" cy="38" rx="22" ry="10" fill="#fff" opacity=".22" transform="rotate(-25 50 38)"/>' +
    BADGE_ICONS[b.icon](b) +
    '</svg>';
}

const badgeUriCache = {};
function badgeDataUri(id){
  if (!isValidBadge(id)) return '';
  if (!badgeUriCache[id]) badgeUriCache[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(badgeSvg(id));
  return badgeUriCache[id];
}

function badgeImgHtml(id){
  if (!isValidBadge(id)) return '';
  return '<img class="nickBadge" src="' + badgeDataUri(id) + '" alt="' + escapeHtml(BADGES[id].n) + '">';
}

function setBadgeImg(el, id){
  if (!el) return;
  if (!isValidBadge(id)){
    el.classList.add('hidden');
    el.removeAttribute('src');
    return;
  }
  el.classList.remove('hidden');
  el.src = badgeDataUri(id);
  el.alt = BADGES[id].n;
}

function setFrameClass(el, frameId){
  if (!el) return;
  const fr = isValidFrame(frameId) ? frameId : 'none';
  for (const id of FRAME_LIST) el.classList.remove('frame-' + id);
  el.classList.add('frame-' + fr);
}
