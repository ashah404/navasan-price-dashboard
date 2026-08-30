// ماژول چارت‌های مدرن Area Chart بر پایه ApexCharts (مطابق طراحی Flowbite)
import ApexCharts from 'apexcharts';
import {
  jalaliOf, pad2, toFa, faPrice, DAY_MS, todayMidnightUtcMs,
  CURRENCIES, GOLD, faName, renderSymbolIcon,
} from './data.js';

const REPO = 'HosseinOdd/Navasan-API';
const GH_COMMITS = `https://api.github.com/repos/${REPO}/commits?per_page=100`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/`;

const HEADERS = { Accept: 'application/vnd.github+json' };
const LOCAL_STORAGE_KEY = 'navasan_all_history_cache_v3';

// رنگ‌ها و تنظیمات بصری نمادها
export const SYMBOL_CONFIGS = {
  usd:      { label: 'دلار آمریکا',        color: '#10b981', unit: 'تومان', dec: 0 },
  eur:      { label: 'یورو',               color: '#3b82f6', unit: 'تومان', dec: 0 },
  gbp:      { label: 'پوند انگلیس',        color: '#8b5cf6', unit: 'تومان', dec: 0 },
  aed:      { label: 'درهم امارات',        color: '#06b6d4', unit: 'تومان', dec: 0 },
  try:      { label: 'لیر ترکیه',          color: '#f43f5e', unit: 'تومان', dec: 0 },
  cad:      { label: 'دلار کانادا',        color: '#ec4899', unit: 'تومان', dec: 0 },
  sekkeh:   { label: 'سکه امامی',          color: '#f59e0b', unit: 'تومان', dec: 0, isGold: true, icon: '🪙' },
  bahar:    { label: 'سکه بهار آزادی',     color: '#eab308', unit: 'تومان', dec: 0, isGold: true, icon: '🪙' },
  nim:      { label: 'نیم سکه',            color: '#d97706', unit: 'تومان', dec: 0, isGold: true, icon: '🪙' },
  rob:      { label: 'ربع سکه',            color: '#b45309', unit: 'تومان', dec: 0, isGold: true, icon: '🪙' },
  gerami:   { label: 'سکه گرمی',           color: '#78350f', unit: 'تومان', dec: 0, isGold: true, icon: '🪙' },
  '18ayar': { label: 'طلای ۱۸ عیار (گرم)', color: '#eab308', unit: 'تومان', dec: 0, isGold: true, icon: '🥇' },
  abshodeh: { label: 'مثقال طلای آبشده',  color: '#ca8a04', unit: 'تومان', dec: 0, isGold: true, icon: '🥇' },
  usd_xau:  { label: 'انس جهانی طلا',     color: '#6366f1', unit: 'دلار',  dec: 2, isGold: true, icon: '🌍' },
};

export function getSymbolMeta(key) {
  const config = SYMBOL_CONFIGS[key] || {};
  const goldMatch = GOLD.find(g => g.key === key);
  const currMatch = CURRENCIES.find(c => c.key === key);

  const label = config.label || goldMatch?.label || currMatch?.label || faName(key);
  const color = config.color || (goldMatch ? '#eab308' : '#3b82f6');
  const unit = config.unit || goldMatch?.unit || 'تومان';
  const dec = config.dec || goldMatch?.dec || 0;

  let iconHtml = '';
  if (config.isGold || goldMatch) {
    iconHtml = `<span class="text-2xl">${config.icon || goldMatch?.icon || '🪙'}</span>`;
  } else {
    iconHtml = renderSymbolIcon(key, '💱', 'w-8 h-5.5 rounded-sm object-cover border border-neutral-700/80 shadow-md inline-block');
  }

  return { label, color, unit, dec, iconHtml };
}

// خواندن و نوشتن کش تاریخچه کامل
function getStoredCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { days: {}, commits: [], commitsTime: 0 };
  } catch {
    return { days: {}, commits: [], commitsTime: 0 };
  }
}

function saveStoredCache(cacheObj) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch { /* ignore */ }
}

let memoryCommits = null;
let memoryCommitsTime = 0;

async function fetchCommitsList() {
  const now = Date.now();
  if (memoryCommits && (now - memoryCommitsTime < 5 * 60 * 1000)) {
    return memoryCommits;
  }

  const stored = getStoredCache();
  if (stored.commits && stored.commits.length > 0 && (now - (stored.commitsTime || 0) < 5 * 60 * 1000)) {
    memoryCommits = stored.commits;
    memoryCommitsTime = stored.commitsTime;
    return memoryCommits;
  }

  try {
    const r = await fetch(GH_COMMITS, { headers: HEADERS });
    if (!r.ok) throw new Error(`GitHub API: HTTP ${r.status}`);
    const list = await r.json();
    if (Array.isArray(list) && list.length > 0) {
      memoryCommits = list.map(c => ({
        sha: c.sha,
        date: c.commit.committer.date,
      }));
      memoryCommitsTime = now;
      stored.commits = memoryCommits;
      stored.commitsTime = now;
      saveStoredCache(stored);
      return memoryCommits;
    }
  } catch (err) {
    console.warn('Commits API fallback to cache:', err);
    if (stored.commits && stored.commits.length > 0) return stored.commits;
    throw err;
  }

  return [];
}

async function fileAt(sha, name) {
  const r = await fetch(`${RAW_BASE}${sha}/data/${name}`);
  if (!r.ok) throw new Error(`raw ${name}: HTTP ${r.status}`);
  return r.json();
}

// استخراج تمام مقادیر یک فایل
function extractValues(obj) {
  const res = {};
  if (!obj || typeof obj !== 'object') return res;
  for (const [k, v] of Object.entries(obj)) {
    if (v && v.value !== undefined && v.value !== null && v.value !== '') {
      res[k] = Number(v.value);
    }
  }
  return res;
}

// دریافت تاریخچه کامل تمام نمادها برای بازه DAYS
export async function getAllHistory(days = 7) {
  const stored = getStoredCache();
  const storedDays = stored.days || {};
  const midnight = todayMidnightUtcMs();

  const targets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const startUtcMs = midnight - i * DAY_MS;
    const endUtcMs = Math.min(startUtcMs + DAY_MS - 1000, Date.now());
    const j = jalaliOf(startUtcMs);
    const dateKey = `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
    const shortLabel = `${pad2(j.jm)}/${pad2(j.jd)}`;
    targets.push({
      dateKey,
      label: toFa(shortLabel),
      fullLabel: toFa(dateKey),
      startUtcMs,
      untilIso: new Date(endUtcMs).toISOString(),
      isToday: (i === 0),
    });
  }

  const neededTargets = targets.filter(t => t.isToday || !storedDays[t.dateKey]);

  if (neededTargets.length > 0) {
    let commits = [];
    try {
      commits = await fetchCommitsList();
    } catch (e) {
      console.warn('Commit list fetch failed:', e);
    }

    if (commits.length > 0) {
      await Promise.all(neededTargets.map(async (t) => {
        const c = commits.find(cm => cm.date <= t.untilIso);
        if (!c) return;

        try {
          const [fiat, gold] = await Promise.all([
            fileAt(c.sha, 'fiat.json').catch(() => null),
            fileAt(c.sha, 'gold.json').catch(() => null),
          ]);

          const combined = {
            ...extractValues(fiat),
            ...extractValues(gold),
          };

          if (!t.isToday) {
            storedDays[t.dateKey] = combined;
          } else {
            t.todayPoint = combined;
          }
        } catch { /* ignore */ }
      }));

      stored.days = storedDays;
      saveStoredCache(stored);
    }
  }

  return targets.map((t) => {
    const data = t.todayPoint || storedDays[t.dateKey] || {};
    return {
      dateKey: t.dateKey,
      label: t.label,
      fullLabel: t.fullLabel,
      data,
    };
  });
}

// درصد تغییر قیمت نماد در بازه
export function calcSymbolChange(points, symbolKey) {
  const usable = points
    .map(p => p.data[symbolKey])
    .filter(v => v !== undefined && v !== null && isFinite(v));

  if (usable.length < 2) {
    return { first: usable[0] || null, last: usable[0] || null, pct: 0, diff: 0 };
  }

  const first = usable[0];
  const last = usable[usable.length - 1];
  const diff = last - first;
  const pct = first > 0 ? (diff / first) * 100 : 0;
  return { first, last, pct, diff };
}

// ساخت نمونه ApexCharts برای یک Area Chart سبک Flowbite
export function createFlowbiteAreaChart(container, { categories, data, color, symbolLabel, unit = 'تومان', dec = 0 }) {
  const isDark = true;
  const options = {
    chart: {
      height: 160,
      maxWidth: '100%',
      type: 'area',
      fontFamily: 'Vazirmatn, sans-serif',
      dropShadow: { enabled: false },
      toolbar: { show: false },
      sparkline: { enabled: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 350,
      },
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val) => {
          if (val === null || val === undefined || !isFinite(val)) return 'نامشخص';
          return `${faPrice(val, dec)} ${unit}`;
        },
        title: {
          formatter: () => `${symbolLabel}: `,
        },
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Vazirmatn, sans-serif',
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.02,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: color, opacity: 0.45 },
          { offset: 100, color: color, opacity: 0.0 },
        ],
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 2.5,
      curve: 'smooth',
      colors: [color],
    },
    markers: {
      size: 0,
      colors: [color],
      strokeColors: '#171717',
      strokeWidth: 2,
      hover: { size: 5 },
    },
    grid: {
      show: true,
      borderColor: '#262626',
      strokeDashArray: 4,
      padding: { left: 6, right: 6, top: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    series: [
      {
        name: symbolLabel,
        data: data,
        color: color,
      },
    ],
    xaxis: {
      categories: categories,
      labels: {
        show: true,
        style: {
          colors: '#737373',
          fontFamily: 'Vazirmatn, sans-serif',
          fontSize: '10.5px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: false,
    },
  };

  const chart = new ApexCharts(container, options);
  chart.render();
  return chart;
}

// ساخت چارت مقایسه‌ای چند نماده
export function createCombinedAreaChart(container, { categories, seriesList }) {
  const options = {
    chart: {
      height: 320,
      maxWidth: '100%',
      type: 'area',
      fontFamily: 'Vazirmatn, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 400 },
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val) => `${toFa(Number(val).toFixed(2))}٪`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'Vazirmatn',
      fontSize: '12px',
      labels: { colors: '#d4d4d4' },
      markers: { width: 10, height: 10, radius: 10 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 95, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 2.5,
      curve: 'smooth',
    },
    grid: {
      show: true,
      borderColor: '#262626',
      strokeDashArray: 4,
      padding: { left: 10, right: 10 },
    },
    series: seriesList,
    xaxis: {
      categories: categories,
      labels: {
        show: true,
        style: { colors: '#737373', fontFamily: 'Vazirmatn', fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (v) => `${toFa(Number(v).toFixed(1))}٪`,
        style: { colors: '#737373', fontFamily: 'Vazirmatn', fontSize: '11px' },
      },
      title: {
        text: 'درصد تغییر نسبت به شروع بازه',
        style: { color: '#737373', fontFamily: 'Vazirmatn', fontSize: '11px' },
      },
    },
  };

  const chart = new ApexCharts(container, options);
  chart.render();
  return chart;
}
