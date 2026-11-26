/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PageView, UserProfile, ThemeMode } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ArchivesView } from './components/ArchivesView';
import { AboutView } from './components/AboutView';
import { ContactView } from './components/ContactView';
import { StudyPlanView } from './components/StudyPlanView';
import { LegacyPageFrame } from './components/LegacyPageFrame';
import { CourseDetailView } from './components/CourseDetailView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from 'firebase/auth';
import { CLASS_CADDY_LOGO_DATA_URI } from './lib/logoData';
import { applyAppSettings, loadAppSettings, saveAppSettings } from './lib/appSettings';
import { openSettingsDialog } from './lib/settingsModal';
import { exportCloudUserData, loadCloudAppSettings, loadCloudExamPreferences, restoreCloudUserData, saveCloudAppSettings, saveCloudExamPreferences, subscribeCloudAppSettings } from './lib/settingsCloud';

export default function App() {
  const pageFromLocation = (): PageView => {
    if (new URLSearchParams(window.location.search).has('cc-page')) return 'embedded';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('study_plan') || hash.includes('study-plan') || hash.includes('study_plan')) return 'study-plan';
    if (path.includes('privacy') || hash.includes('privacy')) return 'privacy';
    if (path.includes('about') || hash.includes('about')) return 'about';
    if (path.includes('contact') || hash.includes('contact')) return 'contact';
    if (path.includes('academic') || hash.includes('academic')) return 'academic';
    if (hash.includes('course-')) return hash.replace('#', '') as PageView;
    if (path.includes('archives') || hash.includes('archives')) return 'archives';
    if (path === '/' || path.endsWith('/index.html') || path.includes('home-content')) return 'home';
    if (/\.html?$/i.test(path)) return 'embedded';
    return 'home';
  };
  const pathForPage = (page: PageView) => page === 'home' ? '/index.html' : page === 'study-plan' ? '/study_plan.html' : page === 'academic' || page.startsWith('course-') ? `/archives.html#${page}` : `/${page === 'privacy' ? 'privacy-policy' : page}.html`;
  useEffect(() => {
    const ensureFavicon = () => {
      const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
      if (links.length > 0) {
        links.forEach((link) => {
          link.type = 'image/png';
          link.href = CLASS_CADDY_LOGO_DATA_URI;
        });
      } else if (document.head) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = CLASS_CADDY_LOGO_DATA_URI;
        document.head.appendChild(link);
      }
    };
    ensureFavicon();
  }, []);
  const [currentPage, setCurrentPage] = useState<PageView>(() => {
    if (new URLSearchParams(window.location.search).has('cc-page')) return 'embedded';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('grammar') || hash.includes('grammar')) {
      window.location.replace('/grammar/index.html');
      return 'home';
    }
    if (path.includes('study_plan') || hash.includes('study-plan') || hash.includes('study_plan')) return 'study-plan';
    if (path.includes('privacy') || hash.includes('privacy')) return 'privacy';
    if (path.includes('about') || hash.includes('about')) return 'about';
    if (path.includes('contact') || hash.includes('contact')) return 'contact';
    if (path.includes('academic') || hash.includes('academic')) return 'academic';
    if (hash.includes('course-')) return hash.replace('#', '') as PageView;
    if (path.includes('archives') || hash.includes('archives')) return 'archives';
    if (path.includes('index') || path === '/' || path.endsWith('/')) return 'home';
    return 'archives';
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const navigationTimeout = useRef<number | null>(null);
  const finishNavigation = () => {
    if (navigationTimeout.current !== null) window.clearTimeout(navigationTimeout.current);
    navigationTimeout.current = null;
    setLoadingProgress(100);
    window.setTimeout(() => setIsNavigating(false), 240);
  };
  const [embeddedPath, setEmbeddedPath] = useState(() => new URLSearchParams(window.location.search).get('cc-page') || (window.location.pathname + window.location.search + window.location.hash));
  const [hasVisitedStudyPlan, setHasVisitedStudyPlan] = useState(() => currentPage === 'study-plan');
  const navigateTo = (page: PageView, href = pathForPage(page)) => {
    const frameWillChange = page !== currentPage || (page === 'embedded' && href !== embeddedPath);
    if (href !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState({ page }, '', href);
    if (page === 'study-plan') setHasVisitedStudyPlan(true);
    setIsNavigating(true);
    setLoadingProgress(8);
    setIsHeaderHidden(false);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const cachedStudyPlan = page === 'study-plan' && hasVisitedStudyPlan;
    if (navigationTimeout.current !== null) window.clearTimeout(navigationTimeout.current);
    navigationTimeout.current = window.setTimeout(finishNavigation, frameWillChange && ['home', 'study-plan', 'embedded'].includes(page) && !cachedStudyPlan ? 8000 : 350);
  };
  const [theme, setTheme] = useState<ThemeMode>(() => loadAppSettings().theme);
  const [language, setLanguage] = useState<'bn' | 'en'>(() => loadAppSettings().language);
  const settingsSaveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!isNavigating) return;
    const timer = window.setInterval(() => setLoadingProgress((progress) => progress >= 90 ? 90 : Math.min(90, progress + Math.max(2, Math.round((90 - progress) * 0.12)))), 120);
    return () => window.clearInterval(timer);
  }, [isNavigating]);

  useEffect(() => {
    const onPopState = () => { setIsNavigating(true); setLoadingProgress(8); setIsHeaderHidden(false); setEmbeddedPath(new URLSearchParams(window.location.search).get('cc-page') || (window.location.pathname + window.location.search + window.location.hash)); const page = pageFromLocation(); if (page === 'study-plan') setHasVisitedStudyPlan(true); setCurrentPage(page); if (navigationTimeout.current !== null) window.clearTimeout(navigationTimeout.current); navigationTimeout.current = window.setTimeout(finishNavigation, 350); };
    const onInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash && !url.hash.startsWith('#course-')) return;
      const path = url.pathname.toLowerCase();
      let page: PageView | null = null;
      if (path.endsWith('/index.html') || path === '/') page = 'home';
      else if (path.includes('archives')) page = url.hash.startsWith('#course-') ? url.hash.slice(1) as PageView : 'archives';
      else if (path.includes('study_plan')) page = 'study-plan';
      else if (path.includes('about')) page = 'about';
      else if (path.includes('contact')) page = 'contact';
      else if (path.includes('privacy')) page = 'privacy';
      else if (path.includes('academic')) page = 'academic';
      else if (/\.html?$/i.test(path)) page = 'embedded';
      if (!page) return;
      event.preventDefault();
      if (page === 'embedded') setEmbeddedPath(url.pathname + url.search + url.hash);
      navigateTo(page, url.pathname + url.search + url.hash);
    };
    const onFrameNavigation = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'classcaddy:navigation-loaded') { finishNavigation(); return; }
      if (event.data?.type === 'classcaddy:studyplan-scroll') {
        if (currentPage === 'study-plan') setIsHeaderHidden(Boolean(event.data.hideHeader));
        return;
      }
      if (event.data?.type === 'classcaddy:settings-change' && event.data.settings) {
        const updated = saveAppSettings(event.data.settings);
        setTheme(updated.theme);
        setLanguage(updated.language);
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          settingsSaveQueue.current = settingsSaveQueue.current.catch(() => {}).then(() => saveCloudAppSettings(uid, updated));
          void settingsSaveQueue.current.catch((error) => console.warn('Could not sync app preferences to Firebase:', error));
        }
        return;
      }
      if (event.data?.type !== 'classcaddy:navigate') return;
      const url = new URL(event.data.href, window.location.href);
      const path = url.pathname.toLowerCase();
      let page: PageView | null = null;
      if (path.endsWith('/index.html') || path === '/' || path.includes('home-content')) page = 'home';
      else if (path.includes('archives')) page = url.hash.startsWith('#course-') ? url.hash.slice(1) as PageView : 'archives';
      else if (path.includes('study_plan')) page = 'study-plan';
      else if (path.includes('about')) page = 'about';
      else if (path.includes('contact')) page = 'contact';
      else if (path.includes('privacy')) page = 'privacy';
      else if (path.includes('academic')) page = 'academic';
      else if (/\.html?$/i.test(path)) page = 'embedded';
      if (page === 'embedded') setEmbeddedPath(url.pathname + url.search + url.hash);
      if (page) navigateTo(page, url.pathname + url.search + url.hash);
    };
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onInternalLink);
    window.addEventListener('message', onFrameNavigation);
    return () => { window.removeEventListener('popstate', onPopState); document.removeEventListener('click', onInternalLink); window.removeEventListener('message', onFrameNavigation); };
  }, [currentPage, embeddedPath]);

  useEffect(() => {
    applyAppSettings(loadAppSettings());
    const syncSettings = () => {
      const settings = loadAppSettings();
      setTheme(settings.theme);
      setLanguage(settings.language);
      applyAppSettings(settings);
    };
    window.addEventListener('classcaddy:settings-change', syncSettings);
    return () => window.removeEventListener('classcaddy:settings-change', syncSettings);
  }, []);

  useEffect(() => {
    if (currentPage === 'study-plan') return;
    const frame = document.querySelector<HTMLIFrameElement>('#persistent-study-plan-frame iframe');
    frame?.contentWindow?.postMessage({ type: 'classcaddy:parent-header-state', hidden: false }, window.location.origin);
  }, [currentPage]);

  // Windows 11 File Explorer Full-Screen Mode
  const [isExplorerMode, setIsExplorerMode] = useState<boolean>(() => {
    return localStorage.getItem('class_caddy_explorer_mode') === 'true';
  });

  const toggleExplorerMode = () => {
    setIsExplorerMode((prev) => {
      const next = !prev;
      localStorage.setItem('class_caddy_explorer_mode', String(next));
      
      if (next) {
        // Attempt native HTML5 Fullscreen API with vendor prefixes
        try {
          const docEl = document.documentElement as any;
          const isDocFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
          if (!isDocFullscreen) {
            const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (req) {
              req.call(docEl).catch((err: any) => {
                console.warn('Native requestFullscreen notice (non-fatal, app uses CSS fixed full-screen layout):', err);
              });
            }
          }
        } catch (e) {
          // Graceful fallback: the fixed CSS overlay takes care of full screen layout
        }
      } else {
        // Exit native fullscreen if active
        try {
          const isDocFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
          if (isDocFullscreen) {
            const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
            if (exit) {
              exit.call(document).catch(() => {});
            }
          }
        } catch (e) {
          // Ignore
        }
      }
      return next;
    });
  };

  const [user, setUser] = useState<UserProfile>(() => {
    const ccAuth = localStorage.getItem('cc_auth_user');
    if (ccAuth) {
      try {
        const parsed = JSON.parse(ccAuth);
        if (parsed && (parsed.isLoggedIn || parsed.uid)) {
          return {
            name: parsed.displayName || parsed.name || 'User',
            email: parsed.email || '',
            photoURL: parsed.photoURL || '',
            isLoggedIn: true,
          };
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem('class_caddy_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      } catch (e) {}
    }
    return { name: '', email: '', isLoggedIn: false };
  });

  // Firebase Auth State Listener & Sync
  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeSettings?.();
        unsubscribeSettings = subscribeCloudAppSettings(firebaseUser.uid, (cloudSettings, examPreferences) => {
          if (cloudSettings) {
            const settings = saveAppSettings({ ...loadAppSettings(), ...cloudSettings });
            setTheme(settings.theme);
            setLanguage(settings.language);
          }
          if (examPreferences?.legacy) localStorage.setItem('cc_quiz_settings', JSON.stringify(examPreferences.legacy));
          if (examPreferences?.exam) localStorage.setItem('cc_new_exam_settings_v1', JSON.stringify(examPreferences.exam));
          if (examPreferences?.legacy || examPreferences?.exam) {
            window.dispatchEvent(new CustomEvent('classcaddy:exam-settings-change', { detail: { legacy: examPreferences.legacy, exam: examPreferences.exam } }));
          }
        });
        const profile: UserProfile = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          isLoggedIn: true,
        };
        setUser(profile);
        localStorage.setItem('cc_auth_user', JSON.stringify({
          uid: firebaseUser.uid,
          displayName: profile.name,
          email: profile.email,
          photoURL: profile.photoURL,
          isLoggedIn: true,
        }));
        localStorage.setItem('class_caddy_user', JSON.stringify(profile));
        try {
          const cloudSettings = await loadCloudAppSettings(firebaseUser.uid);
          if (cloudSettings) saveAppSettings(cloudSettings);
          else await saveCloudAppSettings(firebaseUser.uid, loadAppSettings());
          const examPrefs = await loadCloudExamPreferences(firebaseUser.uid);
          if (examPrefs?.legacy) localStorage.setItem('cc_quiz_settings', JSON.stringify(examPrefs.legacy));
          if (examPrefs?.exam) localStorage.setItem('cc_new_exam_settings_v1', JSON.stringify(examPrefs.exam));
        } catch (error) {
          console.warn('Could not sync app preferences from Firebase:', error);
        }
      } else { unsubscribeSettings?.(); unsubscribeSettings = undefined; }
    });

    return () => { unsubscribe(); unsubscribeSettings?.(); };
  }, []);

  // Sync auth & theme changes across windows / localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cc_auth_user' || e.key === 'class_caddy_user') {
        const ccAuth = localStorage.getItem('cc_auth_user');
        if (ccAuth) {
          try {
            const parsed = JSON.parse(ccAuth);
            if (parsed && (parsed.isLoggedIn || parsed.uid)) {
              setUser({
                name: parsed.displayName || parsed.name || 'User',
                email: parsed.email || '',
                photoURL: parsed.photoURL || '',
                isLoggedIn: true,
              });
              return;
            }
          } catch (err) {}
        }
        const saved = localStorage.getItem('class_caddy_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isLoggedIn) {
              setUser(parsed);
              return;
            }
          } catch (err) {}
        }
        setUser({ name: '', email: '', isLoggedIn: false });
      } else if (e.key === 'class_caddy_theme' || e.key === 'class_caddy_settings_v1') {
        const settings = loadAppSettings();
        if (e.key === 'class_caddy_theme' && e.newValue && ['light', 'dark', 'sepia', 'forest', 'midnight'].includes(e.newValue)) settings.theme = e.newValue as ThemeMode;
        setTheme(settings.theme);
        setLanguage(settings.language);
        applyAppSettings(settings);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    void persistAppSettings({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  const persistAppSettings = async (next: Partial<ReturnType<typeof loadAppSettings>>) => {
    const settings = saveAppSettings(next);
    setTheme(settings.theme);
    setLanguage(settings.language);
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      settingsSaveQueue.current = settingsSaveQueue.current.catch(() => {}).then(() => saveCloudAppSettings(uid, settings));
      await settingsSaveQueue.current;
    }
  };

  useEffect(() => {
    const onLanguageMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'classcaddy:language-change') return;
      void persistAppSettings({ language: event.data.language === 'en' ? 'en' : 'bn' });
    };
    window.addEventListener('message', onLanguageMessage);
    return () => window.removeEventListener('message', onLanguageMessage);
  }, [auth.currentUser]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const profile: UserProfile = {
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email || '',
          photoURL: result.user.photoURL || undefined,
          isLoggedIn: true,
        };
        setUser(profile);
        localStorage.setItem('cc_auth_user', JSON.stringify({
          uid: result.user.uid,
          displayName: profile.name,
          email: profile.email,
          photoURL: profile.photoURL,
          isLoggedIn: true,
        }));
        localStorage.setItem('class_caddy_user', JSON.stringify(profile));
      }
    } catch (error: any) {
      if (error && error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        let modal = document.getElementById('cc-unauth-domain-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'cc-unauth-domain-modal';
          modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.75);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,sans-serif;';
          document.body.appendChild(modal);
        }
        modal.innerHTML = `
          <div style="background:#ffffff;color:#1f2937;max-width:480px;width:100%;border-radius:12px;padding:20px 22px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2);border:1px solid #e5e7eb;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#b91c1c;">Authorize Domain for Google Sign-In</h3>
              <button id="cc-unauth-close-btn" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:#6b7280;">&times;</button>
            </div>
            <p style="font-size:0.85rem;color:#4b5563;line-height:1.5;margin:0 0 12px;">
              This preview domain is not yet allowlisted in Firebase project <strong>study-plan17</strong>. Add the domain below in <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong>:
            </p>
            <div style="display:flex;align-items:center;gap:8px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:8px 10px;margin-bottom:14px;">
              <code style="font-size:0.78rem;color:#111827;word-break:break-all;flex:1;">${domain}</code>
              <button id="cc-unauth-copy-btn" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.75rem;font-weight:600;cursor:pointer;white-space:nowrap;">Copy Domain</button>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <a href="https://console.firebase.google.com/project/study-plan17/authentication/settings" target="_blank" rel="noopener noreferrer" style="background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;padding:7px 12px;font-size:0.8rem;font-weight:600;">Open Firebase Console</a>
              <button id="cc-unauth-ok-btn" style="background:#e5e7eb;color:#374151;border:none;border-radius:6px;padding:7px 14px;font-size:0.8rem;font-weight:600;cursor:pointer;">Close</button>
            </div>
          </div>
        `;
        modal.style.display = 'flex';
        const closeModal = () => { if (modal) modal.style.display = 'none'; };
        modal.querySelector('#cc-unauth-close-btn')?.addEventListener('click', closeModal);
        modal.querySelector('#cc-unauth-ok-btn')?.addEventListener('click', closeModal);
        modal.querySelector('#cc-unauth-copy-btn')?.addEventListener('click', (ev) => {
          navigator.clipboard?.writeText(domain);
          (ev.target as HTMLElement).textContent = 'Copied!';
        });
        return;
      }
      console.warn('Google Sign-In Notice:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    const guestUser: UserProfile = { name: '', email: '', isLoggedIn: false };
    setUser(guestUser);
    localStorage.removeItem('class_caddy_user');
    localStorage.removeItem('cc_auth_user');
  };

  const openAccountSettings = () => openSettingsDialog({
    profile: { ...user, uid: auth.currentUser?.uid },
    onSaveProfile: async (name) => {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      localStorage.setItem('class_caddy_user', JSON.stringify(updatedUser));
      const cachedAuth = JSON.parse(localStorage.getItem('cc_auth_user') || '{}');
      localStorage.setItem('cc_auth_user', JSON.stringify({
        ...cachedAuth,
        displayName: name,
        email: user.email,
        photoURL: user.photoURL,
        isLoggedIn: user.isLoggedIn,
      }));
    },
    onSaveAppSettings: persistAppSettings,
    onSaveExamPreferences: async (legacy, exam) => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      settingsSaveQueue.current = settingsSaveQueue.current.catch(() => {}).then(() => saveCloudExamPreferences(uid, legacy, exam));
      await settingsSaveQueue.current;
    },
    onExportCloudBackup: async () => auth.currentUser ? exportCloudUserData(auth.currentUser.uid) : null,
    onRestoreCloudBackup: async (data) => {
      if (!auth.currentUser) throw new Error('Firebase-এর backup restore করতে account-এ sign in করুন।');
      const count = await restoreCloudUserData(auth.currentUser.uid, data);
      const restoredSettings = await loadCloudAppSettings(auth.currentUser.uid);
      if (restoredSettings) saveAppSettings(restoredSettings);
      return count;
    },
    onRestoreProfile: async (name) => { if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name }); },
    onSignOut: handleLogout,
  });

  const isDark = theme !== 'light' && theme !== 'sepia';

  return (
    <div
      id="app-root-container"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {/* Header (Hidden when File Explorer Fullscreen Mode is active) */}
      {!isExplorerMode && (
        <Header
          currentPage={currentPage}
          setCurrentPage={(page) => navigateTo(page)}
          user={user}
          onLogout={handleLogout}
          onOpenSignup={() => {}}
          onOpenSettings={openAccountSettings}
          language={language}
          onLanguageChange={(nextLanguage) => { void persistAppSettings({ language: nextLanguage }); }}
          onGoogleSignIn={handleGoogleSignIn}
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleExplorerMode={toggleExplorerMode}
          isHidden={currentPage === 'study-plan' && isHeaderHidden}
        />
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className={`${
          isExplorerMode
            ? 'p-0 m-0 w-screen h-screen fixed inset-0 z-50 overflow-hidden'
            : currentPage === 'study-plan'
              ? 'h-dvh flex-none overflow-hidden p-0'
              : currentPage === 'home'
                ? 'h-dvh flex-none overflow-hidden p-0'
              : 'flex-grow pt-[64px] pb-16'
        }`}
      >
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-emerald-500 transition-[width,opacity] duration-150 ease-linear" style={{ width: `${loadingProgress}%`, opacity: isNavigating ? 1 : 0 }} />
        {currentPage === 'archives' && (
          <ArchivesView
            theme={theme}
            isExplorerMode={isExplorerMode}
            onToggleExplorerMode={toggleExplorerMode}
            user={user}
          />
        )}
        {currentPage === 'home' && <LegacyPageFrame src="/home-content.html?cc-embedded=1" title="Class Caddy Home" viewportMode fixedViewport />}
        {currentPage === 'embedded' && <LegacyPageFrame src={embeddedPath} title="Class Caddy" viewportMode />}
        {currentPage === 'about' && <AboutView />}
        {currentPage === 'contact' && <ContactView />}
        {currentPage === 'privacy' && <PrivacyPolicyView />}
        {hasVisitedStudyPlan && (
          <div
            id="persistent-study-plan-frame"
            aria-hidden={currentPage !== 'study-plan'}
            style={currentPage === 'study-plan' ? undefined : { position: 'absolute', width: '100%', height: 0, overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' }}
          >
            <StudyPlanView headerHidden={isHeaderHidden} active={currentPage === 'study-plan'} />
          </div>
        )}
        {(currentPage === 'academic' || currentPage.startsWith('course-')) && (
          <CourseDetailView
            courseId={currentPage.startsWith('course-') ? currentPage : 'course-405'}
            onBack={() => {
              navigateTo('archives');
            }}
            onNavigateCourse={(page) => {
              navigateTo(page);
            }}
          />
        )}
      </main>

      {/* Floating Action Buttons (Scroll Toggle and Dark Mode) */}
      {!isExplorerMode && (
        <FloatingActionButtons theme={theme} toggleTheme={toggleTheme} activePage={currentPage} />
      )}

      {/* Footer (Hidden when File Explorer Fullscreen Mode is active) */}
      {!isExplorerMode && currentPage !== 'study-plan' && currentPage !== 'home' && (
        <Footer
          onNavigate={(page) => {
            navigateTo(page);
          }}
          theme={theme}
        />
      )}
    </div>
  );
}

