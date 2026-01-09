
import React from 'react';
import { History as HistoryIcon, Clock, Mic, BookOpen, HelpCircle } from 'lucide-react';
import { HistoryItem } from '../types';

const History: React.FC<{ history: HistoryItem[] }> = ({ history }) => {
  const getIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'voice': return <Mic size={18} className="text-red-500" />;
      case 'note': return <BookOpen size={18} className="text-blue-500" />;
      case 'practice': return <HelpCircle size={18} className="text-green-500" />;
      default: return <Clock size={18} className="text-slate-500" />;
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + 
           new Date(ts).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <HistoryIcon size={24} className="text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Activity History</h2>
          <p className="text-slate-500 text-sm">Review your recent interactions with ExamSaathi.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
        {history.length === 0 ? (
          <div className="p-20 text-center">
            <Clock size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400">No recent activity found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {history.map(item => (
              <div key={item.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-4">
                <div className="mt-1 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.details}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{item.type} session</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
