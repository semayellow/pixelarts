/* ============================================================
   Art Sets renderer
   Loads meta/art_sets.json and renders each set as a grid:
     rows    -> families (Potter, Witch, Arcana, …)
     columns -> stages   (Drone, Princess, Queen, …)
   Cells show only the artwork image, except items that carry
   a `popup` array — those cells get the REF-badge treatment
   and show a tooltip-like popup on hover / focus.
   A cell with a `popup` is interactive even without an image.
   ============================================================ */
(function () {
  'use strict';

  const DATA_URL = 'meta/art_sets.json';

  /* ---------- Helpers ---------- */

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* "a/b/PotterDrone.png" -> "PotterDrone" */
  function basenameNoExt(path) {
    return String(path || '').split('/').pop().replace(/\.[^.]+$/, '');
  }

  /* Family names derived from image basenames of the widest
     visible row: strip the row-label suffix (no spaces) and
     the extension. */
  function deriveFamilies(rows) {
    let ref = null;
    for (const row of rows) {
      const n = (row.items || []).length;
      if (!ref || n > (ref.items || []).length) ref = row;
    }
    if (!ref || !ref.items || ref.items.length === 0) return [];

    const labelCompact = String(ref.label || '')
      .replace(/\s+/g, '')
      .toLowerCase();

    return ref.items.map((item) => {
      const base = basenameNoExt(item && item.image);
      if (labelCompact && base.toLowerCase().endsWith(labelCompact)) {
        return base.slice(0, base.length - labelCompact.length).trim();
      }
      return base;
    });
  }

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

/* Сколько всего картинок в попапе:
   item.image = 1 картинка, item.images = images.length картинок. */
function countPopupImages(items) {
  let n = 0;
  for (const it of items) {
    if (Array.isArray(it.images)) n += it.images.filter(Boolean).length;
    else if (it.image) n += 1;
  }
  return n;
}

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

      const headerHtml =
        '<div class="art-popup-header">Production</div>';

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

    /* Breakpoint: ниже — попап ставим сверху/снизу,
       выше — слева от ячейки. */
    const WIDE = 900;

    el.style.visibility = 'hidden';
    el.style.top = '0px';
    el.style.left = '0px';
    const pw = el.offsetWidth;
    const ph = el.offsetHeight;

    let top, left;

    if (vw >= WIDE) {
      /* Широкий экран: слева от ячейки, по вертикали — центр. */
      left = rect.left - pw - margin;
      if (left < 8) left = 8;

      top = rect.top + rect.height / 2 - ph / 2;
      top = Math.max(8, Math.min(top, vh - ph - 8));
    } else {
      /* Узкий экран: над ячейкой, при нехватке места — под ней. */
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

  /* ---------- Rendering ---------- */

function renderArtSet(set) {
  const rows      = set.rows || [];
  const stages    = rows.map((r) => r.label || '');
  const families  = deriveFamilies(rows);
  const transpose = !!set.transpose;

  const widest = rows.reduce(
    (m, r) => Math.max(m, (r.items || []).length), 0
  );
  const familyCount = Math.max(families.length, widest, 1);

  /* Ориентация по умолчанию:
       rows (строки)    = семьи (Potter, Witch, …)
       columns (столбцы) = стадии (Drone, Princess, …)
     При transpose: true — наоборот. */
  const colLabels = transpose ? families : stages;
  const rowLabels = transpose ? stages   : families;

  const colCount = Math.max(colLabels.length, 1);
  const rowCount = Math.max(rowLabels.length, 1);

  /* Достаём item по координатам (rowIdx, colIdx) с учётом
     ориентации. В массиве `rows[s].items[f]` первым индексом
     всегда идёт стадия, вторым — семья. */
  function getItem(rowIdx, colIdx) {
    const stageIdx  = transpose ? rowIdx : colIdx;
    const familyIdx = transpose ? colIdx : rowIdx;
    const row = rows[stageIdx];
    return row && (row.items || [])[familyIdx];
  }

  /* Header: пустой угол + подписи столбцов */
  const headerCells = [
    '<div class="art-corner" aria-hidden="true"></div>',
    ...colLabels.map(
      (s) => `<div class="art-col-label">${escapeHtml(s)}</div>`
    )
  ].join('');

  /* Body: одна строка на каждую метку rowLabels */
  const bodyCells = [];
  for (let r = 0; r < rowCount; r++) {
    bodyCells.push(
      `<div class="art-row-label">${escapeHtml(rowLabels[r] || ('#' + (r + 1)))}</div>`
    );

    for (let c = 0; c < colCount; c++) {
      const item = getItem(r, c);

      const hasImage = !!(item && item.image);
      const hasPop   = !!(item &&
                          Array.isArray(item.popup) &&
                          item.popup.length > 0);

      if (!hasImage && !hasPop) {
        bodyCells.push(
          '<div class="art-cell art-cell--empty" aria-hidden="true"></div>'
        );
        continue;
      }

      const alt = (item && item.title) ||
                  (hasImage ? basenameNoExt(item.image) : 'reference');

      if (hasPop) {
        const dataAttr = escapeHtml(JSON.stringify(item.popup));
        bodyCells.push(
          '<div class="art-cell art-cell--popup" ' +
               `data-popup="${dataAttr}" ` +
               `tabindex="0" aria-label="${escapeHtml(alt)}">` +
            (hasImage
              ? `<img src="${escapeHtml(item.image)}" ` +
                     `alt="${escapeHtml(alt)}" loading="lazy">`
              : '') +
          '</div>'
        );
      } else {
        bodyCells.push(
          '<div class="art-cell">' +
            `<img src="${escapeHtml(item.image)}" ` +
                 `alt="${escapeHtml(alt)}" loading="lazy">` +
          '</div>'
        );
      }
    }
  }

  return `
    <article class="art-set" data-set-id="${escapeHtml(set.id || '')}">
      <div class="art-set-head">
        <h3 class="art-set-title">${escapeHtml(set.title || '')}</h3>
        ${set.mod ? `<div class="badge">${escapeHtml(set.mod)}</div>` : ''}
      </div>
      <div class="art-set-grid" style="--cols:${colCount}">
        ${headerCells}
        ${bodyCells.join('')}
      </div>
    </article>
  `;
}
  function renderArtSets(sets) {
    const container = document.getElementById('artSets');
    if (!container) return;

    if (!Array.isArray(sets) || sets.length === 0) {
      container.innerHTML = '<div class="empty">No art sets available.</div>';
      return;
    }

    container.innerHTML = sets.map(renderArtSet).join('');
    attachPopupBehavior(container);
  }

  async function init() {
    const container = document.getElementById('artSets');
    if (!container) return;

    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      renderArtSets(data.sets || []);
    } catch (err) {
      console.error('[art_sets] failed to load:', err);
      container.innerHTML = '<div class="empty">Failed to load art sets.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();