/* DEWIFY — lightweight storefront
   Single bundle: catalog, cart, product detail, order form and starfield.
*/
(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const API_URL = String(cfg.GOOGLE_APPS_SCRIPT_URL || "");
  const SUPPORT_WA = String(cfg.WHATSAPP_NUMBER || "919422843899").replace(/\D/g, "");
  const CART_KEY = "dewify-cart-v3";
  const CATALOG_PAUSED = true;

  const DEFAULT_PRODUCTS = [
    {id:"dw-storage-vault",name:"FoldAway Storage Vault",category:"Home",categoryLabel:"Home & Daily",price:799,badge:"SMART PICK",sku:"CJYD237778201AZ",sourceUrl:"https://cjdropshipping.com/product/foldable-clothes-storage-bag-large-capacity-organizer-with-handle-and-double-zipper-for-bedding-moving-travel-under-bed-storage-p-2505160457141629100.html",images:["https://maqsood.me/cdn/shop/files/Product_Content_77.jpg?v=1785268495","https://i.ebayimg.com/images/g/VYkAAeSwPQ9o70Sj/s-l1600.jpg","https://i5.walmartimages.com/asr/a768a3be-cfa1-4543-be3b-d4bd41afa22b.ea5dadef1a02b6a0039473215a545f99.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768"],description:"A foldable, large-capacity organizer for clothes, bedding, seasonal items, moving and travel.",highlights:["Large-capacity storage","Double-zipper opening","Reinforced carry handle","Folds away when empty"]},
    {id:"dw-witchlight",name:"Witchlight Gothic Hat Lamp",category:"Home",categoryLabel:"Home & Daily",price:1499,badge:"LIMITED",sku:"CJYD296761901AZ",sourceUrl:"https://cjdropshipping.com/product/witch-hat-lamps-creative-home-gothic-night-light-gift-witch-hat-light-ornament-halloween-home-ornament-decoration-p-2607040852081633100.html",images:["https://oss-cf.cjdropshipping.com/product/2026/07/04/08/08fcf3b3-a6bf-4e84-b942-996b9b5d9f5d.jpeg","https://media.adeo.com/mkp/0ba7d37825817478bfa35ebd0ee2e46a/media.jpeg?fit=bounds&format=jpg&height=650&quality=80&width=650"],description:"A character-filled decorative lamp for shelves, bedside tables and gothic-inspired rooms.",highlights:["Statement décor piece","USB powered listing","Three style variants","Themed-room friendly"]},
    {id:"dw-heatcore-jacket",name:"HeatCore USB Heated Jacket",category:"Wear",categoryLabel:"Wear",price:2499,badge:"WINTER",sku:"CJYR158132801AZ",sourceUrl:"https://cjdropshipping.com/product/winter-heated-jacket-usb-electric-cotton-coat-zip-up-heater-thermal-clothing-heating-vest-for-men-p-1578267399776907264.html",images:["https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg","https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg"],description:"A USB-powered heated jacket designed for cold commutes, travel and outdoor days.",highlights:["3 temperature settings","Carbon-fiber heating elements","Removable hood listing","S–6XL size range listing"]},
    {id:"dw-moonglow-pendant",name:"MoonGlow Luminous Pendant",category:"Wear",categoryLabel:"Wear",price:699,badge:"GLOW",sku:"CJZBLXLX00017-purple",sourceUrl:"https://cjdropshipping.com/product/fashion-moon-natural-glowing-stone-healing-necklace-women-gift-charm-luminous-pendant-necklace-jewelry-p-F0403505-748E-4F3C-A9BB-70E390109230.html",images:["https://cf.cjdropshipping.com/16367616/1636808394162.jpg","https://liorvane.com/cdn/shop/files/545876677731.jpg"],description:"A luminous moon pendant designed to glow after exposure to light.",highlights:["Luminous stone pendant","Celestial-inspired design","Multiple colour options","Lightweight everyday accessory"]},
    {id:"dw-fruity-paws",name:"Fruity Paws Cozy Hoodie",category:"Pet",categoryLabel:"Pet",price:799,badge:"PET PICK",sku:"CJGD117239401AZ",sourceUrl:"https://cjdropshipping.com/product/cute-fruit-dog-clothes-for-small-dogs-hoodies-winter-warm-fleece-pet-clothing-puppy-cat-costume-coat-for-french-chihuahua-outfit-p-1403920038016192512.html",images:["https://images.pet-friends.co.kr/storage/pet_friends/product/id/8/d/5/8/f/4/a/8d58f4aa400cf3ca2b8494f5d6a20b2c/10000/19ba6e25823b48338a8231aaaff13f24.jpg","https://i5.walmartimages.com/seo/Djunllk-Pet-Dog-T-Shirt-Small-Dogs-Clothes-Summer-Dog-Tshirt-Pet-Dog-Summer-New-Clothing-Cute-Thin-Five-Color-Fruit-Vestscasual-Unisex-Puppy-Shirts-D_6fc21b15-f0f8-4996-8747-1b8e911863b9.6384aeb62f5b7ea815648a2d8ee3a58a.jpeg"],description:"A playful fruit-inspired pet hoodie for small dogs and cats.",highlights:["7 style options listing","XS–2XL size range","Fruit-inspired designs","Designed for small pets"]},
    {id:"dw-bunnyglow",name:"BunnyGlow Touch Night Light",category:"Home",categoryLabel:"Home & Daily",price:1299,badge:"SOFT GLOW",sku:"CJYD199189901AZ",sourceUrl:"https://cjdropshipping.com/product/cute-led-night-light-touch-sensor-cartoon-kids-nightlights-big-face-rabbit-silicone-night-light-christmas-gift-bedside-lamp-home-decor-p-1770035341261541376.html",images:["https://cf.cjdropshipping.com/17154720/2405120725050328100.jpg"],description:"A touch-controlled silicone bunny lamp made for bedside tables and gentle late-night lighting.",highlights:["Touch control","3 brightness levels","30-minute timer listing","USB rechargeable listing"]},
    {id:"dw-orbitmoon-lamp",name:"OrbitMoon Crystal Night Lamp",category:"Home",categoryLabel:"Home & Daily",price:899,badge:"AMBIENT",sku:"CJJT153840401AZ",sourceUrl:"https://cjdropshipping.com/product/luminous-starry-sky-and-planets-moon-moon-crystal-ball-small-night-lamp-projection-ambience-light-creative-gift-new-strange-gift-p-1555129918592397312.html",images:["https://cf.cjdropshipping.com/17116704/2403290157100327000.jpg","https://eleganceuniverse.com/cdn/shop/files/0896832a-46ae-4d02-8242-ad2b3e08a62f.jpg?v=1702764669"],description:"A compact crystal-ball lamp with planetary and nebula-inspired designs.",highlights:["3D planetary look","Compact format","Multiple space designs","Gift-friendly display"]},
    {id:"dw-temptrack-bottle",name:"TempTrack Insulated Bottle",category:"Home",categoryLabel:"Home & Daily",price:1099,badge:"DAILY USE",sku:"CJJT192676801AZ",sourceUrl:"https://cjdropshipping.com/product/smart-digital-thermal-bottle-portable-coffee-mug-stainless-steel-water-bottle-in-car-insulated-cup-keep-cold-vacuum-flasks-450ml-p-1737828106674647040.html",images:["https://cf.cjdropshipping.com/17032032/1738098783004266496.jpg"],description:"A 450 ml insulated bottle with a digital temperature display.",highlights:["Digital temperature display","316 stainless-steel liner listing","Hot/cold insulation listing","450 ml capacity"]},
    {id:"dw-cloudwarm-socks",name:"CloudWarm Over-Knee Socks",category:"Wear",categoryLabel:"Wear",price:899,badge:"COZY",sku:"CJYD177740901AZ",sourceUrl:"https://cjdropshipping.com/product/over-knee-high-fuzzy-long-socks-winter-warm-cold-leg-knee-joint-cold-proof-stockings-home-floor-sleeping-socks-p-1668434970181902336.html",images:["https://cf.cjdropshipping.com/17051904/2401140356490329800.jpg","https://cf.cjdropshipping.com/17051904/2401140356500320300.jpg","https://cf.cjdropshipping.com/17051904/2401140356500321000.jpg"],description:"Long fuzzy socks for cold-weather lounging, sleeping and relaxing at home.",highlights:["Fuzzy warm feel","Long-leg coverage","Home and sleep friendly","Cold-weather essential"]},
    {id:"dw-ravenhide-watch",name:"RavenHide Retro Leather Watch",category:"Wear",categoryLabel:"Wear",price:1299,badge:"CLASSIC",sku:"CJYD112291701AZ",sourceUrl:"https://cjdropshipping.com/product/accessories-foreign-trade-watches-retro-cowhide-watches-punk-watches-mens-wrist-watches-p-1391988614027677696.html",images:["https://cf.cjdropshipping.com/1620710794428.jpg?x-oss-process=image%2Fresize%2Cm_fill%2Cm_pad%2Cw_1200%2Ch_1200"],description:"A bold, antique-inspired electronic wristwatch with a large dial and retro strap.",highlights:["Retro aesthetic","Electronic movement listing","Approx. 46 mm dial listing","Bold everyday accessory"]},
    {id:"dw-pup-match-vest",name:"PupMatch Sports Vest",category:"Pet",categoryLabel:"Pet",price:699,badge:"PET PICK",sku:"CJJJCWGD00413-Red-XL",sourceUrl:"https://cjdropshipping.com/product/hot-world-cup-ball-spring-and-summer-dog-vest-pet-supplies-p-CF1F5B6A-0BB3-4740-A3FA-803C6D6C2.html",images:["https://down-ph.img.susercontent.com/file/1a5e8dabc99b11192a5d558e76fa2998","https://furrinn.com/cdn/shop/files/IMG_4311.jpg?v=1749623987","https://ae01.alicdn.com/kf/S5c968d241dea4e50b0d8537c6a6f97bdJ/Dog-Vest-Summer-Breathable-Small-Dog-Mesh-Vest-Messi-Neymar.jpg"],description:"A lightweight sports-style pet vest for walks, warmer weather and playful outfits.",highlights:["Sport-inspired look","Red and black options","Multiple sizes listing","Lightweight pet layer"]}
  ];

  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
  const proxy = (url,width) => "https://images.weserv.nl/?url="+encodeURIComponent(url)+"&w="+width+"&q=78&output=webp&fit=cover";

  const PRODUCTS_CACHE_KEY = "dewify-products-v1";
  const CATEGORY_LABELS = {"Home":"Home & Daily","Wear":"Wear","Pet":"Pet"};

  function normalizeRemoteProduct(item){
    if(!item || typeof item !== "object") return null;
    const images = Array.isArray(item.images) ? item.images.map(x=>String(x||"").trim()).filter(Boolean).slice(0,12) : [];
    const category = ["Home","Wear","Pet"].includes(String(item.category||"")) ? String(item.category) : "Home";
    const price = Number(item.price);
    if(!item.id || !item.name || !images.length || !Number.isFinite(price)) return null;
    return {
      id:String(item.id),
      name:String(item.name),
      category:category,
      categoryLabel:String(item.categoryLabel || CATEGORY_LABELS[category] || category),
      price:Math.round(price),
      badge:String(item.badge || ""),
      sku:String(item.sku || ""),
      sourceUrl:String(item.sourceUrl || ""),
      images:images,
      description:String(item.description || ""),
      highlights:Array.isArray(item.highlights) ? item.highlights.map(x=>String(x||"").trim()).filter(Boolean) : [],
      active:item.active!==false
    };
  }

  function loadProductCache(){
    try{
      const raw=JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY)||"[]");
      return Array.isArray(raw) ? raw.map(normalizeRemoteProduct).filter(Boolean) : [];
    }catch{return []}
  }

  let PRODUCTS = CATALOG_PAUSED ? [] : loadProductCache();
  if(!CATALOG_PAUSED && !PRODUCTS.length) PRODUCTS = DEFAULT_PRODUCTS.map(p=>({...p,active:true}));

  let cart = loadCart();
  let activeFilter = "All";
  let selectedProduct = null;
  let lastOrder = null;

  function loadCart(){
    try{
      const data = JSON.parse(localStorage.getItem(CART_KEY)||"[]");
      if(!Array.isArray(data)) return [];
      return data
        .filter(x=>PRODUCTS.some(p=>p.id===x.id))
        .map(x=>({id:x.id,qty:Math.min(99,Math.max(1,Number(x.qty)||1))}));
    }catch{return []}
  }
  function saveCart(){
    try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch(_){}
    updateBagCount();
  }
  function product(id){return PRODUCTS.find(p=>p.id===id)||null}
  function cartCount(){return cart.reduce((n,x)=>n+x.qty,0)}
  function cartTotal(){return cart.reduce((n,x)=>{const p=product(x.id);return n+(p?p.price*x.qty:0)},0)}
  function updateBagCount(){const el=$("#bagCount");if(el)el.textContent=cartCount()}

  function imageHtml(p,width=720){
    const first=p.images[0];
    return first
      ? '<img class="product-image pending" src="'+proxy(first,width)+'" alt="'+escapeHtml(p.name)+' product image" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
      : fallbackHtml(p);
  }
  function fallbackHtml(p){
    return '<div class="product-fallback"><span>DEWIFY / PRODUCT</span><strong>'+escapeHtml(p.name)+'</strong></div>';
  }
  function escapeHtml(value){
    return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function bindImageFallback(root){
    root.querySelectorAll("img").forEach(img=>{
      if(img.dataset.bound==="1")return;
      img.dataset.bound="1";
      img.addEventListener("load",()=>img.classList.remove("pending"),{once:true,passive:true});
      img.addEventListener("error",()=>{
        const holder=img.parentElement;
        if(holder&&!holder.dataset.failed){
          holder.dataset.failed="1";
          const id=holder.dataset.productId;
          const p=product(id);
          if(p && p.images.length>1){
            const next=p.images.find(u=>u!==img.dataset.raw);
            if(next){img.dataset.raw=next;img.src=proxy(next,img.dataset.width||720);return}
          }
          img.remove();
          if(p)holder.insertAdjacentHTML("afterbegin",fallbackHtml(p));
        }
      },{passive:true});
      img.dataset.raw=img.src;
    });
  }

  function renderProducts(){
    const grid=$("#productGrid");
    const count=$("#resultsCount");
    if(!grid)return;
    const list=activeFilter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.category===activeFilter);
    const empty=$("#catalogEmpty"),toolbar=$("#catalogToolbar");
    if(empty) empty.hidden=list.length!==0;
    if(toolbar) toolbar.style.display=list.length ? "" : "none";
    grid.innerHTML=list.map((p,i)=>`
      <article class="product-card" data-product-id="${p.id}" tabindex="0" aria-label="View ${escapeAttr(p.name)}">
        <div class="product-visual" data-product-id="${p.id}">
          ${p.badge?'<span class="product-tag">'+escapeHtml(p.badge)+"</span>":""}
          ${imageHtml(p,720)}
        </div>
        <div class="product-info">
          <div class="product-meta"><span>${p.categoryLabel}</span><span>DW / ${String(PRODUCTS.indexOf(p)+1).padStart(2,"0")}</span></div>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <div class="product-bottom">
            <span class="price">${money(p.price)}</span>
            <button class="add-button" data-add="${p.id}" type="button">Add to bag</button>
          </div>
        </div>
      </article>
    `).join("");
    count.textContent=list.length+" "+(list.length===1?"drop":"drops");
    bindImageFallback(grid);
  }
  function escapeAttr(v){return escapeHtml(v)}
  function addToCart(id){
    const item=cart.find(x=>x.id===id);
    if(item)item.qty=Math.min(99,item.qty+1);
    else cart.push({id,qty:1});
    saveCart();renderCart();showToast("Added to bag");
  }
  function changeQty(id,delta){
    const item=cart.find(x=>x.id===id);
    if(!item)return;
    item.qty+=delta;
    if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
    saveCart();renderCart();renderCheckoutSummary();
  }
  function removeFromCart(id){
    cart=cart.filter(x=>x.id!==id);
    saveCart();renderCart();renderCheckoutSummary();
  }
  function renderCart(){
    const content=$("#cartContent"),foot=$("#cartFooter");
    if(!cart.length){
      content.innerHTML='<div class="cart-empty"><strong>Your bag is quiet.</strong><p>Start with something you will actually use.</p></div>';
      foot.innerHTML="";
      return;
    }
    content.innerHTML=cart.map(item=>{
      const p=product(item.id);
      return '<div class="cart-line">'+
        '<img class="cart-image" src="'+proxy(p.images[0],320)+'" alt="'+escapeHtml(p.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">'+
        '<div><p class="cart-name">'+escapeHtml(p.name)+'</p><span class="cart-price">'+money(p.price)+'</span>'+
        '<div class="qty"><button type="button" data-minus="'+p.id+'" aria-label="Decrease quantity">−</button><span>'+item.qty+'</span><button type="button" data-plus="'+p.id+'" aria-label="Increase quantity">+</button></div></div>'+
        '<button class="remove" type="button" data-remove="'+p.id+'">Remove</button>'+
      '</div>';
    }).join("");
    foot.innerHTML='<div class="cart-total-row"><span>Total</span><strong>'+money(cartTotal())+'</strong></div>'+
      '<div class="cart-actions"><button class="clear-button" id="clearBag" type="button">Clear</button><button class="button button-light" id="checkoutButton" type="button">Checkout <span>↗</span></button></div>';
    bindImageFallback(content);
  }
  function openLayer(id){
    const el=$("#"+id);
    if(!el)return;
    el.classList.add("is-open");el.setAttribute("aria-hidden","false");document.body.classList.add("locked");
  }
  function closeLayer(id){
    const el=$("#"+id);
    if(!el)return;
    el.classList.remove("is-open");el.setAttribute("aria-hidden","true");
    if(!$$(".drawer.is-open,.modal.is-open").length)document.body.classList.remove("locked");
  }
  function openDetail(id,pushHash=true){
    const p=product(id);if(!p)return;
    selectedProduct=p;
    const body=$("#productDetailBody");
    body.innerHTML=`
      <div class="product-detail-grid">
        <div class="detail-gallery">
          <img id="detailMainImage" class="detail-main-image" src="${proxy(p.images[0],1200)}" alt="${escapeAttr(p.name)} product image" loading="eager" decoding="async" referrerpolicy="no-referrer">
          <div class="detail-thumbs">
            ${p.images.map((src,i)=>'<button class="detail-thumb '+(i===0?"active":"")+'" type="button" data-thumb="'+i+'"><img src="'+proxy(src,240)+'" alt="" loading="'+(i===0?"eager":"lazy")+'" decoding="async" referrerpolicy="no-referrer"></button>').join("")}
          </div>
        </div>
        <div class="detail-copy">
          <p class="eyebrow">${escapeHtml(p.categoryLabel)} / DEWIFY DROP</p>
          <h1 id="detailTitle">${escapeHtml(p.name)}</h1>
          <p class="detail-description">${escapeHtml(p.description)}</p>
          <div class="detail-list">${(p.highlights||[]).map((x,i)=>'<div><b>'+String(i+1).padStart(2,"0")+'</b>&nbsp;&nbsp;'+escapeHtml(x)+'</div>').join("")}</div>
          <div class="detail-buy"><strong>${money(p.price)}</strong><button class="button button-light" data-detail-add="${p.id}" type="button">Add to bag <span>↗</span></button></div>
          <div class="detail-meta"><span>CATEGORY / ${escapeHtml(p.categoryLabel.toUpperCase())}</span><span>SKU / ${escapeHtml(p.sku)}</span><a href="${escapeAttr(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">VIEW SOURCE LISTING ↗</a></div>
        </div>
      </div>`;
    openLayer("productModal");
    bindImageFallback(body);
    if(pushHash)history.replaceState(null,"","#product/"+encodeURIComponent(id));
  }
  function openBag(){openLayer("cartDrawer")}
  function closeBag(){closeLayer("cartDrawer")}
  function openCheckout(){
    if(!cart.length){showToast("Your bag is empty");return}
    closeBag();renderCheckoutSummary();openLayer("checkoutModal");setTimeout(()=>$("#customerName")?.focus(),30);
  }
  function renderCheckoutSummary(){
    const items=$("#checkoutItems");
    if(!items)return;
    items.innerHTML=cart.map(i=>{
      const p=product(i.id);
      return '<div class="summary-item"><span>'+escapeHtml(p.name)+' × '+i.qty+'</span><strong>'+money(p.price*i.qty)+'</strong></div>';
    }).join("");
    $("#checkoutTotal").textContent=money(cartTotal());
  }
  function closeCheckout(){closeLayer("checkoutModal")}
  function showSuccess(order){
    lastOrder=order;
    $("#successOrderId").textContent=order.id;
    $("#successCustomer").textContent=order.customer.name;
    $("#successTotal").textContent=money(order.total);
    $("#successStatus").textContent=order.orderStatus||"NEW";
    openLayer("successModal");
  }
  function closeSuccess(){closeLayer("successModal")}

  function clientRequestId(){
    try{if(window.crypto?.randomUUID)return window.crypto.randomUUID()}catch(_){}
    return Date.now()+"-"+Math.random().toString(36).slice(2);
  }
  function validPhone(value){const digits=String(value).replace(/\D/g,"");return digits.length>=10&&digits.length<=15}
  function setFormError(message){const el=$("#formError");if(el)el.textContent=message}
  async function submitOrder(event){
    event.preventDefault();
    setFormError("");
    const values={
      name:$("#customerName").value.trim(),
      phone:$("#customerPhone").value.trim(),
      email:$("#customerEmail").value.trim(),
      address:$("#customerAddress").value.trim(),
      city:$("#customerCity").value.trim(),
      state:$("#customerState").value.trim(),
      pincode:$("#customerPincode").value.trim()
    };
    if(!values.name)return setFormError("Please enter your full name.");
    if(!validPhone(values.phone))return setFormError("Please enter a valid phone number.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))return setFormError("Please enter a valid email address.");
    if(!values.address)return setFormError("Please enter the full delivery address.");
    if(!values.city)return setFormError("Please enter your city.");
    if(!values.state)return setFormError("Please enter your state.");
    if(!/^\d{6}$/.test(values.pincode))return setFormError("Please enter a valid 6-digit pincode.");
    if(!cart.length)return setFormError("Your bag is empty.");
    if(!API_URL.startsWith("https://script.google.com/macros/s/"))return setFormError("Order service is not configured yet. Please try again later.");

    const button=$("#submitOrderButton");
    if(button?.disabled)return;
    if(button){button.disabled=true;button.textContent="Creating order…";}
    const payload={
      clientRequestId:clientRequestId(),
      customer:values,
      items:cart.map(i=>{const p=product(i.id);return{id:p.id,name:p.name,price:p.price,qty:i.qty,subtotal:p.price*i.qty,sourceUrl:p.sourceUrl,sku:p.sku}}),
      total:cartTotal(),
      paymentMethod:"UPI"
    };
    try{
      const controller=window.AbortController?new AbortController():null;
      const timeout=controller?setTimeout(()=>controller.abort(),20000):null;
      const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow",cache:"no-store",signal:controller?.signal,keepalive:true});
      if(timeout)clearTimeout(timeout);
      if(!response.ok)throw new Error("HTTP "+response.status);
      const raw=await response.text();
      let result;try{result=JSON.parse(raw)}catch{throw new Error("The order service returned an invalid response.")}
      if(!result?.ok||!result.orderId)throw new Error(result?.error||"Could not create order.");
      const order={id:result.orderId,createdAt:result.createdAt||new Date().toISOString(),customer:values,items:payload.items,total:payload.total,orderStatus:result.orderStatus||"NEW"};
      closeCheckout();showSuccess(order);cart=[];saveCart();renderCart();$("#checkoutForm").reset();
    }catch(error){
      console.error("DEWIFY order submission failed",error);
      setFormError(error?.message||"Could not create order.");
    }finally{
      if(button){button.disabled=false;button.textContent="Submit order request ↗";}
    }
  }

  function copyOrderDetails(){
    if(!lastOrder)return;
    const lines=[
      "DEWIFY — ORDER",
      "Order ID: "+lastOrder.id,
      "Customer: "+lastOrder.customer.name,
      "Phone: "+lastOrder.customer.phone,
      "Email: "+lastOrder.customer.email,
      "Address: "+lastOrder.customer.address,
      lastOrder.customer.city+", "+lastOrder.customer.state+" "+lastOrder.customer.pincode,
      "",
      ...lastOrder.items.map(i=>i.name+" × "+i.qty+" — "+money(i.subtotal)),
      "",
      "Total: "+money(lastOrder.total),
      "Status: "+(lastOrder.orderStatus||"NEW")
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(()=>showToast("Order details copied")).catch(()=>showToast("Copy unavailable"));
  }
  function showToast(text){
    const el=$("#toast");if(!el)return;
    el.textContent=text;el.classList.add("show");clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>el.classList.remove("show"),1900);
  }

  function initEvents(){
    $("#openBag")?.addEventListener("click",openBag);
    $("#closeBag")?.addEventListener("click",closeBag);
    $("#cartContent")?.addEventListener("click",e=>{
      const plus=e.target.closest("[data-plus]"),minus=e.target.closest("[data-minus]"),remove=e.target.closest("[data-remove]");
      if(plus)changeQty(plus.dataset.plus,1);
      else if(minus)changeQty(minus.dataset.minus,-1);
      else if(remove)removeFromCart(remove.dataset.remove);
    });
    $("#cartFooter")?.addEventListener("click",e=>{
      if(e.target.closest("#clearBag")){cart=[];saveCart();renderCart();renderCheckoutSummary();showToast("Bag cleared")}
      else if(e.target.closest("#checkoutButton"))openCheckout();
    });
    $("#productGrid")?.addEventListener("click",e=>{
      const add=e.target.closest("[data-add]");
      const card=e.target.closest("[data-product-id]");
      if(add){e.stopPropagation();addToCart(add.dataset.add);return}
      if(card)openDetail(card.dataset.productId);
    });
    $("#productGrid")?.addEventListener("keydown",e=>{
      const card=e.target.closest("[data-product-id]");
      if(card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openDetail(card.dataset.productId)}
    });
    $("#filters")?.addEventListener("click",e=>{
      const filter=e.target.closest("[data-filter]");if(!filter)return;
      activeFilter=filter.dataset.filter;
      $$(".filter").forEach(b=>b.classList.toggle("active",b===filter));
      renderProducts();
    });
    $("#productModal")?.addEventListener("click",e=>{
      if(e.target.closest("[data-close-detail]")){closeLayer("productModal");history.replaceState(null,"",location.pathname+location.search);return}
      const thumb=e.target.closest("[data-thumb]");
      if(thumb&&selectedProduct){
        $$(".detail-thumb",$("#productModal")).forEach(x=>x.classList.remove("active"));
        thumb.classList.add("active");
        $("#detailMainImage").src=proxy(selectedProduct.images[Number(thumb.dataset.thumb)],1200);
      }
      const add=e.target.closest("[data-detail-add]");
      if(add){addToCart(add.dataset.detailAdd);showToast("Added to bag");}
    });
    $$("[data-close-checkout]").forEach(el=>el.addEventListener("click",closeCheckout));
    $("#checkoutForm")?.addEventListener("submit",submitOrder);
    $("#successModal")?.addEventListener("click",e=>{if(e.target.closest("[data-close-success]"))closeSuccess()});
    $("#copyOrderMessage")?.addEventListener("click",copyOrderDetails);
    $("#supportLink")?.addEventListener("click",e=>{
      e.preventDefault();
      const msg=encodeURIComponent("Hi DEWIFY, I need help with an order.");
      window.open("https://wa.me/"+SUPPORT_WA+"?text="+msg,"_blank","noopener,noreferrer");
    });
    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape")return;
      if($("#productModal")?.classList.contains("is-open"))closeLayer("productModal");
      else if($("#checkoutModal")?.classList.contains("is-open"))closeCheckout();
      else if($("#cartDrawer")?.classList.contains("is-open"))closeBag();
      else if($("#successModal")?.classList.contains("is-open"))closeSuccess();
    });
    window.addEventListener("hashchange",()=>{
      const m=location.hash.match(/^#product\/(.+)$/);
      if(m)openDetail(decodeURIComponent(m[1]),false);
    },{passive:true});
  }

  function warmOrderApi(){
    if(!API_URL.startsWith("https://script.google.com/macros/s/"))return;
    // Fire-and-forget GET to warm the Apps Script runtime while the customer browses.
    // It is delayed so first paint stays completely free of network work.
    const warm=()=>{try{fetch(API_URL,{method:"GET",mode:"no-cors",cache:"no-store",keepalive:true}).catch(()=>{});}catch(_){}};
    if("requestIdleCallback" in window) window.requestIdleCallback(warm,{timeout:2500});
    else setTimeout(warm,1200);
  }

  async function refreshProductsFromBackend(){
    if(CATALOG_PAUSED) return;
    if(!API_URL.startsWith("https://script.google.com/macros/s/")) return;
    try{
      const sep=API_URL.includes("?")?"&":"?";
      const response=await fetch(API_URL+sep+"action=products",{method:"GET",cache:"no-store",redirect:"follow"});
      if(!response.ok) return;
      const result=await response.json();
      const remote=Array.isArray(result?.products) ? result.products.map(normalizeRemoteProduct).filter(Boolean) : [];
      if(!remote.length) return;

      PRODUCTS=remote;
      try{localStorage.setItem(PRODUCTS_CACHE_KEY,JSON.stringify(PRODUCTS));}catch(_){}
      const validIds=new Set(PRODUCTS.map(p=>p.id));
      cart=cart.filter(item=>validIds.has(item.id));
      saveCart();
      renderProducts();
      renderCart();
      renderCheckoutSummary();
    }catch(_){}
  }

  function initSupport(){
    const link=$("#supportLink");
    if(link)link.href="https://wa.me/"+SUPPORT_WA;
  }

  function init(){
    if(CATALOG_PAUSED){
      try{localStorage.removeItem(PRODUCTS_CACHE_KEY);localStorage.removeItem(CART_KEY);}catch(_){}
    }
    renderProducts();renderCart();renderCheckoutSummary();updateBagCount();initEvents();initSupport();initStars();warmOrderApi();
    setTimeout(refreshProductsFromBackend,180);
    const m=location.hash.match(/^#product\/(.+)$/);
    if(m)openDetail(decodeURIComponent(m[1]),false);
  }

  function initStars(){
    const canvas=$("#starfield");
    if(!canvas)return;
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)return;

    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const coarse=window.matchMedia?.("(pointer: coarse)")?.matches;
    let mobile=window.innerWidth<700||coarse;
    let dpr=Math.min(window.devicePixelRatio||1,mobile?1:1.15);
    let w=0,h=0,pageH=0;
    let stars=[];
    let raf=0,last=0,resizeTimer=0;
    let running=true;
    let pointer={x:-9999,y:-9999,active:false};
    let pointerTarget={x:-9999,y:-9999,active:false};

    function build(){
      pageH=Math.max(h,document.documentElement.scrollHeight||h);
      const area=w*pageH;
      const count=mobile
        ? Math.max(360,Math.min(520,Math.floor(area/5200)))
        : Math.max(620,Math.min(900,Math.floor(area/4300)));

      stars=Array.from({length:count},()=>({
        x:Math.random()*w,
        y:Math.random()*pageH,
        r:Math.random()<.3?(1.05+Math.random()*.65):(0.65+Math.random()*.75),
        a:Math.random()<.35?(0.86+Math.random()*.14):(0.48+Math.random()*.38),
        warm:Math.random()<.16,
        phase:Math.random()*Math.PI*2,
        speed:8+Math.random()*10,
        sway:3+Math.random()*7,
        swayY:1.5+Math.random()*4,
        repelX:0,
        repelY:0
      }));
    }

    function refreshSize(){
      const oldW=w;
      const oldH=h;
      dpr=Math.min(window.devicePixelRatio||1,mobile?1:1.15);
      w=window.innerWidth;
      h=window.innerHeight;
      mobile=w<700||coarse;
      canvas.width=Math.floor(w*dpr);
      canvas.height=Math.floor(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);

      if(!oldW||!oldH){
        build();
        return;
      }

      const sx=w/oldW;
      const sy=Math.max(1,(document.documentElement.scrollHeight||h)/Math.max(1,pageH));
      for(const s of stars){
        s.x*=sx;
        s.y*=sy;
      }
      pageH=Math.max(h,document.documentElement.scrollHeight||h);
    }

    function scheduleResize(){
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(refreshSize,120);
    }

    function updatePointer(dt){
      const ease=1-Math.pow(0.0002,dt/16.7);
      pointer.x+=(pointerTarget.x-pointer.x)*ease;
      pointer.y+=(pointerTarget.y-pointer.y)*ease;
      pointer.active=pointerTarget.active;
    }

    function frame(now){
      if(!running){raf=0;return}
      const dt=Math.min(32,Math.max(0,(now-last)||16.7));
      last=now;
      updatePointer(dt);

      if(Math.abs((document.documentElement.scrollHeight||h)-pageH)>80){
        pageH=Math.max(h,document.documentElement.scrollHeight||h);
      }

      ctx.clearRect(0,0,w,h);

      const scrollY=window.scrollY||window.pageYOffset||0;
      const radius=mobile||reduced?0:150;
      const radius2=radius*radius;
      const spring=1-Math.pow(0.0007,dt/16.7);
      const drift=now*0.001;
      const alphaStep=1;

      for(const s of stars){
        let x=((s.x+drift*s.speed)%w+w)%w;
        let y=s.y-scrollY+Math.sin(drift*.9+s.phase)*s.swayY;
        if(y<-4)y+=pageH;
        if(y>h+4)y-=pageH;

        let targetX=0,targetY=0;
        if(radius&&pointer.active){
          const dx=x-pointer.x;
          const dy=y-pointer.y;
          const dist2=dx*dx+dy*dy;
          if(dist2<radius2&&dist2>0.01){
            const inv=1/Math.sqrt(dist2);
            const force=(1-Math.sqrt(dist2)/radius);
            const eased=force*force*(3-2*force);
            const displacement=eased*24;
            targetX=dx*inv*displacement;
            targetY=dy*inv*displacement;
          }
        }

        s.repelX+=(targetX-s.repelX)*spring;
        s.repelY+=(targetY-s.repelY)*spring;
        x+=s.repelX;
        y+=s.repelY;

        ctx.globalAlpha=s.a*alphaStep;
        ctx.fillStyle=s.warm?"#f6d887":"#fbf2d3";
        const size=s.r;
        ctx.fillRect(x,y,size,size);
      }
      ctx.globalAlpha=1;
      raf=requestAnimationFrame(frame);
    }

    function start(){
      if(raf||document.hidden)return;
      running=true;
      last=performance.now();
      raf=requestAnimationFrame(frame);
    }

    function stop(){
      running=false;
      if(raf){
        cancelAnimationFrame(raf);
        raf=0;
      }
    }

    refreshSize();
    build();

    if(!mobile&&!reduced){
      addEventListener("pointermove",e=>{
        pointerTarget.x=e.clientX;
        pointerTarget.y=e.clientY;
        pointerTarget.active=true;
      },{passive:true});
      addEventListener("pointerleave",()=>{pointerTarget.active=false},{passive:true});
    }

    addEventListener("resize",scheduleResize,{passive:true});
    document.addEventListener("visibilitychange",()=>document.hidden?stop():start());
    start();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();