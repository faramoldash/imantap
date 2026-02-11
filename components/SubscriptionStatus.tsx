import React from 'react';

interface SubscriptionStatusProps {
  subscriptionExpiresAt: string | null;
  daysLeft: number | null;
  language: 'kk' | 'ru';
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  subscriptionExpiresAt, 
  daysLeft, 
  language 
}) => {
  if (!subscriptionExpiresAt) return null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
  const isExpiringSoonCritical = daysLeft !== null && daysLeft <= 3;
  const expiryDate = new Date(subscriptionExpiresAt);

  return (
    <div 
      className={`rounded-2xl p-5 border-2 shadow-lg ${
        isExpiringSoonCritical 
          ? 'bg-red-50 border-red-300' 
          : isExpiringSoon
          ? 'bg-orange-50 border-orange-300'
          : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">
              {isExpiringSoonCritical ? '⚠️' : isExpiringSoon ? '⏰' : '📅'}
            </span>
            <p 
              className="text-xs font-black uppercase tracking-wide"
              style={{ 
                color: isExpiringSoonCritical 
                  ? '#991B1B' 
                  : isExpiringSoon 
                  ? '#C2410C' 
                  : '#1E40AF' 
              }}
            >
              {language === 'kk' ? 'Жазылым мерзімі' : 'Подписка до'}
            </p>
          </div>
          
          <p 
            className="text-2xl font-black mb-1"
            style={{ 
              color: isExpiringSoonCritical 
                ? '#991B1B' 
                : isExpiringSoon 
                ? '#C2410C' 
                : '#1E40AF' 
            }}
          >
            {expiryDate.toLocaleDateString(language === 'kk' ? 'kk-KZ' : 'ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          
          {daysLeft !== null && (
            <>
              <p 
                className="text-base font-bold"
                style={{ 
                  color: isExpiringSoonCritical 
                    ? '#991B1B' 
                    : isExpiringSoon 
                    ? '#C2410C' 
                    : '#1E40AF' 
                }}
              >
                {daysLeft} {language === 'kk' ? 'күн қалды' : `${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'} осталось`}
              </p>
              
              {/* Прогресс бар */}
              <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isExpiringSoonCritical 
                      ? 'bg-red-500' 
                      : isExpiringSoon 
                      ? 'bg-orange-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, (daysLeft / 90) * 100))}%` 
                  }}
                ></div>
              </div>
            </>
          )}
        </div>
        
        {isExpiringSoon && (
          <div className="ml-3">
            <span className="text-3xl animate-pulse">
              {isExpiringSoonCritical ? '🔥' : '⏳'}
            </span>
          </div>
        )}
      </div>
      
      {/* Предупреждение если истекает скоро */}
      {isExpiringSoonCritical && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-xs font-bold text-red-800">
            {language === 'kk' 
              ? '⚠️ Жазылым жақында аяқталады! Жаңартуды ұмытпаңыз.' 
              : '⚠️ Подписка скоро истекает! Не забудьте продлить.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
