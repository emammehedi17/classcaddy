import React, { useState } from 'react';
import { FIFTEEN_MINUTE_DRILL } from '../data/grammarData';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Trophy } from 'lucide-react';

export const FifteenMinuteDrillView: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (qIdx: number, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: option
    }));
  };

  const calculateScore = () => {
    let score = 0;
    FIFTEEN_MINUTE_DRILL.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.ans) score++;
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="mb-12 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-8 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Exam Hall Doorway Drill</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            🚀 15-MINUTE FINAL REVISION & DRILL
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 bengali-text">
            পরীক্ষার হলে প্রবেশের আগে ১০টি সর্বাধিক আসা কনসেপ্ট যাচাই করে চূড়ান্ত আত্মবিশ্বাস অর্জন করুন।
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Quiz</span>
        </button>
      </div>

      {/* Rapid Scan Table: Hall-Entry Essentials */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>⚡ Hall-Entry Cheat Sheet (এক নজরে চোখ বুলিয়ে নিন)</span>
        </div>
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <th className="py-2.5 px-3 w-1/4">Topic</th>
              <th className="py-2.5 px-3 w-2/5">Golden Rule</th>
              <th className="py-2.5 px-3 w-1/3">Exam Trap To Avoid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Order of Pronoun</td>
              <td className="py-2 px-3">Normal: 231 (You, he and I)</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">দোষ স্বীকারে: 123 (I, you and he)</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Linking Verb</td>
              <td className="py-2 px-3">Takes ADJECTIVE (Honey tastes sweet)</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Honey tastes sweetly (ভুল)</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Latin Adjectives</td>
              <td className="py-2 px-3">Senior, Junior, Superior + TO</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Senior than me (কখনোই THAN নয়)</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Subject-Verb: As well as</td>
              <td className="py-2 px-3">Follows the FIRST Subject</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Karim as well as his friends IS coming</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Number Rule</td>
              <td className="py-2 px-3">A number = Plural Verb; The number = Singular Verb</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">The number of boys is increasing</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Subjunctive</td>
              <td className="py-2 px-3">Suggest/Insist that + Subj + BASE VERB</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">He suggests that she GO (no s/es)</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Lest Clause</td>
              <td className="py-2 px-3">Lest + Subj + SHOULD + V1</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">কখনোই lest এর পর not বসবে না</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Interactive 10-Question Drill */}
      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <span>Rapid 10-Question Knowledge Check</span>
      </h3>

      <div className="space-y-4 mb-6">
        {FIFTEEN_MINUTE_DRILL.map((q, idx) => {
          const userAns = selectedAnswers[idx];
          const isAnswered = !!userAns;
          const isCorrect = userAns === q.ans;

          return (
            <div 
              key={idx}
              className={`p-4 rounded-xl border transition ${
                showResults || isAnswered
                  ? isCorrect
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-2">Q{idx + 1}.</span>
                  {q.question}
                </span>

                {isAnswered && (
                  <span className="shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {q.options.map((opt) => {
                  let btnStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400';
                  
                  if (userAns === opt) {
                    btnStyle = opt === q.ans 
                      ? 'border-emerald-500 bg-emerald-600 text-white font-bold'
                      : 'border-rose-500 bg-rose-600 text-white font-bold';
                  } else if ((showResults || isAnswered) && opt === q.ans) {
                    btnStyle = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(idx, opt)}
                      className={`py-2 px-3 rounded-lg border text-xs text-center transition cursor-pointer ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Instant Note on Selection */}
              {isAnswered && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>
                    <strong className="text-emerald-600 dark:text-emerald-400 mr-1">Correct:</strong> 
                    {q.ans} — {q.note}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score Summary */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
          Answered: <strong className="text-indigo-600 dark:text-indigo-400">{Object.keys(selectedAnswers).length}</strong> / {FIFTEEN_MINUTE_DRILL.length} | 
          Current Score: <strong className="text-emerald-600 dark:text-emerald-400">{calculateScore()}</strong> / {FIFTEEN_MINUTE_DRILL.length}
        </div>

        <button
          onClick={() => setShowResults(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Check All Explanations
        </button>
      </div>

    </div>
  );
};
