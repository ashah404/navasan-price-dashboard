// لایه دیتا: خواندن fiat.json و gold.json از ریپوی Navasan-API
// بدون API key، بدون محدودیت (فایلهای استاتیک روی raw.githubusercontent.com)

const BASE =
  'https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data';

export async function fetchFiat() {
  const r = await fetch(`${BASE}/fiat.json?cb=${Date.now()}`);
  if (!r.ok) throw new Error(`fiat.json: HTTP ${r.status}`);
  return r.json();
}

export async function fetchGold() {
  const r = await fetch(`${BASE}/gold.json?cb=${Date.now()}`);
  if (!r.ok) throw new Error(`gold.json: HTTP ${r.status}`);
  return r.json();
}

// ---------- کش لوکال نرخ‌های لحظه‌ای ----------
const CACHE_KEY_SPOT = 'navasan_spot_cache_v1';

export function getCachedSpot() {
  try {
    const raw = localStorage.getItem(CACHE_KEY_SPOT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedSpot(fiat, gold) {
  try {
    localStorage.setItem(CACHE_KEY_SPOT, JSON.stringify({
      fiat,
      gold,
      savedAt: Date.now(),
    }));
  } catch { /* ignore storage quota error */ }
}

// ---------- اعداد فارسی ----------
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export const toFa = (s) => String(s ?? '').replace(/[0-9]/g, (d) => FA_DIGITS[+d]);

export function faPrice(value, dec) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  if (n === 0) return toFa('0');

  const digits = dec !== undefined ? dec : (Math.abs(n) < 100 && Math.abs(n) > 0 ? 2 : 0);
  const fixed = n.toFixed(digits);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  
  if (decPart && Number(decPart) !== 0) {
    return toFa(`${grouped}٫${decPart}`);
  }
  return toFa(grouped);
}

// عدد لاتین با جداکننده (برای tooltip)
export const enNum = (n, dec = 0) =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: dec });

// ---------- تاریخ شمسی (jalaali, MIT) ----------
const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
  for (i = 1; i < bl; i += 1) {
    jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function toJalaali(gy, gm, gd) {
  const jdn = g2d(gy, gm, gd);
  let jy = d2g(jdn).gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(r.gy, 3, r.march);
  let k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (jalCal(jy).leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

// ---------- زمان تهران (ایران از ۲۰۲۲ ساعت تابستانی ندارد => UTC+3:30) ----------
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

// نیمهشب تهرانِ امروز، بر حسب UTC
export function todayMidnightUtcMs(now = Date.now()) {
  const t = new Date(now + TEHRAN_OFFSET_MS);
  return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - TEHRAN_OFFSET_MS;
}

export function jalaliOf(utcMs) {
  const t = new Date(utcMs + TEHRAN_OFFSET_MS);
  const j = toJalaali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  return j;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function faDateTime(input = Date.now()) {
  let ms = Number(input);
  if (!isFinite(ms) || ms <= 0) ms = Date.now();
  // اگر تایم‌استمپ به ثانیه بود (مثلاً فرمت یونیکس دیتابیس نووسان):
  if (ms < 1e11) ms *= 1000;

  const t = new Date(ms + TEHRAN_OFFSET_MS);
  const j = toJalaali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  return {
    date: toFa(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`),
    time: toFa(`${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}`),
    full: toFa(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)} — ${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}`),
  };
}

// ---------- پرچم واقعی کشورها (حل مشکل نمایش متنی پرچم‌ها در ویندوز) ----------
export const CURRENCY_FLAGS = {
  usd: 'us', eur: 'eu', gbp: 'gb', aed: 'ae', try: 'tr',
  cad: 'ca', aud: 'au', chf: 'ch', cny: 'cn', jpy: 'jp',
  rub: 'ru', sar: 'sa', kwd: 'kw', inr: 'in', afn: 'af',
  azn: 'az', iqd: 'iq', qar: 'qa', omr: 'om', bhd: 'bh',
  jod: 'jo', sek: 'se', nok: 'no', dkk: 'dk', krw: 'kr',
  sgd: 'sg', hkd: 'hk', myr: 'my', thb: 'th', pkr: 'pk',
  brl: 'br', mxn: 'mx', idr: 'id', zar: 'za', nzd: 'nz',
  egp: 'eg', syp: 'sy', lbp: 'lb', tnd: 'tn', mad: 'ma',
  dzd: 'dz', gel: 'ge', amd: 'am', byn: 'by', kzt: 'kz',
  uzs: 'uz', tjs: 'tj', tmt: 'tm', kgs: 'kg', vnd: 'vn',
  php: 'ph',
};

export function getCurrencyFlagUrl(key) {
  const code = CURRENCY_FLAGS[key?.toLowerCase()];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function renderSymbolIcon(key, fallbackEmoji = '💱', className = 'w-7 h-5 rounded-sm object-cover border border-neutral-700/60 shadow-sm inline-block') {
  const flag = getCurrencyFlagUrl(key);
  if (flag) {
    return `<img src="${flag}" srcset="https://flagcdn.com/w80/${CURRENCY_FLAGS[key?.toLowerCase()]}.png 2x" alt="${key}" class="${className}" loading="lazy" />`;
  }
  return `<span class="text-2xl">${fallbackEmoji}</span>`;
}

// ---------- فهرست اقلام (همان آرایه‌های نود تلگرام با پرچم واقعی) ----------
export const CURRENCIES = [
  { key: 'usd', flag: 'us', label: 'دلار آمریکا' },
  { key: 'eur', flag: 'eu', label: 'یورو' },
  { key: 'gbp', flag: 'gb', label: 'پوند انگلیس' },
  { key: 'aed', flag: 'ae', label: 'درهم امارات' },
  { key: 'try', flag: 'tr', label: 'لیر ترکیه' },
  { key: 'cad', flag: 'ca', label: 'دلار کانادا' },
  { key: 'aud', flag: 'au', label: 'دلار استرالیا' },
  { key: 'chf', flag: 'ch', label: 'فرانک سوئیس' },
  { key: 'cny', flag: 'cn', label: 'یوان چین' },
  { key: 'jpy', flag: 'jp', label: 'ین ژاپن' },
  { key: 'rub', flag: 'ru', label: 'روبل روسیه' },
  { key: 'sar', flag: 'sa', label: 'ریال عربستان' },
  { key: 'kwd', flag: 'kw', label: 'دینار کویت' },
  { key: 'inr', flag: 'in', label: 'روپیه هند' },
  { key: 'afn', flag: 'af', label: 'افغانی' },
];

export const GOLD = [
  { key: 'sekkeh',   icon: '🪙', label: 'سکه امامی' },
  { key: 'bahar',    icon: '🪙', label: 'سکه بهار آزادی' },
  { key: 'nim',      icon: '🪙', label: 'نیم سکه' },
  { key: 'rob',      icon: '🪙', label: 'ربع سکه' },
  { key: 'gerami',   icon: '🪙', label: 'سکه گرمی' },
  { key: '18ayar',   icon: '🥇', label: 'طلای ۱۸ عیار (گرم)' },
  { key: 'abshodeh', icon: '🥇', label: 'مثقال طلای آبشده' },
  { key: 'usd_xau',  icon: '🌍', label: 'انس جهانی طلا', unit: 'دلار', dec: 2 },
];

// اقلام دارای حباب در gold.json
export const BUBBLES = [
  { key: 'bub_sekkeh', of: 'sekkeh', icon: '🪙', label: 'سکه امامی' },
  { key: 'bub_bahar',  of: 'bahar',  icon: '🪙', label: 'سکه بهار آزادی' },
  { key: 'bub_nim',    of: 'nim',    icon: '🪙', label: 'نیم سکه' },
  { key: 'bub_rob',    of: 'rob',    icon: '🪙', label: 'ربع سکه' },
  { key: 'bub_gerami', of: 'gerami', icon: '🪙', label: 'سکه گرمی' },
  { key: 'bub_18ayar',   of: '18ayar',   icon: '🥇', label: 'طلای ۱۸ عیار' },
  { key: 'bub_abshodeh', of: 'abshodeh', icon: '🥇', label: 'طلای آبشده' },
];

// نام فارسی کلیدهای ارزی برای جدول کامل (پیشفرض: خود کلید)
const FA_NAMES = {
  usd: 'دلار آمریکا', eur: 'یورو', gbp: 'پوند انگلیس', aed: 'درهم امارات',
  try: 'لیر ترکیه', cad: 'دلار کانادا', aud: 'دلار استرالیا', chf: 'فرانک سوئیس',
  cny: 'یوان چین', jpy: 'ین ژاپن', rub: 'روبل روسیه', sar: 'ریال عربستان',
  kwd: 'دینار کویت', inr: 'روپیه هند', afn: 'افغانی', azn: 'منات آذربایجان',
  pkr: 'روپیه پاکستان', iqd: 'دینار عراق', thb: 'بات تایلند', myr: 'رینگیت مالزی',
  sgd: 'دلار سنگاپور', hkd: 'دلار هنگکنگ', krw: 'وون کره جنوبی',
  nok: 'کرون نروژ', sek: 'کرون سوئد', dkk: 'کرون دانمارک',
  qar: 'ریال قطر', omr: 'ریال عمان', bhd: 'دینار بحرین', jod: 'دینار اردن',
  btc: 'بیتکوین (دلار)', xag: 'انس نقره جهانی (دلار)',
  aed_cash: 'درهم امارات (اسکناس)', usd_cash: 'دلار آمریکا (اسکناس)',
};

export function faName(key) {
  return FA_NAMES[key] || key;
}
