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
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('grammar') || hash.includes('grammar')) {
      window.location.replace('/grammar/index.html');
      return 'home';
    }
    if (path.includes('study_plan') || hash.includes('study-plan') || hash.includes('study_plan')) return 'study-plan';
    if (path.includes('about') || hash.includes('about')) return 'about';
    if (path.includes('contact') || hash.includes('contact')) return 'contact';
    if (path.includes('academic') || hash.includes('academic')) return 'academic';
    if (hash.includes('course-')) return hash.replace('#', '') as PageView;
    if (path.includes('archives') || hash.includes('archives')) return 'archives';
    if (path.includes('index') || path === '/' || path.endsWith('/')) return 'home';
    return 'archives';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('class_caddy_theme') as ThemeMode | null;
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

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
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
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
      } else if (e.key === 'class_caddy_theme' && e.newValue) {
        setTheme(e.newValue === 'dark' ? 'dark' : 'light');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
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
    } catch (error) {
      console.error('Google Sign-In Error:', error);
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

