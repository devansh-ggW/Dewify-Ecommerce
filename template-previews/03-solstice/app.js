const nav=document.querySelector('.nav'),menu=document.querySelector('.menu');menu?.addEventListener('click',()=>nav.classList.toggle('open'));
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('.reveal').forEach(x=>io.observe(x));
const stage=document.querySelector('.sky-stage'),sun=document.querySelector('.sun');
if(stage&&sun){
  const sync=()=>{
    const hero=document.querySelector('.hero');
    const max=Math.max(1,hero.offsetHeight-innerHeight);
    const p=Math.min(1,Math.max(0,scrollY/max));
    const sunProgress=0.08+0.84*p;
    sun.style.top=`${sunProgress*100}%`;
    if(p<.28){
      stage.style.background='linear-gradient(180deg,#d9e8ee 0%,#f2d8c0 54%,#c58c87 100%)';
      sun.style.background='#fff4c9';
      sun.style.boxShadow='0 0 90px rgba(255,224,156,.55)';
    }else if(p<.65){
      stage.style.background='linear-gradient(180deg,#efb89b 0%,#d57d76 52%,#765064 100%)';
      sun.style.background='#ffd078';
      sun.style.boxShadow='0 0 75px rgba(255,181,101,.42)';
    }else{
      stage.style.background='linear-gradient(180deg,#655575 0%,#30263f 62%,#12131a 100%)';
      sun.style.background='#ef9d67';
      sun.style.boxShadow='0 0 55px rgba(239,157,103,.28)';
    }
  };
  addEventListener('scroll',sync,{passive:true});
  addEventListener('resize',sync,{passive:true});
  sync();
}