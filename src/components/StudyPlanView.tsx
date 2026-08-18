import React, { useState } from 'react';
import { STUDY_SCHEDULE, DAILY_ROUTINE, StudyWeekPlan } from '../data/studyPlanData';
import { Calendar, Clock, CheckSquare, Square, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

export const StudyPlanView: React.FC = () => {
  const [schedule, setSchedule] = useState<StudyWeekPlan[]>(STUDY_SCHEDULE);

  const toggleWeekCompleted = (weekNum: number) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.week === weekNum ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = schedule.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / schedule.length) * 100);

  return (
    <div className="container mx-auto px-4 md:px-6 pt-28 pb-20 max-w-5xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold mb-3">
          <Calendar className="w-4 h-4" />
          <span>8th Semester Academic Routine</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          Academic Study Plan & Strategy
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          A structured 5-week study roadmap designed for Dhaka University Arabic Department final semester preparation.
        </p>
      </div>

      {/* Progress Bar Banner */}
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Syllabus Completion Tracker</span>
            </div>
            <div className="text-xs text-gray-400">
              {completedCount} of {schedule.length} milestone modules completed
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {progressPercent}%
          </div>
        </div>

        <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-gray-700">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 rounded-full shadow-lg shadow-emerald-500/50"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Weekly Plan Cards */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>5-Week Intensive Preparation Schedule</span>
        </h2>

        {schedule.map((item) => (
          <div
            key={item.week}
            onClick={() => toggleWeekCompleted(item.week)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              item.completed
                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/5'
                : 'bg-gray-800/70 border-gray-700/80 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWeekCompleted(item.week);
                }}
                className="mt-1 text-emerald-400 hover:scale-110 transition shrink-0"
              >
                {item.completed ? (
                  <CheckSquare className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Square className="w-6 h-6 text-gray-500" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-900 border border-gray-700 text-emerald-400">
                    Week {item.week} • {item.course}
                  </span>
                  {item.completed && (
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Done
                    </span>
                  )}
                </div>
                <h3
                  className={`text-base font-bold mt-1.5 ${
                    item.completed ? 'text-gray-300 line-through' : 'text-white'
                  }`}
                >
                  {item.title}
                </h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-400 list-disc list-inside">
                  {item.focusTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-700/50 pt-2 md:pt-0">
              <span className="text-xs text-gray-400">Recommended</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {item.recommendedHours} Hours
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Study Routine Timetable */}
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Recommended Daily Revision Timetable</span>
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Optimized for maximum retention, recitation fluency, and written speed.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900 text-xs uppercase font-semibold text-emerald-400 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3">Subject / Focus</th>
                <th className="px-4 py-3">Core Learning Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {DAILY_ROUTINE.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-700/30 transition">
                  <td className="px-4 py-3 font-mono text-xs text-emerald-400 font-semibold whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {row.task}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
