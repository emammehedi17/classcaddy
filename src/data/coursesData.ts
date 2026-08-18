import { CourseMaterial, PoemLine, VocabularyWord } from '../types';

export const COURSE_405_POEM_LINES: PoemLine[] = [
  {
    id: 'line-1',
    start: 0,
    end: 8,
    arabic: 'يَا دَارَ مَيَّةَ بِالعَلْيَاءِ فَالسَّنَدِ ... أَقْوَتْ وَطَالَ عَلَيْهَا سَالِفُ الأَبَدِ',
    bangla: 'হে আলিয়া ও সানাদের মায়্যাহর আবাসভূমি! তুমি জনশূন্য হয়ে গেছ এবং তোমার উপর দিয়ে চলে গেছে সুদীর্ঘ কাল।',
    english: 'O abode of Mayya in Al-Alya and As-Sanad! It has become desolate and long ages have passed over it.'
  },
  {
    id: 'line-2',
    start: 8,
    end: 16,
    arabic: 'وَقَفْتُ فِيهَا أُصَيْلَانًا أُسَائِلُهَا ... عَيَّتْ جَوَابًا وَمَا بِالرَّبْعِ مِنْ أَحَدِ',
    bangla: 'আমি এক বিকেলে সেখানে দাঁড়িয়ে তাকে প্রশ্ন করলাম; কিন্তু সে নিরুত্তর রইল, কারণ সেই জনপদে কেউই ছিল না।',
    english: 'I stood there in the late afternoon questioning it; it failed to answer, for there was no one left in the dwelling.'
  },
  {
    id: 'line-3',
    start: 16,
    end: 24,
    arabic: 'إِلَّا الأَوَارِيَّ لِأْيًا مَا أُبَيِّنُهَا ... وَالنُّؤْيَ كَالْحَوْضِ بِالْمَظْلُومَةِ الْجَلَدِ',
    bangla: 'কেবল ঘোড়ার খুঁটিগুলো ছাড়া যা আমি বহু কষ্টে চিনেছি, আর পানির নালা যা শক্ত অনুর্বর ভূমিতে জলাশয়ের মতো দেখাচ্ছে।',
    english: 'Except the tethering pegs which I could barely discern, and the trench like a basin in the untilled hard ground.'
  },
  {
    id: 'line-4',
    start: 24,
    end: 32,
    arabic: 'رَدَّتْ عَلَيْهِ أَقَاصِيهِ وَلَبَّدَهُ ... ضَرْبُ الْوَلِيدَةِ بِالْمِسْحَاةِ فِي الثَّأَدِ',
    bangla: 'বৃষ্টি ও বাতাস তার কিনারাগুলোকে ধ্বংস করে মাটি সমান করে দিয়েছে, যেমন এক বালিকা ভিজে মাটিতে কোদাল দিয়ে আঘাত করে।',
    english: 'Its edges were smoothed and flattened, like a maiden striking with a shovel into the damp soil.'
  },
  {
    id: 'line-5',
    start: 32,
    end: 42,
    arabic: 'خَلَتْ سَبِيلَ أَتِيٍّ كَانَ يَحْبِسُهُ ... وَرَفَّعَتْهُ إِلَى السَّجْفَيْنِ فَالنَّضَدِ',
    bangla: 'সেখানে মুক্ত হয়ে গেছে সেই প্রবল জলস্রোতের পথ যা আগে অবরুদ্ধ ছিল, এবং তা প্রাচীর ও পালঙ্কের সজ্জা অবধি উঠে গেছে।',
    english: 'It made a path for a rushing stream that once was held back, rising toward the curtained walls and furniture.'
  }
];

export const COURSE_405_VOCABULARY: VocabularyWord[] = [
  {
    arabic: 'دَارٌ (ج) دِيَارٌ',
    transliteration: 'Dār (pl. Diyār)',
    bangla: 'আবাসস্থল, গৃহ',
    english: 'Abode, dwelling, home',
    rootWord: 'د و ر'
  },
  {
    arabic: 'أَقْوَتْ',
    transliteration: 'Aqwath',
    bangla: 'জনশূন্য / পরিত্যক্ত হয়েছে',
    english: 'Became desolate / empty',
    rootWord: 'ق و ي'
  },
  {
    arabic: 'أُصَيْلَانًا',
    transliteration: 'Uṣaylānan',
    bangla: 'অপরাহ্ন বা বিকালের প্রাক্কালে',
    english: 'Late afternoon / dusk',
    rootWord: 'أ ص ل'
  },
  {
    arabic: 'عَيَّتْ جَوَابًا',
    transliteration: "'Ayyath Jawāban",
    bangla: 'উত্তর প্রদানে অক্ষম হলো / নীরব রইল',
    english: 'Failed to answer / remained silent',
    rootWord: 'ع ي ي'
  },
  {
    arabic: 'الرَّبْعُ',
    transliteration: 'Al-Rabʿ',
    bangla: 'বসতি, জনপদ, ঘরবাড়ি',
    english: 'Quarter, seasonal settlement',
    rootWord: 'ر ب ع'
  },
  {
    arabic: 'الْمِسْحَاةُ',
    transliteration: 'Al-Misḥāh',
    bangla: 'কোদাল / খনন যন্ত্র',
    english: 'Spade / shovel',
    rootWord: 'س ح و'
  }
];

export const COURSES: CourseMaterial[] = [
  {
    id: 'course-405',
    code: 'Course-405',
    title: 'Modern Poetry II',
    semester: '8th Semester, Department of Arabic',
    instructor: 'Department Faculty Panel, University of Dhaka',
    description: 'An advanced analytical study of modern Arabic poetry from the Neo-classical Renaissance (Nahdah) through the Apollo and Free Verse movements, examining prominent poets including Ahmad Shawqi, Hafiz Ibrahim, Badr Shakir al-Sayyab, and Mahmoud Darwish.',
    topics: [
      'Poetry of the Renaissance (Ihya & Nahdah Movement)',
      'Ahmad Shawqi & The Neo-Classical School',
      'Mahjar Poets: Khalil Gibran & Elia Abu Madi',
      'The Romantic School: Apollo Group',
      'The Free Verse (Shi‘r Hurr) Movement: Al-Sayyab & Nazik al-Malaika',
      'Resistance and Modern Metaphors: Mahmoud Darwish & Samih al-Qasim'
    ],
    vocabulary: COURSE_405_VOCABULARY,
    poemLines: COURSE_405_POEM_LINES,
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    downloadUrl: 'https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing'
  },
  {
    id: 'course-406',
    code: 'Course-406',
    title: 'Terminology through Translation',
    semester: '8th Semester, Department of Arabic',
    instructor: 'Department Faculty Panel, University of Dhaka',
    description: 'Applied translation techniques bridging Modern Standard Arabic, English, and Bengali with specialized terminology in diplomacy, international law, banking, Islamic economics, media journalism, and UN documentation.',
    topics: [
      'Principles of Bilingual & Trilingual Translation (Arabic-English-Bangla)',
      'Diplomatic & Political Terminology: Treaties & Conventions',
      'Islamic Banking & Financial Lexicon (Murabaha, Ijarah, Sukuk)',
      'Legal Documentation, Contracts & Official Agreements',
      'Media Arabic: Headline Formulations & Broadcast Translations',
      'Idiomatic Expressions and Cultural Transposition'
    ],
    vocabulary: [
      { arabic: 'مُعَاهَدَةٌ دَوْلِيَّةٌ', transliteration: 'Mu‘āhadah Dawliyyah', bangla: 'আন্তর্জাতিক চুক্তি', english: 'International Treaty' },
      { arabic: 'الاقْتِصَادُ الإِسْلَامِيُّ', transliteration: 'Al-Iqtiṣād Al-Islāmī', bangla: 'ইসলামী অর্থনীতি', english: 'Islamic Economics' },
      { arabic: 'بَيَانٌ خِتَامِيٌّ', transliteration: 'Bayān Khitāmī', bangla: 'যৌথ ঘোষণাপত্র / সমাপনী বিবৃতি', english: 'Joint Communiqué / Final Statement' },
      { arabic: 'حُقُوقُ الإِنْسَانِ', transliteration: 'Ḥuqūq Al-Insān', bangla: 'মানবাধিকার', english: 'Human Rights' },
      { arabic: 'مَصْرِفٌ مَرْكَزِيٌّ', transliteration: 'Maṣrif Markazī', bangla: 'কেন্দ্রীয় ব্যাংক', english: 'Central Bank' }
    ],
    downloadUrl: 'https://drive.google.com/file/d/1A6asIfVsu2LiVqg0lozhS075gF-GvT_-/view?usp=sharing'
  },
  {
    id: 'course-407',
    code: 'Course-407',
    title: 'Arabic Literary Criticism',
    semester: '8th Semester, Department of Arabic',
    instructor: 'Department Faculty Panel, University of Dhaka',
    description: 'Theoretical foundations of classical and modern Arabic literary criticism (Naqd al-Adab), tracking major milestones from Ibn Sallam al-Jumahi, Al-Jahiz, Ibn Qutaybah, Qudamah ibn Ja‘far to Abdul Qahir al-Jurjani’s Theory of Construction (Nazm).',
    topics: [
      'Origin and Evolution of Classical Arabic Criticism (Naqd Jahili to Abbasid)',
      'Ibn Sallam al-Jumahi & Classes of Arabic Poets (Tabaqat Fuhul al-Shu‘ara)',
      'The Debate of Ancient vs. Modern (Al-Qadim wa al-Hadith)',
      'Concept of Lafz and Ma‘na in Critical Discourse',
      'Abdul Qahir al-Jurjani and Dala’il al-I‘jaz (Theory of Nazm)',
      'Modern Critical Trends: Structuralism, Semiotics, and Cultural Studies'
    ],
    vocabulary: [
      { arabic: 'النَّقْدُ الأَدَبِيُّ', transliteration: 'An-Naqd Al-Adabī', bangla: 'সাহিত্য সমালোচনা', english: 'Literary Criticism' },
      { arabic: 'نَظَرِيَّةُ النَّظْمِ', transliteration: 'Naẓariyyat An-Naẓm', bangla: 'শব্দ-বিন্যাস তত্ত্ব', english: 'Theory of Construction (Jurjani)' },
      { arabic: 'فُحُولُ الشُّعَرَاءِ', transliteration: 'Fuḥūl Ash-Shu‘arā’', bangla: 'শ্রেষ্ঠ কবিবর্গ', english: 'Master Poets / Stalwarts' },
      { arabic: 'اللَّفْظُ وَالْمَعْنَى', transliteration: 'Al-Lafẓ wa Al-Ma‘nā', bangla: 'শব্দ ও অর্থ', english: 'Form/Wording and Meaning' }
    ],
    downloadUrl: 'https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing'
  },
  {
    id: 'course-408',
    code: 'Course-408 (B)',
    title: 'Social Research and Project',
    semester: '8th Semester, Department of Arabic',
    instructor: 'Department Faculty Panel, University of Dhaka',
    description: 'Academic research methodology tailored for Arabic and Islamic humanities. Covers research design, literature review, citation styles (Chicago/APA), archival research, manuscript editing, and thesis project presentation.',
    topics: [
      'Fundamentals of Academic Research in Arabic Studies',
      'Formulating Research Problems, Hypotheses & Questions',
      'Literature Review & Primary Source Archival Investigation',
      'Principles of Arabic Manuscript Editing (Tahqiq al-Turath)',
      'Citation Standards, Referencing & Academic Integrity (Plagiarism Avoidance)',
      'Thesis Structure, Statistical Data Interpretation & Final Defense'
    ],
    vocabulary: [
      { arabic: 'مَنْهَجُ الْبَحْثِ الْعِلْمِيِّ', transliteration: 'Manhaj Al-Baḥth Al-‘Ilmī', bangla: 'বৈজ্ঞানিক গবেষণা পদ্ধতি', english: 'Scientific Research Methodology' },
      { arabic: 'تَحْقِيقُ الْمَخْطُوطَاتِ', transliteration: 'Taḥqīq Al-Makhṭūṭāt', bangla: 'পাণ্ডুলিপি সম্পাদনা', english: 'Manuscript Editing / Verification' },
      { arabic: 'التَّوْثِيقُ وَالْمَرَاجِعُ', transliteration: 'At-Tawthīq wa Al-Marāji‘', bangla: 'তথ্যসূত্র ও গ্রন্থপঞ্জি', english: 'Citation and References' },
      { arabic: 'أُطْرُوحَةُ التَّخَرُّجِ', transliteration: 'Uṭrūḥat At-Takharruj', bangla: 'স্নাতক গবেষণা থিসিস', english: 'Graduation Thesis / Dissertation' }
    ],
    downloadUrl: 'https://drive.google.com/file/d/1A6asIfVsu2LiVqg0lozhS075gF-GvT_-/view?usp=sharing'
  }
];

export const PREVIOUS_QUESTIONS = [
  {
    id: 'pq-1',
    title: 'Previous Questions (2017–2021)',
    semester: '8th Semester Comprehensive',
    coursesCovered: ['Course 405', 'Course 406', 'Course 407', 'Course 408'],
    driveUrl: 'https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing',
    yearRange: '2017-2021'
  },
  {
    id: 'pq-2',
    title: 'Previous Questions (2021–2023)',
    semester: '8th Semester Comprehensive',
    coursesCovered: ['Course 405', 'Course 406', 'Course 407', 'Course 408 (B)'],
    driveUrl: 'https://drive.google.com/file/d/1A6asIfVsu2LiVqg0lozhS075gF-GvT_-/view?usp=sharing',
    yearRange: '2021-2023'
  }
];
