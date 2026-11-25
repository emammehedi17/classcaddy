import React, { useState } from 'react';
import { PageView, UserProfile, ThemeMode } from '../types';
import { Menu, X } from 'lucide-react';
import { CLASS_CADDY_LOGO_DATA_URI } from '../lib/logoData';

interface HeaderProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenSignup: () => void;
  onGoogleSignIn?: () => void;
  onOpenSettings: () => void;
  language: 'bn' | 'en';
  onLanguageChange: (language: 'bn' | 'en') => void;
  theme?: ThemeMode;
  toggleTheme?: () => void;
  onToggleExplorerMode?: () => void;
  isHidden?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  user,
  onGoogleSignIn,
  onOpenSettings,
  language,
  onLanguageChange,
  theme = 'light',
  isHidden = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = ['dark', 'forest', 'midnight'].includes(theme);

  const getNavClass = (tab: PageView) => {
    const isActive = currentPage === tab;
    if (isActive) {
      return 'px-5 py-1.5 bg-emerald-500 text-white rounded-full transition-colors font-medium shadow-sm';
    }
    return 'px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors';
  };

  const getMobileNavClass = (tab: PageView) => {
    const isActive = currentPage === tab;
    if (isActive) {
      return 'block px-6 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 transition-colors';
    }
    return 'block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';
  };

  const googleLogo =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ij48L3BhdGg+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDMS4yNSAxNi4xMyAwIDIwLjA4IDAgMjRjMCAzLjkyIDEuMjUgNy44NyAyLjk5IDEwLjk4bDcuNTQtNS45OXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMzRBMDMyIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ij48L3BhdGg+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgweiI+PC9wYXRoPjwvZz48L3N2Zz4=';

  const displayName =
    user.name || (user.email ? user.email.split('@')[0] : 'User');

  return (
    <header
      id="main-navigation-header"
      style={{ height: 76 }}
      className={`fixed top-0 left-0 right-0 z-50 h-[76px] min-h-[76px] border-b main-website-ui shadow-sm transition-transform duration-300 ease-out ${isHidden ? '-translate-y-full' : 'translate-y-0'} ${
        isDark
          ? 'bg-gray-900/95 border-gray-800 text-gray-100'
          : 'bg-white/95 border-gray-200 text-gray-800'
      }`}
    >
      <div className="container mx-auto h-full px-4 sm:px-6 py-0">
        <nav className="flex h-full justify-between items-center">
          {/* Left: Profile & Brand Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <a
              id="header-founder-profile"
              href="/index.html"
              className="flex-shrink-0"
              title="Class Caddy - Home"
            >
              <img
                src={CLASS_CADDY_LOGO_DATA_URI}
                alt="Class Caddy Logo"
                className="h-[40px] w-[40px] rounded-full border-2 border-emerald-500 bg-white object-contain p-0.5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = CLASS_CADDY_LOGO_DATA_URI;
                }}
              />
            </a>
            <a href="/index.html">
              <h1
                className={`text-xl font-bold ${
                  isDark ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                Class Caddy
              </h1>
            </a>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <div
            id="header-desktop-nav-tabs"
            className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-sm"
          >
            <a href="/index.html" className={getNavClass('home')}>
              {language === 'bn' ? 'হোম' : 'Home'}
            </a>
            <a href="/archives.html" className={getNavClass('archives')}>
              {language === 'bn' ? 'আর্কাইভ' : 'Archives'}
            </a>
            <a href="/study_plan.html" className={getNavClass('study-plan')}>
              {language === 'bn' ? 'স্টাডি প্ল্যান' : 'Study Plan'}
            </a>
            <a href="/about.html" className={getNavClass('about')}>
              {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About'}
            </a>
            <a href="/contact.html" className={getNavClass('contact')}>
              {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </a>
          </div>

          {/* Right Side: Account settings or sign-in */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex rounded-full border border-gray-200 dark:border-gray-700 p-1 text-xs">
              {(['bn', 'en'] as const).map((lang) => <button key={lang} type="button" onClick={() => onLanguageChange(lang)} className={`rounded-full px-3 py-1 ${language === lang ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>{lang === 'bn' ? 'বাংলা' : 'EN'}</button>)}
            </div>
            {user.isLoggedIn ? (
              <button
                id="profile-settings-trigger"
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 pl-1.5 pr-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="প্রোফাইল ও অ্যাপ সেটিংস খুলুন"
                title="অ্যাপ সেটিংস"
              >
                <img
                  src={user.photoURL || CLASS_CADDY_LOGO_DATA_URI}
                  alt=""
                  className="h-8 w-8 rounded-full border border-emerald-200 object-cover"
                />
                <span className="max-w-36 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">{displayName}</span>
              </button>
            ) : (
              <a href="https://du.ac.bd/" target="_blank" rel="noopener noreferrer" aria-label="University of Dhaka website">
                <img
                  src="/images/du_logo.png"
                  alt="DU Logo"
                  className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/40x40/eeeeee/111827?text=DU';
                  }}
                />
              </a>
            )}

            <div id="auth-container-desktop" className="auth-container text-sm">
              {!user.isLoggedIn && (
                <button
                  id="header-signin-btn"
                  type="button"
                  onClick={onGoogleSignIn}
                  className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-full transition-colors text-sm font-medium shadow-sm cursor-pointer"
                >
                  <img src={googleLogo} alt="G" className="w-5 h-5" />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            {user.isLoggedIn && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="mr-2 flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="প্রোফাইল ও অ্যাপ সেটিংস খুলুন"
              >
                <img src={user.photoURL || CLASS_CADDY_LOGO_DATA_URI} alt="" className="h-9 w-9 rounded-full border border-emerald-300 object-cover" />
                <span className="max-w-24 truncate text-sm font-semibold">{displayName}</span>
              </button>
            )}
            <button
              id="mobile-menu-button"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 mt-3 shadow-md"
          >
            <div className="flex gap-2 px-6 py-3">
              {(['bn', 'en'] as const).map((lang) => <button key={lang} type="button" onClick={() => onLanguageChange(lang)} className={`rounded-full px-4 py-2 text-sm ${language === lang ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{lang === 'bn' ? 'বাংলা' : 'English'}</button>)}
            </div>
            <a href="/index.html" className={getMobileNavClass('home')}>
              {language === 'bn' ? 'হোম' : 'Home'}
            </a>
            <a href="/archives.html" className={getMobileNavClass('archives')}>
              {language === 'bn' ? 'আর্কাইভ' : 'Archives'}
            </a>
            <a href="/study_plan.html" className={getMobileNavClass('study-plan')}>
              {language === 'bn' ? 'স্টাডি প্ল্যান' : 'Study Plan'}
            </a>
            <a href="/about.html" className={getMobileNavClass('about')}>
              {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About'}
            </a>
            <a href="/contact.html" className={getMobileNavClass('contact')}>
              {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </a>

            <div
              id="auth-container-mobile"
              className="auth-container px-6 py-4 border-t border-gray-200 dark:border-gray-800"
            >
              {user.isLoggedIn ? (
                <button type="button" onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800">
                  <img src={user.photoURL || CLASS_CADDY_LOGO_DATA_URI} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <span className="font-semibold">{displayName}<small className="block font-normal text-gray-500">সেটিংস খুলুন</small></span>
                </button>
              ) : (
                <button
                  id="mobile-signin-btn"
                  type="button"
                  onClick={() => {
                    onGoogleSignIn?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-full gap-3 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-full transition-colors text-sm font-medium shadow-sm cursor-pointer"
                >
                  <img src={googleLogo} alt="G" className="w-5 h-5" />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};


