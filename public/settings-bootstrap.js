(function () {
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('class_caddy_settings_v1') || '{}'); } catch (_) {}
  let theme = ['light', 'dark', 'sepia', 'forest', 'midnight'].includes(settings.theme)
    ? settings.theme
    : (['light', 'dark', 'sepia', 'forest', 'midnight'].includes(localStorage.getItem('class_caddy_theme')) ? localStorage.getItem('class_caddy_theme') : 'light');
  let font = ['sans-serif', 'amiri', 'hind-siliguri', 'kalpurush'].includes(settings.banglaFont)
    ? settings.banglaFont : 'sans-serif';
  let language = settings.language === 'en' || localStorage.getItem('cc_home_lang') === 'en' ? 'en' : 'bn';
  const root = document.documentElement;
  const embedded = window.self !== window.top;
  if (embedded) {
    root.classList.add('cc-embedded');
    if (document.head && !document.querySelector('style[data-cc-embed-shell]')) {
      const embedStyle = document.createElement('style');
      embedStyle.dataset.ccEmbedShell = 'true';
      embedStyle.textContent = 'html.cc-embedded header.main-website-ui,#main-navigation-header,html.cc-embedded #scroll-toggle-btn,html.cc-embedded #global-dark-mode-btn,html.cc-embedded #action-buttons-container{display:none!important}html.cc-embedded body{padding-top:0!important}html.cc-embedded main{padding-top:0!important}';
      document.head.appendChild(embedStyle);
    }
  }
  let dark = ['dark', 'forest', 'midnight'].includes(theme);
  const applyRoot = () => {
    dark = ['dark', 'forest', 'midnight'].includes(theme);
    root.dataset.theme = theme;
    root.dataset.banglaFont = font;
    root.dataset.readingSize = ['small', 'medium', 'large'].includes(settings.readingSize) ? settings.readingSize : 'medium';
    root.dataset.reduceMotion = String(settings.reduceMotion === true);
    root.dataset.language = language;
    root.lang = language;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = theme === 'sepia' ? 'light' : dark ? 'dark' : 'light';
    root.style.backgroundColor = theme === 'sepia' ? '#f4ecd8' : theme === 'forest' ? '#10251f' : theme === 'midnight' ? '#080d1c' : dark ? '#0f172a' : '#f8fafc';
    if (dark) root.style.color = '#e5e7eb';
    else root.style.removeProperty('color');
    if (document.body) document.body.classList.toggle('dark-mode', dark);
  };
  applyRoot();
  new MutationObserver(() => {
    applyRoot();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('classcaddy:settings-change', (event) => {
    const detail = event.detail;
    if (!detail || typeof detail !== 'object') return;
    settings = { ...settings, ...detail };
    if (['light', 'dark', 'sepia', 'forest', 'midnight'].includes(settings.theme)) theme = settings.theme;
    if (['sans-serif', 'amiri', 'hind-siliguri', 'kalpurush'].includes(settings.banglaFont)) font = settings.banglaFont;
    if (settings.language === 'bn' || settings.language === 'en') language = settings.language;
    applyRoot();
    syncBody();
  });

  const fontHref = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap';
  if (document.head && !document.querySelector('link[data-cc-settings-fonts]')) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = fontHref;
    fontLink.dataset.ccSettingsFonts = 'true';
    document.head.appendChild(fontLink);
  }
  if (document.head && !document.querySelector('link[data-cc-universal-settings]')) {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/universal-settings.css';
    styleLink.dataset.ccUniversalSettings = 'true';
    document.head.appendChild(styleLink);
  }
  const syncBody = () => {
    if (!document.body) return;
    document.body.classList.toggle('dark-mode', dark);
    const homepageBilingual = document.body.classList.contains('lang-bn') || document.body.classList.contains('lang-en');
    document.body.classList.remove('lang-bn', 'lang-en');
    if (homepageBilingual) {
      document.body.classList.add(`lang-${language}`);
    }
  };
  const watchBody = () => {
    syncBody();
    if (document.body) new MutationObserver(() => document.body?.classList.toggle('dark-mode', dark)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  };
  if (document.body) watchBody();
  else new MutationObserver((_, observer) => { if (document.body) { watchBody(); observer.disconnect(); } }).observe(root, { childList: true });
})();
