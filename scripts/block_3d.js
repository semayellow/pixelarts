/* ============================================================
   block_3d.js — drag-to-rotate blocks and 3D/2D toggles
   (per-card + global). Registers on window.PortfolioBlocks.
   ============================================================ */
(function () {
  'use strict';

  const START_X = -25;
  const START_Y = -35;

  function initBlockRotation() {
    document.querySelectorAll('.block-3d').forEach(function (cube) {
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
        baseX  = rotX;
        baseY  = rotY;
      });

      cube.addEventListener('blockmode:reset', function () {
        rotX = START_X;
        rotY = START_Y;
        cube.style.transition = 'transform .35s ease';
        apply();
        setTimeout(function () { cube.style.transition = ''; }, 400);
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

      const resetBtn = cube.parentElement.querySelector('.block-reset');
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

        if (next === '3d') {
          const cube = art.querySelector('.block-3d');
          if (cube) cube.dispatchEvent(new CustomEvent('blockmode:reset'));
        }
      });
    });
  }

  function initBlockModeGlobal() {
    const btn = document.getElementById('blockModeGlobal');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const arts = document.querySelectorAll('.art--block');
      if (!arts.length) return;

      const firstMode = arts[0].dataset.blockMode || '3d';
      const nextMode  = firstMode === '3d' ? '2d' : '3d';

      arts.forEach(art => {
        art.dataset.blockMode = nextMode;
        const cardBtn = art.querySelector('.block-mode-toggle');
        if (cardBtn) {
          cardBtn.setAttribute('aria-pressed', String(nextMode === '2d'));
        }
        if (nextMode === '3d') {
          const cube = art.querySelector('.block-3d');
          if (cube) cube.dispatchEvent(new CustomEvent('blockmode:reset'));
        }
      });

      btn.setAttribute('aria-pressed', String(nextMode === '2d'));
      btn.classList.toggle('active', nextMode === '2d');
    });
  }

  window.PortfolioBlocks = {
    initBlockRotation,
    initBlockModeToggle,
    initBlockModeGlobal
  };
})();