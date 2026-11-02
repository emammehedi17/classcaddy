import React, { useState } from 'react';
import { BookOpen, Award, Calendar, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <header className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/60 shadow-xl overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>EXAMINATION-ORIENTED REVISION ARCHITECTURE</span>
          </div>
          
          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs transition cursor-pointer"
            title="Scan or View QR Code"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Mobile QR Code</span>
          </button>
        </div>

        {/* Main Title & Subtitle */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
          ENGLISH GRAMMAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-teal-300 to-indigo-300">— MASTER REVISION NOTE</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl font-medium text-slate-300 mb-6 flex flex-wrap items-center gap-2">
          <span>BCS</span>
          <span className="text-indigo-400">•</span>
          <span>University Admission</span>
          <span className="text-indigo-400">•</span>
          <span>Bank Recruitment</span>
          <span className="text-indigo-400">•</span>
          <span>Govt & Competitive Exams</span>
        </p>

        {/* Author & Date Bar - In Document Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Prepared By</span>
              <span className="font-semibold text-white">Emam Mehedi</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Revision Date</span>
              <span className="font-semibold text-teal-200">1 November, 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:col-span-2 md:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Source Foundation</span>
              <span className="font-semibold text-amber-200">6 High-Yield Exam References</span>
            </div>
          </div>
        </div>

        {/* Quick Exam Note in Bengali */}
        <div className="mt-5 p-3.5 rounded-lg bg-indigo-900/30 border border-indigo-500/20 text-indigo-200 text-xs sm:text-sm leading-relaxed bengali-text">
          <span className="font-bold text-amber-300 mr-1.5">⚡ শেষ মুহূর্তের রিভিশন নির্দেশিকা:</span>
          দীর্ঘ তাত্ত্বিক আলোচনার বদলে সরাসরি পরীক্ষা-কেন্দ্রিক নিয়ম (Golden Rules), কমন ফাঁদ (Exam Traps), শর্টকাট সূত্র ও ভুল সংশোধন (Sentence Correction) সংকলিত।
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Revision Note QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mb-4">
              {/* Scalable SVG QR Representation */}
              <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                {/* QR Pattern Simulation */}
                <path d="M10 10h24v24h-24z M14 14h16v16h-16z M18 18h8v8h-8z M66 10h24v24h-24z M70 14h16v16h-16z M74 18h8v8h-8z M10 66h24v24h-24z M14 70h16v16h-16z M18 74h8v8h-8z" fill="#0f172a" />
                <path d="M40 10h8v8h-8z M52 10h6v6h-6z M40 22h12v6h-12z M44 32h14v6h-14z M10 40h8v12h-8z M22 40h6v6h-6z M32 40h16v8h-16z M52 40h8v12h-8z M64 40h12v6h-12z M80 40h10v8h-10z M40 52h8v8h-8z M68 52h14v8h-14z M86 52h4v8h-4z M40 64h6v12h-6z M50 64h12v6h-12z M66 64h8v8h-8z M78 64h12v12h-12z M40 80h14v10h-14z M58 76h8v14h-8z M70 82h10v8h-10z M84 80h6v10h-6z" fill="#0f172a" />
              </svg>
              <span className="text-slate-800 font-mono text-[11px] mt-2 font-medium">SCAN FOR OFFLINE STUDY</span>
            </div>

            <p className="text-xs text-slate-300 text-center mb-4">
              ইংরেজি গ্রামার মাস্টার রিভিশন নোট • Prepared by: Emam Mehedi
            </p>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
