/* =========================================================
   BFlix — cloud.js
   طبقة الاتصال بـ JSONBin.io (المصدر الوحيد للحقيقة للبيانات).

   قاعدة مهمة:
   - القراءة للزوّار تتم بدون أي مفتاح (الحاوية Public) → لا يوجد سر
     داخل الكود المنشور على GitHub.
   - الكتابة تتم من لوحة التحكم فقط، بمفتاح يُدخله صاحب الموقع يدويًا
     مرة واحدة ويُحفظ في متصفحه هو (localStorage) — وليس داخل المستودع.
   ========================================================= */

const BFLIX_CLOUD = {
  BIN_ID: "6aaf0a24ffd5d160531a8fc7",
  ROOT: "https://api.jsonbin.io/v3/b",
};

const CLOUD_KEY_STORAGE = "$2a$10$sfbHlW7rEN5C4sMbzJO8Aee0LMRwydYy291BxWX/29oFxwQAP52Ly"

/* ---------- مفتاح الكتابة (محلي، للوحة التحكم فقط) ---------- */
function getCloudKey() {
  return (localStorage.getItem(CLOUD_KEY_STORAGE) || "").trim();
}
function setCloudKey(key) {
  const v = (key || "").trim();
  if (v) localStorage.setItem(CLOUD_KEY_STORAGE, v);
  else localStorage.removeItem(CLOUD_KEY_STORAGE);
}
function hasCloudKey() {
  return !!getCloudKey();
}

/* ---------- ترويسة المفتاح ----------
   المفاتيح التي تبدأ بـ $2 هي Master Key، وغيرها Access Key. */
function keyHeaders() {
  const key = getCloudKey();
  if (!key) return {};
  return key.startsWith("$2") ? { "X-Master-Key": key } : { "X-Access-Key": key };
}

/* ---------- توحيد شكل البيانات ----------
   نقبل: [ ... ] أو { items: [ ... ] } أو { record: ... } */
function normalizeRecord(record) {
  if (Array.isArray(record)) return record;
  if (record && Array.isArray(record.items)) return record.items;
  if (record && record.record) return normalizeRecord(record.record);
  return [];
}

/* ---------- قراءة رسالة الخطأ من الاستجابة ---------- */
async function readError(res) {
  let msg = "";
  try {
    const body = await res.json();
    msg = body.message || body.error || "";
  } catch (e) { /* الاستجابة ليست JSON */ }

  const map = {
    400: "طلب غير صالح — تحقّق من صيغة البيانات المرسلة.",
    401: "المفتاح غير صحيح أو غير مصرّح له. تأكّد من نسخه كاملًا ومن صلاحية التحديث (Bins Update).",
    403: "المفتاح لا يملك صلاحية على هذه الحاوية، أو الحاوية ليست ضمن حسابك.",
    404: "لم يتم العثور على الحاوية — تحقّق من Bin ID.",
    429: "تجاوزت عدد الطلبات المسموح بها في خطتك الحالية.",
  };
  return `${map[res.status] || "فشل الطلب"} (HTTP ${res.status})${msg ? " — " + msg : ""}`;
}

/* ---------- قراءة البيانات من السحابة ---------- */
async function cloudRead() {
  const url = `${BFLIX_CLOUD.ROOT}/${BFLIX_CLOUD.BIN_ID}/latest`;
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "X-Bin-Meta": "false", ...keyHeaders() },
    });
  } catch (e) {
    throw new Error("تعذّر الوصول إلى الخادم — تحقّق من الاتصال بالإنترنت أو من حجب الطلب بواسطة إضافة في المتصفح.");
  }
  if (!res.ok) throw new Error(await readError(res));

  const body = await res.json();
  return normalizeRecord(body);
}

/* ---------- كتابة البيانات إلى السحابة ---------- */
async function cloudWrite(items) {
  if (!hasCloudKey()) {
    throw new Error("لم تُدخل مفتاح الكتابة بعد. افتح «إعدادات السحابة» في الأعلى وأدخله.");
  }
  const payload = {
    items: Array.isArray(items) ? items : [],
    updatedAt: new Date().toISOString(),
  };

  const url = `${BFLIX_CLOUD.ROOT}/${BFLIX_CLOUD.BIN_ID}`;
  let res;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Bin-Versioning": "false",
        ...keyHeaders(),
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error("تعذّر الوصول إلى الخادم — تحقّق من الاتصال بالإنترنت أو من حجب الطلب بواسطة إضافة في المتصفح.");
  }
  if (!res.ok) throw new Error(await readError(res));

  return true;
}

/* ---------- اختبار سريع للاتصال ---------- */
async function cloudTest() {
  const items = await cloudRead();
  return { ok: true, count: items.length, writable: hasCloudKey() };
}
