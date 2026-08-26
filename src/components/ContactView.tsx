import React from 'react';
import { Phone, MessageCircle, Send, Mail, MapPin, ExternalLink, Globe } from 'lucide-react';

export const ContactView: React.FC = () => {
  return (
    <div className="container mx-auto px-4 md:px-6 pt-28 pb-20 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3 shadow-sm">
          <Phone className="w-4 h-4" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
          Contact & Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Need academic help, custom study sheets, or have suggestions for Class Caddy? Reach out directly via any of our official channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* WhatsApp */}
        <a
          href="https://wa.me/+8801743303877"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 bg-white dark:bg-gray-800/80 hover:bg-emerald-50/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 rounded-2xl transition-all group flex items-start gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Instant Chat
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
              WhatsApp Support
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
              +880 1743-303877
            </p>
          </div>
        </a>

        {/* Telegram */}
        <a
          href="https://t.me/emammehedi17"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 bg-white dark:bg-gray-800/80 hover:bg-emerald-50/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 rounded-2xl transition-all group flex items-start gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Community Channel
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
              Telegram Direct
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
              @emammehedi17
            </p>
          </div>
        </a>

        {/* Facebook Profile */}
        <a
          href="https://facebook.com/emammehedi17"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 bg-white dark:bg-gray-800/80 hover:bg-emerald-50/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 rounded-2xl transition-all group flex items-start gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Official Page
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
              Facebook Profile
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
              fb.com/emammehedi17
            </p>
          </div>
        </a>

        {/* Customer Support Phone */}
        <a
          href="tel:+8801743303877"
          className="p-6 bg-white dark:bg-gray-800/80 hover:bg-emerald-50/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 rounded-2xl transition-all group flex items-start gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Direct Hotline
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
              Call Direct
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
              +880 1743-303877
            </p>
          </div>
        </a>
      </div>

      {/* Location / Campus Address Card */}
      <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Department of Arabic</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Arts Faculty Building, University of Dhaka, Nilkhet Rd, Dhaka 1000, Bangladesh
          </p>
        </div>
      </div>
    </div>
  );
};
