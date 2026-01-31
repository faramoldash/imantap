// components/SyncIndicator.tsx
import React, { useEffect, useState } from 'react';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

interface SyncIndicatorProps {
  status: SyncStatus;
  onRetry?: () => void;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, onRetry }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'syncing' || status === 'error' || status === 'offline') {
      setVisible(true);
    } else if (status === 'success') {
      setVisible(true);
      // Скрываем через 2 секунды после успешной синхронизации
      const timeout = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [status]);

  if (!visible) return null;

  const getContent = () => {
    switch (status) {
      case 'syncing':
        return (
          <div className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Синхронизация...</span>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Сақталды</span>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-medium">Қате</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-2 bg-white text-red-500 px-2 py-1 rounded text-xs font-bold active:scale-95 transition-transform"
              >
                Қайталау
              </button>
            )}
          </div>
        );
      
      case 'offline':
        return (
          <div className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">Offline</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
      {getContent()}
    </div>
  );
};

export default SyncIndicator;