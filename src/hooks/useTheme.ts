import { useEffect } from 'react';

export function useTheme(): void {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;

    const applyTheme = () => {
      const isDark = tg?.colorScheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();

    if (tg) {
      tg.onEvent('themeChanged', applyTheme);
      return () => tg.offEvent('themeChanged', applyTheme);
    }
  }, []);
}
