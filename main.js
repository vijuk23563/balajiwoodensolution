// ============================================
//  BALAJI WOODEN SOLUTIONS - Main JavaScript
// ============================================

/* ---- Hamburger Nav ---- */
const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
  // Close nav on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

/* ---- Active Nav Link ---- */
(function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ---- Scroll Header Shadow ---- */
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) {
    header.style.boxShadow = window.scrollY > 50
      ? '0 2px 30px rgba(0,0,0,0.4)'
      : '0 2px 20px rgba(0,0,0,0.3)';
  }
});

/* ---- Toast Notification ---- */
function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ---- Animate on Scroll ---- */
const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function initAnimations() {
  const els = document.querySelectorAll(
    '.service-card, .gallery-item, .gallery-full-item, .testimonial-card, .hero-card, .about-grid, .sidebar-card'
  );
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
    observer.observe(el);
  });
}
document.addEventListener('DOMContentLoaded', initAnimations);

/* ============================================
   BOOKING PAGE LOGIC  (UI only — submit handled by Firebase inline script)
   ============================================ */
(function initBooking() {
  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) return;

  // Time slot selection
  document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      document.getElementById('selectedTime').value = slot.textContent.trim();
    });
  });

  // Date validation — no past dates
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
  // NOTE: form submit is handled by the Firebase inline script in booking.html
})();

/* ============================================
   CUSTOM DESIGN PAGE LOGIC  (UI only — submit handled by Firebase inline script)
   ============================================ */
(function initCustomDesign() {
  const designForm = document.getElementById('customDesignForm');
  if (!designForm) return;

  // Wood type selection
  document.querySelectorAll('.wood-type').forEach(wt => {
    wt.addEventListener('click', () => {
      document.querySelectorAll('.wood-type').forEach(w => w.classList.remove('selected'));
      wt.classList.add('selected');
      document.getElementById('selectedWood').value = wt.querySelector('.wt-name').textContent;
    });
  });

  // Budget range slider
  const budgetSlider  = document.getElementById('budgetSlider');
  const budgetDisplay = document.getElementById('budgetValue');
  if (budgetSlider && budgetDisplay) {
    function updateBudget() {
      const val = parseInt(budgetSlider.value);
      budgetDisplay.textContent = '₹' + val.toLocaleString('en-IN');
      const pct = ((val - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100;
      budgetSlider.style.background = `linear-gradient(to right, #c8902a 0%, #c8902a ${pct}%, #e8d5bc ${pct}%, #e8d5bc 100%)`;
    }
    budgetSlider.addEventListener('input', updateBudget);
    updateBudget();
  }

  // File upload display
  const fileInput  = document.getElementById('referenceImages');
  const fileLabel  = document.getElementById('fileLabel');
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      const count = fileInput.files.length;
      fileLabel.textContent = count > 0
        ? `${count} file${count > 1 ? 's' : ''} selected`
        : 'Click or drag files here';
    });
  }
  // NOTE: form submit is handled by the Firebase inline script in custom-design.html
})();

/* ============================================
   GALLERY FILTER
   ============================================ */
(function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-full-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
          item.style.animation = 'fadeIn 0.4s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
})();

/* ============================================
   CONTACT FORM
   ============================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name    = form.querySelector('#contactName').value.trim();
    const phone   = form.querySelector('#contactPhone').value.trim();
    const message = form.querySelector('#contactMessage').value.trim();

    if (!name || !phone || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    const waMsg = encodeURIComponent(`Hello Balaji Wooden Solutions!\n\n👤 Name: ${name}\n📞 Phone: ${phone}\n💬 Message: ${message}`);
    window.open(`https://wa.me/919571412387?text=${waMsg}`, '_blank');
    showToast('Opening WhatsApp to send your message!', 'success');
    form.reset();
  });
})();

/* ---- Counter Animation ---- */
function animateCounters() {
  document.querySelectorAll('.count-up').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
    }, 16);
  });
}
const heroSection = document.querySelector('.hero-stats');
if (heroSection) {
  const counterObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { animateCounters(); counterObserver.disconnect(); }
  }, { threshold: 0.5 });
  counterObserver.observe(heroSection);
}
