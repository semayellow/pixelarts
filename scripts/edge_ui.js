/* ============================================================
   edge_ui.js — краевые UI-элементы:
   1. Навбар, выезжающий сверху при приближении курсора к верхней границе
      (но только если основной .topbar не виден на экране).
   2. Кнопка «наверх» в правом нижнем углу при приближении курсора к нижней границе
      (но только если страница прокручена вниз).
   ============================================================ */

(function () {
  /* --- Настройки поведения --- */
  const TOP_EDGE    = 30;   // px от верхнего края, где показывается навбар
  const NAV_HIDE_Y  = 100;  // если курсор ниже этой Y — навбар скрывается
  const BOTTOM_EDGE = 100;   // px от нижнего края, где показывается кнопка
  const BTN_HIDE_Y  = 100;  // если курсор выше, чем (h - BTN_HIDE_Y) — кнопка скрывается
  const SCROLL_MIN  = 40;   // минимум прокрутки, при котором кнопка вообще актуальна

  let mainTopbar = null;

    function init() {
    mainTopbar = document.querySelector('.app-root > .topbar, body > .topbar, .topbar');

    const navbar    = buildNavbar();
    const scrollBtn = buildScrollTopBtn();
    bind(navbar, scrollBtn);

    /* Переносим кнопки (тема / сетка / 2D-3D) в навбар.
       Кнопки рендерит artworks_render.js, поэтому ждём gallery:ready,
       а также пробуем сразу — на случай, если они уже в DOM. */
    moveControlsToNavbar(navbar);
    document.addEventListener('gallery:ready', () => moveControlsToNavbar(navbar));
  }

  function buildNavbar() {
    const el = document.createElement('header');
    el.className = 'edge-navbar pixel-grid';

    const source = document.querySelector('.app-root > .topbar');
    if (source) {
      el.appendChild(source.cloneNode(true));
    } else {
      el.innerHTML = `<div class="topbar shell"></div>`;
    }

    /* Пустой контейнер справа от .nav для контрольных кнопок */
    const topbar = el.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.nav-controls')) {
      const controls = document.createElement('div');
      controls.className = 'nav-controls';
      topbar.appendChild(controls);
    }

    document.body.appendChild(el);
    return el;
  }

  /* ---------- Перенос контрольных кнопок в навбар ---------- */
  function moveControlsToNavbar(navbar) {
    const controls = navbar.querySelector('.nav-controls');
    if (!controls) return;

    ['themeToggle', 'gridToggle', 'blockModeGlobal'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn && !controls.contains(btn)) {
        controls.appendChild(btn);
      }
    });
  }

  /* ---------- Кнопка «наверх» ---------- */
  function buildScrollTopBtn() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.setAttribute('title', 'Scroll to top');
    btn.innerHTML = `
      <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        <path d="M8 13 V4 M3.5 8.5 L8 4 L12.5 8.5"
              fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="square" stroke-linejoin="miter"/>
      </svg>`;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);
    return btn;
  }

  /* ---------- Проверка: виден ли основной .topbar ---------- */
  function isMainTopbarVisible() {
    if (!mainTopbar) return false;

    const rect = mainTopbar.getBoundingClientRect();
    const vh   = window.innerHeight;

    return rect.bottom > 0 && rect.top < vh;
  }

  /* ---------- Проверка: страница прокручена вниз ---------- */
  function isScrolledDown() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    return y > SCROLL_MIN;
  }

  /* ---------- Обработка курсора ---------- */
  function bind(navbar, scrollBtn) {
    document.addEventListener('mousemove', (e) => {
      const y = e.clientY;
      const h = window.innerHeight;

      /* Верхний край: показать/скрыть навбар */
      if (y <= TOP_EDGE) {
        if (!isMainTopbarVisible()) {
          navbar.classList.add('visible');
        } else {
          navbar.classList.remove('visible');
        }
      } else if (y > NAV_HIDE_Y) {
        navbar.classList.remove('visible');
      }

      /* Нижний край: показать/скрыть кнопку «наверх».
         Учитываем не только позицию курсора, но и факт прокрутки страницы. */
      if (y >= h - BOTTOM_EDGE) {
        if (isScrolledDown()) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
      } else if (y < h - BTN_HIDE_Y) {
        scrollBtn.classList.remove('visible');
      }
    });

    /* Клик по ссылке в навбаре — прячем навбар */
    navbar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navbar.classList.remove('visible');
      });
    });

    /* Если пользователь доскроллил вверх и основной .topbar показался —
       принудительно скрываем плавающий, чтобы не было дубля */
    window.addEventListener('scroll', () => {
      if (isMainTopbarVisible()) {
        navbar.classList.remove('visible');
      }
      /* Если вернулись в самое начало — прячем кнопку «наверх» */
      if (!isScrolledDown()) {
        scrollBtn.classList.remove('visible');
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();