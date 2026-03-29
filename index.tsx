import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Инициализация Telegram WebApp
const telegram = (window as any).Telegram;
const webApp = telegram?.WebApp;

if (webApp) {
  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor('#3D2010');
  webApp.setBackgroundColor('#F0EEEC');
}

// Рендерим БЕЗ передачи telegramUser (получим внутри App)
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);