
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 👉 Получаем Telegram WebApp
const telegram = (window as any).Telegram;
const webApp = telegram?.WebApp;

// 👉 Достаём пользователя
const telegramUser = webApp?.initDataUnsafe?.user ?? null;

// 👉 Говорим Telegram, что приложение готово
if (webApp) {
  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor('#065f46');
  webApp.setBackgroundColor('#f8fafc');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);