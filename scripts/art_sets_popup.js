/* ============================================================
   art_sets_popup.js — singleton hover/focus popup for Art Sets.
   Renders a list of items (image / images + [mod] title) and
   positions itself relative to the hovered cell.
   Registers on window.PortfolioArtSetsPopup.
   ============================================================ */
(function () {
  'use strict';

  const { escapeHtml, basenameNoExt } = window.AppUtils;

  /* ---------- Popup (singleton) ---------- */
  let popupEl = null;
  let popupAnchor = null;

  function ensurePopup() {
    if (popupEl && document.body.contains(popupEl)) return popupEl;
    popupEl = document.createElement('div');
    popupEl.className = 'art-popup';
    popupEl.setAttribute('role', 'tooltip');
    document.body.appendChild(popupEl);
    return popupEl;
  }

  /* Total images across the popup:
     item.image = 1 image, item.images = images.length images. */
  function countPopupImages(items) {
    let n = 0;
    for (const it of items) {
      if (Array.isArray(it.images)) n += it.images.filter(Boolean).length;
      else if (it.image) n += 1;
    }
    return n;
  }

  function buildPopupContent(items) {
    const listClass = countPopupImages(items) === 4
      ? 'art-popup-list art-popup-list--2x2'
      : 'art-popup-list';

    const headerHtml = '<div class="art-popup-header">Production</div>';

    const listHtml =
      `<div class="${listClass}">` +
        items.map((it) => {
          const mod  = it.mod || '';
          const name = it.title || basenameNoExt(it.image);

          const images = Array.isArray(it.images)
            ? it.images.filter(Boolean)
            : (it.image ? [it.image] : []);

          const imagesHtml = images.length
            ? '<div class="art-popup-image' +
                (images.length > 1 ? ' art-popup-image--multi' : '') +
                '" data-count="' + images.length + '">' +
                images.map((src) =>
                  `<img src="${escapeHtml(src)}" ` +
                       `alt="${escapeHtml(name)}" loading="lazy">`
                ).join('') +
              '</div>'
            : '';

          return (
            '<div class="art-popup-item">' +
              imagesHtml +
              '<div class="art-popup-name">' +
                (mod ? `<span class="art-popup-mod">[${escapeHtml(mod)}]</span> ` : '') +
                escapeHtml(name) +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>';

    return headerHtml + listHtml;
  }

  function positionPopup(rect) {
    const el = popupEl;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* Breakpoint: below — above/below the cell,
       above — to the left of the cell. */
    const WIDE = 900;

    el.style.visibility = 'hidden';
    el.style.top  = '0px';
    el.style.left = '0px';
    const pw = el.offsetWidth;
    const ph = el.offsetHeight;

    let top, left;

    if (vw >= WIDE) {
      /* Wide screen: to the left of the cell, vertically centred. */
      left = rect.left - pw - margin;
      if (left < 8) left = 8;

      top = rect.top + rect.height / 2 - ph / 2;
      top = Math.max(8, Math.min(top, vh - ph - 8));
    } else {
      /* Narrow screen: above the cell, below if not enough room. */
      top = rect.top - ph - margin;
      if (top < 8) {
        top = rect.bottom + margin;
        if (top + ph > vh - 8) top = Math.max(8, vh - ph - 8);
      }

      left = rect.left + rect.width / 2 - pw / 2;
      left = Math.max(8, Math.min(left, vw - pw - 8));
    }

    el.style.top  = Math.round(top)  + 'px';
    el.style.left = Math.round(left) + 'px';
    el.style.visibility = '';
  }

  function showPopup(anchor) {
    const raw = anchor.getAttribute('data-popup');
    if (!raw) return;

    let items;
    try { items = JSON.parse(raw); } catch (err) { return; }
    if (!Array.isArray(items) || items.length === 0) return;

    const el = ensurePopup();
    el.innerHTML = buildPopupContent(items);
    positionPopup(anchor.getBoundingClientRect());
    el.classList.add('visible');
    popupAnchor = anchor;
  }

  function hidePopup() {
    if (!popupEl) return;
    popupEl.classList.remove('visible');
    popupAnchor = null;
  }

  function attachPopupBehavior(root) {
    root.addEventListener('mouseover', (e) => {
      const cell = e.target.closest && e.target.closest('.art-cell--popup');
      if (!cell || !root.contains(cell)) return;
      if (popupAnchor === cell) return;
      showPopup(cell);
    });

    root.addEventListener('mouseout', (e) => {
      const cell = e.target.closest && e.target.closest('.art-cell--popup');
      if (!cell) return;
      if (e.relatedTarget && cell.contains(e.relatedTarget)) return;
      hidePopup();
    });

    root.addEventListener('focusin', (e) => {
      const cell = e.target.closest && e.target.closest('.art-cell--popup');
      if (!cell) return;
      if (popupAnchor === cell) return;
      showPopup(cell);
    });

    root.addEventListener('focusout', () => hidePopup());

    window.addEventListener('scroll', hidePopup, { passive: true });
    window.addEventListener('resize', hidePopup);
  }

  window.PortfolioArtSetsPopup = { attachPopupBehavior };
})();