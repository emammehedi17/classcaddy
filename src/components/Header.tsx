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
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 main-website-ui shadow-sm text-gray-800 transition-all duration-200"
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
            <button
              id="header-brand-title-btn"
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left focus:outline-none"
            >
              <h1 className="text-xl font-bold text-gray-800 hover:text-emerald-600 transition-colors">
                Class Caddy
              </h1>
            </button>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <div
            id="header-desktop-nav-tabs"
            className="hidden md:flex items-center gap-1 bg-gray-100/50 border border-gray-200 rounded-full p-1 text-sm"
          >
            <button
              id="nav-tab-home"
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-1.5 rounded-full transition-colors ${
                currentPage === 'home'
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-normal'
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
              className={`px-5 py-1.5 rounded-full transition-colors ${
                currentPage === 'archives' || currentPage === 'academic' || currentPage.startsWith('course-')
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium'
              }`}
            >
              Archives
            </button>

            <button
              id="nav-tab-study-plan"
              onClick={() => {
                setCurrentPage('study-plan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-1.5 rounded-full transition-colors ${
                currentPage === 'study-plan'
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-normal'
              }`}
            >
              Study Plan
            </button>

            <button
              id="nav-tab-about"
              onClick={() => {
                setCurrentPage('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-1.5 rounded-full transition-colors ${
                currentPage === 'about'
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-normal'
              }`}
            >
              About
            </button>

            <button
              id="nav-tab-contact"
              onClick={() => {
                setCurrentPage('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-5 py-1.5 rounded-full transition-colors ${
                currentPage === 'contact'
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-normal'
              }`}
            >
              Contact
            </button>
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
                className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/40x40/eeeeee/111827?text=DU';
                }}
              />
            </a>

            {user.isLoggedIn ? (
              <div
                className="flex items-center gap-2 border border-emerald-500/40 rounded-full pl-3 pr-2 py-1 bg-gray-50 text-sm"
              >
                <span className="text-xs font-semibold text-emerald-700 truncate max-w-[120px]">
                  {user.name || user.email.split('@')[0]}
                </span>
                <button
                  id="header-user-logout-btn"
                  onClick={onLogout}
                  className="p-1 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div id="auth-container-desktop" className="auth-container text-sm">
                <button
                  id="header-signup-btn"
                  onClick={onOpenSignup}
                  className="px-5 py-2 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors signup-button shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 focus:outline-none p-1"
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
            className="md:hidden bg-white border-t border-gray-200 -mx-6 mt-3 shadow-md py-2"
          >
            <button
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                currentPage === 'home'
                  ? 'font-semibold text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                setCurrentPage('archives');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                currentPage === 'archives' || currentPage === 'academic' || currentPage.startsWith('course-')
                  ? 'font-semibold text-emerald-600 bg-emerald-50'
                  : 'font-medium text-emerald-600 hover:bg-gray-100'
              }`}
            >
              Archives
            </button>

            <button
              onClick={() => {
                setCurrentPage('study-plan');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                currentPage === 'study-plan'
                  ? 'font-semibold text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Study Plan
            </button>

            <button
              onClick={() => {
                setCurrentPage('about');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                currentPage === 'about'
                  ? 'font-semibold text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              About
            </button>

            <button
              onClick={() => {
                setCurrentPage('contact');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                currentPage === 'contact'
                  ? 'font-semibold text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Contact
            </button>

            <div id="auth-container-mobile" className="auth-container px-6 py-4 border-t border-gray-200">
              {!user.isLoggedIn ? (
                <button
                  onClick={() => {
                    onOpenSignup();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-2 transition-colors signup-button"
                >
                  Sign Up
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center text-sm font-medium text-red-600 hover:bg-red-50 rounded-full py-2 transition-colors"
                >
                  Log out ({user.name || 'User'})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

