import React, { useState, useEffect } from 'react';
import { Language, UserData } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { getUserCircles, getCircleDetails, createCircle, inviteToCircle } from '../src/services/api';

interface CirclesViewProps {
  userData: UserData;
  language: Language;
  onNavigate?: (view: string, data?: any) => void;
  navigationData?: { from?: string; circleId?: string; action?: string };
}

// CSS для вращения против часовой стрелки
const spinReverseStyle = `
  @keyframes spin-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
`;

const CirclesView: React.FC<CirclesViewProps> = ({ userData, language, onNavigate, navigationData }) => {
  const t = TRANSLATIONS[language];
  
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalStep, setInviteModalStep] = useState<'choice' | 'username'>('choice');
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // ✅ Автооткрытие круга если передан circleId
  useEffect(() => {
    if (navigationData?.circleId && circles.length > 0) {
      const circle = circles.find(c => c._id === navigationData.circleId);
      if (circle) {
        setSelectedCircle(circle);
        setShowDetails(true);
      }
    }
  }, [navigationData?.circleId, circles]);

  // ✅ Автооткрытие формы создания
  useEffect(() => {
    if (navigationData?.action === 'create') {
      setShowCreateModal(true);
    }
  }, [navigationData?.action]);

  useEffect(() => {
    loadCircles();
  }, [userData.userId]);

  useEffect(() => {
    if (!selectedCircle) return;
    const intervalId = setInterval(() => {
      refreshCircleDetails(selectedCircle.circleId);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [selectedCircle?.circleId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showInviteMenu) {
        setShowInviteMenu(false);
      }
    };
    if (showInviteMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showInviteMenu]);

  const loadCircles = async () => {
    setIsLoading(true);
    const userCircles = await getUserCircles(userData.userId);
    setCircles(userCircles || []);
    setIsLoading(false);
  };

  const loadCircleDetails = async (circleId: string) => {
    const details = await getCircleDetails(circleId, userData.userId);
    setSelectedCircle(details);
  };

  const refreshCircleDetails = async (circleId: string) => {
    try {
      setIsRefreshing(true);
      const details = await getCircleDetails(circleId, userData.userId);
      setSelectedCircle(details);
    } catch (error) {
      console.error('❌ Ошибка обновления:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !selectedCircle) return;
    setInviteError('');
    setInviteSuccess('');
    try {
      await inviteToCircle(selectedCircle.circleId, userData.userId, inviteUsername);
      setInviteSuccess(language === 'kk' ? 'Шақыру жіберілді!' : 'Приглашение отправлено!');
      setInviteUsername('');
      setTimeout(() => {
        loadCircleDetails(selectedCircle.circleId);
        setInviteSuccess('');
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || (language === 'kk' ? 'Қате орын алды' : 'Произошла ошибка'));
    }
  };

  const handleAcceptInvite = async () => {
    if (!selectedCircle || isAcceptingInvite) return;
    setIsAcceptingInvite(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleId: selectedCircle.circleId,
          userId: userData.userId
        })
      });
      if (!response.ok) throw new Error('Failed to accept invite');
      await loadCircleDetails(selectedCircle.circleId);
    } catch (error) {
      alert(language === 'kk' ? 'Қате шықты' : 'Произошла ошибка');
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!selectedCircle) return;
    const confirmed = confirm(language === 'kk' ? 'Шақыруды бас тартқыңыз келетініне сенімдісіз бе?' : 'Вы уверены что хотите отклонить приглашение?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: selectedCircle.circleId, userId: userData.userId })
      });
      if (!response.ok) throw new Error('Failed to decline invite');
      setSelectedCircle(null);
      loadCircles();
    } catch (error) {
      alert(language === 'kk' ? 'Қате шықты' : 'Произошла ошибка');
    }
  };

  const handleLeaveCircle = async () => {
    if (!selectedCircle) return;
    const confirmed = confirm(language === 'kk' ? 'Топтан шығуға сенімдісіз бе?' : 'Вы уверены что хотите выйти из круга?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: selectedCircle.circleId, userId: userData.userId })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave circle');
      }
      setSelectedCircle(null);
      loadCircles();
    } catch (error: any) {
      if (error.message.includes('Owner cannot leave')) {
        alert(language === 'kk' ? 'Иесі топтан шыға алмайды. Топты жойыңыз.' : 'Владелец не может выйти из круга. Удалите круг.');
      } else {
        alert(language === 'kk' ? 'Қате шықты' : 'Произошла ошибка');
      }
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    if (!selectedCircle) return;
    const confirmed = confirm(language === 'kk' ? 'Қатысушыны шынымен жойғыңыз келе ме?' : 'Вы уверены что хотите удалить этого участника?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: selectedCircle.circleId, ownerId: userData.userId, targetUserId })
      });
      if (!response.ok) throw new Error('Failed to remove member');
      await loadCircleDetails(selectedCircle.circleId);
    } catch (error) {
      alert(language === 'kk' ? 'Қате шықты' : 'Произошла ошибка');
    }
  };

  const handleDeleteCircle = async () => {
    if (!selectedCircle) return;
    const confirmed = confirm(language === 'kk' ? 'Топты толығымен жойғыңыз келетініне сенімдісіз бе? Бұл әрекетті қайтару мүмкін емес!' : 'Вы уверены что хотите удалить круг? Это действие нельзя отменить!');
    if (!confirmed) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: selectedCircle.circleId, ownerId: userData.userId })
      });
      if (!response.ok) throw new Error('Failed to delete circle');
      setSelectedCircle(null);
      loadCircles();
    } catch (error) {
      alert(language === 'kk' ? 'Қате шықты' : 'Произошла ошибка');
    }
  };

  const getCircleStats = () => {
    if (!selectedCircle?.membersWithProgress || selectedCircle.membersWithProgress.length === 0) {
      return { averageProgress: 0, topMember: null, activeMembers: 0 };
    }
    const members = selectedCircle.membersWithProgress;
    const totalProgress = members.reduce((sum: number, m: any) => sum + m.todayProgress.percent, 0);
    const averageProgress = Math.round(totalProgress / members.length);
    const topMember = members.reduce((best: any, current: any) => {
      return current.todayProgress.percent > best.todayProgress.percent ? current : best;
    }, members[0]);
    const activeMembers = members.filter((m: any) => m.todayProgress.completed > 0).length;
    return { averageProgress, topMember, activeMembers };
  };

  const handleShareInvite = () => {
    if (!selectedCircle) return;
    const shareText = 
      `🤝 ${language === 'kk' ? 'ImanTap-та менің тобыма қосыл!' : 'Присоединяйся к моему кругу в ImanTap!'}!\n\n` +
      `📝 "${selectedCircle.name}"\n` +
      (selectedCircle.description ? `💬 ${selectedCircle.description}\n` : '') +
      `🔑 ${language === 'kk' ? 'Код' : 'Код'}: ${selectedCircle.inviteCode}\n\n` +
      `${language === 'kk' ? '@imantap_bot Telegram боты арқылы тіркел!' : 'Регистрируйся через бот @imantap_bot в Telegram!'}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${process.env.BOT_USERNAME || 'imantap_bot'}`)}&text=${encodeURIComponent(shareText)}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || isJoining) return;
    setJoinError('');
    setIsJoining(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/circles/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase(), userId: userData.userId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to join circle');
      setShowJoinForm(false);
      setJoinCode('');
      await loadCircles();
      if (data.circle?.circleId) {
        await loadCircleDetails(data.circle.circleId);
      }
    } catch (error: any) {
      setJoinError(
        error.message === 'Circle not found' ? (language === 'kk' ? 'Код табылмады' : 'Код не найден') :
        error.message === 'Already a member' ? (language === 'kk' ? 'Сіз бұл топтың қатысушысысыз' : 'Вы уже участник этого круга') :
        (language === 'kk' ? 'Қате орын алды' : 'Произошла ошибка')
      );
    } finally {
      setIsJoining(false);
    }
  };

  // ============ СПИСОК КРУГОВ ============
  if (!selectedCircle) {
    return (
      <>
        <style>{spinReverseStyle}</style>
        <div className="space-y-6 pb-8 pt-4">
          
          {/* Шапка */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🤝</div>
            <div className="relative z-10">
              <button onClick={() => onNavigate?.(navigationData?.from || 'rewards')}>
                ← {language === 'kk' ? 'Артқа' : 'Назад'}
              </button>
              <h2 className="text-2xl font-black mb-6">{language === 'kk' ? 'Менің топтарым' : 'Мои круги'}</h2>
              
              <div className="flex space-x-2">
                <button onClick={() => setShowJoinForm(true)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-3 rounded-2xl text-sm font-black active:scale-95 transition-all">
                  🔗 {language === 'kk' ? 'Кодпен қосылу' : 'По коду'}
                </button>
                <button onClick={() => setShowCreateForm(true)} className="flex-1 bg-white text-emerald-700 px-4 py-3 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-lg">
                  + {language === 'kk' ? 'Жаңа топ' : 'Новый круг'}
                </button>
              </div>
            </div>
          </div>

          {/* Форма создания */}
          {showCreateForm && (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                {language === 'kk' ? 'Жаңа топ қосу' : 'Добавить новый круг'}
              </h3>
              <input type="text" value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder={language === 'kk' ? 'Топтың атауы' : 'Название круга'} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:ring-2 ring-emerald-500 transition-all" maxLength={30} />
              <textarea value={circleDescription} onChange={(e) => setCircleDescription(e.target.value)} placeholder={language === 'kk' ? 'Сипаттама (міндетті емес)' : 'Описание (необязательно)'} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold mb-4 outline-none focus:ring-2 ring-emerald-500 transition-all resize-none" rows={3} maxLength={100} />
              <div className="flex space-x-2">
                <button onClick={handleCreateCircle} disabled={!circleName.trim()} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg">
                  {language === 'kk' ? 'Қосу' : 'Добавить'}
                </button>
                <button onClick={() => { setShowCreateForm(false); setCircleName(''); setCircleDescription(''); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">
                  {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                </button>
              </div>
            </div>
          )}

          {/* Форма присоединения */}
          {showJoinForm && (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {language === 'kk' ? '🔗 Кодпен қосылу' : '🔗 Присоединиться по коду'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{language === 'kk' ? 'Топтың 6 таңбалы кодын енгізіңіз' : 'Введите 6-значный код круга'}</p>
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="A7B9C2" className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest mb-3 outline-none focus:ring-2 ring-teal-500 transition-all uppercase" maxLength={6} />
              {joinError && <p className="text-xs text-red-500 mb-3 text-center">{joinError}</p>}
              <div className="flex space-x-2">
                <button onClick={handleJoinByCode} disabled={joinCode.trim().length !== 6 || isJoining} className="flex-1 bg-teal-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg">
                  {isJoining ? '...' : (language === 'kk' ? 'Қосылу' : 'Присоединиться')}
                </button>
                <button onClick={() => { setShowJoinForm(false); setJoinCode(''); setJoinError(''); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">
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
            <div className="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-slate-100">
              <span className="text-6xl mb-4 block">🤝</span>
              <p className="text-slate-400 text-sm mb-2 font-bold">{language === 'kk' ? 'Әзірге топтар жоқ' : 'Пока нет кругов'}</p>
              <p className="text-slate-300 text-xs">{language === 'kk' ? 'Достар мен отбасымен бірге прогресске қол жеткізіңіз!' : 'Достигайте прогресса вместе с друзьями и семьей!'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {circles.map((circle) => (
                <div key={circle.circleId} onClick={() => loadCircleDetails(circle.circleId)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-slate-800">{circle.name}</h3>
                    {circle.ownerId === userData.userId && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black uppercase tracking-wider">{language === 'kk' ? 'Иесі' : 'Владелец'}</span>
                    )}
                  </div>
                  {circle.description && <p className="text-xs text-slate-400 mb-3">{circle.description}</p>}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 font-bold">
                    <span>👥 {circle.members.filter((m: any) => m.status === 'active').length} {language === 'kk' ? 'қатысушы' : 'участников'}</span>
                    <span>🔑 {circle.inviteCode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // ============ ДЕТАЛИ КРУГА ============
  const stats = getCircleStats();
  
  return (
    <>
      <style>{spinReverseStyle}</style>
      <div className="space-y-6 pb-8 pt-4">

        {/* Компактная шапка */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">🤝</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedCircle(null)} className="text-white/80 hover:text-white font-bold text-sm transition-colors">
                ← {language === 'kk' ? 'Артқа' : 'Назад'}
              </button>
              
              {/* Кнопки действий */}
              <div className="relative">
                {selectedCircle.ownerId === userData.userId ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInviteModal(true);
                        setInviteModalStep('choice');
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-black active:scale-95 transition-all"
                    >
                      + {language === 'kk' ? 'Шақыру' : 'Пригласить'}
                    </button>
                  </>
                ) : (
                  <button onClick={handleLeaveCircle} className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black active:scale-95 transition-all">
                    🚪 {language === 'kk' ? 'Шығу' : 'Выйти'}
                  </button>
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-black mb-2">{selectedCircle.name}</h2>
            {selectedCircle.description && <p className="text-sm text-emerald-100 mb-3 font-medium">{selectedCircle.description}</p>}
            <div className="flex items-center space-x-4 text-sm font-bold">
              <span>👥 {selectedCircle.membersWithProgress?.length || 0} {language === 'kk' ? 'қатысушы' : 'участников'}</span>
              <span>🔑 {selectedCircle.inviteCode}</span>
            </div>
          </div>
        </div>

        {/* Статистика - ТЕМНАЯ ВЕРСИЯ */}
        <div className="bg-slate-900 p-6 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">📊</div>
          <div className="relative z-10">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-4">
              {language === 'kk' ? 'Топтың статистикасы' : 'Статистика круга'}
            </h4>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-black">{stats.averageProgress}%</p>
                <p className="text-[9px] font-black text-white/60 uppercase mt-1">{language === 'kk' ? 'Орташа' : 'Средний'}</p>
              </div>
              <div className="text-center px-2">
                <p className="text-sm font-black break-words line-clamp-2 leading-tight">
                  {stats.topMember ? stats.topMember.name.split(' ')[0] : '-'}
                </p>
                <p className="text-[9px] font-black text-white/60 uppercase mt-1">{language === 'kk' ? 'Үздік' : 'Лучший'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black">{stats.activeMembers}</p>
                <p className="text-[9px] font-black text-white/60 uppercase mt-1">{language === 'kk' ? 'Белсенді' : 'Активных'}</p>
              </div>
            </div>
            
            {/* Прогресс-бар среднего прогресса */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${stats.averageProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Баннер приглашения */}
        {selectedCircle.members?.find(m => m.userId === userData.userId)?.status === 'pending' && (
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2.5rem]">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📨</span>
              <div>
                <h3 className="text-lg font-black text-amber-900">{language === 'kk' ? 'Сізге шақыру келді!' : 'Вы приглашены!'}</h3>
                <p className="text-sm text-amber-700 font-medium">{language === 'kk' ? 'Осы топқа қосылғыңыз келе ме?' : 'Хотите присоединиться к этому кругу?'}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleAcceptInvite} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg">
                ✅ {language === 'kk' ? 'Қабылдау' : 'Принять'}
              </button>
              <button onClick={handleDeclineInvite} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">
                ❌ {language === 'kk' ? 'Бас тарту' : 'Отклонить'}
              </button>
            </div>
          </div>
        )}

        {/* Участники */}
        <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'kk' ? 'Қатысушылар' : 'Участники'}
            </h3>
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs transition-all duration-300 ${isRefreshing ? 'text-emerald-600' : 'text-slate-300'}`} style={isRefreshing ? { display: 'inline-block', animation: 'spin-reverse 1s linear infinite' } : {}}>
                🔄
              </span>
              <span className="text-[9px] text-slate-300 font-bold">{language === 'kk' ? 'Авто' : 'Авто'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {selectedCircle.membersWithProgress?.map((member: any) => (
              <div key={member.userId} className={`p-4 rounded-[2rem] border transition-all ${member.userId === userData.userId ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-sm font-black">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {member.name}
                        {member.userId === userData.userId && (
                          <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md ml-1 font-black">{language === 'kk' ? 'СІЗ' : 'ВЫ'}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {member.todayProgress.completed}/{member.todayProgress.total} {language === 'kk' ? 'тапсырма' : 'задач'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black text-emerald-600">{member.todayProgress.percent}%</span>
                    {selectedCircle.ownerId === userData.userId && member.userId !== userData.userId && (
                      <button onClick={() => handleRemoveMember(member.userId)} className="w-8 h-8 bg-red-100 text-red-600 rounded-xl text-xs font-black active:scale-95 transition-all hover:bg-red-200" title={language === 'kk' ? 'Жою' : 'Удалить'}>
                        ❌
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${member.todayProgress.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Кнопки владельца */}
          {selectedCircle.ownerId === userData.userId && (
            <div className="space-y-2 mt-4">
              {/* Кнопка пригласить */}
              <button 
                onClick={() => {
                  setShowInviteModal(true);
                  setInviteModalStep('choice');
                }} 
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all hover:bg-emerald-700 shadow-lg"
              >
                + {language === 'kk' ? 'Шақыру' : 'Пригласить'}
              </button>
              
              {/* Кнопка удалить круг */}
              <button 
                onClick={handleDeleteCircle} 
                className="w-full px-6 py-3 bg-red-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all hover:bg-red-600 shadow-lg"
              >
                🗑️ {language === 'kk' ? 'Топты жою' : 'Удалить круг'}
              </button>
            </div>
          )}
        </div>
        {/* Модальное окно приглашения */}
        {showInviteModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => {
              setShowInviteModal(false);
              setInviteModalStep('choice');
              setInviteUsername('');
              setInviteError('');
              setInviteSuccess('');
            }}
          >
            <div 
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300" 
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Выбор способа */}
              {inviteModalStep === 'choice' && (
                <>
                  <h3 className="text-lg font-black text-slate-800 mb-6 text-center">
                    {language === 'kk' ? 'Шақыру жіберу' : 'Отправить приглашение'}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Кнопка 1: Поделиться */}
                    <button
                      onClick={() => {
                        handleShareInvite();
                        setShowInviteModal(false);
                      }}
                      className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-[1.5rem] font-bold text-sm active:scale-95 transition-all shadow-lg"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                        📤
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black">{language === 'kk' ? 'Жеке хабарлама жіберу' : 'Отправить личное сообщение'}</p>
                        <p className="text-xs text-blue-100 font-medium">{language === 'kk' ? 'Telegram арқылы' : 'Через Telegram'}</p>
                      </div>
                    </button>
                    
                    {/* Кнопка 2: По username */}
                    <button
                      onClick={() => setInviteModalStep('username')}
                      className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[1.5rem] font-bold text-sm active:scale-95 transition-all shadow-lg"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black">{language === 'kk' ? 'Username арқылы' : 'По username'}</p>
                        <p className="text-xs text-emerald-100 font-medium">{language === 'kk' ? '@username енгізіңіз' : 'Введите @username'}</p>
                      </div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full mt-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm active:scale-95 transition-all"
                  >
                    {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                  </button>
                </>
              )}
              
              {/* Форма ввода username */}
              {inviteModalStep === 'username' && (
                <>
                  <button
                    onClick={() => {
                      setInviteModalStep('choice');
                      setInviteUsername('');
                      setInviteError('');
                      setInviteSuccess('');
                    }}
                    className="text-slate-600 hover:text-slate-800 font-bold text-sm mb-4 transition-colors"
                  >
                    ← {language === 'kk' ? 'Артқа' : 'Назад'}
                  </button>
                  
                  <h3 className="text-lg font-black text-slate-800 mb-2">
                    {language === 'kk' ? 'Username енгізіңіз' : 'Введите username'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {language === 'kk' ? 'Telegram username арқылы шақыру жіберу' : 'Отправить приглашение по Telegram username'}
                  </p>
                  
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:ring-2 ring-emerald-500 transition-all"
                    autoFocus
                  />
                  
                  {inviteError && <p className="text-xs text-red-500 mb-3">{inviteError}</p>}
                  {inviteSuccess && <p className="text-xs text-emerald-600 mb-3">{inviteSuccess}</p>}
                  
                  <button
                    onClick={handleInvite}
                    disabled={!inviteUsername.trim()}
                    className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg"
                  >
                    {language === 'kk' ? 'Жіберу' : 'Отправить'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CirclesView;
