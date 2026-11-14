/* =========================================================
   التقديم كموزع معتمد — فورم + رسالة واتساب جاهزة
   - بيستخدم نفس رقم الواتساب من CONFIG.WHATSAPP_NUMBER
   - لو CONFIG.APPLY_API متحط: بيحفظ الطلب كمان في Google Sheet + إيميل (server/apply-sheet.gs)
   - أي زرار فيه data-apply بيفتح الفورم، و data-gov="اسم المحافظة" بيختارها تلقائي
   ========================================================= */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const modal = $('#applyModal'), back = $('#applyBack'), form = $('#applyForm');
  if (!modal || !form) return;
  const root = document.documentElement;
  const say = m => (window.bhToast ? window.bhToast(m) : alert(m));

  // المحافظات من خريطة مصر (مع قايمة احتياطية)
  const fallback = ['القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية','الغربية','المنوفية','البحيرة','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس','الفيوم','بني سويف','المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح','شمال سيناء','جنوب سيناء'];
  const govs = (typeof EGYPT_MAP !== 'undefined' && EGYPT_MAP.govs ? EGYPT_MAP.govs.map(g => g.name) : fallback);
  const sel = $('#aGov');
  sel.innerHTML = '<option value="" disabled selected hidden></option>' + govs.map(n => '<option>' + n + '</option>').join('');

  // رقم موبايل مصري: بيقبل أرقام عربي/إنجليزي و +20 و 0020، ويرجّع 01XXXXXXXXX أو ''
  const normPhone = raw => {
    let d = String(raw).replace(/[٠-٩]/g, c => c.charCodeAt(0) - 1632).replace(/[۰-۹]/g, c => c.charCodeAt(0) - 1776).replace(/\D/g, '');
    if (d.startsWith('0020')) d = d.slice(4); else if (d.startsWith('20') && d.length === 12) d = d.slice(2);
    if (d.length === 10 && d[0] === '1') d = '0' + d;
    return /^01[0125]\d{8}$/.test(d) ? d : '';
  };

  let lastFocus = null;
  const open = gov => {
    lastFocus = document.activeElement;
    if (gov && [...sel.options].some(o => o.value === gov)) sel.value = gov;
    modal.hidden = back.hidden = false;
    void modal.offsetWidth;
    root.classList.add('ap-open');
    setTimeout(() => $('#aName').focus(), 120);
  };
  const close = () => {
    root.classList.remove('ap-open');
    setTimeout(() => { modal.hidden = back.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-apply]');
    if (b) { e.preventDefault(); open(b.getAttribute('data-gov') || ''); }
  });
  $('#applyClose').addEventListener('click', close);
  back.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('ap-open')) close(); });

  const clear = e => { const f = e.target.closest('.field,.ap-type'); if (f) f.classList.remove('err'); };
  form.addEventListener('input', clear); form.addEventListener('change', clear);

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (form.elements.website && form.elements.website.value) { form.reset(); close(); return; }   // فخ للبوتات
    const v = n => (form.elements[n].value || '').trim();
    const name = v('name'), gov = v('gov'), address = v('address'), phone = normPhone(v('phone'));
    const type = (form.querySelector('input[name=type]:checked') || {}).value || '';

    let bad = null;
    const mark = (el, cond) => { el.classList.toggle('err', cond); if (cond && !bad) bad = el; };
    mark($('#aName').closest('.field'), name.length < 2);
    mark($('#aPhone').closest('.field'), !phone);
    mark($('#aGov').closest('.field'), !gov);
    mark($('#aAddr').closest('.field'), address.length < 5);
    mark($('#aType'), !type);
    if (bad) {
      const i = bad.querySelector('input,select'); if (i) i.focus();
      say(bad === $('#aPhone').closest('.field') ? 'اكتب رقم موبايل مصري صحيح (11 رقم بيبدأ بـ 01)' : 'من فضلك كمّل البيانات المطلوبة');
      return;
    }

    const num = (CONFIG.WHATSAPP_NUMBER || '').replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(num)) { say('رقم واتساب غير مُضاف في CONFIG'); return; }

    // نسخة احتياطية في Google Sheet + إيميل (اختياري)
    const api = (CONFIG.SHEET_API || CONFIG.APPLY_API || '').trim();
    if (api) {
      try {
        fetch(api, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ kind: 'apply', name, phone, gov, address, type }) }).catch(() => {});
      } catch (err) {}
    }

    const msg = [
      '*طلب تقديم كموزع معتمد — برايت هوم*', '',
      'أريد التقدم كموزع معتمد', '',
      'الاسم: ' + name,
      'الرقم: ' + phone,
      'المحافظة: ' + gov,
      'العنوان: ' + address,
      'نوع التقديم: ' + type
    ].join('\n');
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    form.reset(); close();
    say('تم تجهيز طلبك ✓ اضغط «إرسال» في واتساب لتأكيده.');
  });
})();
