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

  useEffect(() => {
    if (navigationData?.circleId && circles.length > 0) {
      const circle = circles.find(c => c._id === navigationData.circleId);
      if (circle) {
        setSelectedCircle(circle);
      }
    }
  }, [navigationData?.circleId, circles]);

  useEffect(() => {
    if (navigationData?.action === 'create') {
      setShowCreateForm(true);
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
        <div className="space-y-5 pb-8 pt-4">
          
          {/* 🎨 ТЕМНАЯ ШАПКА */}
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-[3rem] shadow-xl overflow-hidden">
            <div className="absolute -top-4 -right-4 text-[160px] opacity-5 pointer-events-none">🤝</div>
            
            <div className="relative z-10">
              <button 
                onClick={() => onNavigate?.(navigationData?.from || 'rewards')}
                className="text-white/60 hover:text-white font-bold text-sm transition-colors mb-4 flex items-center space-x-1"
              >
                <span>←</span>
                <span>{language === 'kk' ? 'Артқа' : 'Назад'}</span>
              </button>
              
              <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-1">
                {language === 'kk' ? 'МЕНІҢ ТОПТАРЫМ' : 'МОИ КРУГИ'}
              </h2>
              <p className="text-white/40 text-[10px] mb-6">
                {language === 'kk' ? 'Жақындарыңызбен бірге жарысыңыз' : 'Соревнуйтесь с близкими'}
              </p>
              
              {/* Кнопки действий */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowJoinForm(true)} 
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                >
                  <div className="text-lg mb-1">🔗</div>
                  <div className="text-[10px]">{language === 'kk' ? 'Кодпен қосылу' : 'По коду'}</div>
                </button>
                <button 
                  onClick={() => setShowCreateForm(true)} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg border border-emerald-400/30"
                >
                  <div className="text-lg mb-1">+</div>
                  <div className="text-[10px]">{language === 'kk' ? 'Топ ашу' : 'Создать'}</div>
                </button>
              </div>
            </div>
          </div>

          {/* 📝 ФОРМА СОЗДАНИЯ */}
          {showCreateForm && (
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-xl overflow-hidden border border-white/10">
              <div className="absolute -bottom-8 -right-8 text-[140px] opacity-5 pointer-events-none">✨</div>
              
              <div className="relative z-10">
                <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-5">
                  ✨ {language === 'kk' ? 'ЖАҢА ТОП АШУ' : 'СОЗДАТЬ НОВЫЙ КРУГ'}
                </h3>
                
                <input 
                  type="text" 
                  value={circleName} 
                  onChange={(e) => setCircleName(e.target.value)} 
                  placeholder={language === 'kk' ? 'Топтың атауы' : 'Название круга'} 
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:ring-2 ring-emerald-500 transition-all" 
                  maxLength={30} 
                />
                
                <textarea 
                  value={circleDescription} 
                  onChange={(e) => setCircleDescription(e.target.value)} 
                  placeholder={language === 'kk' ? 'Сипаттама (міндетті емес)' : 'Описание (необязательно)'} 
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-2xl px-4 py-3 text-sm font-bold mb-4 outline-none focus:ring-2 ring-emerald-500 transition-all resize-none" 
                  rows={3} 
                  maxLength={100} 
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { 
                      setShowCreateForm(false); 
                      setCircleName(''); 
                      setCircleDescription(''); 
                    }} 
                    className="bg-white/10 backdrop-blur-sm text-white/90 py-3 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                  >
                    {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                  </button>
                  <button 
                    onClick={handleCreateCircle} 
                    disabled={!circleName.trim()} 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-30 active:scale-95 transition-all shadow-lg border border-emerald-400/30"
                  >
                    {language === 'kk' ? 'Ашу' : 'Создать'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔗 ФОРМА ПРИСОЕДИНЕНИЯ */}
          {showJoinForm && (
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-xl overflow-hidden border border-white/10">
              <div className="absolute -bottom-8 -right-8 text-[140px] opacity-5 pointer-events-none">🔗</div>
              
              <div className="relative z-10">
                <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">
                  🔗 {language === 'kk' ? 'КОДПЕН ҚОСЫЛУ' : 'ПРИСОЕДИНИТЬСЯ'}
                </h3>
                <p className="text-white/40 text-[10px] mb-4">
                  {language === 'kk' ? 'Топтың 6 таңбалы кодын енгізіңіз' : 'Введите 6-значный код круга'}
                </p>
                
                <input 
                  type="text" 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
                  placeholder="A7B9C2" 
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/30 rounded-2xl px-4 py-4 text-center text-xl font-black tracking-[0.3em] mb-3 outline-none focus:ring-2 ring-teal-500 transition-all uppercase" 
                  maxLength={6} 
                />
                
                {joinError && <p className="text-xs text-red-400 mb-3 text-center font-bold">{joinError}</p>}
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { 
                      setShowJoinForm(false); 
                      setJoinCode(''); 
                      setJoinError(''); 
                    }} 
                    className="bg-white/10 backdrop-blur-sm text-white/90 py-3 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                  >
                    {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                  </button>
                  <button 
                    onClick={handleJoinByCode} 
                    disabled={joinCode.trim().length !== 6 || isJoining} 
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-30 active:scale-95 transition-all shadow-lg border border-teal-400/30"
                  >
                    {isJoining ? '...' : (language === 'kk' ? 'Қосылу' : 'Войти')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📋 СПИСОК КРУГОВ */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-white/60 text-sm font-bold">{language === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
            </div>
          ) : circles.length === 0 ? (
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-12 rounded-[3rem] text-center shadow-xl overflow-hidden border border-white/10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] opacity-5 pointer-events-none">🌟</div>
              
              <div className="relative z-10">
                <span className="text-7xl mb-4 block">🌟</span>
                <h3 className="text-white font-black text-lg mb-2">
                  {language === 'kk' ? 'Әзірше топтар жоқ' : 'Пока нет кругов'}
                </h3>
                <p className="text-white/40 text-sm max-w-[240px] mx-auto leading-relaxed">
                  {language === 'kk' 
                    ? 'Достар мен отбасымен бірге прогресске қол жеткізіңіз!' 
                    : 'Достигайте прогресса вместе с друзьями и семьей!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {circles.map((circle) => {
                const activeCount = circle.members.filter((m: any) => m.status === 'active').length;
                const isOwner = circle.ownerId === userData.userId;
                
                return (
                  <div 
                    key={circle.circleId} 
                    onClick={() => loadCircleDetails(circle.circleId)} 
                    className="relative bg-white p-5 rounded-[2.5rem] shadow-sm active:scale-[0.98] transition-all cursor-pointer overflow-hidden border border-slate-100 group hover:border-emerald-500 hover:shadow-lg"
                  >
                    {/* Декоративный эмодзи */}
                    <div className="absolute -right-6 -bottom-6 text-[100px] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                      {isOwner ? '👑' : '🤝'}
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-slate-800 font-black text-base mb-1 leading-tight">
                            {circle.name}
                          </h3>
                          {circle.description && (
                            <p className="text-slate-400 text-xs line-clamp-1 font-medium">
                              {circle.description}
                            </p>
                          )}
                        </div>
                        {isOwner && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-amber-300 flex-shrink-0 ml-2">
                            {language === 'kk' ? 'Иесі' : 'Владелец'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-[11px] font-bold">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">👥</span>
                          <span className="text-emerald-600">{activeCount}</span>
                          <span className="text-slate-400">{language === 'kk' ? 'адам' : 'чел.'}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">🔑</span>
                          <span className="text-slate-600 font-black tracking-wider">{circle.inviteCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // ============ ДЕТАЛИ КРУГА ============
  const stats = getCircleStats();
  const isOwner = selectedCircle.ownerId === userData.userId;
  const userMember = selectedCircle.members?.find((m: any) => m.userId === userData.userId);
  const isPending = userMember?.status === 'pending';
  
  return (
    <>
      <style>{spinReverseStyle}</style>
      <div className="space-y-5 pb-8 pt-4">

        {/* 🎨 ШАПКА ДЕТАЛЕЙ */}
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-[3rem] shadow-xl overflow-hidden">
          <div className="absolute -top-4 -right-4 text-[160px] opacity-5 pointer-events-none">
            {isOwner ? '👑' : '🤝'}
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSelectedCircle(null)} 
                className="text-white/60 hover:text-white font-bold text-sm transition-colors flex items-center space-x-1"
              >
                <span>←</span>
                <span>{language === 'kk' ? 'Артқа' : 'Назад'}</span>
              </button>
              
              {!isPending && (
                <>
                  {isOwner ? (
                    <button
                      onClick={() => {
                        setShowInviteModal(true);
                        setInviteModalStep('choice');
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg border border-emerald-400/30"
                    >
                      + {language === 'kk' ? 'Шақыру' : 'Пригласить'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleLeaveCircle} 
                      className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
                    >
                      🚪 {language === 'kk' ? 'Шығу' : 'Выйти'}
                    </button>
                  )}
                </>
              )}
            </div>
            
            <h2 className="text-white text-2xl font-black mb-2 leading-tight">
              {selectedCircle.name}
            </h2>
            {selectedCircle.description && (
              <p className="text-white/50 text-sm mb-4 font-medium leading-relaxed">
                {selectedCircle.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm font-bold">
              <div className="flex items-center space-x-1.5">
                <span className="text-white/40">👥</span>
                <span className="text-emerald-400">{selectedCircle.membersWithProgress?.length || 0}</span>
                <span className="text-white/40">{language === 'kk' ? 'адам' : 'чел.'}</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center space-x-1.5">
                <span className="text-white/40">🔑</span>
                <span className="text-white/70 font-black tracking-wider">{selectedCircle.inviteCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 СТАТИСТИКА */}
        {!isPending && (
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-xl overflow-hidden border border-white/10">
            <div className="absolute -bottom-8 -right-8 text-[140px] opacity-5 pointer-events-none">📊</div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-white font-black uppercase tracking-widest text-[10px]">
                  📊 {language === 'kk' ? 'СТАТИСТИКА' : 'СТАТИСТИКА'}
                </h4>
                <div className="flex items-center space-x-1.5">
                  <span 
                    className={`text-xs transition-all duration-300 ${isRefreshing ? 'text-emerald-400' : 'text-white/20'}`} 
                    style={isRefreshing ? { display: 'inline-block', animation: 'spin-reverse 1s linear infinite' } : {}}
                  >
                    🔄
                  </span>
                  <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
                    {language === 'kk' ? 'Авто' : 'Авто'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
                    {stats.averageProgress}%
                  </div>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                    {language === 'kk' ? 'Орташа' : 'Средний'}
                  </div>
                </div>
                
                <div className="text-center px-2">
                  <div className="text-sm font-black text-white mb-1 break-words line-clamp-2 leading-tight">
                    {stats.topMember ? stats.topMember.name.split(' ')[0] : '-'}
                  </div>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                    {language === 'kk' ? 'Үздік' : 'Лучший'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">
                    {stats.activeMembers}
                  </div>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                    {language === 'kk' ? 'Белсенді' : 'Активных'}
                  </div>
                </div>
              </div>
              
              {/* Прогресс-бар */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-1000 rounded-full" 
                  style={{ width: `${stats.averageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 📨 БАННЕР ПРИГЛАШЕНИЯ */}
        {isPending && (
          <div className="relative bg-gradient-to-br from-amber-900/40 to-orange-900/40 backdrop-blur-sm p-6 rounded-[2.5rem] overflow-hidden border-2 border-amber-500/30">
            <div className="absolute -bottom-8 -right-8 text-[140px] opacity-10 pointer-events-none">📨</div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-5">
                <span className="text-5xl">📨</span>
                <div className="flex-1">
                  <h3 className="text-amber-200 font-black text-lg mb-1">
                    {language === 'kk' ? 'Сізге шақыру келді!' : 'Вы приглашены!'}
                  </h3>
                  <p className="text-amber-300/80 text-sm font-medium">
                    {language === 'kk' ? 'Осы топқа қосылғыңыз келе ме?' : 'Хотите присоединиться к этому кругу?'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDeclineInvite} 
                  className="bg-white/10 backdrop-blur-sm text-white/90 py-3 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                >
                  ❌ {language === 'kk' ? 'Бас тарту' : 'Отклонить'}
                </button>
                <button 
                  onClick={handleAcceptInvite} 
                  disabled={isAcceptingInvite}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg border border-emerald-400/30 disabled:opacity-50"
                >
                  ✅ {language === 'kk' ? 'Қабылдау' : 'Принять'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 👥 УЧАСТНИКИ */}
        {!isPending && (
          <div className="relative bg-white p-6 rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
            <div className="absolute -bottom-8 -right-8 text-[140px] opacity-5 pointer-events-none">👥</div>
            
            <div className="relative z-10">
              <h3 className="text-slate-800 font-black uppercase tracking-widest text-[10px] mb-5">
                👥 {language === 'kk' ? 'ҚАТЫСУШЫЛАР' : 'УЧАСТНИКИ'}
              </h3>
              
              <div className="space-y-3 mb-5">
                {selectedCircle.membersWithProgress?.map((member: any, index: number) => {
                  const isCurrentUser = member.userId === userData.userId;
                  const rank = index + 1;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                  
                  return (
                    <div 
                      key={member.userId} 
                      className={`relative p-4 rounded-[2rem] transition-all border ${
                        isCurrentUser 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center text-base font-black text-slate-700 flex-shrink-0 border border-slate-300">
                            {medal || member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-black text-sm truncate">
                              {member.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                                  {language === 'kk' ? 'СІЗ' : 'ВЫ'}
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-[10px] font-bold">
                              {member.todayProgress.completed}/{member.todayProgress.total} {language === 'kk' ? 'тапсырма' : 'задач'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xl font-black bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            {member.todayProgress.percent}%
                          </span>
                          {isOwner && !isCurrentUser && (
                            <button 
                              onClick={() => handleRemoveMember(member.userId)} 
                              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-black active:scale-95 transition-all border border-red-500/30" 
                              title={language === 'kk' ? 'Жою' : 'Удалить'}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Прогресс-бар */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full" 
                          style={{ width: `${member.todayProgress.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Кнопки владельца */}
              {isOwner && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => {
                      setShowInviteModal(true);
                      setInviteModalStep('choice');
                    }} 
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg border border-emerald-400/30"
                  >
                    + {language === 'kk' ? 'Шақыру' : 'Пригласить'}
                  </button>
                  
                  <button 
                    onClick={handleDeleteCircle} 
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg"
                  >
                    🗑️ {language === 'kk' ? 'Топты жою' : 'Удалить круг'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 📤 МОДАЛЬНОЕ ОКНО ПРИГЛАШЕНИЯ */}
        {showInviteModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" 
            onClick={() => {
              setShowInviteModal(false);
              setInviteModalStep('choice');
              setInviteUsername('');
              setInviteError('');
              setInviteSuccess('');
            }}
          >
            <div 
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl border border-white/10 animate-in zoom-in slide-in-from-bottom-4 duration-300" 
              onClick={(e) => e.stopPropagation()}
            >
              
              {inviteModalStep === 'choice' && (
                <>
                  <h3 className="text-white font-black text-lg mb-6 text-center">
                    {language === 'kk' ? 'Шақыру жіберу' : 'Отправить приглашение'}
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        handleShareInvite();
                        setShowInviteModal(false);
                      }}
                      className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        📤
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black">{language === 'kk' ? 'Telegram арқылы' : 'Через Telegram'}</p>
                        <p className="text-xs text-blue-200 font-medium">{language === 'kk' ? 'Жеке хабарлама' : 'Личное сообщение'}</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setInviteModalStep('username')}
                      className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black">{language === 'kk' ? 'Username арқылы' : 'По username'}</p>
                        <p className="text-xs text-emerald-200 font-medium">{language === 'kk' ? '@username енгізу' : 'Введите @username'}</p>
                      </div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full mt-4 py-3 bg-white/10 backdrop-blur-sm text-white/90 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                  >
                    {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                  </button>
                </>
              )}
              
              {inviteModalStep === 'username' && (
                <>
                  <button
                    onClick={() => {
                      setInviteModalStep('choice');
                      setInviteUsername('');
                      setInviteError('');
                      setInviteSuccess('');
                    }}
                    className="text-white/60 hover:text-white font-bold text-sm mb-4 transition-colors"
                  >
                    ← {language === 'kk' ? 'Артқа' : 'Назад'}
                  </button>
                  
                  <h3 className="text-white font-black text-lg mb-2">
                    {language === 'kk' ? 'Username енгізіңіз' : 'Введите username'}
                  </h3>
                  <p className="text-white/40 text-xs mb-4">
                    {language === 'kk' ? 'Telegram username' : 'Telegram username'}
                  </p>
                  
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm font-bold mb-3 outline-none focus:ring-2 ring-emerald-500 transition-all"
                    autoFocus
                  />
                  
                  {inviteError && <p className="text-xs text-red-400 mb-3 font-bold">{inviteError}</p>}
                  {inviteSuccess && <p className="text-xs text-emerald-400 mb-3 font-bold">{inviteSuccess}</p>}
                  
                  <button
                    onClick={handleInvite}
                    disabled={!inviteUsername.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-30 active:scale-95 transition-all shadow-lg border border-emerald-400/30"
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