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
 * Получить глобальный лидерборд с фильтрами и пагинацией
 */
export async function getGlobalLeaderboard(options) {
  try {
    const { limit = 20, offset = 0, country = null, city = null } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (country) params.append('country', country);
    if (city) params.append('city', city);
    
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/global?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        data: data.data || [],           // ✅ ИСПРАВЛЕНО
        total: data.total || 0,           // ✅ ДОБАВЛЕНО
        hasMore: data.hasMore ?? false    // ✅ ИСПРАВЛЕНО
      };
    } else {
      throw new Error(data.error || 'Failed to fetch leaderboard');
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return null;
  }
}

/**
 * Получить лидерборд друзей
 */
export async function getFriendsLeaderboard(userId, limit = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/friends/${userId}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch friends leaderboard');
    }
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    return null;
  }
}

/**
 * Получить список стран для фильтра
 */
export async function getCountries() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/countries`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch countries');
    }
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Получить список городов для фильтра
 */
export async function getCities(country = null) {
  try {
    const params = country ? `?country=${encodeURIComponent(country)}` : '';
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/cities${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch cities');
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}
