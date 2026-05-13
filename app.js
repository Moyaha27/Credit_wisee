/**
 * Moyahasetupfuture - Application Logic
 * Production-ready JavaScript with modular architecture
 */

// ============================================================
// EMAILJS CONFIGURATION
// ============================================================
const CONFIG = {
  emailjs: {
    publicKey: 'YOUR_PUBLIC_KEY', // Replace with environment variable
    serviceId: 'YOUR_SERVICE_ID',
    appTemplateId: 'YOUR_APPLICATION_TEMPLATE_ID',
    contactTemplateId: 'YOUR_CONTACT_TEMPLATE_ID',
  },
};

const isConfigured = !CONFIG.emailjs.publicKey.includes('YOUR_');

if (isConfigured) {
  emailjs.init({ publicKey: CONFIG.emailjs.publicKey });
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================
const Validators = {
  /**
   * Validate South African ID number (13-digit checksum)
   */
  validateSAID: (id) => {
    if (!/^\d{13}$/.test(id)) return false;

    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let digit = parseInt(id[i], 10);
      // Double every second digit
      if (i % 2 === 0) digit *= 2;
      // If result > 9, subtract 9
      if (digit > 9) digit -= 9;
      sum += digit;
    }

    // Last digit should make sum divisible by 10
    return sum % 10 === 0;
  },

  /**
   * Validate South African phone number
   * Accepts: 0741234567, +27741234567, 27741234567
   */
  validatePhoneNumber: (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+?27|0)[0-9]{9}$/;
    return phoneRegex.test(cleaned);
  },

  /**
   * Validate email format
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if field is empty
   */
  isEmpty: (value) => {
    return value === null || value === undefined || value.toString().trim() === '';
  },
};

// ============================================================
// FORM HANDLER MODULE
// ============================================================
const FormHandler = (() => {
  let toastTimer = null;
  let isSubmitting = false;

  const showToast = (title, msg, isError = false) => {
    clearTimeout(toastTimer);
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');

    if (!toast) return;

    toastTitle.textContent = title;
    toastMsg.textContent = msg;
    toast.style.borderColor = isError ? '#FF4466' : 'var(--aqua-dark)';
    toastTitle.style.color = isError ? '#FF4466' : 'var(--aqua)';
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  };

  const validateForm = (fieldIds, selectIds = []) => {
    const errors = {};
    let isValid = true;

    // Validate text inputs
    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const value = el.value.trim();
      el.classList.remove('error');

      if (Validators.isEmpty(value)) {
        el.classList.add('error');
        errors[id] = 'This field is required';
        isValid = false;
      } else if (id === 'appEmail' || id === 'contactEmail') {
        if (!Validators.validateEmail(value)) {
          el.classList.add('error');
          errors[id] = 'Invalid email address';
          isValid = false;
        }
      } else if (id === 'appPhone' || id === 'contactPhone') {
        if (value && !Validators.validatePhoneNumber(value)) {
          el.classList.add('error');
          errors[id] = 'Invalid South African phone number';
          isValid = false;
        }
      } else if (id === 'appId') {
        if (!Validators.validateSAID(value)) {
          el.classList.add('error');
          errors[id] = 'Invalid SA ID number';
          isValid = false;
        }
      }
    });

    // Validate selects
    selectIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.classList.remove('error');
      if (!el.value) {
        el.classList.add('error');
        errors[id] = 'Please select an option';
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  const submitApplication = async (e) => {
    if (e) e.preventDefault();

    if (isSubmitting) return;

    const validation = validateForm(
      ['firstName', 'lastName', 'appEmail', 'appPhone', 'appInstitution', 'appId'],
      ['appYear', 'appAmount', 'appPurpose']
    );

    if (!validation.isValid) {
      showToast('Validation Error', 'Please fix all errors and try again.', true);
      return;
    }

    if (!isConfigured) {
      showToast('Not Configured', 'EmailJS setup required. Check documentation.', true);
      return;
    }

    isSubmitting = true;
    const btn = document.getElementById('applyBtn');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
      const params = {
        from_name:
          document.getElementById('firstName').value +
          ' ' +
          document.getElementById('lastName').value,
        from_email: document.getElementById('appEmail').value,
        phone: document.getElementById('appPhone').value,
        institution: document.getElementById('appInstitution').value,
        study_year: document.getElementById('appYear').value,
        loan_amount: document.getElementById('appAmount').value,
        loan_purpose: document.getElementById('appPurpose').value,
        id_number: document.getElementById('appId').value,
        to_email: 'Moyahasetupfuture@gmail.com',
      };

      await emailjs.send(
        CONFIG.emailjs.serviceId,
        CONFIG.emailjs.appTemplateId,
        params
      );

      document.getElementById('applyForm').style.display = 'none';
      document.getElementById('successMsg').style.display = 'block';
      showToast('Application Submitted!', 'We will contact you within 24 hours.');

      // Reset form after success
      document.getElementById('applicationForm').reset();
    } catch (err) {
      console.error('Application submission error:', err);
      showToast(
        'Submission Failed',
        'Error: ' + (err.text || 'Please try again later.'),
        true
      );
    } finally {
      isSubmitting = false;
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();

    if (isSubmitting) return;

    const validation = validateForm(['contactName', 'contactEmail', 'contactMsg']);

    if (!validation.isValid) {
      showToast('Validation Error', 'Please fill all required fields.', true);
      return;
    }

    if (!isConfigured) {
      showToast('Not Configured', 'EmailJS setup required. Check documentation.', true);
      return;
    }

    isSubmitting = true;
    const btn = document.getElementById('sendBtn');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
      const params = {
        from_name: document.getElementById('contactName').value,
        from_email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value || 'Not provided',
        subject: document.getElementById('contactSubject').value || 'General Enquiry',
        message: document.getElementById('contactMsg').value,
        to_email: 'Moyahasetupfuture@gmail.com',
      };

      await emailjs.send(
        CONFIG.emailjs.serviceId,
        CONFIG.emailjs.contactTemplateId,
        params
      );

      document.getElementById('contactForm').reset();
      showToast('Message Sent! ✓', "We'll reply to " + params.from_email + ' shortly.');
    } catch (err) {
      console.error('Contact message error:', err);
      showToast(
        'Send Failed',
        'Error: ' + (err.text || 'Please try again later.'),
        true
      );
    } finally {
      isSubmitting = false;
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  return {
    showToast,
    submitApplication,
    sendMessage,
  };
})();

// ============================================================
// CALCULATOR MODULE
// ============================================================
const Calculator = (() => {
  const updateCalc = () => {
    const amountSlider = document.getElementById('amountSlider');
    const termSlider = document.getElementById('termSlider');
    const rateSlider = document.getElementById('rateSlider');

    if (!amountSlider || !termSlider || !rateSlider) return;

    const amount = parseFloat(amountSlider.value);
    const months = parseInt(termSlider.value, 10);
    const annualRate = parseFloat(rateSlider.value);

    // Monthly rate (annual / 12 / 100)
    const mr = annualRate / 100 / 12;

    // Monthly payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthly =
      mr === 0 ? amount / months : (amount * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);

    const total = monthly * months;
    const interest = total - amount;

    // Update display
    document.getElementById('loanAmount').value = 'R ' + amount.toLocaleString('en-ZA');
    document.getElementById('loanTerm').value = months + ' Months';
    document.getElementById('loanRate').value = annualRate + '%';
    document.getElementById('monthlyResult').textContent =
      'R ' + monthly.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
    document.getElementById('principalVal').textContent = 'R ' + amount.toLocaleString('en-ZA');
    document.getElementById('interestVal').textContent = 'R ' + interest.toLocaleString('en-ZA', {
      maximumFractionDigits: 0,
    });
    document.getElementById('totalVal').textContent = 'R ' + total.toLocaleString('en-ZA', {
      maximumFractionDigits: 0,
    });
    document.getElementById('termVal').textContent = months + ' Months';
  };

  const init = () => {
    const amountSlider = document.getElementById('amountSlider');
    const termSlider = document.getElementById('termSlider');
    const rateSlider = document.getElementById('rateSlider');

    if (!amountSlider || !termSlider || !rateSlider) return;

    amountSlider.addEventListener('input', updateCalc);
    termSlider.addEventListener('input', updateCalc);
    rateSlider.addEventListener('input', updateCalc);

    // Initial calculation
    updateCalc();
  };

  return { init, updateCalc };
})();

// ============================================================
// NAVIGATION MODULE
// ============================================================
const Navigation = (() => {
  const toggleMenu = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('menuToggle');

    if (!mobileMenu || !hamburger) return;

    const isOpen = mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', !isOpen);
  };

  const closeMenu = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('menuToggle');

    if (mobileMenu) {
      mobileMenu.classList.remove('open');
    }
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
    }
  };

  const init = () => {
    const hamburger = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger) {
      hamburger.addEventListener('click', toggleMenu);
    }

    if (mobileMenu) {
      const links = mobileMenu.querySelectorAll('a');
      links.forEach((link) => {
        link.addEventListener('click', closeMenu);
      });
    }

    // Close menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    });
  };

  return { init, toggleMenu, closeMenu };
})();

// ============================================================
// ANIMATION MODULE
// ============================================================
const AnimationHandler = (() => {
  const initScrollAnimations = () => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll('.service-card, .edu-card').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      obs.observe(el);
    });
  };

  return { initScrollAnimations };
})();

// ============================================================
// ERROR HANDLING
// ============================================================
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  Navigation.init();
  Calculator.init();
  AnimationHandler.initScrollAnimations();

  // Setup form event listeners
  const applicationForm = document.getElementById('applicationForm');
  const contactForm = document.getElementById('contactForm');

  if (applicationForm) {
    applicationForm.addEventListener('submit', FormHandler.submitApplication);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', FormHandler.sendMessage);
  }

  // For accessibility: focus management
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus();
  }
});
