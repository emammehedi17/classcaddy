export interface StudyWeekPlan {
  week: number;
  title: string;
  course: string;
  focusTopics: string[];
  recommendedHours: number;
  completed: boolean;
}

export const STUDY_SCHEDULE: StudyWeekPlan[] = [
  {
    week: 1,
    course: 'Course 405',
    title: 'Modern Poetry II: Nahdah & Neo-Classical Foundations',
    focusTopics: [
      'Al-Baroudi and Ahmad Shawqi selected odes',
      'Word-by-word vocabulary memorization (30 terms)',
      'Prosodic meter (Bahr) analysis and rhyme schemes'
    ],
    recommendedHours: 10,
    completed: true
  },
  {
    week: 2,
    course: 'Course 406',
    title: 'Terminology through Translation: Diplomatic & Legal Texts',
    focusTopics: [
      'International treaties and bilateral agreements (Arabic <-> English)',
      'Human rights charters translation analysis',
      'Translating complex diplomatic honorifics and protocols'
    ],
    recommendedHours: 12,
    completed: true
  },
  {
    week: 3,
    course: 'Course 407',
    title: 'Arabic Literary Criticism: Ibn Sallam & Al-Jurjani',
    focusTopics: [
      'Tabaqat Fuhul al-Shu‘ara structural breakdown',
      'Nazariyyat an-Nazm (Theory of Construction) comparative review',
      'Classical terminology: Lafz vs. Ma‘na debates'
    ],
    recommendedHours: 10,
    completed: false
  },
  {
    week: 4,
    course: 'Course 408 (B)',
    title: 'Social Research and Project: Manuscript & Thesis Prep',
    focusTopics: [
      'Formulating research title, problem statement and hypotheses',
      'Primary Arabic manuscript authentication methodology',
      'Chicago Manual of Style citation practice for Arabic sources'
    ],
    recommendedHours: 14,
    completed: false
  },
  {
    week: 5,
    course: 'All Courses',
    title: 'Previous Questions & Mock Test Solving (2017–2023)',
    focusTopics: [
      'Comprehensive 2017-2021 board question walkthrough',
      '2021-2023 question patterns and high-frequency topics',
      'Timed mock exam writing session with feedback'
    ],
    recommendedHours: 16,
    completed: false
  }
];

export const DAILY_ROUTINE = [
  { time: '06:00 AM - 07:30 AM', task: 'Poetry Recitation & Vocabulary Memorization', subject: 'Course 405' },
  { time: '10:00 AM - 12:30 PM', task: 'Applied Trilingual Translation Practice', subject: 'Course 406' },
  { time: '03:00 PM - 05:00 PM', task: 'Critical Theory Reading & Summary Notes', subject: 'Course 407' },
  { time: '08:00 PM - 10:00 PM', task: 'Research Methodology & Project Drafting', subject: 'Course 408 (B)' },
  { time: '10:00 PM - 10:45 PM', task: 'Past Paper Analysis & Flashcard Review', subject: 'Revision' }
];
