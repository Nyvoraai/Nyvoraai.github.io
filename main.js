// NyvoraAI — main.js (shared across all pages)

// === MOBILE MENU ===
const ham = document.getElementById('ham');
const mob = document.getElementById('mob');
if (ham && mob) {
  ham.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    ham.setAttribute('aria-expanded', open);
  });
}

// === SCROLL REVEAL ===
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.08 });
  revealEls.forEach(el => observer.observe(el));
}

// === ACTIVE NAV LINK ===
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mob-menu a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// === FILTER PILLS (blog/news pages) ===
const pills = document.querySelectorAll('.pill');
const cards = document.querySelectorAll('.acard[data-cat]');
pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const cat = pill.dataset.cat;
    cards.forEach(card => {
      if (cat === 'all' || card.dataset.cat === cat) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// === CONTACT FORM ===
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.getElementById('formSuccess');
    if (success) {
      contactForm.style.display = 'none';
      success.style.display = 'block';
    }
  });
}

// === NEWSLETTER FORM ===
document.querySelectorAll('.nl-form').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    if (btn) {
      btn.textContent = '✓ Subscribed!';
      btn.style.background = '#4fd9a0';
      setTimeout(() => {
        btn.textContent = 'Subscribe Free';
        btn.style.background = '';
        form.reset();
      }, 3000);
    }
  });
});
