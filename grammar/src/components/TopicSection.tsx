import React, { useState } from 'react';
import { GrammarSection, RuleItem } from '../data/grammarData';
import { AlertTriangle, Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';

interface TopicSectionProps {
  section: GrammarSection;
  searchQuery: string;
  isExpanded: boolean;
}

export const TopicSection: React.FC<TopicSectionProps> = ({ section, searchQuery, isExpanded }) => {
  const [collapsedRules, setCollapsedRules] = useState<Record<string, boolean>>({});

  const toggleRule = (ruleId: string) => {
    setCollapsedRules(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  // Safe search highlight helper that preserves Bengali font hierarchy
  const highlightMatch = (text?: string) => {
    if (!text) return '';
    if (!searchQuery.trim()) return text;

    const query = searchQuery.trim();
    // Escape regex
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="search-highlight font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <section 
      id={section.id} 
      className="mb-10 pt-4 scroll-mt-24 print-page-break"
    >
      {/* Chapter Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b-2 border-indigo-500/20 dark:border-indigo-500/30">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
            {section.number}
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {highlightMatch(section.title)}
            </h2>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bengali-text">
              {highlightMatch(section.bengaliTitle)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {section.priority === 'must' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>🔴 MUST REMEMBER</span>
            </span>
          )}
          {section.priority === 'important' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>🟡 IMPORTANT</span>
            </span>
          )}
        </div>
      </div>

      {/* Chapter Overview Box */}
      {section.overview && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bengali-text">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5">📌 সারসংক্ষেপ:</span>
          {highlightMatch(section.overview)}
        </div>
      )}

      {/* Rules Grid / List */}
      <div className="space-y-6">
        {section.rules.map((rule) => {
          const isRuleCollapsed = collapsedRules[rule.id] !== undefined 
            ? collapsedRules[rule.id] 
            : !isExpanded;

          return (
            <div 
              key={rule.id}
              className="topic-card rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Rule Card Header */}
              <div 
                onClick={() => toggleRule(rule.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-transparent to-transparent dark:from-slate-800/40 cursor-pointer select-none"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      RULE
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {highlightMatch(rule.ruleTitle)}
                    </h3>
                  </div>
                  {rule.bengaliNote && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bengali-text font-medium leading-relaxed">
                      {highlightMatch(rule.bengaliNote)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rule.examSource && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {rule.examSource}
                    </span>
                  )}
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    {isRuleCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Rule Body */}
              {!isRuleCollapsed && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  
                  {/* Formula / Structure Bar if present */}
                  {rule.formula && (
                    <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 font-mono text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2.5 overflow-x-auto">
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px] tracking-wider uppercase shrink-0">
                        FORMULA
                      </span>
                      <span className="font-semibold">{highlightMatch(rule.formula)}</span>
                    </div>
                  )}

                  {/* Core Explanation */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bengali-text">
                    {highlightMatch(rule.explanation)}
                  </p>

                  {/* Examples Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Correct Example */}
                    <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>CORRECT (শুদ্ধ রূপ)</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 pl-5.5 font-medium leading-relaxed bengali-text">
                        {highlightMatch(rule.exampleCorrect)}
                      </div>
                    </div>

                    {/* Incorrect Example if available */}
                    {rule.exampleIncorrect && (
                      <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>COMMON ERROR (ভুল রূপ)</span>
                        </div>
                        <div className="text-slate-800 dark:text-slate-200 pl-5.5 line-through decoration-rose-500 font-medium leading-relaxed bengali-text">
                          {highlightMatch(rule.exampleIncorrect)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exam Trap Alert Box */}
                  {rule.examTrap && (
                    <div className="p-3.5 rounded-lg bg-amber-500/10 border-l-4 border-amber-500 dark:border-amber-400 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[11px] block text-amber-700 dark:text-amber-300">
                          EXAM TRAP / সতর্ক সংকেত
                        </span>
                        <span className="bengali-text font-medium leading-relaxed">
                          {highlightMatch(rule.examTrap)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Memory Shortcut */}
                  {rule.quickMemory && (
                    <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-xs sm:text-sm text-teal-900 dark:text-teal-200 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div className="bengali-text font-semibold">
                        <span className="text-teal-700 dark:text-teal-400 uppercase text-[11px] mr-1">Quick Memory:</span>
                        {highlightMatch(rule.quickMemory)}
                      </div>
                    </div>
                  )}

                  {rule.examSource && (
                    <div className="sm:hidden text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      Tested in: <span className="font-medium text-indigo-600 dark:text-indigo-400">{rule.examSource}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
