import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { ArrowDown, ArrowUp, Moon, Sun } from 'lucide-react';

interface FloatingActionButtonsProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  activePage?: string;
}

export function FloatingActionButtons({ theme, toggleTheme, activePage }: FloatingActionButtonsProps) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const getScrollWindow = (): Window => {
    if (activePage === 'study-plan') {
      try {
        const frame = document.querySelector<HTMLIFrameElement>('#persistent-study-plan-frame iframe');
        if (frame?.contentWindow?.document) return frame.contentWindow;
      } catch { /* Fall back to the app window while the frame is loading. */ }
    }
    return window;
  };

  const getScrollMidpoint = () => {
    const target = getScrollWindow();
    const doc = target.document;
    const docHeight = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
      doc.body.offsetHeight,
      doc.documentElement.offsetHeight
    );
    const maxScroll = Math.max(0, docHeight - target.innerHeight);
    return maxScroll / 2;
  };

  useEffect(() => {
    const handleScroll = () => {
      const target = getScrollWindow();
      const midPoint = getScrollMidpoint();
      setIsScrolledDown(midPoint > 0 && target.scrollY > midPoint);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    const frame = document.querySelector<HTMLIFrameElement>('#persistent-study-plan-frame iframe');
    try { frame?.contentWindow?.addEventListener('scroll', handleScroll, { passive: true }); } catch {}
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      try { frame?.contentWindow?.removeEventListener('scroll', handleScroll); } catch {}
    };
  }, [activePage]);

  const handleScrollToggle = () => {
    const target = getScrollWindow();
    const doc = target.document;
    const midPoint = getScrollMidpoint();
    if (target.scrollY <= midPoint) {
      const docHeight = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight
      );
      target.scrollTo({ top: docHeight, behavior: 'smooth' });
    } else {
      target.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isDark = ['dark', 'forest', 'midnight'].includes(theme);

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
        {isScrolledDown ? <ArrowUp aria-hidden="true" size={20} strokeWidth={2.5} /> : <ArrowDown aria-hidden="true" size={20} strokeWidth={2.5} />}
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
        {isDark ? <Sun aria-hidden="true" size={19} strokeWidth={2.5} /> : <Moon aria-hidden="true" size={19} strokeWidth={2.5} />}
      </button>
    </>
  );
}

