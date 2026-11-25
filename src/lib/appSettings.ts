export type AppSettings = {
  theme: 'light' | 'dark';
  banglaFont: 'sans-serif' | 'amiri';
  readingSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
};

export const APP_SETTINGS_KEY = 'class_caddy_settings_v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  banglaFont: 'sans-serif',
  readingSize: 'medium',
  reduceMotion: false,
};

export function loadAppSettings(): AppSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || '{}');
    const legacyTheme = localStorage.getItem('class_caddy_theme');
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      theme: parsed.theme === 'dark' || (!parsed.theme && legacyTheme === 'dark') ? 'dark' : 'light',
      banglaFont: parsed.banglaFont === 'amiri' ? 'amiri' : 'sans-serif',
      readingSize: ['small', 'medium', 'large'].includes(parsed.readingSize)
        ? parsed.readingSize
        : 'medium',
      reduceMotion: parsed.reduceMotion === true,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function applyAppSettings(settings: AppSettings): void {
  const root = document.documentElement;
  root.dataset.banglaFont = settings.banglaFont;
  root.dataset.readingSize = settings.readingSize;
  root.dataset.reduceMotion = String(settings.reduceMotion);

  const isDark = settings.theme === 'dark';
  root.classList.toggle('dark', isDark);
  document.body?.classList.toggle('dark-mode', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
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
  return settings;
}
