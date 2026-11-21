import React, { useState } from 'react';
import { PageView, UserProfile, ThemeMode } from '../types';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenSignup: () => void;
  onGoogleSignIn?: () => void;
  theme?: ThemeMode;
  toggleTheme?: () => void;
  onToggleExplorerMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  user,
  onGoogleSignIn,
  theme = 'light',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark';

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
      className={`fixed top-0 left-0 right-0 z-50 border-b main-website-ui shadow-sm ${
        isDark
          ? 'bg-gray-900/95 border-gray-800 text-gray-100'
          : 'bg-white/95 border-gray-200 text-gray-800'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <nav className="flex justify-between items-center">
          {/* Left: Profile & Brand Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <a
              id="header-founder-profile"
              href="https://facebook.com/emammehedi17"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              title="Emam Mehedi - Class Caddy Founder"
            >
              <img
                src="/images/profile.jpg"
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-emerald-500 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/40x40/ffffff/059669?text=CC';
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
              Home
            </a>
            <a href="/archives.html" className={getNavClass('archives')}>
              Archives
            </a>
            <a href="/study_plan.html" className={getNavClass('study-plan')}>
              Study Plan
            </a>
            <a href="/about.html" className={getNavClass('about')}>
              About
            </a>
            <a href="/contact.html" className={getNavClass('contact')}>
              Contact
            </a>
          </div>

          {/* Right Side: DU Logo (or User Photo when logged in) & Auth Container */}
          <div className="hidden md:flex items-center gap-4">
            <a
              id="du-portal-header-link"
              href={user.isLoggedIn && user.photoURL ? undefined : 'https://du.ac.bd/'}
              target={user.isLoggedIn && user.photoURL ? undefined : '_blank'}
              rel={user.isLoggedIn && user.photoURL ? undefined : 'noopener noreferrer'}
            >
              <img
                src={user.isLoggedIn && user.photoURL ? user.photoURL : '/images/du_logo.png'}
                alt="DU Logo"
                className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/40x40/eeeeee/111827?text=DU';
                }}
              />
            </a>

            <div id="auth-container-desktop" className="auth-container text-sm">
              {user.isLoggedIn ? (
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    {displayName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {user.email || ''}
                  </p>
                </div>
              ) : (
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
            <a href="/index.html" className={getMobileNavClass('home')}>
              Home
            </a>
            <a href="/archives.html" className={getMobileNavClass('archives')}>
              Archives
            </a>
            <a href="/study_plan.html" className={getMobileNavClass('study-plan')}>
              Study Plan
            </a>
            <a href="/about.html" className={getMobileNavClass('about')}>
              About
            </a>
            <a href="/contact.html" className={getMobileNavClass('contact')}>
              Contact
            </a>

            <div
              id="auth-container-mobile"
              className="auth-container px-6 py-4 border-t border-gray-200 dark:border-gray-800"
            >
              {user.isLoggedIn ? (
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    {displayName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {user.email || ''}
                  </p>
                </div>
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


