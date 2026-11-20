/* DEWIFY Notion marketplace interactions.
   Search, category filtering, product detail pages and bundle detail pages.
   Demo listings deliberately have no checkout or duplication links.
*/
(() => {
  "use strict";

  const catalog = window.DEWIFY_NOTION_CATALOG || {};
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const bundles = Array.isArray(catalog.bundles) ? catalog.bundles : [];
  const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const state = { category: "", query: "", showAll: false };

  const categoryIcons = {
    business: '<svg viewBox="0 0 48 42" aria-hidden="true"><rect x="5" y="13" width="38" height="24" rx="3"/><path d="M17 13V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M5 22h38M20 22v4h8v-4"/></svg>',
    creators: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="m7 12 31-6 5 24-31 6z"/><path d="m13 11 7 10M24 8l7 10M34 6l6 10M10 27l30-6"/></svg>',
    game: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="M13 13h22c4 0 7 3 8 7l2 11c1 5-5 8-9 5l-8-7h-8l-8 7c-4 3-10 0-9-5l2-11c1-4 4-7 8-7z"/><path d="M15 21v8M11 25h8M33 22h.1M38 28h.1"/></svg>',
    sellers: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="m5 15 19-10 19 10-19 10zM5 15v18l19 7 19-7V15M24 25v15"/><path d="M15 20v8l9 4 9-4v-8"/></svg>',
    productivity: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="M6 37h38M12 34V23h7v11M23 34V13h7v21M34 34V5h7v29"/></svg>',
    student: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="m3 15 21-10 21 10-21 10zM11 20v11c8 7 18 7 26 0V20M44 16v13"/></svg>',
    personal: '<svg viewBox="0 0 48 42" aria-hidden="true"><path d="m4 20 20-16 20 16M10 17v21h28V17M19 38V25h10v13"/></svg>',
    freelance: '<svg viewBox="0 0 48 42" aria-hidden="true"><rect x="4" y="12" width="40" height="25" rx="3"/><path d="M17 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M4 21h40M20 21v4h8v-4"/></svg>'
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function makeWorkspacePreview(product, index) {
    const gallery = Array.isArray(product.previewGallery) && product.previewGallery.length ? product.previewGallery : ["Workspace overview"];
    const title = gallery[((index % gallery.length) + gallery.length) % gallery.length];
    const features = Array.isArray(product.features) ? product.features : [];
    const feature = features[index % Math.max(features.length, 1)] || "A clear place to plan the next step";
    const tasks = features.slice(0, 3);
    while (tasks.length < 3) tasks.push("Add your own notes and priorities");
    return '<div class="nt-workspace-preview" role="img" aria-label="' + esc(product.name + " — illustrative " + title + " workspace preview") + '">' +
      '<div class="nt-workspace-top"><i class="nt-workspace-mark"></i><span>' + esc(product.name) + '</span><span class="nt-workspace-top-trail"><i></i><i></i><i></i></span></div>' +
      '<div class="nt-workspace-layout"><aside class="nt-workspace-sidebar"><b>WORKSPACE</b><span>Overview</span><span>Projects</span><span>Planning</span><span>Resources</span><span>Notes</span></aside>' +
      '<div class="nt-workspace-content"><p class="nt-workspace-kicker">YOUR HOME</p><h4>' + esc(title) + '</h4><p class="nt-workspace-description">' + esc(feature) + '</p>' +
      '<div class="nt-workspace-panels"><div class="nt-workspace-panel"><b>Priorities</b><span></span><span></span><span></span></div><div class="nt-workspace-panel"><b>In progress</b><span></span><span></span><span></span></div></div>' +
      '<div class="nt-workspace-task-list">' + tasks.map(item => '<div class="nt-workspace-task"><i></i><span>' + esc(item) + '</span></div>').join("") + '</div></div></div></div>';
  }

  function templateHref(product) {
    return "notion-template.html?slug=" + encodeURIComponent(product.slug);
  }

  function renderTemplateCard(product) {
    return '<a class="nt-product-card" href="' + templateHref(product) + '">' +
      '<div class="nt-product-cover">' + makeWorkspacePreview(product, 0) + '<span class="nt-cover-tag">DEMO PREVIEW</span></div>' +
      '<div class="nt-card-content"><div class="nt-card-meta"><span>' + esc(product.category) + '</span><span>Preview</span></div>' +
      '<h3>' + esc(product.name) + '</h3><p>' + esc(product.description) + '</p>' +
      '<div class="nt-card-footer"><strong>Preview listing</strong><span>View template →</span></div></div></a>';
  }

  function renderBundleCard(bundle) {
    const items = (bundle.productIds || []).map(id => products.find(item => item.id === id)).filter(Boolean);
    const names = items.slice(0, 3).map(item => item.name);
    while (names.length < 3) names.push("Workspace preview");
    return '<a class="nt-bundle-card" href="notion-bundle.html?slug=' + encodeURIComponent(bundle.slug) + '">' +
      '<div class="nt-bundle-art"><div class="nt-bundle-stack"><span>' + esc(names[0]) + '</span><span>' + esc(names[1]) + '</span><span>' + esc(names[2]) + '</span></div></div>' +
      '<div class="nt-bundle-copy"><small>COLLECTION PREVIEW</small><h3>' + esc(bundle.name) + '</h3><p>' + esc(bundle.description) + '</p><span class="nt-bundle-link">View collection →</span></div></a>';
  }

  function initCategoryIcons() {
    document.querySelectorAll("[data-icon]").forEach(node => {
      node.innerHTML = categoryIcons[node.dataset.icon] || "";
    });
  }

  function syncQueryToUrl() {
    const params = new URLSearchParams(window.location.search);
    if (state.category) params.set("category", state.category);
    else params.delete("category");
    if (state.query) params.set("q", state.query);
    else params.delete("q");
    const query = params.toString();
    const next = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
    window.history.replaceState({}, "", next);
  }

  function applyFilters() {
    const grid = $("#ntTemplateGrid");
    if (!grid) return;
    const q = state.query.trim().toLowerCase();
    const matched = products.filter(product => {
      const categoryMatch = !state.category || product.category === state.category;
      const searchable = [
        product.name, product.category, product.description, product.longDescription,
        ...(product.keywords || []), ...(product.audience || [])
      ].join(" ").toLowerCase();
      return categoryMatch && (!q || searchable.includes(q));
    });
    const showFeaturedOnly = !state.category && !q && !state.showAll;
    const visible = showFeaturedOnly ? matched.filter(item => item.featured) : matched;
    grid.innerHTML = visible.length ? visible.map(renderTemplateCard).join("") :
      '<div class="nt-empty"><strong>No templates found.</strong><br>Try another search or clear the category filter.</div>';

    const count = $("#ntTemplateCount");
    if (count) count.textContent = "Showing " + visible.length + " of " + products.length + " demonstration listings";
    const active = $("#ntActiveFilters");
    if (active) {
      active.hidden = !state.category && !q;
      const label = $("#ntFilterLabel");
      if (label) label.textContent = [state.category, q ? "Search: " + state.query : ""].filter(Boolean).join(" · ");
    }
    document.querySelectorAll("[data-category]").forEach(button => {
      const selected = button.dataset.category === state.category;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const search = $("#ntTemplateSearch");
    const clear = $("#ntClearSearch");
    if (search && search.value !== state.query) search.value = state.query;
    if (clear) clear.hidden = !state.query;
  }

  function renderHome() {
    const grid = $("#ntTemplateGrid");
    if (grid) applyFilters();
    const bundleGrid = $("#ntBundleGrid");
    if (bundleGrid) bundleGrid.innerHTML = bundles.length ? bundles.map(renderBundleCard).join("") :
      '<div class="nt-empty">Bundle previews will appear here when they are added to the catalogue.</div>';
  }

  function listMarkup(items) {
    return '<ul class="nt-detail-list">' + (items || []).map(item => "<li>" + esc(item) + "</li>").join("") + "</ul>";
  }

  function renderTemplateDetail(product) {
    const root = $("#ntProductDetail");
    if (!root) return;
    const gallery = product.previewGallery || ["Workspace overview"];
    const emailSubject = encodeURIComponent("Question about " + product.name);
    root.innerHTML =
      '<div class="nt-detail-layout"><div class="nt-detail-gallery">' +
        '<div class="nt-detail-preview-stage" id="ntPreviewStage">' + makeWorkspacePreview(product, 0) + '</div>' +
        '<div class="nt-detail-gallery-thumbs" id="ntGalleryThumbs">' + gallery.map((label, index) =>
          '<button class="nt-gallery-thumb' + (index === 0 ? " is-active" : "") + '" type="button" data-gallery-index="' + index + '" aria-pressed="' + String(index === 0) + '">' + esc(label) + '</button>'
        ).join("") + '</div><p class="nt-result-count">Illustrative layout preview. This is not a screenshot of a released Notion workspace.</p>' +
      '</div><div class="nt-detail-copy"><div class="nt-detail-meta"><span>' + esc(product.category) + '</span><span>Demo listing</span></div>' +
        '<h1>' + esc(product.name) + '</h1><p class="nt-detail-description">' + esc(product.longDescription || product.description) + '</p>' +
        '<div class="nt-demo-notice"><strong>Preview listing — not yet for sale</strong><p>This is demonstration catalogue content. A real Notion duplicate link, final product details and secure checkout delivery have not been configured yet.</p></div>' +
        '<div class="nt-detail-contact"><a class="nt-button nt-button-dark" href="mailto:dewifystores@gmail.com?subject=' + emailSubject + '">Ask about this template <span aria-hidden="true">→</span></a></div>' +
      '</div></div>' +
      '<div class="nt-detail-sections">' +
        '<section class="nt-detail-section"><h2>Key features</h2>' + listMarkup(product.features) + '</section>' +
        '<section class="nt-detail-section"><h2>What the preview includes</h2>' + listMarkup(product.includedResources) + '</section>' +
        '<section class="nt-detail-section"><h2>Who it is designed for</h2>' + listMarkup(product.audience) + '</section>' +
        '<section class="nt-detail-section"><h2>How it will work</h2>' + listMarkup(["Choose the workspace that fits your use case.", "Complete the product checkout once the listing is released.", "Open the product-specific Notion duplication link and duplicate it into your workspace.", "Customize the pages and databases for your own workflow."]) + '</section>' +
        '<section class="nt-detail-section nt-detail-section-wide"><h2>Setup and compatibility</h2><p class="nt-detail-description">A Notion account will be required for a released template. The final listing will specify any workspace plan requirements, setup notes and delivery instructions. Those details are not being represented as confirmed for this demonstration listing.</p></section>' +
        '<section class="nt-detail-section nt-detail-section-wide"><h2>Frequently asked questions</h2><div class="nt-faq">' +
          '<details><summary>Can I purchase this template now?</summary><p>Not yet. This page is a demonstration listing. Checkout and the Notion duplication link are not configured.</p></details>' +
          '<details><summary>Will I need a Notion account?</summary><p>Yes, a Notion account will be needed to duplicate and use a Notion template. Any plan-specific requirements will be stated on the final listing.</p></details>' +
          '<details><summary>Is this preview the final workspace?</summary><p>No. The workspace image is an original illustrative layout used to preview the catalogue design, not a screenshot of a completed product.</p></details>' +
        '</div></section></div>' +
      '<section class="nt-related"><h2>Explore related templates</h2><div class="nt-product-grid" id="ntRelatedGrid"></div></section>';

    const breadcrumb = $("#ntBreadcrumbCurrent");
    if (breadcrumb) breadcrumb.textContent = product.name;
    document.title = product.name + " — Template preview | DEWIFY";

    const thumbs = $("#ntGalleryThumbs");
    if (thumbs) thumbs.addEventListener("click", event => {
      const button = event.target.closest("[data-gallery-index]");
      if (!button) return;
      const index = Number(button.dataset.galleryIndex);
      const stage = $("#ntPreviewStage");
      if (stage) stage.innerHTML = makeWorkspacePreview(product, index);
      thumbs.querySelectorAll("[data-gallery-index]").forEach(node => {
        const active = node === button;
        node.classList.toggle("is-active", active);
        node.setAttribute("aria-pressed", String(active));
      });
    });

    const related = products.filter(item => item.id !== product.id && item.category === product.category).slice(0, 3);
    const fallback = related.length ? related : products.filter(item => item.id !== product.id).slice(0, 3);
    const relatedGrid = $("#ntRelatedGrid");
    if (relatedGrid) relatedGrid.innerHTML = fallback.map(renderTemplateCard).join("");
  }

  function renderBundleDetail(bundle) {
    const root = $("#ntBundleDetail");
    if (!root) return;
    const items = (bundle.productIds || []).map(id => products.find(item => item.id === id)).filter(Boolean);
    root.innerHTML =
      '<div class="nt-detail-layout"><div class="nt-detail-gallery"><div class="nt-detail-preview-stage"><div class="nt-bundle-stack">' +
        items.slice(0, 3).map(item => '<span>' + esc(item.name) + '</span>').join("") +
      '</div></div><p class="nt-result-count">Illustrative bundle composition. Included workspace previews are demonstration listings.</p></div>' +
      '<div class="nt-detail-copy"><div class="nt-detail-meta"><span>Curated bundle</span><span>Demo listing</span></div><h1>' + esc(bundle.name) + '</h1>' +
        '<p class="nt-detail-description">' + esc(bundle.longDescription || bundle.description) + '</p>' +
        '<div class="nt-demo-notice"><strong>Bundle preview — not yet for sale</strong><p>This is a demonstration collection. Final bundle contents, pricing, Notion duplication links and secure delivery have not been configured.</p></div>' +
        '<div class="nt-detail-contact"><a class="nt-button nt-button-dark" href="mailto:dewifystores@gmail.com?subject=' + encodeURIComponent("Question about " + bundle.name) + '">Ask about this bundle <span aria-hidden="true">→</span></a></div>' +
      '</div></div>' +
      '<div class="nt-detail-sections"><section class="nt-detail-section"><h2>What the bundle preview brings together</h2>' + listMarkup(bundle.features) + '</section>' +
      '<section class="nt-detail-section"><h2>Who it is designed for</h2>' + listMarkup(bundle.audience) + '</section></div>' +
      '<section class="nt-related"><h2>Workspaces in this collection</h2><div class="nt-bundle-detail-list">' +
        items.map(item => '<article class="nt-bundle-item"><small>' + esc(item.category) + '</small><h3>' + esc(item.name) + '</h3><p>' + esc(item.description) + '</p><a href="' + templateHref(item) + '">View template preview →</a></article>').join("") +
      '</div></section>';

    const breadcrumb = $("#ntBreadcrumbCurrent");
    if (breadcrumb) breadcrumb.textContent = bundle.name;
    document.title = bundle.name + " — Bundle preview | DEWIFY";
  }

  function initMobileNavigation() {
    const toggle = $("#ntMenuToggle");
    const panel = $("#ntMobileNav");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      panel.hidden = open;
    });
    panel.addEventListener("click", event => {
      if (event.target.closest("a")) {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }
    });
  }

  function initSearchAndCategories() {
    const search = $("#ntTemplateSearch");
    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value || "";
        state.showAll = true;
        syncQueryToUrl();
        applyFilters();
      });
    }
    const clear = $("#ntClearSearch");
    if (clear) clear.addEventListener("click", () => {
      state.query = "";
      state.showAll = true;
      syncQueryToUrl();
      applyFilters();
      search && search.focus();
    });
    const reset = $("#ntResetFilters");
    if (reset) reset.addEventListener("click", () => {
      state.category = "";
      state.query = "";
      state.showAll = true;
      syncQueryToUrl();
      applyFilters();
    });
    document.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        state.category = state.category === button.dataset.category ? "" : button.dataset.category;
        state.showAll = true;
        syncQueryToUrl();
        applyFilters();
        $("#catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    const focus = $("#ntSearchFocus");
    if (focus && search) focus.addEventListener("click", () => {
      search.focus();
      $("#ntTemplateSearch")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const viewAll = $("#ntViewAll");
    if (viewAll) viewAll.addEventListener("click", event => {
      event.preventDefault();
      state.showAll = true;
      applyFilters();
    });
    const form = $("#ntSearchForm");
    if (form) form.addEventListener("submit", event => {
      event.preventDefault();
      state.query = search ? search.value : "";
      state.showAll = true;
      syncQueryToUrl();
      applyFilters();
      $("#catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initPage() {
    initMobileNavigation();
    initCategoryIcons();
    if ($("#ntTemplateGrid")) {
      const params = new URLSearchParams(window.location.search);
      state.category = params.get("category") || "";
      state.query = params.get("q") || "";
      renderHome();
      initSearchAndCategories();
    }
    const templateRoot = $("#ntProductDetail");
    if (templateRoot) {
      const slug = new URLSearchParams(window.location.search).get("slug") || "";
      const product = products.find(item => item.slug === slug);
      if (product) renderTemplateDetail(product);
      else templateRoot.innerHTML = '<div class="nt-empty"><strong>Template not found.</strong><br><a href="notion-templates.html">Return to all templates →</a></div>';
    }
    const bundleRoot = $("#ntBundleDetail");
    if (bundleRoot) {
      const slug = new URLSearchParams(window.location.search).get("slug") || "";
      const bundle = bundles.find(item => item.slug === slug);
      if (bundle) renderBundleDetail(bundle);
      else bundleRoot.innerHTML = '<div class="nt-empty"><strong>Bundle not found.</strong><br><a href="notion-templates.html#bundles">Return to all bundles →</a></div>';
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage, { once: true });
  else initPage();
})();