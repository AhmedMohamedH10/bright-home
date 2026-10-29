/* =========================================================
   Bright Home — برايت هوم · main.js
   ========================================================= */

/* ---------------------------------------------------------
   ⚙️ الإعدادات — غيّر رقم واتساب هنا فقط
   الصيغة الدولية بدون + أو مسافات. مثال مصر: 201012345678
   --------------------------------------------------------- */
const CONFIG = {
  WHATSAPP_NUMBER: '',   // ← ضع رقم واتساب برايت هنا
};

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
const lite = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
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
      const s = document.createElement('span'); s.className = i < brand ? 'w br' : 'w'; s.textContent = w;
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
function chrome() {
  const y = scrollY, max = document.documentElement.scrollHeight - vh;
  header.classList.toggle('stuck', y > 40);
  progBar.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
  if (mCta) {
    const r = orderSec.getBoundingClientRect();
    const inScent = scTrackEls.some(t => { const sr = t.getBoundingClientRect(); return sr.top < vh * .5 && sr.bottom > vh * .5; });
    mCta.classList.toggle('on', y > 120 && !(r.top < vh * .6) && !inScent);
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
const cls = $$('.cl', clothes);
const clPos = cls.map(c => { const cs = getComputedStyle(c); return [parseFloat(cs.getPropertyValue('--x')) || 0, parseFloat(cs.getPropertyValue('--y')) || 0]; });
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
}

let heroTarget = 0, heroP = 0;          /* px اللي اتسكرلت جوه الهيرو */
const heroSpan = () => vh * .85;        /* المسافة اللي الغسالة بتخلّص فيها دورتها (عدّاد/مية) */
function heroProgress() {
  const r = hero.getBoundingClientRect();
  heroTarget = clamp(-r.top, 0, Math.max(0, r.height));
  return r;
}
const modes = [[.15, 'FILL'], [.45, 'WASH'], [.65, 'RINSE'], [.88, 'SPIN'], [2, 'END']];
function updateHero(time) {
  const ps = clamp(heroP / heroSpan()), t = ps;

  /* الدرام والهدوم بتلف مع السكرول مباشرة (طالع ونازل) */
  const ang = heroP * 1.7;
  drum.style.transform = `rotate(${ang}deg)`;
  clothes.style.transform = `rotate(${ang * .55}deg)`;
  cls.forEach((c, i) => {
    const [sx, sy] = clPos[i];
    const a = ang * (.9 + i * .07) + i * 60;
    const dx = Math.sin(a / 38 + i) * 16, dy = Math.cos(a / 44 + i * 1.7) * 14;
    c.style.transform = `translate(${sx + dx}px,${sy + dy}px) rotate(${-ang * .55 + a * .5}deg)`;
  });

  /* water */
  let lvl = 0;
  if (t < .15) lvl = (t / .15) * .5; else if (t < .6) lvl = .5; else if (t < .86) lvl = .5 * (1 - (t - .6) / .26);
  water.style.height = (lvl * 100) + '%';
  foam.style.opacity = (t > .1 && t < .72) ? 1 : 0;

  /* display */
  const remain = Math.max(0, Math.round(42 * (1 - t)));
  timeEl.textContent = '00:' + String(remain).padStart(2, '0');
  modeEl.textContent = (modes.find(m => t < m[0]) || modes[4])[1];
  knob.style.transform = `rotate(${t * 540}deg)`;

  /* shake during SPIN */
  const sp = clamp((t - .64) / .06) * (1 - clamp((t - .88) / .06));
  const sh = reduce ? 0 : sp;
  washer.style.translate = `${Math.sin(time / 32) * 2.2 * sh}px ${Math.cos(time / 40) * 1.2 * sh}px`;
  washer.style.rotate = `${Math.sin(time / 46) * .35 * sh}deg`;

  /* التلميح يختفي أول ما العميل يبدأ ينزل؛ باقي العناصر بتتحرك مع الصفحة عادي */
  if (hintEl) { hintEl.style.animation = heroP > 8 ? 'none' : ''; hintEl.style.opacity = heroP > 8 ? 0 : ''; }
  meter.style.transform = `scaleX(${clamp(heroP / Math.max(1, vh))})`;
}

/* =========================================================
   STORY — statement words light up with scroll
   ========================================================= */
const stWords = $$('#statement .w'), stEl = $('#statement');
function updateStatement() {
  if (!stEl) return;
  const r = stEl.getBoundingClientRect();
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp((vh * .82 - r.top) / (r.height + vh * .32));
  const n = Math.round(p * stWords.length * 1.15);
  stWords.forEach((w, i) => w.classList.toggle('on', i < n));
}

/* =========================================================
   SCENTS — pinned scene, jugs swap with scroll
   ========================================================= */
/* كل .scent مشهد مستقل (عطور اليدين / 2 لتر / 4 لتر / 20 لتر): تراك مثبّت + جراكن بتتبدّل مع السكرول */
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
    'fx-bub': [18, el => { el.style.left = rand(2, 96) + '%'; el.style.setProperty('--s', rand(14, 44) + 'px'); el.style.setProperty('--t', rand(8, 15) + 's'); el.style.setProperty('--dl', (-rand(0, 15)) + 's'); el.style.setProperty('--dx', rand(-90, 90) + 'px'); }],
  };
  $$('.sc-fx > div', sec).forEach(box => {
    for (const k in FX) if (box.classList.contains(k)) {
      const [n, fn] = FX[k], cnt = lite ? Math.ceil(n * .6) : n;
      for (let i = 0; i < cnt; i++) { const el = document.createElement('i'); fn(el, i); box.appendChild(el); }
    }
  });

  /* التقدّم مع السكرول: كل جركن ليه شريحة، والتبديل بيحصل في آخر 38% منها */
  S.progress = () => {
    const r = S.track.getBoundingClientRect(), n = S.n;
    const p = clamp(-r.top / (r.height - vh));
    const seg = Math.min(n - 1, Math.floor(p * n)), u = p * n - seg;
    let f = seg;
    if (seg < n - 1) f += smooth(clamp((u - .62) / .38));
    S.T = Math.max(0, f);
    return r;
  };
  S.update = () => {
    S.F = lerp(S.F, S.T, .12);
    if (Math.abs(S.F - S.T) < .0005) S.F = S.T;
    const idx = Math.round(S.F);
    if (idx !== S.idx) {
      S.idx = idx; S.stage.dataset.i = idx;
      S.panels.forEach((p, i) => p.classList.toggle('is-on', i === idx));
      if (S.count) S.count.textContent = `0${idx + 1} / 0${S.n}`;
    }
    const w = S.jugs[0].offsetWidth || 300;
    S.tiltX = lerp(S.tiltX, S.tX, .08); S.tiltY = lerp(S.tiltY, S.tY, .08);
    S.jugs.forEach((j, i) => {
      const d = i - S.F, ad = Math.abs(d);
      const x = -d * w * .78, z = -ad * 160, k = 1 - Math.min(ad, 1.4) * .26;
      j.style.transform = `translate3d(calc(-50% + ${x}px),-50%,${z}px) rotateY(${-d * 16 + S.tiltX * 5}deg) rotateX(${S.tiltY * -3}deg) scale(${k})`;
      j.style.opacity = clamp(1 - ad * .5, 0, 1);
      j.style.zIndex = 10 - Math.round(ad * 3);
      j.style.filter = ad > .4 ? `brightness(${1 - Math.min(ad, 1) * .45})` : '';
    });
    if (S.hint) S.hint.style.opacity = S.T < .05 && S.F < .05 ? 1 : 0;
  };
  S.go = i => {
    const r = S.track.getBoundingClientRect();
    const top = scrollY + r.top, span = r.height - vh;
    scrollTo({ top: top + ((i + .32) / S.n) * span, behavior: 'smooth' });
  };
  S.dots.forEach((b, i) => b.addEventListener('click', () => S.go(i)));
  S.jugs.forEach((b, i) => b.addEventListener('click', () => S.go(i)));
  if (finePointer) S.stage.addEventListener('pointermove', e => { const r = S.box.getBoundingClientRect(); S.tX = ((e.clientX - r.left) / r.width - .5) * 2; S.tY = ((e.clientY - r.top) / r.height - .5) * 2; }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { S.visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(S.stage);
  return S;
});

/* =========================================================
   MAIN SCROLL LOOP
   ========================================================= */
let ticking = true, scrollVel = 0, lastY = scrollY, heroWasVisible = true;
addEventListener('scroll', () => { ticking = true; }, { passive: true });
let lastW = innerWidth, lastH = innerHeight;
addEventListener('resize', () => {
  const dW = Math.abs(innerWidth - lastW), dH = Math.abs(innerHeight - lastH);
  /* على الموبايل: ظهور/اختفاء شريط المتصفح بيغيّر الارتفاع بس — منعيدش بناء المشهد */
  if (dW < 2 && dH < 170 && matchMedia('(hover:none)').matches) {
    vh = innerHeight; ticking = true;
    if (cv.height < vh * dpr) cv.height = vh * dpr;
    return;
  }
  lastW = innerWidth; lastH = innerHeight;
  fitScene(); ticking = true; sizeCanvas(); movePill(); resize3D();
});

function frame(time) {
  const y = scrollY; scrollVel = lerp(scrollVel, y - lastY, .2); lastY = y;
  const hr = heroProgress();
  const heroVisible = hr.bottom > -50 && hr.top < vh + 50;
  /* الغسالة ماشية مع السكرول مباشرة (طالع/نازل). لو القفزة كبيرة أو المشهد كان برا الشاشة
     نعمل snap فوري بدل ما نعيد تشغيل الأنيميشن ونسيبه يكمّل لوحده. */
  if (reduce || !heroWasVisible || Math.abs(heroTarget - heroP) > vh * .12) heroP = heroTarget;
  else heroP = lerp(heroP, heroTarget, .5);
  if (Math.abs(heroTarget - heroP) < .5) heroP = heroTarget;
  heroWasVisible = heroVisible;
  const scNear = [];
  for (const S of scenes) { const r = S.progress(); if (r.bottom > -50 && r.top < vh + 50) scNear.push(S); }
  if (ticking || Math.abs(heroTarget - heroP) > .3 || heroVisible) {
    chrome();
    if (heroVisible) updateHero(time);
    updateStatement();
  }
  for (const S of scNear) S.update();
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
fBtns.forEach(b => b.addEventListener('click', () => {
  if (b.classList.contains('is-on')) return;
  fBtns.forEach(x => x.classList.toggle('is-on', x === b)); movePill();
  const f = b.dataset.f;
  const first = new Map(cards.map(c => [c, c.hidden ? null : c.getBoundingClientRect()]));
  cards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
  cards.forEach(c => {
    if (c.hidden) return;
    c.classList.add('in');
    const a = first.get(c), l = c.getBoundingClientRect();
    if (!c.animate) return;
    if (a) c.animate([{ transform: `translate(${a.left - l.left}px,${a.top - l.top}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
    else c.animate([{ opacity: 0, transform: 'translateY(30px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
}));
requestAnimationFrame(movePill); addEventListener('load', movePill);
document.fonts && document.fonts.ready.then(movePill);

if (finePointer) {
  cards.forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((x - .5) * -10).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((y - .5) * 10).toFixed(2) + 'deg');
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
  $$('.magnetic').forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .28}px)`;
    });
    m.addEventListener('pointerleave', () => { m.style.transform = ''; });
  });
}

/* =========================================================
   ORDER — product buttons, quantity, WhatsApp
   ========================================================= */
const form = $('#orderForm'), sel = $('#fProduct'), qVal = $('#qVal'), note = $('#formNote');
let qty = 1;
const setQty = n => { qty = clamp(n, 1, 99); qVal.textContent = qty; };
$('#qMinus').addEventListener('click', () => setQty(qty - 1));
$('#qPlus').addEventListener('click', () => setQty(qty + 1));

function pickProduct(name) {
  const opt = [...sel.options].find(o => o.textContent.trim() === name);
  if (opt) sel.value = opt.value;
  orderSec.scrollIntoView({ behavior: 'smooth' });
  toast('تم اختيار: ' + name);
}
$$('.order-product, .kp').forEach(b => b.addEventListener('click', () => pickProduct(b.dataset.product)));

form.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get('name') || '').toString().trim();
  const phone = (fd.get('phone') || '').toString().trim();
  const address = (fd.get('address') || '').toString().trim();
  const product = (fd.get('product') || '').toString().trim();
  const extra = (fd.get('note') || '').toString().trim();

  let bad = null;
  const mark = (id, cond) => { const f = $('#' + id).closest('.field'); f.classList.toggle('err', cond); if (cond && !bad) bad = $('#' + id); };
  mark('fName', name.length < 2);
  mark('fPhone', phone.replace(/\D/g, '').length < 8);
  mark('fAddress', address.length < 5);
  if (bad) { bad.focus(); toast('من فضلك كمّل البيانات المطلوبة'); return; }

  const msg = `السلام عليكم، عاوز أطلب من برايت هوم 🌿\n\nالاسم: ${name}\nرقم الموبايل: ${phone}\nالعنوان: ${address}\nالمنتج: ${product}\nالكمية: ${qty}\n${extra ? 'ملاحظات: ' + extra + '\n' : ''}\nمن فضلكم أكدوا التوفر والسعر والتوصيل. شكرًا.`;
  const num = (CONFIG.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(num)) {
    note.classList.add('warn');
    note.textContent = 'رقم واتساب لسه مش متضاف في الموقع (CONFIG في js/main.js). الرسالة اتنسخت — ابعتها يدويًا لرقم برايت.';
    (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => toast('تم نسخ رسالة الطلب ✓'), () => toast('رقم واتساب غير مُضاف بعد'));
    return;
  }
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
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
cards.forEach((card, i) => {
  const vis = card.querySelector('.c-vis'), img = vis && vis.querySelector('img:not(.c-boxes)');
  if (!vis || !img) return;
  const boxes = vis.querySelector('.c-boxes');
  const stage = document.createElement('span'); stage.className = 'c-stage';
  const floor = document.createElement('i'); floor.className = 'c-floor'; floor.setAttribute('aria-hidden', 'true');
  vis.insertBefore(stage, img);
  stage.appendChild(floor); if (boxes) stage.appendChild(boxes); stage.appendChild(img);
  const j3 = build3D(img); if (j3) j3.k = .4;   /* ميل الجركن جوه الكارت خفيف عشان الطبقات ما تبانش */
  const s = { card, stage, j3, ry: 0, rx: 0, ty: 0, tx: 0, inside: false, live: false, ph: i * 1.3 };
  card.addEventListener('pointerenter', () => { s.inside = true; });
  card.addEventListener('pointerleave', () => { s.inside = false; });
  card.addEventListener('pointermove', e => {
    const r = vis.getBoundingClientRect();
    s.ty = clamp((e.clientX - r.left) / r.width - .5, -.7, .7) * 12;
    s.tx = clamp((e.clientY - r.top) / r.height - .5, -.7, .7) * -7;
  }, { passive: true });
  cardScenes.push(s);
});
if ('IntersectionObserver' in window) {
  const bs = new Map(cardScenes.map(s => [s.card, s]));
  const io = new IntersectionObserver(es => es.forEach(e => { bs.get(e.target).live = e.isIntersecting; }), { rootMargin: '60px' });
  cardScenes.forEach(s => io.observe(s.card));
} else cardScenes.forEach(s => { s.live = true; });
let lastCard = 0;
function cardLoop(time) {
  requestAnimationFrame(cardLoop);
  if (document.hidden) return;
  if (lite && time - lastCard < 32) return; lastCard = time;
  for (const s of cardScenes) {
    if (!s.live) continue;
    const ty = s.inside ? s.ty : Math.sin(time / 3200 + s.ph) * 3, tx = s.inside ? s.tx : -2 + Math.sin(time / 4100 + s.ph * 1.7) * 1.2;
    s.ry = lerp(s.ry, ty, s.inside ? .1 : .04); s.rx = lerp(s.rx, tx, .07);
    s.stage.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
  }
}
if (!reduce) requestAnimationFrame(cardLoop);



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
scenes.forEach(S => S.jugs.forEach((j, i) => buildSolid($('img', j), i, S)));
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
    const ad = Math.abs(o.idx - S.F); if (ad > 1.7) continue;
    const active = o.idx === S.idx, side = o.idx < S.F ? -1 : 1;
    const sway = reduce ? 0 : Math.sin(time / 2800 + o.ph) * (active ? 3.2 : 1.8);   /* تمايل ناعم جدًا */
    if (!o.grab) o.drag *= Math.pow(.9, dt);   /* بعد ما تسيبه: يرجع لوضعه بهدوء */
    const ry = sway + o.drag - (active ? 3 : 6 * side);
    const rx = -2 + (reduce ? 0 : Math.sin(time / 3400 + o.ph * 1.7) * 1.1) + S.tiltY * -2.5;
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
const trail = [], pops = [], MAXT = lite ? 28 : 64;
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
  const step = touch ? 24 : 15;
  while (bAcc > step) { bAcc -= step; if (trail.length < MAXT) spawnBubble(x + rand(-7, 7), y + rand(-7, 7), d); }
  if (bAcc > step * 3) bAcc = 0;
}
if (!reduce) {
  addEventListener('pointermove', e => { if (e.pointerType !== 'touch') movePtr(e.clientX, e.clientY, false); }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') burstAt(e.clientX, e.clientY, 7); }, { passive: true });
  addEventListener('touchstart', e => { const t = e.touches[0]; if (!t) return; lbx = t.clientX; lby = t.clientY; ptrX = mx = t.clientX; ptrY = my = t.clientY; ptrIn = hasPtr = true; burstAt(t.clientX, t.clientY, 5); }, { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) movePtr(t.clientX, t.clientY, true); }, { passive: true });
  const endTouch = () => { lbx = -1; ptrIn = false; hasPtr = false; };
  addEventListener('touchend', endTouch, { passive: true }); addEventListener('touchcancel', endTouch, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { ptrIn = false; hasPtr = false; lbx = -1; });
}
function drawTrail(time) {
  const dt = Math.min(48, time - lastFx || 16); lastFx = time;
  if (ptrIn && !('ontouchstart' in window && !finePointer) && time - lastIdle > 380 && trail.length < MAXT) { lastIdle = time; spawnBubble(ptrX + rand(-10, 10), ptrY + rand(-6, 6), 0); }
  const k = dt / 16;
  for (let i = trail.length - 1; i >= 0; i--) {
    const b = trail[i];
    b.age += dt; b.x += b.vx * k; b.y += b.vy * k;
    if (b.burst) { b.vx *= Math.pow(.96, k); b.vy = b.vy * Math.pow(.96, k) - .012 * k; } else b.vy = Math.max(-1.3, b.vy - .002 * k);
    const bx = b.x + Math.sin(b.age * b.wf + b.ph) * b.r * .8;
    const R = b.r * (1 + b.age / b.max * .14);
    const hit = ptrIn && b.age > 380 && Math.hypot(ptrX - bx, ptrY - b.y) < R + 3;
    if (b.age >= b.max || b.y < -30 || hit) { popAt(b, bx); trail.splice(i, 1); continue; }
    const fade = Math.min(1, b.age / 140) * (1 - clamp((b.age - b.max * .88) / (b.max * .12)));
    cx.globalAlpha = fade;
    let g = cx.createRadialGradient(bx - R * .25, b.y - R * .3, R * .1, bx, b.y, R);
    g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.72, 'rgba(160,225,255,.12)'); g.addColorStop(.93, 'rgba(215,242,255,.36)'); g.addColorStop(1, 'rgba(255,255,255,.55)');
    cx.beginPath(); cx.arc(bx, b.y, R, 0, 6.283); cx.fillStyle = g; cx.fill();
    const rg = cx.createLinearGradient(bx - R, b.y - R, bx + R, b.y + R);
    rg.addColorStop(0, `hsla(${b.hue},95%,78%,.85)`); rg.addColorStop(.5, 'rgba(255,255,255,.18)'); rg.addColorStop(1, `hsla(${(b.hue + 150) % 360},95%,78%,.8)`);
    cx.lineWidth = 1.4; cx.strokeStyle = rg; cx.stroke();
    cx.beginPath(); cx.ellipse(bx - R * .36, b.y - R * .4, R * .24, R * .12, -.7, 0, 6.283); cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fill();
    cx.beginPath(); cx.arc(bx + R * .4, b.y + R * .42, R * .08, 0, 6.283); cx.fillStyle = 'rgba(255,255,255,.6)'; cx.fill();
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
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  cv.width = vw * dpr; cv.height = vh * dpr;
  const n = vw < 700 ? 12 : 26;
  bubbles = Array.from({ length: n }, () => mkBubble(true));
}
function mkBubble(init) {
  return { x: rand(0, vw), y: init ? rand(0, vh) : vh + rand(20, 200), r: rand(3, 16), sp: rand(.25, .9), ph: rand(0, 6.28), sw: rand(8, 26), a: rand(.25, .55) };
}
function fx(time) {
  if (document.hidden) return requestAnimationFrame(fx);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, vw, vh);
  const boost = clamp(Math.abs(scrollVel) * .08, 0, 4);
  for (const b of bubbles) {
    b.y -= b.sp * (1 + boost) + (scrollVel > 0 ? 0 : -scrollVel * .1);
    const x = b.x + Math.sin(time / 1400 + b.ph) * b.sw;
    if (b.y < -40) Object.assign(b, mkBubble(false));
    const g = cx.createRadialGradient(x - b.r * .35, b.y - b.r * .35, b.r * .1, x, b.y, b.r);
    g.addColorStop(0, `rgba(255,255,255,${b.a * .7})`); g.addColorStop(.6, `rgba(190,235,255,${b.a * .12})`); g.addColorStop(1, `rgba(255,255,255,${b.a * .3})`);
    cx.beginPath(); cx.arc(x, b.y, b.r, 0, 6.283); cx.fillStyle = g; cx.fill();
    cx.lineWidth = 1; cx.strokeStyle = `rgba(255,255,255,${b.a * .6})`; cx.stroke();
    cx.beginPath(); cx.arc(x - b.r * .3, b.y - b.r * .3, b.r * .22, 0, 6.283); cx.fillStyle = `rgba(255,255,255,${b.a})`; cx.fill();
  }
  drawTrail(time);
  requestAnimationFrame(fx);
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */
fitScene(); sizeCanvas(); chrome();
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
