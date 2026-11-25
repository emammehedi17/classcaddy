const DAILY_PROMPT_KEY = 'classCaddyInstallPromptLastShown';
const INSTALL_PROMPT_ID = 'class-caddy-install-prompt';

declare global {
  interface Window {
    __classCaddyInstallPromptInitialized?: boolean;
  }
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isInstalledApp(): boolean {
  const displayModes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
  const isInInstalledWindow = displayModes.some((mode) =>
    window.matchMedia(`(display-mode: ${mode})`).matches,
  );

  return isInInstalledWindow || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function wasPromptShownToday(): boolean {
  try {
    return localStorage.getItem(DAILY_PROMPT_KEY) === getLocalDateKey();
  } catch {
    return false;
  }
}

function markPromptShownToday(): void {
  try {
    localStorage.setItem(DAILY_PROMPT_KEY, getLocalDateKey());
  } catch {
    // The current page still guards against repeat prompts if storage is unavailable.
  }
}

function createInstallPrompt(onInstall: () => Promise<void>, onDismiss: () => void): HTMLElement {
  const card = document.createElement('section');
  card.id = INSTALL_PROMPT_ID;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Class Caddy অ্যাপ ইনস্টল');
  card.style.cssText = [
    'position:fixed',
    'z-index:2147483000',
    'left:50%',
    'bottom:24px',
    'transform:translateX(-50%)',
    'width:min(440px,calc(100vw - 28px))',
    'box-sizing:border-box',
    'padding:16px',
    'border:1px solid #d1fae5',
    'border-radius:18px',
    'background:#ffffff',
    'color:#1f2937',
    'box-shadow:0 16px 48px rgba(15,23,42,.22)',
    'font:500 14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif',
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <img src="/images/logo.png" alt="" width="44" height="44"
        style="width:44px;height:44px;border-radius:12px;object-fit:contain;background:#f8fafc;flex:none">
      <div style="flex:1;min-width:0">
        <strong style="display:block;font-size:16px;line-height:1.35;color:#111827">Class Caddy অ্যাপ ইনস্টল করুন</strong>
        <span style="display:block;margin-top:4px;color:#4b5563">হোম স্ক্রিন বা ডেস্কটপ থেকে দ্রুত পড়াশোনা শুরু করুন।</span>
        <div style="display:flex;align-items:center;gap:10px;margin-top:14px">
          <button type="button" data-install style="border:0;border-radius:999px;padding:9px 16px;background:#059669;color:white;font:600 14px system-ui;cursor:pointer">ইনস্টল</button>
          <button type="button" data-dismiss style="border:0;background:transparent;color:#4b5563;font:600 14px system-ui;cursor:pointer">আজ নয়</button>
        </div>
      </div>
      <button type="button" data-close aria-label="বন্ধ করুন"
        style="border:0;background:transparent;color:#6b7280;font-size:22px;line-height:1;cursor:pointer;padding:0 2px">×</button>
    </div>`;

  card.querySelector<HTMLButtonElement>('[data-install]')?.addEventListener('click', () => void onInstall());
  card.querySelector<HTMLButtonElement>('[data-dismiss]')?.addEventListener('click', onDismiss);
  card.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', onDismiss);
  return card;
}

export function initializeClassCaddyInstallPrompt(): void {
  if (window.__classCaddyInstallPromptInitialized) return;
  window.__classCaddyInstallPromptInitialized = true;

  if (!window.isSecureContext || isInstalledApp() || wasPromptShownToday()) return;

  let pendingPrompt: InstallPromptEvent | null = null;
  let shownThisPage = false;

  const hidePrompt = () => document.getElementById(INSTALL_PROMPT_ID)?.remove();

  const showPrompt = () => {
    if (shownThisPage || isInstalledApp() || wasPromptShownToday() || !pendingPrompt) return;

    shownThisPage = true;
    markPromptShownToday();
    const card = createInstallPrompt(async () => {
      const promptEvent = pendingPrompt;
      if (!promptEvent) return;

      // The event is single-use; clear it before opening the browser's native UI.
      pendingPrompt = null;
      const installButton = card.querySelector<HTMLButtonElement>('[data-install]');
      if (installButton) installButton.disabled = true;

      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') hidePrompt();
      } catch (error) {
        console.warn('Class Caddy install prompt could not be opened:', error);
      } finally {
        hidePrompt();
      }
    }, hidePrompt);

    document.body.appendChild(card);
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    if (isInstalledApp()) return;
    event.preventDefault();
    pendingPrompt = event as InstallPromptEvent;
    showPrompt();
  });

  window.addEventListener('appinstalled', () => {
    pendingPrompt = null;
    hidePrompt();
  });
}

initializeClassCaddyInstallPrompt();
