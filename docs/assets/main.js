const LATEST_RELEASE_URL = 'https://github.com/easyshelf-addon/EasyShelf/releases/latest';

function renderDownloadResult(container, lang, match, createElement) {
  const make = createElement || (typeof document !== 'undefined' ? document.createElement.bind(document) : null);
  container.innerHTML = '';

  if (!match) {
    const p = make('p');
    p.textContent = lang === 'ru'
      ? 'Список версий пока недоступен.'
      : 'Version list is currently unavailable.';
    container.appendChild(p);

    const link = make('a');
    link.href = LATEST_RELEASE_URL;
    link.className = 'cta';
    link.textContent = lang === 'ru' ? 'Скачать последнюю версию' : 'Download the latest release';
    container.appendChild(link);
    return;
  }

  const link = make('a');
  link.href = match.version.url;
  link.className = 'cta';
  link.textContent = (lang === 'ru' ? 'Скачать EasyShelf ' : 'Download EasyShelf ') + match.version.addon_version;
  container.appendChild(link);

  if (!match.exact) {
    const warn = make('p');
    warn.className = 'warning';
    warn.textContent = lang === 'ru'
      ? 'Официально не тестировалось на вашей версии Blender — используйте на свой риск.'
      : 'Not officially tested on your Blender version — use at your own risk.';
    container.appendChild(warn);
  }
}

(function () {
  const STORAGE_KEY = 'easyshelf-lang';
  const BLENDER_VERSIONS = ['5.0.0', '4.5.0', '4.4.0', '4.3.0', '4.2.0', '4.1.0', '4.0.0', '3.6.0'];

  function detectDefaultLanguage() {
    const langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    return langs.some((l) => l && l.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
  }

  function currentLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || detectDefaultLanguage();
    } catch (e) {
      return detectDefaultLanguage();
    }
  }

  // Exposed so feedback.js (a separate <script>) can call it as a bare
  // global, the same way it already reads pickVersionForBlender from logic.js.
  if (typeof window !== 'undefined') {
    window.currentLanguage = currentLanguage;
  }

  function applyLanguage(lang) {
    document.querySelectorAll('[data-ru]').forEach((el) => {
      const text = lang === 'ru' ? el.dataset.ru : el.dataset.en;
      if (text !== undefined) el.textContent = text;
    });
    document.querySelectorAll('[data-src-ru]').forEach((el) => {
      const src = lang === 'ru' ? el.dataset.srcRu : el.dataset.srcEn;
      if (src) el.src = src;
    });
    document.querySelectorAll('[data-href-ru]').forEach((el) => {
      const href = lang === 'ru' ? el.dataset.hrefRu : el.dataset.hrefEn;
      if (href) el.href = href;
    });
    document.documentElement.lang = lang;
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'ru' ? 'EN' : 'RU';
  }

  function setLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // private browsing / blocked storage — language still applies for this view
    }
    applyLanguage(lang);
  }

  // Fetches versions.json exactly once and wires the <select> listener exactly
  // once; renderForLanguage is stored so the language toggle can re-render
  // the existing selection in the new language without re-fetching or
  // re-registering listeners.
  let renderForLanguage = null;

  async function setupDownloadSection(initialLang) {
    const select = document.getElementById('blender-version-select');
    const result = document.getElementById('download-result');
    if (!select || !result) return;

    select.innerHTML = '';
    BLENDER_VERSIONS.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });

    let versions = [];
    let fetchFailed = false;
    try {
      const res = await fetch('versions.json');
      versions = await res.json();
    } catch (e) {
      fetchFailed = true;
    }

    renderForLanguage = (lang) => {
      const match = fetchFailed ? null : pickVersionForBlender(versions, select.value);
      renderDownloadResult(result, lang, match);
    };

    select.addEventListener('change', () => renderForLanguage(currentLanguage()));
    renderForLanguage(initialLang);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const lang = currentLanguage();
      applyLanguage(lang);
      setupDownloadSection(lang);

      const toggle = document.getElementById('lang-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          const next = currentLanguage() === 'ru' ? 'en' : 'ru';
          setLanguage(next);
          if (renderForLanguage) renderForLanguage(next);
        });
      }
    });
  }
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderDownloadResult };
}
