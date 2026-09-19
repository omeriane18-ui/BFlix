/* =========================================================
   BFlix — app.js
   طبقة البيانات المشتركة + منطق الصفحة الرئيسية وصفحة التفاصيل.
   البيانات مخزّنة في localStorage (نسخة Static بدون سيرفر).
   ========================================================= */

const STORAGE_KEY = "bflix_items";
const FAVORITES_KEY = "bflix_favorites";
const THEME_KEY = "bflix_theme";

/* ---------- بيانات تجريبية أولية (Seed) ---------- */
/* الصور هنا placeholder عامة (picsum.photos) — بدّلها من لوحة التحكم بصور حقيقية لديك. */
const SEED_ITEMS = [
  { id:"m1", type:"movie",  title:"ظلال المدينة",        year:2024, genre:"أكشن، جريمة",     rating:8.1, description:"محقق سابق يعود لملاحقة شبكة إجرامية سيطرت على أحياء المدينة القديمة، في سباق مع الزمن قبل أن تتكرر مأساة الماضي.", image:"https://picsum.photos/seed/bflix-m1/600/900", watchUrl:"https://example.com/watch/m1", featured:true,  addedAt:"2024-11-02" },
  { id:"m2", type:"movie",  title:"على حافة البحر",       year:2023, genre:"دراما، رومانسي",  rating:7.4, description:"قصة صيّاد يواجه خيارًا صعبًا بين حلمه القديم وعائلته الصغيرة في بلدة ساحلية هادئة.", image:"https://picsum.photos/seed/bflix-m2/600/900", watchUrl:"https://example.com/watch/m2", featured:false, addedAt:"2023-06-14" },
  { id:"m3", type:"movie",  title:"المدار السابع",        year:2025, genre:"خيال علمي، إثارة", rating:8.7, description:"طاقم محطة فضائية يكتشف إشارة غامضة تهدد بكشف حقيقة مهمتهم الحقيقية بعيدًا عن الأرض.", image:"https://picsum.photos/seed/bflix-m3/600/900", watchUrl:"https://example.com/watch/m3", featured:true,  addedAt:"2025-01-20" },
  { id:"m4", type:"movie",  title:"ضحكة أخيرة",           year:2022, genre:"كوميديا",         rating:6.9, description:"ثلاثة أصدقاء يخططون لحفلة مفاجئة تتحول إلى سلسلة من المواقف الكوميدية الكارثية.", image:"https://picsum.photos/seed/bflix-m4/600/900", watchUrl:"https://example.com/watch/m4", featured:false, addedAt:"2022-09-05" },
  { id:"m5", type:"movie",  title:"البيت رقم 12",         year:2024, genre:"رعب، غموض",       rating:7.2, description:"عائلة تنتقل إلى منزل قديم يخفي سرًا مظلمًا يعود لعقود من الزمن.", image:"https://picsum.photos/seed/bflix-m5/600/900", watchUrl:"https://example.com/watch/m5", featured:false, addedAt:"2024-03-18" },
  { id:"m6", type:"movie",  title:"سباق الوادي",          year:2021, genre:"مغامرة، أكشن",    rating:7.0, description:"فريق من المستكشفين يخوض رحلة محفوفة بالمخاطر عبر واد مجهول بحثًا عن كنز أسطوري.", image:"https://picsum.photos/seed/bflix-m6/600/900", watchUrl:"https://example.com/watch/m6", featured:false, addedAt:"2021-12-01" },
  { id:"m7", type:"movie",  title:"قهوة الصباح",          year:2025, genre:"دراما، كوميديا",  rating:7.8, description:"صاحبة مقهى صغير تعيد ترتيب حياتها بعد لقاء غيّر نظرتها للعالم من حولها.", image:"https://picsum.photos/seed/bflix-m7/600/900", watchUrl:"https://example.com/watch/m7", featured:false, addedAt:"2025-05-10" },
  { id:"m8", type:"movie",  title:"الحارس الأخير",        year:2020, genre:"أكشن، دراما",     rating:8.0, description:"حارس أمن متقاعد يجد نفسه مضطرًا للعودة لمهمة واحدة أخيرة لإنقاذ من يحب.", image:"https://picsum.photos/seed/bflix-m8/600/900", watchUrl:"https://example.com/watch/m8", featured:false, addedAt:"2020-08-22" },
  { id:"m9", type:"movie",  title:"رسائل لم تُرسل",        year:2023, genre:"دراما، رومانسي",  rating:8.3, description:"كاتبة تكتشف صندوقًا من الرسائل القديمة يقودها لإعادة اكتشاف قصة حب نسيها الزمن.", image:"https://picsum.photos/seed/bflix-m9/600/900", watchUrl:"https://example.com/watch/m9", featured:true,  addedAt:"2023-02-11" },
  { id:"m10", type:"movie", title:"خط النهاية",            year:2026, genre:"إثارة، جريمة",    rating:7.6, description:"صحفية استقصائية تلاحق فضيحة كبرى قد تكلفها حياتها إذا كشفت الحقيقة كاملة.", image:"https://picsum.photos/seed/bflix-m10/600/900", watchUrl:"https://example.com/watch/m10", featured:false, addedAt:"2026-02-01" },

  { id:"s1", type:"series", title:"ما وراء الأفق",         year:2025, genre:"خيال علمي، إثارة", rating:8.5, description:"مجموعة من العلماء يفتحون بوابة بين الأبعاد، لتبدأ أحداث لا يمكن التنبؤ بعواقبها.", image:"https://picsum.photos/seed/bflix-s1/600/900", watchUrl:"https://example.com/watch/s1", featured:true,  addedAt:"2025-04-01" },
  { id:"s2", type:"series", title:"حي الأسرار",             year:2024, genre:"دراما، جريمة",    rating:8.0, description:"في حي شعبي هادئ ظاهريًا، تتكشف تدريجيًا شبكة من الأسرار العائلية المتشابكة.", image:"https://picsum.photos/seed/bflix-s2/600/900", watchUrl:"https://example.com/watch/s2", featured:false, addedAt:"2024-07-19" },
  { id:"s3", type:"series", title:"عرش الرمال",              year:2022, genre:"دراما تاريخية",  rating:8.9, description:"صراع على السلطة بين عائلتين متنافستين في مملكة صحراوية خلال حقبة مضطربة.", image:"https://picsum.photos/seed/bflix-s3/600/900", watchUrl:"https://example.com/watch/s3", featured:true,  addedAt:"2022-10-30" },
  { id:"s4", type:"series", title:"الوحدة 7",                year:2023, genre:"أكشن، إثارة",    rating:7.7, description:"فريق عمليات خاصة يخوض مهمات سرّية حول العالم، وكل حلقة تكشف طبقة جديدة من المؤامرة.", image:"https://picsum.photos/seed/bflix-s4/600/900", watchUrl:"https://example.com/watch/s4", featured:false, addedAt:"2023-11-08" },
  { id:"s5", type:"series", title:"ضحك بصوت عالٍ",            year:2021, genre:"كوميديا",        rating:7.1, description:"مجموعة أصدقاء يشاركوننا مواقف الحياة اليومية بأسلوب كوميدي خفيف ومحبب.", image:"https://picsum.photos/seed/bflix-s5/600/900", watchUrl:"https://example.com/watch/s5", featured:false, addedAt:"2021-05-17" },
  { id:"s6", type:"series", title:"نبض المدينة",              year:2026, genre:"دراما، رومانسي", rating:8.2, description:"أربع قصص متقاطعة لأشخاص تجمعهم مدينة واحدة وأقدار متشابكة عبر موسم كامل.", image:"https://picsum.photos/seed/bflix-s6/600/900", watchUrl:"https://example.com/watch/s6", featured:false, addedAt:"2026-01-15" },
  { id:"s7", type:"series", title:"الصمت الأبيض",             year:2024, genre:"رعب، غموض",      rating:7.5, description:"بلدة جبلية معزولة تشهد أحداثًا غامضة بعد عاصفة ثلجية استثنائية.", image:"https://picsum.photos/seed/bflix-s7/600/900", watchUrl:"https://example.com/watch/s7", featured:false, addedAt:"2024-12-09" },
  { id:"s8", type:"series", title:"ملف رقم 9",                year:2020, genre:"جريمة، إثارة",   rating:8.4, description:"محققة شابة تتولى قضايا باردة معقدة، وتكتشف أن بعضها مرتبط بماضيها الشخصي.", image:"https://picsum.photos/seed/bflix-s8/600/900", watchUrl:"https://example.com/watch/s8", featured:false, addedAt:"2020-03-27" },
];

/* =========================================================
   طبقة تخزين العناصر — السحابة أولًا
   المصدر الأساسي: JSONBin (عبر cloud.js).
   localStorage صار *نسخة احتياطية للعرض فقط* عند انقطاع الاتصال،
   ولم يعد مكانًا تُحفظ فيه التعديلات.
   ========================================================= */
let ITEMS = null;                 // البيانات الحيّة في الذاكرة
let DATA_SOURCE = "loading";      // cloud | cache | seed
let LAST_LOAD_ERROR = "";

function structuredCloneSafe(x){ return JSON.parse(JSON.stringify(x)); }

function readCache(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(parsed) ? parsed : null;
  }catch(e){ return null; }
}
function writeCache(items){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch(e){}
}

/* قراءة متزامنة لما هو محمّل حاليًا (تستخدمها دوال العرض) */
function getItems(){
  if(ITEMS) return ITEMS;
  ITEMS = readCache() || structuredCloneSafe(SEED_ITEMS);
  return ITEMS;
}

/* تحميل البيانات من السحابة عند فتح أي صفحة */
async function loadItems(){
  try{
    ITEMS = await cloudRead();
    DATA_SOURCE = "cloud";
    LAST_LOAD_ERROR = "";
    writeCache(ITEMS);                 // نسخة احتياطية للعرض دون اتصال
  }catch(err){
    LAST_LOAD_ERROR = err.message;
    const cached = readCache();
    ITEMS = cached || structuredCloneSafe(SEED_ITEMS);
    DATA_SOURCE = cached ? "cache" : "seed";
    console.warn("[BFlix] تعذّر تحميل البيانات من السحابة:", err.message);
  }
  return ITEMS;
}

/* النشر: يحفظ في السحابة أولًا، ولا يُحدّث الواجهة إلا بعد النجاح.
   عند الفشل يرمي خطأً — لا حفظ محلي صامت بعد اليوم. */
async function publishItems(items){
  await cloudWrite(items);
  ITEMS = items;
  DATA_SOURCE = "cloud";
  writeCache(items);
  return true;
}

/* متوافقة مع الكود القديم: تحديث الذاكرة والنسخة المحلية فقط */
function saveItems(items){ ITEMS = items; writeCache(items); }

/* ---------- المفضلة ---------- */
function getFavorites(){
  try{ return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }catch(e){ return []; }
}
function isFavorite(id){ return getFavorites().includes(id); }
function toggleFavorite(id){
  let favs = getFavorites();
  favs = favs.includes(id) ? favs.filter(x=>x!==id) : [...favs, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

/* ---------- أدوات مساعدة ---------- */
function esc(s=""){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function img(item){
  return item.image || placeholderImg(item.title);
}
function placeholderImg(title=""){
  const label = esc(title).slice(0,16) || "BFLIX";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='500' height='750'><rect width='100%' height='100%' fill='#171c22'/><text x='50%' y='50%' fill='#98a2ad' text-anchor='middle' font-size='28' font-family='sans-serif'>${label}</text></svg>`)}`;
}
function genresOf(item){
  return (item.genre || "").split(/[،,]/).map(g => g.trim()).filter(Boolean);
}
function allGenres(items){
  const set = new Set();
  items.forEach(it => genresOf(it).forEach(g => set.add(g)));
  return Array.from(set).sort((a,b)=>a.localeCompare("ar"));
}
function toast(message){
  let wrap = document.querySelector(".toast-wrap");
  if(!wrap){
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(()=> el.remove(), 2600);
}

/* ---------- بطاقة العرض ---------- */
function card(item){
  const fav = isFavorite(item.id);
  const typeLabel = item.type === "movie" ? "فيلم" : "مسلسل";
  return `
  <div class="card">
    <a href="details.html?id=${encodeURIComponent(item.id)}">
      <img class="poster" src="${img(item)}" alt="${esc(item.title)}" loading="lazy">
      <span class="badge-type">${typeLabel}</span>
      ${item.rating ? `<span class="badge-rating">★ ${item.rating}</span>` : ""}
    </a>
    <button class="fav-btn ${fav ? "active" : ""}" title="إضافة للمفضلة" onclick="handleFavClick(event,'${item.id}')">${fav ? "♥" : "♡"}</button>
    <a href="details.html?id=${encodeURIComponent(item.id)}" class="card-info">
      <h3>${esc(item.title)}</h3>
      <div class="meta"><span>${item.year || "—"}</span><span>${esc(genresOf(item)[0] || "غير مصنف")}</span></div>
    </a>
  </div>`;
}
window.handleFavClick = (e, id) => {
  e.preventDefault();
  e.stopPropagation();
  const nowFav = toggleFavorite(id);
  toast(nowFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
  if(typeof window.__rerenderCatalog === "function") window.__rerenderCatalog();
};

/* ---------- الثيم (داكن/فاتح) ---------- */
function setupTheme(){
  let t = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(t);
  const btn = document.querySelector("#themeBtn");
  if(btn){
    btn.onclick = () => {
      t = t === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, t);
      applyTheme(t);
    };
  }
}
function applyTheme(t){
  document.documentElement.dataset.theme = t === "light" ? "light" : "";
  const btn = document.querySelector("#themeBtn");
  if(btn) btn.textContent = t === "light" ? "☾" : "☼";
}

/* ---------- قائمة الجوال ---------- */
function setupMobileNav(){
  const burger = document.querySelector("#burgerBtn");
  const nav = document.querySelector("#mobileNav");
  if(!burger || !nav) return;
  burger.onclick = () => nav.classList.toggle("open");
  nav.querySelectorAll("a").forEach(a => a.onclick = () => nav.classList.remove("open"));
}

/* =========================================================
   منطق الصفحة الرئيسية
   ========================================================= */
const homeState = { type:"all", genre:"all", sort:"newest", query:"" };

function filteredSortedItems(){
  let items = getItems();

  if(homeState.type === "favorites"){
    const favs = getFavorites();
    items = items.filter(x => favs.includes(x.id));
  } else if(homeState.type !== "all"){
    items = items.filter(x => x.type === homeState.type);
  }

  if(homeState.genre !== "all"){
    items = items.filter(x => genresOf(x).includes(homeState.genre));
  }

  if(homeState.query){
    const q = homeState.query.toLowerCase();
    items = items.filter(x => (x.title + " " + x.genre + " " + x.description).toLowerCase().includes(q));
  }

  switch(homeState.sort){
    case "rating": items = items.sort((a,b)=> (b.rating||0) - (a.rating||0)); break;
    case "year":   items = items.sort((a,b)=> (b.year||0) - (a.year||0)); break;
    case "title":  items = items.sort((a,b)=> a.title.localeCompare(b.title,"ar")); break;
    default:       items = items.sort((a,b)=> new Date(b.addedAt||0) - new Date(a.addedAt||0));
  }
  return items;
}

function renderCatalog(){
  const grid = document.querySelector("#catalogGrid");
  if(!grid) return;
  const items = filteredSortedItems();
  grid.innerHTML = items.length
    ? items.map(card).join("")
    : `<div class="empty">لا توجد نتائج مطابقة لبحثك أو الفلاتر المختارة.</div>`;
  const countEl = document.querySelector("#catalogCount");
  if(countEl) countEl.textContent = `${items.length} عمل`;
}
window.__rerenderCatalog = renderCatalog;

function renderGenreChips(){
  const wrap = document.querySelector("#genreChips");
  if(!wrap) return;
  const genres = allGenres(getItems());
  const chips = ["all", ...genres];
  wrap.innerHTML = chips.map(g => `
    <button class="chip ${homeState.genre===g?"active":""}" data-genre="${esc(g)}">${g==="all"?"كل التصنيفات":esc(g)}</button>
  `).join("");
  wrap.querySelectorAll(".chip").forEach(btn => {
    btn.onclick = () => {
      homeState.genre = btn.dataset.genre;
      renderGenreChips();
      renderCatalog();
    };
  });
}

function renderHomeStats(){
  const items = getItems();
  const totalEl = document.querySelector("#statTotal");
  const moviesEl = document.querySelector("#statMovies");
  const seriesEl = document.querySelector("#statSeries");
  if(totalEl) totalEl.textContent = items.length;
  if(moviesEl) moviesEl.textContent = items.filter(x=>x.type==="movie").length;
  if(seriesEl) seriesEl.textContent = items.filter(x=>x.type==="series").length;
}

function renderFeatured(){
  const el = document.querySelector("#heroPoster");
  if(!el) return;
  const items = getItems();
  const featured = items.find(x => x.featured) || items[0];
  if(!featured) return;
  el.innerHTML = `<img src="${img(featured)}" alt="${esc(featured.title)}">`;
  const nameEl = document.querySelector("#heroFeaturedName");
  if(nameEl) nameEl.textContent = featured.title;
}

function setupHome(){
  setupTheme();
  setupMobileNav();
  renderHomeStats();
  renderFeatured();
  renderGenreChips();
  renderCatalog();

  document.querySelectorAll(".tabs [data-type]").forEach(btn => {
    btn.onclick = () => {
      homeState.type = btn.dataset.type;
      document.querySelectorAll(".tabs [data-type]").forEach(b => b.classList.toggle("active", b===btn));
      renderCatalog();
    };
  });

  const sortSel = document.querySelector("#sortSelect");
  if(sortSel){
    sortSel.onchange = () => { homeState.sort = sortSel.value; renderCatalog(); };
  }

  const search = document.querySelector("#search");
  if(search){
    search.oninput = () => { homeState.query = search.value.trim(); renderCatalog(); };
  }
}

/* =========================================================
   منطق صفحة التفاصيل
   ========================================================= */
function setupDetails(){
  setupTheme();
  setupMobileNav();

  const id = new URLSearchParams(location.search).get("id");
  const items = getItems();
  const item = items.find(x => x.id === id);
  const el = document.querySelector("#details");
  if(!el) return;

  if(!item){
    el.innerHTML = `<div class="empty">العمل غير موجود، ربما تم حذفه أو أن الرابط غير صحيح. <a href="index.html">العودة للرئيسية</a></div>`;
    return;
  }

  document.title = `${item.title} — BFlix`;

  const fav = isFavorite(item.id);
  el.innerHTML = `
    <nav class="breadcrumb"><a href="index.html">الرئيسية</a> ← ${item.type==="movie"?"أفلام":"مسلسلات"} ← ${esc(item.title)}</nav>
    <article class="detail">
      <img class="poster" src="${img(item)}" alt="${esc(item.title)}">
      <div>
        <p class="eyebrow">${item.type === "movie" ? "فيلم" : "مسلسل"}</p>
        <h1>${esc(item.title)}</h1>
        <div class="rating-box">${item.rating ? `<b>★ ${item.rating}</b><span class="muted">/ 10</span>` : `<span class="muted">لا يوجد تقييم بعد</span>`}</div>
        <div class="tags">
          <span class="tag">${item.year || "—"}</span>
          ${genresOf(item).map(g => `<span class="tag">${esc(g)}</span>`).join("")}
        </div>
        <p class="desc">${esc(item.description || "لا يوجد وصف بعد لهذا العمل.")}</p>
        <div class="detail-actions">
          ${item.watchUrl ? `<a class="watch" href="${esc(item.watchUrl)}" target="_blank" rel="noopener">مشاهدة الآن ↗</a>` : ""}
          <button class="ghost" id="favToggle">${fav ? "♥ في المفضلة" : "♡ أضف للمفضلة"}</button>
          <button class="ghost" id="shareBtn">↗ مشاركة الرابط</button>
        </div>
      </div>
    </article>
    <section class="related">
      <h2>أعمال مشابهة</h2>
      <div class="grid" id="relatedGrid"></div>
    </section>
  `;

  document.querySelector("#favToggle").onclick = () => {
    const nowFav = toggleFavorite(item.id);
    document.querySelector("#favToggle").textContent = nowFav ? "♥ في المفضلة" : "♡ أضف للمفضلة";
    toast(nowFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
  };
  document.querySelector("#shareBtn").onclick = async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      toast("تم نسخ رابط الصفحة");
    }catch(e){ toast("تعذر نسخ الرابط"); }
  };

  const myGenres = genresOf(item);
  const related = items
    .filter(x => x.id !== item.id && genresOf(x).some(g => myGenres.includes(g)))
    .slice(0, 5);
  const relatedGrid = document.querySelector("#relatedGrid");
  relatedGrid.innerHTML = related.length
    ? related.map(card).join("")
    : `<div class="empty">لا توجد أعمال مشابهة بعد.</div>`;
}

/* =========================================================
   تشغيل تلقائي حسب الصفحة
   ========================================================= */
(async function boot(){
  const path = location.pathname;

  // لوحة التحكم لها إقلاعها الخاص في admin.js
  if(path.endsWith("admin.html")){
    setupTheme();
    setupMobileNav();
    return;
  }

  await loadItems();

  if(path.endsWith("details.html")){
    setupDetails();
  } else {
    // index.html أو مسار الجذر
    setupHome();
  }

  if(DATA_SOURCE !== "cloud"){
    toast("تعذّر تحميل أحدث البيانات — تعرض الصفحة نسخة محفوظة مؤقتًا.");
  }
})();
