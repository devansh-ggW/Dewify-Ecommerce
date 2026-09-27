
(() => {
  "use strict";

  const VERSION = 2;
  const STATE_KEY = "dewify:website-builder:v2";
  const LEGACY_STATE_KEY = "dewify:website-builder:v1";
  const DB_NAME = "dewify-website-builder-v2";
  const DB_VERSION = 1;
  const ASSET_STORE = "assets";
  const PRODUCT_STORE = "products";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  let dbPromise = null;
  let currentView = "design";
  let selectedSectionId = "hero";
  let selectedElementId = null;
  let selectedImageElementIds = [];
  let selectedMediaIds = [];
  let editingProductId = null;
  let canvasZoom = 0.9;
  let saveTimer = null;
  let currentThumbBlob = null;
  let currentZipBlob = null;
  let currentImagePreviewUrl = null;

  const palette = {
    colorPalettes: {
      mono: {name:"Monochrome", background:"#f4f2ec", surface:"#ffffff", text:"#171717", muted:"#6b6962", accent:"#171717"},
      violet: {name:"Violet", background:"#0b0814", surface:"#171120", text:"#f6f2ff", muted:"#aaa0bc", accent:"#9a7cff"},
      ocean: {name:"Ocean", background:"#071219", surface:"#0d1d26", text:"#eff9ff", muted:"#9ab1bc", accent:"#59b8df"},
      forest: {name:"Forest", background:"#07100c", surface:"#0e1b14", text:"#eef7f0", muted:"#9ab0a1", accent:"#74d99a"},
      sunset: {name:"Sunset", background:"#160b08", surface:"#241410", text:"#fff4ed", muted:"#c5a99d", accent:"#f0a56e"},
      paper: {name:"Paper", background:"#eee7db", surface:"#fbf8f1", text:"#191612", muted:"#6e655d", accent:"#7a533b"}
    },
    fonts:["Inter","Arial","Georgia","Times New Roman","Verdana","Trebuchet MS","Courier New"],
    backgrounds: ["#070707","#101010","#171717","#f4f2ec","#ffffff","#0a0f1d","#eee7db","#f6f6f4","#1a1025","#0e1714"],
    text: ["#f4f2ec","#171717","#d9d7d0","#6c6a63","#ffffff"],
    accents: ["#9a7cff","#6ca7ff","#75d69a","#f0bf7b","#d987b9","#f4f2ec","#181818"],
    presets: {
      starfield: { background:"#070707", surface:"#101010", text:"#f4f2ec", muted:"#a9a69e", accent:"#9a7cff", name:"Original starfield" },
      plain: { background:"#f4f2ec", surface:"#ffffff", text:"#171717", muted:"#66645e", accent:"#171717", name:"Plain" },
      midnight: { background:"#0a0f1d", surface:"#111a28", text:"#f3f7ff", muted:"#8d9aae", accent:"#6ca7ff", name:"Midnight grid" },
      editorial: { background:"#eee7db", surface:"#fbf8f1", text:"#191612", muted:"#6e655d", accent:"#7a533b", name:"Editorial paper" },
      "soft-grid": { background:"#f6f6f4", surface:"#ffffff", text:"#151515", muted:"#77746d", accent:"#151515", name:"Soft grid" }
    }
  };

  const defaultState = {
    version: VERSION,
    businessName: "",
    ownerName: "",
    businessCategory: "digital-products",
    tagline: "",
    contactEmail: "",
    contactPhone: "",
    instagram: "",
    otherContact: "",
    privacy: true,
    terms: true,
    disclaimer: false,
    cookiePolicy: false,
    designPreset: "starfield",
    productLayout: "grid",
    paletteName: "violet",
    paletteName: "violet",
    sections: [
      { id:"header", type:"header", name:"Header", enabled:true, background:"#070707", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"header-brand",type:"text",variant:"brand",text:"YOUR STORE"}
      ] },
      { id:"hero", type:"hero", name:"Hero", enabled:true, background:"#070707", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"hero-kicker",type:"text",variant:"eyebrow",text:"DIGITAL PRODUCTS"},
        {id:"hero-title",type:"text",variant:"heading",text:"Your store."},
        {id:"hero-copy",type:"text",variant:"copy",text:"Digital products made ready to use."},
        {id:"hero-button",type:"button",variant:"filled",text:"Browse products",href:"#products"}
      ]},
      { id:"about", type:"about", name:"About", enabled:true, background:"#101010", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"about-kicker",type:"text",variant:"eyebrow",text:"ABOUT THE STORE"},
        {id:"about-title",type:"text",variant:"title",text:"Useful by design."},
        {id:"about-copy",type:"text",variant:"copy",text:"Tell customers what makes the store useful, who the products are for and why they should care."}
      ]},
      { id:"catalog", type:"catalog", name:"Catalog", enabled:true, background:"#070707", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"catalog-kicker",type:"text",variant:"eyebrow",text:"CATALOG"},
        {id:"catalog-title",type:"text",variant:"title",text:"Products."},
        {id:"catalog-copy",type:"text",variant:"copy",text:"Browse the latest digital products."}
      ]},
      { id:"cta", type:"cta", name:"Call to action", enabled:true, background:"#101010", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"cta-kicker",type:"text",variant:"eyebrow",text:"NEXT MOVE"},
        {id:"cta-title",type:"text",variant:"title",text:"Ready to get started?"},
        {id:"cta-copy",type:"text",variant:"copy",text:"Keep the last section simple and direct."},
        {id:"cta-button",type:"button",variant:"filled",text:"View products",href:"#products"}
      ]},
      { id:"footer", type:"footer", name:"Footer", enabled:true, background:"#070707", text:"#f4f2ec", accent:"#9a7cff", elements:[
        {id:"footer-brand",type:"text",variant:"brand",text:"YOUR STORE"},
        {id:"footer-copy",type:"text",variant:"copy",text:"Digital products, upgraded."}
      ]}
    ]
  };

  let state = structuredClone(defaultState);

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function toast(message){
    const el = $("#wbToast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STATE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        state = mergeState(defaultState, parsed);
        return;
      }
    }catch{}
    try{
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STATE_KEY) || "{}") || {};
      if(Object.keys(legacy).length){
        state = mergeState(defaultState, legacy);
        state.businessName = legacy.businessName || "";
        state.ownerName = legacy.ownerName || "";
        state.tagline = legacy.tagline || "";
        state.businessCategory = legacy.businessCategory || "digital-products";
        state.contactEmail = legacy.contactEmail || "";
        state.contactPhone = legacy.contactPhone || "";
        state.instagram = legacy.instagram || "";
        state.otherContact = legacy.otherContact || "";
        state.privacy = legacy.privacy !== false;
        state.terms = legacy.terms !== false;
        state.disclaimer = !!legacy.disclaimer;
        state.cookiePolicy = !!legacy.cookiePolicy;
        applyPresetToSections(state.designPreset);
        persistState(true);
        return;
      }
    }catch{}
    persistState(true);
  }

  function mergeState(base, incoming){
    const merged = {...clone(base), ...incoming};
    merged.sections = Array.isArray(incoming.sections) && incoming.sections.length ? incoming.sections.map(sec => ({
      ...sec,
      elements: Array.isArray(sec.elements) ? sec.elements : []
    })) : clone(base.sections);
    merged.version = VERSION;
    merged.paletteName = merged.paletteName || "violet";
    merged.sections = merged.sections.map(sec => ({
      ...sec,
      elements: sec.elements.map(el => ({
        ...el,
        fontFamily: el.fontFamily || "Inter",
        fontSize: el.fontSize || "",
        fontWeight: el.fontWeight || "",
        textAlign: el.textAlign || "",
        color: el.color || ""
      }))
    }));
    return merged;
  }

  function persistState(silent){
    try{
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      const label = $("#wbSaveState");
      if(label){
        label.textContent = silent ? "Saved locally" : "Saved just now";
        label.classList.remove("is-saving");
      }
    }catch{
      toast("Could not save settings in this browser.");
    }
  }

  function schedulePersist(){
    const label = $("#wbSaveState");
    if(label){
      label.textContent = "Saving...";
      label.classList.add("is-saving");
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persistState(false), 260);
  }

  function sectionById(id){ return state.sections.find(s => s.id === id); }
  function selectedSection(){ return sectionById(selectedSectionId); }
  function findElement(id){
    for(const section of state.sections){
      const found = section.elements.find(el => el.id === id);
      if(found) return {section, element:found};
    }
    return null;
  }

  async function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if(!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE,{keyPath:"id"});
        if(!db.objectStoreNames.contains(PRODUCT_STORE)) db.createObjectStore(PRODUCT_STORE,{keyPath:"id"});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function dbPut(storeName, value){
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(storeName,"readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbGetAll(storeName){
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const req = db.transaction(storeName,"readonly").objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGet(storeName,id){
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const req = db.transaction(storeName,"readonly").objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDelete(storeName,id){
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(storeName,"readwrite");
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function migrateLegacyProducts(){
    const existing = await dbGetAll(PRODUCT_STORE);
    if(existing.length) return;
    try{
      const legacyDb = await new Promise((resolve,reject) => {
        const req = indexedDB.open("dewify-website-builder");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if(!legacyDb.objectStoreNames.contains("products")){ legacyDb.close(); return; }
      const products = await new Promise((resolve,reject) => {
        const req = legacyDb.transaction("products","readonly").objectStore("products").getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      legacyDb.close();
      for(const p of products){
        await dbPut(PRODUCT_STORE,{
          id:p.id,
          title:p.title || "Untitled product",
          description:p.description || "",
          price:p.price || "",
          currency:p.currency || "INR",
          imageBlob:p.imageBlob || null,
          imageName:p.imageName || "",
          zipBlob:p.zipBlob || null,
          zipName:p.zipName || "",
          thumbRatio:p.thumbRatio || "16:9",
          updatedAt:p.updatedAt || Date.now()
        });
      }
    }catch{}
  }

  function preset(name){ return palette.presets[name] || palette.presets.starfield; }

  function applyPresetToSections(name){
    const p = preset(name);
    state.designPreset = name;
    state.sections.forEach((section,index) => {
      section.background = index === 0 || section.type === "footer" ? p.background : p.surface;
      section.text = p.text;
      section.accent = p.accent;
    });
  }

  async function renderMediaLibrary(){
    const grid = $("#wbMediaGrid");
    const assets = (await dbGetAll(ASSET_STORE)).filter(a => a.kind === "editor-image");
    $("#wbMediaCount").textContent = assets.length + " image" + (assets.length === 1 ? "" : "s");
    if(!assets.length){
      grid.innerHTML = '<div class="wb-media-empty">Upload several images and manage them from one place.</div>';
      return;
    }
    grid.innerHTML = assets.map(asset =>
      '<label class="wb-media-card ' + (selectedMediaIds.includes(asset.id) ? "is-selected" : "") + '">' +
        '<img alt="" data-media-image="' + escAttr(asset.id) + '">' +
        '<input class="wb-media-check" type="checkbox" ' + (selectedMediaIds.includes(asset.id) ? "checked" : "") + ' data-media-check="' + escAttr(asset.id) + '">' +
      '</label>'
    ).join("");
    for(const asset of assets){
      const img = $('[data-media-image="' + CSS.escape(asset.id) + '"]');
      if(img) img.src = await blobToDataURL(asset.blob);
    }
    $$("[data-media-check]").forEach(check => check.addEventListener("change", () => {
      if(check.checked) selectedMediaIds.push(check.dataset.mediaCheck);
      else selectedMediaIds = selectedMediaIds.filter(id => id !== check.dataset.mediaCheck);
      check.closest(".wb-media-card")?.classList.toggle("is-selected",check.checked);
      $("#wbMediaCount").textContent = assets.length + " image" + (assets.length === 1 ? "" : "s") + " · " + selectedMediaIds.length + " selected";
    }));
  }

  async function uploadMediaFiles(files){
    const valid = Array.from(files || []).filter(file => ["image/png","image/jpeg","image/webp"].includes(file.type) && file.size <= 10*1024*1024);
    if(!valid.length){ toast("Choose PNG, JPG or WebP images under 10 MB."); return; }
    for(const file of valid){
      await dbPut(ASSET_STORE,{id:uniqueId("asset"),kind:"editor-image",name:file.name,blob:file,updatedAt:Date.now()});
    }
    selectedMediaIds = [];
    await renderMediaLibrary();
    toast(valid.length + " image" + (valid.length === 1 ? "" : "s") + " added to Media.");
  }

  async function addSelectedMediaToSection(){
    const section = selectedSection();
    if(!section){ toast("Select a section first."); return; }
    if(!selectedMediaIds.length){ toast("Select one or more images first."); return; }
    const ids = [...selectedMediaIds];
    for(const assetId of ids){
      const element = {id:uniqueId("el"),type:"image",assetId,imageFit:"cover",imageRadius:"12px",imageWidth:"100%"};
      section.elements.push(element);
      selectedElementId = element.id;
      selectedSectionId = section.id;
    }
    selectedImageElementIds = section.elements.filter(e => ids.includes(e.assetId)).map(e => e.id).slice(-ids.length);
    selectedMediaIds = [];
    schedulePersist();
    await renderMediaLibrary();
    renderAll();
    toast(ids.length + " images added to " + section.name + ".");
  }

  function renderSectionList(){
    const list = $("#wbSectionList");
    list.innerHTML = state.sections.map((s,i) =>
      '<button class="wb-section-item ' + (s.id === selectedSectionId ? "is-selected " : "") + (s.enabled ? "" : "is-hidden") + '" type="button" data-section="' + escAttr(s.id) + '">' +
        '<span class="wb-section-number">' + String(i+1).padStart(2,"0") + '</span>' +
        '<span class="wb-section-name">' + escText(s.name) + '</span>' +
        '<span class="wb-section-state">' + (s.enabled ? "LIVE" : "OFF") + '</span>' +
      '</button>'
    ).join("");
    $$(".wb-section-item",list).forEach(btn => {
      btn.addEventListener("click",() => {
        selectedSectionId = btn.dataset.section;
        selectedElementId = null;
        renderAll();
      });
    });
  }

  function sectionStyle(section){
    return 'style="--wb-bg:' + escAttr(section.background) + ';--wb-text:' + escAttr(section.text) + ';--wb-accent:' + escAttr(section.accent) + ';color:' + escAttr(section.text) + ';background-color:' + escAttr(section.background) + ';"';
  }

  function sectionClass(type){
    return {
      header:"wb-section-header",
      hero:"wb-section-hero",
      about:"wb-section-about",
      catalog:"wb-section-catalog",
      cta:"wb-section-cta",
      footer:"wb-section-footer",
      custom:"wb-custom-section"
    }[type] || "wb-custom-section";
  }

  function editableMarkup(sectionId, element){
    const cls = "wb-element wb-editable";
    const fontFamily = element.fontFamily || "Inter";
    const fontSize = element.fontSize ? element.fontSize + "px" : "";
    const fontWeight = element.fontWeight || "";
    const textAlign = element.textAlign || "";
    const color = element.color || "";
    const inlineStyle = ' style="' +
      (fontFamily ? 'font-family:' + escAttr(fontFamily) + ';' : '') +
      (fontSize ? 'font-size:' + escAttr(fontSize) + ';' : '') +
      (fontWeight ? 'font-weight:' + escAttr(fontWeight) + ';' : '') +
      (textAlign ? 'text-align:' + escAttr(textAlign) + ';' : '') +
      (color ? 'color:' + escAttr(color) + ';' : '') + '"';
    const content = escText(element.text || "");
    const extra = element.variant === "heading" ? " wb-section-heading" :
      element.variant === "title" ? " wb-section-title" :
      element.variant === "copy" ? " wb-section-copy" :
      element.variant === "eyebrow" ? " wb-section-eyebrow" :
      element.variant === "brand" ? " wb-section-brand" : "";
    const tag = element.variant === "heading" ? "h1" :
      element.variant === "title" ? "h2" :
      element.variant === "copy" ? "p" :
      element.variant === "eyebrow" ? "div" : "span";
    return '<' + tag + ' contenteditable="true" spellcheck="false" class="' + cls + extra + '" data-editable="1" data-section-id="' + escAttr(sectionId) + '" data-element-id="' + escAttr(element.id) + '" data-placeholder="Click to edit"' + inlineStyle + '>' + content + '</' + tag + '>';
  }

  async function assetUrl(assetId){
    if(!assetId) return "";
    const asset = await dbGet(ASSET_STORE,assetId);
    if(!asset || !asset.blob) return "";
    return URL.createObjectURL(asset.blob);
  }

  function buttonMarkup(sectionId, element){
    const variant = element.variant === "outline" ? "" : "filled";
    const inlineStyle = ' style="' +
      'font-family:' + escAttr(element.fontFamily || "Inter") + ';' +
      (element.fontSize ? 'font-size:' + escAttr(element.fontSize) + 'px;' : '') +
      (element.fontWeight ? 'font-weight:' + escAttr(element.fontWeight) + ';' : '') +
      (element.textAlign ? 'text-align:' + escAttr(element.textAlign) + ';' : '') +
      (element.color ? 'color:' + escAttr(element.color) + ';' : '') + '"';
    return '<a href="' + escAttr(element.href || "#products") + '" class="wb-site-button ' + variant + ' wb-element wb-editable" data-element-id="' + escAttr(element.id) + '" data-section-id="' + escAttr(sectionId) + '" data-button-edit="1" contenteditable="true" spellcheck="false"' + inlineStyle + '>' + escText(element.text || "Button") + '</a>';
  }

  function dividerMarkup(sectionId, element){
    return '<div class="wb-divider-element wb-element" data-element-id="' + escAttr(element.id) + '" data-section-id="' + escAttr(sectionId) + '"></div>';
  }

  async function elementMarkup(section,element){
    if(element.type === "text") return editableMarkup(section.id,element);
    if(element.type === "button") return buttonMarkup(section.id,element);
    if(element.type === "divider") return dividerMarkup(section.id,element);
    if(element.type === "image"){
      const url = await assetUrl(element.assetId);
      if(!url) return '<div class="wb-element wb-element-properties" data-element-id="' + escAttr(element.id) + '">Image missing</div>';
      const fit = element.imageFit || "cover";
      const radius = element.imageRadius || "12px";
      const width = element.imageWidth || "100%";
      return '<div class="wb-inline-image-wrap"><img class="wb-inline-image wb-element" style="width:' + escAttr(width) + ';object-fit:' + escAttr(fit) + ';border-radius:' + escAttr(radius) + '" src="' + escAttr(url) + '" alt="" data-element-id="' + escAttr(element.id) + '" data-section-id="' + escAttr(section.id) + '" data-image-edit="1"></div>';
    }
    return "";
  }

  async function renderHero(section){
    const elements = [];
    for(const element of section.elements) elements.push(await elementMarkup(section,element));
    const image = section.imageAssetId ? await assetUrl(section.imageAssetId) : "";
    const right = image ? '<img class="wb-section-image" src="' + escAttr(image) + '" alt="">' :
      '<div class="wb-section-image" style="display:grid;place-items:center;color:' + escAttr(section.accent) + ';background:rgba(0,0,0,.12);font:8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;">ADD IMAGE</div>';
    return '<div class="wb-canvas-section ' + sectionClass(section.type) + (section.id===selectedSectionId ? " is-selected" : "") + (section.enabled ? "" : " is-hidden") + '" data-section-id="' + escAttr(section.id) + '" ' + sectionStyle(section) + '>' +
      '<div class="wb-section-inner">' + elements.join("") + '</div>' +
      '<div>' + right + '</div>' +
    '</div>';
  }

  async function renderHeader(section){
    const brand = section.elements.find(e => e.variant === "brand") || {id:"header-brand",type:"text",variant:"brand",text:state.businessName || "YOUR STORE"};
    const brandMarkup = editableMarkup(section.id,brand);
    const nav = '<div class="wb-section-nav"><span data-select-section="' + escAttr(section.id) + '">SHOP</span><span data-select-section="' + escAttr(section.id) + '">ABOUT</span><span data-select-section="' + escAttr(section.id) + '">CONTACT</span></div>';
    return '<div class="wb-canvas-section ' + sectionClass(section.type) + (section.id===selectedSectionId ? " is-selected" : "") + (section.enabled ? "" : " is-hidden") + '" data-section-id="' + escAttr(section.id) + '" ' + sectionStyle(section) + '>' +
      '<div class="wb-section-brand-wrap">' + brandMarkup + '</div>' + nav +
    '</div>';
  }

  async function renderGenericSection(section){
    const elements = [];
    for(const element of section.elements) elements.push(await elementMarkup(section,element));
    return '<div class="wb-canvas-section ' + sectionClass(section.type) + (section.id===selectedSectionId ? " is-selected" : "") + (section.enabled ? "" : " is-hidden") + '" data-section-id="' + escAttr(section.id) + '" ' + sectionStyle(section) + '>' +
      '<div class="wb-section-inner">' + elements.join("") + (section.type === "catalog" ? await catalogMarkup(section) : "") + '</div>' +
    '</div>';
  }

  async function catalogMarkup(section){
    const products = await dbGetAll(PRODUCT_STORE);
    if(!products.length) return '<div class="wb-catalog-mini"><div class="wb-element-properties"><p>Add products in the Products step to see the real catalog here.</p></div></div>';
    const layout = state.productLayout;
    const cards = [];
    for(const p of products.slice(0,6)){
      const img = p.imageBlob ? URL.createObjectURL(p.imageBlob) : "";
      cards.push('<article class="wb-catalog-card"><div>' + (img ? '<img src="' + escAttr(img) + '" alt="' + escAttr(p.title) + '">' : "") + '</div><div class="wb-catalog-card-body"><strong>' + escText(p.title) + '</strong><span>' + escText((p.currency || "INR") + " " + (p.price || "")) + '</span></div></article>');
    }
    return '<div class="wb-catalog-mini ' + layout + '">' + cards.join("") + '</div>';
  }

  async function renderCanvas(){
    const canvas = $("#wbCanvas");
    canvas.dataset.preset = state.designPreset;
    canvas.style.transform = "scale(" + canvasZoom.toFixed(2) + ")";
    const parts = [];
    for(const section of state.sections){
      if(!section.enabled && section.id !== selectedSectionId) continue;
      if(section.type === "header") parts.push(await renderHeader(section));
      else if(section.type === "hero") parts.push(await renderHero(section));
      else parts.push(await renderGenericSection(section));
    }
    canvas.innerHTML = parts.join("");
    bindCanvasEvents();
  }

  function bindCanvasEvents(){
    $$(".wb-canvas-section").forEach(sectionEl => {
      sectionEl.addEventListener("click",(event) => {
        const element = event.target.closest("[data-element-id]");
        if(element){
          event.stopPropagation();
          selectedSectionId = sectionEl.dataset.sectionId;
          selectedElementId = element.dataset.elementId;
          renderInspector();
          return;
        }
        const navSelect = event.target.closest("[data-select-section]");
        if(navSelect){
          event.stopPropagation();
        }
        selectedSectionId = sectionEl.dataset.sectionId;
        selectedElementId = null;
        renderAll();
      });
    });

    $$("[data-editable]").forEach(el => {
      el.addEventListener("focus",() => {
        selectedSectionId = el.dataset.sectionId;
        selectedElementId = el.dataset.elementId;
        renderInspector();
      });
      el.addEventListener("input",() => {
        const found = findElement(el.dataset.elementId);
        if(found){
          found.element.text = el.innerText.replace(/\n/g," ").trim();
          if(found.section.id === "header" && found.element.variant === "brand" && !state.businessName) state.businessName = found.element.text;
          schedulePersist();
        }
      });
      el.addEventListener("click",event => {
        if(el.dataset.buttonEdit === "1") event.preventDefault();
        event.stopPropagation();
      });
      el.addEventListener("keydown",event => {
        if(event.key === "Enter" && !event.shiftKey && el.tagName !== "P"){
          event.preventDefault();
          el.blur();
        }
      });
    });

    $$$("[data-image-edit]").forEach(el => {
      el.addEventListener("click",event => {
        event.stopPropagation();
        selectedElementId = el.dataset.elementId;
        selectedSectionId = el.dataset.sectionId;
        selectedImageElementIds = [el.dataset.elementId];
        renderInspector();
      });
    });
  }

  function renderAll(){
    renderSectionList();
    renderCanvas().then(() => {
      renderInspector();
      return renderMediaLibrary();
    });
    updateViewControls();
  }

  function renderInspector(){
    const root = $("#wbInspector");
    if(selectedElementId){
      const found = findElement(selectedElementId);
      if(found) return renderElementInspector(root,found.section,found.element);
    }
    const section = selectedSection();
    if(!section){ root.innerHTML = '<div class="wb-no-selection">Select a section from the canvas.</div>'; return; }

    root.innerHTML =
      '<div class="wb-inspector-head"><span class="wb-kicker">SECTION</span><h3>' + escText(section.name) + '</h3></div>' +
      '<div class="wb-inspector-body">' +
        inspectorPalette("BACKGROUND",section,"background",palette.backgrounds) +
        inspectorPalette("TEXT",section,"text",palette.text) +
        inspectorPalette("ACCENT",section,"accent",palette.accents) +
        inspectorColorPalette(section) +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">DESIGN PRESET</div>' +
          '<div class="wb-preset-grid">' + Object.keys(palette.presets).map(name =>
            '<button class="wb-preset ' + (state.designPreset === name ? "is-active" : "") + '" type="button" data-preset="' + name + '"><strong>' + escText(palette.presets[name].name) + '</strong><small>Use this across the storefront.</small></button>'
          ).join("") + '</div>' +
        '</div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">PRODUCT LAYOUT</div>' +
          '<div class="wb-layout-grid">' +
            ['grid','list','featured'].map(layout => '<button class="wb-layout-option ' + (state.productLayout === layout ? "is-active" : "") + '" type="button" data-layout="' + layout + '"><span class="wb-layout-icon ' + layout + '"></span><span>' + layout + '</span></button>').join("") +
          '</div>' +
        '</div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">SECTION</div><div class="wb-inspector-actions">' +
          '<button class="wb-mini-button" type="button" id="wbToggleSection">' + (section.enabled ? "Hide section" : "Show section") + '</button>' +
          '<button class="wb-mini-button" type="button" id="wbDuplicateSection">Duplicate</button>' +
          '<button class="wb-mini-button danger" type="button" id="wbDeleteSection">Delete</button>' +
        '</div></div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">QUICK ELEMENTS</div><div class="wb-inspector-actions">' +
          '<button class="wb-mini-button" type="button" data-add-inspector="text">Add text</button>' +
          '<button class="wb-mini-button" type="button" data-add-inspector="button">Add button</button>' +
          '<button class="wb-mini-button" type="button" data-add-inspector="image">Add image</button>' +
          '<button class="wb-mini-button" type="button" data-add-inspector="divider">Add divider</button>' +
        '</div></div>' +
      '</div>';

    bindInspectorEvents();
  }


  function inspectorColorPalette(section){
    return '<div class="wb-inspector-block"><div class="wb-inspector-label">COLOR PALETTE</div><div class="wb-preset-grid">' +
      Object.keys(palette.colorPalettes).map(name => {
        const p = palette.colorPalettes[name];
        return '<button class="wb-preset ' + (state.paletteName === name ? "is-active" : "") + '" type="button" data-color-palette="' + name + '">' +
          '<strong>' + escText(p.name) + '</strong><small>' + p.background + ' · ' + p.accent + '</small></button>';
      }).join("") + '</div></div>';
  }

  function inspectorPalette(label,section,key,colors){
    return '<div class="wb-inspector-block"><div class="wb-inspector-row"><span class="wb-inspector-label">' + label + '</span><code>' + escText(section[key]) + '</code></div>' +
      '<div class="wb-palette">' + colors.map(color => '<button class="wb-swatch ' + (section[key].toLowerCase()===color.toLowerCase() ? "is-active" : "") + '" style="background:' + escAttr(color) + '" type="button" data-color-key="' + key + '" data-color="' + escAttr(color) + '" title="' + escAttr(color) + '" aria-label="' + escAttr(color) + '"></button>').join("") + '</div>' +
      '<input class="wb-custom-color" type="color" value="' + escAttr(section[key]) + '" data-custom-color-key="' + key + '">' +
    '</div>';
  }

  function renderElementInspector(root,section,element){
    const title = element.type === "button" ? "Button" : element.type === "divider" ? "Divider" : "Text";
    if(element.type === "image") return renderImageInspector(root,section,element);
    const font = element.fontFamily || "Inter";
    const size = element.fontSize || "";
    const weight = element.fontWeight || "";
    const align = element.textAlign || "left";
    const color = element.color || section.text || "#181818";
    root.innerHTML =
      '<div class="wb-inspector-head"><span class="wb-kicker">ELEMENT / ' + title.toUpperCase() + '</span><h3>' + escText(section.name) + '</h3></div>' +
      '<div class="wb-inspector-body">' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">TEXT STYLE</div>' +
          '<div class="wb-font-row"><select class="wb-font-select" data-font-family>' +
            palette.fonts.map(f => '<option value="' + escAttr(f) + '" ' + (font===f ? "selected" : "") + '>' + escText(f) + '</option>').join("") +
          '</select><input class="wb-font-select" type="number" min="8" max="120" value="' + escAttr(size) + '" placeholder="Size" data-font-size></div>' +
          '<div class="wb-font-row-three"><select class="wb-inspector-select" data-font-weight><option value="" ' + (!weight ? "selected" : "") + '>Default</option><option value="400" ' + (weight==="400" ? "selected" : "") + '>Regular</option><option value="600" ' + (weight==="600" ? "selected" : "") + '>Semibold</option><option value="700" ' + (weight==="700" ? "selected" : "") + '>Bold</option></select><input class="wb-inspector-select" type="color" value="' + escAttr(color) + '" data-element-color><span class="wb-color-code">' + escText(color) + '</span></div>' +
          '<div class="wb-align-row">' + ["left","center","right"].map(a => '<button class="wb-align-button ' + (align===a ? "is-active" : "") + '" type="button" data-text-align="' + a + '">' + a + '</button>').join("") + '</div>' +
        '</div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">SELECTED</div><div class="wb-element-properties"><p>Click the text directly on the canvas and type. Changes save automatically.</p></div></div>' +
        (element.type === "image" ? '<div class="wb-inspector-block"><div class="wb-inspector-label">IMAGE</div><div class="wb-inspector-actions"><button class="wb-mini-button" type="button" id="wbReplaceElementImage">Replace image</button><button class="wb-mini-button danger" type="button" id="wbDeleteElement">Delete</button></div></div>' :
         '<div class="wb-inspector-block"><div class="wb-inspector-label">ELEMENT</div><div class="wb-inspector-actions"><button class="wb-mini-button danger" type="button" id="wbDeleteElement">Delete element</button></div></div>') +
        (element.type === "button" ? '<div class="wb-inspector-block"><div class="wb-inspector-label">BUTTON STYLE</div><div class="wb-inspector-actions"><button class="wb-mini-button ' + (element.variant === "filled" ? "active" : "") + '" type="button" data-button-style="filled">Filled</button><button class="wb-mini-button ' + (element.variant === "outline" ? "active" : "") + '" type="button" data-button-style="outline">Outline</button></div></div>' : '') +
      '</div>';
    bindInspectorEvents();
  }


  function renderImageInspector(root,section,element){
    const allImages = [];
    for(const sec of state.sections) for(const el of sec.elements) if(el.type === "image") allImages.push({section:sec,element:el});
    const selectedCount = selectedImageElementIds.length || 1;
    root.innerHTML =
      '<div class="wb-inspector-head"><span class="wb-kicker">ELEMENT / IMAGE</span><h3>' + escText(section.name) + '</h3></div>' +
      '<div class="wb-inspector-body">' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">IMAGE CONTROLS</div>' +
          '<div class="wb-image-fit-row">' +
            ['cover','contain','fill'].map(v => '<button class="wb-image-option ' + ((element.imageFit||"cover")===v ? "is-active" : "") + '" type="button" data-image-fit="' + v + '">' + v + '</button>').join("") +
          '</div>' +
          '<div class="wb-radius-row">' +
            ['0px','8px','20px'].map(v => '<button class="wb-image-option ' + ((element.imageRadius||"12px")===v ? "is-active" : "") + '" type="button" data-image-radius="' + v + '">' + v + '</button>').join("") +
          '</div>' +
        '</div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">IMAGES ON PAGE · ' + selectedCount + ' SELECTED</div>' +
          '<div class="wb-batch-bar"><strong>Edit multiple images</strong><span>Tick several images below, then apply fit or corner settings to all of them.</span></div>' +
          '<div class="wb-image-element-list">' + allImages.map(item =>
            '<label class="wb-image-element-row"><input type="checkbox" data-image-element-check="' + escAttr(item.element.id) + '" ' + (selectedImageElementIds.includes(item.element.id) ? "checked" : "") + '><span>' + escText(item.section.name) + '</span><small>' + escText(item.element.id.slice(-5)) + '</small></label>'
          ).join("") + '</div>' +
        '</div>' +
        '<div class="wb-inspector-block"><div class="wb-inspector-label">IMAGE</div><div class="wb-inspector-actions">' +
          '<button class="wb-mini-button" type="button" id="wbReplaceElementImage">Replace image</button>' +
          '<button class="wb-mini-button danger" type="button" id="wbDeleteElement">Delete selected</button>' +
        '</div></div>' +
      '</div>';
    bindInspectorEvents();
  }

  function bindInspectorEvents(){
    $$$("[data-color-key]").forEach(btn => btn.addEventListener("click",() => {
      const section = selectedSection();
      section[btn.dataset.colorKey] = btn.dataset.color;
      schedulePersist();
      renderAll();
    }));
    $$$("[data-custom-color-key]").forEach(input => input.addEventListener("input",() => {
      const section = selectedSection();
      section[input.dataset.customColorKey] = input.value;
      schedulePersist();
      renderCanvas();
      renderInspector();
    }));
    $$("[data-preset]").forEach(btn => btn.addEventListener("click",() => {
      applyPresetToSections(btn.dataset.preset);
      schedulePersist();
      renderAll();
    }));
    $$("[data-color-palette]").forEach(btn => btn.addEventListener("click",() => {
      const p = palette.colorPalettes[btn.dataset.colorPalette];
      if(!p) return;
      state.paletteName = btn.dataset.colorPalette;
      const section = selectedSection();
      if(section){
        section.background = p.background;
        section.text = p.text;
        section.accent = p.accent;
      }
      schedulePersist();
      renderAll();
    }));
    $$$("[data-layout]").forEach(btn => btn.addEventListener("click",() => {
      state.productLayout = btn.dataset.layout;
      schedulePersist();
      renderAll();
    }));
    $("#wbToggleSection")?.addEventListener("click",() => {
      const section = selectedSection();
      section.enabled = !section.enabled;
      if(!section.enabled) selectedElementId = null;
      schedulePersist();
      renderAll();
    });
    $("#wbDuplicateSection")?.addEventListener("click",() => duplicateSection());
    $("#wbDeleteSection")?.addEventListener("click",() => deleteSection());
    $$(".wb-mini-button[data-add-inspector]").forEach(btn => btn.addEventListener("click",() => addElement(btn.dataset.addInspector)));
    $("#wbDeleteElement")?.addEventListener("click",() => deleteElement());
    $("#wbReplaceElementImage")?.addEventListener("click",() => {
      pendingImageTargetId = selectedElementId;
      $("#wbElementImageInput").click();
    });
    $$("[data-button-style]").forEach(btn => btn.addEventListener("click",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      found.element.variant = btn.dataset.buttonStyle;
      schedulePersist();
      renderAll();
    }));
    $$("[data-font-family]").forEach(select => select.addEventListener("change",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      found.element.fontFamily = select.value;
      schedulePersist();
      renderCanvas();
      renderInspector();
    }));
    $$("[data-font-size]").forEach(input => input.addEventListener("input",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      const val = Number(input.value);
      found.element.fontSize = Number.isFinite(val) ? val : "";
      schedulePersist();
      renderCanvas();
    }));
    $$("[data-font-weight]").forEach(select => select.addEventListener("change",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      found.element.fontWeight = select.value;
      schedulePersist();
      renderCanvas();
    }));
    $$("[data-text-align]").forEach(btn => btn.addEventListener("click",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      found.element.textAlign = btn.dataset.textAlign;
      schedulePersist();
      renderCanvas();
      renderInspector();
    }));
    $$("[data-element-color]").forEach(input => input.addEventListener("input",() => {
      const found = findElement(selectedElementId);
      if(!found) return;
      found.element.color = input.value;
      schedulePersist();
      renderCanvas();
    }));
    $$("[data-image-element-check]").forEach(check => check.addEventListener("change",() => {
      if(check.checked) selectedImageElementIds.push(check.dataset.imageElementCheck);
      else selectedImageElementIds = selectedImageElementIds.filter(id => id !== check.dataset.imageElementCheck);
      if(!selectedImageElementIds.length) selectedImageElementIds = [selectedElementId];
      const active = findElement(selectedElementId);
      if(active) renderImageInspector($("#wbInspector"),active.section,active.element);
    }));
    $$("[data-image-fit]").forEach(btn => btn.addEventListener("click",() => applyImageBatch("imageFit",btn.dataset.imageFit)));
    $$("[data-image-radius]").forEach(btn => btn.addEventListener("click",() => applyImageBatch("imageRadius",btn.dataset.imageRadius)));

  }


  function applyImageBatch(key,value){
    const ids = selectedImageElementIds.length ? selectedImageElementIds : [selectedElementId];
    let changed = 0;
    for(const id of ids){
      const found = findElement(id);
      if(found && found.element.type === "image"){
        found.element[key] = value;
        changed++;
      }
    }
    schedulePersist();
    renderAll();
    toast(changed + " image" + (changed===1 ? "" : "s") + " updated.");
  }

  function uniqueId(prefix){
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
  }

  let pendingImageTargetId = null;

  function addElement(type){
    const section = selectedSection();
    if(!section) return;
    if(type === "image"){
      pendingImageTargetId = null;
      $("#wbElementImageInput").click();
      return;
    }
    const element = {
      id: uniqueId("el"),
      type,
      variant:type === "button" ? "filled" : type === "text" ? "copy" : undefined,
      text:type === "text" ? "Click to edit this text" : type === "button" ? "New button" : "",
      href:"#products",
      fontFamily:"Inter",
      fontSize:"",
      fontWeight:"",
      textAlign:"left",
      color:""
    };
    if(type === "divider") delete element.variant;
    section.elements.push(element);
    selectedElementId = element.id;
    selectedSectionId = section.id;
    schedulePersist();
    renderAll();
    requestAnimationFrame(() => {
      const node = document.querySelector('[data-element-id="' + CSS.escape(element.id) + '"]');
      node?.scrollIntoView({block:"center",behavior:"smooth"});
      node?.focus?.();
    });
  }

  async function addImageAssetToSection(file,sectionId,elementId){
    if(!file) return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){
      toast("Use a PNG, JPG or WebP image.");
      return;
    }
    if(file.size > 10*1024*1024){
      toast("Keep editor images under 10 MB.");
      return;
    }
    const asset = {id:uniqueId("asset"),kind:"editor-image",name:file.name,blob:file,updatedAt:Date.now()};
    await dbPut(ASSET_STORE,asset);
    const found = elementId ? findElement(elementId) : null;
    if(found){
      found.element.assetId = asset.id;
    }else{
      const section = sectionById(sectionId);
      const element = {id:uniqueId("el"),type:"image",assetId:asset.id,text:"",imageFit:"cover",imageRadius:"12px",imageWidth:"100%"};
      section.elements.push(element);
      selectedElementId = element.id;
      selectedSectionId = section.id;
    }
    schedulePersist();
    renderAll();
  }

  function duplicateSection(){
    const section = selectedSection();
    if(!section) return;
    const copy = clone(section);
    copy.id = uniqueId("section");
    copy.name = section.name + " copy";
    copy.elements = copy.elements.map(el => ({...el,id:uniqueId("el")}));
    const idx = state.sections.findIndex(s => s.id===section.id);
    state.sections.splice(idx+1,0,copy);
    selectedSectionId = copy.id;
    selectedElementId = null;
    schedulePersist();
    renderAll();
  }

  function deleteSection(){
    if(state.sections.length <= 2){ toast("Keep at least two sections."); return; }
    const section = selectedSection();
    if(!section) return;
    if(!confirm("Delete this section from the local website builder?")) return;
    state.sections = state.sections.filter(s => s.id !== section.id);
    selectedSectionId = state.sections[Math.max(0,state.sections.length-1)].id;
    selectedElementId = null;
    schedulePersist();
    renderAll();
  }

  function deleteElement(){
    const ids = selectedImageElementIds.length && selectedElementId && findElement(selectedElementId)?.element.type === "image"
      ? [...new Set(selectedImageElementIds)]
      : [selectedElementId];
    let changed = false;
    for(const id of ids){
      const found = findElement(id);
      if(!found) continue;
      found.section.elements = found.section.elements.filter(el => el.id !== id);
      changed = true;
    }
    if(!changed) return;
    selectedElementId = null;
    selectedImageElementIds = [];
    schedulePersist();
    renderAll();
  }

  function addSection(){
    const section = {
      id:uniqueId("section"),
      type:"custom",
      name:"Custom section",
      enabled:true,
      background:preset(state.designPreset).surface,
      text:preset(state.designPreset).text,
      accent:preset(state.designPreset).accent,
      elements:[
        {id:uniqueId("el"),type:"text",variant:"eyebrow",text:"CUSTOM SECTION"},
        {id:uniqueId("el"),type:"text",variant:"title",text:"Click to edit this section."},
        {id:uniqueId("el"),type:"text",variant:"copy",text:"Add your own message, image, button or divider."}
      ]
    };
    state.sections.splice(Math.max(0,state.sections.length-1),0,section);
    selectedSectionId = section.id;
    selectedElementId = null;
    schedulePersist();
    renderAll();
  }

  function openView(view){
    currentView = view;
    document.body.classList.toggle("is-design-mode", view === "design");
    $(".wb-mode").forEach(btn => btn.classList.toggle("is-active",btn.dataset.view===view));
    $("#wbDesignView").classList.toggle("is-visible",view==="design");
    $("#wbProductsView").classList.toggle("is-visible",view==="products");
    $("#wbFinishView").classList.toggle("is-visible",view==="finish");
    if(view==="products") renderProducts();
    if(view==="finish") refreshFinalPreview();
  }

  function updateViewControls(){
    $("#wbStageLabel").textContent = currentView==="design" ? "DESIGN / LIVE CANVAS" : currentView.toUpperCase();
    $("#wbZoomValue").textContent = Math.round(canvasZoom*100) + "%";
  }

  async function renderProducts(){
    const list = $("#wbProductList");
    const products = await dbGetAll(PRODUCT_STORE);
    $("#wbProductCount").textContent = products.length + " product" + (products.length===1 ? "" : "s");
    if(!products.length){
      list.innerHTML = '<div class="wb-empty-products"><strong>Your catalog is empty.</strong><span>Add a product to see it in your storefront preview.</span><button type="button" class="wb-mini-button" id="wbEmptyAdd">Add first product</button></div>';
      $("#wbEmptyAdd").addEventListener("click",()=>openProductModal());
      return;
    }
    list.innerHTML = products.map(p => {
      const ratio = p.thumbRatio || "16:9";
      return '<article class="wb-product-card">' +
        (p.imageBlob ? '<img class="wb-product-thumb" style="aspect-ratio:' + escAttr(ratio) + '" data-product-image="' + escAttr(p.id) + '" alt="">' : '<div class="wb-product-thumb" style="aspect-ratio:' + escAttr(ratio) + '"></div>') +
        '<div><h3>' + escText(p.title) + '</h3><p>' + escText(p.description) + '</p><div class="wb-product-meta"><span>' + escText((p.currency || "INR") + " " + (p.price || "0")) + '</span><span>' + (p.zipBlob ? "ZIP ready" : "ZIP missing") + '</span></div><div class="wb-product-card-actions"><button class="wb-mini-button" data-edit-product="' + escAttr(p.id) + '" type="button">Edit</button><button class="wb-mini-button danger" data-delete-product="' + escAttr(p.id) + '" type="button">Delete</button></div></div>' +
      '</article>';
    }).join("");
    for(const p of products){
      const img = $('[data-product-image="' + CSS.escape(p.id) + '"]');
      if(img && p.imageBlob) img.src = URL.createObjectURL(p.imageBlob);
    }
    $$$("[data-edit-product]").forEach(btn => btn.addEventListener("click",async() => openProductModal(await dbGet(PRODUCT_STORE,btn.dataset.editProduct))));
    $$$("[data-delete-product]").forEach(btn => btn.addEventListener("click",async() => {
      if(!confirm("Delete this product from this browser?")) return;
      await dbDelete(PRODUCT_STORE,btn.dataset.deleteProduct);
      toast("Product deleted.");
      await renderProducts();
      renderCanvas();
    }));
  }

  function resetProductModal(){
    $("#wbProductModalTitle").textContent = "Add product";
    $("#wbProductTitle").value = "";
    $("#wbProductPrice").value = "";
    $("#wbProductCurrency").value = "INR";
    $("#wbProductDescription").value = "";
    currentThumbBlob = null;
    currentZipBlob = null;
    currentImagePreviewUrl = null;
    $("#wbProductThumb").value = "";
    $("#wbProductZip").value = "";
    $("#wbThumbFile").textContent = "No image selected";
    $("#wbZipFile").textContent = "No ZIP selected";
    $("#wbThumbPreview").hidden = true;
    $("#wbThumbPreview").removeAttribute("src");
    $("#wbThumbPreviewEmpty").hidden = false;
    setRatio("16:9");
  }

  function openProductModal(product){
    editingProductId = product?.id || null;
    resetProductModal();
    if(product){
      $("#wbProductModalTitle").textContent = "Edit product";
      $("#wbProductTitle").value = product.title || "";
      $("#wbProductPrice").value = product.price || "";
      $("#wbProductCurrency").value = product.currency || "INR";
      $("#wbProductDescription").value = product.description || "";
      currentThumbBlob = product.imageBlob || null;
      currentZipBlob = product.zipBlob || null;
      $("#wbThumbFile").textContent = product.imageName || "Current image";
      $("#wbZipFile").textContent = product.zipName || "Current ZIP";
      setRatio(product.thumbRatio || "16:9");
      if(product.imageBlob) showThumbBlob(product.imageBlob);
    }
    $("#wbProductModal").classList.add("is-open");
    $("#wbProductModal").setAttribute("aria-hidden","false");
    setTimeout(() => $("#wbProductTitle").focus(),30);
  }

  function closeProductModal(){
    $("#wbProductModal").classList.remove("is-open");
    $("#wbProductModal").setAttribute("aria-hidden","true");
    editingProductId = null;
  }

  function setRatio(ratio){
    $$("[data-choice='thumbRatio'] .wb-ratio").forEach(btn => btn.classList.toggle("is-selected",btn.dataset.value===ratio));
    $("#wbThumbPreviewFrame").dataset.ratio = ratio;
  }

  function showThumbBlob(blob){
    if(currentImagePreviewUrl) URL.revokeObjectURL(currentImagePreviewUrl);
    currentImagePreviewUrl = URL.createObjectURL(blob);
    $("#wbThumbPreview").src = currentImagePreviewUrl;
    $("#wbThumbPreview").hidden = false;
    $("#wbThumbPreviewEmpty").hidden = true;
  }

  function handleThumbFile(file){
    if(!file) return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){ toast("Use a PNG, JPG or WebP thumbnail."); return; }
    if(file.size > 10*1024*1024){ toast("Keep thumbnails under 10 MB."); return; }
    currentThumbBlob = file;
    $("#wbThumbFile").textContent = file.name;
    showThumbBlob(file);
    $("#wbThumbDrop").classList.add("has-file");
  }

  function handleZipFile(file){
    if(!file) return;
    if(!file.name.toLowerCase().endsWith(".zip")){ toast("Drop a ZIP file for the digital product."); return; }
    if(file.size > 60*1024*1024){ toast("Keep the product ZIP under 60 MB."); return; }
    currentZipBlob = file;
    $("#wbZipFile").textContent = file.name;
    $("#wbZipDrop").classList.add("has-file");
  }

  async function saveProduct(event){
    event.preventDefault();
    const title = $("#wbProductTitle").value.trim();
    const price = $("#wbProductPrice").value.trim();
    const desc = $("#wbProductDescription").value.trim();
    if(!title || !desc){ toast("Add a title and description first."); return; }
    if(!price || !Number.isFinite(Number(price)) || Number(price)<0){ toast("Add a valid product price."); $("#wbProductPrice").focus(); return; }
    if(!currentThumbBlob){ toast("Add a thumbnail first."); return; }
    if(!currentZipBlob){ toast("Add the product ZIP first."); return; }
    const existing = editingProductId ? await dbGet(PRODUCT_STORE,editingProductId) : null;
    const product = {
      id: editingProductId || uniqueId("product"),
      title,
      description:desc,
      price,
      currency:$("#wbProductCurrency").value,
      imageBlob:currentThumbBlob,
      imageName:currentThumbBlob.name || existing?.imageName || "thumbnail",
      zipBlob:currentZipBlob,
      zipName:currentZipBlob.name || existing?.zipName || "product.zip",
      thumbRatio:$("#wbThumbPreviewFrame").dataset.ratio || "16:9",
      updatedAt:Date.now()
    };
    await dbPut(PRODUCT_STORE,product);
    closeProductModal();
    toast(editingProductId ? "Product updated." : "Product added.");
    await renderProducts();
    renderCanvas();
  }

  function wireDropZone(id,kind){
    const box = $("#"+id);
    box.addEventListener("dragenter",event => {
      event.preventDefault();
      box.classList.add("is-dragging");
    });
    box.addEventListener("dragover",event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      box.classList.add("is-dragging");
    });
    box.addEventListener("dragleave",event => {
      if(event.relatedTarget && box.contains(event.relatedTarget)) return;
      box.classList.remove("is-dragging");
    });
    box.addEventListener("drop",event => {
      event.preventDefault();
      box.classList.remove("is-dragging");
      const file = event.dataTransfer?.files?.[0];
      if(kind==="image") handleThumbFile(file);
      else handleZipFile(file);
    });
  }

  async function refreshFinalPreview(){
    try{
      const html = await buildSiteHtml();
      $("#wbFinalPreview").srcdoc = html;
      const products = await dbGetAll(PRODUCT_STORE);
      $("#wbSummaryName").textContent = state.businessName || "Your store";
      $("#wbSummaryPreset").textContent = preset(state.designPreset).name;
      $("#wbSummaryProducts").textContent = products.length + " product" + (products.length===1 ? "" : "s");
      $("#wbSummaryLayout").textContent = state.productLayout + " layout";
      const legal = [];
      if(state.privacy) legal.push("Privacy");
      if(state.terms) legal.push("Terms");
      if(state.disclaimer) legal.push("Disclaimer");
      if(state.cookiePolicy) legal.push("Cookies");
      $("#wbSummaryLegal").innerHTML = legal.length ? legal.map(x => '<span class="wb-summary-tag">' + escText(x) + '</span>').join("") : '<span class="wb-summary-tag">None selected</span>';
    }catch(error){
      console.error(error);
      toast("Could not generate the preview yet.");
    }
  }

  async function buildSiteHtml(){
    const p = preset(state.designPreset);
    const products = await dbGetAll(PRODUCT_STORE);
    const parts = [];
    for(const sec of state.sections){
      if(!sec.enabled) continue;
      parts.push(await buildSiteSection(sec,p,products));
    }
    const legal = [];
    if(state.privacy) legal.push(["privacy","Privacy Policy"]);
    if(state.terms) legal.push(["terms","Terms & Conditions"]);
    if(state.disclaimer) legal.push(["disclaimer","Disclaimer"]);
    if(state.cookiePolicy) legal.push(["cookies","Cookie Policy"]);
    const legalMarkup = legal.length ? '<section class="legal wrap">' + legal.map(pair => '<div id="' + pair[0] + '"><span class="eyebrow">' + pair[1] + '</span><h3>' + pair[1] + '</h3><p>Starter document for ' + escText(state.businessName || "this store") + '. Review and customize this page for the business, products, payment provider and applicable requirements before publishing.</p></div>').join("") + '</section>' : "";
    const contact = [state.contactEmail,state.contactPhone,state.instagram,state.otherContact].filter(Boolean).map(escText).join(" · ");
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      escText(state.businessName || "My Store") +
      '</title><style>' + generatedCss(p) + '</style></head><body class="preset-' + escAttr(state.designPreset) + '">' +
      '<header class="site-nav wrap"><strong>' + escText(state.businessName || "MY STORE") + '</strong><nav><a href="#products">Shop</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>' +
      '<main>' + parts.join("") + legalMarkup + '</main><footer class="site-footer wrap"><strong>' + escText(state.businessName || "MY STORE") + '</strong><span>' + escText(contact || state.tagline || "Digital products") + '</span></footer>' +
      '</body></html>';
  }

  async function buildSiteSection(sec,p,products){
    let inner = [];
    for(const el of sec.elements) inner.push(await buildGeneratedElement(sec,el));
    if(sec.type === "header"){
      return '<section class="site-section header-section" style="background:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap header-inner">' + inner.join("") + '<nav><a href="#products">Shop</a><a href="#about">About</a><a href="#contact">Contact</a></nav></div></section>';
    }
    if(sec.type === "hero"){
      const heroImage = sec.imageAssetId ? await getImageDataUrlByAsset(sec.imageAssetId) : "";
      return '<section class="site-section hero-section" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap hero-grid"><div>' + inner.join("") + '</div><div>' +
        (heroImage ? '<img class="hero-image" src="' + escAttr(heroImage) + '" alt="">' : '<div class="hero-image placeholder">ADD IMAGE</div>') +
      '</div></div></section>';
    }
    if(sec.type === "catalog"){
      return '<section class="site-section catalog-section" id="products" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap">' + inner.join("") + await generatedCatalog(products,p,sec) + '</div></section>';
    }
    if(sec.type === "about"){
      return '<section class="site-section about-section" id="about" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap narrow">' + inner.join("") + '</div></section>';
    }
    if(sec.type === "cta"){
      return '<section class="site-section cta-section" id="contact" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap narrow">' + inner.join("") + '</div></section>';
    }
    if(sec.type === "footer"){
      return '<section class="site-section footer-section" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap">' + inner.join("") + '</div></section>';
    }
    return '<section class="site-section custom-section" style="background-color:' + escAttr(sec.background) + ';color:' + escAttr(sec.text) + '"><div class="wrap narrow">' + inner.join("") + '</div></section>';
  }

  async function generatedCatalog(products,p,sec){
    if(!products.length) return '<div class="empty-catalog">No products added yet.</div>';
    const cards = [];
    for(const prod of products){
      const imageData = prod.imageBlob ? await blobToDataURL(prod.imageBlob) : "";
      const zipData = prod.zipBlob ? await blobToDataURL(prod.zipBlob) : "";
      cards.push('<article class="site-product-card"><div class="site-product-image" style="aspect-ratio:' + escAttr(prod.thumbRatio || "16:9") + '">' + (imageData ? '<img src="' + imageData + '" alt="' + escAttr(prod.title) + '">' : "") + '</div><div class="site-product-body"><h3>' + escText(prod.title) + '</h3><p>' + escText(prod.description) + '</p><span class="site-price">' + escText((prod.currency || "INR") + " " + (prod.price || "0")) + '</span>' + (zipData ? '<div class="site-actions"><a class="site-button filled" download="' + escAttr(prod.zipName || "product.zip") + '" href="' + zipData + '">Download</a></div>' : "") + '</div></article>');
    }
    return '<div class="site-catalog ' + escAttr(state.productLayout) + '">' + cards.join("") + '</div>';
  }

  async function buildGeneratedElement(sec,el){
    if(el.type === "image"){
      const data = await getImageDataUrlByAsset(el.assetId);
      if(!data) return "";
      const width = el.imageWidth || "100%";
      const fit = el.imageFit || "cover";
      const radius = el.imageRadius || "12px";
      return '<div class="generated-image-wrap"><img style="width:' + escAttr(width) + ';object-fit:' + escAttr(fit) + ';border-radius:' + escAttr(radius) + '" src="' + escAttr(data) + '" alt=""></div>';
    }
    if(el.type === "divider") return '<div class="generated-divider" style="background:' + escAttr(sec.accent) + '"></div>';
    if(el.type === "button"){
      const color = sec.accent;
      const contrast = isLight(color) ? "#171717" : "#f4f2ec";
      return '<div class="site-actions"><a class="site-button ' + (el.variant === "outline" ? "" : "filled") + '" style="--btn:' + escAttr(color) + ';--btntext:' + contrast + '" href="' + escAttr(el.href || "#products") + '">' + escText(el.text || "Button") + '</a></div>';
    }
    const tag = el.variant === "heading" ? "h1" : el.variant === "title" ? "h2" : el.variant === "copy" ? "p" : el.variant === "eyebrow" ? "div" : "strong";
    const cls = el.variant || "copy";
    const style = (el.fontFamily ? 'font-family:' + escAttr(el.fontFamily) + ';' : '') +
      (el.fontSize ? 'font-size:' + escAttr(el.fontSize) + 'px;' : '') +
      (el.fontWeight ? 'font-weight:' + escAttr(el.fontWeight) + ';' : '') +
      (el.textAlign ? 'text-align:' + escAttr(el.textAlign) + ';' : '') +
      (el.color ? 'color:' + escAttr(el.color) + ';' : '');
    return '<' + tag + ' class="generated-' + cls + '" style="' + style + '">' + escText(el.text || "") + '</' + tag + '>';
  }

  function generatedCss(p){
    return ':root{--bg:' + p.background + ';--surface:' + p.surface + ';--text:' + p.text + ';--muted:' + p.muted + ';--accent:' + p.accent + '}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.site-nav{height:72px;border-bottom:1px solid rgba(127,127,127,.22);display:flex;align-items:center;justify-content:space-between}.site-nav strong{font-size:18px;letter-spacing:-.06em}.site-nav nav{display:flex;gap:18px}.site-nav a{color:var(--muted);font-size:11px;text-decoration:none}.site-section{padding:86px 0;border-bottom:1px solid rgba(127,127,127,.18)}.header-section{padding:0}.header-inner{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:22px}.header-inner nav{display:flex;gap:18px}.header-inner a{color:inherit;text-decoration:none;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em;opacity:.72}.hero-grid{display:grid;grid-template-columns:1.18fr .82fr;gap:50px;align-items:center}.hero-section{min-height:520px}.generated-eyebrow{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;opacity:.6}.generated-heading{max-width:760px;margin:12px 0 18px;font-size:clamp(58px,9vw,116px);line-height:.82;letter-spacing:-.09em}.generated-title{margin:0 0 12px;font-size:clamp(38px,5vw,62px);line-height:.9;letter-spacing:-.075em}.generated-copy{max-width:680px;color:var(--muted);font-size:13px;line-height:1.75}.hero-image,.placeholder{display:block;width:100%;min-height:320px;border-radius:14px;border:1px solid rgba(127,127,127,.25);object-fit:cover;background:rgba(0,0,0,.08)}.placeholder{display:grid;place-items:center;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;color:var(--accent)}.narrow{max-width:800px}.site-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.site-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:9px;border:1px solid var(--btn,var(--accent));color:var(--btn,var(--accent));text-decoration:none;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.site-button.filled{background:var(--btn,var(--accent));color:var(--btntext,var(--bg))}.generated-divider{height:1px;margin:24px 0;opacity:.2}.generated-image-wrap{margin:22px 0}.generated-image-wrap img{display:block;max-width:100%;max-height:480px;border-radius:12px}.about-section{min-height:300px}.catalog-section{padding-bottom:100px}.site-catalog{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:28px}.site-catalog.list{grid-template-columns:1fr}.site-catalog.featured{grid-template-columns:1.3fr .7fr}.site-product-card{border:1px solid rgba(127,127,127,.2);border-radius:12px;overflow:hidden;background:var(--surface)}.site-product-image{background:rgba(0,0,0,.08);overflow:hidden}.site-product-image img{display:block;width:100%;height:100%;object-fit:cover}.site-product-body{padding:17px}.site-product-body h3{margin:0;font-size:18px;letter-spacing:-.04em}.site-product-body p{color:var(--muted);font-size:11px;line-height:1.65;min-height:48px}.site-price{display:block;color:var(--muted);font:10px ui-monospace,SFMono-Regular,Menlo,monospace}.cta-section{min-height:300px}.footer-section{padding:50px 0}.footer-section .generated-brand{font-size:18px}.site-footer{display:flex;justify-content:space-between;gap:20px;padding:25px 0 45px;color:var(--muted);font-size:10px}.legal{padding:50px 0}.legal>div{padding:25px 0;border-top:1px solid rgba(127,127,127,.18)}.legal h3{margin:8px 0;font-size:24px}.legal p{max-width:760px;color:var(--muted);font-size:11px;line-height:1.7}.empty-catalog{padding:60px 20px;text-align:center;color:var(--muted);border:1px dashed rgba(127,127,127,.25)}body.preset-starfield{background-color:var(--bg);background-image:radial-gradient(circle at 15% 20%,rgba(255,255,255,.16) 0 1px,transparent 1.7px),radial-gradient(circle at 80% 10%,rgba(255,255,255,.12) 0 1px,transparent 1.6px),radial-gradient(circle at 45% 65%,rgba(255,255,255,.09) 0 1px,transparent 1.7px),radial-gradient(circle at 70% 84%,rgba(255,255,255,.08) 0 1px,transparent 1.6px);background-size:180px 180px,250px 250px,310px 310px,220px 220px}body.preset-midnight{background-color:var(--bg);background-image:linear-gradient(rgba(130,160,210,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(130,160,210,.05) 1px,transparent 1px);background-size:32px 32px}body.preset-editorial{background:#eee7db}body.preset-soft-grid{background-color:#f6f6f4;background-image:linear-gradient(rgba(15,15,15,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(15,15,15,.045) 1px,transparent 1px);background-size:34px 34px}.site-section{background-image:inherit;background-size:inherit}.site-product-image{overflow:hidden}@media(max-width:760px){.hero-grid{grid-template-columns:1fr}.site-catalog,.site-catalog.featured{grid-template-columns:1fr}.header-inner nav{display:none}.site-footer{flex-direction:column}}';
  }

  async function getImageDataUrlByAsset(id){
    const asset = await dbGet(ASSET_STORE,id);
    return asset?.blob ? blobToDataURL(asset.blob) : "";
  }

  function blobToDataURL(blob){
    return new Promise((resolve,reject) => {
      if(!blob) return resolve("");
      if(typeof blob === "string") return resolve(blob);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function downloadSite(){
    try{
      const html = await buildSiteHtml();
      const url = URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
      const a = document.createElement("a");
      const slug = (state.businessName || "dewify-store").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "dewify-store";
      a.href = url;
      a.download = slug + "-website.html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url),30000);
      toast("Website downloaded as a standalone HTML file.");
    }catch(error){
      console.error(error);
      toast("Could not download the website.");
    }
  }

  function openSettings(){
    $("#wbBusinessName").value = state.businessName || "";
    $("#wbOwnerName").value = state.ownerName || "";
    $("#wbBusinessCategory").value = state.businessCategory || "digital-products";
    $("#wbTagline").value = state.tagline || "";
    $("#wbContactEmail").value = state.contactEmail || "";
    $("#wbContactPhone").value = state.contactPhone || "";
    $("#wbInstagram").value = state.instagram || "";
    $("#wbOtherContact").value = state.otherContact || "";
    $("#wbPrivacy").checked = !!state.privacy;
    $("#wbTerms").checked = !!state.terms;
    $("#wbDisclaimer").checked = !!state.disclaimer;
    $("#wbCookiePolicy").checked = !!state.cookiePolicy;
    $("#wbSettingsModal").classList.add("is-open");
    $("#wbSettingsModal").setAttribute("aria-hidden","false");
  }

  function closeSettings(){
    $("#wbSettingsModal").classList.remove("is-open");
    $("#wbSettingsModal").setAttribute("aria-hidden","true");
  }

  function saveSettings(event){
    event.preventDefault();
    const name = $("#wbBusinessName").value.trim();
    if(!name){ toast("Add your business or store name first."); return; }
    state.businessName = name;
    state.ownerName = $("#wbOwnerName").value.trim();
    state.businessCategory = $("#wbBusinessCategory").value;
    state.tagline = $("#wbTagline").value.trim();
    state.contactEmail = $("#wbContactEmail").value.trim();
    state.contactPhone = $("#wbContactPhone").value.trim();
    state.instagram = $("#wbInstagram").value.trim();
    state.otherContact = $("#wbOtherContact").value.trim();
    state.privacy = $("#wbPrivacy").checked;
    state.terms = $("#wbTerms").checked;
    state.disclaimer = $("#wbDisclaimer").checked;
    state.cookiePolicy = $("#wbCookiePolicy").checked;
    const header = sectionById("header");
    const hero = sectionById("hero");
    if(header){
      const brand = header.elements.find(e => e.variant === "brand");
      if(brand) brand.text = state.businessName;
    }
    if(hero){
      const title = hero.elements.find(e => e.variant === "heading");
      const copy = hero.elements.find(e => e.variant === "copy");
      if(title && !title.text.trim()) title.text = state.businessName + ".";
      if(copy && state.tagline) copy.text = state.tagline;
    }
    persistState(false);
    closeSettings();
    renderAll();
    toast("Store settings saved.");
  }

  function escText(value){
    return String(value == null ? "" : value).replace(/[&<>'"]/g,c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
    }[c]));
  }

  function escAttr(value){
    return escText(value);
  }

  function isLight(hex){
    const value = String(hex || "").replace("#","");
    if(value.length !== 6) return false;
    const r = parseInt(value.slice(0,2),16);
    const g = parseInt(value.slice(2,4),16);
    const b = parseInt(value.slice(4,6),16);
    return (0.299*r + 0.587*g + 0.114*b) > 180;
  }

  $("#wbSettingsBtn").addEventListener("click",openSettings);
  $("#wbSettingsForm").addEventListener("submit",saveSettings);
  $$$("[data-close-settings]").forEach(el => el.addEventListener("click",closeSettings));

  $$(".wb-mode").forEach(btn => btn.addEventListener("click",() => openView(btn.dataset.view)));
  $("#wbBackDesign").addEventListener("click",() => openView("design"));
  $("#wbEditDesign").addEventListener("click",() => openView("design"));
  $("#wbEditProducts").addEventListener("click",() => openView("products"));
  $("#wbOpenPreview").addEventListener("click",() => openView("finish"));
  $("#wbRefreshFinalPreview").addEventListener("click",refreshFinalPreview);
  $("#wbDownloadSite").addEventListener("click",downloadSite);
  $("#wbZoomIn").addEventListener("click",() => { canvasZoom=Math.min(1.1,canvasZoom+0.1); updateViewControls(); renderCanvas(); });
  $("#wbZoomOut").addEventListener("click",() => { canvasZoom=Math.max(0.5,canvasZoom-0.1); updateViewControls(); renderCanvas(); });
  $("#wbAddSectionBtn").addEventListener("click",addSection);
  $("#wbAddProduct").addEventListener("click",() => openProductModal());
  $("#wbProductForm").addEventListener("submit",saveProduct);

  $$$("[data-close-product]").forEach(el => el.addEventListener("click",closeProductModal));
  $$$("[data-add-element]").forEach(btn => btn.addEventListener("click",() => addElement(btn.dataset.addElement)));

  $("#wbElementImageInput").addEventListener("change",async() => {
    const files = Array.from($("#wbElementImageInput").files || []);
    $("#wbElementImageInput").value = "";
    if(!files.length) return;
    if(pendingImageTargetId && files.length === 1){
      await addImageAssetToSection(files[0],selectedSectionId,pendingImageTargetId);
    }else{
      for(const file of files) await addImageAssetToSection(file,selectedSectionId,null);
    }
    pendingImageTargetId = null;
    await renderMediaLibrary();
  });

  $$("[data-choice='thumbRatio'] .wb-ratio").forEach(btn => btn.addEventListener("click",() => setRatio(btn.dataset.value)));
  $$(".wb-layout-choices .wb-choice").forEach(btn => btn.addEventListener("click",() => {
    state.productLayout = btn.dataset.value;
    schedulePersist();
    $$(".wb-layout-choices .wb-choice").forEach(x => x.classList.toggle("is-selected",x===btn));
    renderCanvas();
  }));

  $("#wbMediaInput").addEventListener("change",async() => {
    const files = Array.from($("#wbMediaInput").files || []);
    $("#wbMediaInput").value = "";
    await uploadMediaFiles(files);
  });
  $("#wbUploadMediaBtn").addEventListener("click",() => $("#wbMediaInput").click());
  $("#wbAddSelectedMedia").addEventListener("click",addSelectedMediaToSection);

  $("#wbProductThumb").addEventListener("change",() => handleThumbFile($("#wbProductThumb").files[0]));
  $("#wbProductZip").addEventListener("change",() => handleZipFile($("#wbProductZip").files[0]));
  wireDropZone("wbThumbDrop","image");
  wireDropZone("wbZipDrop","zip");

  $("#wbCanvasViewport").addEventListener("dragover",event => {
    if(!event.dataTransfer) return;
    const files = Array.from(event.dataTransfer.files || []);
    if(files.some(f => f.type.startsWith("image/"))) event.preventDefault();
  });
  $("#wbCanvasViewport").addEventListener("drop",async event => {
    const file = Array.from(event.dataTransfer?.files || []).find(f => f.type.startsWith("image/"));
    if(!file) return;
    event.preventDefault();
    await addImageAssetToSection(file,selectedSectionId,null);
    toast("Image added to the selected section.");
  });

  $("#wbProductModal").addEventListener("dragover",event => {
    if(event.dataTransfer?.files?.length) event.preventDefault();
  });

  document.addEventListener("keydown",event => {
    if(event.key === "Escape"){
      closeSettings();
      closeProductModal();
    }
  });

  async function init(){
    loadState();
    await openDb();
    await migrateLegacyProducts();
    if(!sectionById(selectedSectionId)) selectedSectionId = state.sections[0]?.id || "hero";
    document.body.classList.add("is-design-mode");
    renderAll();
    await renderMediaLibrary();
    updateViewControls();
  }

  init().catch(error => {
    console.error(error);
    toast("The website builder could not initialize.");
  });
})();
