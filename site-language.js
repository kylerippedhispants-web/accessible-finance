(function () {
  const storageKey = 'accessibleFinanceLanguage';
  const selectSelector = '[data-language-select]';
  const supportedLanguages = new Set(['en', 'fa', 'fr', 'de']);
  const translateCookie = 'googtrans';
  const languageLabels = {
    en: { code: 'EN', name: 'English', flag: 'language-flag-gb' },
    fa: { code: 'FA', name: 'Farsi', flag: 'language-flag-ir' },
    fr: { code: 'FR', name: 'French', flag: 'language-flag-fr' },
    de: { code: 'DE', name: 'German', flag: 'language-flag-de' },
  };
  let googleScriptRequested = false;
  let menuCount = 0;

  function getCookie(name) {
    return document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`));
  }

  function getSavedLanguage() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (supportedLanguages.has(saved)) return saved;
    } catch (_) {
      // Keep the language control usable when browser storage is unavailable.
    }

    const cookie = getCookie(translateCookie);
    if (cookie) {
      if (cookie.includes('/fa')) return 'fa';
      if (cookie.includes('/fr')) return 'fr';
      if (cookie.includes('/de')) return 'de';
    }
    return 'en';
  }

  function setTranslateCookie(language) {
    const value = language === 'en' ? '/en/en' : `/en/${language}`;
    const maxAge = language === 'en' ? '; max-age=0' : '; max-age=31536000';
    const base = `${translateCookie}=${value}; path=/${maxAge}; SameSite=Lax`;
    document.cookie = base;

    const host = window.location.hostname;
    if (host && host.includes('.')) {
      document.cookie = `${translateCookie}=${value}; path=/; domain=.${host}${maxAge}; SameSite=Lax`;
    }
  }

  function syncSelects(language) {
    document.querySelectorAll(selectSelector).forEach((select) => {
      select.value = language;
      updateCustomSelect(select);
    });
  }

  function closeLanguageMenus(returnFocus) {
    document.querySelectorAll('[data-language-custom].open').forEach((custom) => {
      custom.classList.remove('open');
      const button = custom.querySelector('[data-language-button]');
      button?.setAttribute('aria-expanded', 'false');
      if (returnFocus) button?.focus();
    });
  }

  function updateCustomSelect(select) {
    const language = languageLabels[select.value] || languageLabels.en;
    const switcher = select.closest('.language-switcher, .mobile-language');
    const custom = switcher?.querySelector('[data-language-custom]');
    if (!custom) return;

    custom.querySelector('[data-language-current-code]').textContent = language.code;
    custom.querySelector('[data-language-current-name]').textContent = language.name;
    custom.querySelector('[data-language-current-flag]').className = `language-flag ${language.flag}`;
    custom.querySelector('[data-language-button]').setAttribute(
      'aria-label',
      `Language: ${language.name}. Choose language`
    );

    custom.querySelectorAll('[data-language-option]').forEach((option) => {
      const isSelected = option.dataset.languageOption === select.value;
      option.setAttribute('aria-selected', String(isSelected));
    });
  }

  function enhanceSelect(select) {
    if (select.dataset.languageEnhanced) return;
    select.dataset.languageEnhanced = 'true';
    select.classList.add('language-select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const menuId = `language-menu-${++menuCount}`;
    const custom = document.createElement('div');
    custom.className = 'language-custom';
    custom.dataset.languageCustom = '';
    custom.innerHTML = `
      <button class="language-button" type="button" data-language-button aria-haspopup="listbox" aria-expanded="false" aria-controls="${menuId}">
        <span class="language-flag language-flag-gb" data-language-current-flag aria-hidden="true"></span>
        <span class="language-current-code" data-language-current-code>EN</span>
        <span class="language-current-name" data-language-current-name>English</span>
      </button>
      <div class="language-menu" id="${menuId}" role="listbox" aria-label="Choose language">
        ${Object.entries(languageLabels).map(([value, language]) => `
          <button class="language-option" type="button" role="option" data-language-option="${value}">
            <span class="language-flag ${language.flag}" aria-hidden="true"></span>
            <span>${language.name}</span>
          </button>
        `).join('')}
      </div>
    `;
    select.insertAdjacentElement('afterend', custom);

    const button = custom.querySelector('[data-language-button]');
    const options = Array.from(custom.querySelectorAll('[data-language-option]'));

    function openMenu(focusOption) {
      closeLanguageMenus(false);
      custom.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
      if (focusOption) {
        (options.find((option) => option.getAttribute('aria-selected') === 'true') || options[0])?.focus();
      }
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = custom.classList.contains('open');
      if (isOpen) closeLanguageMenus(false);
      else openMenu(false);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu(true);
      }
    });

    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        select.value = option.dataset.languageOption;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeLanguageMenus(false);
        button.focus();
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
          closeLanguageMenus(true);
        }
      });
    });

    custom.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!custom.contains(document.activeElement)) closeLanguageMenus(false);
      }, 0);
    });

    select.addEventListener('change', () => updateCustomSelect(select));
    updateCustomSelect(select);
  }

  function ensureTranslateElement() {
    let element = document.getElementById('google_translate_element');
    if (!element) {
      element = document.createElement('div');
      element.id = 'google_translate_element';
      element.className = 'notranslate';
      element.setAttribute('translate', 'no');
      document.body.appendChild(element);
    }
    return element;
  }

  function applyGoogleLanguage(language, attempts = 0) {
    if (language === 'en') return;

    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      if (combo.value !== language) {
        combo.value = language;
        combo.dispatchEvent(new Event('change'));
      }
      return;
    }

    if (attempts < 40) {
      window.setTimeout(() => applyGoogleLanguage(language, attempts + 1), 250);
    }
  }

  window.googleTranslateElementInit = function () {
    ensureTranslateElement();
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,fa,fr,de',
        autoDisplay: false,
      },
      'google_translate_element'
    );
    applyGoogleLanguage(getSavedLanguage());
  };

  function loadGoogleTranslate() {
    if (googleScriptRequested || window.google?.translate) {
      applyGoogleLanguage(getSavedLanguage());
      return;
    }

    googleScriptRequested = true;
    ensureTranslateElement();

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  function setLanguage(language) {
    const nextLanguage = supportedLanguages.has(language) ? language : 'en';
    try {
      localStorage.setItem(storageKey, nextLanguage);
    } catch (_) {
      // The selection still applies for this page when storage is unavailable.
    }
    syncSelects(nextLanguage);
    document.documentElement.lang = nextLanguage;

    if (nextLanguage === 'en') {
      setTranslateCookie('en');
      if (document.documentElement.className.includes('translated') || getCookie(translateCookie)) {
        window.location.reload();
      }
      return;
    }

    setTranslateCookie(nextLanguage);
    loadGoogleTranslate();
    applyGoogleLanguage(nextLanguage);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const language = getSavedLanguage();
    document.documentElement.lang = language;
    document.querySelectorAll(selectSelector).forEach(enhanceSelect);
    syncSelects(language);

    document.querySelectorAll(selectSelector).forEach((select) => {
      select.addEventListener('change', (event) => setLanguage(event.target.value));
    });

    document.addEventListener('click', () => closeLanguageMenus(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLanguageMenus(true);
    });

    if (language !== 'en') {
      setTranslateCookie(language);
      loadGoogleTranslate();
    }
  });
})();
