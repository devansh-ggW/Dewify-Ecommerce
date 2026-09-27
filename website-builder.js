(() => {
  "use strict";

  const SETUP_KEY = "dewify:website-builder:v1";
  const DB_NAME = "dewify-website-builder";
  const STORE_NAME = "products";
  const steps = ["Business info", "Contact info", "Theme & design", "Legal documents", "Catalog"];
  let currentStep = 1;
  let editingId = null;
  let dbPromise;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const form = $("#builderForm");
  const toast = $("#toast");

  const stateDefaults = {
    businessName: "", ownerName: "", brandHandle: "", businessCategory: "digital-products", tagline: "",
    contactEmail: "", contactPhone: "", instagram: "", otherContact: "", supportNote: "",
    theme: "dark", accent: "purple", radius: "medium", layout: "grid",
    privacy: true, terms: true, disclaimer: false, cookiePolicy: false
  };

  function loadState() {
    try { return { ...stateDefaults, ...(JSON.parse(localStorage.getItem(SETUP_KEY) || "{}") || {}) }; }
    catch { return { ...stateDefaults }; }
  }

  let state = loadState();

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function saveState() {
    const data = {};
    $$('[name]', form).forEach(el => {
      if (el.type === "checkbox") data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    data.theme = state.theme; data.accent = state.accent; data.radius = state.radius; data.layout = state.layout;
    state = { ...state, ...data };
    localStorage.setItem(SETUP_KEY, JSON.stringify(state));
    $("#saveStatus").textContent = "Saved locally just now";
    updatePreview();
  }

  function fillForm() {
    $$('[name]', form).forEach(el => {
      if (!(el.name in state)) return;
      if (el.type === "checkbox") el.checked = !!state[el.name];
      else el.value = state[el.name];
    });
    $$("[data-choice]").forEach(group => {
      const value = state[group.dataset.choice];
      $$(".choice", group).forEach(btn => btn.classList.toggle("is-selected", btn.dataset.value === value));
    });
    updatePreview();
  }

  function updatePreview() {
    const brand = state.businessName || "YOUR STORE";
    $("#previewBrand").textContent = brand.toUpperCase().slice(0, 28);
    const titles = { dark: "Clean dark storefront", light: "Bright clean storefront", system: "Adaptive storefront" };
    $("#previewTitle").textContent = titles[state.theme] || titles.dark;
    $("#previewCopy").textContent = `${state.layout[0].toUpperCase() + state.layout.slice(1)} layout with ${state.accent} accents and ${state.radius} corners.`;
    const preview = $(".preview-browser");
    preview.dataset.accent = state.accent;
    preview.dataset.theme = state.theme;
    preview.dataset.radius = state.radius;
  }

  function setStep(step) {
    currentStep = Math.max(1, Math.min(5, step));
    $$(".builder-step").forEach(el => el.classList.toggle("is-active", Number(el.dataset.step) === currentStep));
    $$(".step-tab").forEach(el => {
      const n = Number(el.dataset.step);
      el.classList.toggle("is-active", n === currentStep);
      el.classList.toggle("is-complete", n < currentStep);
    });
    $("#stepLabel").textContent = `0${currentStep} / 05`;
    $("#stepTitle").textContent = steps[currentStep - 1];
    $("#progressPercent").textContent = `${currentStep * 20}%`;
    $("#progressBar").style.width = `${currentStep * 20}%`;
    $("#backBtn").disabled = currentStep === 1;
    $("#backBtn").style.opacity = currentStep === 1 ? ".35" : "1";
    $("#nextBtn").textContent = currentStep === 5 ? "Finish setup ✓" : "Continue →";
    window.scrollTo({ top: document.querySelector(".builder-card").offsetTop - 18, behavior: "smooth" });
  }

  function validateStep(step) {
    if (step === 1) {
      const input = $('[name="businessName"]');
      if (!input.value.trim()) { input.focus(); showToast("Add your business or store name first."); return false; }
    }
    if (step === 2) {
      const email = $('[name="contactEmail"]');
      if (email.value && !email.checkValidity()) { email.focus(); showToast("That email address needs a quick check."); return false; }
    }
    return true;
  }

  function openModal(product = null) {
    editingId = product?.id || null;
    $("#productModalTitle").textContent = product ? "Edit product" : "Add product";
    $("#productTitle").value = product?.title || "";
    $("#productPrice").value = product?.price || "";
    $("#productCurrency").value = product?.currency || "INR";
    $("#productDescription").value = product?.description || "";
    $("#imageFileName").textContent = product?.imageName || "PNG, JPG or WebP";
    $("#zipFileName").textContent = product?.zipName || "ZIP only";
    $("#imagePreview").hidden = !product?.imageBlob;
    if (product?.imageBlob) $("#imagePreview").src = URL.createObjectURL(product.imageBlob);
    else $("#imagePreview").removeAttribute("src");
    $("#productImage").value = "";
    $("#productZip").value = "";
    $("#productModal").classList.add("is-open");
    $("#productModal").setAttribute("aria-hidden", "false");
    setTimeout(() => $("#productTitle").focus(), 30);
  }

  function closeModal() {
    $("#productModal").classList.remove("is-open");
    $("#productModal").setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function dbPut(product) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(product);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDelete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
  }

  async function renderProducts() {
    const list = $("#productList");
    const products = await dbGetAll();
    $("#productCount").textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
    if (!products.length) {
      list.innerHTML = '<div class="catalog-empty"><strong>Your catalog is empty.</strong><span>Add your first digital product to start building the store.</span><button class="text-link" type="button" id="emptyAddBtn">Add first product ↗</button></div>';
      $("#emptyAddBtn").onclick = () => openModal();
      return;
    }
    list.innerHTML = products.map(p => `<article class="catalog-card" data-id="${escapeHTML(p.id)}"><div>${p.imageBlob ? `<img class="catalog-art" alt="" data-image-id="${escapeHTML(p.id)}">` : '<div class="catalog-art"></div>'}</div><div class="catalog-info"><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p><div class="catalog-meta"><span>${escapeHTML(p.price ? `${p.currency} ${p.price}` : "Price not set")}</span><span>${p.zipBlob ? "ZIP ready" : "ZIP missing"}</span></div><div class="catalog-actions"><button class="mini-button" data-edit="${escapeHTML(p.id)}" type="button">Edit</button><button class="mini-button" data-delete="${escapeHTML(p.id)}" type="button">Delete</button></div></div></article>`).join("");
    for (const p of products) {
      const img = $(`img[data-image-id="${CSS.escape(p.id)}"]`);
      if (img && p.imageBlob) img.src = URL.createObjectURL(p.imageBlob);
    }
    $$('[data-edit]').forEach(btn => btn.onclick = async () => openModal((await dbGetAll()).find(p => p.id === btn.dataset.edit)));
    $$('[data-delete]').forEach(btn => btn.onclick = async () => {
      if (!confirm("Delete this product from this browser?")) return;
      await dbDelete(btn.dataset.delete); await renderProducts(); showToast("Product removed.");
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    const title = $("#productTitle").value.trim();
    const description = $("#productDescription").value.trim();
    if (!title || !description) { showToast("Add a title and description first."); return; }
    const existing = editingId ? (await dbGetAll()).find(p => p.id === editingId) : null;
    const imageFile = $("#productImage").files[0];
    const zipFile = $("#productZip").files[0];
    if (zipFile && !zipFile.name.toLowerCase().endsWith(".zip")) { showToast("The digital product must be a ZIP file."); return; }
    const product = {
      id: editingId || `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      price: $("#productPrice").value.trim(),
      currency: $("#productCurrency").value,
      imageBlob: imageFile || existing?.imageBlob || null,
      imageName: imageFile?.name || existing?.imageName || "",
      zipBlob: zipFile || existing?.zipBlob || null,
      zipName: zipFile?.name || existing?.zipName || "",
      updatedAt: Date.now()
    };
    await dbPut(product);
    closeModal();
    await renderProducts();
    showToast(editingId ? "Product updated." : "Product saved.");
  }

  $$(".step-tab").forEach(btn => btn.onclick = () => {
    const target = Number(btn.dataset.step);
    if (target > currentStep && !validateStep(currentStep)) return;
    saveState(); setStep(target);
  });

  $$('[data-choice]').forEach(group => group.addEventListener("click", event => {
    const btn = event.target.closest(".choice"); if (!btn) return;
    state[group.dataset.choice] = btn.dataset.value;
    $$(".choice", group).forEach(item => item.classList.toggle("is-selected", item === btn));
    saveState();
  }));

  $$('[name]', form).forEach(el => el.addEventListener("input", saveState));
  $$('[name]', form).forEach(el => el.addEventListener("change", saveState));

  $("#nextBtn").onclick = async () => {
    saveState();
    if (!validateStep(currentStep)) return;
    if (currentStep < 5) { setStep(currentStep + 1); await renderProducts(); return; }
    const products = await dbGetAll();
    $("#completeSummary").textContent = `${state.businessName || "Your store"} is saved with ${products.length} catalog product${products.length === 1 ? "" : "s"}. Everything is currently stored on this browser. Payment setup and publishing will be added later.`;
    $("#builderForm").closest(".builder-card").style.display = "none";
    $("#completePanel").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  $("#backBtn").onclick = () => { if (currentStep > 1) { saveState(); setStep(currentStep - 1); } };
  $("#addProductBtn").onclick = () => openModal();
  $("#productForm").addEventListener("submit", saveProduct);
  $$('[data-close-product]').forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  $("#editSetupBtn").onclick = () => { $("#completePanel").hidden = true; $("#builderForm").closest(".builder-card").style.display = "block"; setStep(5); };

  $("#productImage").addEventListener("change", () => {
    const file = $("#productImage").files[0];
    $("#imageFileName").textContent = file?.name || "PNG, JPG or WebP";
    if (file) { const img = $("#imagePreview"); img.src = URL.createObjectURL(file); img.hidden = false; }
  });
  $("#productZip").addEventListener("change", () => { $("#zipFileName").textContent = $("#productZip").files[0]?.name || "ZIP only"; });

  fillForm();
  renderProducts().catch(() => showToast("Could not open the local product library."));
  setStep(1);
})();
