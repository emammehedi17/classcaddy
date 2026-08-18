export type ThemeMode = 'light' | 'dark';

export type PageView =
  | 'home'
  | 'archives'
  | 'academic'
  | 'course-405'
  | 'course-406'
  | 'course-407'
  | 'course-408'
  | 'study-plan'
  | 'about'
  | 'contact';

export interface ArchiveCardButton {
  id: string;
  title: string;
  subtitle: string;
  link?: string;
  targetType?: 'url' | 'html' | 'file' | 'folder';
  htmlContent?: string;
  fileName?: string;
  children?: ArchiveCardButton[];
  openInNewTab?: boolean;
  iconName?: 'GraduationCap' | 'BookOpen' | 'Award' | 'Briefcase' | 'FileText' | 'Sparkles' | 'Layers' | 'Compass' | 'Folder' | 'FolderTree' | 'Globe';
  colorTheme?: 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber' | 'rose';
  badgeText?: string;
  createdAt?: number;
}

export interface PoemLine {
  id: string;
  start: number;
  end: number;
  arabic: string;
  bangla: string;
  english?: string;
}

export interface VocabularyWord {
  arabic: string;
  transliteration: string;
  bangla: string;
  english: string;
  rootWord?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  code: string;
  semester: string;
  instructor?: string;
  description: string;
  topics: string[];
  vocabulary?: VocabularyWord[];
  poemLines?: PoemLine[];
  audioUrl?: string;
  downloadUrl?: string;
  previousQuestionsYear?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  isLoggedIn: boolean;
}
