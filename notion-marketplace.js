(() => {
  "use strict";

  function initMobileNavigation() {
    const toggle = document.getElementById("ntMenuToggle");
    const panel = document.getElementById("ntMobileNav");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      panel.hidden = open;
    });

    panel.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    });
  }

  function showUnpublishedTemplate() {
    const root = document.getElementById("ntProductDetail");
    if (!root) return;
    root.innerHTML = '<div class="nt-empty nt-empty-large"><strong>This template is not published.</strong><p>It is not available to purchase or duplicate from this page.</p><a class="nt-button nt-button-dark" href="notion-templates.html">Return to templates</a></div>';
  }

  function showUnpublishedBundle() {
    const root = document.getElementById("ntBundleDetail");
    if (!root) return;
    root.innerHTML = '<div class="nt-empty nt-empty-large"><strong>This collection is not published.</strong><p>It is not available to purchase or duplicate from this page.</p><a class="nt-button nt-button-dark" href="notion-templates.html#catalog">Return to templates</a></div>';
  }

  function init() {
    initMobileNavigation();
    showUnpublishedTemplate();
    showUnpublishedBundle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
