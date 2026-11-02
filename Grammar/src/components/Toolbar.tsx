import React from 'react';
import { Search, Sun, Moon, ZoomIn, ZoomOut, RotateCcw, Printer, ChevronDown, ChevronUp, Zap, Clock } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  fontSizeLevel: number;
  setFontSizeLevel: (fn: (prev: number) => number) => void;
  resetFontSize: () => void;
  allExpanded: boolean;
  toggleAllExpanded: () => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeView: 'full' | 'last_night' | 'drill';
  setActiveView: (view: 'full' | 'last_night' | 'drill') => void;
  scrollProgress: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  isDark,
  setIsDark,
  fontSizeLevel,
  setFontSizeLevel,
  resetFontSize,
  allExpanded,
  toggleAllExpanded,
  activeCategory,
  setActiveCategory,
  activeView,
  setActiveView,
  scrollProgress
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200 no-print">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule, word, Bangla (e.g. Gerund, Preposition, বাচ্য)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick View Switchers */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveView('full')}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeView === 'full'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📚 All Topics
            </button>
            <button
              onClick={() => setActiveView('last_night')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeView === 'last_night'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Last-Night Revision</span>
            </button>
            <button
              onClick={() => setActiveView('drill')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeView === 'drill'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>🚀 15-Min Quick Quiz</span>
            </button>
          </div>

          {/* Functional Actions: Font, Theme, Print, Expand */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Font Sizer */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 text-slate-700 dark:text-slate-300">
              <button
                onClick={() => setFontSizeLevel(prev => Math.max(-1, prev - 1))}
                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                title="Decrease Font Size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetFontSize}
                className="px-1.5 py-0.5 text-[11px] font-mono hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                title="Reset Font Size"
              >
                <RotateCcw className="w-3 h-3 inline mr-0.5" />
                {fontSizeLevel === 0 ? '100%' : `${100 + fontSizeLevel * 10}%`}
              </button>
              <button
                onClick={() => setFontSizeLevel(prev => Math.min(3, prev + 1))}
                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                title="Increase Font Size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={toggleAllExpanded}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              title={allExpanded ? "Collapse All Sections" : "Expand All Sections"}
            >
              {allExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
