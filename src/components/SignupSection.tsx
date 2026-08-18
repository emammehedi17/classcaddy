import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, CheckCircle2, Lock, Mail, Phone, User } from 'lucide-react';

interface SignupSectionProps {
  onSignupSuccess: (email: string, name: string) => void;
  onSwitchToLogin: () => void;
}

export const SignupSection: React.FC<SignupSectionProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !mobile.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setErrorMsg('');
    setIsSubmitted(true);
    setTimeout(() => {
      onSignupSuccess(email, name);
    }, 1200);
  };

  return (
    <div id="signup-section" className="relative z-10 py-24 bg-gray-900/90 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-sm login-form-container">
            {/* Glow Effect Container */}
            <div
              id="signup-glow"
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
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-4 border border-emerald-500/40 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Access Granted!
                  </h3>
                  <p className="text-xs text-gray-300">
                    Welcome to Class Caddy, <strong className="text-emerald-400">{name}</strong>. Signing you in...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-gray-700/50 mb-3 border border-gray-600 shadow-inner">
                      <UserPlus className="h-7 w-7 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Request Access
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">
                      Sign up to get full access to all 8th Semester contents.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="signup-name"
                        className="block text-xs font-medium text-gray-300 mb-1 text-left"
                      >
                        Full Name*
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="signup-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Enter your full name"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="block text-xs font-medium text-gray-300 mb-1 text-left"
                      >
                        Email*
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="signup-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Enter your email"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-mobile"
                        className="block text-xs font-medium text-gray-300 mb-1 text-left"
                      >
                        Mobile*
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="signup-mobile"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Enter your mobile number"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-password"
                        className="block text-xs font-medium text-gray-300 mb-1 text-left"
                      >
                        Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="signup-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Set a secure password"
                          required
                          className="w-full pl-9 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-emerald-400 transition"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-red-400 text-center text-xs bg-red-950/40 p-2 rounded border border-red-800/50">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-lg transition duration-200 text-sm shadow-md shadow-emerald-500/25 mt-2"
                    >
                      Sign Up
                    </button>
                  </form>

                  <p className="text-xs text-gray-400 text-center mt-4 pt-3 border-t border-gray-700/60">
                    Already have an account?{' '}
                    <button
                      onClick={onSwitchToLogin}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline inline-block ml-1"
                    >
                      Login instead
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
