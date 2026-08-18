import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const FeedbackSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !suggestion.trim()) return;
    setSent(true);
    setTimeout(() => {
      setEmail('');
      setSuggestion('');
      setSent(false);
    }, 4000);
  };

  return (
    <section className="feedback-section py-20 bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>We Value Your Voice</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Feedback & Suggestions
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-8 leading-relaxed">
              We value your input to make Class Caddy better. Please share your suggestions, report any missing lecture points, or let us know what you love!
            </p>

            {/* Social channels */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/emammehedi17"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-emerald-500 text-gray-300 hover:text-white flex items-center justify-center transition shadow border border-gray-700"
                title="Facebook"
              >
                <i className="fab fa-facebook-f text-lg"></i>
              </a>
              <a
                href="https://wa.me/+8801743303877"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-emerald-500 text-gray-300 hover:text-white flex items-center justify-center transition shadow border border-gray-700"
                title="WhatsApp"
              >
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
              <a
                href="https://t.me/emammehedi17"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-emerald-500 text-gray-300 hover:text-white flex items-center justify-center transition shadow border border-gray-700"
                title="Telegram"
              >
                <i className="fab fa-telegram text-lg"></i>
              </a>
            </div>
          </div>

          <div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-xl">
              {sent ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-lg font-bold text-white mb-1">
                    Thank You for Your Feedback!
                  </h3>
                  <p className="text-xs text-gray-300">
                    Your suggestion has been submitted successfully to the Class Caddy moderation team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="feedback-email"
                      className="block text-xs font-medium text-gray-300 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="feedback-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email Address"
                      required
                      className="w-full bg-gray-900/90 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="feedback-suggestion"
                      className="block text-xs font-medium text-gray-300 mb-1.5"
                    >
                      Your Suggestion / Feedback
                    </label>
                    <textarea
                      id="feedback-suggestion"
                      rows={4}
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      placeholder="Write your suggestions, notes corrections, or recommendations..."
                      required
                      className="w-full bg-gray-900/90 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
