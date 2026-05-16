/* CUSTOM CURSOR */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function animCursor() {
    rx += (mx - rx) * .18;
    ry += (my - ry) * .18;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animCursor);
  })();

  /* NAV SCROLL EFFECT */
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* MOBILE MENU */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
  document.querySelectorAll('.mob-link').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* INTERSECTION OBSERVER — scroll animations */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));

  /* PARALLAX HERO RIM */
  const heroRim = document.querySelector('.hero-rim-bg');
  window.addEventListener('scroll', () => {
    const s = window.scrollY;
    if (heroRim && s < window.innerHeight) {
      heroRim.style.transform = `translate(-50%, calc(-50% + ${s * .18}px))`;
    }
  }, { passive: true });

  /* FORM SUBMIT */
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('formSuccess').classList.add('show');
  });