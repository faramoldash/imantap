import { useState, useEffect, useCallback } from 'react';
import { getUserCircles, getCircleDetails } from '../services/api';

export function useUserCircles(userId: number) {
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any | null>(null);
  const [isLoadingCircles, setIsLoadingCircles] = useState(false);
  const [isRefreshingCircle, setIsRefreshingCircle] = useState(false);

  const loadCircles = useCallback(async () => {
    setIsLoadingCircles(true);
    try {
      const data = await getUserCircles(userId);
      setCircles(data || []);
    } catch (e) {
      console.error('❌ Ошибка загрузки кругов:', e);
    } finally {
      setIsLoadingCircles(false);
    }
  }, [userId]);

  const loadCircleDetails = useCallback(
    async (circleId: string) => {
      try {
        const details = await getCircleDetails(circleId, userId);
        setSelectedCircle(details);
      } catch (e) {
        console.error('❌ Ошибка загрузки деталей круга:', e);
      }
    },
    [userId]
  );

  const refreshSelectedCircle = useCallback(async () => {
    if (!selectedCircle?.circleId) return;
    try {
      setIsRefreshingCircle(true);
      const details = await getCircleDetails(selectedCircle.circleId, userId);
      setSelectedCircle(details);
    } catch (e) {
      console.error('❌ Ошибка обновления круга:', e);
    } finally {
      setTimeout(() => setIsRefreshingCircle(false), 500);
    }
  }, [selectedCircle?.circleId, userId]);

  // начальная загрузка кругов
  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  // автообновление выбранного круга
  useEffect(() => {
    if (!selectedCircle?.circleId) return;
    const id = setInterval(refreshSelectedCircle, 30000);
    return () => clearInterval(id);
  }, [selectedCircle?.circleId, refreshSelectedCircle]);

  return {
    circles,
    selectedCircle,
    setSelectedCircle,
    isLoadingCircles,
    isRefreshingCircle,
    loadCircles,
    loadCircleDetails,
    refreshSelectedCircle,
  };
}
