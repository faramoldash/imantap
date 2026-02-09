// Словарь переводов стран
export const COUNTRY_NAMES = {
  kk: {
    'Kazakhstan': 'Қазақстан',
    'Russia': 'Ресей',
    'Turkey': 'Түркия',
    'Uzbekistan': 'Өзбекстан',
    'Kyrgyzstan': 'Қырғызстан',
    'Tajikistan': 'Тәжікстан',
    'Turkmenistan': 'Түрікменстан',
    'Azerbaijan': 'Әзірбайжан',
    'USA': 'АҚШ',
    'United Kingdom': 'Ұлыбритания',
    'Germany': 'Германия',
    'France': 'Франция',
    'China': 'Қытай',
    'India': 'Үндістан',
    'Pakistan': 'Пәкістан',
    'Saudi Arabia': 'Сауд Арабиясы',
    'United Arab Emirates': 'Біріккен Араб Әмірліктері',
    'Egypt': 'Мысыр',
    'Indonesia': 'Индонезия',
    'Malaysia': 'Малайзия',
    'Iran': 'Иран'
  },
  ru: {
    'Kazakhstan': 'Казахстан',
    'Russia': 'Россия',
    'Turkey': 'Турция',
    'Uzbekistan': 'Узбекистан',
    'Kyrgyzstan': 'Кыргызстан',
    'Tajikistan': 'Таджикистан',
    'Turkmenistan': 'Туркменистан',
    'Azerbaijan': 'Азербайджан',
    'USA': 'США',
    'United Kingdom': 'Великобритания',
    'Germany': 'Германия',
    'France': 'Франция',
    'China': 'Китай',
    'India': 'Индия',
    'Pakistan': 'Пакистан',
    'Saudi Arabia': 'Саудовская Аравия',
    'United Arab Emirates': 'ОАЭ',
    'Egypt': 'Египет',
    'Indonesia': 'Индонезия',
    'Malaysia': 'Малайзия',
    'Iran': 'Иран'
  }
};

// Словарь переводов городов
export const CITY_NAMES = {
  kk: {
    // Казахстан
    'Astana': 'Астана',
    'Almaty': 'Алматы',
    'Shymkent': 'Шымкент',
    'Karaganda': 'Қарағанды',
    'Aktobe': 'Ақтөбе',
    'Taraz': 'Тараз',
    'Pavlodar': 'Павлодар',
    'Oskemen': 'Өскемен',
    'Semey': 'Семей',
    'Atyrau': 'Атырау',
    'Kostanay': 'Қостанай',
    'Kyzylorda': 'Қызылорда',
    'Aktau': 'Ақтау',
    'Petropavl': 'Петропавл',
    'Oral': 'Орал',
    'Turkistan': 'Түркістан',
    'Taldykorgan': 'Талдықорған',
    'Kokshetau': 'Көкшетау',
    // Россия
    'Moscow': 'Мәскеу',
    'Saint Petersburg': 'Санкт-Петербург',
    'Kazan': 'Қазан',
    // Турция
    'Istanbul': 'Стамбұл',
    'Ankara': 'Анкара'
  },
  ru: {
    'Astana': 'Астана',
    'Almaty': 'Алматы',
    'Shymkent': 'Шымкент',
    'Moscow': 'Москва',
    'Istanbul': 'Стамбул'
  }
};

// Функция перевода названия
export function translateName(name, language, type = 'country') {
  const dict = type === 'country' ? COUNTRY_NAMES : CITY_NAMES;
  return dict[language]?.[name] || name;
}