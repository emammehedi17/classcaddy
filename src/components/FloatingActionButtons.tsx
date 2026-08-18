import React, { useState, useEffect } from 'react';
import { ArrowUp, Maximize, Minimize, Printer, ZoomIn, ZoomOut } from 'lucide-react';

interface FloatingActionButtonsProps {
  scale: number;
  onScaleChange: (newScale: number) => void;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  scale,
  onScaleChange,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const zoomIn = () => onScaleChange(Math.min(scale + 0.1, 2.0));
  const zoomOut = () => onScaleChange(Math.max(scale - 0.1, 0.7));

  return (
    <div id="action-buttons-container" className="no-print">
      {/* Zoom Controls (Shown in Fullscreen or when expanded) */}
      <div className="flex items-center bg-gray-900/90 border border-gray-700 rounded-full px-2 py-1 shadow-2xl backdrop-blur-md gap-1">
        <button
          onClick={zoomOut}
          className="p-1.5 text-gray-300 hover:text-emerald-400 transition"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-emerald-400 font-bold px-1 select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="p-1.5 text-gray-300 hover:text-emerald-400 transition"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="action-btn"
          title="Print page / export PDF"
        >
          <Printer className="w-5 h-5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="action-btn"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Go to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="action-btn animate-in fade-in zoom-in-95 duration-200"
            title="Go to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
