import React, { useState, useEffect, useRef } from 'react';
import { PageView, UserProfile, ThemeMode } from '../types';
import {
  ChevronDown,
  Menu,
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

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
  setCurrentPage,
  user,
  onLogout,
  onOpenSignup,
  onGoogleSignIn,
  theme = 'light',
  toggleTheme,
  onToggleExplorerMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavClass = (tab: PageView) => {
    const isActive = currentPage === tab;
    if (isActive) {
      return 'px-5 py-1.5 rounded-full transition-colors bg-emerald-500 text-white font-medium shadow-sm';
    }
    return isDark
      ? 'px-5 py-1.5 rounded-full transition-colors text-gray-300 hover:text-white hover:bg-gray-700 font-normal'
      : 'px-5 py-1.5 rounded-full transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-normal';
  };

  const getMobileNavClass = (tab: PageView) => {
    const isActive = currentPage === tab;
    if (isActive) {
      return 'block w-full text-left px-6 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 transition-colors';
    }
    return isDark
      ? 'block w-full text-left px-6 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors'
      : 'block w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors';
  };

  const googleIconSvg = (
    <img
      src="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ij48L3BhdGg+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDMS4yNSAxNi4xMyAwIDIwLjA4IDAgMjRjMCAzLjkyIDEuMjUgNy44NyAyLjk5IDEwLjk4bDcuNTQtNS45OXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMzRBMDMyIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ij48L3BhdGg+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgweiI+PC9wYXRoPjwvZz48L3N2Zz4="
      alt="Google"
      className="w-4 h-4 flex-shrink-0"
    />
  );

  return (
    <header
      id="main-navigation-header"
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-200 ${
        isDark
          ? 'bg-gray-900/95 border-gray-800 text-gray-100'
          : 'bg-white/95 border-gray-200 text-gray-800 shadow-sm'
      }`}
    >
      <div className="container mx-auto px-6 py-3">
        <nav className="flex justify-between items-center">
          {/* Left: Profile & Brand Title */}
          <div className="flex items-center gap-4">
            <a
              id="header-founder-profile"
              href="https://facebook.com/emammehedi17"
              target="_blank"
              rel="noopener noreferrer"
              className="block flex-shrink-0"
              title="Emam Mehedi - Class Caddy Founder"
            >
              <img
                src="images/profile.jpg"
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-emerald-500 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/40x40/ffffff/059669?text=CC';
                }}
              />
            </a>
            <a
              id="header-brand-title-link"
              href="index.html"
              className="text-left focus:outline-none"
            >
              <h1 className={`text-xl font-bold transition-colors ${
                isDark ? 'text-gray-100 hover:text-emerald-400' : 'text-gray-800 hover:text-emerald-600'
              }`}>
                Class Caddy
              </h1>
            </a>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <div
            id="header-desktop-nav-tabs"
            className={`hidden md:flex items-center gap-1 border rounded-full p-1 text-sm ${
              isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/70 border-gray-200'
            }`}
          >
            <a
              id="nav-tab-home"
              href="index.html"
              className={getNavClass('home')}
            >
              Home
            </a>

            <a
              id="nav-tab-archives"
              href="archives.html"
              className={getNavClass('archives')}
            >
              Archives
            </a>

            <a
              id="nav-tab-study-plan"
              href="study_plan.html"
              className={getNavClass('study-plan')}
            >
              Study Plan
            </a>

            <a
              id="nav-tab-about"
              href="about.html"
              className={getNavClass('about')}
            >
              About
            </a>

            <a
              id="nav-tab-contact"
              href="contact.html"
              className={getNavClass('contact')}
            >
              Contact
            </a>
          </div>

          {/* Right Side: DU Logo & Sign Up / User Profile */}
          <div className="hidden md:flex items-center gap-4">
            <a
              id="du-portal-header-link"
              href="https://du.ac.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="block flex-shrink-0"
              title="Dhaka University Official Portal"
            >
              <img
                src="images/du_logo.png"
                alt="DU Logo"
                className={`h-10 w-10 rounded-full border object-cover ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/40x40/eeeeee/111827?text=DU';
                }}
              />
            </a>

            {user.isLoggedIn ? (
              <div
                id="auth-container-desktop"
                className="auth-container flex items-center gap-2"
              >
                <a
                  id="header-user-profile-link"
                  href="study_plan.html"
                  className={`flex items-center gap-2.5 px-3 py-1.5 border rounded-full transition shadow-sm group ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 border-emerald-500/40 text-gray-200'
                      : 'bg-gray-50 hover:bg-emerald-50 border-emerald-500/40 text-gray-800'
                  }`}
                  title={`Logged in as ${user.name || user.email || 'User'} - Open Study Plan`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/28x28/059669/ffffff?text=' + (user.name ? user.name.charAt(0).toUpperCase() : 'U');
                      }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left max-w-[120px]">
                    <p className={`text-xs font-semibold group-hover:text-emerald-500 transition truncate ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {user.name || user.email.split('@')[0] || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {user.email || 'My Study Plan'}
                    </p>
                  </div>
                </a>
                <button
                  id="header-user-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div id="auth-container-desktop" className="auth-container text-sm">
                <button
                  id="header-signin-btn"
                  type="button"
                  onClick={onGoogleSignIn}
                  className={`header-google-signin-btn flex items-center gap-2 px-4 py-2 border rounded-full transition-all duration-200 text-sm font-medium shadow-sm hover:shadow cursor-pointer ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                  title="Sign In with Google"
                >
                  {googleIconSvg}
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`focus:outline-none p-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className={`md:hidden border-t -mx-6 mt-3 shadow-md py-2 ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <a
              href="index.html"
              className={getMobileNavClass('home')}
            >
              Home
            </a>

            <a
              href="archives.html"
              className={getMobileNavClass('archives')}
            >
              Archives
            </a>

            <a
              href="study_plan.html"
              className={getMobileNavClass('study-plan')}
            >
              Study Plan
            </a>

            <a
              href="about.html"
              className={getMobileNavClass('about')}
            >
              About
            </a>

            <a
              href="contact.html"
              className={getMobileNavClass('contact')}
            >
              Contact
            </a>

            <div id="auth-container-mobile" className={`auth-container px-6 py-4 border-t ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              {!user.isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    onGoogleSignIn?.();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2.5 w-full py-2.5 border rounded-full transition text-sm font-medium shadow-sm cursor-pointer ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  {googleIconSvg}
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <a
                    href="study_plan.html"
                    className="flex items-center gap-2 text-sm font-medium text-emerald-500"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-6 h-6 rounded-full object-cover border border-emerald-500"
                      />
                    ) : null}
                    <span>{user.name || 'User'}</span>
                  </a>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-medium text-red-500 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

