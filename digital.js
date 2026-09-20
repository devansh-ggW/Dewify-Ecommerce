(() => {
  "use strict";
  const cfg=window.DEWIFY_CONFIG||{}, product=(cfg.products||[]).find(p=>p.id==="devcore"), $=s=>document.querySelector(s);
  const token=String(cfg.PADDLE_CLIENT_TOKEN||"").trim(), priceId=String(product?.priceId||"").trim();
  if(product) $("#productPrice").textContent=product.displayPrice||"View price at checkout";
  const setStatus=m=>{const e=$("#checkoutStatus");if(e)e.textContent=m};
  const close=()=>{const m=$("#successModal");m.classList.remove("is-open");m.setAttribute("aria-hidden","true");document.body.classList.remove("locked")};
  if(window.Paddle&&token&&priceId){
    try{
      if(String(cfg.PADDLE_ENVIRONMENT||"production").toLowerCase()==="sandbox")Paddle.Environment.set("sandbox");
      Paddle.Initialize({token,eventCallback:e=>{if(e?.name==="checkout.completed"){$("#successTransaction").textContent=e.data?.transaction_id||"Completed";const m=$("#successModal");m.classList.add("is-open");m.setAttribute("aria-hidden","false");document.body.classList.add("locked")}}});
      setStatus("Paddle checkout is ready.");
    }catch(err){console.error(err);setStatus("Paddle could not be initialized.")}
  }else setStatus("Checkout setup is pending. Add the Paddle client token and price ID to config.js.");
  $("#buyButton")?.addEventListener("click",()=>{if(!window.Paddle||!token||!priceId){setStatus("Paddle checkout is not connected yet.");return}Paddle.Checkout.open({items:[{priceId,quantity:1}],settings:{displayMode:"overlay",theme:"dark",locale:"en"}})});
  $("#closeSuccess")?.addEventListener("click",close);$("#successModal .scrim")?.addEventListener("click",close);window.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
})();