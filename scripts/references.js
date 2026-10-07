/* ============================================================
   references.js — REF badge template + hover/focus popups.
   Registers on window.PortfolioRefs.
   ============================================================ */
(function () {
  'use strict';

  const { escapeHtml, escapeAttr } = window.AppUtils;

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

  function initReferenceHovers() {
    document.querySelectorAll('.reference').forEach(ref => {
      let refs;
      try { refs = JSON.parse(ref.dataset.refJson || '[]'); }
      catch (_) { return; }
      if (!Array.isArray(refs) || !refs.length) return;

      let popup = null;

      function build() {
        const card  = ref.closest('.card');
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
        el.style.setProperty('--grid-count', gridCount);
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

  window.PortfolioRefs = { referenceTemplate, initReferenceHovers };
})();