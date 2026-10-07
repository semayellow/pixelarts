/* ============================================================
   utils.js — shared DOM/string helpers on window.AppUtils
   ============================================================ */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function basenameNoExt(path) {
    return String(path || '').split('/').pop().replace(/\.[^.]+$/, '');
  }

  window.AppUtils = { escapeHtml, escapeAttr, basenameNoExt };
})();