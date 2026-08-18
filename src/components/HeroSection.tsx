import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Lock, Mail, CheckCircle2, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

interface HeroSectionProps {
  user: UserProfile;
  onLogin: (email: string, name?: string) => void;
  onOpenSignup: () => void;
  onExploreCourses: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  user,
  onLogin,
  onOpenSignup,
  onExploreCourses,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your academic email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    // Successful login simulation
    const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();
    onLogin(email, derivedName);
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-28 pb-16">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-80 md:w-96 h-80 md:h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 md:w-96 h-80 md:h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-60 md:w-72 h-60 md:h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 max-w-6xl mx-auto">
          {/* Welcome Text */}
          <div className="text-center lg:text-left flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Department of Arabic, University of Dhaka</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-emerald-400 leading-[1.1] tracking-tight">
              Welcome to <br className="hidden sm:inline" />
              <span className="text-white">Class Caddy</span>
            </h2>

            <p className="text-gray-300 text-base md:text-lg mt-6 leading-relaxed font-light">
              Welcome to <strong className="text-white font-medium">The Class Caddy</strong>, your digital academic hub for 8th semester Arabic literature notes, interactive poetry with word-by-word analysis, trilingual terminology bank, and verified past year questions.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onExploreCourses}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore 8th Sem Courses</span>
              </button>

              <button
                onClick={onOpenSignup}
                className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700 active:scale-95 text-gray-200 border border-gray-700 font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                <span>Request Student Access</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:text-left border-t border-gray-800/80 pt-6">
              <div>
                <div className="text-xl md:text-2xl font-bold text-emerald-400">4</div>
                <div className="text-xs text-gray-400 font-medium">Core Courses</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-emerald-400">2017–23</div>
                <div className="text-xs text-gray-400 font-medium">Past Question Bank</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-emerald-400">Trilingual</div>
                <div className="text-xs text-gray-400 font-medium">Arabic-Bangla-Eng</div>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-sm login-form-container">
            {/* Animated Glow Border */}
            <div
              className={`login-glow-container ${
                isFocused ? 'login-glow-active' : ''
              }`}
            >
              <span className="glow"></span>
              <span className="glow"></span>
              <span className="glow"></span>
              <span className="glow"></span>
            </div>

            <div className="login-glow-card relative z-10">
              {user.isLoggedIn ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-4 border border-emerald-500/40">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Welcome, {user.name || 'Member'}!
                  </h3>
                  <p className="text-xs text-emerald-400 mb-6">
                    Full student access granted to all 8th Semester materials.
                  </p>
                  <button
                    onClick={onExploreCourses}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-emerald-500/30 text-sm"
                  >
                    Go to Academic Courses
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-gray-700/60 mb-3 border border-gray-600 shadow-inner">
                      <User className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Member Login
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Access verified course notes & audio recitation
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="login-email"
                        className="block text-xs font-medium text-gray-300 mb-1.5 text-left"
                      >
                        Email ID*
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="login-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Enter your academic email"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/70 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 text-left">
                        i.e. s-2020343876@arab.du.ac.bd
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-gray-300 mb-1.5 text-left"
                      >
                        Password*
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          id="login-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Enter your password"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/70 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-red-400 text-center text-xs bg-red-950/40 p-2 rounded border border-red-800/50">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-lg transition duration-200 text-sm shadow-md shadow-emerald-500/25"
                    >
                      Login
                    </button>
                  </form>

                  <p className="text-xs text-gray-400 text-center mt-4 pt-3 border-t border-gray-700/60">
                    Don't have an account?{' '}
                    <button
                      onClick={onOpenSignup}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline inline-block ml-1"
                    >
                      Create account
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
