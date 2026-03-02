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
  eidPrayer?: boolean;
  quranPages: number;
  date: string;
}

// ─────────────────────────────────────────────
// НОВАЯ СИСТЕМА МАҚСАТТАР (GoalV2)
// ─────────────────────────────────────────────

/** 6 категорий целей */
export type GoalCategoryId =
  | 'namaz'
  | 'quran'
  | 'sadaqa'
  | 'dhikr'
  | 'ilm'
  | 'akhlaq';

/**
 * Одна запись о выполненной цели за конкретный день.
 * Ключ в dailyGoalRecords: ISO-дата "YYYY-MM-DD"
 */
export interface DailyGoalRecord {
  categoryId: GoalCategoryId;
  /** "template-0" … "template-9" или "custom-<timestamp>" */
  goalId: string;
  /** Текст цели на момент выполнения (нужен чтобы не потерять при удалении) */
  goalText: string;
  completed: boolean;
  xpEarned: number;
  /** Время отметки (ISO-строка) */
  completedAt?: string;
}

/**
 * Пользовательская (кастомная) цель внутри категории.
 * Хранится в goalCustomItems[categoryId][]
 */
export interface CustomGoalItem {
  id: string;       // "custom-<timestamp>"
  text: string;
  xp: number;       // По умолчанию 30 XP
  categoryId: GoalCategoryId;
}

// ─────────────────────────────────────────────

export interface UserData {
  userId?: number;
  name: string;
  username?: string; // Telegram username (e.g. @user)
  photoUrl?: string; // Telegram profile picture URL
  startDate: string; // Target start date (e.g. Ramadan start)
  registrationDate?: string; // Actual date user joined app
  progress: Record<number, DayProgress>;
  preparationProgress: Record<number, DayProgress>;
  basicProgress: Record<string, Partial<DayProgress>>;
  memorizedNames: number[]; 
  completedJuzs: number[];
  earnedJuzXpIds: number[]; 
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
  dailyReferrals?: Record<string, number>; // Количество рефералов по датам для бонусных множителей
  invitedCount?: number;      // Общее количество приглашенных друзей
  referredBy?: string;        // Промокод реферала (кто пригласил)
  usedPromoCode?: string;     // Использованный промокод при регистрации
  hasDiscount?: boolean;      // Есть ли скидка
  paymentStatus?: string;     // Статус оплаты (paid, unpaid, demo и т.д.)
  accessType?: string;        // Тип доступа (demo, paid и т.д.)
  _lastUpdate?: number;
  subscriptionExpiresAt?: string | null;
  daysLeft?: number | null;
  tasbeehRecords?: Record<string, {
    counts: Record<string, number>;     // dhikrId -> count
    completedIds: string[];             // какие зикры закрыты по target
    xpEarned: number;                   // XP набранный только за тасбих за день
  }>;
  dailyGoalRecords?: Record<string, DailyGoalRecord[]>;
  goalCustomItems?: Record<GoalCategoryId, CustomGoalItem[]>;
  goalStreaks?: Record<GoalCategoryId, {
    current: number;
    longest: number;
    lastCompletedDate: string;
  }>;
}

export type ViewType = 'dashboard' | 'calendar' | 'quran' | 'tasbeeh' | 'tasks' | 'profile' | 'names-99' | 'rewards' | 'circles';
export type PhaseType = 'preparation' | 'ramadan' | 'basic';
