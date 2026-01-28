
export type Language = 'ru' | 'kk';

export interface CustomTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayProgress {
  day: number;
  fasting: boolean;
  tahajjud: boolean;
  fajr: boolean;
  morningDhikr: boolean;
  quranRead: boolean;
  names99: boolean;
  salawat: boolean;
  hadith: boolean;
  duha: boolean;
  charity: boolean;
  charityAmount: number;
  dhuhr: boolean;
  lessons: boolean;
  asr: boolean;
  book: boolean;
  eveningDhikr: boolean;
  maghrib: boolean;
  isha: boolean;
  taraweeh: boolean;
  witr: boolean;
  quranPages: number;
  date: string;
}

export interface UserData {
  name: string;
  startDate: string;
  progress: Record<number, DayProgress>;
  memorizedNames: number[]; 
  completedJuzs: number[];
  completedTasks: number[]; // IDs of predefined tasks
  deletedPredefinedTasks: number[]; // IDs of predefined tasks user chose to delete/hide
  customTasks: CustomTask[]; // User added tasks
  quranGoal: number;
  language: Language;
}

export type ViewType = 'dashboard' | 'calendar' | 'quran' | 'ai-insights' | 'tasks' | 'useful-materials' | 'names-99';
