(function () {
  'use strict';

  const isUsSite = /\/us(?:\/|$)/.test(window.location.pathname.replace(/\\/g, '/'));
  document.documentElement.classList.add(isUsSite ? 'site-us' : 'site-ca');

  const polishStyles = document.createElement('link');
  const shellSource = document.currentScript?.src || window.location.href;
  polishStyles.id = 'site-polish-styles';
  polishStyles.rel = 'stylesheet';
  polishStyles.href = new URL('site-polish.css?v=20260801', shellSource).href;
  if (!document.getElementById(polishStyles.id)) document.head.appendChild(polishStyles);

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function initializeMenu() {
    const button = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    button.type = 'button';
    document.querySelector?.('nav.site-nav')?.setAttribute('aria-label', 'Primary navigation');
    menu.setAttribute('role', 'navigation');
    menu.setAttribute('aria-label', 'Mobile navigation');

    function isOpen() {
      return button.getAttribute('aria-expanded') === 'true';
    }

    function getMenuFocusableElements() {
      return [button, ...menu.querySelectorAll(focusableSelector)].filter((element) => {
        return element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0;
      });
    }

    function syncMenuState() {
      const open = isOpen();
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
    }

    function closeMenu(returnFocus) {
      if (!isOpen()) return;
      menu.classList.remove('open');
      button.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      syncMenuState();
      if (returnFocus) button.focus();
    }

    const observer = new MutationObserver(syncMenuState);
    observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });

    document.addEventListener('keydown', (event) => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getMenuFocusableElements();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('focusin', (event) => {
      if (!isOpen() || document.body.classList.contains('newsletter-open')) return;
      if (event.target === button || menu.contains(event.target)) return;
      getMenuFocusableElements()[1]?.focus();
    });

    window.addEventListener('resize', () => {
      if (window.getComputedStyle(button).display === 'none') closeMenu(false);
    });

    syncMenuState();
  }

  function initializeNewsletterDialogs() {
    document.querySelectorAll('.nl-overlay').forEach((overlay) => {
      const closeButton = overlay.querySelector('.nl-close');
      if (!closeButton) return;

      const triggers = document.querySelectorAll('[data-open-newsletter]');
      const description = overlay.querySelector('.nl-sub');
      let opener = null;
      let wasOpen = false;

      closeButton.type = 'button';
      if (description && !description.id) description.id = `${overlay.id || 'newsletter'}-description`;
      if (description) overlay.setAttribute('aria-describedby', description.id);

      function isOpen() {
        return overlay.classList.contains('open');
      }

      function getFocusableElements() {
        return Array.from(overlay.querySelectorAll(focusableSelector)).filter((element) => {
          return !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true';
        });
      }

      function syncDialogState() {
        const open = isOpen();
        overlay.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('newsletter-open', open);

        if (open && !wasOpen) {
          window.requestAnimationFrame(() => closeButton.focus());
        } else if (!open && wasOpen && opener?.isConnected) {
          opener.focus();
          opener = null;
        }
        wasOpen = open;
      }

      triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          opener = trigger;
        });
      });

      overlay.addEventListener('keydown', (event) => {
        if (!isOpen()) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeButton.click();
          return;
        }
        if (event.key !== 'Tab') return;

        const focusable = getFocusableElements();
        if (!focusable.length) {
          event.preventDefault();
          closeButton.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      document.addEventListener('focusin', (event) => {
        if (isOpen() && !overlay.contains(event.target)) closeButton.focus();
      });

      const observer = new MutationObserver(syncDialogState);
      observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
      syncDialogState();
    });
  }

  function initializeRevealFallback() {
    if ('IntersectionObserver' in window) return;
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  }

  function initialize() {
    initializeMenu();
    initializeNewsletterDialogs();
    initializeRevealFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
