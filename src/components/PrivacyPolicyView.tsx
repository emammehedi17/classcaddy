import React from 'react';
import { Shield, Lock, Database, UserCheck, Eye, FileText, Mail, Globe } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  const lastUpdated = 'November 19, 2026';

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-10">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Effective Date &amp; Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <p>
              Welcome to <strong>Class Caddy</strong> ("we", "our", or "us"). Class Caddy is an academic study planning, MCQ practice, and archive resource platform designed for students at the University of Dhaka and competitive exam learners. This Privacy Policy explains how we collect, use, store, and protect your personal information when you sign in with Google or use our application.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                1. Information We Collect
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Account Profile Information:</strong> When you authenticate using Google Sign-In (via Firebase Authentication), we receive your basic Google profile details: your <strong>display name</strong>, <strong>email address</strong>, <strong>profile picture URL</strong>, and a unique Firebase User ID (<code>uid</code>).
              </li>
              <li>
                <strong>User-Generated Study &amp; Exam Data:</strong> We store the study plans, monthly/weekly/daily schedules, study timer logs, daily study goals, vocabulary lists, stories, custom MCQ banks, quiz/exam results, and bookmarked questions that you create or import into your account.
              </li>
              <li>
                <strong>Local Browser Storage:</strong> We use your browser&apos;s <code>localStorage</code> to save UI preferences (such as Light/Dark theme mode, reader font size, exam configuration presets, and active exam session drafts) so your experience remains seamless across page reloads.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                2. How We Use Your Information
              </h2>
            </div>
            <p className="mb-2">We use the collected information strictly to provide and improve Class Caddy&apos;s core educational features:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To authenticate your identity and sync your personal study plans, timers, vocabulary, and MCQ banks across devices.</li>
              <li>To calculate your study streaks, daily goal completion, and exam performance analytics.</li>
              <li>To allow you to create cloud backups and restore your study plan data at any time.</li>
              <li>We <strong>do not</strong> sell, rent, trade, or share your personal data or email address with advertisers or third-party marketing services.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                3. Data Storage &amp; Third-Party Services
              </h2>
            </div>
            <p className="mb-2">
              Class Caddy relies on trusted infrastructure providers to operate securely:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Firebase (Authentication &amp; Cloud Firestore):</strong> Your account authentication and study data are securely hosted on Google Cloud / Firebase infrastructure under your unique user ID.
              </li>
              <li>
                <strong>Google OAuth 2.0 Compliance:</strong> Our use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We only request basic profile and email scopes required for sign-in.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                4. Data Security, Export &amp; Deletion Rights
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Full Data Portability:</strong> You can export a complete JSON copy of your study plans and MCQ data at any time using the in-app <em>Backup / Restore</em> tool.
              </li>
              <li>
                <strong>Data Deletion:</strong> You can delete individual study rows, days, entire months, cloud backups, or exam histories directly inside the application. You may also request complete account and data deletion by contacting us at the email address below.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                5. Changes to This Privacy Policy
              </h2>
            </div>
            <p>
              We may update this Privacy Policy periodically to reflect improvements to Class Caddy or legal requirements. Any updates will be posted on this page with an updated effective date.
            </p>
          </section>

          <section className="bg-emerald-50/70 dark:bg-gray-900/60 border border-emerald-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                6. Contact Information
              </h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              If you have any questions about this Privacy Policy, your data, or wish to request data deletion, please contact us:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-800 dark:text-gray-200">
              <li><strong>Application:</strong> Class Caddy — Study Plan &amp; Academic Resource Platform</li>
              <li><strong>Administrator:</strong> Emam Mehedi (University of Dhaka)</li>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:emammehedi17@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  emammehedi17@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <a href="https://facebook.com/emammehedi17" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  facebook.com/emammehedi17
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
