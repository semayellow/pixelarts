/* ============================================================
   guis_render.js — загрузка meta/guis_meta.json и рендер:
   • #guiGallery    — карточки Before / After (+ after_full);
   • #newGuiGallery — карточки NEW GUI (просто две картинки).
   ============================================================ */

(function () {
  const GUIS_DATA_URL = 'meta/guis_meta.json';

  async function init() {
    const galleryEl    = document.getElementById('guiGallery');
    const newGalleryEl = document.getElementById('newGuiGallery');
    if (!galleryEl && !newGalleryEl) return;

    let data;
    try {
      const res = await fetch(GUIS_DATA_URL, { cache: 'no-cache' });
      data = await res.json();
    } catch (e) {
      console.error('[guis_render] failed to load data:', e);
      return;
    }

    const guis    = data.guis     || [];
    const newGuis = data.new_guis || [];

    if (galleryEl && guis.length) {
      galleryEl.innerHTML = guis.map(guiTemplate).join('');
      bindImageToggle(galleryEl);
    }

    if (newGalleryEl && newGuis.length) {
      newGalleryEl.innerHTML = newGuis.map(newGuiTemplate).join('');
      bindImageToggle(newGalleryEl);
    }

    document.dispatchEvent(new CustomEvent('guis:ready'));
  }

  /* ---------- Делегированный обработчик переключения after ↔ after_full ---------- */
  function bindImageToggle(root) {
    root.addEventListener('click', function (e) {
      const btn = e.target.closest('.gui-image-toggle');
      if (!btn) return;

      const wrap = btn.closest('.gui-image');
      if (!wrap) return;

      const img = wrap.querySelector('.gui-image-img');
      if (!img) return;

      const srcMain = btn.dataset.srcMain;
      const srcFull = btn.dataset.srcFull;
      if (!srcMain || !srcFull) return;

      const showingFull = btn.getAttribute('aria-pressed') === 'true';
      const nextSrc     = showingFull ? srcMain : srcFull;

      const pre = new Image();
      pre.onload = function () {
        img.src = nextSrc;
        btn.setAttribute('aria-pressed', String(!showingFull));
        btn.classList.toggle('active', !showingFull);
      };
      pre.src = nextSrc;
    });
  }

  /* ---------- Классическая карточка (Before / After) ---------- */
  function guiTemplate(g) {
    const before = g.before || {};
    const after  = g.after  || {};
    const full   = g.after_full || null;
    const items  = Array.isArray(g.items) ? g.items : [];

    return `
      <article class="gui-card">
        <header class="gui-card-head">
          <h3 class="gui-card-title">${escapeHtml(g.title || '')}</h3>
          ${g.mod ? `<span class="badge">${escapeHtml(g.mod)}</span>` : ''}
        </header>

        <div class="gui-compare">
          ${guiSideTemplate('Before', before)}
          ${guiSideTemplate('After', after, full)}
        </div>

        ${items.length ? guiItemsTemplate(items) : ''}
      </article>`;
  }

  /* ---------- Карточка NEW GUI (две картинки без подписей и стрелки) ---------- */
  function newGuiTemplate(g) {
    const images = Array.isArray(g.images) ? g.images : [];
    const items  = Array.isArray(g.items)  ? g.items  : [];

    return `
      <article class="gui-card">
        <header class="gui-card-head">
          <h3 class="gui-card-title">${escapeHtml(g.title || '')}</h3>
          ${g.mod ? `<span class="badge">${escapeHtml(g.mod)}</span>` : ''}
        </header>

        <div class="gui-compare gui-compare--pair">
          ${images.map(img => guiSideTemplate('', img)).join('')}
        </div>

        ${items.length ? guiItemsTemplate(items) : ''}
      </article>`;
  }

  /* ---------- Одна сторона (Before / After / просто картинка) ----------
     label === '' → подпись не рендерится. */
  function guiSideTemplate(label, side, full) {
    if (!side || !side.image) return '<div class="gui-side gui-side--empty"></div>';

    const size = (side.width && side.height)
      ? `${side.width} × ${side.height}`
      : '';

    const hasFull = !!(full && full.image);

    const toggleBtn = hasFull ? `
      <button class="gui-image-toggle" type="button"
              aria-pressed="false"
              aria-label="Toggle full image"
              title="Toggle full image"
              data-src-main="${escapeAttr(side.image)}"
              data-src-full="${escapeAttr(full.image)}">
        <svg class="icon-expand" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M1 8 C3.5 4 6 2.8 8 2.8 C10 2.8 12.5 4 15 8 C12.5 12 10 13.2 8 13.2 C6 13.2 3.5 12 1 8 Z"
                fill="none" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2"
                  fill="none" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        <svg class="icon-collapse" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M1 8 C3.5 4 6 2.8 8 2.8 C10 2.8 12.5 4 15 8 C12.5 12 10 13.2 8 13.2 C6 13.2 3.5 12 1 8 Z"
                fill="none" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2"
                  fill="none" stroke="currentColor" stroke-width="1.4"/>
          <path d="M3 13 L13 3"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/>
        </svg>
      </button>` : '';

    const altLabel = label
      ? (label + ' — ' + (side.title || ''))
      : (side.title || '');

    return `
      <div class="gui-side">
        ${label ? `<div class="gui-label">${escapeHtml(label)}</div>` : ''}
        <div class="gui-image">
          <img class="gui-image-img"
               src="${escapeAttr(side.image)}"
               alt="${escapeAttr(altLabel)}"
               loading="lazy" draggable="false">
          ${toggleBtn}
        </div>
        ${size ? `<div class="gui-size">${escapeHtml(size)} px</div>` : ''}
      </div>`;
  }

  /* ---------- Блок «New items» ---------- */
  function guiItemsTemplate(items) {
    return `
      <div class="gui-items">
        <div class="gui-items-label">New items</div>
        <div class="gui-items-grid">
          ${items.map(guiItemTemplate).join('')}
        </div>
      </div>`;
  }

  function guiItemTemplate(it) {
    return `
      <div class="gui-item">
        <div class="gui-item-image">
          <img src="${escapeAttr(it.image || '')}"
               alt="${escapeAttr(it.title || '')}"
               loading="lazy"
               draggable="false">
        </div>
        <div class="gui-item-body">
          ${it.title ? `<div class="gui-item-title">${escapeHtml(it.title)}</div>` : ''}
          ${it.size  ? `<div class="gui-item-size">${escapeHtml(it.size)}</div>`   : ''}
        </div>
      </div>`;
  }

  /* ---------- Утилиты ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();