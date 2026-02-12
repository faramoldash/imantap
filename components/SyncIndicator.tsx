// components/SyncIndicator.tsx
import React, { useEffect, useState } from 'react';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

interface SyncIndicatorProps {
  status: SyncStatus;
  onRetry?: () => void;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, onRetry }) => {
  // ✅ Полностью скрываем все уведомления
  return null;
};

export default SyncIndicator;
