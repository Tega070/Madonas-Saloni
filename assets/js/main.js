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
const APPS_SCRIPT_URL      = 'https://script.google.com/macros/s/AKfycbxelOAKLc3x16BxWSOcnIy6cKAeueUKlWyIYYyCLGteqkLq9uWzS0Z6rHZeF3AwxFr9pw/exec';

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
      // Reserve the slot in Google Sheets first
      const slotRes = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          date:    document.getElementById('f-date').value,
          time:    document.getElementById('f-time').value,
          name:    document.getElementById('f-name').value.trim(),
          phone:   document.getElementById('f-phone').value.trim(),
          email:   document.getElementById('f-email').value.trim() || 'არ მიუთითებია',
          service: document.getElementById('f-service').value,
        }),
      });
      const slotData = await slotRes.json();

      if (!slotData.success) {
        showErrors(['სამწუხაროდ, ეს დრო უკვე დაჯავშნილია. გთხოვთ, სხვა დრო აირჩიოთ.']);
        setLoading(false);
        return;
      }

      // Slot reserved — send EmailJS notification
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
      initDateField();
      showSuccess();

    } catch (err) {
      console.error('Booking error:', err);
      showErrors([
        'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადეთ ხელახლა ან ' +
        'დაგვიკავშირდით პირდაპირ: 557 11 85 30'
      ]);
    } finally {
      setLoading(false);
    }
  });

  // Disable already-booked times when date changes
  document.getElementById('f-date').addEventListener('change', async (e) => {
    const date = e.target.value;
    const timeSelect = document.getElementById('f-time');
    let booked = [];
    if (date) {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?date=${date}`);
        const json = await res.json();
        booked = json.booked || [];
      } catch { booked = []; }
    }
    Array.from(timeSelect.options).forEach(opt => {
      if (!opt.value) return;
      const taken = booked.includes(opt.value);
      opt.disabled = taken;
      opt.textContent = taken ? opt.value + ' — დაჯავშნილია' : opt.value;
    });
    if (timeSelect.value && booked.includes(timeSelect.value)) timeSelect.value = '';
  });
}

/* ============================================================
   5. CUSTOM SERVICE SELECT — elegant grouped dropdown
   ============================================================ */
function initCustomServiceSelect() {
  const native = document.getElementById('f-service');
  if (!native) return;

  // Wrap native select
  const wrap = document.createElement('div');
  wrap.className = 'cs-wrap';
  native.parentNode.insertBefore(wrap, native);
  native.classList.add('cs-native');
  wrap.appendChild(native);

  // Build trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="cs-trigger-text is-placeholder">— აირჩიეთ სერვისი —</span>
    <svg class="cs-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
      <path d="M1 1l5 5 5-5" stroke="#8B7355" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  wrap.appendChild(trigger);

  // Build dropdown panel
  const panel = document.createElement('div');
  panel.className = 'cs-panel';
  panel.setAttribute('role', 'listbox');

  Array.from(native.children).forEach(child => {
    if (child.tagName !== 'OPTGROUP') return;
    const group = document.createElement('div');
    group.className = 'cs-group';

    const groupLabel = document.createElement('div');
    groupLabel.className = 'cs-group-label';
    groupLabel.textContent = child.label;
    group.appendChild(groupLabel);

    Array.from(child.children).forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cs-option';
      btn.dataset.value = opt.value;
      btn.setAttribute('role', 'option');

      const sep = opt.value.lastIndexOf(' — ');
      const name  = sep > -1 ? opt.value.slice(0, sep) : opt.value;
      const price = sep > -1 ? opt.value.slice(sep + 3) : '';

      btn.innerHTML = `<span class="cs-option-name">${name}</span>${price ? `<span class="cs-option-price">${price}</span>` : ''}`;
      group.appendChild(btn);
    });

    panel.appendChild(group);
  });
  wrap.appendChild(panel);

  // Open / close helpers
  function openPanel() {
    panel.classList.add('is-open');
    trigger.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    panel.classList.remove('is-open');
    trigger.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  // Toggle on trigger click
  trigger.addEventListener('click', () => {
    panel.classList.contains('is-open') ? closePanel() : openPanel();
  });

  // Select an option
  panel.addEventListener('click', e => {
    const opt = e.target.closest('.cs-option');
    if (!opt) return;
    const val = opt.dataset.value;
    native.value = val;
    const label = trigger.querySelector('.cs-trigger-text');
    const sep = val.lastIndexOf(' — ');
    label.textContent = sep > -1 ? val.slice(0, sep) : val;
    label.classList.remove('is-placeholder');
    panel.querySelectorAll('.cs-option').forEach(o => o.classList.remove('is-selected'));
    opt.classList.add('is-selected');
    closePanel();
    native.dispatchEvent(new Event('change'));
  });

  // Reset custom UI when form resets
  native.closest('form').addEventListener('reset', () => {
    setTimeout(() => {
      const label = trigger.querySelector('.cs-trigger-text');
      label.textContent = '— აირჩიეთ სერვისი —';
      label.classList.add('is-placeholder');
      panel.querySelectorAll('.cs-option').forEach(o => o.classList.remove('is-selected'));
    }, 0);
  });

  // Close on outside click or Escape
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) closePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
}

/* ============================================================
   6. SCROLL REVEAL — fade-in elements as they enter the viewport
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
  initCustomServiceSelect();
  initBookingForm();
  initScrollReveal();
});
