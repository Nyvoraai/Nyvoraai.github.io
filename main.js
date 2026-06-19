/* NyvoraAI — Shared Scripts */

// NAV SCROLL
window.addEventListener('scroll',()=>{
  const nav=document.querySelector('nav');
  if(nav)nav.style.background=window.scrollY>60?'rgba(5,5,10,.97)':'rgba(5,5,10,.8)';
},{passive:true});

// HAMBURGER
document.addEventListener('DOMContentLoaded',()=>{
  const ham=document.getElementById('ham');
  const mob=document.getElementById('mob');
  if(ham&&mob){
    ham.addEventListener('click',()=>{
      const o=mob.classList.toggle('open');
      ham.setAttribute('aria-expanded',String(o));
    });
    mob.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',()=>{mob.classList.remove('open');ham.setAttribute('aria-expanded','false')});
    });
  }

  // REVEAL
  function initReveal(){
    const els=document.querySelectorAll('.reveal');
    const obs=new IntersectionObserver((entries)=>{
      entries.forEach((e,i)=>{
        if(e.isIntersecting){
          setTimeout(()=>e.target.classList.add('vis'),i*70);
          obs.unobserve(e.target);
        }
      });
    },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
    els.forEach(el=>obs.observe(el));
  }
  initReveal();

  // CATEGORY PILLS
  document.querySelectorAll('.pill').forEach(pill=>{
    pill.addEventListener('click',()=>{
      pill.closest('.cats').querySelectorAll('.pill').forEach(p=>p.classList.remove('act'));
      pill.classList.add('act');
    });
  });

  // NEWSLETTER
  document.querySelectorAll('.nl-form').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const btn=form.querySelector('button');
      const inp=form.querySelector('input');
      const orig=btn.textContent;
      btn.textContent='Subscribed!';
      btn.style.background='#00b894';
      btn.style.boxShadow='0 6px 30px rgba(0,184,148,.35)';
      inp.value='';
      setTimeout(()=>{btn.textContent=orig;btn.style.background='';btn.style.boxShadow=''},3500);
    });
  });

  // CONTACT FORM
  const cf=document.getElementById('contactForm');
  if(cf){
    cf.addEventListener('submit',e=>{
      e.preventDefault();
      const btn=cf.querySelector('button[type="submit"]');
      const orig=btn.textContent;
      btn.textContent='Message Sent!';
      btn.style.background='#00b894';
      btn.style.boxShadow='0 6px 30px rgba(0,184,148,.35)';
      setTimeout(()=>{btn.textContent=orig;btn.style.background='';btn.style.boxShadow='';cf.reset()},3500);
    });
  }

  // REDUCED MOTION
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    document.querySelectorAll('.mesh-orb,.vis-shape,.vis-line,.badge-dot,.bva,.acard-thumb-inner').forEach(el=>el.style.animation='none');
    const t=document.querySelector('.ticker-track');
    if(t)t.style.animation='none';
  }
});
