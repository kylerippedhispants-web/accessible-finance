(function () {
  'use strict';

  function initializeMenu() {
    const button = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    function close() {
      menu.classList.remove('open');
      button.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }

    button.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      button.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1360) close();
    });
  }

  function initializeAnchors() {
    document.querySelectorAll('a[href*="#"]').forEach((link) => {
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;

      link.addEventListener('click', (event) => {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        event.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        window.history.replaceState(null, '', url.hash);
      });
    });
  }

  function initializeNewsletter() {
    const overlay = document.getElementById('nlOverlay');
    const closeButton = document.getElementById('nlClose');
    if (!overlay || !closeButton) return;
    let lastFocused = null;

    function open(event) {
      event?.preventDefault();
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      document.body.classList.add('newsletter-open');
      closeButton.focus();
    }

    function close() {
      overlay.classList.remove('open');
      document.body.classList.remove('newsletter-open');
      lastFocused?.focus?.();
    }

    document.querySelectorAll('[data-open-newsletter]').forEach((trigger) => trigger.addEventListener('click', open));
    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function initialize() {
    initializeMenu();
    initializeAnchors();
    initializeNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
