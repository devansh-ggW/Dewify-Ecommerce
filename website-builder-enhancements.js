(() => {
  "use strict";

  const DB_NAME = "dewify-website-builder";
  const STORE_NAME = "products";
  const SETUP_KEY = "dewify:website-builder:v1";
  let dbPromise;

  const $ = (s, root = document) => root.querySelector(s);

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function getProducts() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      if (!blob) return resolve("");
      if (typeof blob === "string") return resolve(blob);
      if (blob instanceof ArrayBuffer) blob = new Blob([blob]);
      if (!(blob instanceof Blob)) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function getState() {
    try { return JSON.parse(localStorage.getItem(SETUP_KEY) || "{}") || {}; }
    catch { return {}; }
  }

  function cssFor(state) {
    const themes = {
      dark: { bg: "#070707", card: "#101010", text: "#f4f2ec", muted: "#aaa79e", line: "#292929" },
      light: { bg: "#f5f3ee", card: "#ffffff", text: "#171717", muted: "#66645e", line: "#d9d6cf" },
      system: { bg: "#070707", card: "#101010", text: "#f4f2ec", muted: "#aaa79e", line: "#292929" }
    };
    const t = themes[state.theme] || themes.dark;
    const accents = { purple: "#9a7cff", blue: "#6ca7ff", green: "#75d69a", white: "#f4f2ec" };
    const accent = accents[state.accent] || accents.purple;
    const radius = state.radius === "sharp" ? "2px" : state.radius === "round" ? "18px" : "9px";
    const columns = state.layout === "list" ? "1fr" : state.layout === "featured" ? "1fr 1fr" : "repeat(3,1fr)";
    return `:root{--bg:${t.bg};--card:${t.card};--text:${t.text};--muted:${t.muted};--line:${t.line};--accent:${accent};--radius:${radius}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5}a{color:inherit}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.nav{height:72px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.brand{font-weight:900;letter-spacing:-.06em}.nav a{text-decoration:none;font-size:12px;color:var(--muted)}.hero{padding:86px 0 58px;display:grid;grid-template-columns:1.25fr .75fr;gap:50px;align-items:end}.hero h1{font-size:clamp(58px,9vw,118px);line-height:.84;letter-spacing:-.09em;margin:12px 0}.hero p{max-width:580px;color:var(--muted)}.eyebrow{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}.hero-card{border:1px solid var(--line);border-radius:var(--radius);padding:24px;background:var(--card)}.hero-card strong{font-size:22px;letter-spacing:-.04em}.catalog{padding:32px 0 90px}.catalog-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:20px}.catalog-head h2{font-size:42px;line-height:.9;letter-spacing:-.07em;margin:8px 0}.grid{display:grid;grid-template-columns:${columns};gap:14px}.product{border:1px solid var(--line);border-radius:var(--radius);background:var(--card);overflow:hidden}.product img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#151515}.product-body{padding:18px}.product h3{margin:0;font-size:18px;letter-spacing:-.04em}.product p{color:var(--muted);font-size:12px;min-height:48px}.price{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted)}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:var(--radius);border:1px solid var(--line);background:transparent;color:var(--text);text-decoration:none;font-size:11px;font-weight:750;cursor:pointer}.btn.primary{background:var(--text);color:var(--bg);border-color:var(--text)}.actions{display:flex;gap:8px;margin-top:15px;flex-wrap:wrap}.empty{border:1px dashed var(--line);padding:50px;text-align:center;color:var(--muted)}footer{border-top:1px solid var(--line);padding:28px 0 50px;color:var(--muted);font-size:11px}footer .legal{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px}@media(max-width:760px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:1fr!important}.nav{height:62px}}
`;
  }

  async function buildSite() {
    const state = getState();
    const products = await getProducts();
    const assets = [];
    for (const p of products) {
      assets.push({ ...p, imageData: await blobToDataURL(p.imageBlob), zipData: await blobToDataURL(p.zipBlob) });
    }

    const productMarkup = assets.length ? assets.map(p => {
      const image = p.imageData ? `<img src="${p.imageData}" alt="${esc(p.title)}">` : `<div style="aspect-ratio:4/3;background:#151515"></div>`;
      const download = p.zipData ? `<a class="btn primary" download="${esc(p.zipName || `${p.title}.zip`)}" href="${p.zipData}">Download</a>` : "";
      return `<article class="product">${image}<div class="product-body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="price">${esc(p.currency || "INR")} ${esc(p.price || "0")}</div><div class="actions">${download}</div></div></article>`;
    }).join("") : `<div class="empty">No products have been added yet.</div>`;

    const legal = [];
    if (state.privacy) legal.push(["privacy", "Privacy Policy"]);
    if (state.terms) legal.push(["terms", "Terms & Conditions"]);
    if (state.disclaimer) legal.push(["disclaimer", "Disclaimer"]);
    if (state.cookiePolicy) legal.push(["cookies", "Cookie Policy"]);
    const legalLinks = legal.map(([id, title]) => `<a href="#${id}">${title}</a>`).join("");
    const legalSections = legal.map(([id, title]) => `<section id="${id}" style="padding:28px 0;border-top:1px solid var(--line)"><h3>${title}</h3><p style="color:var(--muted);max-width:760px">This page is a starter document generated from your Dewify setup. Review and customize it for your business, products, payment provider and applicable requirements before publishing.</p></section>`).join("");
    const contact = [state.contactEmail, state.contactPhone, state.instagram, state.otherContact].filter(Boolean).map(esc).join(" · ");

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(state.businessName || "My Store")}</title><style>${cssFor(state)}</style></head><body><header class="nav wrap"><a class="brand" href="#">${esc(state.businessName || "MY STORE")}</a><a href="#products">Shop</a></header><main><section class="hero wrap"><div><div class="eyebrow">${esc(state.businessCategory || "DIGITAL PRODUCTS")}</div><h1>${esc(state.businessName || "Your store")}.</h1><p>${esc(state.tagline || "Digital products made ready to use.")}</p><div class="actions"><a class="btn primary" href="#products">Browse products</a></div></div><aside class="hero-card"><div class="eyebrow">Contact</div><strong>${esc(state.ownerName || state.businessName || "Store owner")}</strong><p>${contact || "Contact details coming soon."}</p></aside></section><section class="catalog wrap" id="products"><div class="catalog-head"><div><div class="eyebrow">CATALOG</div><h2>Products.</h2></div><div class="eyebrow">${products.length} item${products.length === 1 ? "" : "s"}</div></div><div class="grid">${productMarkup}</div></section><div class="wrap">${legalSections}</div></main><footer><div class="wrap"><div>${esc(state.businessName || "My Store")} · Digital products</div>${legal.length ? `<div class="legal">${legalLinks}</div>` : ""}</div></footer></body></html>`;
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  async function previewSite() {
    try {
      const html = await buildSite();
      const url = URL.createObjectURL(new Blob([html], {type:"text/html"}));
      const win = window.open(url, "_blank");
      if (!win) showToast("Allow pop-ups to preview your website.");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { console.error(error); showToast("Could not generate the preview yet."); }
  }

  async function downloadSite() {
    try {
      const html = await buildSite();
      const url = URL.createObjectURL(new Blob([html], {type:"text/html;charset=utf-8"}));
      const a = document.createElement("a");
      const slug = (getState().businessName || "dewify-store").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "dewify-store";
      a.href = url; a.download = `${slug}-website.html`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      showToast("Website downloaded as a standalone HTML file.");
    } catch (error) { console.error(error); showToast("Could not download the website yet."); }
  }

  function addCompleteActions() {
    const panel = $("#completePanel");
    if (!panel || panel.querySelector("[data-builder-preview]")) return;
    const actions = $(".complete-actions", panel);
    if (!actions) return;
    const preview = document.createElement("button");
    preview.className = "button button-light"; preview.type = "button"; preview.dataset.builderPreview = "1"; preview.textContent = "Preview website ↗"; preview.onclick = previewSite;
    const download = document.createElement("button");
    download.className = "button button-ghost"; download.type = "button"; download.dataset.builderDownload = "1"; download.textContent = "Download website ↓"; download.onclick = downloadSite;
    actions.insertBefore(download, actions.firstChild);
    actions.insertBefore(preview, actions.firstChild);
  }

  async function repairThumbnails() {
    try {
      const products = await getProducts();
      for (const p of products) {
        const img = document.querySelector(`img[data-image-id="${CSS.escape(p.id)}"]`);
        if (!img || !p.imageBlob) continue;
        if (img.complete && img.naturalWidth) continue;
        const data = await blobToDataURL(p.imageBlob);
        if (data) img.src = data;
      }
    } catch (error) { console.warn("Thumbnail repair skipped", error); }
  }

  const observer = new MutationObserver(() => { addCompleteActions(); repairThumbnails(); });
  observer.observe(document.body, {childList:true, subtree:true});
  addCompleteActions();
  repairThumbnails();
})();
