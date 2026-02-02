// src/services/geminiService.ts
// Временно отключен - только fallback данные

interface InsightData {
  title: string;
  ayah: string;
  meaning: string;
  advice: string;
  reflection: string;
}

interface DuaData {
  arabic: string;
  transliteration: string;
  translation: string;
  benefit: string;
}

export async function getDailySpiritualInsight(
  day: number, 
  language: string
): Promise<InsightData | null> {
  // Возвращаем заглушку
  const isKk = language === 'kk';
  return {
    title: isKk ? `${day}-күн ғибраты` : `Наставление дня ${day}`,
    ayah: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ',
    meaning: isKk 
      ? 'Иман келтіргендер! Сендерге ораза ұстау парыз етілді' 
      : 'О те, которые уверовали! Вам предписан пост',
    advice: isKk
      ? 'Бүгін Құранды оқып, тәуба етуге уақыт бөліңіз'
      : 'Сегодня уделите время чтению Корана и покаянию',
    reflection: isKk
      ? 'Ораза - бұл жан мен денені тазартудың құралы'
      : 'Пост - это средство очищения души и тела'
  };
}

export async function getDuaRecommendation(
  userState: string, 
  language: string
): Promise<DuaData | null> {
  // Возвращаем заглушку
  const isKk = language === 'kk';
  return {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan',
    translation: isKk
      ? 'Раббымыз! Бізге дүниеде де игілік бер, ахиретте де игілік бер'
      : 'Господь наш! Даруй нам добро в этом мире и добро в мире вечном',
    benefit: isKk
      ? 'Бұл дұға кез келген жағдайда оқылады'
      : 'Эта дуа читается в любой ситуации'
  };
}
