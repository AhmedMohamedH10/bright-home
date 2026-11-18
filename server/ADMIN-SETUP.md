# تشغيل لوحة التحكم (مرة واحدة بس) — حوالي 15 دقيقة

## 1) مفتاح GitHub
GitHub ← Settings ← Developer settings ← Personal access tokens ← **Fine-grained tokens** ← Generate new token.
- Repository access: **Only select repositories** ← `bright-home` فقط.
- Permissions ← Repository permissions ← **Contents: Read and write**.
- انسخ المفتاح (مش هيظهر تاني).

## 2) سيرفر Cloudflare (مجاني)
1. سجّل في cloudflare.com ← **Workers & Pages** ← Create ← Worker ← اسمه `bh-admin` ← Deploy.
2. Edit code ← امسح الكود ← الصق محتوى `server/admin-worker.js` ← Deploy.
3. **KV**: Workers & Pages ← KV ← Create namespace باسم `BH_KV`. وبعدين من الـ Worker ← Settings ← Bindings ← Add ← KV namespace ← Variable name: `BH_KV`.
4. Settings ← Variables and Secrets ← أضف:
   - Text: `GH_REPO` = `AhmedMohamedH10/bright-home`
   - Text: `GH_BRANCH` = `main` (غيّرها لو الفرع اسمه تاني)
   - Text: `ALLOWED_ORIGIN` = `https://brighthome-eg.shop`
   - Secret: `GH_TOKEN` = مفتاح GitHub من الخطوة 1
   - Secret: `SESSION_SECRET` = أي نص عشوائي طويل (40 حرف+)
   - Secret: `DEV_USER` = اسم دخولك كمطوّر (إنجليزي)
   - Secret: `DEV_PASSWORD` = كلمة سر قوية ليك
5. انسخ رابط الـ Worker (شكله `https://bh-admin.xxxx.workers.dev`).

## 3) ربط اللوحة
في `js/config.js` حط الرابط في `ADMIN_API: 'https://bh-admin.xxxx.workers.dev'` وارفع الملف، وبعدها افتح `/admin.html`.

## الأدوار
- **مطوّر** (إنت): كل حاجة + إضافة/حذف أي حد. حسابك مش بيتحذف ولا بيتعدّل من اللوحة.
- **مالك**: المنتجات والموزعين + إضافة وإدارة «المحرّرين» بس.
- **محرّر**: بيتحدد له بالظبط يشتغل على إيه (المنتجات و/أو الموزعين).

## السجلات (للمطوّر فقط)
- تاب «السجلات» في اللوحة يعرض آخر 500 عملية: النشر، وإضافة المنتجات والموزّعين وتعديلهم وحذفهم، وفتح التقديم أو إغلاقه، وإدارة المستخدمين، وتسجيل الدخول والمحاولات الفاشلة.
- بعد أي تحديث لـ `server/admin-worker.js` الصقه في Worker الـ `bh-admin` واضغط Deploy، وإلا لن تُسجَّل التفاصيل الجديدة.
