import React, { useState, useEffect } from 'react';
import { Language, UserData } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { getUserCircles, getCircleDetails, createCircle, inviteToCircle } from '../src/services/api';

interface CirclesViewProps {
  userData: UserData;
  language: Language;
  onNavigate?: (view: string) => void;
}

const CirclesView: React.FC<CirclesViewProps> = ({ userData, language, onNavigate }) => {
  const t = TRANSLATIONS[language];
  
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Форма создания
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  
  // Форма приглашения
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Загрузка кругов пользователя
  useEffect(() => {
    loadCircles();
  }, [userData.userId]);

  const loadCircles = async () => {
    setIsLoading(true);
    const userCircles = await getUserCircles(userData.userId);
    setCircles(userCircles || []);
    setIsLoading(false);
  };

  // Загрузка деталей круга
  const loadCircleDetails = async (circleId: string) => {
    const details = await getCircleDetails(circleId, userData.userId);
    setSelectedCircle(details);
  };

  // Создание круга
  const handleCreateCircle = async () => {
    if (!circleName.trim()) return;
    
    const newCircle = await createCircle(userData.userId, circleName, circleDescription);
    
    if (newCircle) {
      setShowCreateForm(false);
      setCircleName('');
      setCircleDescription('');
      loadCircles();
    }
  };

  // Приглашение
  const handleInvite = async () => {
    if (!inviteUsername.trim() || !selectedCircle) return;
    
    setInviteError('');
    setInviteSuccess('');
    
    try {
      await inviteToCircle(selectedCircle.circleId, userData.userId, inviteUsername);
      setInviteSuccess(language === 'kk' ? 'Шақыру жіберілді!' : 'Приглашение отправлено!');
      setInviteUsername('');
      
      // Обновляем детали
      setTimeout(() => {
        loadCircleDetails(selectedCircle.circleId);
        setInviteSuccess('');
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || (language === 'kk' ? 'Қате орын алды' : 'Произошла ошибка'));
    }
  };

  // Вид: Список кругов
  if (!selectedCircle) {
    return (
      <div className="space-y-6 pb-8 pt-4">
        {/* Заголовок с фоном */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate && onNavigate('profile')}
                className="text-slate-600 hover:text-slate-800 font-bold text-sm transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-black text-slate-800">
                {language === 'kk' ? '🤝 Менің топтарым' : '🤝 Мои круги'}
              </h2>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-lg"
            >
              + {language === 'kk' ? 'Жасау' : 'Создать'}
            </button>
          </div>
        </div>

        {/* Форма создания */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4">
              {language === 'kk' ? 'Жаңа топ жасау' : 'Создать новый круг'}
            </h3>
            
            <input
              type="text"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              placeholder={language === 'kk' ? 'Топтың атауы' : 'Название круга'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:border-emerald-500"
              maxLength={30}
            />
            
            <textarea
              value={circleDescription}
              onChange={(e) => setCircleDescription(e.target.value)}
              placeholder={language === 'kk' ? 'Сипаттама (міндетті емес)' : 'Описание (необязательно)'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold mb-4 outline-none focus:border-emerald-500 resize-none"
              rows={3}
              maxLength={100}
            />
            
            <div className="flex space-x-2">
              <button
                onClick={handleCreateCircle}
                disabled={!circleName.trim()}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {language === 'kk' ? 'Жасау' : 'Создать'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCircleName('');
                  setCircleDescription('');
                }}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                {language === 'kk' ? 'Болдырмау' : 'Отмена'}
              </button>
            </div>
          </div>
        )}

        {/* Список кругов */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : circles.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center">
            <span className="text-6xl mb-4 block">🤝</span>
            <p className="text-slate-400 text-sm mb-2">
              {language === 'kk' ? 'Әзірге топтар жоқ' : 'Пока нет кругов'}
            </p>
            <p className="text-slate-300 text-xs">
              {language === 'kk' 
                ? 'Достар мен отбасымен бірге прогресске қол жеткізіңіз!' 
                : 'Достигайте прогресса вместе с друзьями и семьей!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((circle) => (
              <div
                key={circle.circleId}
                onClick={() => loadCircleDetails(circle.circleId)}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-slate-800">{circle.name}</h3>
                  {circle.ownerId === userData.userId && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">
                      {language === 'kk' ? 'Иесі' : 'Владелец'}
                    </span>
                  )}
                </div>
                
                {circle.description && (
                  <p className="text-xs text-slate-400 mb-3">{circle.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>👥 {circle.members.filter((m: any) => m.status === 'active').length} {language === 'kk' ? 'мүше' : 'участников'}</span>
                  <span>🔑 {circle.inviteCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Вид: Детали круга с прогрессом
  return (
    <div className="space-y-6 pb-8 pt-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-2">
        <button
            onClick={() => {
                if (selectedCircle) {
                // Если внутри круга - вернуться к списку кругов
                setSelectedCircle(null);
                } else if (onNavigate) {
                // Если в списке кругов - вернуться в профиль
                onNavigate('profile');
                }
            }}
            className="text-slate-600 font-bold text-sm"
            >
            ← {language === 'kk' ? 'Артқа' : 'Назад'}
            </button>
        {selectedCircle.ownerId === userData.userId && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-black active:scale-95 transition-all"
          >
            + {language === 'kk' ? 'Шақыру' : 'Пригласить'}
          </button>
        )}
      </div>

      {/* Инфо о круге */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-[3rem] text-white shadow-xl">
        <h2 className="text-2xl font-black mb-2">{selectedCircle.name}</h2>
        {selectedCircle.description && (
          <p className="text-sm text-emerald-100 mb-4">{selectedCircle.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm">
          <span>👥 {selectedCircle.membersWithProgress?.length || 0} {language === 'kk' ? 'мүше' : 'участников'}</span>
          <span>🔑 {selectedCircle.inviteCode}</span>
        </div>
      </div>

      {/* Форма приглашения */}
      {showInviteForm && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-3">
            {language === 'kk' ? 'Қолданушыны шақыру' : 'Пригласить пользователя'}
          </h3>
          
          <input
            type="text"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            placeholder={language === 'kk' ? '@username' : '@username'}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:border-emerald-500"
          />
          
          <button
            onClick={handleInvite}
            disabled={!inviteUsername.trim()}
            className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {language === 'kk' ? 'Жіберу' : 'Отправить'}
          </button>
          
          {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
          {inviteSuccess && <p className="text-xs text-emerald-600 mt-2">{inviteSuccess}</p>}
        </div>
      )}

      {/* Real-time прогресс участников */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
          {language === 'kk' ? 'Бүгінгі прогресс' : 'Прогресс сегодня'}
        </h3>
        
        <div className="space-y-3">
          {selectedCircle.membersWithProgress?.map((member: any) => (
            <div
              key={member.userId}
              className={`p-4 rounded-2xl border ${
                member.userId === userData.userId
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-sm font-black">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {member.name}
                      {member.userId === userData.userId && (
                        <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md ml-1">
                          {language === 'kk' ? 'СІЗ' : 'ВЫ'}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {member.todayProgress.completed}/{member.todayProgress.total} {language === 'kk' ? 'тапсырма' : 'задач'}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-600">
                  {member.todayProgress.percent}%
                </span>
              </div>
              
              {/* Прогресс-бар */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${member.todayProgress.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CirclesView;
