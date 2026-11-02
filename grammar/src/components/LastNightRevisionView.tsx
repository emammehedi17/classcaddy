import React, { useState } from 'react';
import { LAST_NIGHT_FORMULAS } from '../data/grammarData';
import { Zap, Copy, Check, Filter, BookmarkCheck, ArrowRight } from 'lucide-react';

export const LastNightRevisionView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filtered = LAST_NIGHT_FORMULAS.filter(item => 
    item.topic.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.formula.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="mb-12 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-8 shadow-lg">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Yield Cram Mode</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ⚡ LAST-NIGHT REVISION
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 bengali-text">
            পরীক্ষার আগের রাতের জন্য সর্বাধিক আসা ২৪টি মূল ফর্মুলা ও ট্র্যাপের সংক্ষিপ্ত বুলেট নোট।
          </p>
        </div>

        {/* Quick Filter */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter formula..."
            className="w-full px-3.5 py-1.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid of Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <div 
            key={idx}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/70 hover:border-amber-400/80 dark:hover:border-amber-500/80 shadow-xs hover:shadow-md transition group relative"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                <span>{item.topic}</span>
              </span>

              <button
                onClick={() => copyToClipboard(`${item.topic}: ${item.formula}`, idx)}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition cursor-pointer"
                title="Copy formula"
              >
                {copiedIndex === idx ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                )}
              </button>
            </div>

            <div className="font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 break-words">
              {item.formula}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-slate-500 py-6">
          No formulas matching your search query.
        </p>
      )}
    </div>
  );
};
