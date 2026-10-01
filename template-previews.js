(() => {
  "use strict";

  const previews = [
    { name: "AURORA HOUSE", eyebrow: "01 / HOSPITALITY", description: "Editorial luxury hospitality concept with immersive rooms, journal and contact pages.", url: "template-previews/01-aurora-house/index.html" },
    { name: "SOLSTICE", eyebrow: "02 / RETREAT", description: "Warm, minimal retreat concept with experiences, spaces and reservation pages.", url: "template-previews/03-solstice/index.html" },
    { name: "ORBITAL / LAB", eyebrow: "03 / CREATIVE TECHNOLOGY", description: "Dark creative-technology studio concept with work, thinking and signal pages.", url: "template-previews/04-orbital/index.html" }
  ];

  const productPages = new Set([
    "creator-crate-100.html", "creator-vault-300.html", "creator-bundle-500.html", "creator-stash-700.html", "creator-arsenal-1000.html",
    "webble-100.html", "webble-300.html", "webble-500.html", "webble-700.html"
  ]);

  function addStyles() {
    if (document.getElementById("dewify-template-preview-styles")) return;
    const style = document.createElement("style");
    style.id = "dewify-template-preview-styles";
    style.textContent = `
      .dewify-template-previews{position:relative;z-index:2;width:min(1300px,calc(100% - 10vw));margin:30px auto 110px}
      .dewify-template-preview-head{display:flex;align-items:end;justify-content:space-between;gap:30px;padding-bottom:22px;border-bottom:1px solid var(--line)}
      .dewify-template-preview-kicker{margin:0 0 9px;color:var(--dim);font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}
      .dewify-template-preview-head h2{margin:0;font-size:clamp(30px,4vw,52px);line-height:.95;letter-spacing:-.055em}
      .dewify-template-preview-head p{max-width:420px;margin:0;color:var(--muted);font-size:12px;line-height:1.7}
      .dewify-template-preview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
      .dewify-template-preview-card{min-width:0;border:1px solid var(--line);background:rgba(12,12,12,.78);overflow:hidden;transition:border-color .2s ease,transform .2s ease,background .2s ease}
      .dewify-template-preview-card:hover{border-color:rgba(255,255,255,.3);background:#101010;transform:translateY(-2px)}
      .dewify-template-preview-frame{position:relative;aspect-ratio:16/10;background:#080808;border-bottom:1px solid var(--line);overflow:hidden}
      .dewify-template-preview-frame iframe{display:block;width:100%;height:100%;border:0;background:#080808}
      .dewify-template-preview-open{position:absolute;right:12px;bottom:12px;display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid rgba(255,255,255,.22);background:rgba(5,5,5,.88);color:#fff;text-decoration:none;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
      .dewify-template-preview-open:hover{border-color:rgba(255,255,255,.6);background:#111}
      .dewify-template-preview-copy{padding:16px}.dewify-template-preview-meta{display:flex;justify-content:space-between;gap:12px;color:var(--dim);font:8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase}
      .dewify-template-preview-copy h3{margin:9px 0 7px;font-size:19px;letter-spacing:-.035em}.dewify-template-preview-copy p{margin:0;color:var(--muted);font-size:11px;line-height:1.65}
      @media(max-width:980px){.dewify-template-preview-grid{grid-template-columns:1fr}.dewify-template-preview-frame{aspect-ratio:16/9}}
      @media(max-width:620px){.dewify-template-previews{width:min(calc(100% - 28px),1300px);margin-bottom:70px}.dewify-template-preview-head{align-items:start;flex-direction:column;gap:12px}.dewify-template-preview-copy h3{font-size:18px}}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!productPages.has(file) || document.querySelector(".dewify-template-previews")) return;
    const main = document.querySelector("main");
    if (!main) return;
    addStyles();
    const section = document.createElement("section");
    section.className = "dewify-template-previews";
    section.setAttribute("aria-labelledby", "dewify-template-preview-title");
    section.innerHTML = `<div class="dewify-template-preview-head"><div><p class="dewify-template-preview-kicker">DEWIFY / LIVE TEMPLATE PREVIEWS</p><h2 id="dewify-template-preview-title">See the websites<br>before you buy.</h2></div><p>Three fully working multi-page examples are included as live previews across the Creator and Webble series. Open any preview to browse the complete site in a new tab.</p></div><div class="dewify-template-preview-grid">${previews.map(item => `<article class="dewify-template-preview-card"><div class="dewify-template-preview-frame"><iframe src="${item.url}" title="${item.name} template preview" loading="lazy" referrerpolicy="no-referrer" allow="fullscreen"></iframe><a class="dewify-template-preview-open" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${item.name} full website preview">Open preview ↗</a></div><div class="dewify-template-preview-copy"><div class="dewify-template-preview-meta"><span>${item.eyebrow}</span><span>LIVE</span></div><h3>${item.name}</h3><p>${item.description}</p></div></article>`).join("")}</div>`;
    main.appendChild(section);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})();