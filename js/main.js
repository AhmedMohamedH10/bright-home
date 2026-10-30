/* =========================================================
   Bright Home — برايت هوم · main.js
   ========================================================= */

/* الإعدادات (رقم واتساب، قاعدة الطلبات، ...) في js/config.js */

(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
/* أجهزة ضعيفة (رام/معالج قليل): بنقلل الطبقات والجسيمات */
/* أي موبايل/تابلت بلمس بيتعامل كجهاز «خفيف» (حتى لو معالجه 8 أنوية — التهنيج بييجي من الرسم مش من المعالج) */
const touchDev = matchMedia('(hover:none) and (pointer:coarse)').matches && Math.min(screen.width, screen.height) < 900;
const lite = touchDev || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
if (lite) document.documentElement.classList.add('lite');
let vw = innerWidth, vh = innerHeight;

/* ---------------------------------------------------------
   Toast
   --------------------------------------------------------- */
const toastEl = $('#toast'); let toastT;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), ms);
}

/* ---------------------------------------------------------
   Text splitting (English letters + scroll-lit statement)
   --------------------------------------------------------- */
const HL = new Set(['لمعانًا', 'ونظافة', 'نعومة', 'يديك', 'رائحة', 'ملابسك']);
(function splitText() {
  const en = $('#hEn');
  if (en) {
    const t = en.textContent; en.textContent = '';
    [...t].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch; s.style.animationDelay = (1 + i * 0.06) + 's';
      en.appendChild(s);
    });
  }
  const st = $('#statement');
  if (st) {
    const words = st.textContent.trim().split(/\s+/); st.textContent = '';
    const brand = words[0] === 'برايت' && words[1] === 'هوم' ? 2 : 0;   /* «برايت هوم» بخط Cairo بولد والباقي عادي */
    words.forEach((w, i) => {
      const s = document.createElement('span'); s.className = (i < brand ? 'w br' : 'w') + (HL.has(w.replace(/[،,.]/g, '')) ? ' hl' : ''); s.textContent = w;
      st.appendChild(s); if (i < words.length - 1) st.appendChild(document.createTextNode(' '));
    });
  }
})();

/* ---------------------------------------------------------
   Reveal on scroll
   --------------------------------------------------------- */
{
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

/* ---------------------------------------------------------
   Header, progress bar, cursor glow, nav highlight
   --------------------------------------------------------- */
const header = $('#header'), progBar = $('.progress i'), glow = $('.cursor-glow'), mCta = $('.mobile-cta');
if (finePointer && glow) {
  let gx = 0, gy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
  (function loop() { gx = lerp(gx, tx, .12); gy = lerp(gy, ty, .12); glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(loop); })();
}
const navLinks = $$('.nav a');
{
  const secs = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean).concat($$('[data-nav]'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + (e.target.dataset.nav || e.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => io.observe(s));
}
const orderSec = $('#order'), scTrackEls = $$('.scent-track');
/* قياسات متخزنة: قراءة getBoundingClientRect / scrollHeight في كل فريم كانت بتجبر المتصفح يحسب التخطيط من أول وجديد = تهنيج */
let maxScroll = 0, orderPassed = false, lastStuck = null, lastProg = -1, lastCta = null;
const inScent = new Set();
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => es.forEach(e => { orderPassed = e.isIntersecting || e.boundingClientRect.top < 0; ticking = true; }), { rootMargin: '0px 0px -40% 0px' }).observe(orderSec);
  const ioSc = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? inScent.add(e.target) : inScent.delete(e.target); ticking = true; }), { rootMargin: '-49% 0px -49% 0px' });
  scTrackEls.forEach(t => ioSc.observe(t));
}
function chrome() {
  const y = scrollY;
  const st = y > 40; if (st !== lastStuck) { lastStuck = st; header.classList.toggle('stuck', st); }
  const p = maxScroll > 0 ? Math.round(clamp(y / maxScroll) * 1000) / 1000 : 0;
  if (p !== lastProg) { lastProg = p; progBar.style.transform = `scaleX(${p})`; }
  if (mCta) {
    const on = y > 120 && !orderPassed && !inScent.size;
    if (on !== lastCta) { lastCta = on; mCta.classList.toggle('on', on); }
  }
}

/* =========================================================
   HERO — scaled kitchen scene + scroll-driven washer + dive
   ========================================================= */
const hero = $('#home'), pin = $('#heroPin'), cam = $('#cam'), scene = $('#scene');
const drum = $('#wDrum'), clothes = $('#wClothes'), water = $('#wWater'), foam = $('#wFoam');
const knob = $('#wKnob'), timeEl = $('#wTime'), modeEl = $('#wMode'), washer = $('#washer'), glass = $('#wGlass');
const titleEl = $('#heroTitle'), actionsEl = $('#heroActions'), hintEl = $('#heroHint'), diveEl = $('#dive'), meter = $('#heroMeter');
const vig = $('.hero-vignette');
const cls = $$('.dsh', clothes);
let sc = { s: 1, tx: 0, ty: 0, portrait: false }, door = { x: 0, y: 0, r: 100 };

function fitScene() {
  vw = innerWidth; vh = innerHeight;
  const ph = pin.clientHeight || vh;            /* ارتفاع ثابت (100svh) — مفيش قفزة لما شريط المتصفح يختفي */
  const portrait = vw / ph < .85;
  scene.classList.toggle('p', portrait);
  const W = portrait ? 900 : 1600, H = portrait ? 1500 : 900;
  let s, bottomPad = 0;
  if (portrait) { s = vw / W; bottomPad = vw < 700 ? 74 : 40; }
  else { bottomPad = clamp(ph * .09, 56, 96); s = Math.min(vw / 1580, (ph - bottomPad) / 900); }
  const tx = (vw - W * s) / 2, ty = ph - H * s - bottomPad;
  /* title sizing: fill the wall above the washer */
  const wTop = portrait ? 820 : 318, avail = ty + wTop * s - 92;
  const ar = Math.max(40, Math.min(avail * .56, (vw - 36) / 5.5, 190));
  pin.style.setProperty('--t-top', (vw < 700 ? 74 : 88) + 'px');
  pin.style.setProperty('--t-ar', ar + 'px'); pin.style.setProperty('--t-en', Math.max(15, ar * .27) + 'px');
  sc = { s, tx, ty, portrait };
  scene.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  cam.style.transform = 'none';
  const r = glass.getBoundingClientRect(), pr = pin.getBoundingClientRect();
  door = { x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height / 2, r: r.width / 2 };
  measure();
}

let heroTarget = 0, heroP = 0;          /* px اللي اتسكرلت جوه الهيرو */
let heroTop = 0, heroH = 0;
function measure() {
  const r = hero.getBoundingClientRect();
  heroTop = r.top + scrollY; heroH = r.height;
  maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
}
const heroSpan = () => vh * .85;        /* المسافة اللي الغسالة بتخلّص فيها دورتها (عدّاد/مية) */
const heroBox = { top: 0, bottom: 0 };
function heroProgress() {
  /* من غير قراءة تخطيط: الهيرو أول قسم وارتفاعه ثابت (100svh) فبنحسب من scrollY */
  const y = scrollY;
  heroTarget = clamp(y - heroTop, 0, Math.max(0, heroH));
  heroBox.top = heroTop - y; heroBox.bottom = heroTop + heroH - y;
  return heroBox;
}
const modes = [[.15, 'FILL'], [.45, 'WASH'], [.65, 'RINSE'], [.88, 'DRY'], [2, 'END']];
/* كل كتابة في الستايل هنا بقت بتحصل بس لما القيمة تتغير فعلًا (كانت بتتكتب كل فريم) */
let lastHP = -1, lastWsh = -1, lastDrum = '', lastWater = '', lastFoam = -1, lastTime = '', lastMode = '', lastKnob = '', lastHint = null, lastMeter = '';
function updateHero(time) {
  if (heroP === lastHP) return;      /* مفيش حركة سكرول = مفيش شغل */
  lastHP = heroP;
  const ps = clamp(heroP / heroSpan()), t = ps;

  /* دراع الرش بيلف (من الأمام بيبان بيتمدد ويضيق) والأطباق بترتعش خفيف وقت الغسيل */
  const ang = heroP * 1.7;
  const dr = `scaleX(${Math.cos(ang / 26).toFixed(2)})`;
  if (dr !== lastDrum) { lastDrum = dr; drum.style.transform = dr; }
  const wsh = reduce ? 0 : clamp((t - .12) / .06) * (1 - clamp((t - .64) / .08));
  if (wsh !== 0 || lastWsh !== 0) {
    lastWsh = wsh;
    cls.forEach((c, i) => {
      c.style.transform = `translate(${(Math.sin(ang / 9 + i * 1.3) * 1.6 * wsh).toFixed(1)}px,${(Math.cos(ang / 11 + i) * 1.1 * wsh).toFixed(1)}px) rotate(${(Math.sin(ang / 7 + i * 2) * 2.2 * wsh).toFixed(1)}deg)`;
    });
  }

  /* water — بالـ transform بدل height عشان ميعملش إعادة تخطيط كل فريم */
  let lvl = 0;
  if (t < .15) lvl = (t / .15) * .5; else if (t < .6) lvl = .5; else if (t < .86) lvl = .5 * (1 - (t - .6) / .26);
  const wv = `translate3d(0,${((1 - lvl * 2) * 100).toFixed(1)}%,0)`;
  if (wv !== lastWater) { lastWater = wv; water.style.transform = wv; }
  const fo = (t > .1 && t < .72) ? 1 : 0;
  if (fo !== lastFoam) { lastFoam = fo; foam.style.opacity = fo; }

  /* display */
  const remain = Math.max(0, Math.round(42 * (1 - t)));
  const tx = '00:' + String(remain).padStart(2, '0');
  if (tx !== lastTime) { lastTime = tx; timeEl.textContent = tx; }
  const md = (modes.find(m => t < m[0]) || modes[4])[1];
  if (md !== lastMode) { lastMode = md; modeEl.textContent = md; }
  const kn = `rotate(${(t * 540).toFixed(1)}deg)`;
  if (kn !== lastKnob) { lastKnob = kn; knob.style.transform = kn; }

  /* التلميح يختفي أول ما العميل يبدأ ينزل؛ باقي العناصر بتتحرك مع الصفحة عادي */
  const hd = heroP > 8;
  if (hintEl && hd !== lastHint) { lastHint = hd; hintEl.style.animation = hd ? 'none' : ''; hintEl.style.opacity = hd ? 0 : ''; }
  const mt = `scaleX(${clamp(heroP / Math.max(1, vh)).toFixed(3)})`;
  if (mt !== lastMeter) { lastMeter = mt; meter.style.transform = mt; }
}

/* =========================================================
   STORY — statement words light up with scroll
   ========================================================= */
const stWords = $$('#statement .w'), stEl = $('#statement');
let stNear = true, stLast = -1;
if (stEl && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { stNear = e.isIntersecting; ticking = true; }), { rootMargin: '0px' }).observe(stEl);
function updateStatement() {
  if (!stEl || !stNear) return;
  const r = stEl.getBoundingClientRect();
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp((vh * .82 - r.top) / (r.height + vh * .32));
  const n = Math.round(p * stWords.length * 1.15);
  if (n === stLast) return;
  /* بنبدّل بس الكلمات اللي حالتها اتغيرت بدل كل الكلمات */
  const lo = stLast < 0 ? 0 : Math.min(n, stLast), hi = stLast < 0 ? stWords.length : Math.min(stWords.length, Math.max(n, stLast));
  for (let i = lo; i < hi; i++) stWords[i].classList.toggle('on', i < n);
  stLast = n;
}

/* =========================================================
   SCENTS — pinned scene, jugs swap with scroll
   ========================================================= */
/* كل .scent مشهد مستقل (عطور اليدين / 2 لتر / 4 لتر / 20 لتر): تراك مثبّت + جراكن بتتبدّل مع السكرول */
const mobQ = matchMedia('(max-width:900px),(hover:none)');
const scenes = $$('.scent').map(sec => {
  const S = {
    sec, track: $('.scent-track', sec), stage: $('.scent-stage', sec), jugs: $$('.sj', sec), panels: $$('.sc-panel', sec),
    dots: $$('.sc-dots button', sec), count: $('.sc-count', sec), hint: $('.sc-hint', sec), box: $('.sc-jugs', sec),
    T: 0, F: 0, idx: -1, tiltX: 0, tiltY: 0, tX: 0, tY: 0, visible: true,
  };
  S.n = S.jugs.length;

  /* جسيمات كل مشهد */
  const FX = {
    'fx-smoke': [9, (el, i) => { el.style.left = rand(0, 90) + '%'; el.style.animationDelay = (-i * 1.6) + 's'; el.style.animationDuration = rand(11, 18) + 's'; el.style.setProperty('--dx', rand(-120, 120) + 'px'); }],
    'fx-petal': [20, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(14, 30) + 'px'); el.style.setProperty('--t', rand(9, 16) + 's'); el.style.setProperty('--dl', (-rand(0, 14)) + 's'); el.style.setProperty('--dx', rand(-120, 160) + 'px'); }],
    'fx-lav': [28, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(6, 13) + 'px'); el.style.setProperty('--t', rand(11, 19) + 's'); el.style.setProperty('--dl', (-rand(0, 18)) + 's'); el.style.setProperty('--dx', rand(-100, 100) + 'px'); }],
    'fx-spark': [42, el => { el.style.left = rand(0, 100) + '%'; el.style.top = rand(0, 100) + '%'; el.style.animationDelay = (-rand(0, 4)) + 's'; el.style.animationDuration = rand(2.5, 5) + 's'; }],
    'fx-lemon': [9, el => { el.style.left = rand(0, 96) + '%'; el.style.setProperty('--s', rand(34, 66) + 'px'); el.style.setProperty('--t', rand(11, 18) + 's'); el.style.setProperty('--dl', (-rand(0, 16)) + 's'); el.style.setProperty('--dx', rand(-140, 160) + 'px'); }],
    'fx-lime': [9, el => { el.style.left = rand(0, 96) + '%'; el.style.setProperty('--s', rand(34, 66) + 'px'); el.style.setProperty('--t', rand(11, 18) + 's'); el.style.setProperty('--dl', (-rand(0, 16)) + 's'); el.style.setProperty('--dx', rand(-140, 160) + 'px'); }],
    'fx-leaf': [14, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(14, 26) + 'px'); el.style.setProperty('--t', rand(9, 15) + 's'); el.style.setProperty('--dl', (-rand(0, 14)) + 's'); el.style.setProperty('--dx', rand(-120, 160) + 'px'); }],
    'fx-drop': [18, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(8, 16) + 'px'); el.style.setProperty('--t', rand(8, 14) + 's'); el.style.setProperty('--dl', (-rand(0, 14)) + 's'); el.style.setProperty('--dx', rand(-100, 120) + 'px'); }],
    'fx-wdrop': [20, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(9, 18) + 'px'); el.style.setProperty('--t', rand(8, 14) + 's'); el.style.setProperty('--dl', (-rand(0, 14)) + 's'); el.style.setProperty('--dx', rand(-100, 120) + 'px'); }],
    'fx-blossom': [24, el => { el.style.left = rand(0, 100) + '%'; el.style.setProperty('--s', rand(14, 32) + 'px'); el.style.setProperty('--t', rand(9, 16) + 's'); el.style.setProperty('--dl', (-rand(0, 14)) + 's'); el.style.setProperty('--dx', rand(-120, 160) + 'px'); }],
    'fx-bub': [8, el => { el.style.left = rand(2, 96) + '%'; el.style.setProperty('--s', rand(14, 44) + 'px'); el.style.setProperty('--t', rand(8, 15) + 's'); el.style.setProperty('--dl', (-rand(0, 15)) + 's'); el.style.setProperty('--dx', rand(-90, 90) + 'px'); }],
  };
  $$('.sc-fx > div', sec).forEach(box => {
    for (const k in FX) if (box.classList.contains(k)) {
      const [n, fn] = FX[k], cnt = Math.ceil(n * (lite ? .3 : .45));
      for (let i = 0; i < cnt; i++) { const el = document.createElement('i'); fn(el, i); box.appendChild(el); }
    }
  });

  /* تبديل تلقائي: كل جركن بيظهر كام ثانية وبعدين اللي بعده (من غير سكرول). السحب/الضغط على النقط بيحرّك يدوي وبيعيد العدّاد. */
  const WRAP = (v, n) => ((v % n) + n + n / 2) % n - n / 2;   /* أقصر مسافة دائرية */
  S.d = i => WRAP(i - S.F, S.n);
  S.last = performance.now();
  S.progress = () => S.track.getBoundingClientRect();
  S.next = (k = 1) => { S.T = Math.round(S.T) + k; S.last = performance.now(); };
  S.auto = now => { if (!reduce && S.visible && !S.hold && !document.hidden && now - S.last > 5600) S.next(1); };
  S.update = () => {
    const _n = performance.now(), _dt = Math.min(50, _n - (S._t || _n) || 16.7); S._t = _n;
    S.F = lerp(S.F, S.T, 1 - Math.pow(1 - .055, _dt / 16.7));   /* حركة أبطأ وأنعم، ثابتة على أي معدّل إطارات */
    if (Math.abs(S.F - S.T) < .0005) S.F = S.T;
    const idx = ((Math.round(S.F) % S.n) + S.n) % S.n;
    if (idx !== S.idx) {
      S.idx = idx; S.stage.dataset.i = idx;
      S.panels.forEach((p, i) => p.classList.toggle('is-on', i === idx));
      if (S.count) S.count.textContent = `0${idx + 1} / 0${S.n}`;
    }
    const w = S.jugs[0].offsetWidth || 300;
    S.tiltX = lerp(S.tiltX, S.tX, .08); S.tiltY = lerp(S.tiltY, S.tY, .08);
    /* لو مفيش حركة (الجركن واقف) منكتبش ستايل كل فريم — ده اللي كان بيهنّج الموبايل */
    const moving = S.F !== S.T || Math.abs(S.tiltX - S.tX) > .002 || Math.abs(S.tiltY - S.tY) > .002;
    if (!moving && S._drawn) return;
    S._drawn = !moving;
    const mob = mobQ.matches;
    S.jugs.forEach((j, i) => {
      const d = S.d(i), ad = Math.abs(d);
      const x = -d * w * .5, z = -ad * 60, k = 1 - Math.min(ad, 1.4) * .06;
      /* موبايل: تحريك 2D بسيط (من غير دوران/عمق/تصغير) → الصورة تفضل حادة وخفيفة */
      j.style.transform = mob ? `translate3d(calc(-50% + ${x.toFixed(1)}px),-50%,0)`
        : `translate3d(calc(-50% + ${x}px),-50%,${z}px) rotateY(${-d * 4 + S.tiltX * 1.2}deg) rotateX(${S.tiltY * -.8}deg) scale(${k})`;
      j.style.visibility = ad >= 1 ? 'hidden' : 'visible';
      const _o = clamp(1 - ad, 0, 1); j.style.opacity = _o * _o * (3 - 2 * _o);   /* تلاشي متقاطع ناعم بين الجركنين */
      j.style.zIndex = 10 - Math.round(ad * 3);
          });
    if (S.hint) S.hint.style.opacity = S.T < .05 && S.F < .05 ? 1 : 0;
  };
  S.go = i => S.next(WRAP(i - S.idx, S.n));
  S.dots.forEach((b, i) => b.addEventListener('click', () => S.go(i)));
  S.jugs.forEach((b, i) => b.addEventListener('click', () => S.go(i)));
  /* سحب بالصباع يمين/شمال يبدّل المنتج */
  let sx = null, sy = 0;
  S.stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; S.hold = true; }, { passive: true });
  S.stage.addEventListener('touchend', e => {
    S.hold = false; S.last = performance.now(); if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4) S.next(dx < 0 ? 1 : -1);
  }, { passive: true });
  S.stage.addEventListener('touchcancel', () => { S.hold = false; sx = null; }, { passive: true });
  if (finePointer) S.stage.addEventListener('pointermove', e => { const r = S.box.getBoundingClientRect(); S.tX = ((e.clientX - r.left) / r.width - .5) * 2; S.tY = ((e.clientY - r.top) / r.height - .5) * 2; }, { passive: true });
  S.near = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { S.visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(S.stage);
    /* المشهد القريب بس هو اللي بيتحدّث وبياخد will-change (طبقات GPU أقل = ذاكرة أقل على الموبايل) */
    new IntersectionObserver(es => { S.near = es[0].isIntersecting; sec.classList.toggle('near', S.near); ticking = true; }, { rootMargin: '50px 0px' }).observe(S.track);
  }
  return S;
});

/* =========================================================
   MAIN SCROLL LOOP
   ========================================================= */
var ticking = true;
let scrollVel = 0, lastY = scrollY, heroWasVisible = true;
addEventListener('scroll', () => { ticking = true; }, { passive: true });
let lastW = innerWidth, lastH = innerHeight;
let rsT = 0;
addEventListener('resize', () => {
  const dW = Math.abs(innerWidth - lastW), dH = Math.abs(innerHeight - lastH);
  /* على الموبايل: ظهور/اختفاء شريط المتصفح بيغيّر الارتفاع بس — منعيدش بناء المشهد */
  if (dW < 2 && dH < 170 && matchMedia('(hover:none)').matches) {
    vh = innerHeight; ticking = true;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    if (cv.height < vh * dpr) cv.height = vh * dpr;
    return;
  }
  lastW = innerWidth; lastH = innerHeight;
  /* تدوير الشاشة/تغيير المقاس: ننتظر لحد ما يهدّى (debounce) بدل إعادة بناء كل ما يتغير بكسل */
  clearTimeout(rsT);
  rsT = setTimeout(() => { fitScene(); ticking = true; sizeCanvas(); movePill(); resize3D(); }, 120);
});
/* لو طول الصفحة اتغيّر (صور/خطوط اتحمّلت) نحدّث القياسات المتخزنة */
if ('ResizeObserver' in window) { let mT = 0; new ResizeObserver(() => { cancelAnimationFrame(mT); mT = requestAnimationFrame(() => { measure(); ticking = true; }); }).observe(document.body); }

/* مراقب الأداء: لو الفريمات بطيئة فعلًا (أقل من ~30fps لثواني) نشغّل وضع «ultra» ونوقف الزينة */
let pfT = 0, pfSum = 0, pfN = 0, pfBad = 0;
function perfWatch(time) {
  if (document.hidden) { pfT = 0; return; }
  if (pfT) {
    const d = time - pfT;
    if (d < 250) { pfSum += d; pfN++; }
    if (pfN >= 50) {
      pfBad = (pfSum / pfN > 31) ? pfBad + 1 : 0;
      pfSum = pfN = 0;
      if (pfBad >= 2 && !ultra) goUltra();
    }
  }
  pfT = time;
}
let ultra = false;
function goUltra() {
  ultra = true; document.documentElement.classList.add('lite', 'ultra');
  cv.style.display = 'none'; trail.length = 0; pops.length = 0;
}

function frame(time) {
  perfWatch(time);
  const y = scrollY; scrollVel = lerp(scrollVel, y - lastY, .2); lastY = y;
  const hr = heroProgress();
  const heroVisible = hr.bottom > -50 && hr.top < vh + 50;
  /* الغسالة ماشية مع السكرول مباشرة (طالع/نازل). لو القفزة كبيرة أو المشهد كان برا الشاشة
     نعمل snap فوري بدل ما نعيد تشغيل الأنيميشن ونسيبه يكمّل لوحده. */
  if (reduce || !heroWasVisible || Math.abs(heroTarget - heroP) > vh * .12) heroP = heroTarget;
  else heroP = lerp(heroP, heroTarget, .5);
  if (Math.abs(heroTarget - heroP) < .5) heroP = heroTarget;
  heroWasVisible = heroVisible;
  if (ticking || Math.abs(heroTarget - heroP) > .3) {
    chrome();
    if (heroVisible) updateHero(time);
    updateStatement();
  }
  for (const S of scenes) if (S.near) { S.auto(time); S.update(); }
  if (Math.abs(heroTarget - heroP) < .3 && Math.abs(scrollVel) < .1) ticking = false;
  requestAnimationFrame(frame);
}

/* =========================================================
   PRODUCTS — filters (FLIP), tilt, magnetic
   ========================================================= */
const filters = $('.filters'), fBtns = $$('.filters button'), pill = $('.f-pill'), cards = $$('#grid .card');
function movePill() {
  const on = $('.filters button.is-on'); if (!on) return;
  pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px';
}
let fTok = 0;
const EASE = 'cubic-bezier(.22,1,.36,1)';
fBtns.forEach(b => b.addEventListener('click', () => {
  if (b.classList.contains('is-on')) return;
  fBtns.forEach(x => x.classList.toggle('is-on', x === b)); movePill();
  const f = b.dataset.f, tok = ++fTok, show = c => f === 'all' || c.dataset.cat === f;
  const leaving = cards.filter(c => !c.hidden && !show(c));
  cards.forEach(c => { if (show(c)) c.classList.remove('leaving'); });
  const apply = () => {
    if (tok !== fTok) return;
    const first = new Map(cards.map(c => [c, c.hidden ? null : c.getBoundingClientRect()]));
    cards.forEach(c => { c.classList.remove('leaving'); c.hidden = !show(c); });
    let n = 0;
    cards.forEach(c => {
      if (c.hidden) return;
      c.classList.add('in');
      if (reduce || !c.animate) return;
      const a = first.get(c), l = c.getBoundingClientRect();
      if (a) {
        const dx = a.left - l.left, dy = a.top - l.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 520, easing: EASE });
      } else c.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: (n++) * 50, easing: EASE, fill: 'backwards' });
    });
  };
  if (reduce || !leaving.length) apply();
  else { leaving.forEach(c => c.classList.add('leaving')); setTimeout(apply, 220); }
}));
requestAnimationFrame(movePill); addEventListener('load', movePill);
document.fonts && document.fonts.ready.then(movePill);

if (finePointer) {
  $$('.magnetic').forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .28}px)`;
    });
    m.addEventListener('pointerleave', () => { m.style.transform = ''; });
  });
}

/* =========================================================
   ORDER — الأسعار، شريط الشراء، السلة، واتساب
   ========================================================= */
/* الأسعار بالجنيه للكرتونة الواحدة (الكرتونة = pack × unit).
   لو عايز شرائح سعر حسب العدد: زوّد tiers: [[أقل عدد كراتين, سعر الكرتونة], ...] وهيتطبّق تلقائي (الأعلى أولًا). */
const P = (price, pack, unit, tiers) => ({ price, pack, unit, tiers: tiers || [] });
const PRICES = {
  'مزيل الدهون الصعبة — جركن 10 لتر':            P(160, 1, 'جركن'),
  'مزيل الدهون الصعبة — جركن 20 لتر ليمون أصفر': P(285, 1, 'جركن'),
  'مزيل الدهون الصعبة — جركن 20 لتر ليمون أخضر': P(285, 1, 'جركن'),
  'مزيل الدهون الصعبة — الأصفر 750 مل':          P(231, 12, 'زجاجة'),
  'مزيل الدهون الصعبة — الأخضر 750 مل':          P(231, 12, 'زجاجة'),
  'مزيل الدهون الصعبة — الأخضر 2 لتر':           P(315, 6, 'جركن'),
  'مزيل الدهون الصعبة — الأصفر 2 لتر':           P(315, 6, 'جركن'),
  'مزيل الدهون الصعبة — الأخضر 4 لتر':           P(380, 4, 'جركن'),
  'مزيل الدهون الصعبة — الأصفر 4 لتر':           P(380, 4, 'جركن'),
  'سائل غسول لليدين — عود 5 لتر':                P(480, 4, 'جركن'),
  'سائل غسول لليدين — عنبر أحمر 5 لتر':          P(480, 4, 'جركن'),
  'سائل غسول لليدين — لافندر 5 لتر':             P(480, 4, 'جركن'),
  'معطر ملابس — نسيم البحر 2 لتر':               P(380, 6, 'جركن'),
  'معطر ملابس — الزهور 4 لتر':                   P(420, 4, 'جركن'),
  'معطر ملابس — الزهور 2 لتر':                   P(380, 6, 'جركن'),
  'معطر ملابس — نسيم البحر 4 لتر':               P(420, 4, 'جركن'),
  'معطر ملابس — 5 لتر':                          P(65, 1, 'قارورة'),
};
const disp = n => n.replace(/ — /g, ' ');
const fmt = n => Math.round(n).toLocaleString('en-US');
const unitPrice = (it, n) => { const t = it.tiers.filter(x => n >= x[0]).sort((a, b) => b[0] - a[0])[0]; return t ? t[1] : it.price; };
const lineTotal = (name, n) => unitPrice(PRICES[name], n) * n;
const MAXQ = 999;
const toQ = v => clamp(parseInt(String(v).replace(/\D/g, ''), 10) || 1, 1, MAXQ);

/* ---- السلة (بتتحفظ في المتصفح) ---- */
var cartHook = null;
let cart = {};
try { const s = JSON.parse(localStorage.getItem('bh_cart') || '{}'); Object.keys(s).forEach(k => { if (PRICES[k]) cart[k] = toQ(s[k]); }); } catch (e) {}
const saveCart = () => { try { localStorage.setItem('bh_cart', JSON.stringify(cart)); } catch (e) {} };
const cartNames = () => Object.keys(cart);
const cartCount = () => cartNames().reduce((a, k) => a + cart[k], 0);
const cartTotal = () => cartNames().reduce((a, k) => a + lineTotal(k, cart[k]), 0);

const qtyHTML = v => `<div class="qty q-s"><button type="button" data-d="-1" aria-label="تقليل">−</button><input type="text" inputmode="numeric" value="${v}" maxlength="3" aria-label="عدد الكراتين"><button type="button" data-d="1" aria-label="زيادة">+</button></div>`;
const packTxt = it => `${it.pack} ${it.unit}`;

/* ---- شريط الشراء: بيتركّب مكان زرار «اطلب المنتج» ---- */
function buildBuy(name) {
  const it = PRICES[name], d = document.createElement('div');
  d.className = 'buy'; d.dataset.sku = name;
  d.innerHTML = `<div class="buy-price"><b>${fmt(it.price)}</b><span>جنيه</span><small>للكرتونة · ${packTxt(it)}</small></div>
    <div class="buy-lbl">عدد الكراتين</div>
    <div class="buy-row">${qtyHTML(1)}<button type="button" class="btn btn-card buy-add" aria-label="ضع في السلة"><span class="ba-t">ضع في السلة</span><span class="arr">+</span><svg class="ba-i" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.2l2.1 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg></button></div>
    <div class="buy-sum"></div>`;
  return d;
}
function buySum(d) {
  const n = toQ($('input', d).value), name = d.dataset.sku;
  $('.buy-sum', d).textContent = n > 1 ? `${n} كرتونة = ${fmt(lineTotal(name, n))} جنيه` : '';
}
$$('#grid .order-product').forEach(b => {
  const name = b.dataset.product; if (!PRICES[name]) return;
  const d = buildBuy(name); b.parentNode.classList.add('has-buy'); b.replaceWith(d);
});

/* ---- منتج من مشهد المطبخ أو من السلايدرات: نروح لكارته في قسم المنتجات (الشراء من الكروت بس) ---- */
$$('.kp, .order-product').forEach(b => b.addEventListener('click', () => {
  const vc = cards.find(c => c._vars && c._vars.some(v => v.sku === b.dataset.product));
  if (vc) vc._setVar(vc._vars.findIndex(v => v.sku === b.dataset.product));
  const buy = $(`#grid .buy[data-sku="${b.dataset.product}"]`); if (!buy) return;
  const card = buy.closest('.card');
  const f = $('.filters button[data-f="all"]'); if (f && !f.classList.contains('is-on')) f.click();
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 2200);
}));

/* ---- عناصر السلة والدروار ---- */
const fab = $('#cartFab'), drawer = $('#cartDrawer'), cList = $('#cartList'), cTotal = $('#cartTotal'), cBadge = $('#cartBadge'), cEmpty = $('#cartEmpty'), cFoot = $('#cartFoot');
const oSum = $('#orderSummary'), form = $('#orderForm'), note = $('#formNote');
const openCart = on => { drawer.classList.toggle('on', on); drawer.setAttribute('aria-hidden', on ? 'false' : 'true'); document.body.classList.toggle('cart-open', on); };
fab.addEventListener('click', () => openCart(true));
$$('[data-cart-close]').forEach(e => e.addEventListener('click', () => openCart(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') openCart(false); });
$('#cartGo').addEventListener('click', () => { openCart(false); orderSec.scrollIntoView({ behavior: 'smooth' }); });
$('#cartClear').addEventListener('click', () => { cart = {}; renderCart(); });
$('#sumEdit').addEventListener('click', () => openCart(true));

function lineHTML(k) {
  const it = PRICES[k], n = cart[k];
  return `<li class="ci" data-sku="${k}"><div class="ci-top"><div class="ci-name">${disp(k)}<small>${fmt(unitPrice(it, n))} جنيه للكرتونة · ${packTxt(it)}</small></div><button type="button" class="ci-del" aria-label="حذف">×</button></div>
    <div class="ci-bot">${qtyHTML(n)}<b class="ci-sum">${fmt(lineTotal(k, n))} <span>جنيه</span></b></div></li>`;
}
function renderCart(bump) {
  const names = cartNames(), cnt = cartCount();
  cList.innerHTML = names.map(lineHTML).join('');
  cEmpty.hidden = names.length > 0; cFoot.hidden = !names.length;
  cTotal.textContent = fmt(cartTotal());
  cBadge.textContent = cnt; cBadge.hidden = !cnt;
  fab.classList.toggle('has', cnt > 0);
  if (bump) { fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump'); }
  cartHook && cartHook();
  oSum.innerHTML = names.length
    ? `<ul>${names.map(k => `<li><span>${disp(k)}</span><em>${cart[k]} كرتونة</em><b>${fmt(lineTotal(k, cart[k]))} جنيه</b></li>`).join('')}</ul><div class="os-total"><span>الإجمالي</span><b>${fmt(cartTotal())} جنيه</b></div>`
    : `<p class="os-empty">السلة فاضية — اختار منتجاتك من <a href="#products">قسم المنتجات</a> وحدد عدد الكراتين.</p>`;
  $('#sumEdit').hidden = !names.length;
  saveCart();
}
function setLine(k, n) {
  if (n <= 0) delete cart[k]; else cart[k] = toQ(n);
  const li = $(`.ci[data-sku="${k}"]`, cList);
  if (!cart[k]) { renderCart(); return; }
  if (li) { $('.ci-sum', li).firstChild.textContent = fmt(lineTotal(k, cart[k])) + ' '; $('small', li).textContent = `${fmt(unitPrice(PRICES[k], cart[k]))} جنيه للكرتونة · ${packTxt(PRICES[k])}`; }
  cTotal.textContent = fmt(cartTotal()); cBadge.textContent = cartCount();
  oSum.innerHTML = ''; renderCart_summaryOnly(); saveCart(); cartHook && cartHook();
}
function renderCart_summaryOnly() {
  const names = cartNames();
  oSum.innerHTML = `<ul>${names.map(k => `<li><span>${disp(k)}</span><em>${cart[k]} كرتونة</em><b>${fmt(lineTotal(k, cart[k]))} جنيه</b></li>`).join('')}</ul><div class="os-total"><span>الإجمالي</span><b>${fmt(cartTotal())} جنيه</b></div>`;
}

/* ---- أزرار العدّاد + إضافة للسلة + حذف (event delegation) ---- */
document.addEventListener('click', e => {
  const qb = e.target.closest('.q-s button');
  if (qb) {
    const box = qb.closest('.q-s'), inp = $('input', box), n = toQ(+inp.value + (+qb.dataset.d));
    inp.value = n;
    const li = box.closest('.ci'); if (li) setLine(li.dataset.sku, n);
    const by = box.closest('.buy'); if (by) buySum(by);
    return;
  }
  const add = e.target.closest('.buy-add');
  if (add) {
    const by = add.closest('.buy'), k = by.dataset.sku, n = toQ($('input', by).value);
    cart[k] = clamp((cart[k] || 0) + n, 1, MAXQ);
    $('input', by).value = 1; buySum(by); renderCart(true);
    toast(`تمت الإضافة للسلة ✓ ${n} كرتونة ${disp(k)}`);
    return;
  }
  const del = e.target.closest('.ci-del');
  if (del) setLine(del.closest('.ci').dataset.sku, 0);
});
document.addEventListener('input', e => {
  const inp = e.target.closest && e.target.closest('.q-s input'); if (!inp) return;
  const clean = inp.value.replace(/\D/g, '').slice(0, 3); if (clean !== inp.value) inp.value = clean;
  const by = inp.closest('.buy'); if (by) buySum(by);
});
document.addEventListener('change', e => {
  const inp = e.target.closest && e.target.closest('.q-s input'); if (!inp) return;
  const n = toQ(inp.value); inp.value = n;
  const li = inp.closest('.ci'); if (li) setLine(li.dataset.sku, n);
  const by = inp.closest('.buy'); if (by) buySum(by);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('.buy .q-s input')) { e.preventDefault(); $('.buy-add', e.target.closest('.buy')).click(); } });
renderCart();

/* ---- رسالة الطلب (هادية ومنظمة لواتساب) ---- */
function buildMsg(o) {
  const when = new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  const items = o.items.map((x, i) => `${i + 1}. ${x.name}\n    ${x.cartons} كرتونة × ${fmt(x.price)} = ${fmt(x.total)} جنيه`).join('\n');
  return [`*طلب جديد من برايت هوم*`, `الوقت: ${when}`, '',
    `الاسم: ${o.name}`, `الموبايل: ${o.phone}`, `العنوان: ${o.address}`, '',
    `الطلب:`, items, '',
    `إجمالي الكراتين: ${o.cartons}`, `*الإجمالي: ${fmt(o.total)} جنيه*`,
    ...(o.note ? ['', `ملاحظات: ${o.note}`] : [])].join('\n');
}
/* ---- إرسال الطلب على واتساب ---- */
form.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get('name') || '').toString().trim();
  const phone = (fd.get('phone') || '').toString().trim();
  const address = (fd.get('address') || '').toString().trim();
  const extra = (fd.get('note') || '').toString().trim();

  let bad = null;
  const mark = (id, cond) => { const f = $('#' + id).closest('.field'); f.classList.toggle('err', cond); if (cond && !bad) bad = $('#' + id); };
  mark('fName', name.length < 2);
  mark('fPhone', phone.replace(/\D/g, '').length < 8);
  mark('fAddress', address.length < 5);
  if (!cartNames().length) { oSum.classList.remove('shake'); void oSum.offsetWidth; oSum.classList.add('shake'); toast('السلة فاضية — ضيف منتج واحد على الأقل'); return; }
  if (bad) { bad.focus(); toast('من فضلك كمّل البيانات المطلوبة'); return; }

  const order = { name, phone, address, note: extra, cartons: cartCount(), total: cartTotal(),
    items: cartNames().map(k => { const it = PRICES[k], n = cart[k]; return { name: disp(k), cartons: n, pack: it.pack, unit: it.unit, price: unitPrice(it, n), total: lineTotal(k, n) }; }) };
  const msg = buildMsg(order);
  const sendWA = () => {
  const num = (CONFIG.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(num)) {
    note.classList.add('warn');
    note.textContent = 'رقم واتساب لسه مش متضاف في الموقع (CONFIG في js/main.js). الرسالة اتنسخت — ابعتها يدويًا لرقم برايت.';
    (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => toast('تم نسخ رسالة الطلب ✓'), () => toast('رقم واتساب غير مُضاف بعد'));
    return;
  }
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  cart = {}; renderCart(); form.reset(); note.classList.remove('warn');
  note.textContent = 'تم تجهيز طلبك ✓ اضغط «إرسال» في واتساب لتأكيده.'; toast('تم تجهيز طلبك ✓');
  };
  if (CONFIG.ORDER_API) {
    const btn = $('button[type=submit]', form); btn.disabled = true;
    fetch(CONFIG.ORDER_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: msg }) })
      .then(r => { if (!r.ok) throw 0; cart = {}; renderCart(); form.reset(); note.classList.remove('warn'); note.textContent = 'تم إرسال طلبك ✓ هنتواصل معاك لتأكيده.'; toast('تم إرسال طلبك بنجاح ✓'); })
      .catch(() => { toast('تعذّر الإرسال التلقائي — هنفتح واتساب'); sendWA(); })
      .finally(() => { btn.disabled = false; });
    return;
  }
  sendWA();
});
$$('.field input,.field textarea').forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));

/* =========================================================
   3D PRODUCTS — تجسيم الجراكن والإزايز
   بنبني لكل صورة: جدران عمق (قناع بنفس شكل الجركن) + تظليل + لمعة،
   وبتميل ناحية الماوس/صباع العميل، وبتتمايل لوحدها لو مفيش لمس.
   ========================================================= */
const SIDE = {
  white:  { a: '#eef3fb', b: '#7f94b8', d: .30, ar: 616 / 900 },
  amber:  { a: '#f5ebdc', b: '#a08a6c', d: .30, ar: 616 / 900 },
  green:  { a: '#7fe08e', b: '#1c7a36', d: .55, ar: 233 / 710, bottle: 1 },
  yellow: { a: '#fff08a', b: '#a98400', d: .55, ar: 229 / 692, bottle: 1 },
  sea:    { a: '#7fd4fb', b: '#0e5fb8', d: .30, ar: 616 / 900 },
  rose:   { a: '#ffd0dc', b: '#c0587c', d: .30, ar: 616 / 900 },
};
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mixc = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';
const hasAR = window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1');
const p3ds = [];
let mx = 0, my = 0, hasPtr = false;

function build3D(img) {
  const k = ((img.getAttribute('src') || '').match(/products\/(\w+)\./) || [])[1] || 'jug10l';
  const sd = SIDE[k] || SIDE.white;
  const par = img.parentNode;
  const host = document.createElement('span'); host.className = 'p3d' + (sd.bottle ? ' bottle' : '') + (img.classList.contains('slim') ? ' tall' : '') + ' off';
  host.style.setProperty('--m', 'url("' + img.src + '")');
  host.style.setProperty('--ar', img.getAttribute('width') + ' / ' + img.getAttribute('height'));
  const inn = document.createElement('span'); inn.className = 'p3d-in';
  const sh = document.createElement('i'); sh.className = 'p3d-sh'; host.appendChild(sh);
  const N = (lite || vw < 700) ? 10 : 20, c1 = hex2rgb(sd.a), c2 = hex2rgb(sd.b);
  for (let i = 0; i < N; i++) {
    const d = document.createElement('i'); d.className = 'p3d-d';
    d.style.setProperty('--i', i); d.style.setProperty('--c', mixc(c2, c1, i / (N - 1)));
    inn.appendChild(d);
  }
  par.insertBefore(host, img);
  img.classList.add('p3d-front'); img.removeAttribute('loading');
  inn.appendChild(img);
  const sd2 = document.createElement('i'); sd2.className = 'p3d-shade';
  const gl = document.createElement('i'); gl.className = 'p3d-gloss';
  inn.appendChild(sd2); inn.appendChild(gl); host.appendChild(inn);
  const o = { host, inn, sd, N, live: false, ry: -14, rx: 2, ph: rand(0, 6.28), tw: 0 };
  p3ds.push(o); size3D(o); return o;
}
function size3D(o) {
  const h = o.host.offsetHeight, w = o.host.offsetWidth;
  if (!h) return;
  if (!hasAR && o.host.closest('.c-vis')) o.host.style.width = Math.round(h * o.sd.ar) + 'px';
  const ww = Math.min(w || h * o.sd.ar, h * o.sd.ar);
  const depth = clamp(ww * o.sd.d, 12, 92);
  o.host.style.setProperty('--depth', depth.toFixed(1) + 'px');
  o.host.style.setProperty('--step', (depth / o.N).toFixed(2) + 'px');
}
function resize3D() { p3ds.forEach(size3D); }
/* التجسيم على جراكن قسم العطور بس (.sj). لو عايزه كمان على المطبخ أو الكروت زوّد '.kp img' أو '.c-vis img' هنا */
/* جراكن العطور = مجسّم WebGL (شوف buildSolid تحت) */

/* =========================================================
   مشهد 3D لكل كارت منتج: كراتين (بعيد) ← جركن مجسّم (قدّام) ← ظل أرضي
   المشهد كله (.c-stage) بيميل ميلة خفيفة مع الماوس فالطبقات بتتحرك بالنسبة لبعض (باراللاكس هادي)،
   ودخول «بوب» ناعم بالـ CSS. مفيش أي لفّ ولا حركة مرحة.
   ========================================================= */
const cardScenes = [];
cards.forEach(card => {
  const vis = card.querySelector('.c-vis'), img = vis && vis.querySelector('img:not(.c-boxes)');
  if (!vis || !img) return;
  const boxes = vis.querySelector('.c-boxes');
  const stage = document.createElement('span'); stage.className = 'c-stage';
  const floor = document.createElement('i'); floor.className = 'c-floor'; floor.setAttribute('aria-hidden', 'true');
  vis.insertBefore(stage, img);
  stage.appendChild(floor); if (boxes) stage.appendChild(boxes); stage.appendChild(img);
  /* نسيب loading="lazy" زي ما هي: الصور تحت الشاشة ماتتحمّلش وماتتفكش لحد ما العميل يقرّب منها */
  cardScenes.push({ card, stage, j3: null });
});
/* =========================================================
   أصناف الكارت: قايمة بتنزل جنب الاسم (لون / ريحة) — كل صنف ليه سعر وكمية،
   وتقدر تضيف صنف للسلة وبعدين تغيّر للصنف التاني وتضيفه كمان. الصور بتتبدّل لو الصنف ليه صورة.
   ========================================================= */
function reskin3D(o, img) {
  if (!o) return;
  const k = ((img.getAttribute('src') || '').match(/products\/(\w+)\./) || [])[1] || 'jug10l';
  o.sd = SIDE[k] || SIDE.white;
  o.host.style.setProperty('--m', 'url("' + img.src + '")');
  const c1 = hex2rgb(o.sd.a), c2 = hex2rgb(o.sd.b);
  $$('.p3d-d', o.host).forEach((d, i) => d.style.setProperty('--c', mixc(c2, c1, i / Math.max(1, o.N - 1))));
  size3D(o);
}
/* نسخة موبايل أصغر لصور المنتجات الكبيرة (srcset)؛ لازم نحدّث srcset مع src لأن المتصفح بيفضّل srcset */
const HAS_M = {"amber.webp": [438, 616], "g2.webp": [438, 616], "g4.webp": [438, 616], "jug10l.webp": [441, 620], "lavender.webp": [438, 616], "lemon20.webp": [533, 750], "lime20.webp": [533, 750], "oud.webp": [438, 616], "rose.webp": [438, 616], "sea.webp": [438, 616], "y2.webp": [438, 616], "y4.webp": [438, 616]};
function setImgSrc(img, url) {
  const n = (url.match(/products\/([\w-]+\.webp)$/) || [])[1];
  if (n && HAS_M[n]) img.srcset = 'assets/products/m/' + n + ' ' + HAS_M[n][0] + 'w, ' + url + ' ' + HAS_M[n][1] + 'w';
  else img.removeAttribute('srcset');
  img.src = url;
}
const varCards = [];
const closeVars = except => varCards.forEach(c => { if (c !== except) c._close(); });
cards.forEach(card => {
  let vars; try { vars = JSON.parse(card.dataset.variants || 'null'); } catch (e) { vars = null; }
  const h3 = $('.c-info h3', card), cat = $('.c-cat', card), by = $('.buy', card), img = $('.c-vis img:not(.c-boxes)', card);
  if (!vars || vars.length < 2 || !h3 || !by) return;
  vars = vars.filter(v => PRICES[v.sku]); if (vars.length < 2) return;
  const sc = cardScenes.find(x => x.card === card), j3 = sc && sc.j3;
  card._vars = vars; card._i = 0;

  const wrap = document.createElement('div'); wrap.className = 'var-wrap';
  h3.parentNode.insertBefore(wrap, h3); wrap.appendChild(h3);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'var-btn';
  btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="var-name"></span><i class="var-chev" aria-hidden="true"></i>';
  h3.textContent = ''; h3.appendChild(btn);
  const list = document.createElement('ul'); list.className = 'var-list'; list.setAttribute('role', 'listbox'); list.hidden = true;
  vars.forEach((v, i) => {
    const li = document.createElement('li'), ob = document.createElement('button');
    ob.type = 'button'; ob.setAttribute('role', 'option'); ob.dataset.i = i;
    ob.innerHTML = '<span></span><em></em>'; $('span', ob).textContent = v.label;
    li.appendChild(ob); list.appendChild(li);
  });
  wrap.appendChild(list);

  card._close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); wrap.classList.remove('open'); card.classList.remove('var-open'); };
  const open = () => { closeVars(card); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); wrap.classList.add('open'); card.classList.add('var-open'); };
  const paint = (i, quiet) => {
    const v = vars[i], it = PRICES[v.sku];
    $('.var-name', btn).textContent = v.label;
    if (cat && v.cat) cat.textContent = v.cat;
    if (v.hue) card.style.setProperty('--hue', v.hue);
    if (img && v.img && !img.src.endsWith(v.img)) { setImgSrc(img, v.img); if (v.alt) img.alt = v.alt; reskin3D(j3, img); }
    by.dataset.sku = v.sku;
    $('.buy-price b', by).textContent = fmt(it.price);
    $('.buy-price small', by).textContent = 'للكرتونة · ' + packTxt(it);
    $('input', by).value = 1; buySum(by);
    $$('.var-list button', wrap).forEach((b, k) => b.setAttribute('aria-selected', k === i ? 'true' : 'false'));
    if (!quiet) cartHook && cartHook();
  };
  card._tk = 0;
  card._setVar = (i, quiet) => {
    i = clamp(i, 0, vars.length - 1); const v = vars[i]; card._i = i;
    if (quiet || reduce) { paint(i, quiet); return; }
    const tk = ++card._tk;
    card.classList.add('swapping');
    const fade = new Promise(r => setTimeout(r, 230));
    const load = new Promise(r => {
      if (!(img && v.img && !img.src.endsWith(v.img))) return r();
      const pre = new Image(); pre.onload = pre.onerror = () => r(); pre.src = v.img;
      setTimeout(r, 1500);
    });
    Promise.all([fade, load]).then(() => {
      if (tk !== card._tk) return;
      paint(i, false);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (tk === card._tk) card.classList.remove('swapping'); }));
    });
  };
  btn.addEventListener('click', e => { e.stopPropagation(); list.hidden ? open() : card._close(); });
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && list.hidden) { e.preventDefault(); open(); const s0 = $('[aria-selected="true"]', list) || $('button', list); s0 && s0.focus(); } });
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); card._setVar(+b.dataset.i); card._close(); btn.focus(); });
  list.addEventListener('keydown', e => {
    const bs = $$('button', list), k = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); bs[(k + 1) % bs.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(k - 1 + bs.length) % bs.length].focus(); }
    else if (e.key === 'Escape') { card._close(); btn.focus(); }
  });
  card._setVar(0, true); varCards.push(card);
});
document.addEventListener('click', () => closeVars());
addEventListener('keydown', e => { if (e.key === 'Escape') closeVars(); });
/* تنبيه صغير جنب الصنف اللي اتضاف للسلة */
cartHook = () => varCards.forEach(card => {
  const bs = $$('.var-list button', card); let any = 0;
  card._vars.forEach((v, i) => { const n = cart[v.sku] || 0; any += n; const em = $('em', bs[i]); if (em) em.textContent = n ? 'في السلة: ' + n : ''; });
  card.classList.toggle('in-cart', any > 0);
});
cartHook();




/* =========================================================
   SOLID JUGS (WebGL) — جراكن العطور مجسّمة فعلًا
   كل جركن = شبكة 3D بتتفرد من خريطة عمق (assets/products/*-d.png) + صورة الوش + صورة ضهر بلاستيك،
   بإضاءة حقيقية (انعكاس ولمعة على الحواف المقوّسة). بتتمايل لوحدها، وبتلف لفّة كاملة 360° لما
   تتبدّل مع السكرول، وتقدر تمسكها بالماوس/الصباع وتلفّها بإيدك.
   لو المتصفح ما بيدعمش WebGL أو الصفحة مفتوحة file:// بترجع تلقائيًا للتجسيم القديم (build3D).
   ========================================================= */
const solids = [];

const M4 = {
  persp(f, a, n, fr) { const t = 1 / Math.tan(f / 2), nf = 1 / (n - fr); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fr + n) * nf, -1, 0, 0, 2 * fr * n * nf, 0]; },
  mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
  rotY(t) { const c = Math.cos(t), s = Math.sin(t); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  rotX(t) { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  trans(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; },
};
const VS = `attribute vec2 a_uv;uniform sampler2D u_depth;uniform mat4 u_mvp;uniform float u_side,u_aspect,u_dz;varying vec2 v_uv;
void main(){float h=texture2D(u_depth,a_uv).r;vec3 p=vec3((a_uv.x-.5)*u_aspect,.5-a_uv.y,u_side*h*u_dz);v_uv=a_uv;gl_Position=u_mvp*vec4(p,1.);}`;
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_tex,u_depth;uniform mat3 u_rot;uniform float u_side,u_aspect,u_dz,u_dim;uniform vec2 u_texel;varying vec2 v_uv;
void main(){
  vec4 c=texture2D(u_tex,v_uv);float al=smoothstep(.38,.7,c.a);if(al<.02)discard;
  float hx=texture2D(u_depth,v_uv+vec2(u_texel.x,0.)).r-texture2D(u_depth,v_uv-vec2(u_texel.x,0.)).r;
  float hy=texture2D(u_depth,v_uv+vec2(0.,u_texel.y)).r-texture2D(u_depth,v_uv-vec2(0.,u_texel.y)).r;
  float gx=u_dz*hx/(2.*u_texel.x*u_aspect),gy=-u_dz*hy/(2.*u_texel.y);
  vec3 n=normalize(u_rot*(u_side*vec3(-gx,-gy,1.)));
  vec3 L=normalize(vec3(-.45,.6,.7)),V=vec3(0.,0.,1.),Hh=normalize(L+V);
  float dif=max(dot(n,L),0.),spc=pow(max(dot(n,Hh),0.),46.),rim=pow(1.-max(n.z,0.),2.4);
  vec3 col=c.rgb*(.50+.62*dif)+vec3(spc*.34)+vec3(.55,.75,1.)*rim*.22;
  col*=u_dim;gl_FragColor=vec4(col*al,al);
}`;

function initGL(o, img) {
  const cvs = document.createElement('canvas'); cvs.className = 'jug-gl'; cvs.setAttribute('aria-hidden', 'true');
  const opt = { alpha: true, premultipliedAlpha: true, antialias: true, depth: true };
  const gl = cvs.getContext('webgl2', opt) || cvs.getContext('webgl', opt);
  if (!gl) throw new Error('no webgl');
  if (!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) throw new Error('no vtf');
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
  gl.useProgram(pr);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { mvp: U('u_mvp'), rot: U('u_rot'), side: U('u_side'), asp: U('u_aspect'), dz: U('u_dz'), dim: U('u_dim'), texel: U('u_texel'), tex: U('u_tex'), depth: U('u_depth') };
  /* شبكة */
  const C = 60, R = 90, uv = new Float32Array((C + 1) * (R + 1) * 2), idx = new Uint16Array(C * R * 6);
  for (let y = 0, k = 0; y <= R; y++) for (let x = 0; x <= C; x++) { uv[k++] = x / C; uv[k++] = y / R; }
  for (let y = 0, k = 0; y < R; y++) for (let x = 0; x < C; x++) { const a = y * (C + 1) + x, b = a + 1, c = a + C + 1, d = c + 1; idx.set([a, c, b, b, c, d], k); k += 6; }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a_uv'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  /* خامات */
  const src = img.currentSrc || img.src, base = src.replace(/\.webp.*$/, '');
  const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const texs = {}, need = { front: src, back: base + '-b.webp', depth: base + '-d.png' };
  let left = 3, failed = false;
  Object.keys(need).forEach((k, i) => {
    const im = new Image(); im.onload = () => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); } catch (e) { failed = true; }
      const mip = isGL2 && k !== 'depth';
      if (mip && !failed) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texs[k] = { t, i, w: im.naturalWidth, h: im.naturalHeight };
      if (--left === 0) { if (failed) return o.fail(); o.ready = true; img.style.opacity = '0'; o.inn.classList.add('gl-on'); }
    };
    im.onerror = () => { if (!failed) { failed = true; o.fail(); } };
    im.src = need[k];
  });
  o.inn.insertBefore(cvs, img);
  const dz = .15, aspect = (img.getAttribute('width') || 616) / (img.getAttribute('height') || 900);
  o.size = () => {
    const w = o.sj.offsetWidth, h = o.sj.offsetHeight; if (!w) return;
    const pr_ = Math.min(devicePixelRatio || 1, lite ? 1 : 2);
    cvs.width = Math.round(w * 1.28 * pr_); cvs.height = Math.round(h * 1.16 * pr_);
  };
  o.draw = (ryDeg, rxDeg, dim) => {
    if (!o.ready || !cvs.width) return;
    const fov = 26 * Math.PI / 180, ca = cvs.width / cvs.height, d = (1.16 / (2 * Math.tan(fov / 2)));
    const R_ = M4.mul(M4.rotX(rxDeg * Math.PI / 180), M4.rotY(ryDeg * Math.PI / 180));
    const mvp = M4.mul(M4.persp(fov, ca, .1, 10), M4.mul(M4.trans(0, 0, -d), R_));
    const rot3 = [R_[0], R_[1], R_[2], R_[4], R_[5], R_[6], R_[8], R_[9], R_[10]];
    gl.viewport(0, 0, cvs.width, cvs.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.uniformMatrix4fv(u.mvp, false, mvp); gl.uniformMatrix3fv(u.rot, false, rot3);
    gl.uniform1f(u.asp, aspect); gl.uniform1f(u.dz, dz); gl.uniform1f(u.dim, dim);
    gl.uniform2f(u.texel, 1 / texs.depth.w, 1 / texs.depth.h); gl.uniform1i(u.depth, texs.depth.i);
    gl.uniform1f(u.side, 1); gl.uniform1i(u.tex, texs.front.i); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(u.side, -1); gl.uniform1i(u.tex, texs.back.i); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  };
  o.size();
}
function buildSolid(img, idx, scene) {
  const sj = img.closest('.sj'), inn = img.closest('.sj-in');
  const sh = document.createElement('i'); sh.className = 'jug-shadow'; inn.insertBefore(sh, img);
  const o = { sj, inn, sh, idx, scene, spin: 0, drag: 0, dragV: 0, grab: false, moved: 0, ph: rand(0, 6.28), ready: false, size() {}, draw() {}, fail() { if (o.dead) return; o.dead = true; o.ready = false; sh.remove(); build3D(img); } };
  try { initGL(o, img); } catch (e) { console.warn('jug3d: WebGL غير متاح — رجوع للتجسيم القديم', e); o.fail(); return null; }
  let sx = 0;
  sj.addEventListener('pointerdown', e => { o.grab = true; o.moved = 0; sx = e.clientX; o.dragV = 0; sj.setPointerCapture && sj.setPointerCapture(e.pointerId); });
  sj.addEventListener('pointermove', e => { if (!o.grab) return; const dx = e.clientX - sx; sx = e.clientX; o.moved += Math.abs(dx); o.drag = clamp(o.drag + dx * .2, -20, 20); });   /* سحب محدود ±20° ويرجع لوحده */
  const up = () => { o.grab = false; };
  sj.addEventListener('pointerup', up); sj.addEventListener('pointercancel', up);
  sj.addEventListener('click', e => { if (o.moved > 6) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  solids.push(o); return o;
}
/* أقسام مزيل الدهون بتعرض صور العلب الأصلية مسطّحة (التجسيم كان بيشوّه شكلها) */
/* تم إيقاف مجسّم WebGL — الجراكن بتتعرض بصورة العلبة الأصلية النظيفة (أفضل شكل وأخف). لإرجاعه: شيل علامة الكومنت اللي تحت. */
// scenes.forEach(S => { if (!S.sec.classList.contains('dish')) S.jugs.forEach((j, i) => buildSolid($('img', j), i, S)); });
const sizeSolids = () => solids.forEach(o => o.size());
addEventListener('resize', sizeSolids); addEventListener('load', sizeSolids);
if ('ResizeObserver' in window) { const ro = new ResizeObserver(sizeSolids); $$('.sj').forEach(e => ro.observe(e)); }
let lastSolidIdx = -1;
function spinJugs(time) {
  requestAnimationFrame(spinJugs);
  if (document.hidden || !solids.length) return;
  const dt = Math.min(3, (time - (spinJugs.t || time)) / 16.67 || 1); spinJugs.t = time;   /* ثبات السرعة على أي معدّل إطارات */
  if (lite && time - (spinJugs.l || 0) < 32) return; spinJugs.l = time;
  for (const o of solids) {
    const S = o.scene; if (!S.visible) continue;
    const dd = S.d(o.idx), ad = Math.abs(dd); if (ad > 1.7) continue;
    const active = o.idx === S.idx, side = dd < 0 ? -1 : 1;
    const sway = reduce ? 0 : Math.sin(time / 4200 + o.ph) * (active ? 1 : .6);   /* تمايل ناعم جدًا */
    if (!o.grab) o.drag *= Math.pow(.9, dt);   /* بعد ما تسيبه: يرجع لوضعه بهدوء */
    const ry = sway + o.drag - (active ? 0 : 2.5 * side);
    const rx = -2 + (reduce ? 0 : Math.sin(time / 5000 + o.ph * 1.7) * .4) + S.tiltY * -.8;
    o.draw(ry, rx, 1 - Math.min(ad, 1) * .12);
    const a = ((ry % 360) + 540) % 360 - 180;
    o.sh.style.transform = `translateX(-50%) scaleX(${(1 + Math.abs(Math.sin(a * Math.PI / 180)) * .08).toFixed(3)})`;
  }
}
requestAnimationFrame(spinJugs);

/* نشغّل الحركة بس على اللي ظاهر، ونفضّي الطبقات من الذاكرة لو بعيد عن الشاشة */
if ('IntersectionObserver' in window) {
  const byEl = new Map(p3ds.map(o => [o.host, o]));
  const ioLive = new IntersectionObserver(es => es.forEach(e => { byEl.get(e.target).live = e.isIntersecting; }), { rootMargin: '60px' });
  const ioMem = new IntersectionObserver(es => es.forEach(e => { e.target.classList.toggle('off', !e.isIntersecting); if (e.isIntersecting) size3D(byEl.get(e.target)); }), { rootMargin: '120% 0px' });
  p3ds.forEach(o => { ioLive.observe(o.host); ioMem.observe(o.host); });
} else p3ds.forEach(o => { o.live = true; o.host.classList.remove('off'); });
if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => resize3D()); p3ds.forEach(o => ro.observe(o.host)); }
addEventListener('load', resize3D);

let last3d = 0;
function loop3d(time) {
  requestAnimationFrame(loop3d);
  if (document.hidden) return;
  if (lite && time - last3d < 32) return; last3d = time;
  for (const o of p3ds) {
    if (!o.live) continue;
    const k = o.k || 1;
    let ty = (-14 + Math.sin(time / 2100 + o.ph) * 9) * k, tx = (2 + Math.sin(time / 2700 + o.ph * 1.3) * 2.5) * k;
    if (hasPtr) {
      const r = o.host.getBoundingClientRect();
      const dx = clamp((mx - (r.left + r.width / 2)) / (vw * .55), -1, 1), dy = clamp((my - (r.top + r.height / 2)) / (vh * .55), -1, 1);
      ty = -dx * 26 * (o.k || 1) - 4; tx = -dy * 12 * (o.k || 1) + 2;
    }
    o.ry = lerp(o.ry, ty, hasPtr ? .14 : .06); o.rx = lerp(o.rx, tx, .08);
    o.inn.style.transform = `rotateY(${o.ry.toFixed(2)}deg) rotateX(${o.rx.toFixed(2)}deg)`;
    o.host.style.setProperty('--gx', clamp(50 - o.ry * 3.2, -25, 125).toFixed(1) + '%');
  }
}
if (!reduce) requestAnimationFrame(loop3d);

/* =========================================================
   FX canvas — rising bubbles & glints
   ========================================================= */
const cv = $('#fx'), cx = cv.getContext('2d');
let dpr = 1, bubbles = [];

/* ---------- فقاقيع الماوس / الصباع ---------- */
const trail = [], pops = [], MAXT = lite ? 8 : 20;
let ptrIn = false, ptrX = 0, ptrY = 0, lbx = -1, lby = -1, bAcc = 0, lastIdle = 0, lastFx = 0;
function spawnBubble(x, y, speed, ang) {
  const burst = ang != null, sp = burst ? rand(1.2, 3) : 0;
  trail.push({
    x, y, r: rand(4, 11) + clamp((speed || 0) * .1, 0, 6),
    vx: burst ? Math.cos(ang) * sp : rand(-.3, .3), vy: burst ? Math.sin(ang) * sp - .5 : -rand(.35, .95),
    ph: rand(0, 6.28), wf: rand(.0016, .0032), age: 0, max: rand(1500, 2900), hue: rand(0, 360), burst
  });
}
function burstAt(x, y, n) { for (let i = 0; i < n && trail.length < MAXT + 10; i++) spawnBubble(x, y, 0, (i / n) * 6.283 + rand(-.3, .3)); }
function popAt(b, bx) {
  pops.push({ x: bx, y: b.y, r: b.r, age: 0, hue: b.hue, a: rand(0, 6.28) });
}
function movePtr(x, y, touch) {
  ptrX = x; ptrY = y; ptrIn = true; mx = x; my = y; hasPtr = true;
  if (lbx < 0) { lbx = x; lby = y; }
  const d = Math.hypot(x - lbx, y - lby); bAcc += d; lbx = x; lby = y;
  const step = touch ? 60 : 44;
  while (bAcc > step) { bAcc -= step; if (trail.length < MAXT) spawnBubble(x + rand(-7, 7), y + rand(-7, 7), d); }
  if (bAcc > step * 3) bAcc = 0;
}
if (!reduce) {
  addEventListener('pointermove', e => { if (e.pointerType !== 'touch') movePtr(e.clientX, e.clientY, false); }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') burstAt(e.clientX, e.clientY, 4); }, { passive: true });
  /* لمس: فقاعات بس عند «الضغطة» السريعة. أثناء السحب/السكرول مفيش فقاقيع (كانت بتتنافس مع السكرول وتهنّج) */
  let tx0 = 0, ty0 = 0, tt0 = 0, tmv = 0;
  addEventListener('touchstart', e => { const t = e.touches[0]; if (!t) return; tx0 = t.clientX; ty0 = t.clientY; tt0 = performance.now(); tmv = 0; mx = t.clientX; my = t.clientY; hasPtr = true; }, { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) tmv = Math.max(tmv, Math.hypot(t.clientX - tx0, t.clientY - ty0)); }, { passive: true });
  const endTouch = e => {
    hasPtr = false; ptrIn = false; lbx = -1;
    if (e && e.type === 'touchend' && tmv < 10 && performance.now() - tt0 < 350 && !ultra) burstAt(tx0, ty0, 3);
  };
  addEventListener('touchend', endTouch, { passive: true }); addEventListener('touchcancel', endTouch, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { ptrIn = false; hasPtr = false; lbx = -1; });
}
/* الفقاقيع بتترسم مرة واحدة كـ sprite وبعدين drawImage (بدل إنشاء gradient لكل فقاعة في كل فريم — ده كان تقيل جدًا على الموبايل) */
const SPR = 64, spriteCache = {};
function makeSprite(hue) {
  const c = document.createElement('canvas'); c.width = c.height = SPR;
  const g = c.getContext('2d'), m = SPR / 2, R = m - 3;
  const fill = g.createRadialGradient(m - R * .25, m - R * .3, R * .1, m, m, R);
  fill.addColorStop(0, 'rgba(255,255,255,.05)'); fill.addColorStop(.72, 'rgba(160,225,255,.12)'); fill.addColorStop(.93, 'rgba(215,242,255,.36)'); fill.addColorStop(1, 'rgba(255,255,255,.55)');
  g.beginPath(); g.arc(m, m, R, 0, 6.283); g.fillStyle = fill; g.fill();
  if (hue == null) { g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.6)'; }
  else {
    const rg = g.createLinearGradient(m - R, m - R, m + R, m + R);
    rg.addColorStop(0, `hsla(${hue},95%,78%,.85)`); rg.addColorStop(.5, 'rgba(255,255,255,.18)'); rg.addColorStop(1, `hsla(${(hue + 150) % 360},95%,78%,.8)`);
    g.lineWidth = 3; g.strokeStyle = rg;
  }
  g.stroke();
  g.beginPath(); g.ellipse(m - R * .36, m - R * .4, R * .24, R * .12, -.7, 0, 6.283); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill();
  g.beginPath(); g.arc(m + R * .4, m + R * .42, R * .08, 0, 6.283); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
  return c;
}
const sprite = hue => { const k = hue == null ? 'w' : Math.round(hue / 40) % 9; return spriteCache[k] || (spriteCache[k] = makeSprite(hue == null ? null : (k * 40))); };
function drawTrail(time) {
  const dt = Math.min(48, time - lastFx || 16); lastFx = time;
  if (ptrIn && !touchDev && time - lastIdle > 1300 && trail.length < MAXT) { lastIdle = time; spawnBubble(ptrX + rand(-10, 10), ptrY + rand(-6, 6), 0); }
  const k = dt / 16;
  for (let i = trail.length - 1; i >= 0; i--) {
    const b = trail[i];
    b.age += dt; b.x += b.vx * k; b.y += b.vy * k;
    if (b.burst) { b.vx *= Math.pow(.96, k); b.vy = b.vy * Math.pow(.96, k) - .012 * k; } else b.vy = Math.max(-1.3, b.vy - .002 * k);
    const bx = b.x + Math.sin(b.age * b.wf + b.ph) * b.r * .8;
    const R = b.r * (1 + b.age / b.max * .14);
    const hit = ptrIn && b.age > 380 && Math.hypot(ptrX - bx, ptrY - b.y) < R + 3;
    if (b.age >= b.max || b.y < -30 || hit) { popAt(b, bx); trail.splice(i, 1); continue; }
    cx.globalAlpha = Math.min(1, b.age / 140) * (1 - clamp((b.age - b.max * .88) / (b.max * .12)));
    cx.drawImage(sprite(b.hue), bx - R * 1.1, b.y - R * 1.1, R * 2.2, R * 2.2);
  }
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]; p.age += dt;
    const u = p.age / 260; if (u >= 1) { pops.splice(i, 1); continue; }
    cx.globalAlpha = 1 - u;
    cx.beginPath(); cx.arc(p.x, p.y, p.r * (1 + u * .9), 0, 6.283); cx.lineWidth = 1.6 * (1 - u) + .4; cx.strokeStyle = `hsla(${p.hue},90%,85%,.9)`; cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.95)';
    for (let j = 0; j < 6; j++) { const a = p.a + j * 1.047, d = p.r * (1 + u * 1.9); cx.beginPath(); cx.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 1.6 * (1 - u) + .3, 0, 6.283); cx.fill(); }
  }
  cx.globalAlpha = 1;
}
function sizeCanvas() {
  dpr = Math.min(devicePixelRatio || 1, matchMedia('(hover:none)').matches ? 1 : 1.5);
  cv.width = vw * dpr; cv.height = vh * dpr;
  const n = vw < 700 ? 5 : 11;
  bubbles = Array.from({ length: n }, () => mkBubble(true));
}
function mkBubble(init) {
  return { x: rand(0, vw), y: init ? rand(0, vh) : vh + rand(20, 200), r: rand(3, 16), sp: rand(.18, .55), ph: rand(0, 6.28), sw: rand(8, 26), a: rand(.25, .55) };
}
let fxPrev = 0;
function fx(time) {
  if (ultra) return;                                   /* وضع ultra: الفقاقيع واقفة خالص */
  if (document.hidden) { fxPrev = 0; return requestAnimationFrame(fx); }
  /* الموبايل: 30 فريم/ث للفقاقيع بدل 60 — نص الشغل ومش بتتفرق بالعين */
  if (lite && time - fxPrev < 30) return requestAnimationFrame(fx);
  const kk = fxPrev ? clamp((time - fxPrev) / 16.67, .5, 3) : 1; fxPrev = time;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, vw, vh);
  const boost = clamp(Math.abs(scrollVel) * .03, 0, 1.2), spr = sprite(null);
  for (const b of bubbles) {
    b.y -= (b.sp * (1 + boost) + (scrollVel > 0 ? 0 : -scrollVel * .1)) * kk;
    const x = b.x + Math.sin(time / 1400 + b.ph) * b.sw;
    if (b.y < -40) Object.assign(b, mkBubble(false));
    cx.globalAlpha = b.a; cx.drawImage(spr, x - b.r * 1.1, b.y - b.r * 1.1, b.r * 2.2, b.r * 2.2);
  }
  cx.globalAlpha = 1;
  drawTrail(time);
  requestAnimationFrame(fx);
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */
fitScene(); sizeCanvas(); chrome();
/* أي قسم برا الشاشة: نوقف الأنيميشن الدايم بتاعه (دخان/بخار/جسيمات/لمعة...) — كانت شغالة طول الوقت حتى وهي مش ظاهرة */
if ('IntersectionObserver' in window) {
  const ioOff = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-off', !e.isIntersecting)), { rootMargin: '120px 0px' });
  $$('main > section, main > .ribbon, footer.footer').forEach(el => ioOff.observe(el));
}
if (!reduce) requestAnimationFrame(fx);
/* رقم الدعم الفني في الفوتر (من CONFIG.WHATSAPP_NUMBER) */
{
  const num = (CONFIG.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const a = $('#supportLink'), n = $('#supportNum');
  if (a && num) {
    a.href = 'https://wa.me/' + num; a.target = '_blank'; a.rel = 'noopener';
    if (n) { n.textContent = '+' + num; n.hidden = false; }
  }
}
/* الرجوع للأعلى / اللوجو: قفزة فورية بدل سكرول طويل يمرّ على المشهد كله */
$$('.to-top, .brand').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); scrollTo({ top: 0, behavior: 'instant' }); history.replaceState(null, '', location.pathname + location.search);
}));
requestAnimationFrame(frame);
addEventListener('load', () => { fitScene(); ticking = true; });
document.fonts && document.fonts.ready.then(() => { fitScene(); });
})();
