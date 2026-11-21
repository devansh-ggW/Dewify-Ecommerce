(() => {
  "use strict";

  const emptyTemplate = '<div class="nt-empty nt-empty-large"><strong>No Notion templates are published yet.</strong><p>Listings will appear here only when the workspace, contents, duplication link and delivery process are ready.</p></div>';
  const emptyBundle = '<div class="nt-empty nt-empty-large"><strong>No bundles are published yet.</strong><p>Unreleased collections are not shown in the store.</p></div>';

  const templateGrid = document.getElementById("ntTemplateGrid");
  if (templateGrid) templateGrid.innerHTML = emptyTemplate;

  const templateCount = document.getElementById("ntTemplateCount");
  if (templateCount) templateCount.textContent = "No released templates";

  const bundleGrid = document.getElementById("ntBundleGrid");
  if (bundleGrid) bundleGrid.innerHTML = emptyBundle;

  const templateDetail = document.getElementById("ntProductDetail");
  if (templateDetail) {
    templateDetail.innerHTML = '<div class="nt-empty nt-empty-large"><strong>This template is not published.</strong><p>It is not available to purchase or duplicate from this page.</p><a class="nt-button nt-button-dark" href="notion-templates.html">Return to templates</a></div>';
  }

  const bundleDetail = document.getElementById("ntBundleDetail");
  if (bundleDetail) {
    bundleDetail.innerHTML = '<div class="nt-empty nt-empty-large"><strong>This bundle is not published.</strong><p>Unreleased collections are not available to purchase or duplicate.</p><a class="nt-button nt-button-dark" href="notion-templates.html#catalog">Return to templates</a></div>';
  }

  const toggle = document.getElementById("ntMenuToggle");
  const mobileNav = document.getElementById("ntMobileNav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      mobileNav.hidden = open;
    });
    mobileNav.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      mobileNav.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    });
  }
})();
