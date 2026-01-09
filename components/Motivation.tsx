
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Zap, Sparkles, Quote, Loader2, RefreshCw } from 'lucide-react';

const Motivation: React.FC = () => {
  const [motivation, setMotivation] = useState<{ quote: string; author: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getMotivation = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Give me an inspiring quote for a student preparing for difficult exams. Also provide a personalized encouraging message (2-3 sentences) to boost their confidence. Return as JSON with keys 'quote', 'author', and 'message'.",
        config: { 
          responseMimeType: 'application/json'
        }
      });
      setMotivation(JSON.parse(response.text));
    } catch (error) {
      setMotivation({
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        message: "You've got this! Every hour you put in today is a step towards the success you deserve."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex items-center justify-center">
      {!motivation && !isLoading ? (
        <div className="text-center space-y-8 max-w-lg">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xl shadow-yellow-500/20">
            <Zap size={48} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Need a Boost?</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Exam stress is real, but you are stronger. Let ExamSaathi recharge your spirit.</p>
          <button 
            onClick={getMotivation}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-10 py-5 rounded-3xl font-bold text-xl transition-all shadow-xl shadow-yellow-500/30 flex items-center gap-3 mx-auto"
          >
            <Sparkles /> Inspire Me
          </button>
        </div>
      ) : (
        <div className="w-full relative animate-in zoom-in duration-500">
           <div className="bg-white dark:bg-slate-800 p-12 lg:p-20 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              <Quote size={80} className="text-slate-100 dark:text-slate-700 absolute top-10 left-10 -z-0 opacity-50" />
              
              <div className="relative z-10">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center">
                    <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">Summoning inspiration...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-3xl lg:text-4xl font-serif italic text-slate-800 dark:text-slate-100 mb-6 leading-tight">
                      "{motivation?.quote}"
                    </h3>
                    <p className="text-yellow-600 font-bold mb-10 text-xl tracking-widest">— {motivation?.author}</p>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-10 text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                      {motivation?.message}
                    </div>

                    <button 
                      onClick={getMotivation}
                      className="text-slate-400 hover:text-blue-600 flex items-center gap-2 mx-auto font-bold transition-colors"
                    >
                      <RefreshCw size={18} /> Get New Insight
                    </button>
                  </>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Motivation;
