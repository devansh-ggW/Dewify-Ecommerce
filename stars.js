/* DEWIFY runtime helpers */
(function(){
  "use strict";

  /* Keep catalog cards strictly separated: image area can never overlap
     the product description, price, or Amazon button. */
  const style=document.createElement("style");
  style.textContent=`
    .product-card{display:grid!important;grid-template-rows:auto auto auto!important;align-items:stretch!important;overflow:hidden!important}
    .product-card>a:first-child{display:grid!important;grid-template-rows:240px auto!important;min-height:0!important;overflow:hidden!important}
    .product-image{position:relative!important;height:240px!important;min-height:240px!important;max-height:240px!important;overflow:hidden!important;box-sizing:border-box!important;isolation:isolate!important;z-index:1!important}
    .product-image img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;min-width:0!important;min-height:0!important;object-fit:contain!important;object-position:center!important}
    .spec-panel{z-index:2!important}
    .product-body{position:relative!important;z-index:3!important;display:block!important;min-width:0!important;height:auto!important;overflow:visible!important;background:#0b0b0b!important;padding:18px!important}
    .product-description{position:relative!important;z-index:4!important;height:auto!important;min-height:54px!important;overflow:visible!important}
    .product-bottom{position:relative!important;z-index:4!important}
    .product-price,.product-open{position:relative!important;z-index:5!important}
    .amazon-btn{position:relative!important;z-index:5!important;flex:none!important}
    @media(max-width:560px){
      .product-card>a:first-child{grid-template-rows:210px auto!important}
      .product-image{height:210px!important;min-height:210px!important;max-height:210px!important}
      .product-body{padding:15px!important}
      .product-description{min-height:0!important}
    }
    @media(max-width:380px){
      .product-card>a:first-child{grid-template-rows:190px auto!important}
      .product-image{height:190px!important;min-height:190px!important;max-height:190px!important}
    }
  `;
  document.head.appendChild(style);

  /* Product-image safety net: a failed remote image is hidden rather than
     rendering a broken-image icon over the card content. */
  document.querySelectorAll(".product-image img").forEach(img=>{
    img.addEventListener("error",()=>{img.style.visibility="hidden";},{once:true});
  });

  const canvas=document.getElementById("starfield");
  if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;

  let w=0,h=0,dpr=1,raf=0,last=0,scrollY=0;
  const stars=[];
  const pointer={x:-9999,y:-9999,active:false};
  const bursts=[];
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,1.25);
    w=window.innerWidth;h=window.innerHeight;
    canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
    canvas.style.width="100vw";canvas.style.height="100vh";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars.length=0;
    const count=w<700?320:520;
    const world=Math.max(h,document.documentElement.scrollHeight||h);
    for(let i=0;i<count;i++)stars.push({x:Math.random()*w,y:Math.random()*world,r:.45+Math.random()*.9,a:.35+Math.random()*.55,g:Math.random()<.72,t:Math.random()*6.28});
  }
  function pointerMove(x,y){pointer.x=x;pointer.y=y;pointer.active=true}
  window.addEventListener("mousemove",e=>pointerMove(e.clientX,e.clientY),{passive:true});
  window.addEventListener("mouseleave",()=>{pointer.active=false;},{passive:true});
  window.addEventListener("touchstart",e=>{
    const p=e.touches&&e.touches[0];
    if(p){pointerMove(p.clientX,p.clientY);bursts.push({x:p.clientX,y:p.clientY,life:1});}
  },{passive:true});
  window.addEventListener("touchmove",e=>{
    const p=e.touches&&e.touches[0];
    if(p)pointerMove(p.clientX,p.clientY);
  },{passive:true});
  window.addEventListener("touchend",()=>{pointer.active=false;},{passive:true});
  window.addEventListener("click",e=>{
    bursts.push({x:e.clientX,y:e.clientY,life:1});
  },{passive:true});
  function draw(t){
    const dt=Math.min(40,Math.max(1,t-last||16));last=t;
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      s.x-=dt*.004;
      if(s.x<-3)s.x=w+3;
      let x=s.x,y=s.y-scrollY;
      if(pointer.active){
        const dx=x-pointer.x,dy=y-pointer.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
        const radius=150;
        if(dist<radius){
          const force=(1-dist/radius)*15;
          x+=(dx/dist)*force;
          y+=(dy/dist)*force;
        }
      }
      if(y<-3||y>h+3)continue;
      ctx.globalAlpha=s.a*(.9+.1*Math.sin(t*.001+s.t));
      ctx.fillStyle=s.g?"#f6d887":"#fbf2d3";
      ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();
    }
    for(let i=bursts.length-1;i>=0;i--){
      const b=bursts[i];
      b.life-=dt*.0022;
      if(b.life<=0){bursts.splice(i,1);continue;}
      const radius=(1-b.life)*75;
      ctx.globalAlpha=b.life*.3;
      ctx.strokeStyle="#fff4cf";
      ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(b.x,b.y,radius,0,Math.PI*2);ctx.stroke();
    }
    ctx.globalAlpha=1;
    raf=requestAnimationFrame(draw);
  }
  window.addEventListener("resize",resize,{passive:true});
  window.addEventListener("scroll",()=>{scrollY=window.scrollY||0;},{passive:true});
  resize();
  raf=requestAnimationFrame(draw);
})();