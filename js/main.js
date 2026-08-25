// Silas Wiesmann Eventtechnik — Site-Interaktionen

const GA_MEASUREMENT_ID = 'G-THWPVS0M8K';

function loadGoogleAnalytics() {
  if (window.gaLoaded || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.indexOf('XXXX') !== -1) return;
  window.gaLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky nav shadow/blur on scroll ---- */
  const nav = document.getElementById('siteNav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.style.display === 'flex';
      navLinks.style.display = open ? 'none' : 'flex';
      navLinks.style.cssText += open
        ? ''
        : 'position:absolute;top:100%;left:0;right:0;flex-direction:column;background:rgba(10,10,12,0.97);padding:24px 28px;gap:18px;border-bottom:1px solid rgba(255,255,255,0.08);';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth <= 720) navLinks.style.display = 'none';
    }));
  }

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---- Contact form (FormSubmit.co backend) ---- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const statusError = document.getElementById('formStatusError');
  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      status.classList.remove('show', 'ok');
      statusError.classList.remove('show');

      const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      })
        .then((res) => { if (!res.ok) throw new Error('Request failed'); })
        .then(() => {
          status.classList.add('show', 'ok');
          form.reset();
        })
        .catch(() => {
          statusError.classList.add('show');
          submitBtn.disabled = false;
        });
    });
  }

  /* ---- Zusatzpaket: Extras-Auswahl ---- */
  const extraToggles = document.querySelectorAll('.extra-toggle');
  const extrasChips = document.getElementById('extrasChips');
  const extrasEmpty = document.getElementById('extrasEmpty');
  const extrasCta = document.getElementById('extrasCta');
  const leistungSelect = document.getElementById('fType');
  const nachrichtField = document.getElementById('fMsg');

  if (extraToggles.length && extrasChips) {
    const getSelectedLabels = () =>
      Array.from(extraToggles).filter((t) => t.checked).map((t) => t.dataset.label);

    const renderChips = () => {
      const selected = getSelectedLabels();
      extrasChips.innerHTML = '';
      selected.forEach((label) => {
        const chip = document.createElement('span');
        chip.textContent = label;
        extrasChips.appendChild(chip);
      });
      if (extrasEmpty) extrasEmpty.style.display = selected.length ? 'none' : '';
    };

    extraToggles.forEach((t) => t.addEventListener('change', renderChips));
    renderChips();

    if (extrasCta) {
      extrasCta.addEventListener('click', (e) => {
        const selected = getSelectedLabels();
        if (!selected.length) return;
        e.preventDefault();

        if (leistungSelect) {
          const zusatzOption = Array.from(leistungSelect.options)
            .find((o) => o.value.startsWith('Zusatzpaket'));
          if (zusatzOption) leistungSelect.value = zusatzOption.value;
        }
        if (nachrichtField && !nachrichtField.value.includes('Gewünschte Extras:')) {
          nachrichtField.value = 'Gewünschte Extras: ' + selected.join(', ') + '.\n\n' + nachrichtField.value;
        }

        const kontakt = document.getElementById('kontakt');
        if (kontakt) kontakt.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { if (nachrichtField) nachrichtField.focus(); }, 450);
      });
    }
  }

  /* ---- Cookie consent ---- */
  initCookieConsent();
});

function initCookieConsent() {
  const STORAGE_KEY = 'swe_cookie_consent';
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const settingsPanel = document.getElementById('cookieSettings');
  const statsToggle = document.getElementById('statsToggle');
  const btnAcceptAll = document.getElementById('cookieAcceptAll');
  const btnRejectAll = document.getElementById('cookieRejectAll');
  const btnToggleSettings = document.getElementById('cookieToggleSettings');
  const btnSave = document.getElementById('cookieSave');
  const footerCookieLink = document.getElementById('footerCookieLink');

  const readConsent = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  };

  const saveConsent = (statistics) => {
    const consent = { necessary: true, statistics: !!statistics, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    applyConsent(consent);
    hideBanner();
  };

  const applyConsent = (consent) => {
    document.documentElement.dataset.statsConsent = consent.statistics ? 'true' : 'false';
    if (consent.statistics) loadGoogleAnalytics();
  };

  const showBanner = () => {
    banner.classList.add('show');
  };

  const hideBanner = () => {
    banner.classList.remove('show');
    settingsPanel.classList.remove('show');
    btnSave.style.display = 'none';
    btnToggleSettings.style.display = '';
  };

  const existing = readConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    setTimeout(showBanner, 600);
  }

  btnAcceptAll.addEventListener('click', () => saveConsent(true));
  btnRejectAll.addEventListener('click', () => saveConsent(false));

  btnToggleSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('show');
    const open = settingsPanel.classList.contains('show');
    btnSave.style.display = open ? '' : 'none';
    if (existing) statsToggle.checked = !!existing.statistics;
  });

  btnSave.addEventListener('click', () => saveConsent(statsToggle.checked));

  if (footerCookieLink) {
    footerCookieLink.addEventListener('click', (e) => {
      e.preventDefault();
      settingsPanel.classList.add('show');
      btnSave.style.display = '';
      if (existing) statsToggle.checked = !!existing.statistics;
      showBanner();
    });
  }
}
