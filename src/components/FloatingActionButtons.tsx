import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface FloatingActionButtonsProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export function FloatingActionButtons({ theme, toggleTheme }: FloatingActionButtonsProps) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const getScrollMidpoint = () => {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    const maxScroll = Math.max(0, docHeight - window.innerHeight);
    return maxScroll / 2;
  };

  useEffect(() => {
    const handleScroll = () => {
      const midPoint = getScrollMidpoint();
      setIsScrolledDown(midPoint > 0 && window.scrollY > midPoint);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleScrollToggle = () => {
    const midPoint = getScrollMidpoint();
    if (window.scrollY <= midPoint) {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      window.scrollTo({ top: docHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Scroll to Bottom / Scroll to Top Toggle Button — Matches study_plan.html */}
      <button
        id="scroll-toggle-btn"
        onClick={handleScrollToggle}
        className="fixed bottom-32 right-5 max-[414px]:right-[10px] max-[414px]:bottom-[130px] max-[414px]:w-10 max-[414px]:h-10 z-[100] w-12 h-12 bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-900 hover:scale-110 focus:outline-none opacity-90 hover:opacity-100 cursor-pointer"
        title={isScrolledDown ? 'Scroll to Top' : 'Scroll to Bottom'}
        aria-label={isScrolledDown ? 'Scroll to Top' : 'Scroll to Bottom'}
      >
        <i className={`fas ${isScrolledDown ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
      </button>

      {/* Global Dark Mode Toggle Button — Matches study_plan.html (44x44, bottom: 75px, golden yellow in dark mode) */}
      <button
        id="global-dark-mode-btn"
        onClick={toggleTheme}
        className={`fixed bottom-[75px] right-5 max-[414px]:right-[10px] max-[414px]:bottom-[70px] w-[44px] h-[44px] rounded-full shadow-lg border-2 z-[999] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer ${
          isDark
            ? 'bg-[#fbbf24] text-[#1f2937] border-[#f59e0b]'
            : 'bg-gray-800 text-yellow-400 border-gray-700'
        }`}
        title="Toggle Dark Mode"
        aria-label="Toggle Dark Mode"
      >
        <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-[1.1rem]`} />
      </button>
    </>
  );
}

