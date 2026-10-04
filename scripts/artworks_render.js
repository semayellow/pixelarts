/* ============================================================
   gallery.js — загрузка artworks.json и рендер карточек,
   кнопок типов и дропдауна модов.
   После рендера шлёт событие "gallery:ready".
   ============================================================ */

(function () {
  const ARTWORKS_DATA_URL = 'meta/artworks_meta.json';
  const FILTERS_DATA_URL = 'meta/filters_meta.json';

  async function init() {
    const galleryEl = document.getElementById('gallery');
    const filtersEl = document.getElementById('filters');
    if (!galleryEl || !filtersEl) return;

    let artworks_data;
    let filters_data;

    const artworks_results = await fetch(ARTWORKS_DATA_URL, { cache: 'no-cache' });
    const filters_results = await fetch(FILTERS_DATA_URL, { cache: 'no-cache' });

    artworks_data = await artworks_results.json();
    filters_data = await filters_results.json();

    const artworks = artworks_data.artworks || [];
    const types    = filters_data.types    || [];

    /* ---------- 1. Рендер карточек ---------- */
    galleryEl.innerHTML = artworks.map(cardTemplate).join('');

    /* ---------- 2. Рендер кнопок типов ---------- */
    const existingSelect = filtersEl.querySelector('.mod-filter');

    const typeButtons = [
      `<button class="filter-btn active" data-filter="all">All</button>`,
      ...types.map(t =>
        `<button class="filter-btn" data-filter="${escapeAttr(t.id)}">${escapeHtml(t.label)}</button>`
      ),
    ].join('');

    filtersEl.innerHTML = typeButtons + `
      <div class="mod-filter">
        <div class="mod-select" id="modFilter" tabindex="0" role="combobox"
             aria-haspopup="listbox" aria-expanded="false" aria-label="Filter by mod">
          <span class="mod-select-value">All mods</span>
          <ul class="mod-select-list" role="listbox"></ul>
        </div>
      </div>
      <div class="mod-filter">
        <div class="mod-select" id="sizeFilter" tabindex="0" role="combobox"
             aria-haspopup="listbox" aria-expanded="false" aria-label="Filter by size">
          <span class="mod-select-value">All sizes</span>
          <ul class="mod-select-list" role="listbox"></ul>
        </div>
      </div>
        <button class="theme-toggle" id="themeToggle" type="button"
          aria-label="Theme: dark green" title="Theme: dark green"></button>
      <button class="grid-toggle" id="gridToggle" type="button"
        aria-pressed="false" aria-label="Toggle pixel grid" title="Toggle pixel grid">
          <svg viewBox="0 0 15 15" width="26" height="26" aria-hidden="true">
            <rect x="0"  y="0"  width="3" height="3" fill="currentColor"/>
            <rect x="4"  y="0"  width="3" height="3" fill="currentColor"/>
            <rect x="8"  y="0"  width="3" height="3" fill="currentColor"/>
            <rect x="12" y="0"  width="3" height="3" fill="currentColor"/>

            <rect x="0"  y="4"  width="3" height="3" fill="currentColor"/>
            <rect x="4"  y="4"  width="3" height="3" fill="currentColor"/>
            <rect x="8"  y="4"  width="3" height="3" fill="currentColor"/>
            <rect x="12" y="4"  width="3" height="3" fill="currentColor"/>

            <rect x="0"  y="8"  width="3" height="3" fill="currentColor"/>
            <rect x="4"  y="8"  width="3" height="3" fill="currentColor"/>
            <rect x="8"  y="8"  width="3" height="3" fill="currentColor"/>
            <rect x="12" y="8"  width="3" height="3" fill="currentColor"/>

            <rect x="0"  y="12" width="3" height="3" fill="currentColor"/>
            <rect x="4"  y="12" width="3" height="3" fill="currentColor"/>
            <rect x="8"  y="12" width="3" height="3" fill="currentColor"/>
            <rect x="12" y="12" width="3" height="3" fill="currentColor"/>
          </svg>
        </button>`;
    /* ---------- 3. Дропдауны: моды и размеры ---------- */
    const modSelectRoot = document.getElementById('modFilter');
    if (modSelectRoot) {
      const listEl  = modSelectRoot.querySelector('.mod-select-list');
      const valueEl = modSelectRoot.querySelector('.mod-select-value');

      const mods = ['all', ...[...new Set(artworks.map(a => a.mod).filter(Boolean))].sort()];

      listEl.innerHTML = mods.map(mod => `
        <li role="option" data-value="${escapeAttr(mod)}"
            ${mod === 'all' ? 'aria-selected="true"' : ''}>
          ${mod === 'all' ? 'All mods' : escapeHtml(mod)}
        </li>`).join('');

      valueEl.textContent = 'All mods';
    }

    const sizeSelectRoot = document.getElementById('sizeFilter');
    if (sizeSelectRoot) {
      const listEl  = sizeSelectRoot.querySelector('.mod-select-list');
      const valueEl = sizeSelectRoot.querySelector('.mod-select-value');

      const sizes = ['all', ...[...new Set(artworks.map(a => a.size).filter(Boolean))]
        .sort((a, b) => parseInt(a) - parseInt(b))];

      listEl.innerHTML = sizes.map(size => `
        <li role="option" data-value="${escapeAttr(size)}"
            ${size === 'all' ? 'aria-selected="true"' : ''}>
          ${size === 'all' ? 'All sizes' : escapeHtml(size)}
        </li>`).join('');

      valueEl.textContent = 'All sizes';
    }

    /* ---------- 4. Сообщаем всем, что галерея готова ---------- */
    document.dispatchEvent(new CustomEvent('gallery:ready'));
    /* ---------- Drag-to-rotate для .block-3d ---------- */
    initBlockRotation();
    initBlockModeToggle();
    initThemeToggle();
    initGridToggle();
    initReferenceHovers();
  }

  /* ---------- Шаблон карточки ---------- */
    function cardTemplate(a) {
      const isBlock = (a.type || '').trim() === 'block';

      const isEnchanted =
        a.enchanted === true || a.enchanted === 1 || a.enchanted === 'true';

      const artClass =
        'art' +
        (isBlock ? ' art--block' : '') +
        (isEnchanted ? ' enchanted' : '');

      const glint = (isEnchanted && !isBlock) ? glintTemplate(a.image) : '';

      // «16×16» → 16; «32×32» → 32; fallback 16
      const gridCount = parseInt(a.size, 10) || 16;
      const blockModeAttr = isBlock ? ' data-block-mode="3d"' : '';

      return `
        <article class="card"
                 data-type="${escapeAttr(a.type || '')}"
                 data-mod="${escapeAttr(a.mod || '')}"
                 data-size="${escapeAttr(a.size || '')}"
                 data-artwork-id="${escapeAttr(a.id || '')}">
          <div class="${artClass}" style="--grid-count:${gridCount}">
            ${isBlock
              ? blockTemplate(a, isEnchanted ? ' enchanted' : '')
              : imageTemplate(a)}
            ${glint}
          </div>

          <div class="card-body">
            <h3 class="card-title">${escapeHtml(a.title || '')}</h3>
            ${a.size ? `<div class="size">${escapeHtml(a.size)}</div>` : ''}

            <div class="badges">
              ${a.mod  ? `<span class="badge">${escapeHtml(a.mod)}</span>` : ''}
              ${a.type ? `<span class="badge type">${escapeHtml(typeLabel(a.type))}</span>` : ''}
              ${a.references ? referenceTemplate(a.references) : ''}
            </div>
          </div>
        </article>`;
    }

    /* Обычное изображение — item / animated item */
    function imageTemplate(a) {
      return `<img class="pixel-art"
                   src="${escapeAttr(a.image)}"
                   alt="${escapeAttr(a.alt || a.title || '')}"
                   loading="lazy">`;
    }

    /* Куб — одно изображение на все 6 граней */
    function blockTemplate(a, enchanted) {
      const url  = escapeAttr(a.image);
      const alt  = escapeAttr(a.alt || a.title || 'Block preview');
      const face = cls =>
        `<div class="face ${cls}" style="background-image:url('${url}')"></div>`;

      return `
        <img class="pixel-art block-image"
             src="${url}"
             alt="${alt}"
             loading="lazy">

        <div class="block-3d${enchanted || ''}" aria-label="${alt}">
          ${face('front')}
          ${face('back')}
          ${face('right')}
          ${face('left')}
          ${face('top')}
          ${face('bottom')}
        </div>

        <button class="block-mode-toggle" type="button"
                aria-pressed="false"
                aria-label="Toggle 3D / 2D view"
                title="Toggle 3D / 2D view">
          <svg class="icon-cube" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1 L14 4 L14 12 L8 15 L2 12 L2 4 Z"
                  fill="none" stroke="currentColor" stroke-width="1.4"/>
            <path d="M2 4 L8 7 L14 4 M8 7 L8 15"
                  fill="none" stroke="currentColor" stroke-width="1.4"/>
          </svg>
          <svg class="icon-flat" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <rect x="2" y="2" width="12" height="12"
                  fill="none" stroke="currentColor" stroke-width="1.4"/>
          </svg>
        </button>

        <button class="block-reset" type="button"
                aria-label="Reset rotation" title="Reset rotation">⟲</button>`;
    }
    function initBlockRotation() {
      const cubes = document.querySelectorAll('.block-3d');

      cubes.forEach(function (cube) {
        const START_X = -25;
        const START_Y = -35;

        let rotX = START_X;
        let rotY = START_Y;
        let startX = 0, startY = 0;
        let baseX  = 0, baseY  = 0;
        let dragging = false;

        function apply() {
          cube.style.transform =
            'translate(-50%, -50%) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        }
        apply();

        cube.addEventListener('pointerdown', function (e) {
          dragging = true;
          cube.classList.add('dragging');
          cube.setPointerCapture(e.pointerId);
          startX = e.clientX;
          startY = e.clientY;
          baseX = rotX;
          baseY = rotY;
        });

        cube.addEventListener('pointermove', function (e) {
          if (!dragging) return;
          rotX = baseX - (e.clientY - startY) * 0.5;
          rotY = baseY + (e.clientX - startX) * 0.5;
          apply();
        });

        function stop(e) {
          if (!dragging) return;
          dragging = false;
          cube.classList.remove('dragging');
          try { cube.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        cube.addEventListener('pointerup', stop);
        cube.addEventListener('pointercancel', stop);

        var resetBtn = cube.parentElement.querySelector('.block-reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            rotX = START_X;
            rotY = START_Y;
            cube.style.transition = 'transform .35s ease';
            apply();
            setTimeout(function () { cube.style.transition = ''; }, 400);
          });
        }
      });
    }

    /* ---------- Theme cycle: green → white → black ---------- */
    function initThemeToggle() {
      const btn  = document.getElementById('themeToggle');
      const root = document.documentElement;      // было: .app-root
      if (!btn || !root) return;

      const states = ['green', 'white', 'black'];
      const labels = {
        green: 'Theme: dark green',
        white: 'Theme: white',
        black: 'Theme: black',
      };
      let i = 0;

      function apply() {
        root.dataset.theme = states[i];
        btn.title = labels[states[i]];
        btn.setAttribute('aria-label', labels[states[i]]);
      }
      apply();

      btn.addEventListener('click', () => {
        i = (i + 1) % states.length;
        apply();
      });
    }

    /* ---------- Grid overlay toggle ---------- */
    function initGridToggle() {
      const btn  = document.getElementById('gridToggle');
      const root = document.documentElement;      // было: .app-root
      if (!btn || !root) return;

      btn.addEventListener('click', () => {
        const on = root.dataset.grid === 'on';
        root.dataset.grid = on ? 'off' : 'on';
        btn.classList.toggle('active', !on);
        btn.setAttribute('aria-pressed', String(!on));
      });
    }

    function initBlockModeToggle() {
      document.querySelectorAll('.block-mode-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const art = btn.closest('.art');
          if (!art) return;

          const current = art.dataset.blockMode || '3d';
          const next    = current === '3d' ? '2d' : '3d';
          art.dataset.blockMode = next;
          btn.setAttribute('aria-pressed', String(next === '2d'));
        });
      });
    }

    /* «Неактивная» кнопка REF: попап с одним или несколькими референсами */
    function referenceTemplate(refs) {
      if (!Array.isArray(refs) || !refs.length) return '';
      const json = escapeAttr(JSON.stringify(refs));
      return `<span class="reference"
                    tabindex="0"
                    role="button"
                    data-ref-json="${json}">
                <span>REF</span>
              </span>`;
    }

   /* ---------- REF popups ---------- */
    function initReferenceHovers() {
      document.querySelectorAll('.reference').forEach(ref => {
        let refs;
        try {
          refs = JSON.parse(ref.dataset.refJson || '[]');
        } catch (_) {
          return;
        }
        if (!Array.isArray(refs) || !refs.length) return;

        let popup = null;

        function build() {
          const card = ref.closest('.card');
          const artEl = card ? card.querySelector('.art') : null;
          const gridCount = artEl
            ? (artEl.style.getPropertyValue('--grid-count').trim() || '16')
            : '16';

          const items = refs.map(r => `
            <div class="reference-popup-item">
              <div class="reference-popup-image">
                <img src="${escapeAttr(r.reference_image || '')}"
                     alt="" draggable="false">
              </div>
              ${r.reference_text ? `
                <div class="reference-popup-body">
                  <p class="reference-popup-text">${escapeHtml(r.reference_text)}</p>
                </div>` : ''}
            </div>
          `).join('');

          const el = document.createElement('div');
          el.className = 'reference-popup';
          el.style.setProperty('--grid-count', gridCount);   // ← новая строка
          el.innerHTML = `<div class="reference-popup-list">${items}</div>`;
          document.body.appendChild(el);
          return el;
        }

        function place() {
          const card = ref.closest('.card');
          if (!card) return;

          const cr = card.getBoundingClientRect();
          const pr = popup.getBoundingClientRect();
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const M   = 12;
          const GAP = 12;

          let left = cr.right + GAP;
          let top  = cr.top;

          if (left + pr.width > vw - M) {
            left = cr.left - pr.width - GAP;
          }
          if (left < M) {
            left = Math.max(M, Math.min(vw - pr.width - M,
                         cr.left + cr.width / 2 - pr.width / 2));

            const belowTop = cr.bottom + GAP;
            const aboveTop = cr.top - pr.height - GAP;

            if (belowTop + pr.height <= vh - M)      top = belowTop;
            else if (aboveTop >= M)                  top = aboveTop;
            else top = Math.max(M, Math.min(vh - pr.height - M, cr.top));
          }

          top = Math.max(M, Math.min(vh - pr.height - M, top));

          popup.style.left = left + 'px';
          popup.style.top  = top  + 'px';
        }

        function show() {
          hide();
          popup = build();
          place();
          requestAnimationFrame(() => popup.classList.add('visible'));
        }

        function hide() {
          if (!popup) return;
          const p = popup;
          popup = null;
          p.classList.remove('visible');
          setTimeout(() => p.remove(), 200);
        }

        ref.addEventListener('mouseenter', show);
        ref.addEventListener('mouseleave', hide);
        ref.addEventListener('focus',      show);
        ref.addEventListener('blur',       hide);
      });
    }

  function typeLabel(id) {
    // "animated item" → "Animated Item"
    return id.replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ---------- Утилиты ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();