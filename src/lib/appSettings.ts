export type AppSettings = {
  theme: 'light' | 'dark' | 'sepia' | 'forest' | 'midnight';
  banglaFont: 'sans-serif' | 'amiri' | 'hind-siliguri' | 'kalpurush';
  language: 'bn' | 'en';
  readingSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  autoBackupEnabled: boolean;
};

export const APP_SETTINGS_KEY = 'class_caddy_settings_v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  banglaFont: 'sans-serif',
  language: 'en',
  readingSize: 'small',
  reduceMotion: false,
  autoBackupEnabled: true,
};

export function loadAppSettings(): AppSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || '{}');
    const legacyTheme = localStorage.getItem('class_caddy_theme');
    const legacyLanguage = localStorage.getItem('cc_home_lang');
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      theme: ['light', 'dark', 'sepia', 'forest', 'midnight'].includes(parsed.theme)
        ? parsed.theme
        : (!parsed.theme && ['light', 'dark', 'sepia', 'forest', 'midnight'].includes(legacyTheme) ? legacyTheme : 'dark'),
      banglaFont: ['sans-serif', 'amiri', 'hind-siliguri', 'kalpurush'].includes(parsed.banglaFont)
        ? parsed.banglaFont
        : 'sans-serif',
      language: parsed.language === 'en' || parsed.language === 'bn'
        ? parsed.language
        : legacyLanguage === 'bn' || legacyLanguage === 'en' ? legacyLanguage : 'en',
      readingSize: ['small', 'medium', 'large'].includes(parsed.readingSize)
        ? parsed.readingSize
        : 'small',
      reduceMotion: parsed.reduceMotion === true,
      autoBackupEnabled: parsed.autoBackupEnabled !== false,
    };
  } catch {
    const legacyTheme = localStorage.getItem('class_caddy_theme');
    return {
      ...DEFAULT_APP_SETTINGS,
      theme: ['light', 'dark', 'sepia', 'forest', 'midnight'].includes(legacyTheme) ? legacyTheme as AppSettings['theme'] : DEFAULT_APP_SETTINGS.theme,
      language: localStorage.getItem('cc_home_lang') === 'en' ? 'en' : DEFAULT_APP_SETTINGS.language,
    };
  }
}

export function applyAppSettings(settings: AppSettings): void {
  const root = document.documentElement;
  root.dataset.banglaFont = settings.banglaFont;
  root.dataset.readingSize = settings.readingSize;
  root.dataset.reduceMotion = String(settings.reduceMotion);

  const isDark = ['dark', 'forest', 'midnight'].includes(settings.theme);
  root.dataset.theme = settings.theme;
  root.dataset.language = settings.language;
  root.lang = settings.language;
  root.classList.toggle('dark', isDark);
  document.body?.classList.toggle('dark-mode', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = settings.theme === 'sepia' ? '#f4ecd8' : settings.theme === 'forest' ? '#10251f' : settings.theme === 'midnight' ? '#080d1c' : isDark ? '#0f172a' : '#f8fafc';
  try {
    localStorage.setItem('class_caddy_theme', settings.theme);
  } catch {}
}

export function saveAppSettings(next: Partial<AppSettings>): AppSettings {
  const settings = { ...loadAppSettings(), ...next };
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
  applyAppSettings(settings);
  window.dispatchEvent(new CustomEvent('classcaddy:settings-change', { detail: settings }));
  window.dispatchEvent(new CustomEvent('classcaddy:language-change', { detail: { language: settings.language } }));
  return settings;
}
