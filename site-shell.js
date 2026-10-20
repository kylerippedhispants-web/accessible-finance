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

  function initializePlannerNavigation() {
    const plannerHref = new URL('planner/', shellSource).href;
    const plannerLabel = isUsSite ? 'Canadian Planner' : 'Planner';

    function addLink(container, beforeSelector) {
      if (!container || container.querySelector('[data-planner-link]')) return;
      const link = document.createElement('a');
      link.href = plannerHref;
      link.textContent = plannerLabel;
      link.dataset.plannerLink = '';
      const before = beforeSelector ? container.querySelector(beforeSelector) : null;
      container.insertBefore(link, before);
    }

    addLink(document.querySelector('.nav-links'), '[data-region-rewards]');
    addLink(document.getElementById('mobile-menu'), '[data-region-rewards]');

    document.querySelectorAll('footer.site-footer .footer-col').forEach((column) => {
      const list = column.querySelector('ul');
      if (!list || list.querySelector('[data-planner-link]') || !list.querySelector('a[href*="cash-flow"]')) return;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = plannerHref;
      link.textContent = plannerLabel;
      link.dataset.plannerLink = '';
      item.appendChild(link);
      const cashFlowItem = list.querySelector('a[href*="cash-flow"]')?.closest('li');
      cashFlowItem?.insertAdjacentElement('afterend', item);
    });
  }

  function initializeSimpleNavigation() {
    const universal = document.body.hasAttribute('data-region-universal');
    let edition = new URLSearchParams(location.search).get('edition');
    if (universal && !['ca', 'us'].includes(edition)) {
      try { edition = localStorage.getItem('accessibleFinanceRegion'); } catch (_) { edition = 'ca'; }
    }
    const us = isUsSite || (universal && edition === 'us');
    const root = (path) => new URL(path, shellSource).href;
    const groups = [
      ['Learn', us
        ? [['U.S. account guide', 'us/accounts.html'], ['FIRE explained', 'us/fire.html'], ['Newsletter articles', 'journal.html']]
        : [['Start with the basics', 'start-here.html'], ['All guides', 'articles.html'], ['Glossary', 'index.html#glossary'], ['Newsletter articles', 'journal.html']]],
      ['Tools', us
        ? [['U.S. tax estimate', 'us/tax-calculator.html'], ['Cash flow', 'cash-flow.html?edition=us'], ['Quick FIRE calculator', 'us/fire.html#fire-planner']]
        : [['Canadian tax estimate', 'tax-calculator.html'], ['Cash flow', 'cash-flow.html?edition=ca'], ['Quick FIRE calculator', 'fire.html#fire-calculator'], ['Wealth context', 'wealth-rank.html']]],
    ];
    const normalize = (url) => new URL(url, location.href).pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    function makeLink(label, path) {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = root(path);
      if (normalize(link.href) === normalize(location.href) && !link.hash) link.setAttribute('aria-current', 'page');
      return link;
    }
    function fill(container, mobile) {
      if (!container) return;
      Array.from(container.children).forEach((child) => {
        if (!mobile || (child.tagName === 'A' && !child.hasAttribute('data-open-newsletter'))) child.remove();
      });
      const fragment = document.createDocumentFragment();
      groups.forEach(([label, links]) => {
        const details = document.createElement('details');
        details.className = 'nav-group';
        const summary = document.createElement('summary');
        summary.textContent = label;
        const list = document.createElement('div');
        list.className = 'nav-group-links';
        links.forEach(([text, path]) => list.appendChild(makeLink(text, path)));
        details.append(summary, list);
        details.addEventListener('toggle', () => {
          if (details.open) container.querySelectorAll('.nav-group[open]').forEach((other) => {
            if (other !== details) other.open = false;
          });
        });
        details.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && details.open) {
            event.stopPropagation();
            details.open = false;
            summary.focus();
          }
        });
        details.addEventListener('focusout', () => {
          window.setTimeout(() => {
            if (!mobile && !details.contains(document.activeElement)) details.open = false;
          }, 0);
        });
        fragment.appendChild(details);
      });
      const planner = makeLink(us ? 'Canadian Planner' : 'Planner', 'planner/');
      planner.dataset.plannerLink = '';
      fragment.append(planner, makeLink('About', 'about.html'));
      container.prepend(fragment);
    }
    fill(document.querySelector('.nav-links'), false);
    fill(document.getElementById('mobile-menu'), true);
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.nav-links .nav-group[open]').forEach((group) => {
        if (!group.contains(event.target)) group.open = false;
      });
    });
    document.querySelectorAll('footer a').forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      if (label === 'beginner' || label === 'intermediate') link.href = root(`articles.html?cat=${label}`);
    });
  }

  function initializeAnchorNavigation() {
    // Capture before legacy per-page smooth-scroll handlers. Moving focus is
    // essential: scrolling alone leaves keyboard users in the navigation.
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('data-open-newsletter') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href, location.href);
      const documentPath = (path) => path.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '');
      if (destination.origin !== location.origin || documentPath(destination.pathname) !== documentPath(location.pathname)) return;
      const hash = destination.hash;
      if (!hash || hash === '#') return;
      let target;
      try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return; }
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      for (let ancestor = target.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      }
      const menu = document.getElementById('mobile-menu');
      if (menu?.contains(link)) {
        menu.classList.remove('open');
        const button = document.getElementById('hamburger');
        button?.classList.remove('open');
        button?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      const toc = link.closest('details');
      if (toc && !toc.contains(target) && (toc.classList.contains('nav-group')
        || (toc.classList.contains('toc') && matchMedia('(max-width: 1024px)').matches))) toc.open = false;
      history.pushState(null, '', hash);
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches || link.classList.contains('skip-link') ? 'instant' : 'smooth', block: 'start' });
    }, true);
  }

  function initializeScrollableTables() {
    document.querySelectorAll('.table-scroll, .breakdown, #fire-projection').forEach((region) => {
      if (!region.querySelector('table')) return;
      region.tabIndex = 0;
      region.setAttribute('role', 'region');
      if (!region.hasAttribute('aria-label') && !region.hasAttribute('aria-labelledby')) {
        region.setAttribute('aria-label', 'Calculation details. Scroll horizontally to see all columns.');
      }
      if (!region.previousElementSibling?.classList.contains('table-scroll-hint')) {
        const hint = document.createElement('p');
        hint.className = 'table-scroll-hint';
        hint.textContent = 'More columns may be to the right. Swipe, or focus this table and use the arrow keys.';
        region.before(hint);
      }
    });
  }

  function initializePlannerBridge() {
    const pathname = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    const isGuide = /\/guides\/[^/]+$/.test(pathname);
    const isCalculator = /\/(?:fire|cash-flow)$/.test(pathname);
    const main = document.getElementById('main-content');
    if (!main || (!isGuide && !isCalculator) || document.getElementById('planner-bridge')) return;

    const section = document.createElement('aside');
    section.className = 'planner-bridge';
    section.id = 'planner-bridge';
    section.setAttribute('aria-labelledby', 'planner-bridge-title');
    const copy = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'planner-bridge-title';
    title.textContent = isGuide ? 'Put the idea into a bigger picture.' : 'Explore the longer-term picture.';
    const description = document.createElement('p');
    description.textContent = 'The Canadian FIRE planner connects income, spending, assets, and debts to an estimated financial independence year and amount.';
    const note = document.createElement('p');
    note.className = 'planner-bridge-note';
    note.textContent = isCalculator
      ? 'This calculator and the planner use separate inputs and models. Nothing transfers automatically. Start with the fictional demo.'
      : 'Try a fictional plan, inspect the assumptions, and compare scenarios. Educational estimates only.';
    copy.append(title, description, note);
    const link = document.createElement('a');
    link.className = 'journey-action';
    link.href = new URL('planner/', shellSource).href;
    link.textContent = 'Explore the Canadian planner';
    section.append(copy, link);
    const newsletter = main.querySelector('#newsletter');
    if (newsletter?.parentElement === main) main.insertBefore(section, newsletter);
    else main.appendChild(section);
  }

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
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) closeMenu(false);
    });

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
    // Inline signup sections use a dependable destination instead of an empty
    // third-party frame when scripts, cookies, or a narrow viewport block it.
    document.querySelectorAll('iframe[data-src*="accessiblefinance.substack.com"]').forEach((iframe) => {
      if (iframe.closest('.nl-overlay')) return;
      const link = document.createElement('a');
      link.className = 'newsletter-direct';
      link.href = 'https://accessiblefinance.substack.com/subscribe';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Subscribe on Substack (opens a new tab)';
      iframe.replaceWith(link);
    });
    document.querySelectorAll('.nl-overlay').forEach((overlay) => {
      const closeButton = overlay.querySelector('.nl-close');
      if (!closeButton) return;

      const triggers = document.querySelectorAll('[data-open-newsletter]');
      const description = overlay.querySelector('.nl-sub');
      const iframe = overlay.querySelector('iframe');
      const status = document.createElement('p');
      status.className = 'newsletter-loading';
      status.setAttribute('role', 'status');
      status.textContent = 'Loading the Substack signup form…';
      const fallback = document.createElement('a');
      fallback.className = 'newsletter-direct';
      fallback.href = 'https://accessiblefinance.substack.com/subscribe';
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      fallback.textContent = 'Subscribe on Substack (opens a new tab)';
      if (iframe) {
        iframe.before(status);
        iframe.after(fallback);
        iframe.addEventListener('load', () => {
          if (iframe.getAttribute('src')) status.hidden = true;
        });
        iframe.title = 'Subscribe to Accessible Finance on Substack';
      } else overlay.querySelector('.nl-modal')?.appendChild(fallback);
      let opener = null;
      let wasOpen = false;

      closeButton.type = 'button';
      if (description && !description.id) description.id = `${overlay.id || 'newsletter'}-description`;
      if (description) overlay.setAttribute('aria-describedby', description.id);

      function isOpen() {
        return overlay.classList.contains('open');
      }

      const compactNewsletter = matchMedia('(max-width: 480px)');
      function loadNewsletterForm() {
        if (isOpen() && iframe?.dataset.src && !compactNewsletter.matches) {
          status.hidden = false;
          iframe.src = iframe.dataset.src;
          delete iframe.dataset.src;
        }
      }
      compactNewsletter.addEventListener('change', loadNewsletterForm);

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
          loadNewsletterForm();
          window.requestAnimationFrame(() => closeButton.focus());
        } else if (!open && wasOpen && opener?.isConnected) {
          const focusTarget = opener.getClientRects().length > 0 ? opener : document.getElementById('hamburger');
          focusTarget?.focus();
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
    initializePlannerNavigation();
    initializeSimpleNavigation();
    initializeAnchorNavigation();
    initializeScrollableTables();
    initializePlannerBridge();
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
