
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { Question } from '../types';

const PracticeZone: React.FC<{ addToHistory: (d: string, t: any) => void }> = ({ addToHistory }) => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'mcq' | 'classic'>('mcq');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const startRevision = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setFeedback(null);
    setShowAnswer(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 5 high-quality ${mode} exam questions for the topic: "${topic}". 
      If MCQ: Include question, 4 options, and the correct answer.
      If Classic: Include question and a detailed ideal answer.
      Always include a comprehensive explanation that clarifies any complex parts, formulas, or diagrams needed.
      Output as JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'answer', 'explanation']
            }
          }
        }
      });

      const parsed = JSON.parse(response.text);
      setQuestions(parsed.map((q: any, idx: number) => ({ ...q, id: idx.toString(), type: mode })));
      addToHistory(`Started ${mode} practice on ${topic}`, 'practice');
    } catch (error) {
      console.error(error);
      alert("Failed to generate questions. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAnswer = (selected?: string) => {
    const q = questions[currentIndex];
    const ans = selected || userAnswer;
    const isCorrect = ans.trim().toLowerCase() === q.answer.trim().toLowerCase();
    
    setFeedback({
      isCorrect,
      explanation: q.explanation
    });
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedback(null);
      setUserAnswer('');
      setShowAnswer(false);
    } else {
      alert("Revision session complete! Great job.");
      setQuestions([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Practice Zone</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Test your knowledge with AI-generated questions and instant feedback.</p>
          
          <div className="max-w-md mx-auto space-y-4">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What topic do you want to revise?"
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
            />
            
            <div className="flex gap-4 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <button
                onClick={() => setMode('mcq')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'mcq' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                MCQ Mode
              </button>
              <button
                onClick={() => setMode('classic')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'classic' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Classic Q&A
              </button>
            </div>

            <button
              onClick={startRevision}
              disabled={isGenerating || !topic}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? "Preparing Questions..." : "Start Revision"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-slate-400">QUESTION {currentIndex + 1} OF {questions.length}</span>
             <button onClick={() => setQuestions([])} className="text-sm text-slate-400 hover:text-red-500">End Session</button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-8">{questions[currentIndex].question}</h3>

            {questions[currentIndex].type === 'mcq' ? (
              <div className="grid grid-cols-1 gap-4">
                {questions[currentIndex].options?.map((opt, i) => (
                  <button
                    key={i}
                    disabled={showAnswer}
                    onClick={() => checkAnswer(opt)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      showAnswer && opt === questions[currentIndex].answer 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                        : showAnswer && feedback && !feedback.isCorrect && opt === userAnswer
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-slate-100 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{opt}</span>
                      {showAnswer && opt === questions[currentIndex].answer && <CheckCircle2 className="text-green-500" size={20} />}
                      {showAnswer && feedback && !feedback.isCorrect && opt === userAnswer && <XCircle className="text-red-500" size={20} />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {!showAnswer && (
                  <button onClick={() => checkAnswer()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Submit Answer</button>
                )}
              </div>
            )}

            {showAnswer && (
              <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={18} className="text-blue-500" />
                  <h4 className="font-bold">AI Explanation</h4>
                </div>
                <div className="prose prose-slate dark:prose-invert text-slate-600 dark:text-slate-400">
                  {questions[currentIndex].explanation}
                </div>
                {questions[currentIndex].type === 'classic' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-2">Ideal Answer</p>
                    <p className="text-slate-700 dark:text-slate-200">{questions[currentIndex].answer}</p>
                  </div>
                )}
                <button 
                  onClick={nextQuestion}
                  className="mt-8 w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  Next Question <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeZone;
