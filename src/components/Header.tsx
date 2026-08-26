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

  return (
    <header
      id="main-navigation-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDark
          ? isScrolled
            ? 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-800 text-white'
            : 'bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/80 text-white'
          : isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200 text-slate-800'
          : 'bg-white/85 backdrop-blur-sm border-b border-slate-200/80 text-slate-800'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 py-3">
        <nav className="flex justify-between items-center">
          {/* Left: Profile & Brand Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <a
              id="header-founder-profile"
              href="https://facebook.com/emammehedi17"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group block"
              title="Emam Mehedi - Class Caddy Founder"
            >
              <div
                className={`h-10 w-10 md:h-12 md:w-12 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-sm transition-all ${
                  isDark
                    ? 'border-emerald-400 bg-gray-800 group-hover:border-emerald-300'
                    : 'border-emerald-600 bg-emerald-50 group-hover:border-emerald-700'
                }`}
              >
                <span
                  className={`font-bold text-base md:text-lg ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  CC
                </span>
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark
                    ? 'bg-emerald-500 border-gray-900'
                    : 'bg-emerald-600 border-white'
                }`}
              ></span>
            </a>
            <button
              id="header-brand-title-btn"
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left focus:outline-none group"
            >
              <h1
                className={`text-xl md:text-2xl font-bold tracking-tight transition-colors ${
                  isDark
                    ? 'text-white group-hover:text-emerald-400'
                    : 'text-slate-900 group-hover:text-emerald-700'
                }`}
              >
                Class Caddy
              </h1>
              <p
                className={`text-[10px] uppercase font-semibold tracking-wider hidden sm:block ${
                  isDark ? 'text-emerald-400/80' : 'text-emerald-700'
                }`}
              >
                Academic Learning Hub
              </p>
            </button>
          </div>

          {/* Center: Desktop Navigation */}
          <div
            id="header-desktop-nav-tabs"
            className={`hidden lg:flex items-center gap-1 backdrop-blur-md rounded-full p-1.5 shadow-inner transition-colors ${
              isDark
                ? 'bg-gray-800/60 border border-gray-700/70'
                : 'bg-slate-100/90 border border-slate-200'
            }`}
          >
            <button
              id="nav-tab-home"
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === 'home'
                  ? isDark
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Home
            </button>

            <button
              id="nav-tab-archives"
              onClick={() => {
                setCurrentPage('archives');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === 'archives' || currentPage === 'academic' || currentPage.startsWith('course-')
                  ? isDark
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Archives
            </button>

            <button
              id="nav-tab-study-plan"
              onClick={() => setCurrentPage('study-plan')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === 'study-plan'
                  ? isDark
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Study Plan
            </button>

            <button
              id="nav-tab-about"
              onClick={() => setCurrentPage('about')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === 'about'
                  ? isDark
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              About
            </button>

            <button
              id="nav-tab-contact"
              onClick={() => setCurrentPage('contact')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === 'contact'
                  ? isDark
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Contact
            </button>
          </div>

          {/* Right Side: Theme Toggle + Explorer Mode + DU Logo & Sign Up / User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Windows 11 File Explorer Toggle Button */}
            {onToggleExplorerMode && (
              <button
                id="header-explorer-mode-toggle-btn"
                onClick={onToggleExplorerMode}
                className={`p-2 sm:px-3 sm:py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-sm ${
                  isDark
                    ? 'bg-blue-950/60 hover:bg-blue-900/80 border-blue-800/80 text-blue-300 hover:text-white'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-900'
                }`}
                title="Open Windows 11 File Explorer Full Screen Mode"
              >
                <Monitor className="w-4 h-4 text-blue-500" />
                <span className="hidden lg:inline">Explorer</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle Button */}
            {toggleTheme && (
              <button
                id="theme-mode-toggle-btn"
                onClick={toggleTheme}
                className={`p-2 sm:px-3 sm:py-2 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-amber-300 hover:text-amber-200 shadow-gray-950/40'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-emerald-700 shadow-slate-200/60'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                    <span className="hidden md:inline text-xs text-amber-200">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
                    <span className="hidden md:inline text-xs text-slate-700">Dark Mode</span>
                  </>
                )}
              </button>
            )}

            {/* DU Portal Link */}
            <a
              id="du-portal-header-link"
              href="https://du.ac.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${
                isDark
                  ? 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-700 text-gray-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Dhaka University Official Portal"
            >
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                }`}
              >
                DU
              </div>
              <span className="text-xs font-medium">DU Portal</span>
            </a>

            {/* User Login / Profile / Sign up */}
            {user.isLoggedIn ? (
              <div
                className={`flex items-center gap-2 border rounded-full pl-3 pr-2 py-1 ${
                  isDark
                    ? 'bg-gray-800/80 border-emerald-500/40'
                    : 'bg-slate-100 border-emerald-600/40'
                }`}
              >
                <span
                  className={`text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px] ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  {user.name || user.email.split('@')[0]}
                </span>
                <button
                  id="header-user-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-signup-btn"
                onClick={onOpenSignup}
                className={`hidden sm:flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all shadow-md active:scale-95 ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden flex items-center gap-1.5">
              <button
                id="header-mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border-gray-700'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
                }`}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className={`lg:hidden mt-3 backdrop-blur-xl border rounded-2xl p-4 space-y-2 shadow-2xl animate-in fade-in duration-150 ${
              isDark
                ? 'bg-gray-800/95 border-gray-700 text-gray-200'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            <button
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'home'
                  ? isDark
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 text-white font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                setCurrentPage('archives');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'archives' || currentPage === 'academic' || currentPage.startsWith('course-')
                  ? isDark
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'bg-emerald-600 text-white font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Archives
            </button>

            {onToggleExplorerMode && (
              <button
                onClick={() => {
                  onToggleExplorerMode();
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                  isDark
                    ? 'bg-blue-950/40 text-blue-300 hover:bg-blue-900/60'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span>File Explorer Mode</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 font-semibold uppercase">
                  Full Screen
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setCurrentPage('study-plan');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'study-plan'
                  ? isDark
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 text-white font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Study Plan
            </button>

            <button
              onClick={() => {
                setCurrentPage('about');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'about'
                  ? isDark
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 text-white font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              About
            </button>

            <button
              onClick={() => {
                setCurrentPage('contact');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'contact'
                  ? isDark
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 text-white font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Contact
            </button>

            <div
              className={`pt-3 border-t flex flex-col gap-2 ${
                isDark ? 'border-gray-700/60' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <a
                  href="https://eco.du.ac.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-semibold hover:underline ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  DU Student Portal &rarr;
                </a>
                {!user.isLoggedIn ? (
                  <button
                    onClick={() => {
                      onOpenSignup();
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${
                      isDark ? 'bg-emerald-500' : 'bg-emerald-600'
                    }`}
                  >
                    Sign Up
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Log out ({user.name || 'User'})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

