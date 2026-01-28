
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Basic Telegram Web App theme integration
// Fix: Access Telegram via window as any to resolve property not existing on type Window error
const telegram = (window as any).Telegram;
if (telegram?.WebApp) {
    const webApp = telegram.WebApp;
    webApp.ready();
    webApp.expand();
    
    // Set header color to match our gradient starting color
    webApp.setHeaderColor('#065f46');
    webApp.setBackgroundColor('#f8fafc');
}