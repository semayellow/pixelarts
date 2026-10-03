/* ============================================================
   filters.js — фильтрация карточек по типу и моду.
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

    /* ---------- Кастомный дропдаун ---------- */
    const modRoot  = document.getElementById('modFilter');
    const modList  = modRoot?.querySelector('.mod-select-list');
    const modValue = modRoot?.querySelector('.mod-select-value');

    function closeMod() {
      if (!modRoot) return;
      modRoot.classList.remove('open');
      modRoot.setAttribute('aria-expanded', 'false');
    }
    function setMod(mod) {
      activeMod = mod;
      if (modValue) modValue.textContent = mod === 'all' ? 'All mods' : mod;
      modList?.querySelectorAll('li').forEach(li => {
        li.setAttribute('aria-selected', li.dataset.value === mod ? 'true' : 'false');
      });
      applyFilters();
    }

    if (modRoot) {
      modRoot.addEventListener('click', (e) => {
        if (e.target.closest('.mod-select-list li')) return;
        modRoot.classList.toggle('open');
        modRoot.setAttribute('aria-expanded', modRoot.classList.contains('open'));
      });

      modRoot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          modRoot.classList.toggle('open');
          modRoot.setAttribute('aria-expanded', modRoot.classList.contains('open'));
        } else if (e.key === 'Escape') {
          closeMod();
        }
      });

      modList?.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-value]');
        if (!li) return;
        setMod(li.dataset.value);
        closeMod();
      });
    }

    // Клик вне дропдауна закрывает его
    document.addEventListener('click', (e) => {
      if (modRoot && !modRoot.contains(e.target)) closeMod();
    });

    /* ---------- Фильтрация карточек ---------- */
    function matchesType(cardType, filter) {
      if (filter === 'all') return true;
      return cardType.trim() === filter;
    }

    function applyFilters() {
      let visibleCount = 0;

      cards.forEach(card => {
        const typeOk = matchesType(card.dataset.type || '', activeType);
        const modOk  = activeMod === 'all' || card.dataset.mod === activeMod;
        const show   = typeOk && modOk;

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