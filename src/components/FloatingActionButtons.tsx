import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../types';

interface FloatingActionButtonsProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export function FloatingActionButtons({ theme, toggleTheme }: FloatingActionButtonsProps) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY >= 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToggle = () => {
    if (window.scrollY < 300) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Scroll to Bottom / Scroll to Top Toggle Button */}
      <button
        id="scroll-toggle-btn"
        onClick={handleScrollToggle}
        className="fixed bottom-32 right-5 z-[100] w-12 h-12 bg-gray-700 hover:bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none opacity-90 hover:opacity-100 active:scale-95"
        title={isScrolledDown ? 'Scroll to Top' : 'Scroll to Bottom'}
        aria-label={isScrolledDown ? 'Scroll to Top' : 'Scroll to Bottom'}
      >
        {isScrolledDown ? (
          <ArrowUp className="w-5 h-5 transition-transform" />
        ) : (
          <ArrowDown className="w-5 h-5 transition-transform" />
        )}
      </button>

      {/* Global Dark Mode Toggle Button */}
      <button
        id="global-dark-mode-btn"
        onClick={toggleTheme}
        className="fixed bottom-6 right-5 w-14 h-14 bg-gray-800 text-yellow-400 rounded-full shadow-2xl border-2 border-gray-700 z-[999] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform focus:outline-none"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <Sun className="w-7 h-7 text-amber-300 transition-transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-7 h-7 text-yellow-400 transition-transform -rotate-12 hover:rotate-0" />
        )}
      </button>
    </>
  );
}
