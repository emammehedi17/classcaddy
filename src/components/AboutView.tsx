import React from 'react';
import { GraduationCap, Heart, Sparkles, BookOpen, ShieldCheck, Users } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="container mx-auto px-4 md:px-6 pt-28 pb-20 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold mb-3">
          <GraduationCap className="w-4 h-4" />
          <span>About Class Caddy</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
          Empowering Academic Excellence
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          A centralized digital platform born out of Dhaka University’s Department of Arabic to make high-quality lecture notes, poetry recitations, and past questions accessible to every student.
        </p>
      </div>

      {/* Main Story Card */}
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 md:p-8 mb-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-3">Our Mission</h2>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Class Caddy was founded by <strong>Emam Mehedi</strong> with the vision of solving the longstanding challenge of fragmented study notes, inaccessible past exam questions, and lack of line-by-line audio-guided poetry analysis for Arabic literature students at the University of Dhaka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/70">
          <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-700/60">
            <BookOpen className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Authentic Materials</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Curated directly from verified lecture monographs and departmental syllabi.
            </p>
          </div>

          <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-700/60">
            <Sparkles className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Interactive Karaoke</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Synchronized Arabic poetry recitation with word-by-word Bengali & English breakdown.
            </p>
          </div>

          <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-700/60">
            <Users className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Community Driven</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Maintained collaboratively with student feedback, lecture summaries, and updates.
            </p>
          </div>
        </div>
      </div>

      {/* Founder & Contributor Card */}
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-800/60 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full border-2 border-emerald-400 bg-gray-900 flex items-center justify-center text-2xl font-bold text-emerald-400 shadow-md shrink-0">
          EM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Emam Mehedi</h3>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Founder & Lead
            </span>
          </div>
          <p className="text-xs text-emerald-300 mt-0.5">
            Department of Arabic, University of Dhaka
          </p>
          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
            "Join me on this journey as Class Caddy evolves into an extensive portal with personal vlogs, academic tools, business initiatives, and scholarly contributions."
          </p>
        </div>
      </div>
    </div>
  );
};
