/* ==============================================
   HS Transport — main.js
   Navigation, FAQ, Wizard, Validation, FormSubmit
   ============================================== */

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // CONFIG — Web3Forms
  // Clé à récupérer sur https://web3forms.com (gratuit)
  // ──────────────────────────────────────────────
const WEB3FORMS_KEY = '5b428b3d-61a8-474c-a91b-323ce318dced';
  const COMPANY_PHONE = '07 52 90 61 37';

  // Service labels
  const SERVICE_LABELS = {
    'demenagement': 'Déménagement',
    'transport': 'Transport',
    'livraison': 'Livraison',
    'location': 'Location',
    'montage-demontage': 'Montage & démontage'
  };

  const TYPE_RDV_LABELS = {
    'appel': 'Appel téléphonique',
    'visite': 'Visite technique'
  };

  // ──────────────────────────────────────────────
  // HEADER SCROLL EFFECT
  // ──────────────────────────────────────────────
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ──────────────────────────────────────────────
  // MOBILE NAV TOGGLE
  // ──────────────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    });

    // Close nav on link click (mobile)
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ──────────────────────────────────────────────
  // FAQ ACCORDION
  // ──────────────────────────────────────────────
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ──────────────────────────────────────────────
  // VALIDATION HELPERS
  // ──────────────────────────────────────────────
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    // French phone: at least 10 digits
    return /^[\d\s.+()-]{10,}$/.test(phone);
  }

  function setError(field, show) {
    const group = field.closest('.form-group');
    if (!group) return;
    if (show) {
      group.classList.add('has-error');
    } else {
      group.classList.remove('has-error');
    }
  }

  function validateField(field) {
    if (!field.required && !field.value) return true;

    let valid = true;

    if (field.required && !field.value.trim()) {
      valid = false;
    } else if (field.type === 'email' && !isValidEmail(field.value)) {
      valid = false;
    } else if (field.type === 'tel' && field.required && !isValidPhone(field.value)) {
      valid = false;
    }

    setError(field, !valid);
    return valid;
  }

  function validateFields(container) {
    let allValid = true;
    const fields = container.querySelectorAll('input[required], select[required], textarea[required]');
    fields.forEach(function (field) {
      if (!validateField(field)) {
        allValid = false;
      }
    });
    return allValid;
  }

  // Live validation — remove error on input
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      if (field.closest('.form-group').classList.contains('has-error')) {
        validateField(field);
      }
    });
  });

  // ──────────────────────────────────────────────
  // HONEYPOT CHECK
  // ──────────────────────────────────────────────
  function isHoneypotFilled(form) {
    const honeypots = form.querySelectorAll('.ohnohoney input');
    for (let i = 0; i < honeypots.length; i++) {
      if (honeypots[i].value) return true;
    }
    return false;
  }

  // ──────────────────────────────────────────────
  // GET CURRENT DATE/TIME
  // ──────────────────────────────────────────────
  function getSubmissionDate() {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ──────────────────────────────────────────────
  // RDV FORM — WIZARD
  // ──────────────────────────────────────────────
  const rdvForm = document.getElementById('rdvForm');
  const step1Panel = document.getElementById('step1');
  const step2Panel = document.getElementById('step2');
  const toStep2Btn = document.getElementById('toStep2');
  const backStep1Btn = document.getElementById('backStep1');
  const wizardSteps = document.querySelectorAll('.wizard-step');

  // Pre-fill service from URL params
  if (rdvForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    const serviceSelect = document.getElementById('service');
    if (serviceParam && serviceSelect) {
      const option = serviceSelect.querySelector('option[value="' + serviceParam + '"]');
      if (option) serviceSelect.value = serviceParam;
    }

    // Set min date to today
    const dateRdv = document.getElementById('dateRdv');
    const datePrestation = document.getElementById('datePrestation');
    const today = new Date().toISOString().split('T')[0];
    if (dateRdv) dateRdv.min = today;
    if (datePrestation) datePrestation.min = today;
  }

  function goToStep(stepNum) {
    if (stepNum === 2) {
      step1Panel.classList.remove('active');
      step2Panel.classList.add('active');
      wizardSteps[0].classList.remove('active');
      wizardSteps[0].classList.add('done');
      wizardSteps[1].classList.add('active');
      showOptionsForService();
    } else {
      step2Panel.classList.remove('active');
      step1Panel.classList.add('active');
      wizardSteps[1].classList.remove('active');
      wizardSteps[0].classList.remove('done');
      wizardSteps[0].classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (toStep2Btn) {
    toStep2Btn.addEventListener('click', function () {
      if (validateFields(step1Panel)) {
        goToStep(2);
      }
    });
  }

  if (backStep1Btn) {
    backStep1Btn.addEventListener('click', function () {
      goToStep(1);
    });
  }

  // ──────────────────────────────────────────────
  // DYNAMIC OPTIONS BASED ON SERVICE
  // ──────────────────────────────────────────────
  function showOptionsForService() {
    const service = document.getElementById('service');
    if (!service) return;

    const val = service.value;
    const optDem = document.getElementById('optionsDemenagement');
    const optTrans = document.getElementById('optionsTransport');
    const optLoc = document.getElementById('optionsLocation');
    const optMont = document.getElementById('optionsMontage');

    if (optDem) optDem.style.display = 'none';
    if (optTrans) optTrans.style.display = 'none';
    if (optLoc) optLoc.style.display = 'none';
    if (optMont) optMont.style.display = 'none';

    if (val === 'demenagement' && optDem) optDem.style.display = 'block';
    if ((val === 'transport' || val === 'livraison') && optTrans) optTrans.style.display = 'block';
    if (val === 'location' && optLoc) optLoc.style.display = 'block';
    if (val === 'montage-demontage' && optMont) optMont.style.display = 'block';
  }

  // Also listen to service change
  const serviceSelect = document.getElementById('service');
  if (serviceSelect) {
    serviceSelect.addEventListener('change', showOptionsForService);
  }

  // ──────────────────────────────────────────────
  // COLLECT CHECKED OPTIONS
  // ──────────────────────────────────────────────
  function getCheckedOptions(form) {
    const options = [];
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      if (cb.name === 'rgpd' || cb.name === 'contactRgpd') return;
      const label = cb.closest('label');
      if (label) {
        options.push(label.textContent.trim());
      }
    });
    return options.join(', ') || 'Aucune';
  }

  // ──────────────────────────────────────────────
  // WEB3FORMS — SEND HELPER
  // ──────────────────────────────────────────────
  function sendForm(data) {
    data.access_key = WEB3FORMS_KEY;
    data.from_name = 'HS Transport - Site Web';
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) { return res.json(); });
  }

  // ──────────────────────────────────────────────
  // RDV FORM SUBMIT
  // ──────────────────────────────────────────────
  if (rdvForm) {
    rdvForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot
      if (isHoneypotFilled(rdvForm)) return;

      // Validate step 2
      if (!validateFields(step2Panel)) return;

      // RGPD check
      const rgpd = document.getElementById('rgpd');
      const rgpdError = document.getElementById('rgpdError');
      if (!rgpd.checked) {
        rgpdError.style.display = 'block';
        return;
      }
      rgpdError.style.display = 'none';

      // Collect data
      const service = document.getElementById('service').value;
      const typeRdv = document.getElementById('typeRdv').value;
      const dateRdv = document.getElementById('dateRdv').value;
      const creneau = document.getElementById('creneau').value;
      const nom = document.getElementById('nom').value;
      const prenom = document.getElementById('prenom').value;
      const telephone = document.getElementById('telephone').value;
      const email = document.getElementById('email').value;
      const villeDepart = document.getElementById('villeDepart').value;
      const villeArrivee = document.getElementById('villeArrivee').value || '—';
      const datePrestation = document.getElementById('datePrestation').value || '—';
      const description = document.getElementById('description').value;
      const options = getCheckedOptions(rdvForm);
      const dureeLocation = document.getElementById('dureeLocation') ? document.getElementById('dureeLocation').value : '';
      const submissionDate = getSubmissionDate();

      // Disable submit button
      const submitBtn = document.getElementById('submitRdv');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours…';

      // Send via Web3Forms
      sendForm({
        subject: 'Nouvelle demande RDV – ' + SERVICE_LABELS[service] + ' – ' + nom + ' ' + prenom + ' – ' + dateRdv + ' ' + creneau,
        replyto: email,
        Service: SERVICE_LABELS[service] || service,
        'Type RDV': TYPE_RDV_LABELS[typeRdv] || typeRdv,
        'Date RDV': dateRdv,
        'Créneau': creneau.replace('-', 'h – ') + 'h',
        Nom: nom + ' ' + prenom,
        'Téléphone': telephone,
        'Email client': email,
        'Ville départ': villeDepart,
        'Ville arrivée': villeArrivee,
        'Date prestation': datePrestation,
        Description: description,
        Options: options,
        'Durée location': dureeLocation,
        'Date soumission': submissionDate
      }).then(function (res) {
        if (res.success) showRdvConfirmation();
        else { console.error('Web3Forms:', res); showRdvConfirmation(); }
      }).catch(function (err) {
        console.error('Web3Forms error:', err);
        showRdvConfirmation();
      });
    });
  }

  function showRdvConfirmation() {
    var formSection = document.getElementById('formSection');
    var confirmSection = document.getElementById('confirmSection');
    if (formSection) formSection.style.display = 'none';
    if (confirmSection) confirmSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ──────────────────────────────────────────────
  // CONTACT FORM SUBMIT
  // ──────────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot
      if (isHoneypotFilled(contactForm)) return;

      // Validate
      if (!validateFields(contactForm)) return;

      // RGPD check
      const rgpd = document.getElementById('contactRgpd');
      const rgpdError = document.getElementById('contactRgpdError');
      if (!rgpd.checked) {
        rgpdError.style.display = 'block';
        return;
      }
      rgpdError.style.display = 'none';

      // Collect data
      const nom = document.getElementById('contactNom').value;
      const email = document.getElementById('contactEmail').value;
      const tel = document.getElementById('contactTel').value;
      const message = document.getElementById('contactMessage').value;
      const submissionDate = getSubmissionDate();

      // Disable button
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours…';

      // Send via Web3Forms
      sendForm({
        subject: 'Nouveau message – Contact – ' + nom,
        replyto: email,
        Nom: nom,
        Email: email,
        'Téléphone': tel,
        Message: message,
        'Date soumission': submissionDate
      }).then(function (res) {
        if (res.success) showContactConfirmation();
        else { console.error('Web3Forms:', res); showContactConfirmation(); }
      }).catch(function (err) {
        console.error('Web3Forms error:', err);
        showContactConfirmation();
      });
    });
  }

  function showContactConfirmation() {
    var formSection = document.getElementById('contactFormSection');
    var confirmSection = document.getElementById('contactConfirm');
    if (formSection) formSection.style.display = 'none';
    if (confirmSection) confirmSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

})();
