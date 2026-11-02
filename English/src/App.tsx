import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { TableOfContents } from './components/TableOfContents';
import { TopicSection } from './components/TopicSection';
import { LastNightRevisionView } from './components/LastNightRevisionView';
import { FifteenMinuteDrillView } from './components/FifteenMinuteDrillView';
import { GRAMMAR_SECTIONS } from './data/grammarData';
import { ArrowUp, BookOpen, CheckCircle, ShieldCheck, Download, Award, Calendar } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0); // -1, 0, 1, 2, 3
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allExpanded, setAllExpanded] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'full' | 'last_night' | 'drill'>('full');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Track scroll for reading progress & back to top
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    setActiveView('full');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFontSize = () => {
    setFontSizeLevel(0);
  };

  // Font size multiplier classes
  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case -1: return 'text-[0.92rem]';
      case 1: return 'text-[1.08rem]';
      case 2: return 'text-[1.16rem]';
      case 3: return 'text-[1.25rem]';
      default: return 'text-[1rem]';
    }
  };

  // Filter sections by search query or category
  const filteredSections = GRAMMAR_SECTIONS.filter(section => {
    if (activeCategory !== 'all' && section.category !== activeCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const inTitle = section.title.toLowerCase().includes(q) || section.bengaliTitle.toLowerCase().includes(q);
    const inOverview = section.overview.toLowerCase().includes(q);
    const inRules = section.rules.some(r => 
      r.ruleTitle.toLowerCase().includes(q) ||
      (r.bengaliNote && r.bengaliNote.toLowerCase().includes(q)) ||
      r.explanation.toLowerCase().includes(q) ||
      r.exampleCorrect.toLowerCase().includes(q) ||
      (r.examTrap && r.examTrap.toLowerCase().includes(q))
    );

    return inTitle || inOverview || inRules;
  });

  return (
    <div className={`min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 ${getFontSizeClass()}`}>
      
      {/* 
        STRICT REQUIREMENT: Header must remain in normal document flow.
        Do NOT use position: fixed or position: sticky.
        It naturally disappears as the user scrolls downward.
      */}
      <Header />

      {/* Sticky Study Controls Toolbar */}
      <Toolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDark={isDark}
        setIsDark={setIsDark}
        fontSizeLevel={fontSizeLevel}
        setFontSizeLevel={setFontSizeLevel}
        resetFontSize={resetFontSize}
        allExpanded={allExpanded}
        toggleAllExpanded={() => setAllExpanded(!allExpanded)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeView={activeView}
        setActiveView={setActiveView}
        scrollProgress={scrollProgress}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Collapsed Table of Contents (Click to expand) */}
        <TableOfContents 
          onSelectSection={scrollToSection} 
          activeSectionId={activeSectionId} 
        />

        {/* View Switch Logic */}
        {activeView === 'last_night' && (
          <LastNightRevisionView />
        )}

        {activeView === 'drill' && (
          <FifteenMinuteDrillView />
        )}

        {activeView === 'full' && (
          <div>
            {/* Search Match Info */}
            {searchQuery && (
              <div className="mb-6 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
                <span>
                  Showing results matching: <strong className="font-semibold underline">"{searchQuery}"</strong> ({filteredSections.length} modules found)
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* List of Grammar Topic Sections */}
            {filteredSections.map(section => (
              <TopicSection
                key={section.id}
                section={section}
                searchQuery={searchQuery}
                isExpanded={allExpanded}
              />
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No grammar rules found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  We couldn't find any rules matching "{searchQuery}". Try searching for terms like "Gerund", "Preposition", "Conditionals", "Tense", or "Inversion".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition cursor-pointer"
                >
                  Reset Search
                </button>
              </div>
            )}

            {/* In-Line Rapid Revision Sections */}
            <div className="mt-16 pt-8 border-t-2 border-indigo-500/20">
              <LastNightRevisionView />
              <FifteenMinuteDrillView />
            </div>
          </div>
        )}

      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 cursor-pointer no-print focus:outline-none focus:ring-2 focus:ring-indigo-400"
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Final Footer with Strict Date & Author Signature */}
      <footer className="mt-20 bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-base sm:text-lg">
            <Award className="w-5 h-5" />
            <span>ENGLISH GRAMMAR — MASTER REVISION NOTE</span>
          </div>

          <p className="text-slate-300 font-medium">
            BCS • University Admission • Bank • Government & Competitive Exams
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Prepared by: <strong className="text-white">Emam Mehedi</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Revision Date: <strong className="text-teal-300">1 November, 2026</strong></span>
            </span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified with Oxford, Cambridge & BCS Source Material</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 pt-4 bengali-text">
            সর্বস্বত্ব সংরক্ষিত • BCS, Bank & University Admission পরীক্ষার জন্য বিশেষভাবে প্রণীত রিভিশন সংকলন • 1 November, 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
