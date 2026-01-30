
import React, { useState } from 'react';
import { UserData, Language, CustomTask, DayProgress } from '../types';
import { TRANSLATIONS, INITIAL_DAY_PROGRESS } from '../constants';

interface TasksListProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData) => void;
}

const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const [newTaskText, setNewTaskText] = useState('');
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const now = new Date();
  const start = new Date(userData.startDate);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.max(1, Math.min(30, diffDays));
  const dayData = userData.progress[currentDay] || INITIAL_DAY_PROGRESS(currentDay);

  const [quranPagesInput, setQuranPagesInput] = useState(dayData.quranPages?.toString() || '');

  const updateProgress = (day: number, updates: Partial<DayProgress>) => {
    const existing = userData.progress[day] || INITIAL_DAY_PROGRESS(day);
    setUserData({
      ...userData,
      progress: {
        ...userData.progress,
        [day]: { ...existing, ...updates }
      }
    });
  };

  const handleGoalLimitUpdate = (key: 'dailyQuranGoal' | 'dailyCharityGoal', val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
    setUserData({ ...userData, [key]: num });
  };

  const handleQuranPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setQuranPagesInput(val);
    const pages = parseInt(val) || 0;
    updateProgress(currentDay, { quranPages: pages, quranRead: pages > 0 });
  };

  const addCustomGoal = () => {
    if (!newTaskText.trim()) return;
    const newTask: CustomTask = {
      id: `custom-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };
    setUserData({
      ...userData,
      customTasks: [...(userData.customTasks || []), newTask]
    });
    setNewTaskText('');
  };

  const toggleGoal = (id: string) => {
    const next = (userData.customTasks || []).map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setUserData({ ...userData, customTasks: next });
  };

  const deleteGoal = (id: string) => {
    const next = (userData.customTasks || []).filter(task => task.id !== id);
    setUserData({ ...userData, customTasks: next });
  };

  const startEditing = (task: CustomTask) => {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const next = (userData.customTasks || []).map(task => 
      task.id === editingId ? { ...task, text: editingText } : task
    );
    setUserData({ ...userData, customTasks: next });
    setEditingId(null);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const quranGoalPercent = Math.min(100, Math.round(((dayData.quranPages || 0) / (userData?.dailyQuranGoal || 1)) * 100));
  const charityGoalPercent = Math.min(100, Math.round(((dayData.charityAmount || 0) / (userData?.dailyCharityGoal || 1)) * 100));

  const allGoals = userData.customTasks || [];
  const totalCompleted = allGoals.filter(g => g.completed).length;
  const totalPossible = allGoals.length;
  const overallPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Daily Limits Summary Card */}
      <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-1">
           <h4 className="text-[12px] font-black text-slate-800 tracking-widest uppercase">{t.goalsTitle}</h4>
           <button onClick={() => setShowGoalSettings(!showGoalSettings)} className="text-emerald-600 text-[10px] font-black uppercase underline decoration-emerald-200">
             {showGoalSettings ? 'Жабу' : 'Баптау'}
           </button>
        </div>

        {showGoalSettings && (
          <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-slate-50 rounded-[2rem] animate-in fade-in zoom-in duration-300">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t.goalsQuran}</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={userData?.dailyQuranGoal || ''} 
                onChange={(e) => handleGoalLimitUpdate('dailyQuranGoal', e.target.value)}
                onFocus={handleInputFocus}
                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t.goalsCharity}</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={userData?.dailyCharityGoal || ''} 
                onChange={(e) => handleGoalLimitUpdate('dailyCharityGoal', e.target.value)}
                onFocus={handleInputFocus}
                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-700 outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-8 px-1">
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">📖</div>
                    <div>
                      <span className="text-[11px] font-black text-slate-800 uppercase block mb-1">{t.goalsQuran}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{quranGoalPercent}% ОРЫНДАЛДЫ</span>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={quranPagesInput} 
                      onChange={handleQuranPagesChange}
                      onFocus={handleInputFocus}
                      placeholder="0"
                      className="w-14 bg-slate-50 border border-slate-100 rounded-xl py-2 px-2 text-xs font-black text-center outline-none"
                    />
                    <span className="text-[10px] font-black text-slate-300">/ {userData?.dailyQuranGoal}</span>
                 </div>
              </div>
              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${quranGoalPercent}%` }}></div>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">💎</div>
                    <div>
                      <span className="text-[11px] font-black text-slate-800 uppercase block mb-1">{t.goalsCharity}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{charityGoalPercent}% ОРЫНДАЛДЫ</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-[12px] font-black text-emerald-600 block mb-1">{dayData.charityAmount || 0} ₸</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">лимит: {userData?.dailyCharityGoal} ₸</span>
                 </div>
              </div>
              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000" style={{ width: `${charityGoalPercent}%` }}></div>
              </div>
           </div>
        </div>
      </section>

      {/* Main Ramadan Goals List */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-tight uppercase">{t.tasksTitle}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{totalCompleted} / {totalPossible} МАҚСАТ ОРЫНДАЛДЫ</p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-black text-emerald-600">{overallPercent}%</span>
          </div>
        </div>
        
        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${overallPercent}%` }}></div>
        </div>

        {/* Add Goal Input */}
        <div className="bg-slate-50 p-2 rounded-2xl flex items-center space-x-2 border border-slate-100">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onFocus={handleInputFocus}
            onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
            placeholder={t.tasksAddPlaceholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-3 outline-none"
          />
          <button 
            onClick={addCustomGoal}
            className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-90"
          >
            +
          </button>
        </div>

        {/* Goals Grid */}
        <div className="space-y-3">
          {allGoals.map((goal) => (
            <div 
              key={goal.id}
              className={`group p-4 rounded-[1.8rem] border transition-all flex items-center justify-between ${
                goal.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div 
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                    goal.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  {goal.completed && <span className="text-[12px] font-black">✓</span>}
                </div>
                
                {editingId === goal.id ? (
                  <input 
                    type="text"
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    onFocus={handleInputFocus}
                    className="flex-1 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-sm font-medium outline-none"
                  />
                ) : (
                  <p 
                    onClick={() => toggleGoal(goal.id)}
                    className={`text-sm font-medium leading-tight cursor-pointer ${goal.completed ? 'text-emerald-900 line-through opacity-50' : 'text-slate-700'}`}
                  >
                    {goal.text}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId !== goal.id && (
                  <button 
                    onClick={() => startEditing(goal)}
                    className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                  >
                    ✏️
                  </button>
                )}
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TasksList;
