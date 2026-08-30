// UI اصلی: داشبورد + چارت‌های Area به سبک Flowbite + حباب + جدول کامل ارزها
import './style.css';
import {
  fetchFiat, fetchGold, toFa, faPrice, faDateTime,
  CURRENCIES, GOLD, BUBBLES, faName,
  getCachedSpot, saveCachedSpot, renderSymbolIcon,
} from './data.js';
import {
  getAllHistory, calcSymbolChange, getSymbolMeta,
  createFlowbiteAreaChart, createCombinedAreaChart,
  SYMBOL_CONFIGS,
} from './chart.js';
import { initPWAInstall } from './pwa-install.js';

const app = document.getElementById('app');

// لیست نمادهای فعال پیش‌فرض در کارت‌های چارت
let activeChartSymbols = ['usd', 'eur', 'sekkeh', '18ayar'];
let chartDaysMap = {
  usd: 7,
  eur: 7,
  sekkeh: 7,
  '18ayar': 7,
  combined: 7,
};
let chartInstances = {};
let currentViewMode = 'grid'; // 'grid' | 'combined'
let fullHistoryPointsCache = {}; // days -> points

app.innerHTML = `
<header class="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
  <div class="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between flex-wrap gap-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 grid place-items-center text-xl shadow-lg shadow-emerald-950/50">
        💱
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-bold text-neutral-100">قیمت چند</h1>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            نرخ لحظه‌ای بازار
          </span>
        </div>
        <p id="updated" class="text-xs text-neutral-400 mt-0.5">در حال دریافت جدیدترین نرخ‌ها…</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- دکمه نصب وب‌اپ (iOS / PWA) -->
      <button id="pwa-install-btn" title="نصب برنامه روی صفحه اصلی گوشی" class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-95 px-3 py-1.5 text-xs font-medium text-emerald-300 transition shadow-sm cursor-pointer">
        <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>📱 نصب وب‌اپ</span>
      </button>

      <!-- دکمه رفرش دستی -->
      <button id="refresh-btn" class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 active:scale-95 px-3 py-1.5 text-xs font-medium text-neutral-200 transition">
        <svg id="refresh-icon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span id="refresh-text">به‌روزرسانی</span>
      </button>

      <a href="https://github.com/HosseinOdd/Navasan-API" target="_blank" rel="noopener"
         class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition">
        <span>منبع داده</span>
      </a>
    </div>
  </div>
</header>

<main class="mx-auto max-w-6xl px-4 py-6 space-y-10">

  <!-- کادر وضعیت خطا / اطلاع‌رسانی -->
  <div id="notice-box" class="hidden rounded-xl border p-4 text-sm transition"></div>

  <!-- داشبورد طلا و سکه -->
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold text-neutral-200 flex items-center gap-2">
        <span>🪙</span> طلا و انواع سکه
      </h2>
    </div>
    <div id="gold-cards" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
      ${Array(4).fill(0).map(() => `
        <div class="glass-card rounded-xl p-4 animate-pulse h-28"></div>
      `).join('')}
    </div>

    <!-- ارزهای اصلی -->
    <h2 class="text-base font-bold text-neutral-200 mt-8 mb-4 flex items-center gap-2">
      <span>💵</span> ارزهای پرکاربرد
    </h2>
    <div id="fiat-cards" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      ${Array(5).fill(0).map(() => `
        <div class="glass-card rounded-xl p-4 animate-pulse h-28"></div>
      `).join('')}
    </div>
  </section>

  <!-- بخش چارت‌های Area به سبک Flowbite -->
  <section id="charts-section" class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-neutral-100 flex items-center gap-2">
          <span>📈</span> روند و نمودار تغییرات قیمت
        </h2>
        <p class="text-xs text-neutral-400 mt-0.5">مشاهده تفکیک‌شده نمودار هر نماد با تحلیل رشد و افت قیمت</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- انتخابگر افزودن نماد جدید به چارت‌ها -->
        <div class="relative">
          <select id="add-symbol-select" class="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500 transition cursor-pointer">
            <option value="">➕ افزودن نمودار نماد…</option>
            <optgroup label="طلا و سکه">
              <option value="18ayar">طلای ۱۸ عیار</option>
              <option value="sekkeh">سکه امامی</option>
              <option value="bahar">سکه بهار آزادی</option>
              <option value="nim">نیم سکه</option>
              <option value="rob">ربع سکه</option>
              <option value="gerami">سکه گرمی</option>
              <option value="abshodeh">مثقال طلای آبشده</option>
              <option value="usd_xau">انس جهانی طلا</option>
            </optgroup>
            <optgroup label="ارزها">
              <option value="usd">دلار آمریکا</option>
              <option value="eur">یورو</option>
              <option value="gbp">پوند انگلیس</option>
              <option value="aed">درهم امارات</option>
              <option value="try">لیر ترکیه</option>
              <option value="cad">دلار کانادا</option>
              <option value="aud">دلار استرالیا</option>
              <option value="cny">یوان چین</option>
              <option value="sar">ریال عربستان</option>
            </optgroup>
          </select>
        </div>

        <!-- دکمه جابجایی بین حالت کارت‌های جداگانه و مقایسه‌ای -->
        <div class="flex p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button id="view-grid-btn" class="px-3 py-1 text-xs font-medium rounded-lg transition bg-emerald-600 text-white">
            کارت‌های جداگانه
          </button>
          <button id="view-combined-btn" class="px-3 py-1 text-xs font-medium rounded-lg text-neutral-400 hover:text-white transition">
            نمودار مقایسه‌ای ۳ نماد
          </button>
        </div>
      </div>
    </div>

    <!-- کانتینر اصلی کارت‌های چارت -->
    <div id="chart-view-container">
      <!-- لودینگ موقت چارت‌ها -->
      <div id="charts-loading" class="glass-card rounded-2xl p-10 grid place-items-center text-xs text-neutral-400">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>در حال دریافت داده‌های تاریخی نمودارها…</span>
        </div>
      </div>

      <!-- محفظه گرید کارت‌های جداگانه -->
      <div id="cards-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5"></div>

      <!-- محفظه چارت مقایسه‌ای -->
      <div id="combined-chart-card" class="hidden glass-card rounded-2xl p-5 md:p-6 border border-neutral-800">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 class="text-base font-bold text-neutral-200">مقایسه درصد تغییرات دلار، یورو و سکه امامی</h3>
            <p class="text-xs text-neutral-400 mt-0.5">درصد رشد یا افت نسبت به ابتدای بازه زمانی</p>
          </div>
          <div class="flex gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button data-combined-days="7" class="combined-range-btn px-3 py-1 text-xs rounded-lg font-medium bg-emerald-600 text-white">۷ روز</button>
            <button data-combined-days="14" class="combined-range-btn px-3 py-1 text-xs rounded-lg font-medium text-neutral-400 hover:text-white">۱۴ روز</button>
            <button data-combined-days="30" class="combined-range-btn px-3 py-1 text-xs rounded-lg font-medium text-neutral-400 hover:text-white">۳۰ روز</button>
          </div>
        </div>
        <div id="combined-chart-wrapper" class="w-full"></div>
      </div>
    </div>
  </section>

  <!-- حباب سکه و طلا -->
  <section>
    <div class="mb-4">
      <h2 class="text-base font-bold text-neutral-200 flex items-center gap-2">
        <span>🫧</span> محاسبه حباب سکه و طلا
      </h2>
      <p class="text-xs text-neutral-400 mt-1">
        حباب نشان‌دهنده اختلاف قیمت معامله شده در بازار نسبت به ارزش ذاتی فلز طلا است.
      </p>
    </div>
    <div id="bubble-cards" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3"></div>
  </section>

  <!-- جدول کامل ارزها -->
  <section class="glass-card rounded-2xl p-5 border border-neutral-800">
    <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div>
        <h2 class="text-base font-bold text-neutral-200 flex items-center gap-2">
          <span>🗂</span> فهرست تمام ارزها <span id="fiat-count" class="text-xs font-normal text-neutral-400"></span>
        </h2>
        <p class="text-xs text-neutral-400 mt-0.5">مرتب‌سازی هوشمند و جستجوی لحظه‌ای در بین تمام ارزهای بازار</p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- سلکتور نحوه مرتب‌سازی -->
        <div class="flex items-center gap-1.5 text-xs text-neutral-400">
          <span>مرتب‌سازی:</span>
          <select id="table-sort-select" class="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500 transition cursor-pointer">
            <option value="popular" selected>🌟 ارزهای مهم و پرکاربرد در ابتدا</option>
            <option value="price-desc">💰 بیشترین قیمت (گران‌ترین)</option>
            <option value="price-asc">📉 کمترین قیمت (ارزان‌ترین)</option>
            <option value="name-asc">🔤 نام ارز (الف تا ی)</option>
            <option value="name-desc">🔤 نام ارز (ی تا الف)</option>
            <option value="code-asc">🔠 کد انگلیسی (A تا Z)</option>
            <option value="code-desc">🔠 کد انگلیسی (Z تا A)</option>
          </select>
        </div>

        <div class="relative w-full sm:w-64">
          <input id="search" type="search" placeholder="جستجو بر اساس نام یا کد ارز..."
            class="w-full rounded-xl border border-neutral-700 bg-neutral-900/90 px-3.5 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
        </div>
      </div>
    </div>
    <div class="overflow-x-auto rounded-xl border border-neutral-800">
      <table class="w-full text-xs text-right">
        <thead class="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 select-none">
          <tr>
            <th data-sort-col="name" class="px-4 py-3 font-semibold cursor-pointer hover:text-white transition" title="برای مرتب‌سازی بر اساس نام کلیک کنید">
              <div class="flex items-center gap-1.5">
                <span>عنوان ارز</span>
                <span id="sort-icon-name" class="text-[11px] text-neutral-500">↕</span>
              </div>
            </th>
            <th data-sort-col="code" class="px-4 py-3 font-semibold text-center cursor-pointer hover:text-white transition" title="برای مرتب‌سازی بر اساس کد نماد کلیک کنید">
              <div class="flex items-center justify-center gap-1.5">
                <span>نماد بین‌المللی</span>
                <span id="sort-icon-code" class="text-[11px] text-neutral-500">↕</span>
              </div>
            </th>
            <th data-sort-col="price" class="px-4 py-3 font-semibold text-left cursor-pointer hover:text-white transition" title="برای مرتب‌سازی بر اساس قیمت کلیک کنید">
              <div class="flex items-center justify-end gap-1.5">
                <span>نرخ برابری (تومان)</span>
                <span id="sort-icon-price" class="text-[11px] text-neutral-500">↕</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody id="fiat-table" class="divide-y divide-neutral-800/60 font-medium"></tbody>
      </table>
    </div>
  </section>

  <footer class="border-t border-neutral-800 pt-6 pb-12 text-xs text-neutral-500 text-center leading-6">
    <p>
      داده‌ها به صورت زنده از مخزن عمومی
      <a class="text-neutral-400 underline hover:text-emerald-400 transition" href="https://github.com/HosseinOdd/Navasan-API" target="_blank" rel="noopener">HosseinOdd/Navasan-API</a>
      (استخراج شده از Navasan) دریافت می‌شوند.
    </p>
    <p class="text-neutral-600 mt-1">توسعه یافته با Vite، ApexCharts و Tailwind CSS — با سیستم Area Chart به سبک Flowbite</p>
  </footer>
</main>`;

const changeColor = (pct) =>
  (pct === null || pct === undefined || !isFinite(pct))
    ? 'text-neutral-500'
    : pct > 0
      ? 'text-emerald-400'
      : pct < 0
        ? 'text-rose-400'
        : 'text-neutral-400';

const changeText = (pct) => {
  if (pct === null || pct === undefined || !isFinite(pct)) return '—';
  if (pct === 0) return 'بدون تغییر (۰٪)';
  const sign = pct > 0 ? '＋' : '−';
  return `${sign}${toFa(Math.abs(pct).toFixed(2))}٪`;
};

function card({ iconHtml, icon, label, price, unit, pct }) {
  return `
  <div class="glass-card rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5">
    <div class="flex items-center justify-between">
      <div class="flex items-center">${iconHtml || `<span class="text-2xl">${icon}</span>`}</div>
      <span class="num text-[11px] font-semibold ${changeColor(pct)}">${changeText(pct)}</span>
    </div>
    <div class="mt-2.5 text-xs text-neutral-300 font-medium">${label}</div>
    <div class="num mt-1 text-base sm:text-lg font-bold text-neutral-100" dir="rtl">
      ${price ?? '—'} <span class="text-[11px] font-normal text-neutral-400">${unit || 'تومان'}</span>
    </div>
  </div>`;
}

function bubbleCard({ icon, label, bubble, pct }) {
  let color = 'text-neutral-400', badge = '—', bg = 'bg-neutral-800/40 border-neutral-700/40';
  if (pct !== null && isFinite(pct)) {
    if (pct > 0) {
      color = 'text-amber-400';
      bg = 'bg-amber-950/40 border-amber-800/50';
      badge = '＋' + toFa(Math.abs(pct).toFixed(1)) + '٪ حباب';
    } else if (pct < 0) {
      color = 'text-emerald-400';
      bg = 'bg-emerald-950/40 border-emerald-800/50';
      badge = '−' + toFa(Math.abs(pct).toFixed(1)) + '٪ منفی';
    } else {
      badge = '۰٪ بدون حباب';
    }
  }

  return `
  <div class="glass-card rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5">
    <div class="flex items-center justify-between gap-2">
      <div class="text-2xl">${icon}</div>
      <div class="num rounded-lg border px-2 py-0.5 text-[11px] font-bold ${color} ${bg}">${badge}</div>
    </div>
    <div class="mt-2.5 text-xs text-neutral-300 font-medium">${label}</div>
    <div class="num mt-1 text-xs text-neutral-400" dir="rtl">
      میزان حباب: <span class="text-neutral-200 font-semibold">${bubble == null ? '—' : faPrice(bubble, 0) + ' تومان'}</span>
    </div>
  </div>`;
}

let latestSpotFiat = null;
let latestSpotGold = null;

const POPULAR_KEYS = [
  'usd', 'eur', 'gbp', 'aed', 'try', 'cad', 'aud', 'chf', 'cny', 'jpy',
  'rub', 'sar', 'kwd', 'inr', 'afn', 'azn', 'iqd', 'qar', 'omr', 'bhd',
  'jod', 'sek', 'nok', 'dkk', 'krw', 'sgd', 'myr', 'thb', 'pkr',
];

let tableSortMode = 'popular';

function sortFiatEntries(entries, sortMode) {
  return [...entries].sort((a, b) => {
    const keyA = a[0];
    const keyB = b[0];
    const valA = Number(a[1]?.value) || 0;
    const valB = Number(b[1]?.value) || 0;
    const nameA = faName(keyA);
    const nameB = faName(keyB);

    if (sortMode === 'popular') {
      const idxA = POPULAR_KEYS.indexOf(keyA);
      const idxB = POPULAR_KEYS.indexOf(keyB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return valB - valA;
    }
    if (sortMode === 'price-desc') return valB - valA;
    if (sortMode === 'price-asc') return valA - valB;
    if (sortMode === 'name-asc') return nameA.localeCompare(nameB, 'fa');
    if (sortMode === 'name-desc') return nameB.localeCompare(nameA, 'fa');
    if (sortMode === 'code-asc') return keyA.localeCompare(keyB);
    if (sortMode === 'code-desc') return keyB.localeCompare(keyA);
    return valB - valA;
  });
}

function updateSortIcons() {
  const iconName = document.getElementById('sort-icon-name');
  const iconCode = document.getElementById('sort-icon-code');
  const iconPrice = document.getElementById('sort-icon-price');

  if (iconName) {
    iconName.textContent = tableSortMode === 'name-asc' ? '↑' : tableSortMode === 'name-desc' ? '↓' : '↕';
    iconName.className = `text-[11px] ${tableSortMode.startsWith('name') ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`;
  }
  if (iconCode) {
    iconCode.textContent = tableSortMode === 'code-asc' ? '↑' : tableSortMode === 'code-desc' ? '↓' : '↕';
    iconCode.className = `text-[11px] ${tableSortMode.startsWith('code') ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`;
  }
  if (iconPrice) {
    iconPrice.textContent = tableSortMode === 'price-asc' ? '↑' : tableSortMode === 'price-desc' ? '↓' : (tableSortMode === 'popular' ? '★' : '↕');
    iconPrice.className = `text-[11px] ${(tableSortMode.startsWith('price') || tableSortMode === 'popular') ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`;
  }

  const selectEl = document.getElementById('table-sort-select');
  if (selectEl && selectEl.value !== tableSortMode) {
    selectEl.value = tableSortMode;
  }
}

function renderFiatTable() {
  if (!latestSpotFiat) return;

  const rawEntries = Object.entries(latestSpotFiat)
    .filter(([, v]) => v && v.value !== undefined && v.value !== null && v.value !== '');

  const searchInput = document.getElementById('search');
  const needle = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const filtered = rawEntries.filter(([k]) => {
    if (!needle) return true;
    return k.toLowerCase().includes(needle) || faName(k).toLowerCase().includes(needle);
  });

  const sorted = sortFiatEntries(filtered, tableSortMode);

  const tbody = document.getElementById('fiat-table');
  const countEl = document.getElementById('fiat-count');
  if (countEl) countEl.textContent = `(${toFa(rawEntries.length)} مورد)`;

  if (!tbody) return;

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-neutral-500">ارزی با عنوان یا کد «${needle}» یافت نشد</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(([k, v]) => `
    <tr class="hover:bg-neutral-900/60 transition">
      <td class="px-4 py-2.5 text-neutral-200 flex items-center gap-2.5">
        ${renderSymbolIcon(k, '💱', 'w-5.5 h-4 rounded-sm object-cover border border-neutral-700/70 shadow-sm inline-block')}
        <span>${faName(k)}</span>
      </td>
      <td class="px-4 py-2.5 text-center text-neutral-400 font-mono text-xs" dir="ltr">${k.toUpperCase()}</td>
      <td class="num px-4 py-2.5 text-left font-bold text-neutral-100" dir="ltr">${faPrice(v.value)}</td>
    </tr>`).join('');

  updateSortIcons();
}

function renderSpotUI(fiat, gold, isCached = false) {
  latestSpotFiat = fiat;
  latestSpotGold = gold;

  const serverTimestamp = gold?.sekkeh?.date || fiat?.usd?.date || null;
  const dt = serverTimestamp ? faDateTime(serverTimestamp) : faDateTime();
  const updatedEl = document.getElementById('updated');
  if (updatedEl) {
    updatedEl.innerHTML = `آخرین نرخ بازار: <span class="text-neutral-200 font-semibold">${dt.full || `${dt.date} — ساعت ${dt.time}`}</span> ${isCached ? '<span class="text-amber-400 text-[10px]">(کش محلی)</span>' : ''}`;
  }

  const goldPct = (k) => gold[k]?.change_pct ?? null;
  document.getElementById('gold-cards').innerHTML = GOLD.map((g) => card({
    icon: g.icon, label: g.label, unit: g.unit,
    price: faPrice(gold[g.key]?.value, g.dec), pct: goldPct(g.key),
  })).join('');

  document.getElementById('fiat-cards').innerHTML = CURRENCIES.map((c) => card({
    iconHtml: renderSymbolIcon(c.key, '💱', 'w-8 h-5.5 rounded-sm object-cover border border-neutral-700/80 shadow-md inline-block'),
    label: c.label,
    price: faPrice(fiat[c.key]?.value), pct: fiat[c.key]?.change_pct ?? null,
  })).join('');

  // رندر جدول ارزها با مرتب‌سازی فعال
  renderFiatTable();

  // حباب‌ها
  document.getElementById('bubble-cards').innerHTML = BUBBLES.map((b) => {
    const val = Number(gold[b.of]?.value);
    const bub = Number(gold[b.key]?.value);
    const pct = (bub != null && isFinite(bub) && val && isFinite(val) && val - bub > 0)
      ? (bub / (val - bub)) * 100
      : null;
    return bubbleCard({ icon: b.icon, label: b.label, bubble: isFinite(bub) ? bub : null, pct });
  }).join('');
}

// گوش دادن به جستجو در جدول
document.getElementById('search').addEventListener('input', () => {
  renderFiatTable();
});

// گوش دادن به تغییر سلکتور مرتب‌سازی
document.getElementById('table-sort-select').addEventListener('change', (e) => {
  tableSortMode = e.target.value;
  renderFiatTable();
});

// گوش دادن به کلیک روی هدرهای جدول برای مرتب‌سازی سریع
document.querySelectorAll('th[data-sort-col]').forEach((th) => {
  th.addEventListener('click', () => {
    const col = th.getAttribute('data-sort-col');
    if (col === 'price') {
      tableSortMode = tableSortMode === 'price-desc' ? 'price-asc' : 'price-desc';
    } else if (col === 'name') {
      tableSortMode = tableSortMode === 'name-asc' ? 'name-desc' : 'name-asc';
    } else if (col === 'code') {
      tableSortMode = tableSortMode === 'code-asc' ? 'code-desc' : 'code-asc';
    }
    renderFiatTable();
  });
});

// ==========================================
// منطق چارت‌های Flowbite Area Chart
// ==========================================

// دریافت تاریخچه بازه مشخص
async function getHistoryData(days = 7) {
  if (fullHistoryPointsCache[days]) {
    return fullHistoryPointsCache[days];
  }
  const points = await getAllHistory(days);
  fullHistoryPointsCache[days] = points;
  return points;
}

// ساخت ساختار HTML یک کارت چارت مطابق تصویر Flowbite
function generateFlowbiteCardHTML(symbolKey, days = 7) {
  const meta = getSymbolMeta(symbolKey);
  return `
  <div id="area-card-${symbolKey}" class="glass-card rounded-2xl p-5 md:p-6 border border-neutral-800 flex flex-col justify-between relative shadow-lg">
    <!-- دکمه حذف کارت اگر بیش از ۳ نماد باشد -->
    ${activeChartSymbols.length > 1 ? `
      <button data-remove-card="${symbolKey}" title="حذف این کارت" class="absolute top-3 left-3 text-neutral-500 hover:text-rose-400 text-xs p-1 rounded-md transition">
        ✕
      </button>
    ` : ''}

    <!-- هدر کارت مطابق تصویر Flowbite -->
    <div class="flex justify-between items-start mb-2">
      <div>
        <div class="flex items-center gap-2.5">
          ${meta.iconHtml}
          <h5 id="price-val-${symbolKey}" class="text-2xl font-bold text-neutral-100 num">—</h5>
        </div>
        <p class="text-xs text-neutral-400 font-medium mt-1">${meta.label}</p>
      </div>

      <div id="pct-badge-${symbolKey}" class="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold text-neutral-400 bg-neutral-800/60 border border-neutral-700/50">
        <span>—</span>
      </div>
    </div>

    <!-- محفظه نمودار ApexCharts -->
    <div id="area-chart-${symbolKey}" class="w-full h-44 my-1"></div>

    <!-- فوتر با دراپ‌داون مطابق کد Flowbite -->
    <div class="grid grid-cols-1 items-center border-t border-neutral-800/80 pt-4 justify-between">
      <div class="flex justify-between items-center relative">
        <!-- دکمه دراپ‌داون بازه -->
        <div class="relative">
          <button data-dropdown-btn="${symbolKey}" class="text-xs font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition">
            <span id="range-label-${symbolKey}">${toFa(days)} روز گذشته</span>
            <svg class="w-3.5 h-3.5 text-neutral-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
          </button>
          <!-- منوی دراپ‌داون بازشونده -->
          <div id="dropdown-${symbolKey}" class="flowbite-dropdown">
            <ul class="p-1.5 text-xs text-neutral-300 font-medium space-y-0.5">
              <li><button data-set-days="7" data-target="${symbolKey}" class="w-full text-right px-3 py-1.5 hover:bg-neutral-800 hover:text-emerald-400 rounded-lg transition">۷ روز گذشته</button></li>
              <li><button data-set-days="14" data-target="${symbolKey}" class="w-full text-right px-3 py-1.5 hover:bg-neutral-800 hover:text-emerald-400 rounded-lg transition">۱۴ روز گذشته</button></li>
              <li><button data-set-days="30" data-target="${symbolKey}" class="w-full text-right px-3 py-1.5 hover:bg-neutral-800 hover:text-emerald-400 rounded-lg transition">۳۰ روز گذشته</button></li>
            </ul>
          </div>
        </div>

        <div class="text-[11px] text-neutral-400 flex items-center gap-1">
          <span>تغییر دوره:</span>
          <span id="diff-val-${symbolKey}" class="num font-semibold text-neutral-200">—</span>
        </div>
      </div>
    </div>
  </div>`;
}

// به‌روزرسانی محتوا و نمودار یک کارت
async function renderSingleCardChart(symbolKey) {
  const days = chartDaysMap[symbolKey] || 7;
  const meta = getSymbolMeta(symbolKey);
  const points = await getHistoryData(days);

  const categories = points.map(p => p.label);
  const data = points.map(p => p.data[symbolKey] ?? null);

  const stat = calcSymbolChange(points, symbolKey);

  // ۱. آپدیت قیمت لحظه‌ای در بالای کارت
  const priceEl = document.getElementById(`price-val-${symbolKey}`);
  if (priceEl) {
    const currentVal = stat.last;
    if (currentVal !== null) {
      priceEl.textContent = (meta.unit === 'دلار') ? `${faPrice(currentVal, meta.dec)} $` : `${faPrice(currentVal, meta.dec)} تومان`;
    }
  }

  // ۲. آپدیت برچسب درصد با آیکون فلش صعودی/نزولی
  const badgeEl = document.getElementById(`pct-badge-${symbolKey}`);
  if (badgeEl) {
    const isPos = stat.pct > 0;
    const isNeg = stat.pct < 0;
    const arrowIcon = isPos
      ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>`
      : isNeg
        ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>`
        : ``;

    const colorClass = isPos
      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
      : isNeg
        ? 'text-rose-400 bg-rose-950/60 border-rose-800/60'
        : 'text-neutral-400 bg-neutral-800/60 border-neutral-700/50';

    badgeEl.className = `flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass} border`;
    badgeEl.innerHTML = `${arrowIcon} <span>${stat.pct !== null ? `${toFa(Math.abs(stat.pct).toFixed(1))}٪` : '—'}</span>`;
  }

  // ۳. آپدیت مقدار تفاوت ریالی
  const diffEl = document.getElementById(`diff-val-${symbolKey}`);
  if (diffEl) {
    if (stat.diff !== 0) {
      const sign = stat.diff > 0 ? '＋' : '−';
      diffEl.textContent = `${sign}${faPrice(Math.abs(stat.diff), meta.dec)} ${meta.unit}`;
      diffEl.className = `num font-semibold ${stat.diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    } else {
      diffEl.textContent = '۰ تومان';
      diffEl.className = 'num font-semibold text-neutral-400';
    }
  }

  // ۴. رسم نمودار Area Chart
  const chartContainer = document.getElementById(`area-chart-${symbolKey}`);
  if (chartContainer) {
    if (chartInstances[symbolKey]) {
      chartInstances[symbolKey].destroy();
    }
    chartInstances[symbolKey] = createFlowbiteAreaChart(chartContainer, {
      categories,
      data,
      color: meta.color,
      symbolLabel: meta.label,
      unit: meta.unit,
      dec: meta.dec,
    });
  }
}

// رندر کل کارت‌های گرید
async function renderAllCardsGrid() {
  const gridContainer = document.getElementById('cards-grid');
  const loadingEl = document.getElementById('charts-loading');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (gridContainer) {
    gridContainer.innerHTML = activeChartSymbols.map(sym => generateFlowbiteCardHTML(sym, chartDaysMap[sym] || 7)).join('');
  }

  // دریافت پیش‌نیاز دیتای اولیه
  await getHistoryData(7);

  // رسم نمودار هر کارت به صورت موازی
  await Promise.all(activeChartSymbols.map(sym => renderSingleCardChart(sym)));

  if (loadingEl) loadingEl.classList.add('hidden');
  if (gridContainer) gridContainer.classList.remove('hidden');
}

// رندر چارت مقایسه‌ای ۳ نماد
async function renderCombinedChart() {
  const days = chartDaysMap.combined || 7;
  const points = await getHistoryData(days);
  const categories = points.map(p => p.label);

  const compareKeys = ['usd', 'eur', 'sekkeh'];
  const seriesList = compareKeys.map(k => {
    const meta = getSymbolMeta(k);
    const firstVal = points.find(p => p.data[k] !== undefined && p.data[k] !== null)?.data[k];
    const pctData = points.map(p => {
      const v = p.data[k];
      if (v === undefined || v === null || !firstVal) return null;
      return Number((((v - firstVal) / firstVal) * 100).toFixed(2));
    });

    return {
      name: meta.label,
      data: pctData,
      color: meta.color,
    };
  });

  const wrapper = document.getElementById('combined-chart-wrapper');
  if (wrapper) {
    if (chartInstances['combined']) {
      chartInstances['combined'].destroy();
    }
    chartInstances['combined'] = createCombinedAreaChart(wrapper, { categories, seriesList });
  }
}

// مدیریت کلیک‌های رویداد کارت‌ها (دراپ‌داون‌ها، تغییر بازه، حذف کارت)
document.addEventListener('click', (e) => {
  // ۱. کلیک روی دکمه باز کردن دراپ‌داون بازه زمانی
  const dropdownBtn = e.target.closest('[data-dropdown-btn]');
  if (dropdownBtn) {
    e.stopPropagation();
    const sym = dropdownBtn.getAttribute('data-dropdown-btn');
    const dropdown = document.getElementById(`dropdown-${sym}`);
    // بستن بقیه دراپ‌داون‌ها
    document.querySelectorAll('.flowbite-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('show');
    });
    if (dropdown) dropdown.classList.toggle('show');
    return;
  }

  // ۲. کلیک روی گزینه انتخاب بازه زمانی
  const setDaysBtn = e.target.closest('[data-set-days]');
  if (setDaysBtn) {
    const sym = setDaysBtn.getAttribute('data-target');
    const days = Number(setDaysBtn.getAttribute('data-set-days'));
    chartDaysMap[sym] = days;

    const labelEl = document.getElementById(`range-label-${sym}`);
    if (labelEl) labelEl.textContent = `${toFa(days)} روز گذشته`;

    const dropdown = document.getElementById(`dropdown-${sym}`);
    if (dropdown) dropdown.classList.remove('show');

    renderSingleCardChart(sym);
    return;
  }

  // ۳. کلیک برای حذف کارت
  const removeBtn = e.target.closest('[data-remove-card]');
  if (removeBtn) {
    const sym = removeBtn.getAttribute('data-remove-card');
    activeChartSymbols = activeChartSymbols.filter(s => s !== sym);
    if (chartInstances[sym]) {
      chartInstances[sym].destroy();
      delete chartInstances[sym];
    }
    renderAllCardsGrid();
    return;
  }

  // کلیک بیرون => بستن همه دراپ‌داون‌ها
  document.querySelectorAll('.flowbite-dropdown').forEach(d => d.classList.remove('show'));
});

// افزودن نماد جدید از سلکتور
document.getElementById('add-symbol-select').addEventListener('change', (e) => {
  const selected = e.target.value;
  if (!selected) return;
  if (!activeChartSymbols.includes(selected)) {
    activeChartSymbols.push(selected);
    chartDaysMap[selected] = 7;
    renderAllCardsGrid();
  }
  e.target.value = '';
});

// دکمه‌های جابجایی تب بین گرید و مقایسه‌ای
const viewGridBtn = document.getElementById('view-grid-btn');
const viewCombinedBtn = document.getElementById('view-combined-btn');
const gridViewEl = document.getElementById('cards-grid');
const combinedViewEl = document.getElementById('combined-chart-card');

viewGridBtn.addEventListener('click', () => {
  currentViewMode = 'grid';
  viewGridBtn.className = 'px-3 py-1 text-xs font-medium rounded-lg transition bg-emerald-600 text-white';
  viewCombinedBtn.className = 'px-3 py-1 text-xs font-medium rounded-lg text-neutral-400 hover:text-white transition';
  gridViewEl.classList.remove('hidden');
  combinedViewEl.classList.add('hidden');
  renderAllCardsGrid();
});

viewCombinedBtn.addEventListener('click', () => {
  currentViewMode = 'combined';
  viewCombinedBtn.className = 'px-3 py-1 text-xs font-medium rounded-lg transition bg-emerald-600 text-white';
  viewGridBtn.className = 'px-3 py-1 text-xs font-medium rounded-lg text-neutral-400 hover:text-white transition';
  gridViewEl.classList.add('hidden');
  combinedViewEl.classList.remove('hidden');
  renderCombinedChart();
});

// بازه‌های زمانی در چارت مقایسه‌ای
document.querySelectorAll('.combined-range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.combined-range-btn').forEach(b => {
      b.className = 'combined-range-btn px-3 py-1 text-xs rounded-lg font-medium text-neutral-400 hover:text-white';
    });
    btn.className = 'combined-range-btn px-3 py-1 text-xs rounded-lg font-medium bg-emerald-600 text-white';
    chartDaysMap.combined = Number(btn.getAttribute('data-combined-days'));
    renderCombinedChart();
  });
});

// ---------- بارگذاری داده‌های لحظه‌ای ----------
async function loadSpot(showLoadingAnimation = false) {
  const refreshIcon = document.getElementById('refresh-icon');
  const refreshText = document.getElementById('refresh-text');
  const noticeBox = document.getElementById('notice-box');

  if (showLoadingAnimation && refreshIcon) {
    refreshIcon.classList.add('animate-spin-custom');
    if (refreshText) refreshText.textContent = 'دریافت…';
  }

  try {
    const [fiat, gold] = await Promise.all([fetchFiat(), fetchGold()]);
    saveCachedSpot(fiat, gold);
    renderSpotUI(fiat, gold, false);
    if (noticeBox) noticeBox.classList.add('hidden');
  } catch (err) {
    console.error('Fetch spot error:', err);
    const cached = getCachedSpot();
    if (cached && cached.fiat && cached.gold) {
      renderSpotUI(cached.fiat, cached.gold, true);
      if (noticeBox) {
        noticeBox.className = 'rounded-xl border border-amber-900/70 bg-amber-950/40 p-3 text-xs text-amber-300 mb-6';
        noticeBox.innerHTML = `⚠️ عدم امکان دریافت داده جدید (${err.message}). داده‌های ذخیره شده در حافظه نمایش داده می‌شوند.`;
        noticeBox.classList.remove('hidden');
      }
    } else {
      if (noticeBox) {
        noticeBox.className = 'rounded-xl border border-red-900 bg-red-950/40 p-4 text-xs text-red-300 mb-6';
        noticeBox.textContent = `خطا در دریافت نرخ‌ها: ${err.message}. لطفاً اتصال اینترنت خود را بررسی کنید.`;
        noticeBox.classList.remove('hidden');
      }
    }
  } finally {
    if (refreshIcon) {
      setTimeout(() => {
        refreshIcon.classList.remove('animate-spin-custom');
        if (refreshText) refreshText.textContent = 'به‌روزرسانی';
      }, 600);
    }
  }
}

// دکمه رفرش دستی
document.getElementById('refresh-btn').addEventListener('click', () => {
  fullHistoryPointsCache = {};
  loadSpot(true);
  if (currentViewMode === 'grid') {
    renderAllCardsGrid();
  } else {
    renderCombinedChart();
  }
});

// ---------- راه‌اندازی اولیه ----------
const initialCache = getCachedSpot();
if (initialCache && initialCache.fiat && initialCache.gold) {
  renderSpotUI(initialCache.fiat, initialCache.gold, true);
}

loadSpot();
renderAllCardsGrid();
initPWAInstall();

// به‌روزرسانی خودکار هر ۶۰ ثانیه
setInterval(() => {
  loadSpot(false);
}, 60 * 1000);


