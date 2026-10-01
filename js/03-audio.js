"use strict";
let actx = null;
let sfxDry = null, sfxWet = null, sfxBus = null, noiseBuf = null;
let sfxVolume = parseInt(Store.get('sfxVolume', '80'), 10);
if (!isFinite(sfxVolume) || sfxVolume < 0 || sfxVolume > 100) sfxVolume = 80;
function makeImpulse(sec, decay){
  const rate = actx.sampleRate, len = Math.floor(rate * sec);
  const buf = actx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++){
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++){
      const k = i / len;
      const cut = 0.55 - k * 0.4;
      lp += (Math.random() * 2 - 1 - lp) * cut;
      d[i] = lp * Math.pow(1 - k, decay) * (i < rate * 0.012 ? i / (rate * 0.012) : 1);
    }
  }
  return buf;
}
function makePinkNoise(sec){
  const rate = actx.sampleRate, len = Math.floor(rate * sec);
  const buf = actx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++){
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}
function applySfxVolume(){
  if (sfxBus && actx) sfxBus.gain.setTargetAtTime(Math.pow(sfxVolume / 100, 1.4) * 1.5, actx.currentTime, 0.03);
}
function ensureAudio(){
  if (actx){
    if (actx.state === 'suspended' && actx.resume){ try { const r = actx.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
    return;
  }
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  if (!actx) return;
  setupAudioGraph();
}
let sfxShift = 0;
function setupAudioGraph(){
  try {
    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 26; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.22;
    const warm = actx.createBiquadFilter();
    warm.type = 'lowpass'; warm.frequency.value = 7600; warm.Q.value = 0.4;
    const air = actx.createBiquadFilter();
    air.type = 'highpass'; air.frequency.value = 55; air.Q.value = 0.5;
    sfxBus = actx.createGain();
    sfxBus.connect(air); air.connect(warm); warm.connect(comp); comp.connect(actx.destination);
    applySfxVolume();
    sfxDry = actx.createGain();
    sfxDry.connect(sfxBus);
    const conv = actx.createConvolver();
    conv.buffer = makeImpulse(1.2, 2.6);
    const wetLp = actx.createBiquadFilter();
    wetLp.type = 'lowpass'; wetLp.frequency.value = 4200;
    sfxWet = actx.createGain();
    sfxWet.gain.value = 0.28;
    sfxWet.connect(conv); conv.connect(wetLp); wetLp.connect(sfxBus);
    noiseBuf = makePinkNoise(2.5);
  } catch (e) { sfxDry = null; sfxWet = null; }
}
function sfxDest(){ return sfxDry || (actx && actx.destination); }
function sendOut(node, verb, pan, t0, pan1, dur){
  let out = node;
  if ((pan || pan1) && actx.createStereoPanner){
    const p = actx.createStereoPanner();
    p.pan.setValueAtTime(pan || 0, t0);
    if (pan1 != null) p.pan.linearRampToValueAtTime(pan1, t0 + dur);
    node.connect(p);
    out = p;
  }
  out.connect(sfxDest());
  if (sfxWet && verb > 0){
    const s = actx.createGain();
    s.gain.value = verb;
    out.connect(s);
    s.connect(sfxWet);
  }
}
let lastToneAt = 0;
let voiceWin = 0, voiceCount = 0;
function voiceOk(){
  const now = actx.currentTime;
  if (now - voiceWin > 0.06){ voiceWin = now; voiceCount = 0; }
  return ++voiceCount <= 16;
}
function tone(o){
  if (!actx || sfxVolume <= 0) return;
  lastToneAt = performance.now();
  if (!voiceOk()) return;
  try {
    const t0 = actx.currentTime + sfxShift + (o.delay || 0);
    const dur = o.dur || 0.2;
    const osc = actx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.glide || dur));
    if (o.det) osc.detune.value = o.det;
    if (o.vib){
      const l = actx.createOscillator(), lg = actx.createGain();
      l.frequency.value = o.vib;
      lg.gain.value = o.vibDepth || o.f * 0.02;
      l.connect(lg); lg.connect(osc.frequency);
      l.start(t0); l.stop(t0 + dur + 0.05);
    }
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.lp || Math.min(9000, o.f * 3 + 500);
    lp.Q.value = 0.3;
    const g = actx.createGain();
    const a = Math.max(0.012, o.a || 0.012), vol = o.vol || 0.1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    if (o.hold) g.gain.setValueAtTime(vol, t0 + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(lp); lp.connect(g);
    sendOut(g, o.verb == null ? 0.35 : o.verb, o.pan, t0, o.pan1, dur);
    osc.start(t0); osc.stop(t0 + dur + 0.06);
  } catch (e) {}
}
function noiseSweep(o){
  if (!actx || !noiseBuf || sfxVolume <= 0) return;
  if (!voiceOk()) return;
  try {
    const t0 = actx.currentTime + sfxShift + (o.delay || 0);
    const dur = o.dur || 0.3;
    const src = actx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = actx.createBiquadFilter();
    bp.type = o.ftype || 'bandpass';
    bp.Q.value = o.q || 0.9;
    bp.frequency.setValueAtTime(o.f0 || 600, t0);
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, o.f1 || 2000), t0 + dur);
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = o.lp || 5200;
    const g = actx.createGain();
    const peakAt = t0 + dur * (o.peak == null ? 0.45 : o.peak);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.1, peakAt);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(lp); lp.connect(g);
    sendOut(g, o.verb == null ? 0.4 : o.verb, o.pan0, t0, o.pan1, dur);
    const off = Math.random() * Math.max(0, noiseBuf.duration - dur - 0.1);
    src.start(t0, off, dur + 0.05);
  } catch (e) {}
}
function pluck(f, vol, delay, o){
  o = o || {};
  tone({ f, dur: o.dur || 0.55, vol: vol, a: 0.004, delay, verb: o.verb == null ? 0.45 : o.verb, pan: o.pan, lp: o.lp || Math.min(8000, f * 2.2 + 400) });
  tone({ f: f * 2, dur: 0.16, vol: vol * 0.22, a: 0.003, delay, verb: 0.3, pan: o.pan });
  tone({ f: f * 3.99, dur: 0.05, vol: vol * 0.035, a: 0.002, delay, verb: 0.2, pan: o.pan });
}
function whoosh(kind, vol, delay){
  const v = (vol || 1) * 2.2;
  if (kind === 'up') noiseSweep({ dur: 0.34, f0: 380, f1: 2600, q: 1.1, vol: 0.11 * v, delay, peak: 0.6 });
  else if (kind === 'down') noiseSweep({ dur: 0.4, f0: 2400, f1: 320, q: 1.1, vol: 0.11 * v, delay, peak: 0.3 });
  else if (kind === 'pass') noiseSweep({ dur: 0.55, f0: 500, f1: 1800, q: 0.8, vol: 0.13 * v, delay, pan0: -0.85, pan1: 0.85, peak: 0.5 });
  else if (kind === 'big'){
    noiseSweep({ dur: 0.9, f0: 180, f1: 2200, q: 0.7, vol: 0.16 * v, delay, pan0: 0.6, pan1: -0.6, peak: 0.7, verb: 0.6 });
    tone({ f: 70, f2: 140, dur: 0.9, vol: 0.04 * v, a: 0.25, delay, verb: 0.3, lp: 400 });
  } else if (kind === 'tiny') noiseSweep({ dur: 0.2, f0: 900, f1: 2600, q: 1.4, vol: 0.05 * v, delay, peak: 0.5, verb: 0.2 });
  else noiseSweep({ dur: 0.28, f0: 700, f1: 1900, q: 1.2, vol: 0.08 * v, delay, peak: 0.5 });
}
function beep(freq, dur, type, gainPeak){
  if (!actx) return;
  const soft = type === 'square' || type === 'sawtooth';
  const v = (gainPeak != null ? gainPeak : 0.18) * (soft ? 0.55 : 0.75);
  tone({ f: freq, f2: freq * 0.985, dur: Math.max(0.1, (dur || 0.15) * 1.6), vol: v, a: 0.006, type: 'sine' });
  tone({ f: freq * 2, dur: Math.max(0.06, (dur || 0.15) * 0.6), vol: v * 0.18, a: 0.004, type: soft ? 'triangle' : 'sine', verb: 0.2 });
}
function sweep(f0, f1, dur, type, peak){
  if (!actx) return;
  tone({ f: f0, f2: f1, dur: dur * 1.15, vol: (peak || 0.1) * 0.7, a: Math.min(0.06, dur * 0.25), vib: 5.5, vibDepth: Math.min(f0, f1) * 0.012, verb: 0.5 });
  noiseSweep({ dur, f0: Math.min(4000, f0 * 1.5), f1: Math.min(4000, f1 * 1.5), q: 1.3, vol: (peak || 0.1) * 0.35, peak: 0.5 });
}
const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3, 2637];
let coinStreak = 0, coinStreakT = 0;
function sfxCoin(){
  const now = performance.now();
  coinStreak = now - coinStreakT < 700 ? Math.min(PENTA.length - 2, coinStreak + 1) : 0;
  coinStreakT = now;
  const f = PENTA[coinStreak];
  const pan = (Math.random() - 0.5) * 0.4;
  pluck(f, 0.07, 0, { dur: 0.45, pan });
  pluck(f * 1.498, 0.055, 0.06, { dur: 0.6, pan });
}
function sfxJump(){
  const k = 0.94 + Math.random() * 0.12;
  tone({ f: 340 * k, f2: 640 * k, dur: 0.16, vol: 0.06, a: 0.008, glide: 0.12, verb: 0.25 });
  whoosh('tiny', 1.1);
}
function sfxLand(){
  const k = 0.92 + Math.random() * 0.16;
  tone({ f: 230 * k, f2: 150 * k, dur: 0.14, vol: 0.12, a: 0.003, glide: 0.1, verb: 0.15, lp: 900 });
  tone({ f: 460 * k, f2: 340 * k, dur: 0.07, vol: 0.03, a: 0.003, verb: 0.1 });
  noiseSweep({ dur: 0.07, f0: 1400, f1: 500, q: 0.7, vol: 0.025, peak: 0.15, verb: 0.05, lp: 2200 });
}
function sfxSpring(){
  tone({ f: 250, f2: 820, dur: 0.42, glide: 0.24, vol: 0.1, a: 0.01, vib: 9, vibDepth: 16, verb: 0.35 });
  tone({ f: 500, f2: 1640, dur: 0.22, glide: 0.2, vol: 0.02, a: 0.01, verb: 0.3 });
  pluck(1568, 0.04, 0.14, { dur: 0.7 });
  whoosh('up', 0.9);
}
function sfxGlass(){
  [2093, 2637, 3136, 3951, 3136].forEach((f, i) => pluck(f, 0.045, i * 0.03, { dur: 1.1, verb: 0.8, pan: (i - 2) * 0.25 }));
  noiseSweep({ dur: 0.5, f0: 6000, f1: 3000, q: 2, vol: 0.05, peak: 0.1, ftype: 'bandpass', verb: 0.7, lp: 9000 });
}
function sfxSmash(){
  tone({ f: 150, f2: 55, dur: 0.26, vol: 0.14, a: 0.003, glide: 0.18, verb: 0.2, lp: 600 });
  tone({ f: 720, f2: 300, dur: 0.1, vol: 0.06, a: 0.003, verb: 0.2 });
  pluck(1760, 0.04, 0.05, { dur: 0.6 });
  pluck(2349, 0.03, 0.09, { dur: 0.6 });
  noiseSweep({ dur: 0.18, f0: 2000, f1: 400, q: 0.8, vol: 0.06, peak: 0.1, verb: 0.3 });
}
function sfxOver(){
  tone({ f: 523, f2: 196, dur: 0.95, glide: 0.8, vol: 0.09, a: 0.02, vib: 5, vibDepth: 6, verb: 0.6 });
  tone({ f: 659, f2: 247, dur: 0.9, glide: 0.8, vol: 0.04, a: 0.03, verb: 0.6, delay: 0.05 });
  whoosh('down', 1.1);
}
function sfxSpearSynth(){
  whoosh('pass', 1.2);
  pluck(1318, 0.04, 0.12, { dur: 0.7 });
  tone({ f: 200, f2: 520, dur: 0.24, vol: 0.06, a: 0.02, verb: 0.3 });
}
function sfxSpear(){ sfxSpearSynth(); }
function sfxPortalOpen(){
  whoosh('big', 0.8);
  [262, 330, 392, 523].forEach((f, i) => tone({ f, f2: f * 1.5, dur: 0.8, glide: 0.7, vol: 0.035, a: 0.12, delay: i * 0.03, verb: 0.9 }));
}
function sfxPortalGulp(){ tone({ f: 640, f2: 170, dur: 0.2, glide: 0.16, vol: 0.09, a: 0.004, verb: 0.4 }); }
function sfxPortalClose(){
  whoosh('down', 0.9);
  pluck(1318.5, 0.05, 0.22, { dur: 0.9, verb: 0.8 });
}
function sfxPopupOpen(){
  ensureAudio();
  tone({ f: 520, f2: 900, dur: 0.12, glide: 0.07, vol: 0.06, a: 0.004, verb: 0.3 });
  whoosh('tiny', 0.9);
}
function sfxPopupClose(){
  ensureAudio();
  tone({ f: 760, f2: 430, dur: 0.12, glide: 0.08, vol: 0.05, a: 0.004, verb: 0.3 });
  noiseSweep({ dur: 0.18, f0: 2400, f1: 800, q: 1.4, vol: 0.04, peak: 0.3, verb: 0.2 });
}
function sfxClick(){
  if (!actx) return;
  tone({ f: 1320, f2: 1180, dur: 0.07, vol: 0.035, a: 0.002, verb: 0.15, lp: 3200 });
  tone({ f: 660, dur: 0.05, vol: 0.02, a: 0.002, verb: 0.1 });
}
function sfxTick(){ tone({ f: 1500, f2: 1150, dur: 0.045, vol: 0.03, a: 0.002, verb: 0.15, lp: 3000 }); }
function sfxWin(){ [1046.5, 1318.5, 1568, 2093].forEach((f, i) => pluck(f, 0.055, i * 0.075, { dur: 0.8, pan: (i - 1.5) * 0.2 })); whoosh('up', 0.6); }
function sfxLaserWarn(){ pluck(880, 0.05, 0, { dur: 0.3 }); pluck(880, 0.05, 0.16, { dur: 0.3 }); }
function sfxLaserFire(){ tone({ f: 170, f2: 120, dur: 0.35, vol: 0.09, a: 0.02, type: 'triangle', lp: 700, verb: 0.3 }); noiseSweep({ dur: 0.35, f0: 300, f1: 1500, q: 0.9, vol: 0.07, verb: 0.3 }); }
function sfxAlert(){ pluck(784, 0.06, 0, { dur: 0.35 }); pluck(988, 0.05, 0.08, { dur: 0.45 }); }
function sfxPerfect(){ [1568, 2093, 2637].forEach((f, i) => pluck(f, 0.05, i * 0.05, { dur: 0.9, verb: 0.7 })); }
function sfxArrow(){ noiseSweep({ dur: 0.22, f0: 900, f1: 3200, q: 1.5, vol: 0.07, peak: 0.3, verb: 0.2 }); tone({ f: 560, f2: 880, dur: 0.1, vol: 0.04, a: 0.004, verb: 0.2 }); }
function sfxBossIn(){ whoosh('big', 1.2); tone({ f: 110, f2: 82, dur: 1.1, vol: 0.12, a: 0.08, vib: 3, vibDepth: 2, lp: 500, verb: 0.5 }); tone({ f: 165, f2: 123, dur: 1.0, vol: 0.05, a: 0.1, lp: 700, verb: 0.5 }); }
function sfxBatSwarm(){ for (let i = 0; i < 3; i++) tone({ f: 1500 + i * 180, f2: 1100 + i * 120, dur: 0.07, vol: 0.03, a: 0.003, delay: i * 0.05, verb: 0.2 }); noiseSweep({ dur: 0.3, f0: 1500, f1: 3000, q: 2, vol: 0.05, peak: 0.3, verb: 0.2 }); }
function sfxIceWarn(){ pluck(2349, 0.04, 0, { dur: 0.5, verb: 0.6 }); pluck(2637, 0.035, 0.1, { dur: 0.5, verb: 0.6 }); }
function sfxIceDrop(){ noiseSweep({ dur: 0.22, f0: 3500, f1: 900, q: 1.6, vol: 0.05, peak: 0.2, verb: 0.3 }); }
function sfxLavaLob(){ tone({ f: 180, f2: 90, dur: 0.3, vol: 0.09, a: 0.01, lp: 600, verb: 0.3 }); noiseSweep({ dur: 0.35, f0: 400, f1: 1200, q: 0.8, vol: 0.07, peak: 0.4, verb: 0.3 }); }
function sfxSlimeSpit(){ tone({ f: 300, f2: 700, dur: 0.14, vol: 0.07, a: 0.006, verb: 0.3 }); tone({ f: 500, f2: 200, dur: 0.12, vol: 0.05, a: 0.006, delay: 0.08, verb: 0.3 }); }
function sfxStarBurst(){ [1568, 1976, 2349].forEach((f, i) => pluck(f, 0.035, i * 0.03, { dur: 0.6, verb: 0.7 })); whoosh('tiny', 1); }
function sfxBossShot(){ tone({ f: 540, f2: 250, dur: 0.14, vol: 0.05, a: 0.004, type: 'triangle', lp: 1600, verb: 0.25 }); }
function sfxBossDie(){ whoosh('down', 1.3); [523, 659, 784, 1046.5].forEach((f, i) => pluck(f, 0.06, 0.25 + i * 0.09, { dur: 1.1, verb: 0.8 })); }
function sfxBossWarn(){ pluck(294, 0.08, 0, { dur: 0.6, lp: 900 }); pluck(220, 0.08, 0.18, { dur: 0.8, lp: 800 }); }
function sfxWorld(){ whoosh('pass', 1.1); [784, 988, 1175, 1568].forEach((f, i) => pluck(f, 0.045, 0.12 + i * 0.07, { dur: 0.9, verb: 0.7 })); }
function sfxBreak(){ tone({ f: 190, f2: 110, dur: 0.16, vol: 0.08, a: 0.003, lp: 700, verb: 0.15 }); noiseSweep({ dur: 0.2, f0: 900, f1: 250, q: 0.6, vol: 0.08, peak: 0.1, verb: 0.15, lp: 1800 }); }
function sfxPoof(){ noiseSweep({ dur: 0.3, f0: 1800, f1: 3800, q: 0.6, vol: 0.06, peak: 0.25, verb: 0.5 }); tone({ f: 700, f2: 1100, dur: 0.14, vol: 0.03, a: 0.01, verb: 0.4 }); }
function sfxFruit(){ sfxWin(); tone({ f: 420, f2: 1400, dur: 0.4, glide: 0.35, vol: 0.05, a: 0.02, verb: 0.5 }); }

let musicOn = Store.get('music', '1') === '1';
const vibroOn = false;
function buzz(ms){
  if (!vibroOn) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}
let musicVolume = parseInt(Store.get('musicVolume', '28'), 10);
if (!isFinite(musicVolume) || musicVolume < 0 || musicVolume > 100) musicVolume = 28;
let ambientReady = true;
const ambientAudio = new Audio('ambient-music.mp3');
ambientAudio.loop = true;
ambientAudio.volume = musicVolume / 100;
ambientAudio.preload = 'auto';
const MUSIC_TRACKS = {
  ddlc: { n: 'DDLC theme', file: 'ddlc-theme.mp3' }
};
let musicTrack = Store.get('musicTrack', '');
function trackOwned(id){ return !!MUSIC_TRACKS[id] && typeof owned !== 'undefined' && owned.has('music:' + id); }
function musicSrcNow(){
  if (musicTrack && trackOwned(musicTrack)) return MUSIC_TRACKS[musicTrack].file;
  return 'ambient-music.mp3';
}
let musicSrcApplied = '';
function applyMusicSrc(){
  const src = musicSrcNow();
  if (src === musicSrcApplied) return false;
  musicSrcApplied = src;
  const wasPlaying = !ambientAudio.paused;
  ambientAudio.pause();
  ambientAudio.src = src;
  ambientReady = true;
  if (wasPlaying && typeof startAmbient === 'function') startAmbient();
  return true;
}
function setMusicTrack(id){
  musicTrack = MUSIC_TRACKS[id] ? id : '';
  Store.set('musicTrack', musicTrack);
  applyMusicSrc();
  if (musicOn && typeof startAmbient === 'function') startAmbient();
  refreshMusicRow();
}
function refreshMusicTrack(){
  if (musicTrack && !trackOwned(musicTrack)){ musicTrack = ''; Store.set('musicTrack', ''); }
  applyMusicSrc();
  refreshMusicRow();
}
function refreshMusicRow(){
  const setting = document.getElementById('musicTrackSetting');
  const row = document.getElementById('musicTrackRow');
  if (!setting || !row) return;
  const ids = Object.keys(MUSIC_TRACKS).filter(trackOwned);
  setting.classList.toggle('hidden', ids.length === 0);
  row.innerHTML = '';
  const add = (id, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label;
    b.setAttribute('aria-pressed', (musicTrack || '') === id ? 'true' : 'false');
    b.addEventListener('click', () => setMusicTrack(id));
    row.appendChild(b);
  };
  add('', t('musicTrackDefault'));
  for (const id of ids) add(id, MUSIC_TRACKS[id].n);
}
ambientAudio.addEventListener('error', () => {
  if (musicSrcApplied && musicSrcApplied !== 'ambient-music.mp3'){
    musicSrcApplied = 'ambient-music.mp3';
    ambientAudio.src = 'ambient-music.mp3';
    ambientReady = true;
    if (musicOn && typeof startAmbient === 'function') startAmbient();
    return;
  }
  ambientReady = false;
});
Store.set('customMusic', '');
function startAmbient(){
  if (!musicOn || !ambientReady) return;
  if (!ambientAudio.paused) return;
  const p = ambientAudio.play();
  if (p && p.catch) p.catch(() => {});
}
function stopAmbient(){ ambientAudio.pause(); }
function ensureAmbient(){ if (musicOn) startAmbient(); }

window.addEventListener('pointerdown', ensureAudio);
window.addEventListener('keydown', ensureAudio, { once: true });
document.addEventListener('click', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('button, .btn, .chip, .swatch, [role="button"]') : null;
  if (!el || el.disabled || el.id === 'hitBtn' || el.id === 'leftBtn' || el.id === 'rightBtn' || el.id === 'spearBtn') return;
  const at = performance.now();
  setTimeout(() => { if (lastToneAt < at) sfxClick(); }, 0);
}, true);
window.addEventListener('pointerdown', ensureAmbient);
window.addEventListener('keydown', ensureAmbient);


const I18N = {
  ru: {
    best: 'Лучший результат', settings: 'Настройки', play: 'Играть',
    cont: 'Продолжить', back: 'Назад', language: 'Язык', motionBlur: 'Motion blur',
    gfxLabel: 'Графика', gfx_auto: 'Авто', gfx_high: 'Красиво', gfx_low: 'Быстро', gfx_ultra: 'Ультра',
    expBadge: 'эксперимент',
    gfxUltraNote: 'Экспериментальная функция: объёмные платформы и тени. На слабых телефонах может тормозить.', worldLightLabel: 'Миры', wl_dark: 'Обычные', wl_light: 'Светлые',
    catMain: 'Основное', catGfx: 'Графика', catProfile: 'Профиль', catSound: 'Звук', catOnline: 'Онлайн', catCommunity: 'Сообщество', fruitsBtn: 'Фрукты', fruitsTitle: 'Фрукты', wheelTitle: 'Рулетка', fruitInvTitle: 'Фрукты и способности', fruitHint: 'Фрукты можно поймать в забеге или выбить в рулетке. Съешь фрукт — получишь его способность. Съешь другой — старый пропадёт. Меняться фруктами можно с друзьями: кнопка ⇄ в чате.', fr_spring: 'Пружинный фрукт', fr_flame: 'Огненный фрукт', fr_ice: 'Ледяной фрукт', fr_storm: 'Грозовой фрукт', fr_portal: 'Портальный фрукт', fr_star: 'Звёздный фрукт', fr_cloud: 'Облачный фрукт', fr_magnet: 'Магнитный фрукт', frd_cloud: 'Падаешь почти вдвое медленнее, как на облаке: легко успеть к дальней платформе.', frd_magnet: 'Монеты сами летят к тебе даже издалека.', fruitEatenTag: 'Съеден', fruitWhere: 'Выпадает в рулетке и в забеге', frd_spring: 'Пружины на каждой второй платформе — прыжки выше.', starShower: 'Звездопад!', fruitActive: 'Сила: {f}', frd_flame: 'Монстры сгорают от касания — без отсчёта, с подкидом и монетами.', frd_ice: 'Движущиеся платформы замерзают, мигающие не исчезают, монстры еле ползают.', frd_storm: 'Каждые 6 секунд молния бьёт ближайшего монстра: +монеты.', frd_portal: 'Телепорты с самого старта и в 6 раз чаще — уносят на самую высокую платформу.', frd_star: 'Каждые 1000 очков над тобой появляется дорожка из 14 монет. +50% жетонов Cabbit Pass.', rar1: 'Обычный', rar2: 'Редкий', rar3: 'Эпический', rar4: 'Легендарный', fruitEatenNow: 'Сейчас съеден', fruitNone: 'Ты ещё не съел ни одного фрукта. Поймай его в забеге или выбей в рулетке!', fruitEat: 'Съесть', fruitReplace: 'Съесть {new}? Способность «{old}» пропадёт.', fruitAte: 'Ты съел: {f}!', fruitGot: 'Новый фрукт: {f}!', wheelSpin: 'Крутить · {p}', wheelWon: 'Выпало:', wheelOdds: 'Шансы:', tradeTitle: 'Обмен фруктами', tradeGiveLabel: 'Ты отдаёшь', tradeWantLabel: 'Ты хочешь', tradeSend: 'Предложить', tradeNoFruits: 'У тебя пока нет фруктов для обмена.', tradeSame: 'Нельзя менять фрукт на такой же.', tradeYouGive: 'ты отдаёшь', tradeYouGet: 'ты получишь', tradeTheyGive: 'даёт тебе', tradeTheyWant: 'хочет взамен', tradeAccept: 'Принять', tradeDecline: 'Отказать', tradeCancel: 'Отменить', tradeWaiting: 'Ждём ответа друга…', tradeStDone: 'Обмен состоялся ✓', tradeStNo: 'Отказано', tradeStCancel: 'Отменено', tradeNeedFruit: 'Для обмена нужен {f}', tradeClosed: 'Этот обмен уже закрыт', tradeCancelled: 'Обмен отменён, фрукт вернулся', tradeDoneYou: 'Обмен! Ты получил: {f}', tradeDoneThem: 'Друг принял обмен! Ты получил: {f}', tradeDeclined: 'Обмен не состоялся, {f} вернулся', msgTrade: '⇄ Обмен фруктами',
    settingsSave: '✓ Сохранить', settingsSaved: 'Сохранено ✓',
    gfxAutoLowNote: '(лагало — включён быстрый режим)',
    pauseMenu: 'Меню',
    bgColorLabel: 'Цвет фона', platformColorLabel: 'Цвет платформ',
    profileCoinsLabel: 'монет', avatarLabel: 'Аватар', pauseLabel: 'Пауза', avatarUpload: 'Фото из галереи', avatarRemove: 'Убрать фото',
    frameLabel: 'Рамка аватара',
    frame_none: 'Без рамки', frame_gold: 'Золотое сияние', frame_neon: 'Неон', frame_rainbow: 'Радуга',
    frame_fire: 'Пламя', frame_frost: 'Иней', frame_orbit: 'Звёздная орбита', frame_ears: 'Ушки котокролика',
    frame_crown: 'Корона', frame_hearts: 'Сердечки',
    musicLabel: 'Музыка', musicVolumeLabel: 'Громкость музыки', sfxVolumeLabel: 'Громкость звуков', musicTrackLabel: 'Песня', musicTrackDefault: 'Обычная', creditTitle: 'Автор кэббита', creditText: 'Персонаж кэббит, котокролик с кошачьей мордочкой, придуман и нарисован художником из Instagram koty_vezde. Спасибо за кэббитов: без них этой игры бы не было!', vibroLabel: 'Вибрация',
    profileCommentsLabel: 'Комментарии', profileCommentPlaceholder: 'Оставить комментарий...',
    profileCommentSend: 'Отправить', profileCommentEmpty: 'Пока нет комментариев',
    profileCommentSending: 'Отправка...', profileCommentError: 'Не удалось загрузить',
    profileCommentTooLong: 'Слишком длинно (макс 140)', profileCommentNeedNick: 'Придумайте ник в настройках',
    chatWriteBtn: 'Написать', chatPlaceholder: 'Написать сообщение...', chatSend: 'Отправить',
    chatEmpty: 'Пока нет сообщений', chatSending: 'Отправка...', chatError: 'Не удалось отправить',
    chatTooLong: 'Слишком длинно (макс 200)', chatNeedNick: 'Придумайте ник в настройках',
    inboxTitle: 'Сообщения', inboxEmpty: 'Пока нет друзей. Найди игрока в рейтинге или через поиск, открой профиль и нажми «Добавить в друзья».', addFriend: 'Добавить в друзья', reqSent: 'Заявка отправлена · отменить', acceptFriend: 'Принять заявку', removeFriend: 'Удалить из друзей', friendReqs: 'Заявки в друзья', dialogsTitle: 'Диалоги', friendReqToast: 'Заявка в друзья от ', friendReqNotify: 'хочет добавить тебя в друзья', friendsNow: 'Вы теперь друзья — напиши первым!', friendAdded: 'Теперь вы друзья!', chatNotFriends: 'Переписываться можно только с друзьями', chatReqIncoming: '{nick} хочет добавить тебя в друзья', chatReqOutgoing: 'Заявка отправлена. Ждём, пока {nick} примет', friendReqLimit: 'Слишком много заявок, подожди немного',
    chatOnlineNow: 'в сети', chatYou: 'Вы: ', newMsgToast: 'Новое сообщение от ',
    msgSticker: '[Стикер]', msgPhoto: '[Фото]', photoTap: 'Фото скрыто — нажми, чтобы посмотреть', photoLoading: 'Загрузка фото…',
    photoRemoved: 'Фото удалено модератором', photoReport: 'Пожаловаться', photoReported: 'Жалоба отправлена ✓', photoBanned: 'Тебе запрещено отправлять фото',
    photoTooBig: 'Не получилось сжать фото, попробуй другое', photoSending: 'Отправка фото…', replyYou: 'Ты', replyAction: 'Ответить', replyGone: 'Сообщение не найдено', msgCopy: 'Копировать', msgCopied: 'Скопировано', msgPin: 'Закрепить', msgUnpin: 'Открепить', msgEdit: 'Изменить', msgEditing: 'Редактирование', msgEditedMark: 'изм.', msgDelete: 'Удалить', msgDeleteSure: 'Точно удалить?', msgDeleted: 'Сообщение удалено', pinnedTitle: 'Закреплённое сообщение', typingNow: 'печатает…', chatThemeTitle: 'Тема чата', th_classic: 'Классика', th_tg: 'Телега', th_mint: 'Мята', th_sunset: 'Закат', th_ocean: 'Океан', th_light: 'Светлая',
    onlineNow: 'онлайн', onlineTotal: 'всего', onlineErr: 'нет связи',
    eventProgress: 'Игроков: {n} / {g} — на {g} будет праздник!', eventLiveTitle: '★ Нас уже 100! ★', eventLiveText: 'Праздник: монеты ×2', eventDaysLeft: 'ещё {n} дн.',
    eventGift: 'Нас 100! Подарок на 7 дней: праздничный колпак и корона + 500 монет',
    notifyLabel: 'Уведомления о сообщениях', notifyOnTxt: 'Уведомления: вкл', notifyOffTxt: 'Уведомления: выкл',
    notifyDenied: 'Уведомления запрещены в настройках браузера — разреши их для сайта игры', notifyUnsupported: 'Этот браузер или приложение не поддерживает уведомления',
    notifyHint: 'Приходят, пока игра открыта или свёрнута', notifyTitle: 'Новое сообщение',
    spamFast: 'Не так быстро — подожди секунду', spamMany: 'Слишком много сообщений, передохни немного', spamRepeat: 'Не повторяй одно и то же', spamLink: 'Ссылки отправлять нельзя',
    blockBtn: 'Заблокировать', unblockBtn: 'Разблокировать', blockedNote: 'Ты заблокировал этого игрока. Его сообщения скрыты.',
    avatarPendingNote: 'Фото на проверке — пока его не одобрят, другие видят 🐰', avatarRejected: 'Фото аватара не прошло проверку',
    dayToday: 'Сегодня', dayYesterday: 'Вчера',
    adminChoiceProfile: 'Профиль', adminChoicePanel: 'Админ панель', adminChoiceCancel: 'Отмена',
    linkChoiceOpen: 'Открыть', linkChoiceCopy: 'Скопировать ссылку', linkCopied: 'Ссылка скопирована',
    linkCopyFailed: 'Не удалось скопировать',
    on: 'вкл', off: 'выкл',
    hint: 'Клавиши ← → или A / D, на телефоне — кнопки внизу. Тап по экрану: выстрел из лука или двойной прыжок. Встретил монстра — жми, когда бегунок в жёлтой зоне по центру, для идеального удара!',
    slotHat: 'На голову', slotAcc: 'Аксессуары', slotTool: 'Инструмент', slotPerk: 'Слоты',
    notEnough: 'Не хватает', coinsWord: 'монет', buyFor: 'Купить за', revert: 'Снять',
    limitedTag: 'Лимитированный', notForSale: 'не продаётся',
    buyAll: 'Купить всё', allBought: 'Всё куплено', willSpend: 'Потратишь',
    nickTitle: 'Как тебя зовут?', nickPlaceholder: 'Ник котокролика', nickConfirm: 'Готово',
    nickLabel: 'Ник', changeNickBtn: 'Изменить',
    rotateMsg: 'Переверни телефон вертикально',
    leaderboard: 'Таблица лидеров', empty: '—', wardrobe: 'Гардероб',
    overTitleNormal: 'Котокролик приземлился', overTitleRecord: 'Новый рекорд',
    overCoins: 'собрано монет', overRecordLabel: 'Рекорд', overNewBest: 'новый личный рекорд', overRank: 'место в рейтинге', overTop1: 'ты первый в рейтинге!', passFree: 'Бесплатно', passGold: 'Золотой', howToLabel: 'Как играть', howToOk: 'Понятно!', dailyTitle: 'Ежедневная награда', dailySub: 'Заходи каждый день — награды растут. Пропустишь день — начнёшь сначала.', dailyDay: 'День {d}', dailyClaim: 'Забрать', dailyTomorrow: 'Приходи завтра!', dailyGot: 'Награда получена: {r}', slotTrail: 'Следы', styleLabel: 'Стиль игры', st_classic: 'Классика', st_aero: 'Frutiger Aero', st_neon: 'Неон', st_paper: 'Тетрадка', trophyGoal: 'цель', passSeasonTxt: 'Сезон {s} · осталось {d} дн.', passXpTxt: '{x} / {n} жетонов до уровня {l}', passMaxTxt: 'Максимальный уровень!', passBuy: 'Золотой пасс · {p}', passOwned: 'Золотой пасс активен ✓', passNoCoins: 'Не хватает монет: нужно {p}', passBought: 'Золотой пасс открыт!', passClaim: 'Забрать', passRunXp: 'Cabbit Pass: +{x} жетонов', passLvlUp: 'Новый уровень пасса: {l}!', passQuestsTitle: 'Задания на сегодня', questDone: 'Задание выполнено! +{x} жетонов', qRuns3: 'Сыграй 3 забега', qRuns5: 'Сыграй 5 забегов', qScore: 'Набери {n} очков за забег', qCoins: 'Собери {n} монет', passTitleReward: 'Титул «Cabbit Pass»', coinsWord: 'монет', trophiesTitle: 'Кубки', trophyInfoTxt: 'Забег от 20% цели приносит кубки, отнять их нельзя. Цель забега сейчас — <b>{t}</b> очков: чем выше прыгнешь относительно цели, тем больше кубков. Чем больше кубков, тем выше цель.', trophyRowX2: '×2 цели и больше', trophyRowX15: '×1.5 цели', trophyRowX12: '×1.2 цели', trophyRowX1: 'цель', trophyRowX08: '80% цели', trophyRowX06: '60% цели', trophyRowX04: '40% цели', trophyRowX02: '20% цели', trophyRowX0: 'меньше',
    retry: 'Повторить', toMenu: 'В меню', scoreWord: 'рекорд',
    cloudTitle: 'Онлайн-профиль', cloudCopy: 'Копировать', cloudRestore: 'Восстановить',
    cloudEnterCode: 'КОД', cloudTop: 'Рейтинг игроков', searchLabel: 'Найти игрока', searchPlaceholder: 'Ник или код', searchBtn: 'Найти', searchNone: 'Никого не нашли', cloudRefresh: 'Обновить рейтинг',
    cloudCopied: 'Код скопирован', cloudRestored: 'Прогресс восстановлен!',
    pwLabel: 'Пароль аккаунта', pwNewPh: 'Новый пароль', pwPh: 'Пароль', pwSave: 'Сохранить', restoreLabel: 'Войти в другой аккаунт',
    pwOn: '✓ Пароль установлен — без него в аккаунт не войти, даже зная код', pwOff: '⚠ Пароля нет: любой, кто знает твой код, может зайти в аккаунт и потратить монеты',
    pwShort: 'Пароль должен быть хотя бы из 4 символов', pwSaved: 'Пароль сохранён ✓', pwNeed: 'Этот аккаунт защищён паролем — введи пароль', pwWrong: 'Неверный пароль', pwWait: 'Подожди пару секунд и попробуй снова',
    cloudNotFound: 'Код не найден', accountDeleted: 'Этот аккаунт удалён администрацией. Игра начнётся с нуля.', cloudErr: 'Нет связи с сервером', cloudLoading: 'Загрузка…',
    smashToast: 'СОКРУШИТЕЛЬНЫЙ УДАР!', kickToast: 'ПИНОК!', perfectToast: 'ИДЕАЛЬНО!',
    laserToast: 'ОСТОРОЖНО: ЛАЗЕРЫ!',
    perkRefund: 'Перки обновились — вернули {c} монет', fruitRefund: 'Огненный и Грозовой фрукты убраны — вернули {c} монет', boss0: 'Король Сумерек', boss1: 'Ледяной Колосс', boss2: 'Магмовый Лорд', boss3: 'Токсичный Слизень', boss4: 'Звёздный Пожиратель', bossWarn: 'Приближается босс!', bossesChip: 'Боссы', seasonTitle: 'Сезон {n}', seasonDaysLeft: 'осталось {d} дн.', seasonBestShort: 'рекорд', ev_boss: 'Неделя боссов', ev_pass: 'Неделя пропуска', ev_fruit: 'Фруктовая неделя', evd_boss: 'За победу над боссом вдвое больше монет.', evd_pass: 'Жетонов Cabbit Pass за забег в полтора раза больше.', evd_fruit: 'В забеге может выпасть два фрукта, а боссы дарят по два фрукта.', tabPlayers: 'Игроки', tabClans: 'Кланы', tabMyClan: 'Мой клан', seasonMyBadges: 'Твои прошлые сезоны', seasonShort: 'Сезон {n}', seasonNoPlayers: 'В этом сезоне ещё никто не сыграл. Стань первым!', seasonRewardsTitle: 'Монеты в конце сезона', seasonTopN: 'Топ-{n}', seasonRewardToast: 'Сезон {s} закончен! Твоё место: {r}. Награда: {c} монет', seasonNoRank: 'вне топ-100', clanNoneYet: 'Кланов пока нет. Создай первый во вкладке «Мой клан»!', clanMembersN: 'участников: {n}', clanPoints: 'очков сезона: {n}', clanCodeLbl: 'Код клана:', clanCopy: 'Копировать', clanCopied: 'Скопировано', clanDisband: 'Распустить клан', clanLeave: 'Выйти из клана', clanLeaveSure: 'Точно? Нажми ещё раз', clanJoin: 'Вступить', clanCreateTitle: 'Создать свой клан', clanNamePh: 'Название клана', clanCreateBtn: 'Создать · {p}', clanJoinTitle: 'Вступить по коду', clanCodePh: 'Код клана', clanJoinHint: 'Код клана — это код игрока, который его создал. Спроси его у лидера или найди клан во вкладке «Кланы».', clanErrName: 'Название — от 3 до 16 символов', clanErrAlready: 'Ты уже в клане', clanErrCoins: 'Нужно {p} монет', clanErrCode: 'Введи код клана', clanErrNotFound: 'Клан с таким кодом не найден', clanErrFull: 'В клане уже {n} игроков, мест нет', clanErrNet: 'Нет связи, попробуй ещё раз', clanDisbanded: 'Лидер распустил твой клан. Можно вступить в другой или создать свой.', bestiaryTitle: 'Бестиарий', bestiarySub: 'Побеждено {a} из {b} · всего побед: {n}', bossWins: 'Побед: {n}', bossUnknown: 'Ещё не встречен · прилетает на {s} очков', bestiaryHint: 'Босс прилетает в конце каждого мира. Лови золотые звёзды — они бьют босса, и уворачивайся от его снарядов. За победу — монеты и фрукт.', bestChip: 'Рекорд', overPoints: 'очков', overWorld: 'Мир', overCoinsTile: 'Монеты', worldLabel: 'МИР {n}', bossIncoming: 'БОСС: {b}!', bossDown: 'БОСС ПОВЕРЖЕН!', bossFled: 'Босс улетел…', bossTime: 'Босс улетит через {s}', bossHint: 'Лови золотые звёзды — они бьют босса. Уворачивайся от его снарядов!', wheelSpinN: '×{n} · {p}', wheelSkipOff: 'Анимация: вкл', wheelSkipOn: 'Анимация: пропуск', wheelSkipNow: 'Пропустить', closedTitle: 'Скоро открытие!', closedText: 'Cabbit Jump! возвращается с самым большим обновлением: боссы, новая графика, сезоны и кланы. Все ваши рекорды, монеты и покупки на месте.', closedTimerLbl: 'До открытия', closedBye: 'Сегодня в 15:15 по Москве', welcomeKicker: 'Игра открыта', welcome1: 'Боссы в конце каждого мира', welcome2: 'Новая графика пяти миров', welcome3: 'Сезон 1 и свои кланы', welcome4: 'Бестиарий и новые фрукты', welcomeNote: 'Все ваши рекорды, монеты и покупки на месте.', welcomeBtn: 'Играть', dailyNeedNet: 'Нужен интернет, чтобы забрать награду', glassToast: 'СТЕКЛО СПАСЛО ТЕБЯ!', tapPrompt: 'ЖМИ!',
    items: {
      'hat:none':      { n: 'Без шляпы',        d: '' },
      'hat:tophat':     { n: 'Цилиндр',          d: 'Просто стильно.' },
      'hat:cowboy':     { n: 'Ковбойская',       d: 'Просто стильно.' },
      'hat:propeller':  { n: 'Вертолётик',       d: 'Снижает гравитацию: падение и прыжки становятся мягче.' },
      'hat:glass':      { n: 'Блок стекла',      d: 'Спасает от одного смертельного падения, потом разбивается.' },
      'hat:bow':          { n: 'Бантик',            d: 'Просто мило.' },
      'hat:flowercrown':  { n: 'Венок из цветов',    d: 'Просто мило.' },
      'hat:sunhat':       { n: 'Соломенная шляпка',  d: 'Просто мило.' },
      'hat:beanie':       { n: 'Шапка с помпоном',   d: 'Тепло и уютно.' },
      'hat:viking':       { n: 'Шлем викинга',       d: 'С рогами, конечно.' },
      'hat:wizard':       { n: 'Колпак волшебника',  d: 'Звёзды и немного магии.' },
      'hat:chef':         { n: 'Поварской колпак',   d: 'Шеф прыгает.' },
      'hat:pirate':       { n: 'Пиратская треуголка', d: 'Йо-хо-хо!' },
      'hat:headphones':   { n: 'Наушники',           d: 'Прыгай под музыку.' },
      'trail:none':       { n: 'Без следа',          d: '' },
      'trail:sparkle':    { n: 'Искорки',            d: 'Блёстки за спиной.' },
      'trail:bubbles':    { n: 'Пузыри',             d: 'Мыльные пузыри.' },
      'trail:hearts':     { n: 'Сердечки',           d: 'Для влюблённых котокроликов.' },
      'trail:notes':      { n: 'Ноты',               d: 'Музыкальный прыжок.' },
      'trail:fire':       { n: 'Огонь',              d: 'Горячий старт.' },
      'trail:rainbow':    { n: 'Радуга',             d: 'Радужный хвост.' },
      'trail:comet':      { n: 'Комета',             d: 'Награда за 7 дней подряд.' },
      'hat:crown':      { n: 'Корона',            d: 'Каждая монета приносит вдвое больше.' },
      'hat:halo':       { n: 'Нимб',              d: 'Притягивает монеты — они летят к тебе сами.' },
      'acc:none':       { n: 'Ничего',           d: '' },
      'acc:bowtie':     { n: 'Бабочка',          d: 'Просто стильно.' },
      'acc:tie':        { n: 'Деловой галстук',  d: 'Очки за высоту начисляются на 25% быстрее.' },
      'acc:pearls':     { n: 'Жемчужное ожерелье', d: 'Просто мило.' },
      'acc:hearteye':   { n: 'Очки-сердечки',      d: 'Просто мило.' },
      'acc:scarf':      { n: 'Шарфик в горошек',   d: 'Просто мило.' },
      'acc:backpack':   { n: 'Ранец-прыгун',      d: 'Двойной прыжок: тапни по экрану в воздухе.' },
      'tool:none':      { n: 'Пусто',            d: '' },
      'tool:mace':      { n: 'Зачарованная булава', d: 'Падая на монстра сверху — тапни экран: сокрушительный удар выносит в космос.' },
      'tool:bow':       { n: 'Лук охотника',      d: 'На платформах заводятся монстрики. Тапай — стреляй (раз в секунду): +3 монеты за каждого, но не наступай на них.' },
      'char:hero':      { n: 'Котокролик',        d: 'Классический котокролик.' },
      'char:hero2':     { n: 'Котокролик №2',     d: 'Второй котокролик — просто для разнообразия.' },
      'char:hero3':     { n: 'Котокролик №3',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero4':     { n: 'Котокролик №4',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero5':     { n: 'Котокролик №5',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero6':     { n: 'Котокролик №6',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero7':     { n: 'Котокролик №7',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero8':     { n: 'Котокролик №8',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero9':     { n: 'Котокролик №9',     d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero10':    { n: 'Котокролик №10',    d: 'Лимитированный — выдаётся только администрацией.' },
      'char:hero11':    { n: 'Баксик',            d: 'Лимитированный, с анимацией — выдаётся только администрацией.' },
      'char:freehero3': { n: 'Котокролик Free №3', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero4': { n: 'Котокролик Free №4', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero5': { n: 'Котокролик Free №5', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero6': { n: 'Котокролик Free №6', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero7': { n: 'Котокролик Free №7', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero8': { n: 'Котокролик Free №8', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero9': { n: 'Котокролик Free №9', d: 'Обычный котокролик — можно купить за монеты.' },
      'char:freehero10': { n: 'Котокролик Free №10', d: 'Обычный котокролик — можно купить за монеты.' },
      'hat:party':      { n: 'Праздничный колпак', d: 'Подарок на праздник 100 игроков — не продаётся.' },
      'hat:starcrown':  { n: 'Звёздная корона',   d: 'Награда за 10 000 очков — не продаётся.' },
      'perk:multiacc':  { n: 'Второй предмет',    d: 'Можно надеть сразу два в шляпах и в аксессуарах. Работает всегда, если куплен.' },
      'perk:springs':   { n: 'Пружинки',          d: 'Пружины на платформах попадаются в два раза чаще.' },
      'perk:legs':      { n: 'Пружинистые лапы',  d: 'Обычные прыжки на 12% выше.' },
      'perk:dodger':    { n: 'Ловкач',            d: 'Зона идеального удара по монстру в два раза шире.' },
      'perk:passboost': { n: 'Ускоритель пасса',  d: '+50% жетонов Cabbit Pass за каждый забег.' },
      'tool:spear':     { n: 'Копьё',             d: 'Кнопка копья — мощный рывок вверх. Перезарядка 6 секунд.' },
      'hat:none': { n: 'Ничего', d: '' }, 'acc:none': { n: 'Ничего', d: '' },
      'tool:none': { n: 'Ничего', d: '' }, 'perk:none': { n: 'Ничего', d: '' }
    }
  },
  en: {
    best: 'Best score', settings: 'Settings', play: 'Play',
    cont: 'Continue', back: 'Back', language: 'Language', motionBlur: 'Motion blur',
    gfxLabel: 'Graphics', gfx_auto: 'Auto', gfx_high: 'Pretty', gfx_low: 'Fast', gfx_ultra: 'Ultra',
    expBadge: 'experimental',
    gfxUltraNote: 'Experimental feature: 3D-looking platforms and shadows. May lag on weak phones.', worldLightLabel: 'Worlds', wl_dark: 'Normal', wl_light: 'Light',
    catMain: 'General', catGfx: 'Graphics', catProfile: 'Profile', catSound: 'Sound', catOnline: 'Online', catCommunity: 'Community', fruitsBtn: 'Fruits', fruitsTitle: 'Fruits', wheelTitle: 'Wheel', fruitInvTitle: 'Fruits & powers', fruitHint: 'Catch fruits during a run or win them on the wheel. Eat a fruit to get its power. Eating another one replaces it. Trade fruits with friends: the ⇄ button in chat.', fr_spring: 'Spring Fruit', fr_flame: 'Flame Fruit', fr_ice: 'Ice Fruit', fr_storm: 'Storm Fruit', fr_portal: 'Portal Fruit', fr_star: 'Star Fruit', fr_cloud: 'Cloud Fruit', fr_magnet: 'Magnet Fruit', frd_cloud: 'You fall almost twice as slowly: far platforms are easy to reach.', frd_magnet: 'Coins fly to you even from far away.', fruitEatenTag: 'Eaten', fruitWhere: 'Drops from the wheel and during runs', frd_spring: 'Springs on every second platform: higher jumps.', starShower: 'Star shower!', fruitActive: 'Power: {f}', frd_flame: 'Monsters burn on touch — no countdown, you still bounce and get coins.', frd_ice: 'Moving platforms freeze, blinking ones never vanish, monsters crawl.', frd_storm: 'Every 6 seconds lightning hits the nearest monster: +coins.', frd_portal: 'Teleports from the very start and 6 times more often.', frd_star: 'Every 1000 points a trail of 14 coins appears above you. +50% Cabbit Pass tokens.', rar1: 'Common', rar2: 'Rare', rar3: 'Epic', rar4: 'Legendary', fruitEatenNow: 'Eaten now', fruitNone: 'You have not eaten a fruit yet. Catch one in a run or win one on the wheel!', fruitEat: 'Eat', fruitReplace: 'Eat {new}? The "{old}" power will be lost.', fruitAte: 'You ate: {f}!', fruitGot: 'New fruit: {f}!', wheelSpin: 'Spin · {p}', wheelWon: 'You got:', wheelOdds: 'Odds:', tradeTitle: 'Fruit trade', tradeGiveLabel: 'You give', tradeWantLabel: 'You want', tradeSend: 'Offer', tradeNoFruits: 'You have no fruits to trade yet.', tradeSame: 'You cannot trade a fruit for the same one.', tradeYouGive: 'you give', tradeYouGet: 'you get', tradeTheyGive: 'gives you', tradeTheyWant: 'wants back', tradeAccept: 'Accept', tradeDecline: 'Decline', tradeCancel: 'Cancel', tradeWaiting: 'Waiting for your friend…', tradeStDone: 'Trade done ✓', tradeStNo: 'Declined', tradeStCancel: 'Cancelled', tradeNeedFruit: 'You need {f} for this trade', tradeClosed: 'This trade is already closed', tradeCancelled: 'Trade cancelled, fruit returned', tradeDoneYou: 'Trade! You got: {f}', tradeDoneThem: 'Your friend accepted! You got: {f}', tradeDeclined: 'Trade did not happen, {f} returned', msgTrade: '⇄ Fruit trade',
    settingsSave: '✓ Save', settingsSaved: 'Saved ✓',
    gfxAutoLowNote: '(lag detected — fast mode on)',
    pauseMenu: 'Menu',
    bgColorLabel: 'Background color', platformColorLabel: 'Platform color',
    profileCoinsLabel: 'coins', avatarLabel: 'Avatar', pauseLabel: 'Paused', avatarUpload: 'Photo from gallery', avatarRemove: 'Remove photo',
    frameLabel: 'Avatar frame',
    frame_none: 'No frame', frame_gold: 'Golden Glow', frame_neon: 'Neon', frame_rainbow: 'Rainbow',
    frame_fire: 'Blaze', frame_frost: 'Frost', frame_orbit: 'Star Orbit', frame_ears: 'Cabbit Ears',
    frame_crown: 'Crown', frame_hearts: 'Hearts',
    musicLabel: 'Music', musicVolumeLabel: 'Music volume', sfxVolumeLabel: 'Sound volume', musicTrackLabel: 'Song', musicTrackDefault: 'Default', creditTitle: 'Cabbit creator', creditText: 'The cabbit, a bunny with a cat face, was created by the Instagram artist koty_vezde. Thank you for the cabbits: without them this game would not exist!', vibroLabel: 'Vibration',
    profileCommentsLabel: 'Comments', profileCommentPlaceholder: 'Leave a comment...',
    profileCommentSend: 'Send', profileCommentEmpty: 'No comments yet',
    profileCommentSending: 'Sending...', profileCommentError: 'Failed to load',
    profileCommentTooLong: 'Too long (max 140)', profileCommentNeedNick: 'Set a nickname in settings',
    chatWriteBtn: 'Message', chatPlaceholder: 'Write a message...', chatSend: 'Send',
    chatEmpty: 'No messages yet', chatSending: 'Sending...', chatError: 'Failed to send',
    chatTooLong: 'Too long (max 200)', chatNeedNick: 'Set a nickname in settings',
    inboxTitle: 'Messages', inboxEmpty: 'No friends yet. Find a player in the leaderboard or search, open their profile and tap “Add friend”.', addFriend: 'Add friend', reqSent: 'Request sent · cancel', acceptFriend: 'Accept request', removeFriend: 'Remove friend', friendReqs: 'Friend requests', dialogsTitle: 'Chats', friendReqToast: 'Friend request from ', friendReqNotify: 'wants to be your friend', friendsNow: 'You are friends now — say hi!', friendAdded: 'You are friends now!', chatNotFriends: 'You can only chat with friends', chatReqIncoming: '{nick} wants to be your friend', chatReqOutgoing: 'Request sent. Waiting for {nick} to accept', friendReqLimit: 'Too many requests, wait a bit',
    chatOnlineNow: 'online', chatYou: 'You: ', newMsgToast: 'New message from ',
    msgSticker: '[Sticker]', msgPhoto: '[Photo]', photoTap: 'Photo hidden — tap to view', photoLoading: 'Loading photo…',
    photoRemoved: 'Photo removed by a moderator', photoReport: 'Report', photoReported: 'Report sent ✓', photoBanned: 'You are not allowed to send photos',
    photoTooBig: 'Could not compress the photo, try another one', photoSending: 'Sending photo…', replyYou: 'You', replyAction: 'Reply', replyGone: 'Message not found', msgCopy: 'Copy', msgCopied: 'Copied', msgPin: 'Pin', msgUnpin: 'Unpin', msgEdit: 'Edit', msgEditing: 'Editing', msgEditedMark: 'edited', msgDelete: 'Delete', msgDeleteSure: 'Delete for sure?', msgDeleted: 'Message deleted', pinnedTitle: 'Pinned message', typingNow: 'typing…', chatThemeTitle: 'Chat theme', th_classic: 'Cabbit', th_tg: 'Telegram', th_mint: 'Mint', th_sunset: 'Sunset', th_ocean: 'Ocean', th_light: 'Light',
    onlineNow: 'online', onlineTotal: 'total', onlineErr: 'no connection',
    eventProgress: 'Players: {n} / {g} — a party at {g}!', eventLiveTitle: '★ We are 100! ★', eventLiveText: 'Party: coins ×2', eventDaysLeft: '{n} days left',
    eventGift: 'We are 100! 7-day gift: party hat and crown + 500 coins',
    notifyLabel: 'Message notifications', notifyOnTxt: 'Notifications: on', notifyOffTxt: 'Notifications: off',
    notifyDenied: 'Notifications are blocked in browser settings — allow them for the game site', notifyUnsupported: 'This browser or app does not support notifications',
    notifyHint: 'Arrive while the game is open or minimized', notifyTitle: 'New message',
    spamFast: 'Not so fast — wait a second', spamMany: 'Too many messages, take a short break', spamRepeat: 'Do not repeat the same thing', spamLink: 'Links are not allowed',
    blockBtn: 'Block', unblockBtn: 'Unblock', blockedNote: 'You blocked this player. Their messages are hidden.',
    avatarPendingNote: 'Photo is being checked — until approved, others see 🐰', avatarRejected: 'Your avatar photo did not pass the check',
    dayToday: 'Today', dayYesterday: 'Yesterday',
    adminChoiceProfile: 'Profile', adminChoicePanel: 'Admin panel', adminChoiceCancel: 'Cancel',
    linkChoiceOpen: 'Open', linkChoiceCopy: 'Copy link', linkCopied: 'Link copied',
    linkCopyFailed: 'Could not copy',
    on: 'on', off: 'off',
    hint: 'Arrow keys or A / D, on phone use the buttons below. Tap the screen to fire the bow or double jump. Met a monster? Tap when the marker is in the yellow center zone for a perfect hit!',
    slotHat: 'Headwear', slotAcc: 'Accessories', slotTool: 'Tool', slotPerk: 'Slots',
    notEnough: 'Need', coinsWord: 'more coins', buyFor: 'Buy for', revert: 'Remove',
    limitedTag: 'Limited', notForSale: 'not for sale',
    buyAll: 'Buy all', allBought: 'All bought', willSpend: 'You will spend',
    nickTitle: 'What is your name?', nickPlaceholder: 'Cabbit nickname', nickConfirm: 'Done',
    nickLabel: 'Nickname', changeNickBtn: 'Change',
    rotateMsg: 'Please rotate your phone back to portrait',
    leaderboard: 'Leaderboard', empty: '—', wardrobe: 'Wardrobe',
    overTitleNormal: 'The cabbit has landed', overTitleRecord: 'New record',
    overCoins: 'coins collected', overRecordLabel: 'Best', overNewBest: 'new personal best', overRank: 'leaderboard place', overTop1: 'you are #1 on the leaderboard!', passFree: 'Free', passGold: 'Gold', howToLabel: 'How to play', howToOk: 'Got it!', dailyTitle: 'Daily reward', dailySub: 'Come back every day — rewards grow. Miss a day and you start over.', dailyDay: 'Day {d}', dailyClaim: 'Claim', dailyTomorrow: 'Come back tomorrow!', dailyGot: 'Reward received: {r}', slotTrail: 'Trails', styleLabel: 'Game style', st_classic: 'Cabbit', st_aero: 'Frutiger Aero', st_neon: 'Neon', st_paper: 'Notebook', trophyGoal: 'target', passSeasonTxt: 'Season {s} · {d} days left', passXpTxt: '{x} / {n} tokens to level {l}', passMaxTxt: 'Max level!', passBuy: 'Gold pass · {p}', passOwned: 'Gold pass active ✓', passNoCoins: 'Not enough coins: need {p}', passBought: 'Gold pass unlocked!', passClaim: 'Claim', passRunXp: 'Cabbit Pass: +{x} tokens', passLvlUp: 'Pass level up: {l}!', passQuestsTitle: 'Today\'s quests', questDone: 'Quest done! +{x} tokens', qRuns3: 'Play 3 runs', qRuns5: 'Play 5 runs', qScore: 'Score {n} in one run', qCoins: 'Collect {n} coins', passTitleReward: '“Cabbit Pass” title', coinsWord: 'coins', trophiesTitle: 'Trophies', trophyInfoTxt: 'A run of at least 20% of the target gives trophies, they can never be lost. Your run target is now <b>{t}</b> points: the higher you jump compared to it, the more trophies you get. More trophies means a higher target.', trophyRowX2: '×2 target or more', trophyRowX15: '×1.5 target', trophyRowX12: '×1.2 target', trophyRowX1: 'target', trophyRowX08: '80% of target', trophyRowX06: '60% of target', trophyRowX04: '40% of target', trophyRowX02: '20% of target', trophyRowX0: 'less',
    retry: 'Retry', toMenu: 'Menu', scoreWord: 'best',
    cloudTitle: 'Online profile', cloudCopy: 'Copy', cloudRestore: 'Restore',
    cloudEnterCode: 'CODE', cloudTop: 'Leaderboard', searchLabel: 'Find a player', searchPlaceholder: 'Nickname or code', searchBtn: 'Find', searchNone: 'Nobody found', cloudRefresh: 'Refresh ranking',
    cloudCopied: 'Code copied', cloudRestored: 'Progress restored!',
    pwLabel: 'Account password', pwNewPh: 'New password', pwPh: 'Password', pwSave: 'Save', restoreLabel: 'Log into another account',
    pwOn: '✓ Password set — nobody can log in with just your code', pwOff: '⚠ No password: anyone who knows your code can log in and spend your coins',
    pwShort: 'Password must be at least 4 characters', pwSaved: 'Password saved ✓', pwNeed: 'This account is protected — enter the password', pwWrong: 'Wrong password', pwWait: 'Wait a couple of seconds and try again',
    cloudNotFound: 'Code not found', accountDeleted: 'This account was deleted by the administration. The game will start from scratch.', cloudErr: 'Could not reach the server', cloudLoading: 'Loading…',
    smashToast: 'MACE SMASH!', kickToast: 'KICKED!', perfectToast: 'PERFECT!',
    laserToast: 'WATCH OUT: LASERS!',
    perkRefund: 'Perks changed — {c} coins refunded', fruitRefund: 'Flame and Storm fruits were removed — {c} coins refunded', boss0: 'Twilight King', boss1: 'Frost Colossus', boss2: 'Magma Lord', boss3: 'Toxic Slime', boss4: 'Star Devourer', bossWarn: 'A boss is coming!', bossesChip: 'Bosses', seasonTitle: 'Season {n}', seasonDaysLeft: '{d} days left', seasonBestShort: 'best', ev_boss: 'Boss week', ev_pass: 'Pass week', ev_fruit: 'Fruit week', evd_boss: 'Beating a boss gives double coins.', evd_pass: '1.5x Cabbit Pass tokens per run.', evd_fruit: 'Up to two fruits per run, and bosses give two fruits.', tabPlayers: 'Players', tabClans: 'Clans', tabMyClan: 'My clan', seasonMyBadges: 'Your past seasons', seasonShort: 'Season {n}', seasonNoPlayers: 'Nobody has played this season yet. Be the first!', seasonRewardsTitle: 'Coins at the end of the season', seasonTopN: 'Top {n}', seasonRewardToast: 'Season {s} is over! Your place: {r}. Reward: {c} coins', seasonNoRank: 'outside top 100', clanNoneYet: 'No clans yet. Create the first one in the My clan tab!', clanMembersN: 'members: {n}', clanPoints: 'season points: {n}', clanCodeLbl: 'Clan code:', clanCopy: 'Copy', clanCopied: 'Copied', clanDisband: 'Disband clan', clanLeave: 'Leave clan', clanLeaveSure: 'Sure? Tap again', clanJoin: 'Join', clanCreateTitle: 'Create your clan', clanNamePh: 'Clan name', clanCreateBtn: 'Create · {p}', clanJoinTitle: 'Join by code', clanCodePh: 'Clan code', clanJoinHint: 'The clan code is the player code of its creator. Ask the leader or find a clan in the Clans tab.', clanErrName: 'Name must be 3 to 16 characters', clanErrAlready: 'You are already in a clan', clanErrCoins: 'You need {p} coins', clanErrCode: 'Enter a clan code', clanErrNotFound: 'No clan with this code', clanErrFull: 'The clan already has {n} players', clanErrNet: 'No connection, try again', clanDisbanded: 'The leader disbanded your clan. Join another or create your own.', bestiaryTitle: 'Bestiary', bestiarySub: 'Beaten {a} of {b} · total wins: {n}', bossWins: 'Wins: {n}', bossUnknown: 'Not met yet · arrives at {s} points', bestiaryHint: 'A boss arrives at the end of every world. Catch the golden stars to hit it and dodge its shots. Beat it for coins and a fruit.', bestChip: 'Best', overPoints: 'points', overWorld: 'World', overCoinsTile: 'Coins', worldLabel: 'WORLD {n}', bossIncoming: 'BOSS: {b}!', bossDown: 'BOSS DEFEATED!', bossFled: 'The boss flew away…', bossTime: 'The boss leaves in {s}', bossHint: 'Catch the golden stars — they hit the boss. Dodge its shots!', wheelSpinN: '×{n} · {p}', wheelSkipOff: 'Animation: on', wheelSkipOn: 'Animation: skip', wheelSkipNow: 'Skip', closedTitle: 'Opening soon!', closedText: 'Cabbit Jump! is coming back with its biggest update: bosses, new graphics, seasons and clans. All your records, coins and purchases are safe.', closedTimerLbl: 'Opens in', closedBye: 'Today at 12:15 UTC', welcomeKicker: 'The game is open', welcome1: 'Bosses at the end of every world', welcome2: 'New graphics for all five worlds', welcome3: 'Season 1 and your own clans', welcome4: 'Bestiary and new fruits', welcomeNote: 'All your records, coins and purchases are safe.', welcomeBtn: 'Play', dailyNeedNet: 'You need internet to claim the reward', glassToast: 'THE GLASS SAVED YOU!', tapPrompt: 'TAP!',
    items: {
      'hat:none':      { n: 'No hat',           d: '' },
      'hat:tophat':     { n: 'Top Hat',          d: 'Just stylish.' },
      'hat:cowboy':     { n: 'Cowboy Hat',       d: 'Just stylish.' },
      'hat:propeller':  { n: 'Propeller Cap',    d: 'Lowers gravity: softer falls and jumps.' },
      'hat:glass':      { n: 'Glass Block',      d: 'Saves you from one fatal fall, then shatters.' },
      'hat:bow':          { n: 'Bow',               d: 'Just cute.' },
      'hat:flowercrown':  { n: 'Flower Crown',      d: 'Just cute.' },
      'hat:sunhat':       { n: 'Sun Hat',           d: 'Just cute.' },
      'hat:beanie':       { n: 'Pompom Beanie',     d: 'Warm and cozy.' },
      'hat:viking':       { n: 'Viking Helmet',     d: 'With horns, of course.' },
      'hat:wizard':       { n: 'Wizard Hat',        d: 'Stars and a bit of magic.' },
      'hat:chef':         { n: 'Chef Hat',          d: 'The chef jumps.' },
      'hat:pirate':       { n: 'Pirate Hat',        d: 'Yo-ho-ho!' },
      'hat:headphones':   { n: 'Headphones',        d: 'Jump to the beat.' },
      'trail:none':       { n: 'No trail',          d: '' },
      'trail:sparkle':    { n: 'Sparkles',          d: 'Glitter behind you.' },
      'trail:bubbles':    { n: 'Bubbles',           d: 'Soap bubbles.' },
      'trail:hearts':     { n: 'Hearts',            d: 'For cabbits in love.' },
      'trail:notes':      { n: 'Notes',             d: 'A musical jump.' },
      'trail:fire':       { n: 'Fire',              d: 'A hot start.' },
      'trail:rainbow':    { n: 'Rainbow',           d: 'A rainbow tail.' },
      'trail:comet':      { n: 'Comet',             d: 'Reward for 7 days in a row.' },
      'hat:crown':      { n: 'Crown',             d: 'Every coin is worth double.' },
      'hat:halo':       { n: 'Halo',              d: 'Magnet: coins fly straight to you.' },
      'acc:none':       { n: 'Nothing',          d: '' },
      'acc:bowtie':     { n: 'Bowtie',           d: 'Just stylish.' },
      'acc:tie':        { n: 'Business Tie',     d: 'Height score gained 25% faster.' },
      'acc:pearls':     { n: 'Pearl Necklace',     d: 'Just cute.' },
      'acc:hearteye':   { n: 'Heart Glasses',      d: 'Just cute.' },
      'acc:scarf':      { n: 'Polka-dot Scarf',    d: 'Just cute.' },
      'acc:backpack':   { n: 'Jump Pack',         d: 'Double jump: tap the screen in mid-air.' },
      'tool:none':      { n: 'Empty',            d: '' },
      'tool:mace':      { n: 'Enchanted Mace',   d: 'Falling onto a monster — tap the screen for a smash that launches you into space.' },
      'tool:bow':       { n: "Hunter's Bow",      d: 'Critters appear on platforms. Tap to shoot (once a second): +3 coins each — but never land on one.' },
      'char:hero':      { n: 'Cabbit',            d: 'The classic cat-rabbit.' },
      'char:hero2':     { n: 'Cabbit #2',         d: 'A second cat-rabbit — just for variety.' },
      'char:hero3':     { n: 'Cabbit #3',         d: 'Limited — granted by the admin only.' },
      'char:hero4':     { n: 'Cabbit #4',         d: 'Limited — granted by the admin only.' },
      'char:hero5':     { n: 'Cabbit #5',         d: 'Limited — granted by the admin only.' },
      'char:hero6':     { n: 'Cabbit #6',         d: 'Limited — granted by the admin only.' },
      'char:hero7':     { n: 'Cabbit #7',         d: 'Limited — granted by the admin only.' },
      'char:hero8':     { n: 'Cabbit #8',         d: 'Limited — granted by the admin only.' },
      'char:hero9':     { n: 'Cabbit #9',         d: 'Limited — granted by the admin only.' },
      'char:hero10':    { n: 'Cabbit #10',        d: 'Limited — granted by the admin only.' },
      'char:hero11':    { n: 'Baksik',            d: 'Limited, animated — granted by the admin only.' },
      'char:freehero3': { n: 'Cabbit Free #3', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero4': { n: 'Cabbit Free #4', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero5': { n: 'Cabbit Free #5', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero6': { n: 'Cabbit Free #6', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero7': { n: 'Cabbit Free #7', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero8': { n: 'Cabbit Free #8', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero9': { n: 'Cabbit Free #9', d: 'A regular cabbit — buy it with coins.' },
      'char:freehero10': { n: 'Cabbit Free #10', d: 'A regular cabbit — buy it with coins.' },
      'hat:party':      { n: 'Party Hat',         d: 'A gift for reaching 100 players — not for sale.' },
      'hat:starcrown':  { n: 'Star Crown',        d: 'A reward for 10,000 points — not for sale.' },
      'perk:multiacc':  { n: 'Second Item',       d: 'Wear two hats and two accessories at once. Always works once bought.' },
      'perk:springs':   { n: 'Springs',           d: 'Springs appear on platforms twice as often.' },
      'perk:legs':      { n: 'Springy Paws',      d: 'Normal jumps are 12% higher.' },
      'perk:dodger':    { n: 'Dodger',            d: 'The perfect-hit zone against monsters is twice as wide.' },
      'perk:passboost': { n: 'Pass Booster',      d: '+50% Cabbit Pass tokens every run.' },
      'tool:spear':     { n: 'Spear',             d: 'Spear button — a powerful upward lunge. 6 second cooldown.' },
      'hat:none': { n: 'None', d: '' }, 'acc:none': { n: 'None', d: '' },
      'tool:none': { n: 'None', d: '' }, 'perk:none': { n: 'None', d: '' }
    }
  }
};
