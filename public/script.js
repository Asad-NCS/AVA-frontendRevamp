// ─── NAV SCROLL ───
const navbar = document.getElementById('navbar');
if (navbar) {
  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
      navTicking = false;
    });
  }, { passive: true });
}

// ─── MOBILE MENU ───
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
}

// ─── SCROLL TO TOP ───
const sto = document.createElement('button');
sto.innerHTML = '↑';
sto.setAttribute('aria-label', 'Scroll to top');
sto.style.cssText = 'position:fixed;bottom:28px;right:28px;width:44px;height:44px;border-radius:50%;background:#00B4A6;color:#0a0a0f;border:none;font-size:18px;font-weight:700;cursor:pointer;opacity:0;transition:opacity 0.3s,transform 0.3s;z-index:200;';
document.body.appendChild(sto);
let stoTicking = false;
window.addEventListener('scroll', () => {
  if (stoTicking) return;
  stoTicking = true;
  requestAnimationFrame(() => {
    const show = window.scrollY > 400;
    sto.style.opacity = show ? '1' : '0';
    sto.style.transform = show ? 'translateY(0)' : 'translateY(8px)';
    stoTicking = false;
  });
}, { passive: true });
sto.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ─── PROGRAMS CAROUSEL ───
const carousel = document.getElementById('programsCarousel');
const prevBtn  = document.getElementById('carouselPrev');
const nextBtn  = document.getElementById('carouselNext');

if (carousel && prevBtn && nextBtn) {
  // Scroll by one card width + gap
  const getScrollAmount = () => {
    const card = carousel.querySelector('.program-card-c');
    return card ? card.offsetWidth + 20 : 400;
  };

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });

  // Update button states
  const updateBtns = () => {
    prevBtn.style.opacity = carousel.scrollLeft <= 4 ? '0.35' : '1';
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
    nextBtn.style.opacity = atEnd ? '0.35' : '1';
  };

  carousel.addEventListener('scroll', updateBtns, { passive: true });
  updateBtns();
}

// ─── COUNTER ANIMATION ───
function animateCounter(el) {
  const target = parseInt(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1600;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ─── INTERSECTION OBSERVER (reveal + counters) ───
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    if (el.classList.contains('reveal')) {
      el.classList.add('visible');
    }

    if (el.dataset.count) {
      animateCounter(el);
    }

    io.unobserve(el);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));

// ─── HERO VIDEO (defer until idle so poster paints first) ───
const heroVideo = document.querySelector('.hero-video-wrap video');
if (heroVideo) {
  const loadHeroVideo = () => {
    if (heroVideo.dataset.loaded) return;
    const source = heroVideo.querySelector('source[data-src]');
    if (!source) return;
    heroVideo.dataset.loaded = '1';
    source.src = source.dataset.src;
    heroVideo.load();
    heroVideo.play().catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadHeroVideo, { timeout: 2500 });
  } else {
    setTimeout(loadHeroVideo, 800);
  }
}

// ─── CONTACT FORM ───
const form      = document.getElementById('contactForm');
const statusEl  = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn') || document.querySelector('.form-submit-orange');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#F87171';
        valid = false;
      }
    });
    if (!valid) {
      statusEl.textContent = 'Please fill in all required fields.';
      statusEl.className = 'form-status error';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const data = {
      firstName:    form.firstName?.value    || '',
      lastName:     form.lastName?.value     || '',
      email:        form.email?.value        || '',
      phone:        form.phone?.value        || '',
      organisation: form.organisation?.value || '',
      message:      form.message?.value      || '',
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        submitBtn.textContent = 'Message Sent ✓';
        submitBtn.style.background = '#16a34a';
        statusEl.textContent = "We'll be in touch within 24 hours.";
        statusEl.className = 'form-status success';
        form.reset();
        setTimeout(() => {
          submitBtn.textContent = 'Send Message';
          submitBtn.style.background = '';
          submitBtn.disabled = false;
          statusEl.textContent = '';
        }, 5000);
      } else {
        throw new Error('Server error');
      }
    } catch {
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled = false;
      statusEl.textContent = 'Something went wrong. Please email us directly at ava@adventures.studio';
      statusEl.className = 'form-status error';
    }
  });
}


// ─── PILLARS CAROUSEL (About — Who We Are) ───
const pillarsCarousel = document.getElementById('pillarsCarousel');
const pillarPrevBtn = document.getElementById('pillarPrev');
const pillarNextBtn = document.getElementById('pillarNext');

if (pillarsCarousel && pillarPrevBtn && pillarNextBtn) {
  const PILLAR_INTERVAL = 3000;
  const PILLAR_MAX_STEP = 2;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pillarStep = 0;
  let pillarDirection = 1;
  let pillarTimer = null;
  let pillarPaused = false;

  const getPillarGap = () => {
    const styles = getComputedStyle(pillarsCarousel);
    return parseFloat(styles.columnGap || styles.gap) || 16;
  };

  const getPillarCardWidth = () => {
    const card = pillarsCarousel.querySelector('.program-card-c');
    return card ? card.offsetWidth : 0;
  };

  const getPillarScrollAmount = () => getPillarCardWidth() + getPillarGap();

  const scrollPillarsToStep = (step, smooth = true) => {
    const left = getPillarScrollAmount() * step;
    pillarsCarousel.classList.add('is-scrolling');
    pillarsCarousel.scrollTo({
      left,
      behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto',
    });
    window.setTimeout(() => pillarsCarousel.classList.remove('is-scrolling'), smooth ? 520 : 0);
  };

  const updatePillarBtns = () => {
    pillarPrevBtn.style.opacity = pillarStep <= 0 ? '0.35' : '1';
    pillarNextBtn.style.opacity = pillarStep >= PILLAR_MAX_STEP ? '0.35' : '1';
  };

  const setPillarStep = (step, smooth = true) => {
    pillarStep = Math.max(0, Math.min(PILLAR_MAX_STEP, step));
    scrollPillarsToStep(pillarStep, smooth);
    updatePillarBtns();
  };

  const advancePillars = () => {
    if (pillarStep >= PILLAR_MAX_STEP) pillarDirection = -1;
    else if (pillarStep <= 0) pillarDirection = 1;
    setPillarStep(pillarStep + pillarDirection);
  };

  const startPillarAuto = () => {
    if (pillarTimer || pillarPaused || prefersReducedMotion) return;
    pillarTimer = window.setInterval(advancePillars, PILLAR_INTERVAL);
  };

  const stopPillarAuto = () => {
    if (!pillarTimer) return;
    window.clearInterval(pillarTimer);
    pillarTimer = null;
  };

  const resetPillarAuto = () => {
    stopPillarAuto();
    startPillarAuto();
  };

  pillarNextBtn.addEventListener('click', () => {
    if (pillarStep >= PILLAR_MAX_STEP) return;
    pillarDirection = 1;
    setPillarStep(pillarStep + 1);
    resetPillarAuto();
  });

  pillarPrevBtn.addEventListener('click', () => {
    if (pillarStep <= 0) return;
    pillarDirection = -1;
    setPillarStep(pillarStep - 1);
    resetPillarAuto();
  });

  const pillarsBlock = pillarsCarousel.closest('.who-we-are-pillars-block');
  if (pillarsBlock) {
    pillarsBlock.addEventListener('mouseenter', () => {
      pillarPaused = true;
      stopPillarAuto();
    });
    pillarsBlock.addEventListener('mouseleave', () => {
      pillarPaused = false;
      startPillarAuto();
    });
  }

  window.addEventListener('resize', () => scrollPillarsToStep(pillarStep, false));

  const pillarObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) startPillarAuto();
      else stopPillarAuto();
    });
  }, { threshold: 0.35 });

  pillarObserver.observe(pillarsCarousel);

  setPillarStep(0, false);
}


// ─── PREMIUM INTERACTIVE BACKGROUND ───
(function() {
  // Inject the background layers
  const spotlight = document.createElement('div');
  spotlight.className = 'interactive-spotlight';
  
  const grid = document.createElement('div');
  grid.className = 'premium-grid-overlay';
  
  // Insert at the very beginning of the body
  document.body.insertBefore(spotlight, document.body.firstChild);
  document.body.insertBefore(grid, document.body.firstChild);

  // Track mouse for the spotlight effect
  let ticking = false;
  window.addEventListener('mousemove', (e) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        spotlight.style.setProperty('--mouse-x', `${e.clientX}px`);
        spotlight.style.setProperty('--mouse-y', `${e.clientY}px`);
        ticking = false;
      });
      ticking = true;
    }
  });
})();
