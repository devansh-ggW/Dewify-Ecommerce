const header=document.querySelector('.site-header');const nav=document.querySelector('.nav');const menu=document.querySelector('.menu-btn');
if(menu)menu.addEventListener('click',()=>nav.classList.toggle('open'));
const onScroll=()=>header?.classList.toggle('scrolled',scrollY>20);addEventListener('scroll',onScroll);onScroll();
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('.reveal').forEach(x=>io.observe(x));
const hero=document.querySelector('.hero-media');if(hero){const img=hero.querySelector('img');if(img.complete)hero.classList.add('loaded');img?.addEventListener('load',()=>hero.classList.add('loaded'))}