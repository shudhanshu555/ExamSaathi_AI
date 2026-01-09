
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BookOpen, FileText, Save, Trash2, Loader2, Search, FileDown, Sparkles, AlertCircle, Layout, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../types';

const NotesGenerator: React.FC<{ onSave: (note: Note) => void, savedNotes: Note[], onDelete: (id: string) => void, onBack: () => void }> = ({ onSave, savedNotes, onDelete, onBack }) => {
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState<'short' | 'moderate' | 'long'>('short');
  const [university, setUniversity] = useState('MAKAUT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);

  const generateNotes = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedNote(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an expert Academic Professor specializing in ${university} curriculum. Generate high-quality, exam-ready ${length} length notes for the topic: "${topic}".

      CRITICAL CONTENT REQUIREMENTS:
      1. SYMBOLS & FORMULAS: Use clear, standard mathematical symbols (e.g., θ, λ, Σ, Δ, ∂, ∞, ±, √, ∫, ≈). Write important formulas in Markdown blockquotes (e.g., > **Formula: E = mc^2**) so they stand out as centered equation boxes.
      2. DIAGRAMS: If the topic involves visuals (Optics, Mechanics, Electronics, etc.), ALWAYS include a section titled "### 🎨 SCHEMATIC & DIAGRAM GUIDE". In this section, provide a detailed step-by-step text-based blueprint of the diagram, including labels, orientation, and what each part represents.
      3. STRUCTURE: 
         - Use # for Title.
         - Use ## for Section Headings.
         - Use tables for comparisons or key values.
         - End with a "💡 Quick Exam Strategy" bulleted list.
      4. STYLE: Formal, structured, and easy to memorize for exams. Ensure all symbols are represented correctly in text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setGeneratedNote(response.text || "Failed to generate notes.");
    } catch (error) {
      console.error(error);
      setGeneratedNote("Error generating notes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedNote) return;
    const newNote: Note = {
      id: Date.now().toString(),
      title: topic,
      content: generatedNote,
      type: length,
      subject: university,
      timestamp: Date.now()
    };
    onSave(newNote);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors mb-2">
        <ChevronLeft size={20} /> Go Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <BookOpen size={24} />
          </div>
          Professional Notes Generator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Enter Topic Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Laser Physics, Maxwell's Equations..."
                className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent rounded-2xl py-4 px-5 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              <Search className="absolute right-5 top-4.5 text-slate-400" size={20} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">University / Institute</label>
            <input 
              type="text" 
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. MAKAUT, IIT, CBSE"
              className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent rounded-2xl py-4 px-5 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Note Length:</span>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(['short', 'moderate', 'long'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${length === l ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={generateNotes}
            disabled={isGenerating || !topic}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-blue-500/30 transform active:scale-95"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {isGenerating ? "Preparing Academic Content..." : "Generate Master Notes"}
          </button>
        </div>
      </div>

      {generatedNote && (
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex justify-center gap-4 mb-8 sticky top-24 z-20">
            <button 
              onClick={handleSave} 
              className="bg-white dark:bg-slate-800 text-green-600 border-2 border-green-500 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold shadow-xl transition-all"
            >
              <Save size={20} /> Save to Library
            </button>
            <button 
              onClick={() => window.print()} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black font-bold shadow-xl transition-all"
            >
              <FileDown size={20} /> Print A4 PDF
            </button>
          </div>
          
          <div className="a4-container">
            <div className="a4-paper shadow-2xl rounded-sm border border-slate-200">
               <div className="prose prose-slate max-w-none prose-headings:text-blue-700 prose-blockquote:border-blue-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:font-bold">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    h3: ({node, ...props}) => {
                        if (props.children?.toString().includes('🎨')) {
                            return (
                                <div className="diagram-guide">
                                    <div className="diagram-guide-title">
                                        <Layout size={18} /> Diagram & Schematic Blueprint
                                    </div>
                                    <h3 className="!mt-0" {...props} />
                                </div>
                            )
                        }
                        return <h3 {...props} />
                    }
                 }}>
                  {generatedNote}
                 </ReactMarkdown>
               </div>
               <div className="mt-24 pt-10 border-t border-slate-200 text-xs text-slate-400 flex justify-between font-sans uppercase tracking-widest">
                  <span>Created by ExamSaathi AI • Student Assistant</span>
                  <span>Student Edition</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {savedNotes.length > 0 && (
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
              <FileText size={24} />
            </div>
            Your Study Material Library
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedNotes.map(note => (
              <div 
                key={note.id} 
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => setGeneratedNote(note.content)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText size={24} />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <h4 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition-colors leading-tight">{note.title}</h4>
                <div className="flex items-center gap-3 mb-6 mt-auto">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] uppercase tracking-widest rounded-lg font-bold text-slate-600 dark:text-slate-300">{note.type}</span>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{note.subject}</span>
                </div>
                <div className="w-full flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  View Full Note <Search size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesGenerator;
