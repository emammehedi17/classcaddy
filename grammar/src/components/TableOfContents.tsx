import React, { useState } from 'react';
import { List, ChevronDown, ChevronRight, Hash, Bookmark } from 'lucide-react';
import { GRAMMAR_SECTIONS } from '../data/grammarData';

interface TableOfContentsProps {
  onSelectSection: (id: string) => void;
  activeSectionId: string | null;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ onSelectSection, activeSectionId }) => {
  // STRICT REQUIREMENT: Collapsed by default!
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 no-print">
      {/* Header bar that toggles the TOC */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <List className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
              Table of Contents / সূচিপত্র
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block bengali-text">
              {isOpen ? "ক্লিক করে সূচিপত্র লুকান (Click to Collapse)" : "সকল অধ্যায় ও টপিক দেখতে ক্লিক করুন (Click to Expand)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {GRAMMAR_SECTIONS.length} Core Modules
          </span>
          <div className="text-slate-400">
            {isOpen ? <ChevronDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {GRAMMAR_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSection(sec.id);
                }}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition text-left cursor-pointer group ${
                  activeSectionId === sec.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700'
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 transition">
                  {sec.number}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {sec.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bengali-text truncate">
                    {sec.bengaliTitle}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>🔴 MUST REMEMBER</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>🟡 IMPORTANT</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>🔵 ADVANCED</span>
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
            >
              Close Table of Contents ▲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
