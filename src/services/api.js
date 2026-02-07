// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://imantap-bot-production.up.railway.app';

/**
 * Получить данные пользователя по Telegram ID
 */
export async function getUserData(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch user data');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Проверить здоровье API
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Получить реферальную статистику
 */
export async function getReferralStats(promoCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/referrals?code=${promoCode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch referral stats');
    }
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return null;
  }
}

/**
 * Получить глобальный лидерборд
 */
export async function getGlobalLeaderboard(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/global?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch leaderboard');
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return null;
  }
}
