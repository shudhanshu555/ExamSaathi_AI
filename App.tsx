
import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  BookOpen, 
  HelpCircle, 
  History as HistoryIcon, 
  Moon, 
  Sun, 
  Zap, 
  Clock, 
  User,
  LayoutDashboard,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Volume2
} from 'lucide-react';
import VoiceAssistant from './components/VoiceAssistant';
import NotesGenerator from './components/NotesGenerator';
import PracticeZone from './components/PracticeZone';
import History from './components/History';
import Motivation from './components/Motivation';
import CreatorInfo from './components/CreatorInfo';
import { Theme, Note, HistoryItem } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('examsaathi_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('examsaathi_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (theme === 'dark') {
      document.body.classList.add('bg-slate-900', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.body.classList.add('bg-slate-50', 'text-slate-900');
      document.body.classList.remove('bg-slate-900', 'text-slate-100');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addNote = (note: Note) => {
    const updated = [note, ...notes];
    setNotes(updated);
    localStorage.setItem('examsaathi_notes', JSON.stringify(updated));
    addToHistory('Created note: ' + note.title, 'note');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('examsaathi_notes', JSON.stringify(updated));
  };

  const addToHistory = (details: string, type: HistoryItem['type']) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      action: details,
      type,
      timestamp: Date.now(),
      details
    };
    const updated = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    localStorage.setItem('examsaathi_history', JSON.stringify(updated));
  };

  const NavItem = ({ icon: Icon, label, id }: any) => (
    <button
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'hover:bg-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const goHome = () => setActiveTab('dashboard');

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 p-6 flex flex-col`}>
        <div className="flex items-center space-x-2 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <BookOpen size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ExamSaathi</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
          <NavItem icon={Mic} label="AI Voice Assistant" id="voice" />
          <NavItem icon={BookOpen} label="Study Notes" id="notes" />
          <NavItem icon={HelpCircle} label="Practice Zone" id="practice" />
          <NavItem icon={HistoryIcon} label="Activity History" id="history" />
          <NavItem icon={Zap} label="Get Motivation" id="motivation" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={toggleTheme}
            className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 lg:p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Exam Preparation Mode</p>
              <p className="text-sm font-semibold">Active Session</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              ST
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4">Focus on your exams, <br/>Student!</h2>
                  <p className="text-blue-100 max-w-md mb-8">ExamSaathi is ready to help you generate notes, practice questions, and solve your doubts with AI.</p>
                  <button 
                    onClick={() => setActiveTab('practice')}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    Start Revision
                  </button>
                </div>
                <BookOpen size={200} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div onClick={() => setActiveTab('voice')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                    <Mic size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Voice Assistant</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Ask anything and get instant verbal explanations in your preferred style.</p>
                </div>

                <div onClick={() => setActiveTab('notes')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Study Notes</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Generate structured A4 notes for any topic with diagrams and formulas.</p>
                </div>

                <div onClick={() => setActiveTab('practice')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                    <HelpCircle size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Practice Zone</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">MCQs and Classic Q&As to test your knowledge with AI feedback.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Save size={20} className="text-blue-500" />
                    Saved Notes
                  </h3>
                  <button onClick={() => setActiveTab('notes')} className="text-blue-600 text-sm font-semibold hover:underline">See all</button>
                </div>
                {notes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No saved notes yet. Start by generating one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notes.slice(0, 4).map(note => (
                      <div key={note.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group" onClick={() => setActiveTab('notes')}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-blue-600 truncate mr-2">{note.title}</h4>
                          <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-widest">{note.type} • {note.subject}</p>
                        <p className="text-sm text-slate-500 line-clamp-2">{note.content.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'voice' && <VoiceAssistant addToHistory={addToHistory} onBack={goHome} />}
          {activeTab === 'notes' && <NotesGenerator onSave={addNote} savedNotes={notes} onDelete={deleteNote} onBack={goHome} />}
          {activeTab === 'practice' && <PracticeZone addToHistory={addToHistory} onBack={goHome} />}
          {activeTab === 'history' && <History history={history} onBack={goHome} />}
          {activeTab === 'motivation' && <Motivation onBack={goHome} />}
        </div>

        <CreatorInfo />
      </main>
    </div>
  );
};

export default App;
