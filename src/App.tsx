/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageView, UserProfile, ThemeMode } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ArchivesView } from './components/ArchivesView';
import { AboutView } from './components/AboutView';
import { ContactView } from './components/ContactView';
import { StudyPlanView } from './components/StudyPlanView';
import { CourseDetailView } from './components/CourseDetailView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from 'firebase/auth';
import { CLASS_CADDY_LOGO_DATA_URI } from './lib/logoData';
import { applyAppSettings, loadAppSettings, saveAppSettings } from './lib/appSettings';
import { openSettingsDialog } from './lib/settingsModal';

export default function App() {
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
  const [theme, setTheme] = useState<ThemeMode>(() => loadAppSettings().theme);

  useEffect(() => {
    applyAppSettings(loadAppSettings());
    const syncSettings = () => {
      const settings = loadAppSettings();
      setTheme(settings.theme);
      applyAppSettings(settings);
    };
    window.addEventListener('classcaddy:settings-change', syncSettings);
    return () => window.removeEventListener('classcaddy:settings-change', syncSettings);
  }, []);

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

  useEffect(() => {
    localStorage.setItem('class_caddy_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
      document.documentElement.style.backgroundColor = '#0f172a';
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  // Firebase Auth State Listener & Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
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
      }
    });

    return () => unsubscribe();
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
        if (e.key === 'class_caddy_theme' && e.newValue) settings.theme = e.newValue === 'dark' ? 'dark' : 'light';
        setTheme(settings.theme);
        applyAppSettings(settings);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveAppSettings({ theme: next });
  };

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
    profile: user,
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
    onSignOut: handleLogout,
  });

  const isDark = theme === 'dark';

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
          setCurrentPage={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={user}
          onLogout={handleLogout}
          onOpenSignup={() => {}}
          onOpenSettings={openAccountSettings}
          onGoogleSignIn={handleGoogleSignIn}
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleExplorerMode={toggleExplorerMode}
        />
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className={`flex-grow ${
          isExplorerMode
            ? 'p-0 m-0 w-screen h-screen fixed inset-0 z-50 overflow-hidden'
            : 'pt-24 pb-16'
        }`}
      >
        {(currentPage === 'archives' || currentPage === 'home') && (
          <ArchivesView
            theme={theme}
            isExplorerMode={isExplorerMode}
            onToggleExplorerMode={toggleExplorerMode}
            user={user}
          />
        )}
        {currentPage === 'about' && <AboutView />}
        {currentPage === 'contact' && <ContactView />}
        {currentPage === 'privacy' && <PrivacyPolicyView />}
        {currentPage === 'study-plan' && <StudyPlanView />}
        {(currentPage === 'academic' || currentPage.startsWith('course-')) && (
          <CourseDetailView
            courseId={currentPage.startsWith('course-') ? currentPage : 'course-405'}
            onBack={() => {
              setCurrentPage('archives');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateCourse={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Floating Action Buttons (Scroll Toggle and Dark Mode) */}
      {!isExplorerMode && (
        <FloatingActionButtons theme={theme} toggleTheme={toggleTheme} />
      )}

      {/* Footer (Hidden when File Explorer Fullscreen Mode is active) */}
      {!isExplorerMode && (
        <Footer
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          theme={theme}
        />
      )}
    </div>
  );
}

