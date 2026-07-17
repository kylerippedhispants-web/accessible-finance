(function () {
  'use strict';

  const storageKey = 'accessibleFinanceRegion';
  const validRegions = new Set(['ca', 'us']);
  const regionDetails = {
    ca: {
      code: 'CA',
      name: 'Canada',
      flagClass: 'region-flag-ca',
      description: 'RRSP, TFSA, Canadian taxes and provincial tools.',
    },
    us: {
      code: 'US',
      name: 'United States',
      flagClass: 'region-flag-us',
      description: '401(k), IRA, HSA and U.S. tax basics.',
    },
  };

  let modal = null;
  let lastFocusedElement = null;
  let regionMenuCount = 0;

  function getSavedRegion() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return validRegions.has(saved) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function saveRegion(region) {
    try {
      window.localStorage.setItem(storageKey, region);
    } catch (_) {
      // The chooser still works for this visit when storage is unavailable.
    }
  }

  function getCurrentRegion() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return /(^|\/)us(\/|$)/i.test(path) ? 'us' : 'ca';
  }

  function getSiteRoot() {
    return getCurrentRegion() === 'us'
      ? new URL('../', window.location.href)
      : new URL('./', window.location.href);
  }

  function getDestination(region) {
    const root = getSiteRoot();
    return region === 'us'
      ? new URL('us/index.html', root).href
      : new URL('index.html', root).href;
  }

  function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const button = document.getElementById('hamburger');
    if (!menu || !button) return;

    menu.classList.remove('open');
    button.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function selectRegion(region) {
    if (!validRegions.has(region)) return;

    saveRegion(region);
    if (region === getCurrentRegion()) {
      closeModal();
      closeMobileMenu();
      return;
    }

    window.location.assign(getDestination(region));
  }

  function closeRegionMenus(returnFocus) {
    document.querySelectorAll('[data-region-switcher].open').forEach((switcher) => {
      switcher.classList.remove('open');
      const button = switcher.querySelector('[data-region-trigger]');
      button?.setAttribute('aria-expanded', 'false');
      if (returnFocus) button?.focus();
    });
  }

  function getFocusableElements() {
    if (!modal || modal.hidden) return [];
    return Array.from(modal.querySelectorAll('button:not([hidden]), [href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.disabled && element.offsetParent !== null);
  }

  function handleModalKeydown(event) {
    if (!modal || modal.hidden) return;

    if (event.key === 'Escape') {
      if (modal.dataset.required !== 'true') closeModal();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function buildModal() {
    const currentRegion = getCurrentRegion();
    const overlay = document.createElement('div');
    overlay.className = 'region-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'region-title');
    overlay.setAttribute('aria-describedby', 'region-intro');
    overlay.innerHTML = `
      <div class="region-dialog">
        <button class="region-close" type="button" aria-label="Close edition chooser">&#x2715;</button>
        <div class="region-brand">
          <img src="${getCurrentRegion() === 'us' ? '../' : ''}Logo.png" alt="">
          <span>Accessible Finance</span>
        </div>
        <div class="region-eyebrow">Choose your edition</div>
        <h2 class="region-title" id="region-title">Where are you <em>investing?</em></h2>
        <p class="region-intro" id="region-intro">Choose the country that matches the accounts and tax rules you use.</p>
        <div class="region-choices">
          ${Object.entries(regionDetails).map(([region, details]) => `
            <button class="region-choice" type="button" data-region-choice="${region}" data-current="${region === currentRegion}">
              <span class="region-flag region-choice-flag ${details.flagClass}" aria-hidden="true"></span>
              <span class="region-choice-name">${details.name}</span>
              <span class="region-choice-copy">${details.description}</span>
              <span class="region-choice-status">Current edition</span>
              <span class="region-choice-arrow" aria-hidden="true">&rarr;</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    overlay.querySelector('.region-close').addEventListener('click', closeModal);
    overlay.querySelectorAll('[data-region-choice]').forEach((button) => {
      button.addEventListener('click', () => selectRegion(button.dataset.regionChoice));
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay && overlay.dataset.required !== 'true') closeModal();
    });
    document.addEventListener('keydown', handleModalKeydown);
    document.body.appendChild(overlay);
    return overlay;
  }

  function openModal(required) {
    if (!modal) modal = buildModal();
    lastFocusedElement = document.activeElement;
    modal.dataset.required = String(Boolean(required));
    modal.hidden = false;
    document.body.classList.add('region-dialog-open');

    window.requestAnimationFrame(() => {
      const preferred = modal.querySelector(`[data-region-choice="${getCurrentRegion()}"]`);
      preferred?.focus();
    });
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('region-dialog-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function buildDesktopSwitcher() {
    const actions = document.querySelector('.nav-actions');
    if (!actions || actions.querySelector('[data-region-switcher]')) return;

    const current = regionDetails[getCurrentRegion()];
    const menuId = `region-menu-${++regionMenuCount}`;
    const switcher = document.createElement('div');
    switcher.className = 'region-switcher notranslate';
    switcher.dataset.regionSwitcher = '';
    switcher.setAttribute('translate', 'no');
    switcher.innerHTML = `
      <button class="region-trigger" type="button" data-region-trigger aria-label="Edition: ${current.name}. Choose edition" aria-haspopup="listbox" aria-expanded="false" aria-controls="${menuId}">
        <span class="region-flag ${current.flagClass}" aria-hidden="true"></span>
        <span>${current.code}</span>
      </button>
      <div class="region-menu" id="${menuId}" role="listbox" aria-label="Choose edition">
        ${Object.entries(regionDetails).map(([region, details]) => `
          <button class="region-option" type="button" role="option" data-region-option="${region}" aria-selected="${region === getCurrentRegion()}">
            <span class="region-flag ${details.flagClass}" aria-hidden="true"></span>
            <span class="region-option-name">${details.name}</span>
            <span class="region-option-code">${details.code}</span>
          </button>
        `).join('')}
      </div>
    `;

    const button = switcher.querySelector('[data-region-trigger]');
    const options = Array.from(switcher.querySelectorAll('[data-region-option]'));

    function openMenu(focusOption) {
      closeRegionMenus(false);
      switcher.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
      if (focusOption) {
        (options.find((option) => option.getAttribute('aria-selected') === 'true') || options[0])?.focus();
      }
    }

    button.addEventListener('click', () => {
      if (switcher.classList.contains('open')) closeRegionMenus(false);
      else openMenu(false);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openMenu(true);
      }
    });

    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        closeRegionMenus(false);
        selectRegion(option.dataset.regionOption);
      });
      option.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const direction = event.key === 'ArrowDown' ? 1 : -1;
          options[(index + direction + options.length) % options.length].focus();
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          options[event.key === 'Home' ? 0 : options.length - 1].focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeRegionMenus(true);
        }
      });
    });

    switcher.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!switcher.contains(document.activeElement)) closeRegionMenus(false);
      }, 0);
    });

    const social = actions.querySelector('.nav-social');
    const language = actions.querySelector('.language-switcher');
    if (social) social.insertAdjacentElement('afterend', switcher);
    else actions.insertBefore(switcher, language || actions.firstChild);
  }

  function buildMobileSwitcher() {
    const menu = document.getElementById('mobile-menu');
    if (!menu || menu.querySelector('[data-mobile-region]')) return;

    const currentRegion = getCurrentRegion();
    const switcher = document.createElement('div');
    switcher.className = 'mobile-region notranslate';
    switcher.dataset.mobileRegion = '';
    switcher.setAttribute('translate', 'no');
    switcher.innerHTML = `
      <span class="mobile-region-label">Edition</span>
      <div class="mobile-region-options" role="group" aria-label="Choose edition">
        ${Object.entries(regionDetails).map(([region, details]) => `
          <button class="mobile-region-option" type="button" data-mobile-region-choice="${region}" aria-pressed="${region === currentRegion}">
            <span class="region-flag ${details.flagClass}" aria-hidden="true"></span>
            <span>${details.code}</span>
          </button>
        `).join('')}
      </div>
    `;
    switcher.querySelectorAll('[data-mobile-region-choice]').forEach((button) => {
      button.addEventListener('click', () => selectRegion(button.dataset.mobileRegionChoice));
    });

    const language = menu.querySelector('.mobile-language');
    menu.insertBefore(switcher, language || menu.lastElementChild);
  }

  function initialize() {
    const savedRegion = getSavedRegion();
    if (savedRegion && savedRegion !== getCurrentRegion() && document.body.hasAttribute('data-region-home')) {
      window.location.replace(getDestination(savedRegion));
      return;
    }

    buildDesktopSwitcher();
    buildMobileSwitcher();
    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-region-switcher]')) closeRegionMenus(false);
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal && !modal.hidden) return;
      if (event.key === 'Escape') closeRegionMenus(true);
    });
    if (!savedRegion) openModal(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
