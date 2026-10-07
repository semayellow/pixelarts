     /* ============================================================
   artworks_render.js — main gallery renderer:
     • fills #gallery with cards
     • builds filter bar (#filters)
     • populates mod / size dropdowns
     • boots blocks, references, ui toggles
   ============================================================ */
(function () {
  'use strict';

  const ARTWORKS_DATA_URL = 'images/meta/gallery.json';
  const FILTERS_DATA_URL  = 'images/meta/filters.json';

  const { escapeHtml, escapeAttr } = window.AppUtils;

  async function init() {
    const galleryEl = document.getElementById('gallery');
    const filtersEl = document.getElementById('filters');
    if (!galleryEl || !filtersEl) return;

    let artworks = [];
    let types    = [];
    try {
      const [aRes, fRes] = await Promise.all([
        fetch(ARTWORKS_DATA_URL, { cache: 'no-cache' }),
        fetch(FILTERS_DATA_URL,  { cache: 'no-cache' })
      ]);
      const aData = await aRes.json();
      const fData = await fRes.json();
      artworks = aData.artworks || [];
      types    = fData.types    || [];
    } catch (e) {
      console.error('[artworks_render] failed to load:', e);
      return;
    }

    /* 1. Cards */
    galleryEl.innerHTML = artworks.map(cardTemplate).join('');

    /* 2. Filter bar */
    filtersEl.innerHTML = buildFilterBar(types);

    /* 3. Dropdowns */
    initModDropdown(artworks);
    initSizeDropdown(artworks);

    /* 4. Notify other modules */
    document.dispatchEvent(new CustomEvent('gallery:ready'));

    /* 5. Wire up interactive features */
    window.PortfolioBlocks.initBlockRotation();
    window.PortfolioBlocks.initBlockModeToggle();
    window.PortfolioBlocks.initBlockModeGlobal();
    window.PortfolioRefs.initReferenceHovers();
    window.PortfolioUI.initThemeToggle();
    window.PortfolioUI.initGridToggle();
  }

  /* ---------- Filter bar markup ---------- */
  function buildFilterBar(types) {
    const typeButtons = [
      `<button class="filter-btn active" data-filter="all">All</button>`,
      ...types.map(t =>
        `<button class="filter-btn" data-filter="${escapeAttr(t.id)}">${escapeHtml(t.label)}</button>`
      )
    ].join('');

    return typeButtons + `
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
      ${toggleButtonsMarkup()}`;
  }

  /* ---------- Control buttons (theme / grid / block-mode) ---------- */
  function toggleButtonsMarkup() {
    return `
      <button class="theme-toggle" id="themeToggle" type="button"
        aria-label="Theme: dark green" title="Theme: dark green"></button>

      <button class="grid-toggle" id="gridToggle" type="button"
        aria-pressed="false" aria-label="Toggle pixel grid" title="Toggle pixel grid">
        ${gridIconSvg()}
      </button>

      <button class="block-mode-global" id="blockModeGlobal" type="button"
        aria-pressed="false"
        aria-label="Toggle all blocks 3D / 2D"
        title="Toggle all blocks 3D / 2D">
        <svg class="icon-cube" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
          <path d="M8 1 L14 4 L14 12 L8 15 L2 12 L2 4 Z"
                fill="none" stroke="currentColor" stroke-width="1.4"/>
          <path d="M2 4 L8 7 L14 4 M8 7 L8 15"
                fill="none" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        <svg class="icon-flat" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12"
                fill="none" stroke="currentColor" stroke-width="1.4"/>
        </svg>
      </button>`;
  }

  function gridIconSvg() {
    let rects = '';
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        rects += `<rect x="${x}" y="${y}" width="3" height="3" fill="currentColor"/>`;
      }
    }
    return `<svg viewBox="0 0 15 15" width="26" height="26" aria-hidden="true">${rects}</svg>`;
  }

  /* ---------- Dropdown population ---------- */
  function initModDropdown(artworks) {
    const root = document.getElementById('modFilter');
    if (!root) return;
    const list  = root.querySelector('.mod-select-list');
    const mods  = ['all', ...[...new Set(artworks.map(a => a.mod).filter(Boolean))].sort()];

    list.innerHTML = mods.map(mod => `
      <li role="option" data-value="${escapeAttr(mod)}"
          ${mod === 'all' ? 'aria-selected="true"' : ''}>
        ${mod === 'all' ? 'All mods' : escapeHtml(mod)}
      </li>`).join('');
  }

  function initSizeDropdown(artworks) {
    const root = document.getElementById('sizeFilter');
    if (!root) return;
    const list  = root.querySelector('.mod-select-list');
    const sizes = ['all', ...[...new Set(artworks.map(a => a.size).filter(Boolean))]
      .sort((a, b) => parseInt(a) - parseInt(b))];

    list.innerHTML = sizes.map(size => `
      <li role="option" data-value="${escapeAttr(size)}"
          ${size === 'all' ? 'aria-selected="true"' : ''}>
        ${size === 'all' ? 'All sizes' : escapeHtml(size)}
      </li>`).join('');
  }

  /* ---------- Card template ---------- */
  function cardTemplate(a) {
    const isBlock = (a.type || '').trim() === 'block';
    const isEnchanted =
      a.enchanted === true || a.enchanted === 1 || a.enchanted === 'true';

    const artClass =
      'art' +
      (isBlock ? ' art--block' : '') +
      (isEnchanted ? ' enchanted' : '');

    const glint = (isEnchanted && !isBlock) ? glintTemplate(a.image) : '';
    const gridCount = parseInt(a.size, 10) || 16;

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
            ${a.references ? window.PortfolioRefs.referenceTemplate(a.references) : ''}
          </div>
        </div>
      </article>`;
  }

  function imageTemplate(a) {
    return `<img class="pixel-art"
                 src="${escapeAttr(a.image)}"
                 alt="${escapeAttr(a.alt || a.title || '')}"
                 loading="lazy">`;
  }

  function blockTemplate(a, enchanted) {
    const url  = escapeAttr(a.image);
    const alt  = escapeAttr(a.alt || a.title || 'Block preview');
    const face = cls =>
      `<div class="face ${cls}" style="background-image:url('${url}')"></div>`;

    return `
      <img class="pixel-art block-image"
           src="${url}" alt="${alt}" loading="lazy">

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

  function typeLabel(id) {
    return id.replace(/\b\w/g, c => c.toUpperCase());
  }

  /* Enchanted glint overlay — опционально, оставлено заглушкой,
     чтобы не ломать случай enchanted=true у не-блочных айтемов. */
  function glintTemplate(/* image */) {
    return '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();