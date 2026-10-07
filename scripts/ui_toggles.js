/* ============================================================
   ui_toggles.js — theme cycle + pixel-grid overlay toggles.
   Registers on window.PortfolioUI.
   ============================================================ */
(function () {
  'use strict';

  function initThemeToggle() {
    const btn  = document.getElementById('themeToggle');
    const root = document.documentElement;
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

  function initGridToggle() {
    const btn  = document.getElementById('gridToggle');
    const root = document.documentElement;
    if (!btn || !root) return;

    btn.addEventListener('click', () => {
      const on = root.dataset.grid === 'on';
      root.dataset.grid = on ? 'off' : 'on';
      btn.classList.toggle('active', !on);
      btn.setAttribute('aria-pressed', String(!on));
    });
  }

  window.PortfolioUI = {
    initThemeToggle,
    initGridToggle
  };
})();