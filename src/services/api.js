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
    const response = await fetch(`${API_BASE_URL}/api/countries`);  // ✅ ИСПРАВЛЕНО
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
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
export async function getCities(country) {
  try {
    if (!country) {
      return [];
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/${encodeURIComponent(country)}`);  // ✅ ИСПРАВЛЕНО
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.error || 'Failed to fetch cities');
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

/**
 * CIRCLES API
 */

/**
 * Создать новый круг
 */
export async function createCircle(userId, name, description = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/circles/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, description })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.circle;
    } else {
      throw new Error(data.error || 'Failed to create circle');
    }
  } catch (error) {
    console.error('Error creating circle:', error);
    return null;
  }
}

/**
 * Получить круги пользователя
 */
export async function getUserCircles(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/circles/user/${userId}`);
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch circles');
    }
  } catch (error) {
    console.error('Error fetching circles:', error);
    return [];
  }
}

/**
 * Получить детали круга с прогрессом
 */
export async function getCircleDetails(circleId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/circles/${circleId}/details?userId=${userId}`);
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch circle details');
    }
  } catch (error) {
    console.error('Error fetching circle details:', error);
    return null;
  }
}

/**
 * Пригласить пользователя в круг
 */
export async function inviteToCircle(circleId, inviterId, targetUsername) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/circles/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circleId, inviterId, targetUsername })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Failed to send invite');
    }
  } catch (error) {
    console.error('Error inviting to circle:', error);
    throw error;
  }
}

/**
 * Принять приглашение
 */
export async function acceptCircleInvite(circleId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/circles/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circleId, userId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Failed to accept invite');
    }
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}
