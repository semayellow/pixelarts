/* ============================================================
   filters.js — фильтрация карточек по типу, моду и размеру.
   Работает после события "gallery:ready".
   ============================================================ */

(function () {
  function init() {
    const filtersEl = document.getElementById('filters');
    const gallery   = document.getElementById('gallery');
    if (!filtersEl || !gallery) return;

    const buttons = filtersEl.querySelectorAll('.filter-btn');
    const cards   = gallery.querySelectorAll('.card');
    if (!buttons.length) return;

    /* ---------- Заглушка для пустого результата ---------- */
    let emptyEl = gallery.querySelector('.empty');
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'empty';
      emptyEl.textContent = 'No artworks match this filter.';
      emptyEl.hidden = true;
      gallery.appendChild(emptyEl);
    }

    /* ---------- Состояние ---------- */
    let activeType = 'all';
    let activeMod  = 'all';
    let activeSize = 'all';

    /* ---------- Дропдауны ---------- */
    function setupDropdown(rootId, onChange) {
      const root  = document.getElementById(rootId);
      if (!root) return;

      const list  = root.querySelector('.mod-select-list');
      const value = root.querySelector('.mod-select-value');

      function close() {
        root.classList.remove('open');
        root.setAttribute('aria-expanded', 'false');
      }

      function set(val, label) {
        value.textContent = label;
        list.querySelectorAll('li').forEach(li => {
          li.setAttribute('aria-selected',
            li.dataset.value === val ? 'true' : 'false');
        });
        onChange(val);
      }

      root.addEventListener('click', (e) => {
        if (e.target.closest('.mod-select-list li')) return;
        root.classList.toggle('open');
        root.setAttribute('aria-expanded', root.classList.contains('open'));
      });

      root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          root.classList.toggle('open');
          root.setAttribute('aria-expanded', root.classList.contains('open'));
        } else if (e.key === 'Escape') {
          close();
        }
      });

      list.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-value]');
        if (!li) return;
        set(li.dataset.value, li.textContent.trim());
        close();
      });

      document.addEventListener('click', (e) => {
        if (!root.contains(e.target)) close();
      });
    }

    setupDropdown('modFilter', (val) => {
      activeMod = val;
      applyFilters();
    });

    setupDropdown('sizeFilter', (val) => {
      activeSize = val;
      applyFilters();
    });

    /* ---------- Фильтрация ---------- */
    function matchesType(cardType, filter) {
      if (filter === 'all') return true;
      return cardType.trim() === filter;
    }

    function applyFilters() {
      let visibleCount = 0;

      cards.forEach(card => {
        const typeOk = matchesType(card.dataset.type || '', activeType);
        const modOk  = activeMod  === 'all' || card.dataset.mod  === activeMod;
        const sizeOk = activeSize === 'all' || card.dataset.size === activeSize;
        const show   = typeOk && modOk && sizeOk;

        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      emptyEl.hidden = visibleCount !== 0;

      buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === activeType);
      });
    }

    /* ---------- Кнопки типов ---------- */
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        activeType = btn.dataset.filter || 'all';
        applyFilters();
      });
    });

    applyFilters();
  }

  document.addEventListener('gallery:ready', init);
})();