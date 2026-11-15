/* =========================================================
   Bright Home — عدّاد «يشاهدون المنتجات الآن»
   كل زائر بيبعت نبضة كل 40 ثانية لسكريبت Google (نفس SHEET_API)، والسكريبت بيرجّع عدد
   اللي نبضتهم وصلت آخر 90 ثانية. العدد حقيقي — مفيش أرقام وهمية.
   لو SHEET_API فاضي أو السكريبت لسه مش متحدّث: العلامة بتفضل مخفية.
   ========================================================= */
(function () {
  'use strict';
  const badge = document.getElementById('liveBadge'), numEl = document.getElementById('liveNum');
  if (!badge || !numEl || typeof CONFIG === 'undefined') return;
  const api = String(CONFIG.SHEET_API || '').trim();
  if (!api) return;

  const BEAT = 40000;                       // نبضة كل 40 ثانية
  let vid = '', timer = 0, fails = 0, shown = 0, busy = false;
  try { vid = localStorage.getItem('bh_vid') || ''; } catch (e) {}
  if (!/^[a-z0-9]{10,24}$/.test(vid)) {
    const a = new Uint8Array(8); (window.crypto || window.msCrypto).getRandomValues(a);
    vid = Array.from(a, b => (b % 36).toString(36)).join('') + Date.now().toString(36);
    try { localStorage.setItem('bh_vid', vid); } catch (e) {}
  }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(n) {
    const txt = String(n);
    if (!badge.classList.contains('on')) { numEl.textContent = txt; shown = n; badge.classList.add('on'); return; }
    if (n === shown) return;
    const from = shown; shown = n;
    if (reduce) { numEl.textContent = txt; return; }
    numEl.classList.remove('bump'); void numEl.offsetWidth; numEl.classList.add('bump');
    const t0 = performance.now(), dur = 600;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      numEl.textContent = String(Math.round(from + (n - from) * k));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  async function ping() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const r = await fetch(api + (api.includes('?') ? '&' : '?') + 'a=live&id=' + vid + '&t=' + Date.now(), { cache: 'no-store', credentials: 'omit' });
      const d = await r.json();
      if (d && d.ok && typeof d.n === 'number' && d.n >= 1) { fails = 0; render(Math.floor(d.n)); }
      else throw new Error('bad');
    } catch (e) {
      if (++fails >= 3) { stop(); badge.classList.remove('on'); }
    }
    busy = false;
  }
  function start() { if (timer || fails >= 3) return; ping(); timer = setInterval(ping, BEAT); }
  function stop() { clearInterval(timer); timer = 0; }

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  // نبدأ بعد ما اللودر يخلص بشوية عشان ما يزاحمش تحميل الموقع
  setTimeout(start, 2500);
})();
