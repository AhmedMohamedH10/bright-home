/* =========================================================
   Bright Home — حفظ طلبات «التقديم كموزع» في Google Sheet + إيميل تنبيه
   الخطوات (مرة واحدة، مجانًا):
   1) افتح sheets.new وسمّي الملف «طلبات موزعين برايت هوم».
   2) من القايمة: Extensions → Apps Script، امسح اللي موجود والصق الكود ده كله.
   3) (اختياري) غيّر NOTIFY_EMAIL تحت.
   4) Deploy → New deployment → النوع Web app → Execute as: Me → Who has access: Anyone → Deploy
      (هيطلب منك تسمح بالصلاحيات، وافق).
   5) انسخ رابط الـ Web app وحطه في js/config.js داخل APPLY_API.
   لو عدّلت الكود بعد كده: Deploy → Manage deployments → Edit → New version.
   ========================================================= */
const NOTIFY_EMAIL = 'brightservices2024@gmail.com';
const SHEET_NAME = 'الطلبات';
const HEADERS = ['التاريخ', 'الاسم', 'الموبايل', 'المحافظة', 'العنوان', 'نوع التقديم', 'الحالة', 'ملاحظات'];
const STATUSES = ['جديد', 'تم التواصل', 'تم الاعتماد', 'مرفوض'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const row = [
      Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm'),
      clean_(d.name), clean_(d.phone), clean_(d.gov), clean_(d.address), clean_(d.type), 'جديد', ''
    ];
    if (!row[1] || !row[2]) return out_({ ok: false });

    const sh = sheet_();
    sh.appendRow(row);
    const r = sh.getLastRow();
    sh.getRange(r, 3).setNumberFormat('@').setValue(row[2]);                       // الرقم كنص عشان الصفر ما يختفيش
    sh.getRange(r, 7).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'طلب موزع جديد — ' + row[1] + ' (' + row[5] + ') — ' + row[3],
        ['طلب تقديم جديد كموزع معتمد:', '', 'الاسم: ' + row[1], 'الموبايل: ' + row[2], 'المحافظة: ' + row[3],
         'العنوان: ' + row[4], 'نوع التقديم: ' + row[5], '', 'الجدول: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()].join('\n'));
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return out_({ ok: true, service: 'bright-home-apply' }); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.setRightToLeft(true);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#073b78').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 1, 130); sh.setColumnWidths(2, 1, 170); sh.setColumnWidths(3, 1, 120);
    sh.setColumnWidths(4, 1, 120); sh.setColumnWidths(5, 1, 260); sh.setColumnWidths(6, 1, 110);
    sh.setColumnWidths(7, 1, 110); sh.setColumnWidths(8, 1, 220);
  }
  return sh;
}

// تنضيف: حد أقصى للطول، ومنع أي خلية تتفسر كمعادلة (= + - @)
function clean_(v) {
  v = String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, 300);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
