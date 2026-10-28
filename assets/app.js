/* 小石頭牙醫 · 初始團隊邀請函 — gate, decryption, ceremony */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const wait = ms => new Promise(r => setTimeout(r, ms));
let timers = [];
const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

/* ---------------------------------------------------------------- sound */
/* ------------------------------------------------------------ sound (Web Audio, synthesised — no files) */
const SFX = (() => {
  let ctx = null, out = null, verb = null, on = true, hold = false, nbuf = null;
  try { on = localStorage.getItem('ls-sfx') !== 'off'; } catch(e){}
  function init(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    out = ctx.createGain(); out.gain.value = .8; out.connect(comp); comp.connect(ctx.destination);
    // small hall: generated impulse response
    const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 3.2); }
    verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = .5; verb.connect(vg); vg.connect(out);
    nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = nbuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random()*2 - 1;
  }
  const ok = () => on && !hold && ctx && ctx.state === 'running';
  function bus(vol, wet = .2){ const g = ctx.createGain(); g.gain.value = vol; g.connect(out); if (wet){ const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); } return g; }
  function envGain(dest, t, peak, attack, decay){ const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay); g.connect(dest); return g; }
  function osc(type, f0, f1, t, dur, dest){ const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(dest); o.start(t); o.stop(t + dur + .05); }
  function noise(t, dur, dest, filt){ const s = ctx.createBufferSource(); s.buffer = nbuf; s.playbackRate.value = .9 + Math.random()*.2; let n = s; if (filt){ filt.forEach(f => { n.connect(f); n = f; }); } n.connect(dest); s.start(t, Math.random()*1); s.stop(t + dur + .05); return s; }
  function bp(f, q){ const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; return b; }
  function lp(f){ const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; return b; }
  const T = (d = 0) => ctx.currentTime + d/1000 + .005;
  const api = {
    init, get on(){ return on; },
    toggle(){ on = !on; try { localStorage.setItem('ls-sfx', on ? 'on' : 'off'); } catch(e){} if (on) init(); return on; },
    hold(v){ hold = v; },
    /* 石頭落定：短促的石擊聲 */
    stone(pitch = 1, vol = .55){ if (!ok()) return; const t = T(), b = bus(vol*2.2, .18);
      noise(t, .09, envGain(b, t, .9, .002, .08), [bp(1700*pitch, 1.4)]);
      osc('sine', 220*pitch, 95*pitch, t, .14, envGain(b, t, .8, .003, .14));
      osc('triangle', 1150*pitch, 900*pitch, t, .04, envGain(b, t, .22, .001, .035)); },
    /* 木頭敲擊：拱架 */
    wood(vol = .45){ if (!ok()) return; const t = T(), b = bus(vol*2.2, .15);
      osc('sine', 340, 300, t, .12, envGain(b, t, .9, .002, .12)); noise(t, .05, envGain(b, t, .5, .001, .05), [bp(900, 3)]); },
    /* 重擊：拱心石落下 */
    thud(vol = .9){ if (!ok()) return; const t = T(), b = bus(vol, .38);
      osc('sine', 120, 38, t, .55, envGain(b, t, 1, .004, .7));
      osc('sine', 62, 34, t, .9, envGain(b, t, .7, .01, .9));
      noise(t, .35, envGain(b, t, .7, .002, .3), [lp(520)]);
      noise(t, .06, envGain(b, t, .5, .001, .05), [bp(2200, 1.2)]); },
    /* 鐘聲般的光：揭曉 */
    chime(vol = .35, base = 660){ if (!ok()) return; const t = T(), b = bus(vol*.8, .7);
      [[1, 1], [1.5, .6], [2, .55], [3, .3], [4.2, .18], [5.4, .1]].forEach(([m, a], i) => {
        osc('sine', base*m*(1 + (Math.random() - .5)*.004), base*m, t + i*.012, 3.2, envGain(b, t + i*.012, a, .006, 3)); }); },
    /* 上行琶音：牙齒輪廓、螺旋交會 */
    sparkle(vol = .18, n = 7, gap = 120, base = 880){ if (!ok()) return; const sc = [1, 9/8, 5/4, 3/2, 5/3, 2, 9/4, 5/2, 3];
      for (let i = 0; i < n; i++){ const t = T(i*gap), b = bus(vol, .65); osc('sine', base*sc[i % sc.length], base*sc[i % sc.length], t, 1.6, envGain(b, t, .8 - i*.06, .004, 1.5)); } },
    /* 單音輕敲：節點出現 */
    ping(vol = .16, f = 1320){ if (!ok()) return; const t = T(), b = bus(vol*2.2, .5); osc('sine', f, f, t, 1.1, envGain(b, t, 1, .003, 1)); osc('sine', f*2.01, f*2, t, .5, envGain(b, t, .25, .002, .4)); },
    /* 風聲：移動、拉起、換頁 */
    whoosh(dur = .8, vol = .22, up = true){ if (!ok()) return; const t = T(), b = bus(vol*2, .25); const f = bp(up ? 300 : 2400, 1.1);
      f.frequency.setValueAtTime(up ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 2600 : 260, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + dur*.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(b);
      noise(t, dur, g, [f]); },
    /* 低沉的轟隆：倒塌 */
    rumble(dur = 1.2, vol = .6){ if (!ok()) return; const t = T(), b = bus(vol, .35);
      noise(t, dur, envGain(b, t, 1, .03, dur), [lp(180)]); osc('sine', 52, 36, t, dur, envGain(b, t, .6, .02, dur)); },
    /* 唱片刮擦 */
    scratch(vol = .5){ if (!ok()) return; const t = T(), b = bus(vol*5, .1); const f = bp(2600, 3); f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(240, t + .32);
      noise(t, .34, envGain(b, t, 1, .004, .32), [f]); osc('sawtooth', 900, 120, t, .3, envGain(b, t, .25, .004, .28)); },
    /* 哀傷長號：womp womp womp wommmp */
    trombone(vol = .32){ if (!ok()) return; const notes = [[311, .42], [294, .42], [277, .42], [262, 1.5]];
      let at = 0; notes.forEach(([f, d], i) => { const t = T(at*1000), b = bus(vol, .3); const l = lp(1400); l.connect(b);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.9, t + .05); g.gain.setValueAtTime(.9, t + d - .12); g.gain.exponentialRampToValueAtTime(0.0001, t + d); g.connect(l);
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f*.97, t + d);
        if (i === 3){ const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = 7; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + .3); lfo.stop(t + d); }
        o.connect(g); o.start(t); o.stop(t + d + .05); at += d + .06; }); },
    /* 蓋章 */
    stamp(vol = 1){ if (!ok()) return; const t = T(), b = bus(vol*1.6, .25); osc('sine', 150, 50, t, .25, envGain(b, t, 1, .002, .3)); noise(t, .08, envGain(b, t, .9, .001, .07), [bp(1200, .8)]); },
    tick(vol = .08){ if (!ok()) return; const t = T(), b = bus(vol*4, 0); osc('square', 2600, 2600, t, .012, envGain(b, t, .5, .001, .012)); },
  };
  return api;
})();



/* ---------------------------------------------------------------- the mark */
const D = window.__MARK__;
const byName = Object.fromEntries(D.pieces.map(p => [p.n, p]));
const ORDER = ['springer_L','springer_R','voussoir_low_L','voussoir_low_R','sand_low_L','sand_low_R','voussoir_up_L','voussoir_up_R','sand_up_L','sand_up_R','keystone'];
let uid = 0;
function drawMark(svg){
  const id = 'm' + (++uid);
  const g = (k, a, b, x2, y2) => `<linearGradient id="${id}${k}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const fill = r => `url(#${id}${r === 'key' ? 'K' : r === 'outer' ? 'O' : 'I'})`;
  svg.innerHTML = `<defs>${g('O','#D3DDE4','#8FA3B2',1,1)}${g('I','#F8F3EB','#E6DCCB',0,1)}${g('K','#F3CC6E','#C9952A',0,1)}</defs>` +
    D.pieces.map(p => `<path data-n="${p.n}" d="${p.d}" fill="${fill(p.r)}" style="transform-box:fill-box;transform-origin:50% 50%"/>`).join('');
  const els = {}; $$('path', svg).forEach(e => els[e.dataset.n] = e); return els;
}
function buildMark(svg, delay = 0){
  const els = drawMark(svg), gap = 190;
  ORDER.forEach((n, i) => {
    const p = byName[n], key = n === 'keystone', e = els[n];
    if (key){
      e.animate([{transform:'translateY(-70px)', opacity:0},{transform:'translateY(-70px)', opacity:1, offset:.3},{transform:'translateY(2px)', offset:.85},{transform:'none', opacity:1}], {duration:1300, delay:delay + 10*gap + 300, easing:'cubic-bezier(.6,0,.8,.6)', fill:'both'});
      later(delay + 10*gap + 300 + 1100, () => { SFX.thud(.75); SFX.chime(.3, 523); later(130, () => SFX.chime(.18, 784)); });
    } else {
      e.animate([{transform:`translate(${((p.cx - 110)*.25).toFixed(1)}px,40px) rotate(${p.cx < 110 ? -10 : 10}deg)`, opacity:0},{transform:'none', opacity:1}], {duration:760, delay:delay + i*gap, easing:'cubic-bezier(.16,.84,.3,1)', fill:'both'});
      later(delay + i*gap + 560, () => SFX.stone(.85 + i*.04, .4));
    }
  });
}

/* ---------------------------------------------------------------- gold dust */
function dust(){
  const c = $('#dust'), x = c.getContext('2d'); let W, H, P = [];
  const fit = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener('resize', fit);
  for (let i = 0; i < 70; i++) P.push({x:Math.random(), y:Math.random(), r:Math.random()*1.6 + .4, v:Math.random()*.00025 + .00008, a:Math.random()*Math.PI*2});
  let run = true;
  (function f(){ if (!run) return; x.clearRect(0, 0, W, H);
    P.forEach(p => { p.y -= p.v; p.a += .01; if (p.y < -.02) p.y = 1.02; const al = .25 + .25*Math.sin(p.a);
      x.beginPath(); x.arc(p.x*W + Math.sin(p.a)*6, p.y*H, p.r*devicePixelRatio, 0, 7); x.fillStyle = `rgba(243,204,110,${al})`; x.fill(); });
    requestAnimationFrame(f); })();
  return () => run = false;
}

/* ---------------------------------------------------------------- crypto */
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sha(s){ const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function open(user, pass){
  const rec = window.__VAULT__[await sha('little-stone:' + user.trim().toLowerCase())];
  if (!rec) return null;
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.trim()), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(rec.s), iterations:rec.n, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['decrypt']);
  try { const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(rec.i)}, key, b64(rec.c)); return JSON.parse(new TextDecoder().decode(pt)); }
  catch(e){ return null; }
}

/* ---------------------------------------------------------------- gate */
const stopDust = dust();
drawMark($('.env-letter .mini'));
try { const u = localStorage.getItem('ls-user'); if (u) $('#u').value = u; } catch(e){}
const snd = $('.sound');
const paintSnd = () => snd.classList.toggle('off', !SFX.on);
paintSnd();
snd.addEventListener('click', () => { SFX.toggle(); SFX.init(); paintSnd(); if (SFX.on) SFX.ping(.14, 988); });

$('form.login').addEventListener('submit', async e => {
  e.preventDefault();
  SFX.init();
  const btn = $('.btn-open'), err = $('.err'); btn.disabled = true; err.textContent = '';
  const data = await open($('#u').value, $('#p').value);
  if (!data){
    btn.disabled = false; err.textContent = '帳號或密碼不正確，請再試一次';
    const f = $('form.login'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); SFX.stone(.6, .4); return;
  }
  try { localStorage.setItem('ls-user', $('#u').value.trim().toLowerCase()); } catch(e){}
  ceremony(data);
});

async function ceremony(data){
  $('form.login').classList.add('leave'); $('.g-hint').style.opacity = 0;
  $$('.g-kicker,.g-title,.g-sub').forEach(e => e.animate([{opacity:1},{opacity:0, transform:'translateY(-10px)'}], {duration:1200, delay:3000, fill:'forwards'}));
  SFX.ping(.14, 784);
  const w = $('.welcome'); $('.w2', w).textContent = data.welcome; $('.w3', w).textContent = data.welcomeEn;
  await wait(500);
  w.animate([{opacity:0, transform:'translateY(16px)', filter:'blur(8px)'},{opacity:1, transform:'none', filter:'blur(0)'}], {duration:1400, easing:'cubic-bezier(.2,.7,.2,1)', fill:'forwards'});
  later(0, () => { SFX.chime(.32, 523); later(160, () => SFX.chime(.22, 659)); later(320, () => SFX.sparkle(.1, 7, 150, 784)); });
  await wait(2600);
  w.animate([{opacity:1},{opacity:0}], {duration:900, fill:'forwards'});
  const env = $('.envelope');
  await wait(500);
  env.classList.add('broken'); SFX.stone(.7, .7); later(80, () => SFX.stone(.9, .4));
  await wait(700);
  env.classList.add('open'); SFX.whoosh(.9, .14, false);
  const flap = $('.env-flap', env);
  await flap.animate([{transform:'scaleY(1)'},{transform:'scaleY(0)'}], {duration:420, easing:'cubic-bezier(.5,0,.9,.5)', fill:'forwards'}).finished;
  $('i', flap).style.display = 'none'; $('b', flap).style.display = 'block'; env.classList.add('flipped');
  await flap.animate([{transform:'scaleY(0)'},{transform:'scaleY(-1)'}], {duration:520, easing:'cubic-bezier(.1,.5,.3,1)', fill:'forwards'}).finished;
  await wait(250);
  env.classList.add('rise'); SFX.whoosh(1.3, .16, true);
  await wait(1500);
  $('#gate').classList.add('leave'); SFX.sparkle(.08, 6, 120, 1046);
  render(data);
  await wait(1200);
  $('#gate').classList.add('hidden'); stopDust();
}

/* ---------------------------------------------------------------- letter */
function render(data){
  const L = $('#letter'); L.classList.remove('hidden');
  $('.paper', L).innerHTML = data.html;
  window.scrollTo(0, 0);
  requestAnimationFrame(() => $('.paper', L).classList.add('in'));
  buildMark($('.head svg.mk', L), 900);
  later(300, () => drawMark($('svg.mk2', L)));
  const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; const el = en.target; io.unobserve(el); el.classList.add('on'); onReveal(el); }), {threshold:.25});
  $$('.reveal', L).forEach(el => io.observe(el));
  const k = 'ls-pledge-' + data.id; let done = null; try { done = localStorage.getItem(k); } catch(e){}
  if (done) showStamp(data, done, false);
  $('.btn-pledge', L).addEventListener('click', () => { const d = new Date(); const ds = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    try { localStorage.setItem(k, ds); } catch(e){} showStamp(data, ds, true); });
  $('.again', document).addEventListener('click', () => location.reload());
}
function onReveal(el){
  const t = el.dataset.r;
  if (t === 'done'){ $$('.it', el).forEach((it, i) => { const ck = $('.ck', it); const L = ck.getTotalLength();
      ck.animate([{strokeDasharray:`${L} ${L}`, strokeDashoffset:L},{strokeDasharray:`${L} ${L}`, strokeDashoffset:0}], {duration:600, delay:300 + i*420, easing:'ease-out', fill:'both'});
      it.animate([{opacity:0, transform:'translateX(-12px)'},{opacity:1, transform:'none'}], {duration:600, delay:i*420, fill:'both', easing:'cubic-bezier(.2,.7,.2,1)'});
      later(360 + i*420, () => SFX.ping(.13, [784, 988, 1175][i])); }); }
  else if (t === 'tl'){ const f = $('.fill', el), now = $('.now', el); f.style.height = (now.offsetTop + 8) + 'px';
      $$('.row', el).forEach((r, i) => { r.animate([{opacity:0, transform:'translateX(10px)'},{opacity:1, transform:'none'}], {duration:600, delay:500 + i*220, fill:'both'}); later(500 + i*220, () => SFX.tick(.06)); });
      later(500 + 6*220 + 200, () => SFX.chime(.22, 587)); }
  else if (t === 'fig'){ SFX.whoosh(.9, .08); later(400, () => SFX.ping(.12, 1046)); }
  else if (t === 'cta'){ SFX.ping(.14, 659); later(160, () => SFX.ping(.12, 988)); }
  else SFX.whoosh(.7, .05);
}
function showStamp(data, ds, fresh){
  const box = $('.stampbox'); $('.s2', box).textContent = data.short; $('.s3', box).textContent = ds; box.classList.add('on');
  $('.btn-pledge').classList.add('hidden'); $('.pledge .after').classList.remove('hidden');
  if (fresh){
    $('.stamp', box).animate([{opacity:0, transform:'rotate(-10deg) scale(2.6)'},{opacity:1, transform:'rotate(-10deg) scale(.94)', offset:.75},{opacity:1, transform:'rotate(-10deg) scale(1)'}], {duration:520, easing:'cubic-bezier(.6,0,.9,.4)', fill:'both'});
    later(380, () => { SFX.stamp(); $('.paper').animate([{transform:'none'},{transform:'translate(-4px,3px)'},{transform:'translate(3px,-2px)'},{transform:'none'}], {duration:280}); });
    later(800, () => { SFX.chime(.3, 523); later(150, () => SFX.chime(.2, 784)); later(300, () => SFX.sparkle(.1, 6, 120, 1046)); });
  }
}
})();
