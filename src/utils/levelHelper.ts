import { LEVEL_SYSTEM } from '../../constants';

export function getUserLevelInfo(xp: number, language: 'kk' | 'ru' = 'kk') {
  const levelData = LEVEL_SYSTEM.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVEL_SYSTEM[0];
  const nextLevelData = LEVEL_SYSTEM[levelData.level] || null;
  
  const name = language === 'kk' ? levelData.name_kk : levelData.name_ru;
  const xpInCurrentLevel = xp - levelData.minXP;
  const xpNeededForLevel = levelData.maxXP === Infinity ? 0 : levelData.maxXP - levelData.minXP + 1;
  const xpToNextLevel = nextLevelData ? nextLevelData.minXP - xp : 0;
  const progressPercent = levelData.maxXP === Infinity ? 100 : Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100);
  
  return {
    level: levelData.level,
    name,
    icon: levelData.icon,
    xpInCurrentLevel,
    xpNeededForLevel,
    xpToNextLevel,
    progressPercent,
    hasNextLevel: !!nextLevelData
  };
}
