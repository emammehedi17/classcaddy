import type { AppSettings } from './appSettings';
import {
  applyAppSettings,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from './appSettings';

type SettingsProfile = {
  name?: string;
  email?: string;
  photoURL?: string;
  uid?: string;
  isLoggedIn?: boolean;
};

type SettingsDialogOptions = {
  profile: SettingsProfile;
  onSaveProfile?: (name: string) => Promise<void> | void;
  onSaveAppSettings?: (settings: AppSettings) => Promise<void> | void;
  onSaveExamPreferences?: (legacy: RecordValue, exam: RecordValue) => Promise<void> | void;
  onExportCloudBackup?: () => Promise<Record<string, unknown> | null>;
  onRestoreCloudBackup?: (data: Record<string, any>) => Promise<number>;
  onRestoreProfile?: (name: string) => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
};

type RecordValue = Record<string, any>;

const LEGACY_QUIZ_DEFAULTS = {
  timePerQuestion: 30,
  negativeMark: 0.25,
  showAnswersInstantly: true,
  shuffleQuestions: true,
};

const EXAM_DEFAULTS = {
  presetId: 'custom', mode: 'exam', layout: 'screen', questionOrder: 'random',
  shuffleQuestions: true, shuffleOptions: true, avoidRecent: false, includeAttempted: true,
  wrongOnly: false, bookmarkedOnly: false, questionCount: 25, timingType: 'whole',
  totalMinutes: 15, secondsPerQuestion: 36, customTimeOverride: false, positiveMark: 1,
  negativeMark: 0.5, unansweredMark: 0, passPercent: 50, allowNavigation: true,
  allowMarkForReview: true, lockAnswer: false, confirmSubmit: true,
  autoSubmitOnTimeout: true, autoAdvance: false, showPalette: true,
  soundEffects: false, trackTabSwitches: true,
};

const SAFE_BACKUP_KEY = /^(?:auth|firebase|token|password|session|cc_auth_user|class_caddy_user)/i;

function readRecord(key: string, defaults: RecordValue): RecordValue {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    return { ...defaults };
  }
}

function setControl(root: HTMLElement, name: string, value: unknown): void {
  const control = root.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-setting="${name}"]`);
  if (!control) return;
  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    control.checked = Boolean(value);
  } else {
    control.value = String(value ?? '');
  }
}

function getValue(root: HTMLElement, name: string): string {
  return root.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-setting="${name}"]`)?.value || '';
}

function getChecked(root: HTMLElement, name: string): boolean {
  return root.querySelector<HTMLInputElement>(`[data-setting="${name}"]`)?.checked ?? false;
}

function installDialogStyles(): void {
  if (document.getElementById('cc-settings-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'cc-settings-modal-styles';
  style.textContent = `
    #cc-settings-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(5,12,25,.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit;font-size:1rem;line-height:1.55;color:#1f2937}
    #cc-settings-dialog{width:min(1080px,100%);height:min(720px,calc(100dvh - 64px));background:#fff;border:1px solid #dbe3ed;border-radius:22px;box-shadow:0 28px 90px rgba(0,0,0,.34);display:flex;flex-direction:column;overflow:hidden}
    #cc-settings-dialog *{box-sizing:border-box}
    #cc-settings-overlay #cc-settings-dialog>header#cc-settings-head{position:static!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;z-index:auto!important;float:none!important;}
    #cc-settings-dialog{font-family:inherit}
    #cc-settings-dialog button,#cc-settings-dialog input,#cc-settings-dialog select{font:inherit}
    #cc-settings-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #e5e7eb;background:#fff;flex:none}
    #cc-settings-head h2{margin:0;font-size:22px;font-weight:800;color:#111827}
    #cc-settings-head p{margin:3px 0 0;color:#64748b;font-size:13px}
    #cc-settings-close{width:40px;height:40px;border:1px solid #dbe3ed;border-radius:12px;background:#f8fafc;color:#334155;font-size:22px;cursor:pointer}
    #cc-settings-layout{display:grid;grid-template-columns:215px minmax(0,1fr);min-height:0;flex:1}
    #cc-settings-nav{padding:16px 12px;border-right:1px solid #e5e7eb;background:#f5f8fc;display:flex;flex-direction:column;gap:6px}
    #cc-settings-nav button{display:flex;gap:10px;align-items:center;text-align:left;border:1px solid transparent;background:transparent;color:#334155;border-radius:11px;padding:12px;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s}
    #cc-settings-nav button:hover{background:#eaf0f7}
    #cc-settings-nav button[aria-selected="true"]{color:#047857;background:#d1fae5;border-color:#a7f3d0}
    #cc-settings-content{overflow:auto;padding:26px;min-width:0;background:#fff}
    .cc-settings-section[hidden]{display:none}
    .cc-settings-section h3{margin:0 0 4px;font-size:20px;color:#111827}
    .cc-settings-intro{margin:0 0 20px;color:#53657b;font-size:14px}
    .cc-settings-card{border:1px solid #dbe3ed;border-radius:16px;padding:19px;margin:0 0 16px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.035)}
    .cc-settings-card h4{margin:0 0 12px;font-size:14px;color:#1f2937}
    .cc-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
    .cc-settings-field{display:flex;flex-direction:column;gap:7px;color:#334155;font-size:13px;font-weight:700}
    .cc-settings-field input,.cc-settings-field select{width:100%;min-height:42px;border:1px solid #bdc9d8;border-radius:10px;padding:0 11px;background:#fff;color:#0f172a;outline:none}
    .cc-settings-field input:focus,.cc-settings-field select:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.14)}
    .cc-settings-field input[readonly]{background:#f8fafc;color:#64748b}
    .cc-settings-toggle{display:flex;align-items:flex-start;gap:11px;padding:10px 0;color:#263449;font-size:14px}
    .cc-settings-toggle input{accent-color:#059669;width:17px;height:17px;margin:1px 0 0}
    .cc-settings-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:14px}
    .cc-settings-btn{border:1px solid #bdc9d8;border-radius:10px;background:#fff;color:#243247;padding:10px 15px;font-weight:750;cursor:pointer}
    .cc-settings-btn:hover{background:#f8fafc}
    .cc-settings-btn.primary{background:#059669;border-color:#059669;color:#fff}
    .cc-settings-btn.danger{color:#b91c1c;border-color:#fecaca;background:#fff}
    .cc-settings-status{min-height:20px;margin:10px 0 0;color:#047857;font-size:12px}
    .cc-settings-profile{display:flex;align-items:center;gap:14px;margin-bottom:16px}
    .cc-settings-profile img{width:58px;height:58px;border-radius:50%;object-fit:cover;background:#f1f5f9;border:2px solid #d1fae5}
    .cc-settings-note{color:#64748b;font-size:12px;margin:8px 0 0}
    html.dark #cc-settings-dialog{background:#0f172a;border-color:#475569;color:#f1f5f9}
    html.dark #cc-settings-head{border-color:#475569;background:#111c30}
    html.dark #cc-settings-head h2,html.dark .cc-settings-section h3,html.dark .cc-settings-card h4{color:#f8fafc}
    html.dark #cc-settings-head p,html.dark .cc-settings-intro,html.dark .cc-settings-note{color:#b7c4d6}
    html.dark #cc-settings-nav{background:#0b1425;border-color:#475569}
    html.dark #cc-settings-nav button{color:#dbe5f2}
    html.dark #cc-settings-nav button:hover{background:#1b2a40}
    html.dark #cc-settings-nav button[aria-selected="true"]{background:#064e3b;border-color:#0f766e;color:#d1fae5}
    html.dark #cc-settings-content{background:#0f172a}
    html.dark .cc-settings-card{background:#152238;border-color:#42536b}
    html.dark .cc-settings-field,html.dark .cc-settings-toggle{color:#e2eaf4}
    html.dark .cc-settings-field input,html.dark .cc-settings-field select{background:#0b1425;border-color:#60728a;color:#f8fafc}
    html.dark .cc-settings-field input[readonly]{background:#25344b;color:#d2dbea}
    html.dark #cc-settings-close{background:#1e293b;border-color:#53647a;color:#f1f5f9}
    html.dark .cc-settings-btn{background:#1e293b;border-color:#64748b;color:#f1f5f9}
    html.dark .cc-settings-btn.primary{background:#059669;border-color:#059669;color:#fff}
    html.dark .cc-settings-btn.danger{background:#2b1720;border-color:#7f1d1d;color:#fecaca}
    html[data-reading-size="small"] #cc-settings-dialog{zoom:.875;width:min(1234px,calc(100vw - 48px));height:min(823px,calc((100dvh - 64px)/.875))}
    html[data-reading-size="large"] #cc-settings-dialog{zoom:1.125;width:min(960px,calc((100vw - 48px)/1.125));height:min(640px,calc((100dvh - 64px)/1.125))}
    html[data-theme="sepia"] #cc-settings-dialog,html[data-theme="sepia"] #cc-settings-head,html[data-theme="sepia"] #cc-settings-content,html[data-theme="sepia"] .cc-settings-card{background:#fbf6e9;border-color:#d8c9aa;color:#43382b}
    html[data-theme="forest"] #cc-settings-dialog,html[data-theme="forest"] #cc-settings-head,html[data-theme="forest"] #cc-settings-content,html[data-theme="forest"] .cc-settings-card{background:#17362d;border-color:#36584c;color:#e4f2e9}
    html[data-theme="midnight"] #cc-settings-dialog,html[data-theme="midnight"] #cc-settings-head,html[data-theme="midnight"] #cc-settings-content,html[data-theme="midnight"] .cc-settings-card{background:#131d36;border-color:#34415f;color:#e7eaff}
    @media(max-width:640px){#cc-settings-overlay{padding:0}#cc-settings-dialog{height:100dvh;width:100%;border-radius:0}#cc-settings-head{padding:14px 16px}#cc-settings-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}#cc-settings-nav{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid #e5e7eb;padding:8px;gap:4px}#cc-settings-nav button{white-space:nowrap;padding:9px;font-size:12px}#cc-settings-content{padding:16px}.cc-settings-grid{grid-template-columns:1fr}}
    @media(max-width:640px){html[data-reading-size="small"] #cc-settings-dialog,html[data-reading-size="large"] #cc-settings-dialog{zoom:1;width:100%;height:100dvh}}
    @media(prefers-reduced-motion:reduce){#cc-settings-dialog *,#cc-settings-overlay *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `;
  document.head.appendChild(style);
}

function safeProfileCache(name: string, profile: SettingsProfile): void {
  try {
    const ccAuth = JSON.parse(localStorage.getItem('cc_auth_user') || '{}');
    if (ccAuth.isLoggedIn || ccAuth.uid) {
      ccAuth.displayName = name;
      localStorage.setItem('cc_auth_user', JSON.stringify(ccAuth));
    }
    const saved = JSON.parse(localStorage.getItem('class_caddy_user') || '{}');
    if (saved.isLoggedIn || saved.email) {
      saved.name = name;
      localStorage.setItem('class_caddy_user', JSON.stringify(saved));
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('classcaddy:profile-change', { detail: { ...profile, name } }));
}

async function collectBackup(options: SettingsDialogOptions): Promise<RecordValue> {
  const localStorageData: RecordValue = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || SAFE_BACKUP_KEY.test(key) || /installprompt|install_prompt|settings-modal/i.test(key)) continue;
    localStorageData[key] = localStorage.getItem(key);
  }
  let cloud: Record<string, unknown> | null = null;
  if (options.profile.isLoggedIn && options.onExportCloudBackup) cloud = encodeCloudValues(await options.onExportCloudBackup());
  return {
    app: 'Class Caddy',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    localStorage: localStorageData,
    profile: { name: options.profile.name || '', email: options.profile.email || '', photoURL: options.profile.photoURL || '' },
    cloud,
  };
}

function encodeCloudValues(value: any): any {
  if (value && typeof value.toDate === 'function' && typeof value.seconds === 'number') {
    return { __classCaddyTimestamp: true, seconds: value.seconds, nanoseconds: value.nanoseconds || 0 };
  }
  if (Array.isArray(value)) return value.map(encodeCloudValues);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeCloudValues(item)]));
  return value;
}

async function downloadBackup(options: SettingsDialogOptions): Promise<boolean> {
  const backup = await collectBackup(options);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `class-caddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return backup.cloud !== null;
}

async function restoreBackup(file: File, options: SettingsDialogOptions): Promise<number> {
  const payload = JSON.parse(await file.text());
  if (payload?.app !== 'Class Caddy' || ![1, 2].includes(payload?.schemaVersion) || !payload.localStorage || typeof payload.localStorage !== 'object') {
    throw new Error('এটি Class Caddy-এর সমর্থিত backup ফাইল নয়।');
  }
  const entries = Object.entries(payload.localStorage as RecordValue)
    .filter(([key, value]) => !SAFE_BACKUP_KEY.test(key) && typeof value === 'string');
  if (payload.cloud && !options.onRestoreCloudBackup) throw new Error('Firebase backup restore-এর জন্য account sync support পাওয়া যায়নি।');
  const confirmText = loadAppSettings().language === 'en'
    ? `${entries.length} device items will be restored. ${payload.cloud ? 'Firebase study plans, quiz/exam results, reviews, and settings will be replaced by this backup.' : 'Matching local data will be replaced.'} Continue?`
    : `${entries.length}টি device item restore হবে। ${payload.cloud ? 'Firebase-এর study plan, quiz/exam result, review ও settings backup দিয়ে প্রতিস্থাপিত হবে।' : 'একই key-এর local data প্রতিস্থাপিত হবে।'} এগোবেন?`;
  if (!window.confirm(confirmText)) return 0;
  entries.forEach(([key, value]) => localStorage.setItem(key, value as string));
  let restoredCloud = 0;
  if (payload.cloud && options.onRestoreCloudBackup) restoredCloud = await options.onRestoreCloudBackup(payload.cloud);
  if (typeof payload.profile?.name === 'string' && payload.profile.name.trim()) await options.onRestoreProfile?.(payload.profile.name.trim());
  applyAppSettings(loadAppSettings());
  window.dispatchEvent(new CustomEvent('classcaddy:settings-change', { detail: loadAppSettings() }));
  window.dispatchEvent(new StorageEvent('storage', { key: 'cc_quiz_settings', newValue: localStorage.getItem('cc_quiz_settings') }));
  window.dispatchEvent(new StorageEvent('storage', { key: 'cc_new_exam_settings_v1', newValue: localStorage.getItem('cc_new_exam_settings_v1') }));
  window.dispatchEvent(new CustomEvent('classcaddy:exam-settings-change', {
    detail: {
      legacy: readRecord('cc_quiz_settings', LEGACY_QUIZ_DEFAULTS),
      exam: readRecord('cc_new_exam_settings_v1', EXAM_DEFAULTS),
    },
  }));
  return entries.length + restoredCloud;
}

const SETTINGS_EN: Record<string, string> = {
  'অ্যাপ সেটিংস': 'App settings',
  'আপনার পড়াশোনার অভিজ্ঞতা নিজের মতো সাজান': 'Personalize your study experience',
  '👤 ব্যক্তিগত তথ্য': '👤 Personal information',
  '🎨 চেহারা ও ফন্ট': '🎨 Appearance & fonts',
  '📝 পরীক্ষা': '📝 Exams',
  '💾 Backup': '💾 Backup',
  '⚙️ অ্যাকাউন্ট': '⚙️ Account',
  'ব্যক্তিগত তথ্য': 'Personal information',
  'আপনার account-এর পরিচিতি দেখুন ও নাম আপডেট করুন।': 'View your account details and update your name.',
  'Google account-এর প্রোফাইল ছবি': 'Profile photo from your Google account',
  'নাম': 'Name',
  'ইমেইল': 'Email',
  'ইমেইল Google account থেকে আসে; এখানে এটি পরিবর্তন করা যাবে না।': 'Your email comes from Google and cannot be changed here.',
  'নাম সংরক্ষণ করুন': 'Save name',
  'চেহারা ও পড়ার ধরন': 'Appearance & reading',
  'এই পছন্দগুলো এই browser-এ সংরক্ষিত থাকবে।': 'These preferences are saved in this browser and synced to your account.',
  'অ্যাপের থিম ও লেখা': 'Theme, language & text',
  'থিম': 'Theme',
  'লাইট': 'Light',
  'ডার্ক': 'Dark',
  'সেপিয়া': 'Sepia',
  'ফরেস্ট': 'Forest',
  'মিডনাইট': 'Midnight',
  'বাংলা ফন্ট': 'Bangla font',
  'Sans Serif': 'Sans Serif',
  'হিন্দ সিলিগুড়ি': 'Hind Siliguri',
  'কালপুরুষ': 'Kalpurush',
  'আমিরি': 'Amiri',
  'ভাষা': 'Language',
  'বাংলা': 'বাংলা',
  'English': 'English',
  'লেখার আকার': 'Text size',
  'ছোট': 'Small',
  'মাঝারি': 'Medium',
  'বড়': 'Large',
  'কম animation ব্যবহার করুন': 'Reduce motion',
  'পেজের চলমান transition কমাবে।': 'Reduce animations and transitions across pages.',
  'পছন্দ সংরক্ষণ করুন': 'Save preferences',
  'পরীক্ষার পছন্দ': 'Exam preferences',
  'এগুলো নতুন quiz ও exam শুরু করার default হবে। চলমান পরীক্ষা বদলাবে না।': 'These defaults apply to new quizzes and exams. Active exams are unchanged.',
  'সাধারণ MCQ quiz': 'Standard MCQ quiz',
  'প্রতি প্রশ্নে সময়': 'Time per question',
  'ভুল উত্তরে নম্বর': 'Negative marks',
  'প্রশ্ন এলোমেলো করুন': 'Shuffle questions',
  'উত্তর দেওয়ার পর সঠিক উত্তর দেখান': 'Show correct answers after responding',
  'Exam Studio default': 'Exam Studio defaults',
  'প্রশ্ন সংখ্যা': 'Question count',
  'পরীক্ষার ধরন': 'Exam mode',
  'প্রশ্ন দেখানোর ধরন': 'Question layout',
  'একবারে একটি': 'One at a time',
  'সব প্রশ্ন একসাথে': 'All questions on one page',
  'OMR bubble sheet': 'OMR bubble sheet',
  'প্রশ্নের ক্রম': 'Question order',
  'এলোমেলো': 'Random',
  'ক্রম অনুযায়ী': 'Original order',
  'সময় ব্যবস্থা': 'Timing',
  'পুরো পরীক্ষার সময়': 'Whole exam',
  'প্রতি প্রশ্নে সময়': 'Per question',
  'সময় সীমা নেই': 'No time limit',
  'পুরো পরীক্ষার সময় (মিনিট)': 'Whole exam time (minutes)',
  'প্রতি প্রশ্নে সময় (সেকেন্ড)': 'Time per question (seconds)',
  'সঠিক উত্তরে নম্বর': 'Marks for a correct answer',
  'ফাঁকা উত্তরে নম্বর': 'Marks for an unanswered question',
  'পাস নম্বর (%)': 'Pass mark (%)',
  'সাম্প্রতিক প্রশ্ন এড়িয়ে চলুন': 'Avoid recently used questions',
  'Exam Studio-র সময়ের জন্য নিজের default ব্যবহার করুন': 'Use custom time defaults in Exam Studio',
  'আগে করা প্রশ্ন অন্তর্ভুক্ত করুন': 'Include attempted questions',
  'শুধু ভুল করা প্রশ্ন নিন': 'Use only questions answered incorrectly',
  'শুধু বুকমার্ক করা প্রশ্ন নিন': 'Use only bookmarked questions',
  'বিকল্প এলোমেলো করুন': 'Shuffle answer options',
  'আগের/পরের প্রশ্নে যাওয়া যাবে': 'Allow moving between questions',
  'প্রশ্ন review-এর জন্য চিহ্নিত করা যাবে': 'Allow marking questions for review',
  'উত্তর দেওয়ার পর পরিবর্তন বন্ধ করুন': 'Lock an answer after selection',
  'উত্তর দিলে পরের প্রশ্নে যান': 'Advance after answering',
  'জমা দেওয়ার আগে নিশ্চিত করুন': 'Confirm before submitting',
  'সময় শেষ হলে নিজে থেকে জমা দিন': 'Submit automatically when time expires',
  'প্রশ্নের তালিকা দেখান': 'Show the question palette',
  'পরীক্ষায় sound effect চালু রাখুন': 'Enable exam sound effects',
  'পরীক্ষার সময় tab বদলানো গুনে রাখুন': 'Track tab switches during exams',
  'পরীক্ষার পছন্দ সংরক্ষণ করুন': 'Save exam preferences',
  'Backup ও Restore': 'Backup & restore',
  'স্বয়ংক্রিয় Backup': 'Automatic backup',
  'স্বয়ংক্রিয় cloud backup চালু রাখুন': 'Enable automatic cloud backup',
  'Study Plan-এর cloud backup সময় অনুযায়ী চালাবে।': 'Study Plan cloud backup will run on schedule.',
  'Backup পছন্দ সংরক্ষণ করুন': 'Save backup preferences',
  'এই browser-এর data': 'Data on this device',
  'Account sign-in তথ্য ও token backup-এ রাখা হয় না। Restore করলে একই key-এর বর্তমান data প্রতিস্থাপিত হবে।': 'Sign-in details and tokens are excluded. Restore replaces saved data with matching keys.',
  'Backup ডাউনলোড': 'Download backup',
  'Backup restore': 'Restore backup',
  'আপনার browser-এ রাখা app preference ও study data JSON ফাইলে নিন, অথবা আগের backup ফিরিয়ে আনুন।': 'Export your app data and preferences to a JSON file, or restore a previous backup.',
  'Account sign-in তথ্য ও token backup-এ রাখা হয় না। Restore করলে একই key-এর বর্তমান data প্রতিস্থাপিত হবে।': 'Passwords and sign-in tokens are never included. Restoring replaces matching saved data.',
  'অ্যাকাউন্ট ও নিরাপত্তা': 'Account & security',
  'সাইন আউট করলে এই device-এর account session বন্ধ হবে।': 'Signing out ends this account session on this device.',
  'সেশন': 'Session',
  'বর্তমান account:': 'Current account:',
  'সাইন আউট': 'Sign out',
  'পছন্দ reset': 'Reset preferences',
  'থিম, ফন্ট ও পরীক্ষার default আগের অবস্থায় ফিরবে। Study data মুছবে না।': 'Reset theme, font, and exam defaults. Study data will remain.',
  'পছন্দ reset করুন': 'Reset preferences',
};

function localizeSettingsModal(root: HTMLElement, language: 'bn' | 'en'): void {
  document.documentElement.dataset.language = language;
  const reverse = language === 'bn' ? Object.fromEntries(Object.entries(SETTINGS_EN).map(([bn, en]) => [en, bn])) : SETTINGS_EN;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    const trimmed = text.trim();
    if (!trimmed) return;
    const translated = reverse[trimmed];
    if (translated) node.nodeValue = text.replace(trimmed, translated);
  });
}

export function openSettingsDialog(options: SettingsDialogOptions): void {
  const previous = document.getElementById('cc-settings-overlay');
  if (previous) previous.remove();
  installDialogStyles();

  const overlay = document.createElement('div');
  overlay.id = 'cc-settings-overlay';
  overlay.innerHTML = `
    <section id="cc-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-settings-title" tabindex="-1">
      <header id="cc-settings-head">
        <div><h2 id="cc-settings-title">অ্যাপ সেটিংস</h2><p>আপনার পড়াশোনার অভিজ্ঞতা নিজের মতো সাজান</p></div>
        <button id="cc-settings-close" type="button" aria-label="সেটিংস বন্ধ করুন">×</button>
      </header>
      <div id="cc-settings-layout">
        <nav id="cc-settings-nav" aria-label="সেটিংস বিভাগ">
          <button type="button" data-tab="profile" aria-selected="true">👤 ব্যক্তিগত তথ্য</button>
          <button type="button" data-tab="appearance" aria-selected="false">🎨 চেহারা ও ফন্ট</button>
          <button type="button" data-tab="exam" aria-selected="false">📝 পরীক্ষা</button>
          <button type="button" data-tab="backup" aria-selected="false">💾 Backup</button>
          <button type="button" data-tab="account" aria-selected="false">⚙️ অ্যাকাউন্ট</button>
        </nav>
        <main id="cc-settings-content">
          <section class="cc-settings-section" data-panel="profile">
            <h3>ব্যক্তিগত তথ্য</h3><p class="cc-settings-intro">আপনার account-এর পরিচিতি দেখুন ও নাম আপডেট করুন।</p>
            <div class="cc-settings-card">
              <div class="cc-settings-profile"><img data-profile-photo alt="প্রোফাইল ছবি"><div><strong data-profile-name></strong><div class="cc-settings-note">Google account-এর প্রোফাইল ছবি</div></div></div>
              <div class="cc-settings-grid">
                <label class="cc-settings-field">নাম<input data-profile-name-input maxlength="80" autocomplete="name"></label>
                <label class="cc-settings-field">ইমেইল<input data-profile-email readonly></label>
              </div>
              <p class="cc-settings-note">ইমেইল Google account থেকে আসে; এখানে এটি পরিবর্তন করা যাবে না।</p>
              <div class="cc-settings-actions"><button class="cc-settings-btn primary" type="button" data-save-profile>নাম সংরক্ষণ করুন</button></div>
              <p class="cc-settings-status" data-profile-status role="status"></p>
            </div>
          </section>
          <section class="cc-settings-section" data-panel="appearance" hidden>
            <h3>চেহারা ও পড়ার ধরন</h3><p class="cc-settings-intro">এই পছন্দগুলো এই browser-এ সংরক্ষিত থাকবে।</p>
            <div class="cc-settings-card"><h4>অ্যাপের থিম ও লেখা</h4>
              <div class="cc-settings-grid">
                <label class="cc-settings-field">থিম<select data-setting="theme"><option value="light">লাইট</option><option value="dark">ডার্ক</option><option value="sepia">সেপিয়া</option><option value="forest">ফরেস্ট</option><option value="midnight">মিডনাইট</option></select></label>
                <label class="cc-settings-field">বাংলা ফন্ট<select data-setting="banglaFont"><option value="sans-serif">Sans Serif</option><option value="amiri">Amiri</option><option value="hind-siliguri">হিন্দ সিলিগুড়ি</option><option value="kalpurush">কালপুরুষ</option></select></label>
                <label class="cc-settings-field">ভাষা<select data-setting="language"><option value="bn">বাংলা</option><option value="en">English</option></select></label>
                <label class="cc-settings-field">লেখার আকার<select data-setting="readingSize"><option value="small">ছোট</option><option value="medium">মাঝারি</option><option value="large">বড়</option></select></label>
              </div>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="reduceMotion"><span><b>কম animation ব্যবহার করুন</b><br><small>পেজের চলমান transition কমাবে।</small></span></label>
              <div class="cc-settings-actions"><button class="cc-settings-btn primary" type="button" data-save-appearance>পছন্দ সংরক্ষণ করুন</button></div>
              <p class="cc-settings-status" data-appearance-status role="status"></p>
            </div>
          </section>
          <section class="cc-settings-section" data-panel="exam" hidden>
            <h3>পরীক্ষার পছন্দ</h3><p class="cc-settings-intro">এগুলো নতুন quiz ও exam শুরু করার default হবে। চলমান পরীক্ষা বদলাবে না।</p>
            <div class="cc-settings-card"><h4>সাধারণ MCQ quiz</h4>
              <div class="cc-settings-grid">
                <label class="cc-settings-field">প্রতি প্রশ্নে সময়<select data-setting="legacyTime"><option value="15">15 সেকেন্ড</option><option value="20">20 সেকেন্ড</option><option value="30">30 সেকেন্ড</option><option value="36">36 সেকেন্ড</option><option value="60">60 সেকেন্ড</option></select></label>
                <label class="cc-settings-field">ভুল উত্তরে নম্বর<select data-setting="legacyNegative"><option value="0">0</option><option value="0.25">−0.25</option><option value="0.5">−0.5</option><option value="1">−1</option></select></label>
              </div>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="legacyShuffle"><span>প্রশ্ন এলোমেলো করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="legacyAnswers"><span>উত্তর দেওয়ার পর সঠিক উত্তর দেখান</span></label>
            </div>
            <div class="cc-settings-card"><h4>Exam Studio default</h4>
              <div class="cc-settings-grid">
                <label class="cc-settings-field">প্রশ্ন সংখ্যা<input type="number" min="5" max="200" step="5" data-setting="examCount"></label>
                <label class="cc-settings-field">পরীক্ষার ধরন<select data-setting="examMode"><option value="exam">পরীক্ষা</option><option value="practice">অনুশীলন</option><option value="timed-practice">সময় ধরে অনুশীলন</option><option value="untimed-practice">সময় ছাড়া অনুশীলন</option></select></label>
                <label class="cc-settings-field">প্রশ্ন দেখানোর ধরন<select data-setting="examLayout"><option value="screen">একবারে একটি</option><option value="scroll">সব প্রশ্ন একসাথে</option><option value="omr">OMR bubble sheet</option></select></label>
                <label class="cc-settings-field">প্রশ্নের ক্রম<select data-setting="examQuestionOrder"><option value="random">এলোমেলো</option><option value="serial">ক্রম অনুযায়ী</option></select></label>
                <label class="cc-settings-field">সময় ব্যবস্থা<select data-setting="examTiming"><option value="whole">পুরো পরীক্ষার সময়</option><option value="per-question">প্রতি প্রশ্নে সময়</option><option value="unlimited">সময় সীমা নেই</option></select></label>
                <label class="cc-settings-field">পুরো পরীক্ষার সময় (মিনিট)<input type="number" min="1" max="600" data-setting="examMinutes"></label>
                <label class="cc-settings-field">প্রতি প্রশ্নে সময় (সেকেন্ড)<input type="number" min="5" max="600" data-setting="examSeconds"></label>
                <label class="cc-settings-field">সঠিক উত্তরে নম্বর<input type="number" min="0" step="0.25" data-setting="examPositive"></label>
                <label class="cc-settings-field">ভুল উত্তরে নম্বর<input type="number" min="0" step="0.05" data-setting="examNegative"></label>
                <label class="cc-settings-field">ফাঁকা উত্তরে নম্বর<input type="number" step="0.05" data-setting="examUnanswered"></label>
                <label class="cc-settings-field">পাস নম্বর (%)<input type="number" min="0" max="100" step="5" data-setting="examPass"></label>
              </div>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examAvoidRecent"><span>সাম্প্রতিক প্রশ্ন এড়িয়ে চলুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examCustomTime"><span>Exam Studio-র সময়ের জন্য নিজের default ব্যবহার করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examIncludeAttempted"><span>আগে করা প্রশ্ন অন্তর্ভুক্ত করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examWrongOnly"><span>শুধু ভুল করা প্রশ্ন নিন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examBookmarkedOnly"><span>শুধু বুকমার্ক করা প্রশ্ন নিন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examShuffleQuestions"><span>প্রশ্ন এলোমেলো করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examShuffleOptions"><span>বিকল্প এলোমেলো করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examAllowNavigation"><span>আগের/পরের প্রশ্নে যাওয়া যাবে</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examMarkReview"><span>প্রশ্ন review-এর জন্য চিহ্নিত করা যাবে</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examLockAnswer"><span>উত্তর দেওয়ার পর পরিবর্তন বন্ধ করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examAutoAdvance"><span>উত্তর দিলে পরের প্রশ্নে যান</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examConfirmSubmit"><span>জমা দেওয়ার আগে নিশ্চিত করুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examAutoSubmit"><span>সময় শেষ হলে নিজে থেকে জমা দিন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examShowPalette"><span>প্রশ্নের তালিকা দেখান</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examSound"><span>পরীক্ষায় sound effect চালু রাখুন</span></label>
              <label class="cc-settings-toggle"><input type="checkbox" data-setting="examTrackTabs"><span>পরীক্ষার সময় tab বদলানো গুনে রাখুন</span></label>
              <div class="cc-settings-actions"><button class="cc-settings-btn primary" type="button" data-save-exam>পরীক্ষার পছন্দ সংরক্ষণ করুন</button></div>
              <p class="cc-settings-status" data-exam-status role="status"></p>
            </div>
          </section>
          <section class="cc-settings-section" data-panel="backup" hidden>
            <h3>Backup ও Restore</h3><p class="cc-settings-intro">আপনার browser-এ রাখা app preference ও study data JSON ফাইলে নিন, অথবা আগের backup ফিরিয়ে আনুন।</p>
            <div class="cc-settings-card"><h4>এই browser-এর data</h4><p class="cc-settings-note">Account sign-in তথ্য ও token backup-এ রাখা হয় না। Restore করলে একই key-এর বর্তমান data প্রতিস্থাপিত হবে।</p>
              <div class="cc-settings-actions"><button class="cc-settings-btn primary" type="button" data-export-backup>Backup ডাউনলোড</button><button class="cc-settings-btn" type="button" data-import-trigger>Backup restore</button><input type="file" accept="application/json,.json" data-import-file hidden></div>
              <p class="cc-settings-status" data-backup-status role="status"></p>
            </div>
            <div class="cc-settings-card"><h4>স্বয়ংক্রিয় Backup</h4><label class="cc-settings-toggle"><input type="checkbox" data-setting="autoBackupEnabled"><span><b>স্বয়ংক্রিয় cloud backup চালু রাখুন</b><br><small>Study Plan-এর cloud backup সময় অনুযায়ী চালাবে।</small></span></label><div class="cc-settings-actions"><button class="cc-settings-btn primary" type="button" data-save-backup-preferences>Backup পছন্দ সংরক্ষণ করুন</button></div><p class="cc-settings-status" data-backup-preferences-status role="status"></p></div>
          </section>
          <section class="cc-settings-section" data-panel="account" hidden>
            <h3>অ্যাকাউন্ট ও নিরাপত্তা</h3><p class="cc-settings-intro">সাইন আউট করলে এই device-এর account session বন্ধ হবে।</p>
            <div class="cc-settings-card"><h4>সেশন</h4><p class="cc-settings-note">বর্তমান account: <span data-account-email></span></p>
              <div class="cc-settings-actions"><button class="cc-settings-btn danger" type="button" data-sign-out>সাইন আউট</button></div>
              <p class="cc-settings-status" data-account-status role="status"></p>
            </div>
            <div class="cc-settings-card"><h4>পছন্দ reset</h4><p class="cc-settings-note">থিম, ফন্ট ও পরীক্ষার default আগের অবস্থায় ফিরবে। Study data মুছবে না।</p><div class="cc-settings-actions"><button class="cc-settings-btn" type="button" data-reset-settings>পছন্দ reset করুন</button></div></div>
          </section>
        </main>
      </div>
    </section>`;

  document.body.appendChild(overlay);
  const dialog = overlay.querySelector<HTMLElement>('#cc-settings-dialog')!;
  const close = () => {
    overlay.remove();
    window.removeEventListener('keydown', onKeyDown);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };
  window.addEventListener('keydown', onKeyDown);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  overlay.querySelector('#cc-settings-close')?.addEventListener('click', close);
  dialog.focus();

  const profileName = options.profile.name || 'শিক্ষার্থী';
  const profileInput = overlay.querySelector<HTMLInputElement>('[data-profile-name-input]')!;
  profileInput.value = profileName;
  overlay.querySelector<HTMLElement>('[data-profile-name]')!.textContent = profileName;
  overlay.querySelector<HTMLInputElement>('[data-profile-email]')!.value = options.profile.email || '';
  overlay.querySelector<HTMLImageElement>('[data-profile-photo]')!.src = options.profile.photoURL || '/images/logo.png';
  overlay.querySelector<HTMLElement>('[data-account-email]')!.textContent = options.profile.email || 'সাইন ইন করা নেই';

  const appSettings = loadAppSettings();
  setControl(overlay, 'theme', appSettings.theme);
  setControl(overlay, 'banglaFont', appSettings.banglaFont);
  setControl(overlay, 'language', appSettings.language);
  setControl(overlay, 'readingSize', appSettings.readingSize);
  setControl(overlay, 'reduceMotion', appSettings.reduceMotion);
  setControl(overlay, 'autoBackupEnabled', appSettings.autoBackupEnabled);
  localizeSettingsModal(overlay, appSettings.language);

  const legacy = readRecord('cc_quiz_settings', LEGACY_QUIZ_DEFAULTS);
  const exam = readRecord('cc_new_exam_settings_v1', EXAM_DEFAULTS);
  setControl(overlay, 'legacyTime', legacy.timePerQuestion);
  setControl(overlay, 'legacyNegative', legacy.negativeMark);
  setControl(overlay, 'legacyShuffle', legacy.shuffleQuestions);
  setControl(overlay, 'legacyAnswers', legacy.showAnswersInstantly);
  setControl(overlay, 'examCount', exam.questionCount);
  setControl(overlay, 'examMode', exam.mode);
  setControl(overlay, 'examLayout', exam.layout);
  setControl(overlay, 'examQuestionOrder', exam.questionOrder);
  setControl(overlay, 'examTiming', exam.timingType);
  setControl(overlay, 'examMinutes', exam.totalMinutes);
  setControl(overlay, 'examSeconds', exam.secondsPerQuestion);
  setControl(overlay, 'examPositive', exam.positiveMark);
  setControl(overlay, 'examNegative', exam.negativeMark);
  setControl(overlay, 'examUnanswered', exam.unansweredMark);
  setControl(overlay, 'examPass', exam.passPercent);
  setControl(overlay, 'examShuffleQuestions', exam.shuffleQuestions);
  setControl(overlay, 'examShuffleOptions', exam.shuffleOptions);
  setControl(overlay, 'examAvoidRecent', exam.avoidRecent);
  setControl(overlay, 'examCustomTime', exam.customTimeOverride);
  setControl(overlay, 'examIncludeAttempted', exam.includeAttempted);
  setControl(overlay, 'examWrongOnly', exam.wrongOnly);
  setControl(overlay, 'examBookmarkedOnly', exam.bookmarkedOnly);
  setControl(overlay, 'examAllowNavigation', exam.allowNavigation);
  setControl(overlay, 'examMarkReview', exam.allowMarkForReview);
  setControl(overlay, 'examLockAnswer', exam.lockAnswer);
  setControl(overlay, 'examAutoAdvance', exam.autoAdvance);
  setControl(overlay, 'examConfirmSubmit', exam.confirmSubmit);
  setControl(overlay, 'examAutoSubmit', exam.autoSubmitOnTimeout);
  setControl(overlay, 'examShowPalette', exam.showPalette);
  setControl(overlay, 'examSound', exam.soundEffects);
  setControl(overlay, 'examTrackTabs', exam.trackTabSwitches);

  overlay.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.tab;
      overlay.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button)));
      overlay.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== selected; });
    });
  });

  overlay.querySelector('[data-save-profile]')?.addEventListener('click', async () => {
    const name = profileInput.value.trim();
    const status = overlay.querySelector<HTMLElement>('[data-profile-status]')!;
    if (!name) { status.textContent = 'নাম খালি রাখা যাবে না।'; status.style.color = '#b91c1c'; return; }
    try {
      await options.onSaveProfile?.(name);
      safeProfileCache(name, options.profile);
      overlay.querySelector<HTMLElement>('[data-profile-name]')!.textContent = name;
      status.textContent = loadAppSettings().language === 'en' ? 'Name saved.' : 'নাম সংরক্ষণ হয়েছে।'; status.style.color = '#047857';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : loadAppSettings().language === 'en' ? 'Could not save the name.' : 'নাম সংরক্ষণ করা যায়নি।';
      status.style.color = '#b91c1c';
    }
  });

  const saveAppearance = async () => {
    const settings = saveAppSettings({
      theme: ['dark', 'sepia', 'forest', 'midnight'].includes(getValue(overlay, 'theme')) ? getValue(overlay, 'theme') as AppSettings['theme'] : 'light',
      banglaFont: ['amiri', 'hind-siliguri', 'kalpurush'].includes(getValue(overlay, 'banglaFont')) ? getValue(overlay, 'banglaFont') as AppSettings['banglaFont'] : 'sans-serif',
      language: getValue(overlay, 'language') === 'en' ? 'en' : 'bn',
      readingSize: ['small', 'medium', 'large'].includes(getValue(overlay, 'readingSize')) ? getValue(overlay, 'readingSize') as AppSettings['readingSize'] : 'medium',
      reduceMotion: getChecked(overlay, 'reduceMotion'),
    });
    const status = overlay.querySelector<HTMLElement>('[data-appearance-status]')!;
    try {
      await options.onSaveAppSettings?.(settings);
      status.textContent = settings.language === 'en' ? 'Appearance, font, and language preferences saved to this account.' : 'চেহারা, ফন্ট ও ভাষার পছন্দ account-এ সংরক্ষণ হয়েছে।';
      localizeSettingsModal(overlay, settings.language);
    } catch {
      status.textContent = settings.language === 'en' ? 'Saved on this device, but cloud sync failed.' : 'এই device-এ সংরক্ষিত হয়েছে, তবে cloud sync হয়নি।';
    }
  };
  overlay.querySelector('[data-save-appearance]')?.addEventListener('click', () => { void saveAppearance(); });
  overlay.querySelectorAll('[data-setting="theme"], [data-setting="banglaFont"], [data-setting="language"], [data-setting="readingSize"], [data-setting="reduceMotion"]').forEach((control) => {
    control.addEventListener('change', () => { void saveAppearance(); });
  });

  overlay.querySelector('[data-save-exam]')?.addEventListener('click', async () => {
    const number = (name: string, fallback: number, min: number, max: number) => {
      const value = Number(getValue(overlay, name));
      return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    };
    const nextLegacy = {
      ...legacy,
      timePerQuestion: number('legacyTime', 30, 5, 600),
      negativeMark: number('legacyNegative', 0.25, 0, 10),
      shuffleQuestions: getChecked(overlay, 'legacyShuffle'),
      showAnswersInstantly: getChecked(overlay, 'legacyAnswers'),
    };
    const nextExam = {
      ...exam,
      questionCount: number('examCount', 25, 5, 200),
      mode: getValue(overlay, 'examMode'),
      layout: ['screen', 'scroll', 'omr'].includes(getValue(overlay, 'examLayout')) ? getValue(overlay, 'examLayout') : 'screen',
      timingType: getValue(overlay, 'examMode') === 'untimed-practice' ? 'unlimited' : getValue(overlay, 'examTiming'),
      totalMinutes: number('examMinutes', 15, 1, 600),
      secondsPerQuestion: number('examSeconds', 36, 5, 600),
      positiveMark: number('examPositive', 1, 0, 100),
      negativeMark: number('examNegative', 0.5, 0, 100),
      unansweredMark: number('examUnanswered', 0, -100, 100),
      passPercent: number('examPass', 50, 0, 100),
      shuffleQuestions: getChecked(overlay, 'examShuffleQuestions'),
      questionOrder: getValue(overlay, 'examQuestionOrder') === 'serial' ? 'serial' : 'random',
      shuffleOptions: getChecked(overlay, 'examShuffleOptions'),
      avoidRecent: getChecked(overlay, 'examAvoidRecent'),
      customTimeOverride: getChecked(overlay, 'examCustomTime'),
      includeAttempted: getChecked(overlay, 'examIncludeAttempted'),
      wrongOnly: getChecked(overlay, 'examWrongOnly'),
      bookmarkedOnly: getChecked(overlay, 'examBookmarkedOnly'),
      allowNavigation: getChecked(overlay, 'examAllowNavigation'),
      allowMarkForReview: getChecked(overlay, 'examMarkReview'),
      lockAnswer: getChecked(overlay, 'examLockAnswer'),
      autoAdvance: getChecked(overlay, 'examAutoAdvance'),
      confirmSubmit: getChecked(overlay, 'examConfirmSubmit'),
      autoSubmitOnTimeout: getChecked(overlay, 'examAutoSubmit'),
      showPalette: getChecked(overlay, 'examShowPalette'),
      soundEffects: getChecked(overlay, 'examSound'),
      trackTabSwitches: getChecked(overlay, 'examTrackTabs'),
    };
    localStorage.setItem('cc_quiz_settings', JSON.stringify(nextLegacy));
    localStorage.setItem('cc_new_exam_settings_v1', JSON.stringify(nextExam));
    window.dispatchEvent(new CustomEvent('classcaddy:exam-settings-change', { detail: { legacy: nextLegacy, exam: nextExam } }));
    const status = overlay.querySelector<HTMLElement>('[data-exam-status]')!;
    try {
      await options.onSaveExamPreferences?.(nextLegacy, nextExam);
      status.textContent = loadAppSettings().language === 'en' ? 'Exam preferences saved. Current exams are unchanged.' : 'পরীক্ষার পছন্দ সংরক্ষণ হয়েছে। চলমান পরীক্ষা বদলাবে না।';
    } catch {
      status.textContent = 'এই device-এ পছন্দ সংরক্ষিত হয়েছে, তবে Firebase sync হয়নি।';
      status.style.color = '#b91c1c';
    }
  });
  overlay.querySelectorAll<HTMLElement>('[data-setting]').forEach((control) => {
    if (/^(exam|legacy)/.test(control.dataset.setting || '')) {
      control.addEventListener('change', () => overlay.querySelector<HTMLButtonElement>('[data-save-exam]')?.click());
    }
  });

  overlay.querySelector('[data-export-backup]')?.addEventListener('click', async () => {
    const status = overlay.querySelector<HTMLElement>('[data-backup-status]')!;
    try { const includesCloud = await downloadBackup(options); status.textContent = loadAppSettings().language === 'en' ? (includesCloud ? 'Device and Firebase study data and settings were backed up.' : 'Device data was backed up. Sign in to include Firebase data.') : (includesCloud ? 'Device ও Firebase-এর study data এবং settings backup হয়েছে।' : 'Device-এর data backup হয়েছে। Firebase-এর data পেতে sign in করুন।'); }
    catch (error) { status.textContent = error instanceof Error ? error.message : 'Backup তৈরি করা যায়নি।'; status.style.color = '#b91c1c'; }
  });
  overlay.querySelector('[data-save-backup-preferences]')?.addEventListener('click', async () => {
    const settings = saveAppSettings({ autoBackupEnabled: getChecked(overlay, 'autoBackupEnabled') });
    const status = overlay.querySelector<HTMLElement>('[data-backup-preferences-status]')!;
    try { await options.onSaveAppSettings?.(settings); status.textContent = settings.language === 'en' ? (settings.autoBackupEnabled ? 'Automatic backup enabled.' : 'Automatic backup disabled.') : (settings.autoBackupEnabled ? 'স্বয়ংক্রিয় Backup চালু হয়েছে।' : 'স্বয়ংক্রিয় Backup বন্ধ হয়েছে।'); }
    catch { status.textContent = 'এই device-এ সংরক্ষিত হয়েছে, Firebase sync হয়নি।'; status.style.color = '#b91c1c'; }
  });
  overlay.querySelector('[data-setting="autoBackupEnabled"]')?.addEventListener('change', () => overlay.querySelector<HTMLButtonElement>('[data-save-backup-preferences]')?.click());
  const fileInput = overlay.querySelector<HTMLInputElement>('[data-import-file]')!;
  overlay.querySelector('[data-import-trigger]')?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    const status = overlay.querySelector<HTMLElement>('[data-backup-status]')!;
    if (!file) return;
    try {
      const count = await restoreBackup(file, options);
      status.textContent = count ? (loadAppSettings().language === 'en' ? `${count} items restored successfully.` : `${count}টি data restore হয়েছে।`) : (loadAppSettings().language === 'en' ? 'Restore cancelled.' : 'Restore বাতিল করা হয়েছে।');
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Backup restore করা যায়নি।';
      status.style.color = '#b91c1c';
    } finally {
      fileInput.value = '';
    }
  });

  overlay.querySelector('[data-sign-out]')?.addEventListener('click', async () => {
    const status = overlay.querySelector<HTMLElement>('[data-account-status]')!;
    if (!options.onSignOut) { status.textContent = 'সাইন আউট করার account action পাওয়া যায়নি।'; status.style.color = '#b91c1c'; return; }
    if (!window.confirm(loadAppSettings().language === 'en' ? 'Do you want to sign out of Class Caddy?' : 'আপনি কি Class Caddy থেকে সাইন আউট করতে চান?')) return;
    try { await options.onSignOut(); close(); }
    catch (error) { status.textContent = error instanceof Error ? error.message : 'সাইন আউট করা যায়নি।'; status.style.color = '#b91c1c'; }
  });

  overlay.querySelector('[data-reset-settings]')?.addEventListener('click', async () => {
    if (!window.confirm(loadAppSettings().language === 'en' ? 'Theme, font, and exam defaults will reset. Your study data will remain. Continue?' : 'থিম, ফন্ট ও পরীক্ষার default reset হবে। আপনার study data মুছবে না। এগোবেন?')) return;
    localStorage.setItem('cc_quiz_settings', JSON.stringify(LEGACY_QUIZ_DEFAULTS));
    localStorage.setItem('cc_new_exam_settings_v1', JSON.stringify(EXAM_DEFAULTS));
    const resetSettings = saveAppSettings(DEFAULT_APP_SETTINGS);
    try {
      await options.onSaveAppSettings?.(resetSettings);
      await options.onSaveExamPreferences?.(LEGACY_QUIZ_DEFAULTS, EXAM_DEFAULTS);
    } catch {
      const status = overlay.querySelector<HTMLElement>('[data-account-status]');
      if (status) { status.textContent = 'এই device-এ reset হয়েছে, তবে Firebase sync হয়নি।'; status.style.color = '#b91c1c'; }
      return;
    }
    window.dispatchEvent(new CustomEvent('classcaddy:exam-settings-change', { detail: { legacy: LEGACY_QUIZ_DEFAULTS, exam: EXAM_DEFAULTS } }));
    close();
  });
}
