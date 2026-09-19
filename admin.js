/* =========================================================
   BFlix — admin.js
   لوحة تحكم بسيطة: تسجيل دخول (حماية أساسية من جهة المتصفح فقط،
   وليست نظام مصادقة حقيقيًا)، ثم إدارة كاملة للمحتوى (CRUD)
   بالإضافة إلى تصدير/استيراد/استعادة البيانات.
   يعتمد على الدوال المشتركة في app.js: getItems, saveItems,
   esc, img, genresOf, toast, SEED_ITEMS.
   ========================================================= */

const ADMIN_PASS_KEY = "bflix_admin_pass";
const ADMIN_SESSION_KEY = "bflix_admin_authed";
const DEFAULT_ADMIN_PASS = "bflix2026";

const $ = s => document.querySelector(s);
let editingId = null;

/* =========================================================
   حالة الاتصال بالسحابة
   ========================================================= */
function renderCloudStatus(){
  const el = $("#cloudStatus");
  if(!el) return;

  const states = {
    cloud: { cls:"ok",   text:`متصل بالسحابة — البيانات المعروضة هي نفسها التي يراها الزوّار (${getItems().length} عنصر).` },
    cache: { cls:"warn", text:`غير متصل — تعرض اللوحة نسخة محفوظة في هذا المتصفح. أي حفظ الآن سيفشل حتى يعود الاتصال. ${LAST_LOAD_ERROR}` },
    seed:  { cls:"warn", text:`غير متصل — تعرض اللوحة البيانات التجريبية. ${LAST_LOAD_ERROR}` },
  };
  const st = states[DATA_SOURCE] || states.seed;

  const writeLine = hasCloudKey()
    ? "مفتاح الكتابة محفوظ في هذا المتصفح."
    : "لا يوجد مفتاح كتابة — أدخله بالأسفل لتتمكّن من الحفظ.";

  el.className = `cloud-status ${st.cls}`;
  el.innerHTML = `<b>${st.text}</b><small>${writeLine}</small>`;
}

/* تنفيذ عملية نشر مع قفل الزر وإظهار الخطأ الحقيقي */
async function withPublish(items, successMsg, btn){
  const prev = btn ? btn.textContent : null;
  if(btn){ btn.disabled = true; btn.textContent = "جارٍ الحفظ في السحابة..."; }
  try{
    await publishItems(items);
    toast(successMsg);
    renderAdmin();
    renderCloudStatus();
    return true;
  }catch(err){
    alert("لم يُحفظ التغيير في السحابة، ولم يُطبَّق محليًا كي لا تختلف بياناتك عن بيانات الزوّار.\n\nالسبب:\n" + err.message);
    renderCloudStatus();
    return false;
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = prev; }
  }
}

function initCloudPanel(){
  const keyInput = $("#cloudKey");
  if(!keyInput) return;

  keyInput.value = getCloudKey();

  $("#saveKeyBtn").onclick = () => {
    setCloudKey(keyInput.value);
    toast(getCloudKey() ? "تم حفظ المفتاح في هذا المتصفح" : "تم مسح المفتاح");
    renderCloudStatus();
  };

  $("#testCloudBtn").onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try{
      const r = await cloudTest();
      alert(`الاتصال ناجح ✅\nعدد العناصر في السحابة: ${r.count}\nمفتاح الكتابة: ${r.writable ? "موجود" : "غير موجود"}`);
    }catch(err){
      alert("فشل الاتصال ❌\n\n" + err.message);
    }finally{ btn.disabled = false; }
  };

  $("#reloadCloudBtn").onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    await loadItems();
    renderAdmin();
    renderCloudStatus();
    toast(DATA_SOURCE === "cloud" ? "تم تحديث البيانات من السحابة" : "تعذّر التحديث من السحابة");
    btn.disabled = false;
  };

  $("#pushLocalBtn").onclick = async (e) => {
    const local = (()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); }catch(_){ return null; } })();
    if(!Array.isArray(local) || !local.length){ toast("لا توجد بيانات محلية لرفعها"); return; }
    if(!confirm(`سيتم رفع ${local.length} عنصرًا من هذا المتصفح واستبدال محتوى السحابة بالكامل. متابعة؟`)) return;
    await withPublish(local, "تم رفع بياناتك المحلية إلى السحابة", e.currentTarget);
  };
}

/* ---------- بوابة الدخول ---------- */
function currentAdminPass(){
  return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASS;
}
function isLoggedIn(){
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}
function showDashboard(){
  $("#loginScreen").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");
  renderAdmin();
  renderCloudStatus();
}
function showLogin(){
  $("#dashboard").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
}

function initAuthGate(){
  if(isLoggedIn()){ showDashboard(); } else { showLogin(); }

  $("#loginForm").onsubmit = e => {
    e.preventDefault();
    const val = $("#loginPass").value;
    if(val === currentAdminPass()){
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      $("#loginError").textContent = "";
      showDashboard();
    } else {
      $("#loginError").textContent = "كلمة المرور غير صحيحة، حاول مجددًا.";
    }
  };

  $("#logoutBtn").onclick = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showLogin();
  };

  $("#changePassBtn").onclick = () => {
    const current = prompt("أدخل كلمة المرور الحالية:");
    if(current === null) return;
    if(current !== currentAdminPass()){ toast("كلمة المرور الحالية غير صحيحة"); return; }
    const next = prompt("أدخل كلمة المرور الجديدة (٦ أحرف على الأقل):");
    if(!next) return;
    if(next.length < 6){ toast("كلمة المرور قصيرة جدًا"); return; }
    localStorage.setItem(ADMIN_PASS_KEY, next);
    toast("تم تحديث كلمة المرور بنجاح");
  };
}

/* ---------- عرض القائمة والإحصائيات ---------- */
function renderAdmin(){
  const items = getItems();
  $("#total").textContent = items.length;
  $("#films").textContent = items.filter(x => x.type === "movie").length;
  $("#shows").textContent = items.filter(x => x.type === "series").length;
  $("#favCount").textContent = getFavorites().length;

  const q = $("#adminSearch").value.toLowerCase();
  const list = items.filter(x => (x.title + " " + x.genre).toLowerCase().includes(q));

  $("#adminList").innerHTML = list.length
    ? list.map(x => `
      <div class="admin-row">
        <img class="thumb" src="${img(x)}" alt="">
        <div class="row-main">
          <b>${esc(x.title)} ${x.featured ? "⭐" : ""}</b>
          <small>${x.type === "movie" ? "فيلم" : "مسلسل"} · ${x.year || "—"} · ${x.rating ? "★ " + x.rating : "بدون تقييم"}</small>
        </div>
        <div class="row-actions">
          <button class="ghost" onclick="editItem('${x.id}')">تعديل</button>
          <button class="ghost danger" onclick="deleteItem('${x.id}')">حذف</button>
        </div>
      </div>`).join("")
    : `<div class="empty">لا يوجد محتوى مطابق.</div>`;
}

/* ---------- إضافة / تعديل ---------- */
function openEditor(item){
  editingId = item ? item.id : null;
  $("#editor").classList.remove("hidden");
  $("#editorTitle").textContent = item ? "تعديل العمل" : "إضافة عمل";
  $("#itemId").value = item?.id || "";
  $("#type").value = item?.type || "movie";
  $("#title").value = item?.title || "";
  $("#year").value = item?.year || "";
  $("#rating").value = item?.rating ?? "";
  $("#genre").value = item?.genre || "";
  $("#image").value = item?.image || "";
  $("#description").value = item?.description || "";
  $("#watchUrl").value = item?.watchUrl || "";
  $("#featured").checked = !!item?.featured;
  $("#editor").scrollIntoView({behavior:"smooth", block:"start"});
}

window.editItem = id => openEditor(getItems().find(x => x.id === id));
window.deleteItem = async id => {
  if(!confirm("هل أنت متأكد من حذف هذا العمل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
  const items = getItems().filter(x => x.id !== id);
  await withPublish(items, "تم حذف العمل من السحابة");
};

/* ---------- تصدير / استيراد / استعادة ---------- */
function exportData(){
  const blob = new Blob([JSON.stringify(getItems(), null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bflix-data-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("تم تصدير البيانات");
}

function importData(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      if(!Array.isArray(parsed)) throw new Error("invalid format");
      if(!confirm(`سيتم استبدال بيانات السحابة بـ ${parsed.length} عنصرًا من الملف. متابعة؟`)) return;
      withPublish(parsed, "تم استيراد البيانات ونشرها للزوّار");
    }catch(e){
      toast("تعذّر قراءة الملف، تأكد أنه ملف JSON صحيح");
    }
  };
  reader.readAsText(file);
}

async function resetToSeed(e){
  if(!confirm("سيتم استبدال كل بيانات السحابة بالبيانات التجريبية الأصلية. متابعة؟")) return;
  await withPublish(JSON.parse(JSON.stringify(SEED_ITEMS)), "تمت استعادة البيانات التجريبية ونشرها", e && e.currentTarget);
}

/* ---------- ربط الأحداث ---------- */
function initDashboardEvents(){
  $("#newBtn").onclick = () => openEditor(null);
  $("#closeEditor").onclick = () => $("#editor").classList.add("hidden");
  $("#adminSearch").oninput = renderAdmin;
  $("#exportBtn").onclick = exportData;
  $("#resetBtn").onclick = resetToSeed;
  $("#importInput").onchange = e => {
    const file = e.target.files[0];
    if(file) importData(file);
    e.target.value = "";
  };

  $("#itemForm").onsubmit = async e => {
    e.preventDefault();
    const data = {
      id: $("#itemId").value || "id_" + Date.now(),
      type: $("#type").value,
      title: $("#title").value.trim(),
      year: Number($("#year").value) || "",
      rating: $("#rating").value ? Number($("#rating").value) : "",
      genre: $("#genre").value.trim(),
      image: $("#image").value.trim(),
      description: $("#description").value.trim(),
      watchUrl: $("#watchUrl").value.trim(),
      featured: $("#featured").checked,
      addedAt: new Date().toISOString().slice(0,10),
    };
    if(!data.title){ toast("الاسم مطلوب"); return; }

    const items = getItems();
    const i = items.findIndex(x => x.id === data.id);
    if(i >= 0){
      data.addedAt = items[i].addedAt || data.addedAt; // حافظ على تاريخ الإضافة الأصلي عند التعديل
      items[i] = data;
    } else {
      items.unshift(data);
    }
    const ok = await withPublish(
      items,
      i >= 0 ? "تم تحديث العمل ونشره للزوّار" : "تمت إضافة العمل ونشره للزوّار",
      e.target.querySelector('button[type="submit"]')
    );
    if(ok) $("#editor").classList.add("hidden");
  };
}

/* ---------- بدء التشغيل ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  await loadItems();
  initAuthGate();
  initDashboardEvents();
  initCloudPanel();
  renderCloudStatus();
});
