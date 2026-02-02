import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FORCE UPDATE - v2.0
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 🔥 ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ С ЗАДЕРЖКОЙ
const initApp = () => {
  console.log('🚀 Инициализация приложения...');
  
  // 👉 Получаем Telegram WebApp
  const telegram = (window as any).Telegram;
  const webApp = telegram?.WebApp;
  
  // 🔍 ОТЛАДКА
  console.log('🔍 window.Telegram существует?', !!telegram);
  console.log('🔍 WebApp существует?', !!webApp);
  
  if (webApp) {
    // Инициализируем Telegram WebApp
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor('#065f46');
    webApp.setBackgroundColor('#f8fafc');
    
    console.log('✅ Telegram WebApp инициализирован');
    console.log('👤 User:', webApp.initDataUnsafe?.user);
    console.log('👤 User ID:', webApp.initDataUnsafe?.user?.id);
  } else {
    console.warn('⚠️ Telegram WebApp не найден! Возможно скрипт не загрузился.');
  }
  
  // 👉 Достаём пользователя
  const telegramUser = webApp?.initDataUnsafe?.user ?? null;
  
  // 🎨 Рендерим приложение
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App telegramUser={telegramUser} />
    </React.StrictMode>
  );
};

// 🔥 ЖДЁМ ЗАГРУЗКИ DOM И СКРИПТА TELEGRAM
if (document.readyState === 'loading') {
  // Документ ещё загружается - ждём DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Добавляем небольшую задержку чтобы Telegram скрипт успел инициализироваться
    setTimeout(initApp, 300);
  });
} else {
  // Документ уже загружен - запускаем с задержкой
  setTimeout(initApp, 300);
}
// Build: Mon Feb  2 13:17:40 +05 2026
