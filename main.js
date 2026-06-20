// NyvoraAI — main.js v2.0
// Enhanced: page loader, particles, scroll progress, back-to-top, nav scroll

/* === PAGE LOADER === */
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hide'), 400);
    setTimeout(() => loader.remove(), 900);
  }
});

/* === SCROLL PROGRESS === */
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrollTop / docH * 100) + '%';
  }, { passive: true });
}

/* === NAV SCROLL STYLE === */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* === BACK TO TOP === */
const backTop = document.getElementById('back-top');
if (backTop) {
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* === MOBILE MENU === */
const ham = document.getElementById('ham');
const mob = document.getElementById('mob');
if (ham && mob) {
  ham.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  // Close on link click
  mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mob.classList.remove('open');
    ham.classList.remove('open');
    ham.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mob.contains(e.target)) {
      mob.classList.remove('open');
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* === SCROLL REVEAL === */
const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));
}

/* === ACTIVE NAV LINK === */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mob-menu a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

/* === FILTER PILLS (blog/news pages) === */
const pills = document.querySelectorAll('.pill');
const cards = document.querySelectorAll('.acard[data-cat]');
pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const cat = pill.dataset.cat;
    cards.forEach(card => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.style.transition = 'opacity 0.25s, transform 0.25s';
      if (show) {
        card.style.display = '';
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.97)';
        setTimeout(() => { if (card.dataset.cat !== pill.dataset.cat && pill.dataset.cat !== 'all') card.style.display = 'none'; }, 250);
      }
    });
  });
});

/* === CONTACT FORM === */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    // Simulate / real Formspree
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const success = document.getElementById('formSuccess');
        contactForm.style.display = 'none';
        if (success) success.style.display = 'block';
      } else {
        btn.textContent = 'Send Message →';
        btn.disabled = false;
      }
    } catch {
      const success = document.getElementById('formSuccess');
      contactForm.style.display = 'none';
      if (success) success.style.display = 'block';
    }
  });
}

/* === NEWSLETTER FORM === */
document.querySelectorAll('.nl-form').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const input = form.querySelector('input');
    if (btn) {
      btn.textContent = '✓ You\'re in!';
      btn.style.background = '#4fd9a0';
      input.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Subscribe Free';
        btn.style.background = '';
        input.disabled = false;
        form.reset();
      }, 3500);
    }
  });
});

/* === PARTICLE BACKGROUND (hero only) === */
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? '124,109,250' : '79,217,194';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, () => new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124,109,250,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize, { passive: true });
  init();
  animate();
}

/* === COUNTER ANIMATION (stats) === */
function animateCount(el, target, suffix = '') {
  const start = performance.now();
  const dur = 1800;
  const isNum = !isNaN(parseInt(target));
  if (!isNum) return; // skip non-numeric like "Daily", "Free"
  const end = parseInt(target);
  function step(now) {
    const progress = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * end) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statEls = document.querySelectorAll('.stat-n');
if (statEls.length) {
  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const num = text.match(/\d+/);
        const suffix = text.replace(/\d+/, '');
        if (num) animateCount(el, num[0], suffix);
        statObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statObs.observe(el));
}
