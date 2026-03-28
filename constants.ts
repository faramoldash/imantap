import { DayProgress, Language, GoalCategoryId, DhikrType } from './src/types/types';

export const TOTAL_DAYS = 29; // 29 дней Рамадана

// подготовка начинается с 9 февраля (10 дней)
export const PREPARATION_START_DATE = '2026-02-09'; // 9 февраля
export const PREPARATION_DAYS = 10; // 9-18 февраля (10 дней)
export const FIRST_TARAWEEH_DATE = '2026-02-18'; // 18 февраля - первый день таравих намаза
export const EID_AL_FITR_DATE = '2026-03-20'; // 20 марта - Ораза айт
export const POST_RAMADAN_START_DAY = PREPARATION_DAYS + TOTAL_DAYS + 1;

// Ramadan 2026 start date
export const RAMADAN_START_DATE = '2026-02-19';

// Ключи трекера для дней подготовки (без оразы и специфичных для Рамадана)
export const PREPARATION_TRACKER_KEYS: (keyof DayProgress)[] = [
  'fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha',
  'quranRead', 'morningDhikr', 'eveningDhikr', 'salawat', 'hadith', 'charity'
];

export const INITIAL_DAY_PROGRESS = (day: number): DayProgress => ({
  day,
  fasting: false,
  tahajjud: false,
  fajr: false,
  morningDhikr: false,
  quranRead: false,
  names99: false,
  salawat: false,
  hadith: false,
  duha: false,
  charity: false,
  charityAmount: 0,
  charitySadaqah: 0,
  charityZakat: 0,
  charityFitrana: 0,
  dhuhr: false,
  lessons: false,
  asr: false,
  book: false,
  eveningDhikr: false,
  maghrib: false,
  isha: false,
  taraweeh: false,
  witr: false,
  eidPrayer: false,
  quranPages: 0,
  date: new Date().toISOString(),
});

export const PRAYER_ICONS: Record<string, string> = {
  fajr:    '🌄',
  duha:    '🌤️',
  dhuhr:   '☀️',
  asr:     '🌥️',
  maghrib: '🌇',
  isha:    '🌙',
  sunrise: '🌅',
};

export const TRACKER_KEYS = [
  'fasting', 'tahajjud', 'fajr', 'morningDhikr', 'quranRead', 'names99', 'salawat', 
  'hadith', 'duha', 'charity', 'dhuhr', 'lessons', 'asr', 'book', 
  'eveningDhikr', 'maghrib', 'isha', 'taraweeh', 'witr'
] as const;

export const XP_VALUES: Record<string, number> = {
  fasting: 100,
  fajr: 50,
  dhuhr: 50,
  asr: 50,
  maghrib: 50,
  isha: 50,
  taraweeh: 60,
  tahajjud: 80,
  witr: 40,
  duha: 40,
  quranRead: 70,
  morningDhikr: 30,
  eveningDhikr: 30,
  salawat: 20,
  charity: 50,
  names99: 40,
  hadith: 30,
  lessons: 30,
  book: 30,
  juz: 150,
  name: 15,
  referral: 100, // Updated to 100 XP per invited friend
  khatam: 1000, // Bonus for finishing Quran
};

// ✅ НОВАЯ СИСТЕМА УРОВНЕЙ
export const LEVEL_SYSTEM = [
  { level: 1, name_kk: 'Бастаушы', name_ru: 'Начинающий', icon: '🌱', minXP: 0, maxXP: 999 },
  { level: 2, name_kk: 'Үйренуші', name_ru: 'Ученик', icon: '🌿', minXP: 1000, maxXP: 2499 },
  { level: 3, name_kk: 'Белсенді', name_ru: 'Активный', icon: '🍃', minXP: 2500, maxXP: 4999 },
  { level: 4, name_kk: 'Тұрақты', name_ru: 'Постоянный', icon: '⭐', minXP: 5000, maxXP: 7999 },
  { level: 5, name_kk: 'Күшті', name_ru: 'Сильный', icon: '💪', minXP: 8000, maxXP: 11499 },
  { level: 6, name_kk: 'Табанды', name_ru: 'Упорный', icon: '🔥', minXP: 11500, maxXP: 15499 },
  { level: 7, name_kk: 'Шебер', name_ru: 'Мастер', icon: '💎', minXP: 15500, maxXP: 19999 },
  { level: 8, name_kk: 'Чемпион', name_ru: 'Чемпион', icon: '👑', minXP: 20000, maxXP: 24999 },
  { level: 9, name_kk: 'Аса жоғары', name_ru: 'Превосходный', icon: '🌟', minXP: 25000, maxXP: 49999 },
  { level: 10, name_kk: 'Нұрлы жан', name_ru: 'Светлая душа', icon: '🕌', minXP: 50000, maxXP: Infinity }
];

export function getUserLevel(xp: number) {
  return LEVEL_SYSTEM.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVEL_SYSTEM[0];
}

export function getNextLevel(currentLevel: number) {
  return LEVEL_SYSTEM[currentLevel] || null;
}

export const DEFAULT_GOALS: Record<Language, string[]> = {
  kk: [
    "Құранды бастан-аяқ толық оқып шығу",
    "10 жаңа сүре жаттау",
    "Күн сайын садақа беру",
    "30 күн тарауық намазына қатысу",
    "Жаман әдеттерден (өсек, ашу) арылу",
    "10 ораза ұстаушыны тамақтандыру",
    "Алланың 99 есімін мағынасымен жаттау",
    "Пайғамбарымыздың ﷺ өмірбаянын оқу",
    "Түнгі таһажуд дұғаларын қалдырмау",
    "Күнделікті таңғы және кешкі зікірлерді айту"
  ],
  ru: [
    "Прочитать весь Коран полностью",
    "Выучить 10 новых сур",
    "Давать садака каждый день",
    "Посетить все 30 дней таравих намаза",
    "Отказаться от вредных привычек (сплетни, гнев)",
    "Накормить 10 постящихся",
    "Выучить 99 имен Аллаха с их смыслами",
    "Прочитать сиру (биографию) Пророка Мухаммада ﷺ",
    "Не пропускать ночные тахаджуд дуа",
    "Совершать ежедневные утренние и вечерние зикры"
  ]
};

export const TRANSLATIONS: Record<Language, any> = {
  ru: {
    appTitle: "РАМАЗАН 2026",
    preRamadanTitle: "Келе жатқан Рамазан айы мүбәрәк болсын!",
    ramadanStartedTitle: "Рамазан айы мүбәрәк болсын!",
    daysLeftHint: "Рамазанға дейін {days} күн қалды",
    dayLabel: "День",
    todayLabel: "Сегодня",
    progressLabel: "ПРОГРЕСС",
    fastingTitle: "Ораза",
    fastingSub: "Держите ли вы пост сегодня?",
    praiseText: "Во имя Аллаха Милостивого, Милосердного!",
    charityTotalLabel: "Всего за месяц",
    charityPlaceholder: "Сумма в ₸",
    charitySadaqah: "Садака",
    charityZakat: "Закят",
    charityFitrana: "Фитр",
    shareBtn: "Поделиться",
    items: {
      tahajjud: "Тахаджуд намаз",
      fajr: "Фаджр (Таң) намаз",
      morningDhikr: "Утренние зикры",
      quranRead: "Чтение Корана",
      names99: "99 имен Аллаха",
      salawat: "Салауат",
      hadith: "Хадис дня",
      duha: "Духа намаз",
      charity: "Садака",
      dhuhr: "Зухр (Бесін) намаз",
      lessons: "Уроки и знания",
      asr: "Аср (Екінті) намаз",
      book: "Чтение книги",
      eveningDhikr: "Вечерние зикры",
      maghrib: "Магриб (Шам) намаз",
      isha: "Иша (Құптан) намаз",
      taraweeh: "Таравих намаз",
      witr: "Витр намаз",
      eidPrayer: "Айт намаз"
    },
    navHome: "Главная",
    navDays: "Дни",
    navQuran: "Коран",
    navTasks: "Цели",
    navTasbeeh: "Тасбих",
    navUseful: "Инфо",
    navProfile: "Профиль",
    navRewards: "Рейтинг",
    rewardsTitle: "Духовные уровни",
    rewardsBadges: "Ваши достижения",
    rewardsLeaderboard: "Топ праведников",
    rewardsXP: "Духовный опыт",
    rewardsLevelName: "Ваш статус",
    usefulTitle: "Полезное",
    namesTitle: "99 Имен Аллаха",
    calendarTitle: "Күнтізбе",
    tasksTitle: "Мои цели",
    duaSuhoorTitle: "Сәресі дұғасы",
    duaIftarTitle: "Ауыз ашар дұғасы",
    fastingDuasHeader: "Ораза дұғалары",
    namesDailyTitle: "Алланың есімдері",
    namesDailyHint: "Изучите эти имена сегодня",
    dhikrPageTitle: "Зікірлер",
    dhikrMorningTitle: "Утренние",
    dhikrEveningTitle: "Вечерние",
    backToList: "Назад",
    nextArticle: "Далее",
    tasksPredefined: "Шаблонные цели",
    tasksCustom: "Мои цели",
    tasksAddPlaceholder: "Добавить новую цель...",
    tasksAddBtn: "Добавить",
    namesMemorized: "выучено",
    namesStatusToLearn: "Учить",
    namesStatusLearned: "Выучено",
    namesUnmark: "Сбросить",
    namesButton: "Выучил",
    namesNext: "Следующее имя",
    quranProgress: "Прогресс чтения",
    quranReadLabel: "Прочитано",
    quranLeft: "Осталось",
    quranScheduleTitle: "План на 30 дней",
    quranJuzCol: "Пара",
    quranStartCol: "Начало",
    quranEndCol: "Соңы",
    quranIntro: "Чтение Корана очищает сердце...",
    quranHadith: "Читайте Коран, ибо, поистине, в День воскрешения он явится в качестве заступника за тех, кто его читал.",
    quranHadithSource: "Сахих Муслим",
    insightDaily: "Совет дня",
    duaTitle: "Дұға генераторы",
    duaSub: "Опишите состояние",
    duaPlaceholder: "Напр: тревога",
    duaGenerating: "Создаем...",
    duaBtn: "Получить Дуа",
    goalsTitle: "Ежедневные лимиты",
    goalsQuran: "Страниц Корана в день",
    goalsCharity: "Садака в день (₸)",
    goalsProgress: "Прогресс за день",
    quranPagesPlaceholder: "Стр.",
    referralTitle: "Садака джария",
    referralDesc: "Пригласи друзей и получай награду за их благие дела.",
    referralBtn: "Пригласить друга",
    referralBtnShare: "Поделиться кодом",
    referralReward: "+100 XP за друга",
    referralCountLabel: "Приглашено",
    referralFriend: "друзей",
    promoInputTitle: "Ввести промокод",
    promoInputDesc: "Введите код друга, чтобы получить бонус.",
    promoInputPlaceholder: "Код друга",
    promoBtnRedeem: "Активировать",
    promoErrorSelf: "Нельзя ввести свой код",
    promoErrorNotFound: "Код не найден",
    promoBtnChecking: "Проверка...",
    promoSuccess: "Код активирован! +100 XP",
    promoActivated: "Вы уже активировали промокод",
    yourCodeLabel: "Ваш промокод:",
    viewAllNames: "Все 99 имен",
    profileTitle: "Личный кабинет",
    statsTitle: "Моя статистика",
    statsFasts: "Дней поста",
    statsQuran: "Стр. Корана",
    statsPrayers: "Намазов",
    statsCharity: "Садака (₸)",
    joinDate: "Вместе с нами с",
    quranKhatamCompleted: "Хатым завершен!",
    quranStartOver: "Начать заново",
    quranKhatamCount: "Количество Хатымов",
    // --- Мақсаттар v2 ---
    goalsSectionTitle: "Күнделікті мақсаттар",
    goalsChooseTask: "Бүгінгі мақсат таңдаңыз",
    goalsCompletedToday: "Бүгін орындалды",
    goalsAddCustom: "Өзіңіздің мақсатыңызды қосыңыз",
    goalsCustomPlaceholder: "Мақсат жазыңыз...",
    goalsAddBtn: "Қосу",
    goalsDoneBtn: "Орындадым ✓",
    goalsLockedMsg: "Ертең жаңа мақсат таңдауға болады",
    goalsSelectBtn: "Таңдау",
    goalsMyGoals: "Менің мақсаттарым",
    goalsTemplates: "Шаблондар",
    goalsXpReward: "XP сыйақы",
    goalsCategoryStreak: "Күн қатарлы",
  },
  kk: {
    appTitle: "РАМАЗАН 2026",
    preRamadanTitle: "Келе жатқан Рамазан айы мүбәрәк болсын!",
    ramadanStartedTitle: "Рамазан айы мүбәрәк болсын!",
    daysLeftHint: "Рамазанға дейін {days} күн қалды",
    dayLabel: "Күн",
    todayLabel: "Бүгін",
    progressLabel: "ПРОГРЕСС",
    fastingTitle: "Ораза",
    fastingSub: "Бүгін ораза ұстап жүрсіз бе?",
    praiseText: "Мейірімді, рахымды Алланың атымен бастаймын!",
    charityTotalLabel: "Айлық жалпы сома",
    charityPlaceholder: "Сомасы ₸",
    charitySadaqah: "Садақа",
    charityZakat: "Зекет",
    charityFitrana: "Пітір",
    shareBtn: "Бөлісу",
    items: {
      tahajjud: "Таһажуд намазы",
      fajr: "Таң намазы",
      morningDhikr: "Таңғы зікірлер",
      quranRead: "Құран оқу",
      names99: "Алланың 99 көркем есімі",
      salawat: "Салауат",
      hadith: "Бүгінгі хадис",
      duha: "Дұха намазы",
      charity: "Садақа",
      dhuhr: "Бесін намазы",
      lessons: "Дәрістер мен уағыздар",
      asr: "Екінті намазы",
      book: "Кітап оқу",
      eveningDhikr: "Кешкі зікірлер",
      maghrib: "Шам намазы",
      isha: "Құптан намазы",
      taraweeh: "Тарауық намазы",
      witr: "Үтір намазы",
      eidPrayer: "Айт намазы"
    },
    navHome: "Басты",
    navDays: "Күндер",
    navQuran: "Құран",
    navTasks: "Мақсаттар",
    navTasbeeh: "Зікірлер",
    navUseful: "Мәлімет",
    navProfile: "Кабинет",
    navRewards: "Рейтинг",
    rewardsTitle: "Рухани деңгейлер",
    rewardsBadges: "Жетістіктеріңіз",
    rewardsLeaderboard: "Жақсылық жаршылары",
    rewardsXP: "Рухани тәжірибе",
    rewardsLevelName: "Дәрежеңіз",
    usefulTitle: "Мәлімет",
    namesTitle: "Алланың 99 есімі",
    calendarTitle: "Күнтізбе",
    tasksTitle: "Менің мақсаттарым",
    duaSuhoorTitle: "Сәресі дұғасы",
    duaIftarTitle: "Ифтар дұғасы",
    fastingDuasHeader: "Ораза дұғалары",
    namesDailyTitle: "Алланың есімдері",
    namesDailyHint: "Бүгін осы есімдерді жаттаңыз",
    dhikrPageTitle: "Зікірлер",
    dhikrMorningTitle: "Таңғы зікірлер",
    dhikrEveningTitle: "Кешкі зікірлер",
    backToList: "Тізімге қайту",
    nextArticle: "Келесі мәлімет",
    tasksPredefined: "Шаблондық мақсаттар",
    tasksCustom: "Менің мақсаттарым",
    tasksAddPlaceholder: "Жаңа мақсат қосу...",
    tasksAddBtn: "Қосу",
    namesMemorized: "жаттаған",
    namesStatusToLearn: "Жаттау",
    namesStatusLearned: "Жатталған",
    namesUnmark: "Болдырмау",
    namesButton: "Жаттадым",
    namesNext: "Келесі есім",
    quranProgress: "Оқу прогресі",
    quranReadLabel: "Оқылды",
    quranLeft: "Қалды",
    quranScheduleTitle: "30 күндік жоспар",
    quranJuzCol: "Пара",
    quranStartCol: "Басы",
    quranEndCol: "Соңы",
    quranIntro: "Құран оқу - жүректің нұры...",
    quranHadith: "Құран оқыңыздар, өйткені Қиямет күні ол өзін оқығандарға шапағатшы болып келеді.",
    quranHadithSource: "Сахих Муслим",
    insightDaily: "Күн ғибраты",
    duaTitle: "Дұға генераторы",
    duaSub: "Көңіл-күйіңізді жазыңыз",
    duaPlaceholder: "Мыс: мазасыздық",
    duaGenerating: "Жасалуда...",
    duaBtn: "Дұға алу",
    goalsTitle: "Күндік лимиттер",
    goalsQuran: "Күніне Құран беті",
    goalsCharity: "Күніне садақа (₸)",
    goalsProgress: "Күндік мақсат прогресі",
    quranPagesPlaceholder: "Бет",
    referralTitle: "Садақа жария",
    referralDesc: "Достарыңды шақырып, олардың игі істеріне себепкер бол.",
    referralBtn: "Дос шақыру",
    referralBtnShare: "Кодты бөлісу",
    referralReward: "Әр досқа +100 XP",
    referralCountLabel: "Шақырылды",
    referralFriend: "дос",
    promoInputTitle: "Ввести промокод",
    promoInputDesc: "Введите код друга, чтобы получить бонус.",
    promoInputPlaceholder: "Код друга",
    promoBtnRedeem: "Активация",
    promoErrorSelf: "Өз кодыңызды енгізуге болмайды",
    promoErrorNotFound: "Код табылмады",
    promoBtnChecking: "Тексеру...",
    promoSuccess: "Код қабылданды! +100 XP",
    promoActivated: "Сіз промокод қолданып қойдыңыз",
    yourCodeLabel: "Сіздің промокод:",
    viewAllNames: "99 есімі",
    profileTitle: "Жеке кабинет",
    statsTitle: "Менің статистикам",
    statsFasts: "Ораза күні",
    statsQuran: "Құран беті",
    statsPrayers: "Намаз саны",
    statsCharity: "Садақа (₸)",
    joinDate: "Бізге қосылған күні",
    quranKhatamCompleted: "Құран хатым аяқталды!",
    quranStartOver: "Жаңадан бастау",
    quranKhatamCount: "Хатым саны",
    // --- Мақсаттар v2 ---
    goalsSectionTitle: "Күнделікті мақсаттар",
    goalsChooseTask: "Бүгінгі мақсат таңдаңыз",
    goalsCompletedToday: "Бүгін орындалды",
    goalsAddCustom: "Өзіңіздің мақсатыңызды қосыңыз",
    goalsCustomPlaceholder: "Мақсат жазыңыз...",
    goalsAddBtn: "Қосу",
    goalsDoneBtn: "Орындадым ✓",
    goalsLockedMsg: "Ертең жаңа мақсат таңдауға болады",
    goalsSelectBtn: "Таңдау",
    goalsMyGoals: "Менің мақсаттарым",
    goalsTemplates: "Шаблондар",
    goalsXpReward: "XP сыйақы",
    goalsCategoryStreak: "Күн қатарлы",
  }
};

export const DHIKRS: DhikrType[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translit_kk: 'Субхааналлааһ',
    translit_ru: 'Субханаллах',
    name_kk: 'Субханаллаһ',
    name_ru: 'Субханаллах',
    meaning_kk: 'Алла барлық кемшіліктерден пәк',
    meaning_ru: 'Аллах пречист от всех недостатков',
    target: 33,
    xp: 33,
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translit_kk: 'Әл-хәмду лилләәһ',
    translit_ru: 'Альхамдулиллях',
    name_kk: 'Әлхәмдулилләһ',
    name_ru: 'Альхамдулилла',
    meaning_kk: 'Барлық мақтау Аллаға тиесілі',
    meaning_ru: 'Вся хвала принадлежит Аллаху',
    target: 33,
    xp: 33,
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translit_kk: 'Аллааһу әкбар',
    translit_ru: 'Аллаху Акбар',
    name_kk: 'Аллаһу әкбар',
    name_ru: 'Аллаху Акбар',
    meaning_kk: 'Алла ең ұлы',
    meaning_ru: 'Аллах превелик',
    target: 33,
    xp: 33,
  },
  {
    id: 'lailaha',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    translit_kk: 'Ләә иләәһә иллаллааһ',
    translit_ru: 'Ля иляха иллалла',
    name_kk: 'Лә иләһә илләллаһ',
    name_ru: 'Ля иляха иллалла',
    meaning_kk: 'Алладан басқа құдай жоқ',
    meaning_ru: 'Нет божества, кроме Аллаха',
    target: 100,
    xp: 100,
  },
  {
    id: 'salavat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    translit_kk: 'Аллааһуммә солли `аләә Мухаммадин уә `аләә әәли Мухаммад',
    translit_ru: 'Аллахумма солли `аләа Мухаммадин уә `аләа әали Мухаммад',
    name_kk: 'Салауат',
    name_ru: 'Салауат',
    meaning_kk: 'Аллаһым, Мұхаммедке және Оның отбасына салауат ете гөр',
    meaning_ru: 'О Аллах, благослови Мухаммада и его семью',
    target: 100,
    xp: 100,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    translit_kk: 'Әстәғфируллааһ',
    translit_ru: 'Астагфирулла',
    name_kk: 'Әстәғфируллаһ',
    name_ru: 'Астагфирулла',
    meaning_kk: 'Алладан кешірім сұраймын',
    meaning_ru: 'Прошу прощения у Аллаха',
    target: 100,
    xp: 100,
  },
];

export const QURAN_SCHEDULE = [
  { id: 1, juz: "1", start: "Фатиха 1", end: "Бақара 141" },
  { id: 2, juz: "2", start: "Бақара 142", end: "Бақара 252" },
  { id: 3, juz: "3", start: "Бақара 253", end: "Әли Имран 92" },
  { id: 4, juz: "4", start: "Әли Имран 93", end: "Ниса 23" },
  { id: 5, juz: "5", start: "Ниса 24", end: "Ниса 147" },
  { id: 6, juz: "6", start: "Ниса 148", end: "Мәида 81" },
  { id: 7, juz: "7", start: "Мәида 82", end: "Әнғам 110" },
  { id: 8, juz: "8", start: "Әнғам 111", end: "Әғраф 87" },
  { id: 9, juz: "9", start: "Әғраф 88", end: "Әнфал 40" },
  { id: 10, juz: "10", start: "Әнфал 41", end: "Тәубе 92" },
  { id: 11, juz: "11", start: "Тәубе 93", end: "Һуд 5" },
  { id: 12, juz: "12", start: "Һуд 6", end: "Юсуф 52" },
  { id: 13, juz: "13", start: "Юсуф 53", end: "Ибраһим 52" },
  { id: 14, juz: "14", start: "Хижр 1", end: "Нахл 128" },
  { id: 15, juz: "15", start: "Исра 1", end: "Кәһф 74" },
  { id: 16, juz: "16", start: "Кәһф 75", end: "Таһа 135" },
  { id: 17, juz: "17", start: "Әнбия 1", end: "Хаж 78" },
  { id: 18, juz: "18", start: "Муминун 1", end: "Фурқан 20" },
  { id: 19, juz: "19", start: "Фурқан 21", end: "Нәмл 55" },
  { id: 20, juz: "20", start: "Нәмл 56", end: "Анкәбіт 45" },
  { id: 21, juz: "21", start: "Анкәбіт 46", end: "Ахзаб 30" },
  { id: 22, juz: "22", start: "Ахзаб 31", end: "Ясин 27" },
  { id: 23, juz: "23", start: "Ясин 28", end: "Зүмәр 31" },
  { id: 24, juz: "24", start: "Зүмәр 32", end: "Фуссиләт 46" },
  { id: 25, juz: "25", start: "Фуссиләт 47", end: "Жәсия 37" },
  { id: 26, juz: "26", start: "Ахқаф 1", end: "Зәрият 30" },
  { id: 27, juz: "27", start: "Зәрият 31", end: "Хадид 29" },
  { id: 28, juz: "28", start: "Мужәдилә 1", end: "Тахрим 12" },
  { id: 29, juz: "29", start: "Мүлік 1", end: "Мүрсәләт 50" },
  { id: 30, juz: "30", start: "Нәбә 1", end: "Нас 6" },
];

export const NAMES_99 = [
  { id: 1, arabic: "اللَّهُ", translit: "Аллаһ", meaning: "Алла - бүкіл әлемді Жаратушы" },
  { id: 2, arabic: "الرَّحْمَنُ", translit: "әр-Рахман", meaning: "Аса Рахымды" },
  { id: 3, arabic: "الرَّحِيمُ", translit: "әр-Рахим", meaning: "Ерекше Мейірімді" },
  { id: 4, arabic: "الْمَلِكُ", translit: "ал-Мәлик", meaning: "Патша, бүкіл әлемнің Иесі" },
  { id: 5, arabic: "الْقُدُّوسُ", translit: "ал-Қуддус", meaning: "Аса Қасиетті, Кемшіліктен Пәк" },
  { id: 6, arabic: "السَّلَامُ", translit: "әс-Сәләм", meaning: "Есендік беруші" },
  { id: 7, arabic: "الْمُؤْمِنُ", translit: "ал-Мумин", meaning: "Сенім ұялатушы" },
  { id: 8, arabic: "الْمُهَيْمِنُ", translit: "ал-Мухаймин", meaning: "Қорғаушы" },
  { id: 9, arabic: "الْعَزِيزُ", translit: "ал-Азиз", meaning: "Аса Үстем" },
  { id: 10, arabic: "الْجَبَّارُ", translit: "ал-Джаббар", meaning: "Аса Қуатты" },
  { id: 11, arabic: "الْمُتَكَبِّرُ", translit: "ал-Мутакаббир", meaning: "Өте ұлы" },
  { id: 12, arabic: "الْخَالِقُ", translit: "ал-Халиқ", meaning: "Жаратушы" },
  { id: 13, arabic: "الْبَارِئُ", translit: "ал-Бари", meaning: "Жоқтан бар етуші" },
  { id: 14, arabic: "الْمُصَوِّرُ", translit: "ал-Мусаввир", meaning: "Бейне беруші" },
  { id: 15, arabic: "الْغَفَّارُ", translit: "ал-Ғаффар", meaning: "Аса Кешірімді" },
  { id: 16, arabic: "الْقَهَّارُ", translit: "ал-Қаһһар", meaning: "Бәрін бағындырушы" },
  { id: 17, arabic: "الْوَهَّابُ", translit: "ал-Уаһһаб", meaning: "Сыйлаушы" },
  { id: 18, arabic: "الرَّزَّاقُ", translit: "әр-Раззақ", meaning: "Рызық беруші" },
  { id: 19, arabic: "الْفَتَّاحُ", translit: "ал-Фаттах", meaning: "Ашушы" },
  { id: 20, arabic: "الْعَلِيمُ", translit: "ал-Алим", meaning: "Бәрін білуші" },
  { id: 21, arabic: "الْقَابِضُ", translit: "ал-Қабид", meaning: "Тарылтушы" },
  { id: 22, arabic: "الْبَاسِطُ", translit: "ал-Басит", meaning: "Кеңейтуші" },
  { id: 23, arabic: "الْخَافِضُ", translit: "ал-Хафид", meaning: "Төмендетуші" },
  { id: 24, arabic: "الرَّافِعُ", translit: "әр-Рафи", meaning: "Жоғарылатушы" },
  { id: 25, arabic: "الْمُعِزُّ", translit: "ал-Муиз", meaning: "Мәртебе беруші" },
  { id: 26, arabic: "الْمُذِلُّ", translit: "ал-Музил", meaning: "Қор етуші" },
  { id: 27, arabic: "السَّمِيعُ", translit: "әс-Сами", meaning: "Бәрін естуші" },
  { id: 28, arabic: "الْبَصِيرُ", translit: "ал-Басир", meaning: "Бәрін көруші" },
  { id: 29, arabic: "الْحَكَمُ", translit: "ал-Хакам", meaning: "Төреші" },
  { id: 30, arabic: "الْعَدْلُ", translit: "ал-Адл", meaning: "Әділ" },
  { id: 31, arabic: "اللَّطِيفُ", translit: "ал-Латиф", meaning: "Мейірбан" },
  { id: 32, arabic: "الْخَبِيرُ", translit: "ал-Хабир", meaning: "Хабардар" },
  { id: 33, arabic: "الْحَلِيمُ", translit: "ал-Халим", meaning: "Ерекше сабырлы" },
  { id: 34, arabic: "الْعَظِيمُ", translit: "ал-Азим", meaning: "Аса ұлы" },
  { id: 35, arabic: "الْغَفُورُ", translit: "ал-Ғафур", meaning: "Аса жарылқаушы" },
  { id: 36, arabic: "الشَّكُورُ", translit: "әш-Шакур", meaning: "Шүкіршілік етуші" },
  { id: 37, arabic: "الْعَلِيُّ", translit: "ал-Али", meaning: "Жоғары мәртебелі" },
  { id: 38, arabic: "الْكَبِيرُ", translit: "ал-Кабир", meaning: "Өте үлкен" },
  { id: 39, arabic: "الْحَفِيظُ", translit: "ал-Хафиз", meaning: "Сақтаушы" },
  { id: 40, arabic: "الْمُقِيتُ", translit: "ал-Муқит", meaning: "Күш беруші" },
  { id: 41, arabic: "الْحَسِيبُ", translit: "ал-Хасиб", meaning: "Есептеуші" },
  { id: 42, arabic: "الْجَلِيلُ", translit: "ал-Джалил", meaning: "Айбынды" },
  { id: 43, arabic: "الْكَرِيمُ", translit: "ал-Карим", meaning: "Аса Жомарт" },
  { id: 44, arabic: "الرَّقِيبُ", translit: "әр-Рақиб", meaning: "Бақылаушы" },
  { id: 45, arabic: "الْمُجِيبُ", translit: "ал-Муджиб", meaning: "Жауап беруші" },
  { id: 46, arabic: "الْوَاسِعُ", translit: "ал-Уаси", meaning: "Қамтушы" },
  { id: 47, arabic: "الْحَكِيمُ", translit: "ал-Хаким", meaning: "Дана" },
  { id: 48, arabic: "الْوَدُودُ", translit: "ал-Уадуд", meaning: "Сүюші" },
  { id: 49, arabic: "الْمَجِيدُ", translit: "ал-Маджид", meaning: "Даңқты" },
  { id: 50, arabic: "الْبَاعِثُ", translit: "ал-Баис", meaning: "Тірілтуші" },
  { id: 51, arabic: "الشَّهِيدُ", translit: "әш-Шаһид", meaning: "Куә болушы" },
  { id: 52, arabic: "الْحَقُّ", translit: "ал-Хақ", meaning: "Ақиқат" },
  { id: 53, arabic: "الْوَكِيلُ", translit: "ал-Уәкил", meaning: "Сенім білдірілген" },
  { id: 54, arabic: "الْقَوِيُّ", translit: "ал-Қауи", meaning: "Күшті" },
  { id: 55, arabic: "الْمَتِينُ", translit: "ал-Матин", meaning: "Мықты" },
  { id: 56, arabic: "الْوَلِيُّ", translit: "ал-Уәли", meaning: "Жанашыр" },
  { id: 57, arabic: "الْحَمِيدُ", translit: "ал-Хамид", meaning: "Мақтаулы" },
  { id: 58, arabic: "الْمُحْصِي", translit: "ал-Мухси", meaning: "Есепке алушы" },
  { id: 59, arabic: "الْمُبْدِئُ", translit: "ал-Мубди", meaning: "Бастаушы" },
  { id: 60, arabic: "الْمُعِيدُ", translit: "ал-Муид", meaning: "Қайтарушы" },
  { id: 61, arabic: "الْمُحْيِي", translit: "ал-Мухйи", meaning: "Тірілтуші" },
  { id: 62, arabic: "الْمُمِيتُ", translit: "ал-Мумит", meaning: "Өлтіруші" },
  { id: 63, arabic: "الْحَيُّ", translit: "ал-Хай", meaning: "Мәңгі тірі" },
  { id: 64, arabic: "الْقَيُّومُ", translit: "ал-Қайюм", meaning: "Меңгеруші" },
  { id: 65, arabic: "الْوَاجِدُ", translit: "ал-Уаджид", meaning: "Табушы" },
  { id: 66, arabic: "الْمَاجِدُ", translit: "ал-Маджид", meaning: "Аса ұлы" },
  { id: 67, arabic: "الْوَاحِدُ", translit: "ал-Уахид", meaning: "Жалғыз" },
  { id: 68, arabic: "الصَّمَدُ", translit: "әс-Самад", meaning: "Мұқтажсыз" },
  { id: 69, arabic: "الْقَادِرُ", translit: "ал-Қадир", meaning: "Күдіретті" },
  { id: 70, arabic: "الْمُقْتَدِرُ", translit: "ал-Муқтадир", meaning: "Үстем" },
  { id: 71, arabic: "الْمُقَدِّمُ", translit: "ал-Муқаддим", meaning: "Алға қоюшы" },
  { id: 72, arabic: "الْمُؤَخِّرُ", translit: "ал-Муаххир", meaning: "Кейін қоюшы" },
  { id: 73, arabic: "الْأَوَّلُ", translit: "ал-Әууәл", meaning: "Бірінші" },
  { id: 74, arabic: "الْآخِرُ", translit: "ал-Ахир", meaning: "Соңғы" },
  { id: 75, arabic: "الظَّاهِرُ", translit: "аз-Заһир", meaning: "Анық" },
  { id: 76, arabic: "الْبَاطِنُ", translit: "ал-Батин", meaning: "Жасырын" },
  { id: 77, arabic: "الْوَالِي", translit: "ал-Уәли", meaning: "Билік етуші" },
  { id: 78, arabic: "الْمُتَعَالِي", translit: "ал-Мутаали", meaning: "Аса жоғары" },
  { id: 79, arabic: "الْبَرُّ", translit: "ал-Барр", meaning: "Қайырымды" },
  { id: 80, arabic: "التَّوَّابُ", translit: "әт-Тәууаб", meaning: "Тәубені қабыл алушы" },
  { id: 81, arabic: "الْمُنْتَقِمُ", translit: "ал-Мунтақим", meaning: "Жазалаушы" },
  { id: 82, arabic: "الْعَفُوُّ", translit: "ал-Афу", meaning: "Кешірімді" },
  { id: 83, arabic: "الرَّءُوفُ", translit: "әр-Рауф", meaning: "Өте мейірімді" },
  { id: 84, arabic: "مَالِكُ الْمُلْكِ", translit: "Мәликул Мулк", meaning: "Патшалықтың Иесі" },
  { id: 85, arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", translit: "Зул Джәләли уәл Икрам", meaning: "Ұлылық пен жомарттық Иесі" },
  { id: 86, arabic: "الْمُقْسِطُ", translit: "ал-Муқсит", meaning: "Әділ төреші" },
  { id: 87, arabic: "الْجَامِعُ", translit: "ал-Джами", meaning: "Жинаушы" },
  { id: 88, arabic: "الْغَنِيُّ", translit: "ал-Ғани", meaning: "Бай, Мұқтажсыз" },
  { id: 89, arabic: "الْمُغْنِي", translit: "ал-Муғни", meaning: "Байытушы" },
  { id: 90, arabic: "الْمَانِعُ", translit: "ал-Мани", meaning: "Тыюшы" },
  { id: 91, arabic: "الضَّارُّ", translit: "ад-Дарр", meaning: "Зиян келтіруші" },
  { id: 92, arabic: "النَّافِعُ", translit: "ән-Нафи", meaning: "Пайда беруші" },
  { id: 93, arabic: "النُّورُ", translit: "ән-Нур", meaning: "Нұр" },
  { id: 94, arabic: "الْهَادِي", translit: "ал-Һади", meaning: "Тура жолға салушы" },
  { id: 95, arabic: "الْبَدِيعُ", translit: "ал-Бади", meaning: "Ғажайып жаратушы" },
  { id: 96, arabic: "الْبَاقِي", translit: "ал-Бақи", meaning: "Мәңгілік" },
  { id: 97, arabic: "الْوَارِثُ", translit: "ал-Уарис", meaning: "Мұрагер" },
  { id: 98, arabic: "الرَّشِيدُ", translit: "әр-Рашид", meaning: "Тура жол көрсетуші" },
  { id: 99, arabic: "الصَّبُورُ", translit: "әс-Сабур", meaning: "Аса Сабырлы" }
];

export const RAMADAN_TASKS = [
  { id: 1, text_ru: "Прочитать 1 джуз Корана", text_kk: "1 пара Құран оқу" },
  { id: 2, text_ru: "Дать садака", text_kk: "Садақа беру" },
  { id: 3, text_ru: "Посетить таравих", text_kk: "Тарауыққа бару" },
  { id: 4, text_ru: "Накормить постящегося", text_kk: "Ораза ұстаған адамды тамақтандыру" },
  { id: 5, text_ru: "Выучить новое имя Аллаха", text_kk: "Алланың жаңа есімін жаттау" },
];

export const BADGES = [
  { id: 'first_fast', icon: '🌙', name_ru: 'Первый пост', name_kk: 'Алғашқы ораза' },
  { id: 'quran_master', icon: '📖', name_ru: 'Чтец Корана', name_kk: 'Құран оқушы' },
  { id: 'charity_king', icon: '💎', name_ru: 'Щедрая душа', name_kk: 'Жомарт жан' },
  { id: 'taraweeh_star', icon: '🕌', name_ru: 'Звезда Таравиха', name_kk: 'Тарауық жұлдызы' },
  { id: 'names_scholar', icon: '📜', name_ru: 'Знаток имен', name_kk: 'Есімдер білгірі' },
  { id: 'ramadan_hero', icon: '🏆', name_ru: 'Герой Рамадана', name_kk: 'Рамазан батыры' },
  { id: 'khatam_master', icon: '🕋', name_ru: 'Хафиз', name_kk: 'Құран Хатым' },
  { id: 'goal_achiever', icon: '🎯', name_ru: 'Целеустремленный', name_kk: 'Мақсатшыл' },
  { id: 'community_builder', icon: '🤝', name_ru: 'Лидер общины', name_kk: 'Жамағат лидері' },
  { id: 'social_butterfly', icon: '👥', name_ru: 'Друг народа', name_kk: 'Халық досы', description_ru: 'Пригласил 10+ друзей', description_kk: '10+ досты шақырды', requirement: 'referrals_10' },
  { id: 'friends_leader', icon: '🏅', name_ru: 'Лидер друзей', name_kk: 'Достар көшбасшысы', description_ru: '1 место среди друзей', description_kk: 'Достар арасында 1 орын', requirement: 'friends_rank_1' },
  { id: 'legend', icon: '🌟', name_ru: 'Легенда', name_kk: 'Аңыз', description_ru: 'Набрал 10000+ XP', description_kk: '10000+ XP жинады', requirement: 'xp_10000' }
];

export const USEFUL_MATERIALS = [
  {
    id: 1,
    icon: '🌙',
    title_ru: 'Духовный смысл Рамазана',
    title_kk: 'Рамазанның рухани мәні',
    desc_ru: 'О внутреннем очищении в этот month',
    desc_kk: 'Бұл айдағы ішкі тазалық туралы',
    content_ru: '### Суть поста\nРамазан - это время для размышлений и покаяния...',
    content_kk: '### Оразаның мәні\nРамазан - бұл ойлану және тәубе ету уақыты...'
  }
];

export const MORNING_DHIKRS = [
  {
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
    translit: 'Allahumma bika asbahna',
    translation_ru: 'О Аллах, благодаря Тебе мы дожили до утра',
    translation_kk: 'Уа Аллаһ, Сенің жәрдеміңмен таңға жеттік'
  }
];

export const EVENING_DHIKRS = [
  {
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
    translit: 'Allahumma bika amsayna',
    translation_ru: 'О Аллах, благодаря Тебе мы дожили до вечера',
    translation_kk: 'Уа Аллаһ, Сенің жәрдеміңмен кешке жеттік'
  }
];

// ═══════════════════════════════════════════════════════════════
// МАҚСАТТАР v2 — Категории с шаблонными целями
// ═══════════════════════════════════════════════════════════════

export interface GoalTemplate {
  id: string;           // "template-0" ... "template-9"
  text_kk: string;
  text_ru: string;
  xp: number;
}

export interface GoalCategory {
  id: GoalCategoryId;
  icon: string;
  name_kk: string;
  name_ru: string;
  color: string;        // Tailwind bg-class для карточки
  templates: GoalTemplate[];
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: 'namaz',
    icon: '🕌',
    name_kk: 'Намаз',
    name_ru: 'Намаз',
    color: 'from-emerald-500 to-emerald-700',
    templates: [
      { id: 'template-0', text_kk: '5 уақыт намазды толық оқу', text_ru: 'Совершить все 5 намазов', xp: 80 },
      { id: 'template-1', text_kk: 'Таң намазын жамағатпен оқу', text_ru: 'Фаджр намаз с джамаатом', xp: 70 },
      { id: 'template-2', text_kk: 'Тарауық намазына бару', text_ru: 'Посетить таравих намаз', xp: 60 },
      { id: 'template-3', text_kk: 'Таһажуд намазын оқу', text_ru: 'Совершить тахаджуд намаз', xp: 80 },
      { id: 'template-4', text_kk: 'Дұха намазын оқу', text_ru: 'Совершить духа намаз', xp: 40 },
      { id: 'template-5', text_kk: 'Үтір намазын оқу', text_ru: 'Совершить витр намаз', xp: 40 },
      { id: 'template-6', text_kk: 'Намазды уақытылы оқу', text_ru: 'Совершать намаз вовремя', xp: 60 },
      { id: 'template-7', text_kk: 'Намаздан кейін дұға ету', text_ru: 'Сделать дуа после намаза', xp: 30 },
      { id: 'template-8', text_kk: 'Сунна намаздарын оқу', text_ru: 'Совершить сунна намазы', xp: 50 },
      { id: 'template-9', text_kk: 'Намазды зейін қойып оқу', text_ru: 'Совершить намаз с хушу', xp: 60 },
    ]
  },
  {
    id: 'quran',
    icon: '📖',
    name_kk: 'Құран',
    name_ru: 'Коран',
    color: 'from-blue-500 to-blue-700',
    templates: [
      { id: 'template-0', text_kk: '1 пара Құран оқу', text_ru: 'Прочитать 1 джуз Корана', xp: 150 },
      { id: 'template-1', text_kk: '5 бет Құран оқу', text_ru: 'Прочитать 5 страниц Корана', xp: 50 },
      { id: 'template-2', text_kk: '10 бет Құран оқу', text_ru: 'Прочитать 10 страниц Корана', xp: 80 },
      { id: 'template-3', text_kk: 'Мағынасымен 1 бет оқу', text_ru: 'Прочитать 1 стр. с тафсиром', xp: 60 },
      { id: 'template-4', text_kk: '1 жаңа сүре жаттау', text_ru: 'Выучить 1 новую суру', xp: 100 },
      { id: 'template-5', text_kk: 'Таджуидпен оқу', text_ru: 'Читать с таджуидом', xp: 70 },
      { id: 'template-6', text_kk: 'Отбасыға Құран оқып беру', text_ru: 'Прочитать Коран семье', xp: 50 },
      { id: 'template-7', text_kk: 'Аудиомен бірге тыңдай оқу', text_ru: 'Читать вместе с аудио', xp: 40 },
      { id: 'template-8', text_kk: 'Балаларға Құран үйрету', text_ru: 'Обучить детей Корану', xp: 80 },
      { id: 'template-9', text_kk: '20 бет Құран оқу', text_ru: 'Прочитать 20 страниц Корана', xp: 120 },
    ]
  },
  {
    id: 'sadaqa',
    icon: '💎',
    name_kk: 'Садақа',
    name_ru: 'Садака',
    color: 'from-yellow-500 to-orange-500',
    templates: [
      { id: 'template-0', text_kk: 'Ораза ұстаушыны тамақтандыру', text_ru: 'Накормить постящегося', xp: 80 },
      { id: 'template-1', text_kk: 'Анонимді садақа беру', text_ru: 'Дать анонимную садаку', xp: 70 },
      { id: 'template-2', text_kk: 'Мешітке садақа беру', text_ru: 'Пожертвовать мечети', xp: 50 },
      { id: 'template-3', text_kk: 'Ауру адамды бару', text_ru: 'Навестить больного', xp: 60 },
      { id: 'template-4', text_kk: 'Жетімдер үйіне дем беру', text_ru: 'Помочь детскому дому', xp: 100 },
      { id: 'template-5', text_kk: 'Қажеті бар адамға қол ұшын беру', text_ru: 'Помочь нуждающемуся', xp: 60 },
      { id: 'template-6', text_kk: 'Туыс-жақындарыңа садақа беру', text_ru: 'Помочь родственникам', xp: 50 },
      { id: 'template-7', text_kk: 'Пітір зекет беру', text_ru: 'Отдать закят аль-фитр', xp: 80 },
      { id: 'template-8', text_kk: 'Мүгедек немесе қарияға көмек ету', text_ru: 'Помочь пожилому / инвалиду', xp: 70 },
      { id: 'template-9', text_kk: 'Пайдалы мазмұнды жіберу', text_ru: 'Поделиться полезным контентом', xp: 40 },
    ]
  },
  {
    id: 'dhikr',
    icon: '🤲',
    name_kk: 'Зікір',
    name_ru: 'Зикр',
    color: 'from-purple-500 to-purple-700',
    templates: [
      { id: 'template-0', text_kk: 'Таңғы зікір оқу', text_ru: 'Утренние зикры', xp: 30 },
      { id: 'template-1', text_kk: 'Кешкі зікір оқу', text_ru: 'Вечерние зикры', xp: 30 },
      { id: 'template-2', text_kk: '100 рет «Субхааналлаһ» айту', text_ru: '100 раз «Субханаллах»', xp: 40 },
      { id: 'template-3', text_kk: '100 рет салауат оқу', text_ru: '100 раз салауат', xp: 50 },
      { id: 'template-4', text_kk: 'Алланың 99 есімін оқу', text_ru: 'Прочитать 99 имен Аллаха', xp: 50 },
      { id: 'template-5', text_kk: 'Аятел Күрсі оқу', text_ru: 'Аятуль Курси', xp: 30 },
      { id: 'template-6', text_kk: 'Ихлас, Фаляқ, Нас (×3) оқу', text_ru: 'Ихлас, Фалак, Нас (×3)', xp: 30 },
      { id: 'template-7', text_kk: '100 рет истиғфар айту', text_ru: '100 раз истигфар', xp: 40 },
      { id: 'template-8', text_kk: 'Таң + кешкі зікірді екеуін оқу', text_ru: 'Утренние + вечерние зикры', xp: 55 },
      { id: 'template-9', text_kk: '1000 рет зікір айту', text_ru: '1000 раз зикр', xp: 70 },
    ]
  },
  {
    id: 'ilm',
    icon: '📚',
    name_kk: 'Білім',
    name_ru: 'Знания',
    color: 'from-cyan-500 to-cyan-700',
    templates: [
      { id: 'template-0', text_kk: 'Бүгінгі хадис оқу', text_ru: 'Прочитать хадис дня', xp: 30 },
      { id: 'template-1', text_kk: 'Ислам кітабынан 30 минут оқу', text_ru: 'Читать исламскую книгу 30 мин', xp: 50 },
      { id: 'template-2', text_kk: 'Уағыз немесе дәріс тыңдау', text_ru: 'Послушать лекцию / урок', xp: 40 },
      { id: 'template-3', text_kk: 'Сира кітабынан бір тарау оқу', text_ru: 'Прочитать главу сиры', xp: 50 },
      { id: 'template-4', text_kk: '5 хадис жаттау', text_ru: 'Выучить 5 хадисов', xp: 60 },
      { id: 'template-5', text_kk: 'Намаз сүрелерін қайталау', text_ru: 'Повторить суры намаза', xp: 40 },
      { id: 'template-6', text_kk: 'Рамазан тарихын оқу', text_ru: 'Прочитать историю Рамадана', xp: 30 },
      { id: 'template-7', text_kk: 'Балаға Ислам тарихын үйрету', text_ru: 'Рассказать историю Ислама ребёнку', xp: 60 },
      { id: 'template-8', text_kk: 'Ислам подкаст немесе лекция тыңдау', text_ru: 'Исламский подкаст / лекция', xp: 40 },
      { id: 'template-9', text_kk: 'Ахлақ немесе фиқһ кітабынан оқу', text_ru: 'Читать книгу по ахляку / фикху', xp: 50 },
    ]
  },
  {
    id: 'akhlaq',
    icon: '❤️',
    name_kk: 'Ахлақ',
    name_ru: 'Нравственность',
    color: 'from-rose-500 to-rose-700',
    templates: [
      { id: 'template-0', text_kk: 'Ата-анаға қызмет ету', text_ru: 'Помочь родителям', xp: 80 },
      { id: 'template-1', text_kk: 'Жақынына хал-жағдайын сұрау', text_ru: 'Справиться о близких', xp: 50 },
      { id: 'template-2', text_kk: 'Ашуыңды жеңу', text_ru: 'Сдержать гнев', xp: 70 },
      { id: 'template-3', text_kk: 'Өсек сөзден аулақ болу', text_ru: 'Избегать сплетен', xp: 60 },
      { id: 'template-4', text_kk: 'Кешірім сұрау', text_ru: 'Попросить прощения', xp: 60 },
      { id: 'template-5', text_kk: 'Достарыңа дұға ету', text_ru: 'Сделать дуа за друзей', xp: 40 },
      { id: 'template-6', text_kk: 'Отбасыңмен уақыт өткізу', text_ru: 'Провести время с семьёй', xp: 50 },
      { id: 'template-7', text_kk: 'Бір адамды қуантып жіберу', text_ru: 'Обрадовать кого-нибудь', xp: 30 },
      { id: 'template-8', text_kk: 'Тәубе ету (истиғфар)', text_ru: 'Совершить искреннее покаяние', xp: 60 },
      { id: 'template-9', text_kk: 'Күн бойы ешкімге зиян бермеу', text_ru: 'Весь день никому не навредить', xp: 50 },
    ]
  }
];

/** Вспомогательная функция: найти категорию по ID */
export function getGoalCategory(id: GoalCategoryId): GoalCategory | undefined {
  return GOAL_CATEGORIES.find(c => c.id === id);
}

/** Вспомогательная функция: получить записи за конкретный день */
export function getTodayGoalRecords(
  dailyGoalRecords: Record<string, import('./src/types/types').DailyGoalRecord[]> | undefined,
  dateStr: string
): import('./src/types/types').DailyGoalRecord[] {
  return dailyGoalRecords?.[dateStr] ?? [];
}

/**
 * Проверяет, выбрана ли уже цель для данной категории сегодня.
 * Возвращает запись или undefined.
 */
export function getTodayCategoryRecord(
  dailyGoalRecords: Record<string, import('./src/types/types').DailyGoalRecord[]> | undefined,
  dateStr: string,
  categoryId: GoalCategoryId
): import('./src/types/types').DailyGoalRecord | undefined {
  return getTodayGoalRecords(dailyGoalRecords, dateStr)
    .find(r => r.categoryId === categoryId);
}
