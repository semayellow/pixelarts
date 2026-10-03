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

    filtersEl.innerHTML =
      typeButtons +
      (existingSelect
        ? existingSelect.outerHTML
        : `<div class="mod-filter">
             <div class="mod-select" id="modFilter" tabindex="0" role="combobox"
                  aria-haspopup="listbox" aria-expanded="false" aria-label="Filter by mod">
               <span class="mod-select-value">All mods</span>
               <ul class="mod-select-list" role="listbox"></ul>
             </div>
           </div>`);
    /* ---------- 3. Дропдаун модов ---------- */
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

    /* ---------- 4. Сообщаем всем, что галерея готова ---------- */
    document.dispatchEvent(new CustomEvent('gallery:ready'));
  }

  /* ---------- Шаблон карточки ---------- */
  function cardTemplate(a) {
    return `
      <article class="card"
               data-type="${escapeAttr(a.type || '')}"
               data-mod="${escapeAttr(a.mod || '')}"
               data-artwork-id="${escapeAttr(a.id || '')}">
        <div class="art">
          <img class="pixel-art"
               src="${escapeAttr(a.image)}"
               alt="${escapeAttr(a.alt || a.title || '')}"
               loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(a.title || '')}</h3>
          ${a.size ? `<div class="size">${escapeHtml(a.size)}</div>` : ''}
          <div class="badges">
            ${a.mod  ? `<span class="badge">${escapeHtml(a.mod)}</span>` : ''}
            ${a.type ? `<span class="badge type">${escapeHtml(typeLabel(a.type))}</span>` : ''}
          </div>
        </div>
      </article>`;
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