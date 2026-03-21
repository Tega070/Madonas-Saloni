/* ============================================================
   SALON HOME — სალონი ჰოუმი
   main.js — navigation, form validation, EmailJS
   ============================================================ */

/* ---- EmailJS configuration ---- */
// Replace these three values after setting up your EmailJS account.
// See README or the plan file for step-by-step setup instructions.
const EMAILJS_PUBLIC_KEY   = 'fRtfjcdr3Kh9AZJAG';
const EMAILJS_SERVICE_ID   = 'service_dp0u6tr';
const EMAILJS_SALON_TMPL   = 'template_2c44rzi';   // salon notification

/* ============================================================
   1. DATE FIELD — set minimum date to today
   ============================================================ */
function initDateField() {
  const dateInput = document.getElementById('f-date');
  if (!dateInput) return;
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  dateInput.setAttribute('min', today);
  if (!dateInput.value) {
    dateInput.value = today;
  }
}

/* ============================================================
   2. MOBILE NAVIGATION — hamburger toggle
   ============================================================ */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'მენიუს დახურვა');
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'მენიუს გახსნა');
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu when any nav link is clicked (single-page scroll)
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
}

/* ============================================================
   3. FORM VALIDATION — returns array of Georgian error strings
   ============================================================ */
function validateBookingForm(data) {
  const errors = [];

  const name    = (data.get('client_name')  || '').trim();
  const phone   = (data.get('client_phone') || '').trim();
  const service = (data.get('service') || '').trim();
  const date    = (data.get('date')    || '').trim();
  const time    = (data.get('time')    || '').trim();

  if (!name)    errors.push('სახელი და გვარი სავალდებულოა.');
  if (!phone)   errors.push('ტელეფონის ნომერი სავალდებულოა.');
  if (!service) errors.push('გთხოვთ, აირჩიეთ სერვისი.');

  if (!date) {
    errors.push('თარიღი სავალდებულოა.');
  } else {
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      errors.push('გთხოვთ, მომავლის თარიღი მიუთითეთ.');
    }
  }

  if (!time) errors.push('სასურველი დრო სავალდებულოა.');

  return errors;
}

/* ============================================================
   4. BOOKING FORM — EmailJS submission
   ============================================================ */
function initBookingForm() {
  const form       = document.getElementById('booking-form');
  const submitBtn  = document.getElementById('submit-btn');
  const errorsDiv  = document.getElementById('form-errors');
  const successDiv = document.getElementById('form-success');

  if (!form) return;

  // Initialize EmailJS (v4 syntax)
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  function showErrors(errors) {
    const items = errors.map(e => `<li>${e}</li>`).join('');
    errorsDiv.innerHTML = `<ul>${items}</ul>`;
    errorsDiv.removeAttribute('hidden');
    errorsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideErrors() {
    errorsDiv.setAttribute('hidden', '');
    errorsDiv.innerHTML = '';
  }

  function showSuccess() {
    successDiv.removeAttribute('hidden');
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'იგზავნება...' : 'ჯავშნის გაგზავნა';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    hideErrors();
    successDiv.setAttribute('hidden', '');

    const data   = new FormData(form);
    const errors = validateBookingForm(data);

    if (errors.length) {
      showErrors(errors);
      return;
    }

    // Guard: EmailJS not loaded (CDN blocked, offline, etc.)
    if (typeof emailjs === 'undefined') {
      showErrors(['სერვისი მიუწვდომელია. გთხოვთ, დაგვიკავშირდით ტელეფონით: 557 11 85 30']);
      return;
    }

    setLoading(true);

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_SALON_TMPL, {
        name:    document.getElementById('f-name').value.trim(),
        phone:   document.getElementById('f-phone').value.trim(),
        email:   document.getElementById('f-email').value.trim() || 'არ მიუთითებია',
        service: document.getElementById('f-service').value,
        date:    document.getElementById('f-date').value,
        time:    document.getElementById('f-time').value,
      });

      // Reset and show success
      form.reset();
      initDateField();       // re-apply today's min after reset
      showSuccess();

    } catch (err) {
      console.error('EmailJS error:', err);
      showErrors([
        'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადეთ ხელახლა ან ' +
        'დაგვიკავშირდით პირდაპირ: 557 11 85 30'
      ]);
    } finally {
      setLoading(false);
    }
  });
}

/* ============================================================
   5. SCROLL REVEAL — fade-in elements as they enter the viewport
   ============================================================ */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // animate once only
      }
    });
  }, { threshold: 0.10 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ============================================================
   INIT — run everything on DOM ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initDateField();
  initMobileNav();
  initBookingForm();
  initScrollReveal();
});
