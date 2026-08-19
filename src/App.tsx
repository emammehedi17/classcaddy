/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageView, UserProfile, ThemeMode } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ArchivesView } from './components/ArchivesView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('archives');
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
        // Request browser-level fullscreen to hide browser bars
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } else {
        // Exit browser-level fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      }
      return next;
    });
  };

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('class_caddy_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { name: '', email: '', isLoggedIn: false };
  });

  useEffect(() => {
    localStorage.setItem('class_caddy_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    const guestUser: UserProfile = { name: '', email: '', isLoggedIn: false };
    setUser(guestUser);
    localStorage.removeItem('class_caddy_user');
  };

  const isDark = theme === 'dark';

  return (
    <div
      id="app-root-container"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'
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
          theme={theme}
          toggleTheme={toggleTheme}
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
          />
        )}
      </main>

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

