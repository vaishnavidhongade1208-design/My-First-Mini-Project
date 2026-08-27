// =========================================================
// Small utility: respects prefers-reduced-motion
// =========================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =========================================================
// 1. Responsive nav: hamburger toggle + close on link click
// =========================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function closeNav() {
  navLinks.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeNav);
});

// close mobile nav on outside click
document.addEventListener('click', (e) => {
  const clickedInsideNav = navLinks.contains(e.target) || navToggle.contains(e.target);
  if (!clickedInsideNav && navLinks.classList.contains('is-open')) {
    closeNav();
  }
});

// =========================================================
// 2. Sticky nav shadow on scroll + active link highlighting
// =========================================================
const navEl = document.getElementById('nav');
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav__link');

function onScroll() {
  navEl.classList.toggle('is-scrolled', window.scrollY > 12);

  let currentId = sections[0]?.id;
  const scrollPos = window.scrollY + 120;
  sections.forEach(section => {
    if (scrollPos >= section.offsetTop) currentId = section.id;
  });

  navLinkEls.forEach(link => {
    link.classList.toggle('active-link', link.getAttribute('href') === `#${currentId}`);
  });
}
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// =========================================================
// 3. Scroll-reveal animation via IntersectionObserver
// =========================================================
const revealEls = document.querySelectorAll('[data-reveal]');

if (prefersReducedMotion) {
  revealEls.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => revealObserver.observe(el));
}

// =========================================================
// 4. Hero headline word rotator ("decisions" / "insights" / ...)
// =========================================================
const rotatorWords = ['decisions', 'insights', 'predictions', 'stories'];
const rotatorEl = document.getElementById('rotator');
let rotatorIndex = 0;

if (rotatorEl && !prefersReducedMotion) {
  setInterval(() => {
    rotatorIndex = (rotatorIndex + 1) % rotatorWords.length;
    rotatorEl.style.opacity = 0;
    setTimeout(() => {
      rotatorEl.textContent = rotatorWords[rotatorIndex];
      rotatorEl.style.opacity = 1;
    }, 220);
  }, 2400);
  rotatorEl.style.transition = 'opacity 0.2s ease';
}

// =========================================================
// 5. Neural network SVG: build nodes/edges + draw-in animation
// =========================================================
(function buildNetwork() {
  const svg = document.getElementById('netSvg');
  const nodesGroup = document.getElementById('netNodes');
  const linesGroup = document.getElementById('netLines');
  if (!svg || !nodesGroup || !linesGroup) return;

  const layers = [3, 4, 2]; // input, hidden, output
  const width = 360, height = 320;
  const layerX = [60, 190, 310];
  const colors = ['var(--accent-blue)', 'var(--accent-amber)', 'var(--accent-green)'];

  const positions = layers.map((count, li) => {
    const gap = height / (count + 1);
    return Array.from({ length: count }, (_, i) => ({
      x: layerX[li],
      y: gap * (i + 1)
    }));
  });

  // draw connecting lines between consecutive layers
  let lineDelay = 0;
  for (let li = 0; li < positions.length - 1; li++) {
    positions[li].forEach(a => {
      positions[li + 1].forEach(b => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', a.x);
        line.setAttribute('y1', a.y);
        line.setAttribute('x2', b.x);
        line.setAttribute('y2', b.y);
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (!prefersReducedMotion) {
          line.style.strokeDasharray = length;
          line.style.strokeDashoffset = length;
          line.style.transition = `stroke-dashoffset 0.7s ease ${lineDelay}s`;
        }
        linesGroup.appendChild(line);
        lineDelay += 0.03;
      });
    });
  }

  // draw nodes
  positions.forEach((layer, li) => {
    layer.forEach((pos, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', 7);
      circle.setAttribute('fill', 'var(--surface)');
      circle.setAttribute('stroke', colors[li]);
      circle.setAttribute('stroke-width', '2.5');
      circle.classList.add('net-node');
      if (!prefersReducedMotion) {
        circle.style.opacity = 0;
        circle.style.transition = `opacity 0.4s ease ${li * 0.15}s`;
      }
      nodesGroup.appendChild(circle);
    });
  });

  // trigger draw-in once the hero art scrolls into view
  const artObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          linesGroup.querySelectorAll('line').forEach(l => { l.style.strokeDashoffset = 0; });
          nodesGroup.querySelectorAll('circle').forEach(c => { c.style.opacity = 1; });
        });
        artObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  artObserver.observe(svg);
})();

// =========================================================
// 6. Contact form validation (no backend — front-end only)
// =========================================================
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const submitLabel = document.getElementById('submitLabel');
const formStatus = document.getElementById('formStatus');

const validators = {
  name: (value) => value.trim().length >= 2 || 'Enter your name (min 2 characters).',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Enter a valid email address.',
  message: (value) => value.trim().length >= 10 || 'Message should be at least 10 characters.'
};

function validateField(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}Error`);
  const result = validators[id](input.value);
  const fieldWrap = input.closest('.field');

  if (result === true) {
    fieldWrap.classList.remove('has-error');
    errorEl.textContent = '';
    return true;
  } else {
    fieldWrap.classList.add('has-error');
    errorEl.textContent = result;
    return false;
  }
}

['name', 'email', 'message'].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('blur', () => validateField(id));
  input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('has-error')) validateField(id);
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const results = ['name', 'email', 'message'].map(validateField);
  const allValid = results.every(Boolean);

  if (!allValid) {
    formStatus.style.color = '#C24F3F';
    formStatus.textContent = 'Please fix the highlighted fields.';
    return;
  }

  // Simulate sending (no backend in this mini project)
  submitBtn.disabled = true;
  submitLabel.textContent = 'Sending…';
  formStatus.style.color = 'var(--ink-soft)';
  formStatus.textContent = '';

  setTimeout(() => {
    submitLabel.textContent = 'Run send() →';
    submitBtn.disabled = false;
    formStatus.style.color = 'var(--accent-green)';
    formStatus.textContent = '✓ Message sent — thanks! I\'ll reply by email soon.';
    form.reset();
  }, 900);
});

// =========================================================
// 7. Footer dynamic year
// =========================================================
document.getElementById('year').textContent = new Date().getFullYear();
