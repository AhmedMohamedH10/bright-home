/* =========================================================
   Bright Home — الإعدادات (غيّر القيم هنا بس)
   ========================================================= */
const CONFIG = {
  // رقم واتساب اللي بيستقبل الطلبات (تحضير الطلبات) — صيغة دولية بدون + مثال: 201012345678
  // بيتستخدم كمان في زرار «الدعم الفني» في الفوتر
  WHATSAPP_NUMBER: '201153012450',

  // اختياري: إرسال تلقائي بالكامل عبر Meta (server/worker.js). فاضي = الطلب بيفتح واتساب للعميل
  ORDER_API: '',

  // اختياري: رابط Google Apps Script بتاع طلبات «التقديم كموزع» (بيحفظها في Google Sheet ويبعت إيميل). الخطوات في server/README.md. فاضي = واتساب بس
  APPLY_API: '',

  // رابط Google Apps Script الواحد (server/bright-sheet.gs): بيحفظ «طلبات المنتجات» في تاب «الطلبات» و«التقديم كموزع» في تاب «التقديمات» + إيميل تنبيه. واتساب بيفضل شغال زي ما هو. فاضي = من غير حفظ في الشيت
  SHEET_API: 'https://script.google.com/macros/s/AKfycbz7o8iSiwmg7r8-6k1nvlpMjvK22ow44Gmx3eizFYvp_YiLLtxLS7uhQYrZvqHCwLIUag/exec',

  // رابط سيرفر لوحة التحكم (Cloudflare Worker) — الخطوات في server/ADMIN-SETUP.md. فاضي = اللوحة بتشتغل بدون دخول وبتحمّل ZIP بس
  ADMIN_API: 'https://bh-admin.am6494627.workers.dev',
};
