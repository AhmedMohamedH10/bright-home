/* =========================================================
   موزعي برايت هوم — أضف الموزعين هنا بس 👇

   إزاي تضيف موزع؟
   1) دوّر على اسم المحافظة (مكتوب بالعربي فوق كل قسم).
   2) جوه الأقواس [ ] اكتب سطر جديد بالشكل ده:
        { name:'اسم الموزع', phone:'01012345678', area:'المنطقة' },
   3) «area» (المنطقة) اختياري، تقدر تمسحه: { name:'اسم الموزع', phone:'01012345678' },
   4) لازم الفاصلة , في آخر كل سطر، وعلامة ' حوالين الكلام، وماتمسحش الأقواس.
   لإضافة أكتر من موزع في نفس المحافظة: سطر لكل موزع.
   المحافظة اللي فيها موزع بتنوّر لوحدها على الخريطة، والفاضية بتظهر «قريبًا».
   الرقم: موبايل مصري (01012345678) أو دولي (201012345678).
   ========================================================= */
const DISTRIBUTORS = {

  // ───────── القاهرة ─────────
  cairo: [
    { name:'يوسف نور', phone:'01050878333', area:'شبرا مصر' },
  ],

  // ───────── الجيزة ─────────
  giza: [
    { name:'أم حمزة', phone:'01068000988', area:'إمبابة' },
    { name:'محمد كامل', phone:'01030728361', area:'أبو غالب' },
    { name:'سيد الشرقاوي', phone:'01066234011', area:'منشية البكري' },
    { name:'عبدالله عبدالرحمن', phone:'01211575073', area:'الشيخ زايد' },
  ],

  // ───────── الإسكندرية ─────────
  alex: [
  ],

  // ───────── القليوبية ─────────
  qalyubia: [
    { name:'أستاذ شريف', phone:'01212887711', area:'كفر طلخا' },
  ],

  // ───────── المنوفية ─────────
  menoufia: [
  ],

  // ───────── الغربية ─────────
  gharbia: [
  ],

  // ───────── الدقهلية ─────────
  dakahlia: [
    { name:'أبو جني', phone:'01029951431', area:'المنصورة' },
  ],

  // ───────── الشرقية ─────────
  sharqia: [
    { name:'أستاذة إيمان', phone:'01117098328', area:'أبو كبير' },
  ],

  // ───────── كفر الشيخ ─────────
  kafr: [
    { name:'أحمد أبو حلاوة', phone:'01019128339' },
  ],

  // ───────── البحيرة ─────────
  beheira: [
  ],

  // ───────── دمياط ─────────
  damietta: [
  ],

  // ───────── بورسعيد ─────────
  portsaid: [
  ],

  // ───────── الإسماعيلية ─────────
  ismailia: [
    { name:'باسم إبراهيم', phone:'01211100956' },
    { name:'محمود أبو الحاج', phone:'01013192020' },
    { name:'باسم حسني', phone:'01220551055' },
  ],

  // ───────── السويس ─────────
  suez: [
  ],

  // ───────── الفيوم ─────────
  fayoum: [
    { name:'باسم عماد', phone:'01024282432' },
  ],

  // ───────── بني سويف ─────────
  beni: [
    { name:'محمد عزيز أبو لقاء', phone:'01280742421' },
  ],

  // ───────── المنيا ─────────
  minya: [
    { name:'مجدي (شركة الواحة)', phone:'01148966894', area:'سمالوط' },
    { name:'رضا (السهم الذهبي)', phone:'01062533622' },
    { name:'صلاح', phone:'01158832911', area:'بني مزار' },
    { name:'مصطفى هاشم', phone:'01061553100' },
    { name:'بشواي', phone:'01210228868', area:'ملوي' },
  ],

  // ───────── أسيوط ─────────
  asyut: [
  ],

  // ───────── سوهاج ─────────
  sohag: [
    { name:'محمد السيد صديق', phone:'01016499979' },
  ],

  // ───────── قنا ─────────
  qena: [
  ],

  // ───────── الأقصر ─────────
  luxor: [
  ],

  // ───────── أسوان ─────────
  aswan: [
  ],

  // ───────── البحر الأحمر ─────────
  redsea: [
    { name:'وائل السني', phone:'01067415767', area:'الغردقة' },
  ],

  // ───────── الوادي الجديد ─────────
  newvalley: [
    { name:'محمود عبد الراضي', phone:'01110320647' },
  ],

  // ───────── مطروح ─────────
  matrouh: [
    { name:'محمد القصير', phone:'01280838390', area:'الضبعة' },
  ],

  // ───────── شمال سيناء ─────────
  north_sinai: [
    { name:'محمد عبد المنعم', phone:'01020644093', area:'بلوظة' },
    { name:'عبدالهادي فرج', phone:'01062515451', area:'بير العبد' },
  ],

  // ───────── جنوب سيناء ─────────
  south_sinai: [
    { name:'إسلام محمد', phone:'01004918816', area:'رأس سدر' },
    { name:'عادل الصياد', phone:'01002047249', area:'دهب' },
  ],
};

(function () {
  const M = EGYPT_MAP, NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('distSvg'), sel = document.getElementById('distGov'), list = document.getElementById('distList');
  if (!svg || !sel || !list) return;
  const cnt = id => (DISTRIBUTORS[id] || []).length;
  const wa = p => { p = String(p).replace(/\D/g, ''); if (p.startsWith('00')) p = p.slice(2); if (p.startsWith('0')) p = '20' + p.slice(1); return p; };
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  svg.setAttribute('viewBox', M.vb.join(' '));

  const df = el('defs', {});
  df.innerHTML = '<linearGradient id="gvO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f4a82"/><stop offset="1" stop-color="#13325e"/></linearGradient>'
    + '<linearGradient id="gvH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3aa8ff"/><stop offset="1" stop-color="#0f62b8"/></linearGradient>'
    + '<linearGradient id="gvA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe4ff"/><stop offset="1" stop-color="#2a9fdc"/></linearGradient>'
    + '<filter id="gvGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>';

  // توهّج خارجي حوالين حدود مصر (بيظهر كمان في مجرى النيل لأن المحافظات متفصولة عن بعض)
  const back = el('g', { 'pointer-events': 'none', filter: 'url(#gvGlow)', opacity: .8 });
  M.govs.forEach(g => el('path', { d: g.d, class: 'gback' }, back));
  el('path', { d: M.deco, class: 'gdeco', 'pointer-events': 'none' });

  const gs = el('g', { class: 'gmap' }), ls = el('g', { 'pointer-events': 'none' });
  const paths = {}, labels = {}, leads = {};
  sel.innerHTML = '<option value="">حدد أقرب موزع لك</option>';
  M.govs.forEach(g => {
    const has = cnt(g.id) > 0;
    const o = document.createElement('option'); o.value = g.id; o.textContent = g.name + (has ? '' : ' (قريبًا)'); sel.appendChild(o);
    const p = el('path', { d: g.d, class: 'gv' + (has ? ' has' : ''), tabindex: 0, role: 'button', 'aria-label': g.name, 'data-id': g.id }, gs);
    p.addEventListener('click', () => pick(g.id));
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g.id); } });
    p.addEventListener('mouseenter', () => { labels[g.id].classList.add('hv'); if (leads[g.id]) leads[g.id].classList.add('hv'); });
    p.addEventListener('mouseleave', () => { labels[g.id].classList.remove('hv'); if (leads[g.id]) leads[g.id].classList.remove('hv'); });
    paths[g.id] = p;
  });
  M.govs.forEach(g => {
    const has = cnt(g.id) > 0, c = g.c;
    const west = c && c[0] < 215 && c[1] > 100;   // محافظات الصعيد: الاسم على يسار النيل والخط بيطلع من حرف الاسم
    if (c) {
      const x1 = west ? c[0] + 3 : c[0], y1 = west ? c[1] : c[1] + 6;
      leads[g.id] = el('g', { class: 'gld' }, ls); el('line', { x1: x1, y1: y1, x2: g.x, y2: g.y }, leads[g.id]); el('circle', { cx: g.x, cy: g.y, r: 1.7 }, leads[g.id]);
    }
    const t = el('text', { x: g.lx ?? (c ? c[0] : g.x), y: g.ly ?? (c ? c[1] : g.y), class: 'gl' + (c ? ' co' : '') + (west ? ' we' : '') + (has ? ' has' : ''), style: '--fs:' + (c ? 9 : g.fs) }, ls);
    t.textContent = g.name; labels[g.id] = t;
  });

  const pin = el('g', { class: 'pin', opacity: 0 });
  const pp = el('g', { class: 'pp' }, pin);
  el('ellipse', { class: 'pin-ring', rx: 7, ry: 2.8, cx: 0, cy: 0 }, pp);
  el('path', { class: 'pin-body', d: 'M0,0C-6,-8 -10,-14 -10,-19a10,10 0 1 1 20,0c0,5 -4,11 -10,19z' }, pp);
  el('circle', { class: 'pin-dot', cx: 0, cy: -19, r: 4 }, pp);

  function render(id) {
    const g = M.govs.find(x => x.id === id), arr = DISTRIBUTORS[id] || [];
    if (!g) { list.innerHTML = ''; return; }
    let h = `<h3 class="dl-title">${g.name}<small>${arr.length ? arr.length + (arr.length > 2 ? ' موزعين' : arr.length === 2 ? ' موزعان' : ' موزع') : ''}</small></h3>`;
    if (!arr.length) h += '<div class="dl-empty"><b>قريبًا في ' + g.name + '</b><span>لسه مفيش موزع معتمد هنا. تقدر تطلب مباشرة من قسم الطلب.</span><a class="dl-link" href="#order">اطلب من الموقع</a><button type="button" class="dl-apply" data-apply data-gov="' + g.name + '">قدّم كموزع في ' + g.name + '</button></div>';
    arr.forEach(d => {
      const msg = encodeURIComponent('مرحبًا، أنا عايز أطلب منتجات برايت هوم من موزع ' + d.name + ' في ' + g.name);
      h += `<article class="dl-card"><div class="dl-info"><b>${d.name}</b>${d.area ? `<span>${d.area}</span>` : ''}<a class="dl-tel" dir="ltr" href="tel:+${wa(d.phone)}">${d.phone}</a></div>
      <a class="dl-wa" href="https://wa.me/${wa(d.phone)}?text=${msg}" target="_blank" rel="noopener" aria-label="تواصل مع ${d.name} على واتساب"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.800 14.200c-.2.700-1.300 1.300-1.800 1.300-.5.100-1.100.100-1.800-.1-.4-.1-1-.3-1.700-.6-3-1.300-4.900-4.300-5-4.500-.1-.2-1.200-1.600-1.200-3s.8-2.100 1-2.400c.3-.3.600-.3.800-.3h.6c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .500l-.3.400-.4.500c-.1.100-.3.300-.1.600.2.300.7 1.200 1.500 1.900 1 .9 1.900 1.200 2.200 1.300.3.100.4.100.6-.1l.8-1c.2-.3.400-.2.600-.1l1.900.9c.3.100.5.200.5.300.1.200.1.800-.1 1.500z"/></svg>واتساب</a></article>`;
    });
    list.innerHTML = h;
    list.scrollTop = 0;
  }
  function pick(id) {
    sel.value = id || '';
    Object.keys(paths).forEach(k => { paths[k].classList.toggle('on', k === id); labels[k].classList.toggle('on', k === id); labels[k].setAttribute('dy', 0); if (leads[k]) leads[k].classList.toggle('on', k === id); });
    const g = M.govs.find(x => x.id === id);
    if (g) { paths[id].parentNode.appendChild(paths[id]); pin.style.transform = `translate(${g.x}px,${g.y - (g.c ? 0 : 5)}px)`; pin.setAttribute('opacity', 1); pin.classList.remove('drop'); void pin.getBoundingClientRect(); pin.classList.add('drop'); }
    else pin.setAttribute('opacity', 0);
    render(id);
  }
  sel.addEventListener('change', () => pick(sel.value));
  render('');
  window.distPick = pick;
})();
