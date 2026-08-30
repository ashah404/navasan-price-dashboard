// مدیریت نصب PWA و راهنمای جامع Add to Home Screen اختصاصی کاربران iPhone / iOS

let deferredPrompt = null;
const DISMISS_STORAGE_KEY = 'navasan_a2hs_dismissed_until';

/**
 * تشخیص دستگاه‌های iOS (iPhone, iPad, iPod)
 */
export function isIOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isAppleTouch = /iphone|ipad|ipod/.test(userAgent) || 
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  return isAppleTouch;
}

/**
 * تشخیص وضعیت اجرای Standalone (آیا قبلاً به صفحه اصلی اضافه شده و باز شده؟)
 */
export function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
}

/**
 * ایجاد و نمایش مودال راهنمای تصویری گام‌به‌گام برای iOS
 */
export function showIOSInstallModal() {
  // اگر مودال قبلاً ساخته شده بود، نمایش دهیم
  let modal = document.getElementById('ios-install-modal');
  if (!modal) {
    modal = createModalElement();
    document.body.appendChild(modal);
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

/**
 * بستن مودال راهنما
 */
export function hideIOSInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

/**
 * ساخت المان HTML مودال راهنما
 */
function createModalElement() {
  const modal = document.createElement('div');
  modal.id = 'ios-install-modal';
  modal.className = 'fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="relative w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-100 animate-pwa-pop max-h-[90vh] overflow-y-auto">
      
      <!-- دکمه بستن -->
      <button id="close-modal-x" class="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- هدر مودال -->
      <div class="flex items-center gap-3 mb-5 pr-1">
        <img src="./apple-touch-icon.png" alt="قیمت چند" class="w-12 h-12 rounded-xl shadow-md border border-emerald-500/30 flex-shrink-0" />
        <div>
          <h3 class="font-bold text-base text-neutral-100 flex items-center gap-1.5">
            <span>نصب وب‌اپ «قیمت چند» روی آیفون</span>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">iOS PWA</span>
          </h3>
          <p class="text-xs text-neutral-400 mt-0.5">اجرا بدون نیاز به اپ‌استور، تمام‌صفحه و با سرعت بالا</p>
        </div>
      </div>

      <!-- مراحل تصویری ۳ گام -->
      <div class="space-y-3.5 my-5">
        
        <!-- گام ۱ -->
        <div class="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
          <div class="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            ۱
          </div>
          <div class="flex-1 text-xs text-neutral-300 leading-relaxed">
            <p class="font-medium text-neutral-200">
              در نوار پایین مرورگر سافاری روی دکمه <span class="text-emerald-400 font-semibold">اشتراک‌گذاری (Share)</span> بزنید.
            </p>
            <div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px]">
              <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>یا آیکون اشتراک‌گذاری اپل</span>
              <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>
        </div>

        <!-- گام ۲ -->
        <div class="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
          <div class="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            ۲
          </div>
          <div class="flex-1 text-xs text-neutral-300 leading-relaxed">
            <p class="font-medium text-neutral-200">
              در منوی باز شده به پایین اسکرول کرده و گزینه <span class="text-emerald-400 font-semibold">«Add to Home Screen»</span> (افزودن به صفحه اصلی) را انتخاب کنید.
            </p>
            <div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px]">
              <svg class="w-4 h-4 text-neutral-100" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add to Home Screen / افزودن به صفحه اصلی</span>
            </div>
          </div>
        </div>

        <!-- گام ۳ -->
        <div class="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
          <div class="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            ۳
          </div>
          <div class="flex-1 text-xs text-neutral-300 leading-relaxed">
            <p class="font-medium text-neutral-200">
              در گوشه بالا سمت راست، دکمه <span class="text-emerald-400 font-semibold">«Add» (افزودن)</span> را لمس کنید تا آیکون برنامه در صفحه گوشی شما قرار گیرد.
            </p>
          </div>
        </div>

      </div>

      <!-- راهنمای سایر مرورگرها -->
      <div class="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/90 leading-relaxed mb-5">
        💡 <strong>نکته:</strong> در صورتی که با مرورگرهای دیگر مانند Chrome یا Telegram هستید، برای بهترین عملکرد ابتدا لینک سایت را در مرورگر <strong>Safari</strong> باز کنید.
      </div>

      <!-- دکمه تایید و بستن -->
      <div class="flex gap-2">
        <button id="close-modal-btn" class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/60 transition">
          متوجه شدم
        </button>
      </div>

    </div>
  `;

  // بستن با کلیک روی بک‌گراند یا دکمه‌ها
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideIOSInstallModal();
  });

  const closeBtnX = modal.querySelector('#close-modal-x');
  const closeBtn = modal.querySelector('#close-modal-btn');
  if (closeBtnX) closeBtnX.addEventListener('click', hideIOSInstallModal);
  if (closeBtn) closeBtn.addEventListener('click', hideIOSInstallModal);

  return modal;
}

/**
 * ساخت بنر شناور راهنما در پایین صفحه برای کاربران iOS
 */
export function initPWAInstall() {
  // اگر در حال حاضر standalone باز شده، نیازی به نمایش اعلان نصب نیست
  if (isStandalone()) {
    return;
  }

  // ثبت ایونت استاندارد beforeinstallprompt برای مرورگرهای اندروید و کروم
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateHeaderInstallBtn(true);
  });

  // بررسی وضعیت dismiss در حافظه محلی (تا کاربر هر بار اذیت نشود)
  const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
  const now = Date.now();
  const isDismissed = dismissedUntil && Number(dismissedUntil) > now;

  // اگر کاربر iOS است و قبلاً بنر را نبسته، بنر شناور نمایش داده شود
  if (isIOS() && !isDismissed) {
    showIOSBottomBanner();
  }

  // اضافه کردن رویداد به دکمه نصب در هدر
  setupHeaderInstallButton();
}

/**
 * تنظیم دکمه نصب در هدر سایت
 */
function setupHeaderInstallButton() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (!installBtn) return;

  if (isStandalone()) {
    installBtn.classList.add('hidden');
    return;
  }

  installBtn.addEventListener('click', async () => {
    if (isIOS()) {
      showIOSInstallModal();
    } else if (deferredPrompt) {
      // اجرای پرامپت استاندارد کروم/اندروید
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.classList.add('hidden');
      }
      deferredPrompt = null;
    } else {
      // برای سایر مرورگرها نیز راهنمای عمومی نمایش دهیم
      showIOSInstallModal();
    }
  });
}

function updateHeaderInstallBtn(hasNativePrompt) {
  const installBtn = document.getElementById('pwa-install-btn');
  if (!installBtn) return;
  if (!isStandalone()) {
    installBtn.classList.remove('hidden');
  }
}

/**
 * ایجاد و نمایش بنر شناور پایین صفحه در آیفون
 */
function showIOSBottomBanner() {
  // تاخیر کوتاه ۲ ثانیه‌ای برای بارگذاری اولیه بهتر
  setTimeout(() => {
    if (isStandalone()) return;
    if (document.getElementById('ios-bottom-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'ios-bottom-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-neutral-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-pwa-pop text-neutral-100';

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="./apple-touch-icon.png" alt="قیمت چند" class="w-10 h-10 rounded-xl shadow border border-neutral-700 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
            <span>نصب روی صفحه اصلی آیفون</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">سریع و آسان</span>
          </h4>
          <p class="text-[11px] text-neutral-400 truncate mt-0.5">دسترسی مستقیم و تمام‌صفحه مانند یک اپلیکیشن</p>
        </div>
        <button id="banner-close-btn" class="text-neutral-500 hover:text-neutral-300 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <button id="banner-guide-btn" class="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>آموزش افزودن به Home Screen</span>
        </button>
        <button id="banner-dismiss-btn" class="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition">
          بعداً
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    const closeBtn = banner.querySelector('#banner-close-btn');
    const dismissBtn = banner.querySelector('#banner-dismiss-btn');
    const guideBtn = banner.querySelector('#banner-guide-btn');

    const dismissBanner = () => {
      // برای ۷ روز بنر را پنهان نگه داریم
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      banner.remove();
    };

    if (closeBtn) closeBtn.addEventListener('click', dismissBanner);
    if (dismissBtn) dismissBtn.addEventListener('click', dismissBanner);
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        banner.remove();
        showIOSInstallModal();
      });
    }
  }, 1500);
}
