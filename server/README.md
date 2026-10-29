# إرسال الطلبات تلقائيًا على واتساب (رقم تحضير الطلبات)

الموقع ثابت (من غير سيرفر) فلازم حلقة وصل صغيرة بتشيل مفتاح واتساب بعيد عن الصفحة. الملف `worker.js` ده دالة Cloudflare Worker مجانية.

1. افتح حساب Meta for Developers → اعمل App → ضيف **WhatsApp** → وصّل رقم واتساب بيزنس (مش رقم شخصي شغال على التطبيق العادي). هتاخد `Phone number ID` و`Access token` (اعمل System User token دائم).
2. على Cloudflare: Workers → Create → الصق `worker.js` → Settings → Variables:
   - `WA_TOKEN` (Secret) · `WA_PHONE_ID` · `PREP_NUMBER` (رقم التحضير بصيغة دولية بدون +، مثال 201012345678) · `ALLOWED_ORIGIN` (مثال https://yourdomain.com)
3. انسخ رابط الـ Worker وحطه في `CONFIG.ORDER_API` في `js/main.js`.

ملاحظة من واتساب: الرسائل اللي بيبدأها النشاط لرقم مش مكلّمه خلال آخر 24 ساعة لازم تكون Template معتمدة. أسهل حل: رقم التحضير يبعت أي رسالة لرقم البيزنس مرة كل 24 ساعة، أو نعمل Template ونعدّل `worker.js` يستخدمها.
