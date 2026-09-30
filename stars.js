(()=>{"use strict";const c=document.getElementById("starfield");if(!c)return;const x=c.getContext("2d",{alpha:true});if(!x)return;const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;let w=0,h=0,dpr=1,last=0,raf=0,hidden=false;const stars=[],bursts=[];const pointer={x:0,y:0,on:false};function resize(){dpr=Math.min(window.devicePixelRatio||1,1.25);w=innerWidth;h=innerHeight;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);c.style.width=w+"px";c.style.height=h+"px";x.setTransform(dpr,0,0,dpr,0,0);stars.length=0;const count=w<700?120:210;for(let i=0;i<count;i++)stars.push({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.05,a:.52+Math.random()*.42,t:Math.random()*6.28,s:.012+Math.random()*.045});}function move(px,py){pointer.x=px;pointer.y=py;pointer.on=true}addEventListener("mousemove",e=>move(e.clientX,e.clientY),{passive:true});addEventListener("mouseleave",()=>pointer.on=false,{passive:true});addEventListener("touchstart",e=>{const p=e.touches&&e.touches[0];if(!p)return;move(p.clientX,p.clientY);bursts.push({x:p.clientX,y:p.clientY,life:1})},{passive:true});addEventListener("touchmove",e=>{const p=e.touches&&e.touches[0];if(p)move(p.clientX,p.clientY)},{passive:true});addEventListener("touchend",()=>pointer.on=false,{passive:true});addEventListener("click",e=>bursts.push({x:e.clientX,y:e.clientY,life:1}),{passive:true});function draw(t){if(hidden)return;const dt=Math.min(50,Math.max(12,t-(last||t-24)));if(t-last<24){raf=requestAnimationFrame(draw);return}last=t;x.clearRect(0,0,w,h);for(const s of stars){s.x-=dt*s.s;if(s.x<-2)s.x=w+2;let px=s.x,py=s.y;if(pointer.on){const dx=px-pointer.x,dy=py-pointer.y,dist=Math.hypot(dx,dy)||1;if(dist<125){const f=(1-dist/125)*10;px+=dx/dist*f;py+=dy/dist*f;}}x.globalAlpha=Math.min(1,s.a*(.9+.1*Math.sin(t*.001+s.t)));x.fillStyle=Math.sin(s.t)>2?"#f6d887":"#fbf2d3";x.beginPath();x.arc(px,py,s.r,0,6.283);x.fill();}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.life-=dt*.0026;if(b.life<=0){bursts.splice(i,1);continue}x.globalAlpha=b.life*.28;x.strokeStyle="#fff4cf";x.lineWidth=1;x.beginPath();x.arc(b.x,b.y,(1-b.life)*65,0,6.283);x.stroke();}x.globalAlpha=1;raf=requestAnimationFrame(draw)}function tick(){cancelAnimationFrame(raf);if(reduce||hidden){draw(performance.now());return}raf=requestAnimationFrame(draw)}document.addEventListener("visibilitychange",()=>{hidden=document.hidden;if(!hidden){last=0;tick()}});addEventListener("resize",resize,{passive:true});resize();tick()})();

/* DEWIFY Creator Series previews */
(()=>{"use strict";
  const ready=()=>{
    const bodyText=document.body?.textContent||"";
    if(!/CREATOR\s+(CRATE|VAULT|BUNDLE|STASH|ARSENAL)/i.test(bodyText)||document.getElementById("creatorSeriesPreview"))return;

    const style=document.createElement("style");
    style.textContent=`
      #creatorSeriesPreview{margin-top:42px}
      #creatorSeriesPreview .csp-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px}
      #creatorSeriesPreview .csp-head h2{margin:0 0 5px;font-size:25px;letter-spacing:-.05em}
      #creatorSeriesPreview .csp-note{margin:0;max-width:390px;color:var(--muted);font-size:11px;line-height:1.7}
      #creatorSeriesPreview .csp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      #creatorSeriesPreview .csp-card{appearance:none;border:1px solid var(--line-strong);background:#0b0b0b;color:inherit;padding:0;text-align:left;cursor:zoom-in;overflow:hidden}
      #creatorSeriesPreview .csp-card:hover{border-color:rgba(244,242,236,.38)}
      #creatorSeriesPreview .csp-art{display:block;aspect-ratio:2/3;overflow:hidden;background:#111}
      #creatorSeriesPreview .csp-art img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none;-webkit-user-drag:none}
      #creatorSeriesPreview .csp-label{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-top:1px solid var(--line);font:8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
      #cspModal{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.9)}
      #cspModal.open{display:flex}
      #cspModal .csp-modal-inner{width:min(780px,100%);max-height:94vh;display:flex;flex-direction:column;gap:12px;align-items:center}
      #cspModal img{display:block;max-width:100%;max-height:84vh;width:auto;height:auto;object-fit:contain;border:1px solid var(--line-strong);box-shadow:0 30px 90px rgba(0,0,0,.6)}
      #cspModal .csp-modal-bar{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px}
      #cspModal .csp-modal-bar span{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--text)}
      #cspModal button{border:1px solid var(--line);background:#0c0c0c;color:var(--text);padding:9px 12px;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
      @media(max-width:620px){#creatorSeriesPreview .csp-head{align-items:start;flex-direction:column}#creatorSeriesPreview .csp-grid{grid-template-columns:1fr}#cspModal{padding:10px}#cspModal img{max-height:79vh}}
    `;
    document.head.appendChild(style);

    const section=document.createElement("section");
    section.className="vault-section";
    section.id="creatorSeriesPreview";
    section.innerHTML=`
      <div class="csp-head">
        <div><p class="eyebrow">PREVIEW / INCLUDED DESIGN TEMPLATES</p><h2>See what’s inside</h2></div>
        <p class="csp-note">Preview two sample designs from the Creator Series before buying. The previews are view-only and do not unlock the product download.</p>
      </div>
      <div class="csp-grid">
        <button class="csp-card" type="button" data-csp-src="assets/creator-preview-restaurant-menu.svg" data-csp-label="Restaurant Menu">
          <span class="csp-art"><img src="assets/creator-preview-restaurant-menu.svg" alt="Restaurant Menu preview" loading="lazy" draggable="false"></span>
          <span class="csp-label"><span>01 / Restaurant Menu</span><span>Open ↗</span></span>
        </button>
        <button class="csp-card" type="button" data-csp-src="assets/creator-preview-wedding-invitation.svg" data-csp-label="Wedding Invitation">
          <span class="csp-art"><img src="assets/creator-preview-wedding-invitation.svg" alt="Wedding Invitation preview" loading="lazy" draggable="false"></span>
          <span class="csp-label"><span>02 / Wedding Invitation</span><span>Open ↗</span></span>
        </button>
      </div>
    `;
    const target=document.querySelector(".vault-main");
    const firstSection=target?.querySelector(".vault-section");
    if(firstSection) target.insertBefore(section,firstSection);
    else if(target) target.appendChild(section);

    const modal=document.createElement("div");
    modal.id="cspModal";
    modal.setAttribute("aria-hidden","true");
    modal.innerHTML=`
      <div class="csp-modal-inner">
        <div class="csp-modal-bar"><span id="cspModalLabel">PREVIEW</span><button type="button" id="cspClose">Close ×</button></div>
        <img id="cspModalImage" alt="">
      </div>
    `;
    document.body.appendChild(modal);

    const image=modal.querySelector("#cspModalImage");
    const label=modal.querySelector("#cspModalLabel");
    const close=()=>{
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
      image.removeAttribute("src");
      document.body.classList.remove("locked");
    };
    section.querySelectorAll("[data-csp-src]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        image.src=btn.dataset.cspSrc;
        image.alt=btn.dataset.cspLabel+" preview";
        label.textContent="PREVIEW / "+btn.dataset.cspLabel.toUpperCase();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden","false");
        document.body.classList.add("locked");
      });
    });
    modal.querySelector("#cspClose").addEventListener("click",close);
    modal.addEventListener("click",e=>{if(e.target===modal)close()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("open"))close()},{passive:true});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();
