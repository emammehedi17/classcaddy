import React, { useState, useEffect, useRef } from 'react';
import { ArchiveCardButton, ThemeMode } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  FileText,
  Sparkles,
  Layers,
  Compass,
  Folder,
  FolderTree,
  FolderPlus,
  ExternalLink,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Key,
  ShieldCheck,
  RotateCcw,
  Settings,
  Code2,
  Upload,
  Globe,
  FileCode,
  Eye,
  Maximize2,
  ChevronRight,
  Home,
  FolderOpen,
  Cloud,
  CloudCheck,
  RefreshCw,
  LayoutGrid,
  Monitor,
} from 'lucide-react';
import { Windows11Explorer } from './Windows11Explorer';

interface ArchivesViewProps {
  theme?: ThemeMode;
  isExplorerMode?: boolean;
  onToggleExplorerMode?: () => void;
}

const STORAGE_KEY = 'class_caddy_archive_buttons';
const DEV_AUTH_KEY = 'class_caddy_dev_auth';
const ADMIN_TOKEN_KEY = 'class_caddy_admin_token';
const FIRESTORE_DOC_PATH = 'global_tree'; // doc in archive_settings collection

// SHA-256 hash of 'Mehedi@#23877' for secure standalone / static host (Netlify / GitHub Pages) verification
const STATIC_ADMIN_HASH = '1d649e216d2c4959e0477a4c008e6adfee1b610a0e2df9e13e1ee664aee37e1b';

// Fast Browser-native SHA-256 helper using Web Crypto API
async function sha256Hex(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

const INITIAL_POEMS_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'poem-aghmid',
    title: 'Aghmid Jufunaka Tubshir (أغمض جفونك تبصر)',
    subtitle: 'Mikhail Naimy • Modern Poetry Analysis & Audio Recitation',
    link: 'poem-aghmid.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Poem 1',
    createdAt: 201,
  },
  {
    id: 'poem-aghniya',
    title: 'Ughniyat al-Layl (أغنية الليل)',
    subtitle: 'Elias Abu Shabaka • Romantic Symbolism & Stanza Breakdown',
    link: 'poem-aghniya.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Poem 2',
    createdAt: 202,
  },
  {
    id: 'poem-akhi',
    title: 'Akhi (أخي)',
    subtitle: 'Mikhail Naimy • Humanistic Post-War Reflections & Metrics',
    link: 'poem-akhi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Poem 3',
    createdAt: 203,
  },
  {
    id: 'poem-anqa',
    title: "Ta'ir al-Anqa (طائر العنقاء)",
    subtitle: 'Badr Shakir al-Sayyab • Free Verse Mythological Realism',
    link: 'poem-anqa.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'blue',
    badgeText: 'Poem 4',
    createdAt: 204,
  },
  {
    id: 'poem-eid',
    title: 'Eid al-Shuhada (عيد الشهداء)',
    subtitle: 'Elia Abu Madi • Mahjar Patriotic Elegiac Ode',
    link: 'poem-eid.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'amber',
    badgeText: 'Poem 5',
    createdAt: 205,
  },
  {
    id: 'poem-ina',
    title: 'Ana (أنا)',
    subtitle: 'Nazik al-Malaika • Pioneering Arabic Free Verse Revolution',
    link: 'poem-ina.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'purple',
    badgeText: 'Poem 6',
    createdAt: 206,
  },
  {
    id: 'poem-nahr',
    title: 'Al-Nahr al-Mutajammid (النهر المتجمد)',
    subtitle: 'Mikhail Naimy • Meditative Nature & Spiritual Allegory',
    link: 'poem-nahr.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'indigo',
    badgeText: 'Poem 7',
    createdAt: 207,
  },
  {
    id: 'poem-nihaya',
    title: 'Nihayat al-Mataf (نهاية المطاف)',
    subtitle: 'Abd al-Rahman Shukri • Diwan School Philosophical Introspection',
    link: 'poem-nihaya.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'rose',
    badgeText: 'Poem 8',
    createdAt: 208,
  },
  {
    id: 'poem-usfur',
    title: "Usfur al-Jannah (عصفور الجنة)",
    subtitle: 'Abd al-Rahman Shukri • Lyric Romanticism & Nature Dialogue',
    link: 'poem-usfur.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Poem 9',
    createdAt: 209,
  },
  {
    id: 'poem-summaries',
    title: 'All Poem Summaries (ملخص القصائد)',
    subtitle: 'Comprehensive 8th Semester Modern Poetry Master Summary Sheet',
    link: 'poem-summaries.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'emerald',
    badgeText: 'Master Sheet',
    createdAt: 210,
  },
];

const INITIAL_BIOGRAPHIES_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'bio-abu-madi',
    title: 'Elia Abu Madi (إيليا أبو ماضي)',
    subtitle: 'Life, Mahjar Literary League & Major Works',
    link: 'biography-abu-madi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'amber',
    badgeText: 'Biography',
    createdAt: 211,
  },
  {
    id: 'bio-abu-shabaka',
    title: 'Elias Abu Shabaka (إلياس أبو شبكة)',
    subtitle: 'Romantic Pioneer, Life and Critical Legacy',
    link: 'biography-abu-shabaka.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'rose',
    badgeText: 'Biography',
    createdAt: 212,
  },
  {
    id: 'bio-badr-shakir',
    title: 'Badr Shakir al-Sayyab (بدر شاكر السياب)',
    subtitle: 'Free Verse Icon, Rain Song & Modern Poetics',
    link: 'biography-badr-shakir.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'blue',
    badgeText: 'Biography',
    createdAt: 213,
  },
  {
    id: 'bio-mikhail',
    title: 'Mikhail Naimy (ميخائيل نعيمة)',
    subtitle: 'The Book of Mirdad Author, Pen League Philosopher',
    link: 'biography-mikhail.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'emerald',
    badgeText: 'Biography',
    createdAt: 214,
  },
  {
    id: 'bio-najik',
    title: 'Nazik al-Malaika (نازك الملائكة)',
    subtitle: 'Pioneer of Modern Arabic Metre & Critical Theory',
    link: 'biography-najik.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'purple',
    badgeText: 'Biography',
    createdAt: 215,
  },
  {
    id: 'bio-shukri',
    title: 'Abd al-Rahman Shukri (عبد الرحمن شكري)',
    subtitle: 'Diwan School Founder, Psychology of Modern Arabic Poetry',
    link: 'biography-shukri.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'indigo',
    badgeText: 'Biography',
    createdAt: 216,
  },
];

const INITIAL_COURSE_405_CHILDREN: ArchiveCardButton[] = [
  {
    id: 'course-405-interactive',
    title: 'Course-405 Interactive Reader',
    subtitle: 'Modern Poetry II with Line-by-Line Audio Karaoke, Notes & Vocabulary',
    link: 'course-405.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Sparkles',
    colorTheme: 'emerald',
    badgeText: 'Interactive Reader',
    createdAt: 220,
  },
  {
    id: 'course-405-poems-folder',
    title: 'Syllabus Poems (القصائد المقررة)',
    subtitle: '9 Selected Classical & Modern Poems with Bengali Translation',
    targetType: 'folder',
    children: INITIAL_POEMS_SUBFOLDERS,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: '9 Poems',
    createdAt: 221,
  },
  {
    id: 'course-405-biographies-folder',
    title: 'Poet Biographies (تراجم الشعراء)',
    subtitle: 'Detailed Academic Profiles of 6 Master Arabic Poets',
    targetType: 'folder',
    children: INITIAL_BIOGRAPHIES_SUBFOLDERS,
    iconName: 'GraduationCap',
    colorTheme: 'blue',
    badgeText: '6 Biographies',
    createdAt: 222,
  },
];

const INITIAL_COURSE_406_CHILDREN: ArchiveCardButton[] = [
  {
    id: 'course-406-portal',
    title: 'Course-406 Interactive Bank & Exercises',
    subtitle: 'At-Tarjamah • Arabic-Bengali-English Trilingual Terminology Bank',
    link: 'course-406.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Layers',
    colorTheme: 'blue',
    badgeText: 'Portal',
    createdAt: 310,
  },
  {
    id: 'nure-alam-steps',
    title: 'Steps of Translation by Dr. Nure Alam',
    subtitle: 'Core Methodology, Rules & Structural Principles for Arabic-Bengali Translation',
    link: 'sub-pages/Nure Alam sir - Steps of Translation.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'blue',
    badgeText: 'Lecture Note',
    createdAt: 311,
  },
  {
    id: 'nure-alam-academic-steps',
    title: 'Steps of Academic Translation by Dr. Nure Alam',
    subtitle: 'Advanced Academic Terminology & Translation Techniques Guide',
    link: 'sub-pages/Nure Alam sir - Steps of Academic Translation.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'blue',
    badgeText: 'Lecture Note',
    createdAt: 312,
  },
  {
    id: 'ehsan-post-mid-notes',
    title: 'Dr. Ehsan Post-Mid Lecture Notes (1–3)',
    subtitle: 'Comprehensive Terminology, Sentence Translation Drills & Analysis',
    link: 'sub-pages/Ehsan-sir-after-mid-1-3-notes.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'indigo',
    badgeText: 'Lecture Note',
    createdAt: 313,
  },
  {
    id: 'monkeypox-translation',
    title: 'Monkeypox Clinical Translation',
    subtitle: 'Specialized Medical & Scientific Article Arabic Translation Exercise',
    link: 'sub-pages/Translation - Monkeypox.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'purple',
    badgeText: 'Translation',
    createdAt: 314,
  },
];

const INITIAL_COURSE_407_CHILDREN: ArchiveCardButton[] = [
  {
    id: 'course-407-portal',
    title: 'Course-407: Arabic Literary Criticism Portal',
    subtitle: 'Naqd al-Adab • Critical Schools, Theories & Department Syllabus',
    link: 'course-407.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'purple',
    badgeText: 'Portal',
    createdAt: 320,
  },
  {
    id: 'course-407-note-4',
    title: 'Special Note 4: Naqd al-Adab (Modern Arabic Criticism)',
    subtitle: 'In-Depth Analysis of Modern Arabic Literary Criticism Movements & Concepts',
    link: 'course-407-note-4.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'FileText',
    colorTheme: 'purple',
    badgeText: 'Special Note',
    createdAt: 321,
  },
];

const INITIAL_COURSE_408_CHILDREN: ArchiveCardButton[] = [
  {
    id: 'course-408-portal',
    title: 'Course-408 (B): Social Research & Project Portal',
    subtitle: 'Manhaj al-Baḥth • Research Methodology, DU Project Guidelines & Tools',
    link: 'course-408.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Compass',
    colorTheme: 'indigo',
    badgeText: 'Portal',
    createdAt: 330,
  },
  {
    id: 'du-academic-project-guide',
    title: 'DU Academic Social Research Project Guide',
    subtitle: 'Complete Formatting, Proposal Submission & Thesis Methodology Manual',
    link: 'project-DU.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Award',
    colorTheme: 'indigo',
    badgeText: 'Project Guide',
    createdAt: 331,
  },
];

const INITIAL_ACADEMIC_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'academic-course-405',
    title: 'Course-405: Modern Poetry II',
    subtitle: 'Al-Shi‘r al-Hadith • Interactive Karaoke, Poems & Biographies',
    targetType: 'folder',
    children: INITIAL_COURSE_405_CHILDREN,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Modern Poetry',
    createdAt: 301,
  },
  {
    id: 'academic-course-406',
    title: 'Course-406: Terminology through Translation',
    subtitle: 'At-Tarjamah • Nure Alam & Ehsan Notes, Monkeypox & Terminology Bank',
    targetType: 'folder',
    children: INITIAL_COURSE_406_CHILDREN,
    iconName: 'Layers',
    colorTheme: 'blue',
    badgeText: 'Translation',
    createdAt: 302,
  },
  {
    id: 'academic-course-407',
    title: 'Course-407: Arabic Literary Criticism',
    subtitle: 'Naqd al-Adab • Critical Movements, Modern Schools & Special Note 4',
    targetType: 'folder',
    children: INITIAL_COURSE_407_CHILDREN,
    iconName: 'FileText',
    colorTheme: 'purple',
    badgeText: 'Criticism',
    createdAt: 303,
  },
  {
    id: 'academic-course-408',
    title: 'Course-408 (B): Social Research & Project',
    subtitle: 'Manhaj al-Baḥth • Research Methodology, DU Project Guidelines & Tools',
    targetType: 'folder',
    children: INITIAL_COURSE_408_CHILDREN,
    iconName: 'Compass',
    colorTheme: 'indigo',
    badgeText: 'Research',
    createdAt: 304,
  },
  {
    id: 'academic-pq-2017-21',
    title: 'Previous Questions (2017–2021)',
    subtitle: '8th Semester Complete Question Collection PDF Archive',
    link: 'https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Award',
    colorTheme: 'rose',
    badgeText: 'Drive PDF',
    createdAt: 305,
  },
  {
    id: 'academic-pq-2021-23',
    title: 'Previous Questions (2021–2023)',
    subtitle: '8th Semester Recent Examination Papers PDF Archive',
    link: 'https://drive.google.com/file/d/1A6asIfVsu2LiVqg0lozhS075gF-GvT_-/view?usp=sharing',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Award',
    colorTheme: 'rose',
    badgeText: 'Drive PDF',
    createdAt: 306,
  },
  {
    id: 'academic-overview-full',
    title: 'All Academic Courses & Notices',
    subtitle: 'All-in-One 8th Semester Academic Portal & Department Notice Board',
    link: 'academic.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'emerald',
    badgeText: 'Full Page',
    createdAt: 307,
  },
];

const INITIAL_ENGLISH_POETS_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'english-archive-portal',
    title: 'English Literature Archive Portal',
    subtitle: 'Comprehensive Literary Periods, Master Authors, Analyses & MCQs',
    link: 'EnglishPoets/english_literature_archive.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'blue',
    badgeText: 'Portal',
    createdAt: 401,
  },
  {
    id: 'poet-shakespeare',
    title: 'William Shakespeare (উইলিয়াম শেকসপিয়র)',
    subtitle: 'The Bard of Avon • Complete Life, 38 Plays, 154 Sonnets & Quotes',
    link: 'EnglishPoets/note_on_william_shakespeare_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'purple',
    badgeText: 'Master Note',
    createdAt: 402,
  },
  {
    id: 'poet-milton',
    title: 'John Milton (জন মিল্টন)',
    subtitle: 'Paradise Lost, Epic Poetry, Biography & Literary Contribution',
    link: 'EnglishPoets/John Milton.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'blue',
    badgeText: 'Biography',
    createdAt: 403,
  },
  {
    id: 'poet-milton-mcq',
    title: 'John Milton MCQ Quiz',
    subtitle: 'Practice Questions, Model Tests & BCS Exam Preparation',
    link: 'EnglishPoets/John Milton mcq.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Sparkles',
    colorTheme: 'blue',
    badgeText: 'Quiz Test',
    createdAt: 404,
  },
  {
    id: 'poet-yeats',
    title: 'W.B. Yeats (ডব্লিউ বি ইয়েটস)',
    subtitle: 'Irish Literary Revival, Modernist Poetry, Nobel Laureate Profile',
    link: 'EnglishPoets/W.B. Yeats.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Biography',
    createdAt: 405,
  },
  {
    id: 'poet-yeats-mcq',
    title: 'W.B. Yeats MCQ Quiz',
    subtitle: 'Interactive Model Test, Past Questions & Analytical Solutions',
    link: 'EnglishPoets/W.B. Yeats MCQ.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Sparkles',
    colorTheme: 'emerald',
    badgeText: 'Quiz Test',
    createdAt: 406,
  },
  {
    id: 'poet-keats',
    title: 'John Keats (জন কিটস)',
    subtitle: 'Romantic Ode Master • Beauty is Truth, Life & Major Works',
    link: 'EnglishPoets/note_on_john_keats_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'rose',
    badgeText: 'Master Note',
    createdAt: 407,
  },
  {
    id: 'poet-wordsworth',
    title: 'William Wordsworth (উইলিয়াম ওয়ার্ডসওয়ার্থ)',
    subtitle: 'Poet of Nature, Lyrical Ballads, Romantic Era Pioneer',
    link: 'EnglishPoets/note_on_william_wordsworth_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Master Note',
    createdAt: 408,
  },
  {
    id: 'poet-shelley',
    title: 'P.B. Shelley (পি বি শেলি)',
    subtitle: 'Ode to the West Wind, Revolutionary Idealism & Romantic Spirit',
    link: 'EnglishPoets/note_on_p_b_shelley_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'indigo',
    badgeText: 'Master Note',
    createdAt: 409,
  },
  {
    id: 'poet-byron',
    title: 'Lord Byron (লর্ড বায়রন)',
    subtitle: 'Byronic Hero, Don Juan, Romanticism & Dramatic Life',
    link: 'EnglishPoets/note_on_lord_byron_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'purple',
    badgeText: 'Master Note',
    createdAt: 410,
  },
  {
    id: 'poet-eliot',
    title: 'T.S. Eliot (টি এস এলিয়ট)',
    subtitle: 'The Waste Land, Modernist Revolution, Objective Correlative',
    link: 'EnglishPoets/note_on_t_s_eliot_emam_mehedi.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'blue',
    badgeText: 'Master Note',
    createdAt: 411,
  },
  {
    id: 'poet-browning',
    title: 'Robert Browning (রবার্ট ব্রাউনিং)',
    subtitle: 'Dramatic Monologue Pioneer, Victorian Era Master Profile',
    link: 'EnglishPoets/Robert Browning.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'amber',
    badgeText: 'Biography',
    createdAt: 412,
  },
  {
    id: 'poets-all-hub',
    title: 'All 50+ English Poets Directory',
    subtitle: 'Complete Chronological List of English & American Literary Masters',
    link: 'EnglishPoets.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'GraduationCap',
    colorTheme: 'blue',
    badgeText: '50+ Poets',
    createdAt: 413,
  },
];

const INITIAL_VOCABULARY_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'vocab-day-1',
    title: 'Day 01: Daily Vocabulary',
    subtitle: 'Trilingual Vocabulary Bank with Pronunciation, Meaning & Usage',
    link: 'vocabs/day1.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 01',
    createdAt: 501,
  },
  {
    id: 'vocab-day-2',
    title: 'Day 02: Daily Vocabulary',
    subtitle: 'Key Academic & Everyday Words with Sentence Examples',
    link: 'vocabs/day2.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 02',
    createdAt: 502,
  },
  {
    id: 'vocab-day-3',
    title: 'Day 03: Daily Vocabulary',
    subtitle: 'Synonyms, Antonyms & Contextual Usage Drills',
    link: 'vocabs/day3.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 03',
    createdAt: 503,
  },
  {
    id: 'vocab-day-4',
    title: 'Day 04: Daily Vocabulary',
    subtitle: 'Arabic-Bengali-English Trilingual Study Flashcards',
    link: 'vocabs/day4.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 04',
    createdAt: 504,
  },
  {
    id: 'vocab-day-5',
    title: 'Day 05: Daily Vocabulary',
    subtitle: 'Competitive Exam & BCS High-Frequency Words',
    link: 'vocabs/day5.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 05',
    createdAt: 505,
  },
  {
    id: 'vocab-day-6',
    title: 'Day 06: Daily Vocabulary',
    subtitle: 'Idiomatic Expressions & Common Collocations',
    link: 'vocabs/day6.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 06',
    createdAt: 506,
  },
  {
    id: 'vocab-day-7',
    title: 'Day 07: Daily Vocabulary',
    subtitle: 'Comprehensive Daily Language Vocabulary Lesson',
    link: 'vocabs/day7.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 07',
    createdAt: 507,
  },
  {
    id: 'vocab-day-8',
    title: 'Day 08: Daily Vocabulary',
    subtitle: 'Modern Linguistic Vocabulary and Definitions',
    link: 'vocabs/day8.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 08',
    createdAt: 508,
  },
  {
    id: 'vocab-day-9',
    title: 'Day 09: Daily Vocabulary',
    subtitle: 'Grammar and Syntax Focused Vocabulary Practice',
    link: 'vocabs/day9.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 09',
    createdAt: 509,
  },
  {
    id: 'vocab-day-10',
    title: 'Day 10: Daily Vocabulary',
    subtitle: 'Advanced Academic Vocabulary Drills',
    link: 'vocabs/day10.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 10',
    createdAt: 510,
  },
  {
    id: 'vocab-day-11',
    title: 'Day 11: Daily Vocabulary',
    subtitle: 'Reading Comprehension Vocabulary Boosters',
    link: 'vocabs/day11.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 11',
    createdAt: 511,
  },
  {
    id: 'vocab-day-12',
    title: 'Day 12: Daily Vocabulary',
    subtitle: 'Root Words, Prefixes and Suffixes',
    link: 'vocabs/day12.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 12',
    createdAt: 512,
  },
  {
    id: 'vocab-day-13',
    title: 'Day 13: Daily Vocabulary',
    subtitle: 'Interactive Vocabulary Drills and Translations',
    link: 'vocabs/day13.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 13',
    createdAt: 513,
  },
  {
    id: 'vocab-day-14',
    title: 'Day 14: Daily Vocabulary',
    subtitle: 'Fortnight Word Review & Self-Assessment Exercises',
    link: 'vocabs/day14.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Lesson 14',
    createdAt: 514,
  },
  {
    id: 'vocab-weekly-1',
    title: 'Weekly Vocabulary Review 01',
    subtitle: 'Cumulative Quiz, Synonyms-Antonyms Bank & Solutions',
    link: 'vocabs/weekly1.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Sparkles',
    colorTheme: 'indigo',
    badgeText: 'Review 01',
    createdAt: 515,
  },
  {
    id: 'vocab-weekly-2',
    title: 'Weekly Vocabulary Review 02',
    subtitle: 'Full 2-Week Vocabulary Assessment & Model Test',
    link: 'vocabs/weekly2.html',
    targetType: 'url',
    openInNewTab: true,
    iconName: 'Sparkles',
    colorTheme: 'indigo',
    badgeText: 'Review 02',
    createdAt: 516,
  },
];

const INITIAL_ACADEMIC_CARD: ArchiveCardButton = {
  id: 'academic-card',
  title: 'Academic',
  subtitle: '8th Semester Department of Arabic • Modern Poetry, Translation, Criticism, Research & Question Papers',
  targetType: 'folder',
  children: INITIAL_ACADEMIC_SUBFOLDERS,
  iconName: 'GraduationCap',
  colorTheme: 'emerald',
  badgeText: 'DU Arabic',
  createdAt: 0,
};

const INITIAL_ENGLISH_POETS_CARD: ArchiveCardButton = {
  id: 'english-poets-card',
  title: 'English Literature & Poets',
  subtitle: '50+ English Literary Masters • Shakespeare, Milton, Yeats, Keats, Wordsworth, MCQs & Notes',
  targetType: 'folder',
  children: INITIAL_ENGLISH_POETS_SUBFOLDERS,
  iconName: 'BookOpen',
  colorTheme: 'blue',
  badgeText: '50+ Poets',
  createdAt: 10,
};

const INITIAL_VOCABULARY_CARD: ArchiveCardButton = {
  id: 'vocabulary-card',
  title: 'Daily Vocabularies',
  subtitle: 'Day 1–14 Daily Lessons, Weekly Reviews & Trilingual Language Bank',
  targetType: 'folder',
  children: INITIAL_VOCABULARY_SUBFOLDERS,
  iconName: 'BookOpen',
  colorTheme: 'emerald',
  badgeText: '14 Days',
  createdAt: 20,
};

const INITIAL_ICT_PERIPHERALS_CARD: ArchiveCardButton = {
  id: 'ict-peripherals-card',
  title: 'ICT & Computer Peripherals',
  subtitle: 'Input/Output Devices, Computer Architecture, Motherboard, Networking & Tech Notes',
  link: 'ict_peripherals.html',
  targetType: 'url',
  openInNewTab: true,
  iconName: 'Layers',
  colorTheme: 'indigo',
  badgeText: 'ICT Hub',
  createdAt: 30,
};

const INITIAL_SSC_CARD: ArchiveCardButton = {
  id: 'ssc-card',
  title: 'Educational Resources & SSC',
  subtitle: 'SSC Syllabi, Secondary School Board Questions, Textbooks & Educational Resources Hub',
  link: 'Resources.html',
  targetType: 'url',
  openInNewTab: true,
  iconName: 'GraduationCap',
  colorTheme: 'amber',
  badgeText: 'Resources',
  createdAt: 40,
};

const INITIAL_BCS_SUBFOLDERS: ArchiveCardButton[] = [
  {
    id: 'bcs-bangla-literature',
    title: 'Bangla Literature',
    subtitle: 'Ancient, Medieval & Modern Bengali Literature Notes & Questions',
    targetType: 'folder',
    children: [],
    iconName: 'BookOpen',
    colorTheme: 'emerald',
    badgeText: 'Literature',
    createdAt: 101,
  },
  {
    id: 'bcs-bangla-grammar',
    title: 'Bangla Grammar',
    subtitle: 'Bengali Grammar Rules, Phonetics, Syntax & Vocabulary',
    targetType: 'folder',
    children: [],
    iconName: 'FileText',
    colorTheme: 'emerald',
    badgeText: 'Grammar',
    createdAt: 102,
  },
  {
    id: 'bcs-english-literature',
    title: 'English Literature',
    subtitle: 'Literary Eras, Famous Authors, Dramas, Poetry & Key Quotes',
    targetType: 'folder',
    children: [],
    iconName: 'BookOpen',
    colorTheme: 'blue',
    badgeText: 'Literature',
    createdAt: 103,
  },
  {
    id: 'bcs-english-grammar',
    title: 'English Grammar',
    subtitle: 'Parts of Speech, Tense, Voice, Narration, Idioms & Prepositions',
    targetType: 'folder',
    children: [],
    iconName: 'FileText',
    colorTheme: 'blue',
    badgeText: 'Grammar',
    createdAt: 104,
  },
  {
    id: 'bcs-mathematics',
    title: 'Mathematics',
    subtitle: 'Arithmetic, Algebra, Geometry, Trigonometry & Shortcuts',
    targetType: 'folder',
    children: [],
    iconName: 'Sparkles',
    colorTheme: 'indigo',
    badgeText: 'Math',
    createdAt: 105,
  },
  {
    id: 'bcs-science',
    title: 'Science',
    subtitle: 'General Science, Physics, Chemistry, Biology & Everyday Science',
    targetType: 'folder',
    children: [],
    iconName: 'Compass',
    colorTheme: 'purple',
    badgeText: 'Science',
    createdAt: 106,
  },
  {
    id: 'bcs-ict',
    title: 'ICT',
    subtitle: 'Information and Communication Technology, Networks & Internet',
    targetType: 'folder',
    children: [],
    iconName: 'Layers',
    colorTheme: 'indigo',
    badgeText: 'ICT',
    createdAt: 107,
  },
  {
    id: 'bcs-gk-bangladesh',
    title: 'GK (Bangladesh)',
    subtitle: 'History, Liberation War, Constitution, Economy & Current Affairs',
    targetType: 'folder',
    children: [],
    iconName: 'Award',
    colorTheme: 'rose',
    badgeText: 'Affairs',
    createdAt: 108,
  },
  {
    id: 'bcs-gk-international',
    title: 'GK (International)',
    subtitle: 'World Geography, Treaties, Global Organizations & World News',
    targetType: 'folder',
    children: [],
    iconName: 'Globe',
    colorTheme: 'blue',
    badgeText: 'Global',
    createdAt: 109,
  },
  {
    id: 'bcs-computer',
    title: 'Computer',
    subtitle: 'Hardware, Software, Operating Systems, Database & Cloud Concepts',
    targetType: 'folder',
    children: [],
    iconName: 'Layers',
    colorTheme: 'emerald',
    badgeText: 'Tech',
    createdAt: 110,
  },
  {
    id: 'bcs-mental-ability',
    title: 'Mental Ability',
    subtitle: 'Logical Reasoning, Spatial Orientation, Verbal & Numerical Logic',
    targetType: 'folder',
    children: [],
    iconName: 'Sparkles',
    colorTheme: 'amber',
    badgeText: 'Analytical',
    createdAt: 111,
  },
  {
    id: 'bcs-morality-governance',
    title: 'Morality and Good Governance',
    subtitle: 'Ethics, Morals, Integrity, Governance Principles & Values',
    targetType: 'folder',
    children: [],
    iconName: 'GraduationCap',
    colorTheme: 'purple',
    badgeText: 'Ethics',
    createdAt: 112,
  },
  {
    id: 'bcs-geography',
    title: 'Geography',
    subtitle: 'Geography of Bangladesh and World, Environment & Disaster Mgmt',
    targetType: 'folder',
    children: [],
    iconName: 'Compass',
    colorTheme: 'emerald',
    badgeText: 'Geography',
    createdAt: 113,
  },
];

const INITIAL_BCS_CARD: ArchiveCardButton = {
  id: 'bcs-card',
  title: 'BCS',
  subtitle: 'Bangladesh Civil Service Preliminary, Written & Viva Preparation Hub',
  targetType: 'folder',
  children: INITIAL_BCS_SUBFOLDERS,
  iconName: 'Briefcase',
  colorTheme: 'emerald',
  badgeText: '13 Subjects',
  createdAt: 1,
};

const INITIAL_CARDS: ArchiveCardButton[] = [
  INITIAL_ACADEMIC_CARD,
  INITIAL_ENGLISH_POETS_CARD,
  INITIAL_VOCABULARY_CARD,
  INITIAL_BCS_CARD,
  INITIAL_ICT_PERIPHERALS_CARD,
  INITIAL_SSC_CARD,
];

// Helper to make sure all core cards and folders exist
function ensureCompleteTree(cards: ArchiveCardButton[]): ArchiveCardButton[] {
  if (!Array.isArray(cards) || cards.length === 0) {
    return INITIAL_CARDS;
  }

  let result = [...cards];

  // 1. Ensure Academic Card is present with valid children
  const academicIdx = result.findIndex(
    (c) => c.id === 'academic-card' || c.title?.trim().toLowerCase() === 'academic'
  );
  if (academicIdx === -1) {
    result.unshift(INITIAL_ACADEMIC_CARD);
  } else {
    const existing = result[academicIdx];
    if (!existing.children || existing.children.length === 0) {
      result[academicIdx] = {
        ...INITIAL_ACADEMIC_CARD,
        ...existing,
        children: INITIAL_ACADEMIC_SUBFOLDERS,
        targetType: 'folder',
      };
    }
  }

  // 2. Ensure English Poets Card
  const englishIdx = result.findIndex(
    (c) =>
      c.id === 'english-poets-card' ||
      c.title?.toLowerCase().includes('english poet') ||
      c.title?.toLowerCase().includes('english literature')
  );
  if (englishIdx === -1) {
    result.push(INITIAL_ENGLISH_POETS_CARD);
  }

  // 3. Ensure Vocabulary Card
  const vocabIdx = result.findIndex(
    (c) => c.id === 'vocabulary-card' || c.title?.toLowerCase().includes('vocabulary')
  );
  if (vocabIdx === -1) {
    result.push(INITIAL_VOCABULARY_CARD);
  }

  // 4. Ensure BCS Card
  const bcsIdx = result.findIndex(
    (c) => c.id === 'bcs-card' || c.title?.trim().toLowerCase() === 'bcs'
  );
  if (bcsIdx === -1) {
    result.push(INITIAL_BCS_CARD);
  } else if (!result[bcsIdx].children || result[bcsIdx].children.length === 0) {
    result[bcsIdx] = {
      ...result[bcsIdx],
      targetType: 'folder',
      children: INITIAL_BCS_SUBFOLDERS,
    };
  }

  // 5. Ensure ICT Peripherals Card
  const ictIdx = result.findIndex(
    (c) => c.id === 'ict-peripherals-card' || c.title?.toLowerCase().includes('ict')
  );
  if (ictIdx === -1) {
    result.push(INITIAL_ICT_PERIPHERALS_CARD);
  }

  // 6. Ensure SSC / Resources Card
  const sscIdx = result.findIndex(
    (c) =>
      c.id === 'ssc-card' ||
      c.title?.toLowerCase() === 'ssc' ||
      c.title?.toLowerCase().includes('resource')
  );
  if (sscIdx === -1) {
    result.push(INITIAL_SSC_CARD);
  }

  return result;
}

const THEME_STYLES: Record<
  string,
  {
    dark: {
      bg: string;
      border: string;
      hoverBorder: string;
      iconBg: string;
      iconColor: string;
      badgeBg: string;
      badgeText: string;
      buttonBg: string;
      buttonHover: string;
      titleColor: string;
      titleHover: string;
    };
    light: {
      bg: string;
      border: string;
      hoverBorder: string;
      iconBg: string;
      iconColor: string;
      badgeBg: string;
      badgeText: string;
      buttonBg: string;
      buttonHover: string;
      titleColor: string;
      titleHover: string;
    };
  }
> = {
  emerald: {
    dark: {
      bg: 'from-emerald-950/40 via-gray-900 to-gray-900',
      border: 'border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-400',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
      badgeText: 'text-emerald-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-emerald-300',
    },
    light: {
      bg: 'from-emerald-50/80 via-white to-slate-50/90',
      border: 'border-emerald-200/90',
      hoverBorder: 'hover:border-emerald-500',
      iconBg: 'bg-emerald-100/90',
      iconColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 border-emerald-300',
      badgeText: 'text-emerald-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-emerald-700',
    },
  },
  blue: {
    dark: {
      bg: 'from-blue-950/40 via-gray-900 to-gray-900',
      border: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 border-blue-500/30',
      badgeText: 'text-blue-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-blue-300',
    },
    light: {
      bg: 'from-blue-50/80 via-white to-slate-50/90',
      border: 'border-blue-200/90',
      hoverBorder: 'hover:border-blue-500',
      iconBg: 'bg-blue-100/90',
      iconColor: 'text-blue-700',
      badgeBg: 'bg-blue-100 border-blue-300',
      badgeText: 'text-blue-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-blue-700',
    },
  },
  indigo: {
    dark: {
      bg: 'from-indigo-950/40 via-gray-900 to-gray-900',
      border: 'border-indigo-500/30',
      hoverBorder: 'hover:border-indigo-400',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 border-indigo-500/30',
      badgeText: 'text-indigo-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-indigo-300',
    },
    light: {
      bg: 'from-indigo-50/80 via-white to-slate-50/90',
      border: 'border-indigo-200/90',
      hoverBorder: 'hover:border-indigo-500',
      iconBg: 'bg-indigo-100/90',
      iconColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-100 border-indigo-300',
      badgeText: 'text-indigo-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-indigo-700',
    },
  },
  purple: {
    dark: {
      bg: 'from-purple-950/40 via-gray-900 to-gray-900',
      border: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 border-purple-500/30',
      badgeText: 'text-purple-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-purple-300',
    },
    light: {
      bg: 'from-purple-50/80 via-white to-slate-50/90',
      border: 'border-purple-200/90',
      hoverBorder: 'hover:border-purple-500',
      iconBg: 'bg-purple-100/90',
      iconColor: 'text-purple-700',
      badgeBg: 'bg-purple-100 border-purple-300',
      badgeText: 'text-purple-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-purple-700',
    },
  },
  amber: {
    dark: {
      bg: 'from-amber-950/40 via-gray-900 to-gray-900',
      border: 'border-amber-500/30',
      hoverBorder: 'hover:border-amber-400',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-500/30',
      badgeText: 'text-amber-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-amber-300',
    },
    light: {
      bg: 'from-amber-50/80 via-white to-slate-50/90',
      border: 'border-amber-200/90',
      hoverBorder: 'hover:border-amber-500',
      iconBg: 'bg-amber-100/90',
      iconColor: 'text-amber-700',
      badgeBg: 'bg-amber-100 border-amber-300',
      badgeText: 'text-amber-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-amber-700',
    },
  },
  rose: {
    dark: {
      bg: 'from-rose-950/40 via-gray-900 to-gray-900',
      border: 'border-rose-500/30',
      hoverBorder: 'hover:border-rose-400',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 border-rose-500/30',
      badgeText: 'text-rose-300',
      buttonBg: 'bg-gray-800 border-gray-700 text-white',
      buttonHover: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500',
      titleColor: 'text-white',
      titleHover: 'group-hover:text-rose-300',
    },
    light: {
      bg: 'from-rose-50/80 via-white to-slate-50/90',
      border: 'border-rose-200/90',
      hoverBorder: 'hover:border-rose-500',
      iconBg: 'bg-rose-100/90',
      iconColor: 'text-rose-700',
      badgeBg: 'bg-rose-100 border-rose-300',
      badgeText: 'text-rose-800',
      buttonBg: 'bg-slate-100 border-slate-200 text-slate-800',
      buttonHover: 'group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600',
      titleColor: 'text-slate-900',
      titleHover: 'group-hover:text-rose-700',
    },
  },
};

// Helper: Deeply find a card by ID within a nested tree
const findCardDeep = (cards: ArchiveCardButton[], id: string): ArchiveCardButton | null => {
  for (const card of cards) {
    if (card.id === id) return card;
    if (card.children && card.children.length > 0) {
      const found = findCardDeep(card.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper: Get list of cards at the current folder path
const getCardsAtPath = (rootCards: ArchiveCardButton[], folderPath: string[]): ArchiveCardButton[] => {
  let currentList = rootCards;
  for (const folderId of folderPath) {
    const parent = currentList.find((c) => c.id === folderId);
    if (parent && parent.children) {
      currentList = parent.children;
    } else {
      return [];
    }
  }
  return currentList;
};

// Helper: Deeply update cards at the specified folder path
const updateCardsAtPath = (
  rootCards: ArchiveCardButton[],
  folderPath: string[],
  newChildList: ArchiveCardButton[]
): ArchiveCardButton[] => {
  if (folderPath.length === 0) {
    return newChildList;
  }

  const [currentId, ...restPath] = folderPath;
  return rootCards.map((card) => {
    if (card.id === currentId) {
      const currentChildren = card.children || [];
      const updatedChildren =
        restPath.length === 0
          ? newChildList
          : updateCardsAtPath(currentChildren, restPath, newChildList);
      return {
        ...card,
        children: updatedChildren,
      };
    }
    return card;
  });
};

export const ArchivesView: React.FC<ArchivesViewProps> = ({
  theme = 'light',
  isExplorerMode: propExplorerMode,
  onToggleExplorerMode: propToggleExplorerMode,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Full nested tree state
  const [rootCards, setRootCards] = useState<ArchiveCardButton[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureCompleteTree(parsed);
        }
      } catch (e) {
        console.error('Error loading archive cards:', e);
      }
    }
    return INITIAL_CARDS;
  });

  // Keep an active ref for rootCards and folderPath to guarantee async operations and deletions always use the latest snapshot
  const rootCardsRef = useRef<ArchiveCardButton[]>(rootCards);
  useEffect(() => {
    rootCardsRef.current = rootCards;
  }, [rootCards]);

  const folderPathRef = useRef<string[]>([]);
  const isSelfSavingRef = useRef<boolean>(false);

  // Breadcrumb / Navigation Path State: array of folder Card IDs
  const [folderPath, setFolderPath] = useState<string[]>([]);
  useEffect(() => {
    folderPathRef.current = folderPath;
  }, [folderPath]);

  // Calculate current folder's active card object (if in subfolder)
  const currentFolderCard: ArchiveCardButton | null =
    folderPath.length > 0
      ? findCardDeep(rootCards, folderPath[folderPath.length - 1])
      : null;

  // Active cards currently displayed on the page
  const currentCards = getCardsAtPath(rootCards, folderPath);

  // Breadcrumb Trail Objects
  const breadcrumbTrail = folderPath.map((id, index) => {
    const card = findCardDeep(rootCards, id);
    return {
      id,
      title: card?.title || 'Folder',
      path: folderPath.slice(0, index + 1),
    };
  });

  // Developer / Admin Mode State
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    return sessionStorage.getItem(DEV_AUTH_KEY) === 'true';
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // HTML Viewer Modal State
  const [viewingHtmlCard, setViewingHtmlCard] = useState<ArchiveCardButton | null>(null);

  // File Explorer View Toggle State (Saved in localStorage for both User and Admin)
  const [internalExplorerMode, setInternalExplorerMode] = useState<boolean>(() => {
    return localStorage.getItem('class_caddy_explorer_mode') === 'true';
  });

  const isExplorerMode = propExplorerMode !== undefined ? propExplorerMode : internalExplorerMode;

  // Cloud Sync Status: 'idle' | 'syncing' | 'synced' | 'error'
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Toggle Explorer Mode Helper
  const handleToggleExplorerMode = () => {
    if (propToggleExplorerMode) {
      propToggleExplorerMode();
    } else {
      setInternalExplorerMode((prev) => {
        const next = !prev;
        localStorage.setItem('class_caddy_explorer_mode', String(next));
        return next;
      });
    }
  };

  // Real-time Firestore Cloud Sync: Listen for universal changes across all devices & sessions
  useEffect(() => {
    try {
      const docRef = doc(db, 'archive_settings', FIRESTORE_DOC_PATH);
      const unsubscribe = onSnapshot(
        docRef,
        async (snapshot) => {
          // If we just saved locally, ignore echo to prevent race conditions
          if (isSelfSavingRef.current) {
            return;
          }

          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data) {
              try {
                let jsonString = '';
                if (data.isChunked && typeof data.totalChunks === 'number') {
                  // Fetch and assemble all chunks
                  const chunkPromises = [];
                  for (let i = 0; i < data.totalChunks; i++) {
                    const chunkRef = doc(db, 'archive_settings', `tree_chunk_${i}`);
                    chunkPromises.push(getDoc(chunkRef));
                  }
                  const chunkDocs = await Promise.all(chunkPromises);
                  jsonString = chunkDocs.map((cDoc) => cDoc.data()?.data || '').join('');
                } else if (typeof data.cards === 'string') {
                  jsonString = data.cards;
                }

                if (jsonString) {
                  const cloudCards: ArchiveCardButton[] = JSON.parse(jsonString);
                  if (Array.isArray(cloudCards)) {
                    const completeTree = ensureCompleteTree(cloudCards);
                    rootCardsRef.current = completeTree;
                    setRootCards(completeTree);
                    try {
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(completeTree));
                    } catch (lsErr) {
                      console.warn('Local storage size notice:', lsErr);
                    }
                    setSyncStatus('synced');
                  }
                }
              } catch (parseErr) {
                console.error('Error parsing cloud archive tree:', parseErr);
              }
            }
          } else {
            // First time seeding to cloud if no document exists
            const initialJson = JSON.stringify(rootCardsRef.current);
            setDoc(docRef, {
              cards: initialJson,
              updatedAt: new Date().toISOString(),
              updatedBy: 'system-init',
            }).catch((err) => {
              console.warn('Initial cloud seed notice:', err);
            });
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot subscription notice:', error);
          // Gracefully fallback to local storage
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore initialization notice:', err);
    }
  }, []);

  // Synchronize Sub Folder Navigation with Browser History (Hardware & Browser Back Button navigation)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && Array.isArray(e.state.folderPath)) {
        setFolderPath(e.state.folderPath);
      } else {
        setFolderPath([]);
      }
    };

    // Ensure initial history state has folderPath
    if (!window.history.state || !('folderPath' in window.history.state)) {
      window.history.replaceState({ folderPath: [] }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to navigate to a subfolder while recording history
  const navigateToFolder = (newPath: string[]) => {
    setFolderPath(newPath);
    window.history.pushState({ folderPath: newPath }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to navigate back to parent folder
  const navigateBackToParent = () => {
    if (folderPath.length > 0) {
      window.history.back();
    }
  };
  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      fetch('/api/admin/check-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Not available');
          return res.json();
        })
        .then((data) => {
          if (data && data.valid === false) {
            setIsDeveloperMode(false);
            sessionStorage.removeItem(DEV_AUTH_KEY);
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          } else {
            setIsDeveloperMode(true);
          }
        })
        .catch(() => {
          // On Netlify / static hosts where /api endpoints return 404, retain the active session if DEV_AUTH_KEY is set
          if (sessionStorage.getItem(DEV_AUTH_KEY) === 'true') {
            setIsDeveloperMode(true);
          }
        });
    } else {
      if (sessionStorage.getItem(DEV_AUTH_KEY) !== 'true') {
        setIsDeveloperMode(false);
      }
    }
  }, []);

  // Edit / Add Modal State
  const [editingCard, setEditingCard] = useState<ArchiveCardButton | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTargetType, setFormTargetType] = useState<'url' | 'html' | 'file' | 'folder'>('url');
  const [formLink, setFormLink] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileType, setFormFileType] = useState('');
  const [formFileData, setFormFileData] = useState('');
  const [formOpenInNewTab, setFormOpenInNewTab] = useState(true);
  const [formIcon, setFormIcon] = useState<ArchiveCardButton['iconName']>('Briefcase');
  const [formTheme, setFormTheme] = useState<ArchiveCardButton['colorTheme']>('emerald');
  const [formBadge, setFormBadge] = useState('');
  const [fileReadError, setFileReadError] = useState('');

  // Save current view list to nested tree, local storage, and real-time Firestore cloud database
  const saveCurrentCards = async (newCurrentList: ArchiveCardButton[]) => {
    // Always use active ref states to ensure deletions never reference a stale closure
    const currentRoot = rootCardsRef.current;
    const currentPath = folderPathRef.current;
    const updatedRoot = updateCardsAtPath(currentRoot, currentPath, newCurrentList);
    
    rootCardsRef.current = updatedRoot;
    setRootCards(updatedRoot);
    const serialized = JSON.stringify(updatedRoot);
    
    // Save to local cache immediately
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (lsErr) {
      console.warn('Local storage size warning:', lsErr);
    }

    // Universal cross-device persistence via Firestore
    try {
      isSelfSavingRef.current = true;
      setSyncStatus('syncing');

      // Check serialized size. If payload is within Firestore single document limit (< 950KB)
      if (serialized.length < 950000) {
        const docRef = doc(db, 'archive_settings', FIRESTORE_DOC_PATH);
        
        // Clean up previous chunk document markers if tree shrunk after file deletion
        await setDoc(
          docRef,
          {
            cards: serialized,
            isChunked: false,
            totalChunks: 0,
            updatedAt: new Date().toISOString(),
            updatedBy: 'developer-admin',
          }
        );
      } else {
        // For large trees with multiple uploaded PDF/binary files:
        // We split the large tree into chunks
        const chunkSize = 750000;
        const totalChunks = Math.ceil(serialized.length / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
          const chunkData = serialized.slice(i * chunkSize, (i + 1) * chunkSize);
          const chunkDocRef = doc(db, 'archive_settings', `tree_chunk_${i}`);
          await setDoc(chunkDocRef, {
            chunkIndex: i,
            totalChunks,
            data: chunkData,
            updatedAt: new Date().toISOString(),
          });
        }

        // Update root pointer
        const docRef = doc(db, 'archive_settings', FIRESTORE_DOC_PATH);
        await setDoc(
          docRef,
          {
            isChunked: true,
            totalChunks,
            updatedAt: new Date().toISOString(),
            updatedBy: 'developer-admin',
          }
        );
      }

      setSyncStatus('synced');
    } catch (cloudErr: any) {
      console.error('Firestore cloud sync notice:', cloudErr);
      setSyncStatus('error');
      alert(`Cloud sync notice: ${cloudErr?.message || 'Could not write file to cloud database. Please verify file size.'}`);
    } finally {
      // Re-enable snapshot listener after cloud write propagates
      setTimeout(() => {
        isSelfSavingRef.current = false;
      }, 1000);
    }
  };

  // Hybrid Admin Password Verification:
  // 1. Attempts server-side endpoint (/api/admin/verify) for Express/Cloud Run.
  // 2. Automatically falls back to client-side cryptographic SHA-256 hash comparison on Netlify, GitHub Pages, or offline.
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      // 1. Try server backend endpoint if present
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pinInput }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.success) {
          setIsDeveloperMode(true);
          sessionStorage.setItem(DEV_AUTH_KEY, 'true');
          if (data.token) {
            sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          }
          setShowAuthModal(false);
          setPinInput('');
          setAuthError('');
          return;
        } else if (data && data.message) {
          setAuthError(data.message);
          return;
        }
      }

      // 2. Fallback: Netlify / Static Host Cryptographic SHA-256 verification
      // Hashes the input password using Web Crypto API and compares against the admin SHA-256 hash
      const inputHash = await sha256Hex(pinInput);
      if (inputHash === STATIC_ADMIN_HASH || pinInput === 'Mehedi@#23877') {
        setIsDeveloperMode(true);
        sessionStorage.setItem(DEV_AUTH_KEY, 'true');
        sessionStorage.setItem(ADMIN_TOKEN_KEY, `client-session-${Date.now()}`);
        setShowAuthModal(false);
        setPinInput('');
        setAuthError('');
      } else {
        setAuthError('Incorrect administrator password. Please check and try again.');
      }
    } catch {
      // Fallback direct check
      if (pinInput === 'Mehedi@#23877') {
        setIsDeveloperMode(true);
        sessionStorage.setItem(DEV_AUTH_KEY, 'true');
        setShowAuthModal(false);
        setPinInput('');
        setAuthError('');
      } else {
        setAuthError('Incorrect administrator password.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogoutDeveloper = async () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }).catch(() => null);
      } catch {
        // ignore
      }
    }
    setIsDeveloperMode(false);
    sessionStorage.removeItem(DEV_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setShowAdminPanel(false);
    setEditingCard(null);
  };

  // Handle File Selection for Any File Type (.html, .pdf, .docx, .png, .jpg, .zip, etc.)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileReadError('');
    if (!file) return;

    // Guard size limit (under 3MB for fast Firestore cloud sync)
    if (file.size > 3 * 1024 * 1024) {
      setFileReadError('File size exceeds 3MB. Please choose a file under 3MB for instant cloud synchronization.');
      return;
    }

    setFormFileName(file.name);
    setFormFileType(file.type || 'application/octet-stream');

    if (!formTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormTitle(nameWithoutExt.toUpperCase());
    }

    const isTextHtml = file.type.includes('html') || file.name.endsWith('.html') || file.name.endsWith('.htm');

    if (isTextHtml) {
      const textReader = new FileReader();
      textReader.onload = (event) => {
        const text = event.target?.result as string;
        setFormHtmlContent(text || '');
        setFormFileData(text || '');
      };
      textReader.onerror = () => {
        setFileReadError('Failed to read the HTML file. Please try again.');
      };
      textReader.readAsText(file);
    } else {
      // Binary files (PDF, images, doc, txt, zip, audio, etc.)
      const dataUrlReader = new FileReader();
      dataUrlReader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormFileData(dataUrl || '');
        setFormHtmlContent(''); // Non-HTML files use data URI
      };
      dataUrlReader.onerror = () => {
        setFileReadError('Failed to read the selected file. Please try again.');
      };
      dataUrlReader.readAsDataURL(file);
    }
  };

  // Open Edit Modal for a specific card
  const handleOpenEdit = (card: ArchiveCardButton) => {
    setEditingCard(card);
    setIsAddMode(false);
    setFormTitle(card.title);
    setFormSubtitle(card.subtitle);
    const resolvedType =
      card.targetType ||
      (card.children && card.children.length >= 0 ? 'folder' : card.fileData || card.htmlContent ? 'file' : 'url');
    setFormTargetType(resolvedType);
    setFormLink(card.link || '');
    setFormHtmlContent(card.htmlContent || '');
    setFormFileName(card.fileName || '');
    setFormFileType(card.fileType || '');
    setFormFileData(card.fileData || card.htmlContent || '');
    setFormOpenInNewTab(card.openInNewTab ?? true);
    setFormIcon(card.iconName || (resolvedType === 'folder' ? 'Folder' : 'Briefcase'));
    setFormTheme(card.colorTheme || 'emerald');
    setFormBadge(card.badgeText || '');
    setFileReadError('');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCard(null);
    setIsAddMode(true);
    setFormTitle('');
    setFormSubtitle('');
    setFormTargetType('url');
    setFormLink('https://');
    setFormHtmlContent('');
    setFormFileName('');
    setFormFileType('');
    setFormFileData('');
    setFormOpenInNewTab(true);
    setFormIcon('BookOpen');
    setFormTheme('emerald');
    setFormBadge('');
    setFileReadError('');
  };

  // Save Card (Add or Edit)
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const targetType = formTargetType;
    let finalLink = formLink.trim();
    let finalHtml = formHtmlContent;
    let finalFileData = formFileData;

    if (targetType === 'url') {
      if (!finalLink) finalLink = 'https://';
      finalHtml = '';
      finalFileData = '';
    } else if (targetType === 'folder') {
      finalLink = '';
      finalHtml = '';
      finalFileData = '';
    } else if (targetType === 'html') {
      finalLink = '';
      finalFileData = formHtmlContent;
    } else if (targetType === 'file') {
      finalLink = '';
    }

    if (isAddMode) {
      const newCard: ArchiveCardButton = {
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        targetType,
        link: finalLink,
        htmlContent: finalHtml,
        fileName: formFileName.trim() || undefined,
        fileType: formFileType || undefined,
        fileData: finalFileData || undefined,
        children: targetType === 'folder' ? [] : undefined,
        openInNewTab: formOpenInNewTab,
        iconName: formIcon || (targetType === 'folder' ? 'Folder' : 'BookOpen'),
        colorTheme: formTheme,
        badgeText: formBadge.trim(),
        createdAt: Date.now(),
      };
      const updated = [...currentCards, newCard];
      saveCurrentCards(updated);
    } else if (editingCard) {
      const updated = currentCards.map((c) => {
        if (c.id === editingCard.id) {
          return {
            ...c,
            title: formTitle.trim(),
            subtitle: formSubtitle.trim(),
            targetType,
            link: finalLink,
            htmlContent: finalHtml,
            fileName: formFileName.trim() || undefined,
            fileType: formFileType || undefined,
            fileData: finalFileData || undefined,
            children: targetType === 'folder' ? c.children || [] : undefined,
            openInNewTab: formOpenInNewTab,
            iconName: formIcon,
            colorTheme: formTheme,
            badgeText: formBadge.trim(),
          };
        }
        return c;
      });
      saveCurrentCards(updated);
    }

    setEditingCard(null);
    setIsAddMode(false);
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    const cardToDelete = currentCards.find((c) => c.id === id);
    const isFolder = cardToDelete?.targetType === 'folder';
    const msg = isFolder
      ? `Are you sure you want to delete this Sub folder "${cardToDelete?.title}" and all its internal items?`
      : `Are you sure you want to delete "${cardToDelete?.title}"?`;

    if (window.confirm(msg)) {
      const updated = currentCards.filter((c) => c.id !== id);
      saveCurrentCards(updated);
    }
  };

  // Move Card Up/Down
  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCards.length) return;
    const newCards = [...currentCards];
    const temp = newCards[index];
    newCards[index] = newCards[targetIndex];
    newCards[targetIndex] = temp;
    saveCurrentCards(newCards);
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset archive buttons to default BCS & SSC cards?')) {
      setRootCards(INITIAL_CARDS);
      setFolderPath([]);
      const serialized = JSON.stringify(INITIAL_CARDS);
      localStorage.setItem(STORAGE_KEY, serialized);

      try {
        setSyncStatus('syncing');
        const docRef = doc(db, 'archive_settings', FIRESTORE_DOC_PATH);
        await setDoc(
          docRef,
          {
            cards: serialized,
            updatedAt: new Date().toISOString(),
            updatedBy: 'developer-admin-reset',
          },
          { merge: true }
        );
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Reset sync notice:', err);
      }
    }
  };

  // Click card handler: Supports Sub folders, URL, HTML Code, and Any Uploaded File (.pdf, .html, .docx, images, etc.)
  const handleCardClick = (card: ArchiveCardButton) => {
    if (card.targetType === 'folder') {
      navigateToFolder([...folderPath, card.id]);
      return;
    }

    // Direct HTML code
    if (card.targetType === 'html' && card.htmlContent) {
      if (card.openInNewTab) {
        const blob = new Blob([card.htmlContent], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        setViewingHtmlCard(card);
      }
      return;
    }

    // Uploaded file (HTML, PDF, Document, Image, etc.)
    if (card.targetType === 'file' && (card.fileData || card.htmlContent)) {
      const isHtml = card.fileType?.includes('html') || card.fileName?.endsWith('.html') || card.fileName?.endsWith('.htm') || Boolean(card.htmlContent);

      if (isHtml) {
        const htmlStr = card.htmlContent || card.fileData || '';
        if (card.openInNewTab) {
          const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
        } else {
          setViewingHtmlCard(card);
        }
        return;
      }

      // Non-HTML files (PDF, image, docs, etc.)
      const rawData = card.fileData || '';
      if (rawData) {
        if (card.openInNewTab) {
          // Open binary data URL or Blob in new tab
          const newWin = window.open(rawData, '_blank', 'noopener,noreferrer');
          if (!newWin) {
            // Trigger automatic download if popup is blocked
            const downloadLink = document.createElement('a');
            downloadLink.href = rawData;
            downloadLink.download = card.fileName || 'download';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
        } else {
          // Direct download or view
          const downloadLink = document.createElement('a');
          downloadLink.href = rawData;
          downloadLink.download = card.fileName || 'download';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }
      return;
    }

    // Fallback if card has htmlContent from legacy data
    if (card.htmlContent) {
      if (card.openInNewTab) {
        const blob = new Blob([card.htmlContent], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        setViewingHtmlCard(card);
      }
      return;
    }

    // Standard URL
    if (!card.link || card.link === '#') return;
    if (card.openInNewTab) {
      window.open(card.link, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = card.link;
    }
  };

  return (
    <div
      id="archives-section"
      className={
        isExplorerMode
          ? 'w-full h-full p-0 m-0'
          : 'container mx-auto px-4 md:px-6 py-8 max-w-6xl'
      }
    >
      {/* If File Explorer Mode is Enabled: Render pure full screen Windows 11 Explorer interface */}
      {isExplorerMode ? (
        <div className="w-full h-full fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <Windows11Explorer
            cards={currentCards}
            rootCards={rootCards}
            folderPath={folderPath}
            isDark={isDark}
            isAdmin={isDeveloperMode}
            onNavigateFolder={navigateToFolder}
            onNavigateBack={navigateBackToParent}
            onCardClick={handleCardClick}
            onOpenAddModal={handleOpenAdd}
            onOpenEditModal={handleOpenEdit}
            onDeleteCard={handleDeleteCard}
            onSaveCurrentCards={saveCurrentCards}
            onOpenUpload={() => {
              handleOpenAdd();
              setFormTargetType('file');
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 150);
            }}
            onCloseExplorer={handleToggleExplorerMode}
          />
        </div>
      ) : (
        <>
          {/* Breadcrumb Trail & Sub-folder Navigation Header */}
          {folderPath.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
              <button
                onClick={() => navigateToFolder([])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-sm'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Archives Home</span>
              </button>

              {breadcrumbTrail.map((crumb, idx) => {
                const isLast = idx === breadcrumbTrail.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => navigateToFolder(crumb.path)}
                      disabled={isLast}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                        isLast
                          ? isDark
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-sm'
                          : isDark
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-sm'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{crumb.title}</span>
                    </button>
                  </React.Fragment>
                );
              })}

              <button
                onClick={navigateBackToParent}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-semibold ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border-gray-700'
                    : 'bg-white hover:bg-slate-50 text-emerald-700 border-slate-300 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Parent</span>
              </button>
            </div>
          )}

          {/* Top Banner & Title Area */}
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b transition-colors ${
              isDark ? 'border-gray-800' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  className={`text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {currentFolderCard ? (
                    <>
                      <Folder className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{currentFolderCard.title}</span>
                    </>
                  ) : (
                    'Archives & Resources'
                  )}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {currentCards.length} {currentCards.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <p className={`text-sm mt-1.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {currentFolderCard?.subtitle ||
                  'Access curated examination portals, study materials, sub folders, and academic links.'}
              </p>
            </div>

            {/* Developer Mode Action, Explorer Mode Toggle, & Cloud Sync Indicator */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
              {/* Windows 11 File Explorer View Toggle Button (For Both Admin and Students/Users) */}
              <button
                id="toggle-windows-file-explorer-btn"
                onClick={handleToggleExplorerMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition shadow-sm ${
                  isDark
                    ? 'bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border-blue-500/50'
                    : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-blue-300'
                }`}
                title="Switch to Windows 11 File Explorer Full Screen Mode"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>File Explorer View</span>
              </button>

              {/* Universal Cloud Sync Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border transition ${
                  syncStatus === 'synced'
                    ? isDark
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : syncStatus === 'syncing'
                    ? isDark
                      ? 'bg-blue-950/40 border-blue-800/60 text-blue-400'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                    : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
                title="Real-time Universal Cloud Database Synchronization across all devices"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                ) : (
                  <Cloud className="w-3 h-3 text-emerald-500" />
                )}
                <span>
                  {syncStatus === 'syncing'
                    ? 'Syncing to Cloud...'
                    : syncStatus === 'synced'
                    ? 'Universal Sync Active'
                    : 'Cloud Connected'}
                </span>
              </div>

              {isDeveloperMode ? (
                <div
                  className={`flex items-center gap-2 border rounded-full px-3 py-1.5 shadow-sm ${
                    isDark
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold">Developer Mode Active</span>
                  <button
                    id="open-admin-panel-btn"
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`ml-2 px-2.5 py-1 text-xs text-white font-medium rounded-full transition shadow-sm ${
                      isDark
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                    title="Open Admin Control Panel"
                  >
                    <Settings className="w-3.5 h-3.5 inline mr-1" />
                    Admin Panel
                  </button>
                  <button
                    id="lock-developer-mode-btn"
                    onClick={handleLogoutDeveloper}
                    className="p-1 hover:text-red-500 text-gray-400 transition"
                    title="Lock Developer Mode"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="developer-panel-auth-trigger-btn"
                  onClick={() => setShowAuthModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                  }`}
                  title="Developer Access to edit cards, sub folders, and resources"
                >
                  <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Developer Panel</span>
                </button>
              )}
            </div>
          </div>

      {/* Developer Quick Action Bar */}
      {isDeveloperMode && (
        <div
          className={`mt-4 p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
            isDark
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Developer Mode Enabled</strong> in{' '}
              <span className="font-bold underline">{currentFolderCard?.title || 'Archives Home'}</span>
              : Add links, files, or sub folder pages below.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="quick-add-new-card-btn"
              onClick={handleOpenAdd}
              className={`px-3 py-1.5 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-1 ${
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Button / Sub Folder</span>
            </button>
            <button
              id="toggle-admin-management-tray-btn"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {showAdminPanel ? 'Hide Management Table' : 'Manage Page Buttons'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel Details Table (Collapsible) */}
      {isDeveloperMode && showAdminPanel && (
        <div
          id="developer-management-table-container"
          className={`mt-6 rounded-2xl border p-5 shadow-xl transition-colors ${
            isDark
              ? 'bg-gray-800/80 border-gray-700 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/50 dark:border-gray-700">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Button & Sub Folder Configuration ({currentFolderCard?.title || 'Root Level'})
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Reorder, update titles, create sub folders, paste custom HTML, or delete buttons.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {folderPath.length === 0 && (
                <button
                  onClick={handleResetDefaults}
                  className={`px-2.5 py-1 text-xs rounded border transition flex items-center gap-1 ${
                    isDark
                      ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Reset to default BCS & SSC cards"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
              )}
              <button
                onClick={handleOpenAdd}
                className={`px-3 py-1 text-xs text-white font-semibold rounded shadow-sm transition flex items-center gap-1 ${
                  isDark
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b ${
                    isDark
                      ? 'border-gray-700 text-gray-400'
                      : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}
                >
                  <th className="py-2.5 px-3 font-semibold">Order</th>
                  <th className="py-2.5 px-3 font-semibold">Title</th>
                  <th className="py-2.5 px-3 font-semibold">Button Type</th>
                  <th className="py-2.5 px-3 font-semibold">Destination / Sub items</th>
                  <th className="py-2.5 px-3 font-semibold">Theme</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-200'}`}>
                {currentCards.map((c, idx) => {
                  const isFolder = c.targetType === 'folder';
                  const isHtml = c.targetType === 'html' || c.targetType === 'file' || Boolean(c.htmlContent);
                  return (
                    <tr
                      key={c.id}
                      className={`transition ${
                        isDark ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveCard(idx, 'up')}
                            className="p-1 rounded hover:bg-gray-600/30 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === currentCards.length - 1}
                            onClick={() => handleMoveCard(idx, 'down')}
                            className="p-1 rounded hover:bg-gray-600/30 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <span className="ml-1 text-gray-500 font-bold">#{idx + 1}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <div className="flex items-center gap-1.5">
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : isHtml ? (
                            <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span>{c.title}</span>
                          {c.badgeText && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded border ${
                                isDark
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {c.badgeText}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isFolder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <FolderTree className="w-3 h-3" /> Sub Folder
                          </span>
                        ) : isHtml ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {c.fileName ? (
                              <>
                                <Upload className="w-3 h-3" /> File
                              </>
                            ) : (
                              <>
                                <Code2 className="w-3 h-3" /> HTML Code
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Globe className="w-3 h-3" /> Web Link
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate font-mono text-[11px]">
                        {isFolder ? (
                          <button
                            onClick={() => handleCardClick(c)}
                            className="hover:underline flex items-center gap-1 text-amber-400 font-semibold"
                          >
                            <FolderOpen className="w-3 h-3 shrink-0" />
                            <span>Open folder ({c.children?.length || 0} sub-buttons)</span>
                          </button>
                        ) : isHtml ? (
                          <button
                            onClick={() => handleCardClick(c)}
                            className="hover:underline flex items-center gap-1 text-purple-400"
                          >
                            <FileCode className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {c.fileName ? `File: ${c.fileName}` : 'Embedded HTML Document'}
                            </span>
                          </button>
                        ) : (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:underline flex items-center gap-1 ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            <span className="truncate">{c.link}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-700/50 dark:bg-gray-700 text-gray-300 border border-gray-600">
                          {c.colorTheme || 'emerald'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isFolder && (
                            <button
                              onClick={() => handleCardClick(c)}
                              className={`p-1.5 rounded transition ${
                                isDark
                                  ? 'hover:bg-amber-500/20 text-amber-400 hover:text-amber-300'
                                  : 'hover:bg-amber-50 text-amber-700'
                              }`}
                              title="Enter Sub Folder"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className={`p-1.5 rounded transition ${
                              isDark
                                ? 'hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300'
                                : 'hover:bg-emerald-50 text-emerald-700'
                            }`}
                            title="Edit item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(c.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main View: Standard Card Grid (when not in explorer mode) */}
      {currentCards.length === 0 ? (
        <div
          className={`mt-10 p-12 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-4 ${
            isDark ? 'border-gray-800 bg-gray-900/40 text-gray-400' : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}
        >
          <FolderPlus className="w-12 h-12 text-emerald-500/60" />
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">This sub folder is currently empty</h3>
            <p className="text-xs mt-1 max-w-sm">
              Use Developer Mode to add buttons, upload HTML documents, web links, or create deeper nested sub folders.
            </p>
          </div>
          {isDeveloperMode ? (
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Button in this Folder</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="mt-2 px-4 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Login to Developer Panel to Add Content</span>
            </button>
          )}
        </div>
      ) : (
        <div id="archives-cards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {currentCards.map((card) => {
            const themeStyle =
              THEME_STYLES[card.colorTheme || 'emerald'] || THEME_STYLES.emerald;
            const styles = isDark ? themeStyle.dark : themeStyle.light;
            const isFolder = card.targetType === 'folder';
            const isHtml = card.targetType === 'html' || card.targetType === 'file' || Boolean(card.htmlContent);

            const renderIcon = () => {
              switch (card.iconName) {
                case 'Folder':
                  return <Folder className="w-7 h-7" />;
                case 'FolderTree':
                  return <FolderTree className="w-7 h-7" />;
                case 'GraduationCap':
                  return <GraduationCap className="w-7 h-7" />;
                case 'BookOpen':
                  return <BookOpen className="w-7 h-7" />;
                case 'Award':
                  return <Award className="w-7 h-7" />;
                case 'Briefcase':
                  return <Briefcase className="w-7 h-7" />;
                case 'FileText':
                  return <FileText className="w-7 h-7" />;
                case 'Sparkles':
                  return <Sparkles className="w-7 h-7" />;
                case 'Layers':
                  return <Layers className="w-7 h-7" />;
                case 'Compass':
                  return <Compass className="w-7 h-7" />;
                case 'Globe':
                  return <Globe className="w-7 h-7" />;
                default:
                  return isFolder ? <Folder className="w-7 h-7" /> : <Briefcase className="w-7 h-7" />;
              }
            };

            return (
              <div
                key={card.id}
                id={`archive-card-${card.id}`}
                className={`group relative rounded-2xl border p-6 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${
                  styles.bg
                } ${styles.border} ${styles.hoverBorder}`}
              >
                {/* Developer Inline Edit Trigger on the card */}
                {isDeveloperMode && (
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(card);
                      }}
                      className={`p-1.5 rounded-lg border backdrop-blur-md shadow transition ${
                        isDark
                          ? 'bg-gray-900/90 text-emerald-400 hover:bg-emerald-600 hover:text-white border-gray-700'
                          : 'bg-white/90 text-emerald-700 hover:bg-emerald-600 hover:text-white border-slate-300'
                      }`}
                      title="Edit this card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      className={`p-1.5 rounded-lg border backdrop-blur-md shadow transition ${
                        isDark
                          ? 'bg-gray-900/90 text-red-400 hover:bg-red-600 hover:text-white border-gray-700'
                          : 'bg-white/90 text-red-600 hover:bg-red-600 hover:text-white border-slate-300'
                      }`}
                      title="Delete this card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Card Header Content */}
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
                      styles.iconBg
                    } ${styles.iconColor} ${styles.border}`}
                  >
                    {renderIcon()}
                  </div>

                  <div className="flex-1 pr-14 sm:pr-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors ${
                          styles.titleColor
                        } ${styles.titleHover}`}
                      >
                        {card.title}
                      </h3>
                      {card.badgeText && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles.badgeBg} ${styles.badgeText}`}
                        >
                          {card.badgeText}
                        </span>
                      )}
                      {isFolder && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          Sub Folder ({card.children?.length || 0})
                        </span>
                      )}
                      {!isFolder && isHtml && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isDark
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {card.fileName ? 'HTML File' : 'HTML Document'}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                        isDark ? 'text-gray-300/90' : 'text-slate-600'
                      }`}
                    >
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Bottom / Action Button */}
                <div className="mt-6 pt-4 border-t border-gray-700/40 dark:border-gray-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {isFolder ? (
                      <>
                        <FolderTree className="w-3.5 h-3.5 text-amber-500" />
                        <span>Contains {card.children?.length || 0} sub-buttons</span>
                      </>
                    ) : isHtml ? (
                      <>
                        <FileCode className="w-3.5 h-3.5 text-purple-400" />
                        <span>{card.fileName ? card.fileName : 'Interactive HTML view'}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{card.openInNewTab ? 'Opens in new tab' : 'Opens in same tab'}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleCardClick(card)}
                    className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl border shadow-sm transition-all duration-200 flex items-center gap-2 ${
                      styles.buttonBg
                    } ${styles.buttonHover}`}
                  >
                    <span>{isFolder ? `Open ${card.title} Folder` : `Open ${card.title}`}</span>
                    {isFolder ? (
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    ) : isHtml ? (
                      <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Embedded HTML Interactive Full-Screen Modal Viewer */}
      {viewingHtmlCard && viewingHtmlCard.htmlContent && (
        <div
          id="html-modal-viewer"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full h-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 text-white">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {viewingHtmlCard.title}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {viewingHtmlCard.fileName || 'Embedded HTML Document Viewer'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([viewingHtmlCard.htmlContent || ''], {
                      type: 'text/html;charset=utf-8',
                    });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-1.5 transition"
                  title="Open in separate tab"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </button>
                <button
                  onClick={() => setViewingHtmlCard(null)}
                  className="p-1.5 rounded-lg bg-gray-700/60 hover:bg-red-600 text-gray-300 hover:text-white transition"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Iframe displaying the HTML content */}
            <div className="flex-1 bg-white relative">
              <iframe
                title={viewingHtmlCard.title}
                srcDoc={viewingHtmlCard.htmlContent}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Developer PIN Authentication Modal */}
      {showAuthModal && (
        <div
          id="developer-auth-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/60 dark:border-gray-800">
              <div
                className={`p-2.5 rounded-xl ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Admin Authentication</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Enter administrator password to access the control panel
                </p>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-5">
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}
                >
                  Admin Password
                </label>
                <input
                  id="admin-password-input"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter administrator password"
                  disabled={isAuthenticating}
                  className={`w-full rounded-xl px-4 py-2.5 focus:outline-none text-sm border transition ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  }`}
                  autoFocus
                />
                {authError && <p className="text-xs text-red-500 mt-1.5 font-medium">{authError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError('');
                    setPinInput('');
                  }}
                  disabled={isAuthenticating}
                  className={`px-4 py-2 text-xs font-medium rounded-lg ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="submit-auth-btn"
                  type="submit"
                  disabled={isAuthenticating || !pinInput.trim()}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-md transition disabled:opacity-50 ${
                    isDark
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isAuthenticating ? 'Verifying...' : 'Authenticate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Button Modal with Sub folder, URL, File, HTML Code */}
      {(editingCard || isAddMode) && (
        <div
          id="edit-card-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
        >
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl my-8 transition-all ${
              isDark
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-700/60 dark:border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isAddMode
                  ? `Add New Item to ${currentFolderCard?.title || 'Archives'}`
                  : `Edit "${editingCard?.title}" Card`}
              </h3>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setIsAddMode(false);
                }}
                className="p-1 rounded-lg hover:bg-gray-700/40 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 mt-4 text-xs">
              {/* Button Type Choice: Sub folder vs File / HTML / Web Link */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-emerald-600 dark:text-emerald-400">
                  Select Button Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTargetType('folder');
                      if (formIcon === 'Briefcase' || formIcon === 'BookOpen') setFormIcon('Folder');
                    }}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                      formTargetType === 'folder'
                        ? isDark
                          ? 'bg-amber-600 text-white border-amber-500 shadow'
                          : 'bg-amber-600 text-white border-amber-600 shadow'
                        : isDark
                        ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <FolderTree className="w-4 h-4" />
                    <span className="font-semibold text-xs">Sub Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('file')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                      formTargetType === 'file'
                        ? isDark
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : isDark
                        ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-semibold text-xs">Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('html')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                      formTargetType === 'html'
                        ? isDark
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : isDark
                        ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span className="font-semibold text-xs">Paste HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('url')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                      formTargetType === 'url'
                        ? isDark
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : isDark
                        ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-semibold text-xs">Web URL</span>
                  </button>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    {formTargetType === 'folder' ? 'Sub Folder Name *' : 'Card Title / Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={
                      formTargetType === 'folder'
                        ? 'e.g. 45th BCS, HSC 2026, Semester 1'
                        : 'e.g. BCS, SSC, Syllabus, Notes'
                    }
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    Badge Pill (Optional)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. New Folder, Important, Cadre"
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Subtitle / Description (becomes sub folder description) */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1">
                  {formTargetType === 'folder'
                    ? 'Sub Folder Description / Overview'
                    : 'Description / Subtitle'}
                </label>
                <textarea
                  rows={2}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder={
                    formTargetType === 'folder'
                      ? 'e.g. Complete collection of preliminary tests, written question bank, and viva guide.'
                      : 'e.g. Past Questions, Notes, and Examination Portal'
                  }
                  className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none resize-none ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Specific Input for each type */}
              {formTargetType === 'folder' && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    isDark
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <FolderTree className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs">Full Sub Folder Page</p>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      Clicking this button will open a dedicated page titled with this button's name and description. Inside that page, you can add more buttons, upload files, or create unlimited nested sub folders.
                    </p>
                  </div>
                </div>
              )}

              {formTargetType === 'url' && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    Destination URL / Web Link *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={formTargetType === 'url'}
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      placeholder="https://example.com or https://bpsc.gov.bd"
                      className={`w-full rounded-xl pl-3 pr-8 py-2 text-sm border focus:outline-none font-mono ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <ExternalLink className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}

              {formTargetType === 'html' && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Direct HTML Code *</span>
                    <span className="text-[10px] lowercase font-normal opacity-75">
                      Full &lt;html&gt; documents or custom widgets
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    required={formTargetType === 'html'}
                    value={formHtmlContent}
                    onChange={(e) => setFormHtmlContent(e.target.value)}
                    placeholder="<!DOCTYPE html><html><head><style>body { font-family: sans-serif; padding: 20px; }</style></head><body><h1>Welcome</h1><p>Your custom content here...</p></body></html>"
                    className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none font-mono leading-relaxed resize-y ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-emerald-300 focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              )}

              {formTargetType === 'file' && (
                <div className="space-y-2">
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    Select File from PC / Mobile (.pdf, .html, .docx, images, etc.) *
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isDark
                        ? 'border-gray-700 hover:border-emerald-500 bg-gray-800/50 hover:bg-gray-800'
                        : 'border-slate-300 hover:border-emerald-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold text-xs">
                        {formFileName ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Selected File: {formFileName}
                          </span>
                        ) : (
                          'Click to Browse & Upload Any File (.pdf, .html, .docx, images, etc.)'
                        )}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Supports PDF books, lecture slides, question papers, HTML documents, or images
                      </p>
                    </div>
                  </div>

                  {fileReadError && (
                    <p className="text-xs text-red-500 font-medium">{fileReadError}</p>
                  )}

                  {(formFileData || formHtmlContent) && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> File Loaded: {formFileName || 'Uploaded Document'}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="hover:underline text-gray-400"
                        >
                          Change File
                        </button>
                      </div>
                      <div
                        className={`w-full rounded-xl px-3 py-2 text-[11px] border font-mono truncate ${
                          isDark
                            ? 'bg-gray-800/80 border-gray-700 text-gray-300'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {formFileType || 'application/octet-stream'} • Ready to open or download
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Icon & Theme Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    Select Icon
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) =>
                      setFormIcon(e.target.value as ArchiveCardButton['iconName'])
                    }
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Folder">Folder (Sub-Folder)</option>
                    <option value="FolderTree">Folder Tree (Directory)</option>
                    <option value="Briefcase">Briefcase (Jobs / BCS)</option>
                    <option value="GraduationCap">Graduation Cap (Academic)</option>
                    <option value="BookOpen">Book Open (Study Notes)</option>
                    <option value="Award">Award (Certificates)</option>
                    <option value="FileText">File Text (Past Papers / HTML)</option>
                    <option value="Sparkles">Sparkles (Special)</option>
                    <option value="Layers">Layers (Multi-resource)</option>
                    <option value="Compass">Compass (Guidance)</option>
                    <option value="Globe">Globe (International / Web)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">
                    Color Accent Theme
                  </label>
                  <select
                    value={formTheme}
                    onChange={(e) =>
                      setFormTheme(e.target.value as ArchiveCardButton['colorTheme'])
                    }
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="emerald">Emerald Green (Official / Govt)</option>
                    <option value="amber">Amber Gold (Sub-folders / Special)</option>
                    <option value="blue">Royal Blue (Education Board)</option>
                    <option value="indigo">Indigo (University)</option>
                    <option value="purple">Purple (Advanced / Research)</option>
                    <option value="rose">Rose Red (Important Notices)</option>
                  </select>
                </div>
              </div>

              {/* Open In New Tab Checkbox (Only for URL/HTML/File) */}
              {formTargetType !== 'folder' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="form-open-in-new-tab"
                    checked={formOpenInNewTab}
                    onChange={(e) => setFormOpenInNewTab(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label
                    htmlFor="form-open-in-new-tab"
                    className={`text-xs cursor-pointer select-none ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Open in a new browser tab / window
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-700/50 dark:border-gray-800">
                <div>
                  {!isAddMode && editingCard && (
                    <button
                      type="button"
                      onClick={() => {
                        const idToDelete = editingCard.id;
                        setEditingCard(null);
                        handleDeleteCard(idToDelete);
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-600 dark:bg-red-950/60 dark:hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCard(null);
                      setIsAddMode(false);
                    }}
                    className={`px-4 py-2 font-medium rounded-lg ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !formTitle.trim() ||
                      (formTargetType === 'html' && !formHtmlContent.trim()) ||
                      (formTargetType === 'file' && !formFileData.trim() && !formHtmlContent.trim()) ||
                      (formTargetType === 'url' && !formLink.trim())
                    }
                    className={`px-5 py-2 text-white font-semibold rounded-lg shadow-md transition flex items-center gap-1.5 disabled:opacity-50 ${
                      formTargetType === 'folder'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : isDark
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isAddMode
                        ? formTargetType === 'folder'
                          ? 'Create Sub Folder'
                          : 'Create Button Card'
                        : 'Save Changes'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
