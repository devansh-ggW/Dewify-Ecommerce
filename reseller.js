/* DEWIFY — reseller catalog interactions */
(() => {
  "use strict";

  const tabs = [...document.querySelectorAll("[data-dw-filter]")];
  const cards = [...document.querySelectorAll("[data-dw-category]")];
  const search = document.querySelector("#dw-search");
  const count = document.querySelector("#dw-count");
  let filter = "all";

  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const category = card.dataset.dwCategory || "";
      const haystack = (card.dataset.dwSearch || card.textContent || "").toLowerCase();
      const show = (filter === "all" || category === filter) && (!q || haystack.includes(q));
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    if (count) count.textContent = String(visible) + " product" + (visible === 1 ? "" : "s");
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filter = tab.dataset.dwFilter || "all";
      tabs.forEach(item => item.classList.toggle("active", item === tab));
      render();
    });
  });
  search?.addEventListener("input", render);
  render();

  const price = document.querySelector("#resale-price");
  const cost = document.querySelector("#acquisition-cost");
  const margin = document.querySelector("#gross-margin");
  const percent = document.querySelector("#gross-margin-percent");

  function money(value) {
    const n = Number(value || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function updateMath() {
    if (!price || !cost) return;
    const sale = Math.max(0, Number(price.value) || 0);
    const buy = Math.max(0, Number(cost.value) || 0);
    const gross = Math.max(0, sale - buy);
    const pct = sale > 0 ? (gross / sale) * 100 : 0;
    if (margin) margin.textContent = money(gross);
    if (percent) percent.textContent = pct.toFixed(0) + "%";
  }

  price?.addEventListener("input", updateMath);
  cost?.addEventListener("input", updateMath);
  updateMath();
})();
