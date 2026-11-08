/* Demo consumes Exp7Views (same module Budget uses). Views host is loaded from src/exp7-views/. */
(function () {
  if (!window.Exp7Views || window.Exp7Views.MODULE_ID !== 'exp7-views@1') {
    throw new Error('Exp7 demo requires Exp7Views module exp7-views@1');
  }
  window.__exp7DemoViewsModule = window.Exp7Views.MODULE_ID;
  // Compatibility aliases into demo IIFE scope are set by demo-app wrapper.
  // renderViews() continues to call setView → JRViews → JRender (accepted path).
  window.exp7 = Object.assign(window.exp7 || {}, {
    viewsModuleId: window.Exp7Views.MODULE_ID,
    viewsPresentation: window.Exp7Views.presentation
  });
})();
