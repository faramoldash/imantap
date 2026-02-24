import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language, UserData } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { createCircle, inviteToCircle, getUserData } from '../src/services/api';
import { useUserCircles } from '../src/hooks/useUserCircles';


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

const RAMADAN_TASKS_INFO = [
  { key: 'fasting',      emoji: '🌙', kk: 'Ораза',        ru: 'Пост' },
  { key: 'tahajjud',     emoji: '🌃', kk: 'Тахаджуд',     ru: 'Тахаджуд' },
  { key: 'fajr',         emoji: '🕌', kk: 'Таң',       ru: 'Фаджр' },
  { key: 'morningDhikr', emoji: '☀️', kk: 'Таңғы зікір', ru: 'Утр. зикр' },
  { key: 'quranRead',    emoji: '📖', kk: 'Құран',        ru: 'Коран' },
  { key: 'names99',      emoji: '📿', kk: '99 есім',      ru: '99 имён' },
  { key: 'salawat',      emoji: '✨', kk: 'Салауат',      ru: 'Салауат' },
  { key: 'hadith',       emoji: '📚', kk: 'Хадис',        ru: 'Хадис' },
  { key: 'duha',         emoji: '🌅', kk: 'Дұха',        ru: 'Духа' },
  { key: 'charity',      emoji: '💎', kk: 'Садақа',       ru: 'Садака' },
  { key: 'dhuhr',        emoji: '🕌', kk: 'Бесін',        ru: 'Зухр' },
  { key: 'lessons',      emoji: '🎓', kk: 'Дәрістер',     ru: 'Уроки' },
  { key: 'asr',          emoji: '🕌', kk: 'Екінті',       ru: 'Аср' },
  { key: 'book',         emoji: '📗', kk: 'Кітап',        ru: 'Книга' },
  { key: 'eveningDhikr', emoji: '🌆', kk: 'Кешкі зікір', ru: 'Веч. зикр' },
  { key: 'maghrib',      emoji: '🌇', kk: 'Ақшам',        ru: 'Магриб' },
  { key: 'isha',         emoji: '🌙', kk: 'Құптан',       ru: 'Иша' },
  { key: 'taraweeh',     emoji: '⭐', kk: 'Тарауих',      ru: 'Таравих' },
  { key: 'witr',         emoji: '🌟', kk: 'Үтір',        ru: 'Витр' },
];

const CirclesView: React.FC<CirclesViewProps> = ({ userData, language, onNavigate, navigationData }) => {
  const t = TRANSLATIONS[language];
  const {
    circles,
    selectedCircle,
    setSelectedCircle,
    isLoadingCircles,
    isRefreshingCircle,
    loadCircles,
    loadCircleDetails,
  } = useUserCircles(userData.userId);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  type CirclesModal =
    | { type: 'none' }
    | { type: 'create' }
    | { type: 'join' }
    | { type: 'invite-choice' }
    | { type: 'invite-username' };

  const [modal, setModal] = useState<CirclesModal>({ type: 'none' });
  
  // 19 ибадат-задач Рамадана (те же что считает бэкенд)
  const RAMADAN_TASKS = [
    'fasting', 'tahajjud', 'fajr', 'morningDhikr', 'quranRead',
    'names99', 'salawat', 'hadith', 'duha', 'charity', 'dhuhr',
    'lessons', 'asr', 'book', 'eveningDhikr', 'maghrib', 'isha',
    'taraweeh', 'witr'
  ];

  // ✅ Локальный расчёт прогресса — мгновенно, без ожидания API
  const getMyLocalProgress = useCallback(() => {
    // Вычисляем текущий день Рамадана из startDate
    const [sy, sm, sd] = userData.startDate.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const ramadanDay = diffDays >= 0 ? diffDays + 1 : null;

    // Рамадан идёт — считаем 19 ибадат-задач
    if (ramadanDay) {
      const dayProgress = (userData.progress[ramadanDay] || {}) as any;
      const total = RAMADAN_TASKS.length; // 19
      const completed = RAMADAN_TASKS.filter(key => dayProgress[key] === true).length;
      const percent = Math.round((completed / total) * 100);
      return { completed, total, percent };
    }

    // До Рамадана — считаем customTasks + цели
    const customTasks = userData.customTasks || [];
    let totalGoals = customTasks.length;
    let completedGoals = customTasks.filter((t: any) => t.completed).length;
    const today = new Date().toISOString().split('T')[0];
    const basicToday = (userData.basicProgress as any)?.[today];
    if ((userData.dailyQuranGoal || 0) > 0) {
      totalGoals++;
      if ((basicToday?.quranPages || 0) >= (userData.dailyQuranGoal || 1)) completedGoals++;
    }
    if ((userData.dailyCharityGoal || 0) > 0) {
      totalGoals++;
      if ((basicToday?.charityAmount || 0) >= (userData.dailyCharityGoal || 1)) completedGoals++;
    }
    const percent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    return { completed: completedGoals, total: totalGoals, percent };
  }, [userData.progress, userData.startDate, userData.customTasks, userData.basicProgress, userData.dailyQuranGoal, userData.dailyCharityGoal]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [memberDetailModal, setMemberDetailModal] = useState<{ member: any; tasks: any } | null>(null);
  const [isLoadingMemberDetail, setIsLoadingMemberDetail] = useState(false);


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
      setModal({ type: 'create' });
    } else if (navigationData?.action === 'join') {
      setModal({ type: 'join' });
    }
  }, [navigationData?.action, setModal]);

  // ✅ Обновляем круг через 6 секунд после изменения задач пользователя
  useEffect(() => {
    if (!selectedCircle?.circleId) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      loadCircleDetails(selectedCircle.circleId);
    }, 6000);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [userData.customTasks, userData.basicProgress]);

  const handleMemberTap = async (member: any) => {
    const isCurrentUser = member.userId === userData.userId;
    // Вычисляем день Рамадана
    const [sy, sm, sd] = userData.startDate.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const ramadanDay = diffDays >= 0 ? diffDays + 1 : null;

    if (isCurrentUser) {
      // Для себя — локальные данные, без API
      const tasks = ramadanDay ? (userData.progress[ramadanDay] || {}) : {};
      setMemberDetailModal({ member, tasks });
    } else {
      // Для других — загружаем с сервера
      setIsLoadingMemberDetail(true);
      setMemberDetailModal({ member, tasks: null });
      try {
        const memberData = await getUserData(member.userId);
        const tasks = ramadanDay && memberData?.progress
          ? (memberData.progress[ramadanDay] || {})
          : {};
        setMemberDetailModal({ member, tasks });
      } catch {
        setMemberDetailModal({ member, tasks: {} });
      } finally {
        setIsLoadingMemberDetail(false);
      }
    }
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) return;
    const newCircle = await createCircle(userData.userId, circleName, circleDescription);
    if (newCircle) {
      setModal({ type: 'none' });
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
    // ✅ Для текущего юзера берём локальный прогресс
    const myLocal = getMyLocalProgress();
    const members = selectedCircle.membersWithProgress.map((m: any) => ({
      ...m,
      todayProgress: m.userId === userData.userId ? myLocal : m.todayProgress
    }));
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
      setModal({ type: 'none' });
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
                  onClick={() => setModal({ type: 'join' })}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                >
                  <div className="text-lg mb-1">🔗</div>
                  <div className="text-[10px]">{language === 'kk' ? 'Кодпен қосылу' : 'По коду'}</div>
                </button>
                <button 
                  onClick={() => setModal({ type: 'create' })}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg border border-emerald-400/30"
                >
                  <div className="text-lg mb-1">+</div>
                  <div className="text-[10px]">{language === 'kk' ? 'Топ ашу' : 'Создать'}</div>
                </button>
              </div>
            </div>
          </div>

          {/* 📝 ФОРМА СОЗДАНИЯ */}
          {modal.type === 'create' && (
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
                      setModal({ type: 'none' }); 
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
          {modal.type === 'join' && (
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
                      setModal({ type: 'none' }); 
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
          {isLoadingCircles ? (
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
                        setModal({ type: 'invite-choice' });
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
                    className={`text-xs transition-all duration-300 ${isRefreshingCircle ? 'text-emerald-400' : 'text-white/20'}`} 
                    style={isRefreshingCircle ? { display: 'inline-block', animation: 'spin-reverse 1s linear infinite' } : {}}
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
                  // ✅ Для себя — локальные данные, для других — с сервера
                  const progressToShow = isCurrentUser ? getMyLocalProgress() : member.todayProgress;
                  const rank = index + 1;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                  
                  return (
                    <div 
                      key={member.userId}
                      onClick={() => handleMemberTap(member)}
                      className={`relative p-4 rounded-[2rem] transition-all border cursor-pointer active:scale-[0.98] ${
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
                              {progressToShow.completed}/{progressToShow.total} {language === 'kk' ? 'тапсырма' : 'задач'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xl font-black bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            {progressToShow.percent}%
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
                          style={{ width: `${progressToShow.percent}%` }}
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
                      setModal({ type: 'invite-choice' });
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
        {(modal.type === 'invite-choice' || modal.type === 'invite-username') && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" 
            onClick={() => {
              setModal({ type: 'none' });
              setInviteUsername('');
              setInviteError('');
              setInviteSuccess('');
            }}
          >
            <div 
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl border border-white/10 animate-in zoom-in slide-in-from-bottom-4 duration-300" 
              onClick={(e) => e.stopPropagation()}
            >
              
              {modal.type === 'invite-choice' && (
                <>
                  <h3 className="text-white font-black text-lg mb-6 text-center">
                    {language === 'kk' ? 'Шақыру жіберу' : 'Отправить приглашение'}
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        handleShareInvite();
                        setModal({ type: 'none' });
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
                      onClick={() => setModal({ type: 'invite-username' })}
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
                    onClick={() => setModal({ type: 'none' })}
                    className="w-full mt-4 py-3 bg-white/10 backdrop-blur-sm text-white/90 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all border border-white/20"
                  >
                    {language === 'kk' ? 'Болдырмау' : 'Отмена'}
                  </button>
                </>
              )}
              
              {modal.type === 'invite-username' && (
                <>
                  <button
                    onClick={() => {
                      setModal({ type: 'invite-choice' });
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

        {/* 🔍 МОДАЛ: детали участника */}
        {memberDetailModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end justify-center z-50 animate-in fade-in duration-200"
            onClick={() => setMemberDetailModal(null)}
          >
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-[2.5rem] p-6 w-full max-w-md shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Шапка */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-black text-lg leading-tight">
                    {memberDetailModal.member.name}
                  </h3>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {memberDetailModal.member.userId === userData.userId
                      ? `${getMyLocalProgress().percent}% • ${getMyLocalProgress().completed}/${getMyLocalProgress().total}`
                      : `${memberDetailModal.member.todayProgress.percent}% • ${memberDetailModal.member.todayProgress.completed}/${memberDetailModal.member.todayProgress.total}`
                    }{' '}{language === 'kk' ? 'тапсырма' : 'задач'}
                  </p>
                </div>
                <button
                  onClick={() => setMemberDetailModal(null)}
                  className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 active:scale-95 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Прогресс-бар */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{
                    width: `${memberDetailModal.member.userId === userData.userId
                      ? getMyLocalProgress().percent
                      : memberDetailModal.member.todayProgress.percent}%`
                  }}
                ></div>
              </div>

              {/* Список задач */}
              {isLoadingMemberDetail ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-white/40 text-xs font-bold">{language === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {RAMADAN_TASKS_INFO.map((task) => {
                    const done = memberDetailModal.tasks?.[task.key] === true;
                    return (
                      <div
                        key={task.key}
                        className={`flex items-center space-x-2 p-3 rounded-2xl border transition-all ${
                          done
                            ? 'bg-emerald-500/20 border-emerald-500/30'
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <span className="text-sm flex-shrink-0">{task.emoji}</span>
                        <p className={`text-[11px] font-black flex-1 truncate ${done ? 'text-emerald-300' : 'text-white/30'}`}>
                          {language === 'kk' ? task.kk : task.ru}
                        </p>
                        <span className="text-xs flex-shrink-0">{done ? '✅' : '⬜'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default CirclesView;