
import React, { useState } from 'react';
import { UserData, Language, CustomTask } from '../types';
import { TRANSLATIONS, RAMADAN_TASKS } from '../constants';

interface TasksListProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData) => void;
}

const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const [newTaskText, setNewTaskText] = useState('');

  const togglePredefinedTask = (id: number) => {
    const current = userData.completedTasks || [];
    let next: number[];
    if (current.includes(id)) {
      next = current.filter(x => x !== id);
    } else {
      next = [...current, id];
    }
    setUserData({ ...userData, completedTasks: next });
  };

  const deletePredefinedTask = (id: number) => {
    const nextDeleted = [...(userData.deletedPredefinedTasks || []), id];
    // Also ensure it's removed from completed if it was there
    const nextCompleted = (userData.completedTasks || []).filter(x => x !== id);
    setUserData({ 
      ...userData, 
      deletedPredefinedTasks: nextDeleted,
      completedTasks: nextCompleted 
    });
  };

  const addCustomTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: CustomTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    setUserData({
      ...userData,
      customTasks: [...(userData.customTasks || []), newTask]
    });
    setNewTaskText('');
  };

  const toggleCustomTask = (id: string) => {
    const next = (userData.customTasks || []).map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setUserData({ ...userData, customTasks: next });
  };

  const deleteCustomTask = (id: string) => {
    const next = (userData.customTasks || []).filter(task => task.id !== id);
    setUserData({ ...userData, customTasks: next });
  };

  const visiblePredefined = RAMADAN_TASKS.filter(task => !userData.deletedPredefinedTasks?.includes(task.id));
  
  const predefinedCompleted = userData.completedTasks?.length || 0;
  const customCompleted = userData.customTasks?.filter(t => t.completed).length || 0;
  const customTotal = userData.customTasks?.length || 0;
  
  const totalCompleted = predefinedCompleted + customCompleted;
  const totalPossible = visiblePredefined.length + customTotal;
  const percent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">{t.tasksTitle}</h2>
        <div className="flex items-center justify-between mb-4">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalCompleted} / {totalPossible} ОРЫНДАЛДЫ</span>
           <span className="text-sm font-black text-emerald-600">{percent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tasksPredefined}</h3>
          {userData.deletedPredefinedTasks?.length > 0 && (
            <button 
              onClick={() => setUserData({...userData, deletedPredefinedTasks: []})}
              className="text-[9px] font-black text-emerald-600 uppercase underline"
            >
              Қалпына келтіру
            </button>
          )}
        </div>
        <div className="space-y-2">
          {visiblePredefined.map((task) => {
            const isDone = userData.completedTasks?.includes(task.id);
            return (
              <div 
                key={task.id}
                className={`p-4 rounded-3xl border transition-all flex items-center justify-between group ${
                  isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div 
                  onClick={() => togglePredefinedTask(task.id)}
                  className="flex items-start space-x-3 cursor-pointer flex-1"
                >
                  <div className={`mt-1 w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                  }`}>
                    {isDone && <span className="text-[10px] font-black">✓</span>}
                  </div>
                  <p className={`text-sm leading-tight font-medium ${isDone ? 'text-emerald-900 line-through opacity-60' : 'text-slate-700'}`}>
                    {language === 'kk' ? task.text_kk : task.text_ru}
                  </p>
                </div>
                <button 
                  onClick={() => deletePredefinedTask(task.id)}
                  className="ml-2 p-2 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить задачу"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t.tasksCustom}</h3>
        <div className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm flex space-x-2">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomTask()}
            placeholder={t.tasksAddPlaceholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-2"
          />
          <button 
            onClick={addCustomTask}
            className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            {t.tasksAddBtn}
          </button>
        </div>

        <div className="space-y-2">
          {(userData.customTasks || []).map((task) => (
            <div 
              key={task.id}
              className={`p-4 rounded-3xl border transition-all flex items-center justify-between group ${
                task.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div 
                onClick={() => toggleCustomTask(task.id)}
                className="flex items-center space-x-3 flex-1 cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                }`}>
                  {task.completed && <span className="text-[10px] font-black">✓</span>}
                </div>
                <p className={`text-sm font-medium ${task.completed ? 'text-emerald-900 line-through opacity-60' : 'text-slate-700'}`}>
                  {task.text}
                </p>
              </div>
              <button 
                onClick={() => deleteCustomTask(task.id)}
                className="ml-2 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TasksList;
