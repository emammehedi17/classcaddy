import React from 'react';
import { PageView, ThemeMode } from '../types';
import { Phone, MessageCircle, Send, Globe, Smartphone, Apple } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageView) => void;
  theme?: ThemeMode;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, theme = 'light' }) => {
  const isDark = theme === 'dark';

  return (
    <footer
      id="main-app-footer"
      className={`pt-16 pb-8 transition-colors ${
        isDark
          ? 'bg-gray-900 border-t border-gray-800 text-white'
          : 'bg-slate-100/80 border-t border-slate-200 text-slate-800'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {/* Column 1: Quick Links */}
          <div className="col-span-1">
            <h3
              className={`font-semibold mb-4 text-sm uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
              }`}
            >
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => {
                    onNavigate('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`transition ${
                    isDark
                      ? 'text-gray-400 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('archives');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`transition ${
                    isDark
                      ? 'text-gray-400 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Archives & Academic
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('study-plan');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`transition ${
                    isDark
                      ? 'text-gray-400 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Study Plan
                </button>
              </li>
              <li>
                <a
                  href="https://eco.du.ac.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition inline-flex items-center gap-1 ${
                    isDark
                      ? 'text-gray-400 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  DU Student Portal
                </a>
              </li>
              <li>
                <a
                  href="https://result.du.ac.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition inline-flex items-center gap-1 ${
                    isDark
                      ? 'text-gray-400 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  DU Result Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Contact Us */}
          <div className="col-span-1">
            <h3
              className={`font-semibold mb-4 text-sm uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
              }`}
            >
              Contact Us
            </h3>
            <ul
              className={`space-y-2.5 text-xs ${
                isDark ? 'text-gray-400' : 'text-slate-600'
              }`}
            >
              <li>
                <a
                  href="tel:+8801743303877"
                  className={`transition flex items-center gap-2 ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Customer Support</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/+8801743303877"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition flex items-center gap-2 ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  <MessageCircle className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com/emammehedi17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition flex items-center gap-2 ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/emammehedi17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition flex items-center gap-2 ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  <Send className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Telegram</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Others */}
          <div className="col-span-1">
            <h3
              className={`font-semibold mb-4 text-sm uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
              }`}
            >
              Others
            </h3>
            <ul
              className={`space-y-2.5 text-xs ${
                isDark ? 'text-gray-400' : 'text-slate-600'
              }`}
            >
              <li>
                <button
                  onClick={() => onNavigate('study-plan')}
                  className={`transition text-left ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  Study Roadmap
                </button>
              </li>
              <li>
                <a
                  href="https://du.ac.bd/academic/department_item/ARA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  Notice Board
                </a>
              </li>
              <li>
                <a
                  href="https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  Past Exams
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className={`transition text-left ${
                    isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-700'
                  }`}
                >
                  Academic Blog
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 & 5: Download App */}
          <div className="col-span-2 lg:col-span-2">
            <h3
              className={`font-semibold mb-4 text-sm uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
              }`}
            >
              Mobile Access
            </h3>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <div
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 cursor-default transition ${
                  isDark
                    ? 'bg-gray-800/80 border-gray-700'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-[10px] uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      GET IT ON
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Google Play
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  Soon
                </span>
              </div>

              <div
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 cursor-default transition ${
                  isDark
                    ? 'bg-gray-800/80 border-gray-700'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Apple className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-[10px] uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      Download on the
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      App Store
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          className={`mt-14 pt-6 border-t text-center text-xs ${
            isDark ? 'border-gray-800 text-gray-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          <p>&copy; {new Date().getFullYear()} Class Caddy • All academic rights reserved. Designed for University of Dhaka.</p>
        </div>
      </div>
    </footer>
  );
};

