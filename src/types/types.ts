
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
  charityAmount: number; // Legacy/Total
  charitySadaqah: number;
  charityZakat: number;
  charityFitrana: number;
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
  userId?: number;
  name: string;
  username?: string; // Telegram username (e.g. @user)
  photoUrl?: string; // Telegram profile picture URL
  startDate: string; // Target start date (e.g. Ramadan start)
  registrationDate?: string; // Actual date user joined app
  progress: Record<number, DayProgress>;
  memorizedNames: number[]; 
  completedJuzs: number[];
  quranKhatams: number; // Number of times Quran was completed
  completedTasks: number[]; 
  deletedPredefinedTasks: number[]; 
  customTasks: CustomTask[]; 
  quranGoal: number; // Total Juz goal
  dailyQuranGoal: number; // Daily pages goal
  dailyCharityGoal: number; // Daily charity goal
  language: Language;
  xp: number;
  referralCount: number;
  myPromoCode?: string; // The user's unique generated code
  hasRedeemedReferral: boolean; // Has the user entered a friend's code?
  unlockedBadges: string[];
  currentStreak: number;      // Текущая серия дней подряд
  longestStreak: number;      // Лучшая серия за всё время
  lastActiveDate: string;     // Дата последней активности (для отслеживания перерывов в серии)
}

export type ViewType = 'dashboard' | 'calendar' | 'quran' | 'tasks' | 'profile' | 'names-99' | 'rewards';
