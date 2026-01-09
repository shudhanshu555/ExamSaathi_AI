
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Sparkles, MessageSquare, AlertCircle, RefreshCw, HelpCircle, ChevronLeft, Globe } from 'lucide-react';
import { encode, decode, decodeAudioData, float32ToInt16 } from '../utils/audio';

const VoiceAssistant: React.FC<{ addToHistory: (d: string, t: any) => void; onBack: () => void }> = ({ addToHistory, onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const isActiveRef = useRef(false);
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = async () => {
    console.log("Cleaning up Voice AI session...");
    isActiveRef.current = false;
    setIsActive(false);
    setIsConnecting(false);

    // Clean up audio nodes
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      try { scriptProcessorRef.current.disconnect(); } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (e) {}
      sourceNodeRef.current = null;
    }

    // Close session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    
    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    // Clear active playback
    if (sourcesRef.current) {
      sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      sourcesRef.current.clear();
    }

    // Close contexts
    const closePromises = [];
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      closePromises.push(inputAudioContextRef.current.close().catch(() => {}));
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      closePromises.push(outputAudioContextRef.current.close().catch(() => {}));
      outputAudioContextRef.current = null;
    }

    await Promise.all(closePromises);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    await stopSession();

    if (!process.env.API_KEY) {
      setError("API Key configuration is missing. Please contact support.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setLastMessage("");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      inputAudioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });

      // Re-request stream to ensure fresh hardware access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("WebSocket Connection Established.");
            isActiveRef.current = true;
            setIsActive(true);
            setIsConnecting(false);
            addToHistory('Voice AI session activated', 'voice');
            
            sessionPromise.then(session => {
              sessionRef.current = session;
              
              if (!inputAudioContextRef.current || !streamRef.current) return;

              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              // Use 4096 buffer size for better network stability
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              sourceNodeRef.current = source;
              scriptProcessorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                if (!isActiveRef.current || !sessionRef.current) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = float32ToInt16(inputData);
                const pcmData = encode(new Uint8Array(int16Data.buffer));
                
                try {
                  sessionRef.current.sendRealtimeInput({ 
                    media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } 
                  });
                } catch (err) {
                  // Catch silent failures to prevent loop crash
                  console.warn("Input stream interrupted:", err);
                }
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isActiveRef.current) return;

            // Handle Transcripts
            if (message.serverContent?.outputTranscription) {
              setLastMessage(prev => prev + (message.serverContent?.outputTranscription?.text || ""));
            }
            if (message.serverContent?.turnComplete) {
              if (lastMessage.trim()) {
                setTranscript(prev => [...prev, "ExamSaathi: " + lastMessage]);
                setLastMessage("");
              }
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && isActiveRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                if (sourcesRef.current) sourcesRef.current.delete(source);
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              if (sourcesRef.current) sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              if (sourcesRef.current) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear();
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error("Gemini Live Error Detail:", e);
            const errorMsg = e.message || "The AI service disconnected due to a network interruption. Please check your internet or retry.";
            setError(errorMsg);
            stopSession();
          },
          onclose: (e: any) => {
            console.log("WebSocket Closed:", e);
            if (isActiveRef.current) stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are ExamSaathi, an expert student AI tutor. 
          1. BHARAT SUPPORT: You support all major Indian languages (Hindi, Bengali, Marathi, Tamil, Telugu, etc.).
          2. LANGUAGE MIRROR: Detect the student's language immediately and respond in that EXACT same language or mixed style (like Hinglish).
          3. SPEED: Be extremely brief. No greetings. Max 20 words per response.
          4. FOCUS: Help with exam preparation, concepts, and academic doubts only.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {}
        }
      });

    } catch (err: any) {
      console.error("Startup Error:", err);
      setError(err.message || "Failed to initialize microphone or AI connection.");
      setIsConnecting(false);
      await stopSession();
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors mb-2">
        <ChevronLeft size={20} /> Go Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Globe size={120} />
        </div>

        {error && (
          <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-left animate-in fade-in slide-in-from-top border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold mb-1">Service Alert</h4>
                <p className="text-sm leading-relaxed mb-4">{error}</p>
                <button 
                  onClick={startSession} 
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  <RefreshCw size={16} /> Reconnect AI
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 relative flex justify-center">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isActive ? 'bg-red-500 animate-pulse shadow-2xl shadow-red-500/50' : 'bg-blue-600 shadow-xl shadow-blue-500/30'}`}>
            {isActive ? <Mic size={48} className="text-white" /> : <MicOff size={48} className="text-white/50" />}
          </div>
          {isActive && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-red-500/30 rounded-full animate-ping" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-red-500/10 rounded-full animate-ping" style={{ animationDelay: '500ms' }} />
            </>
          )}
        </div>

        <h2 className="text-3xl font-bold mb-4">
          {isActive ? "ExamSaathi Listening..." : "Instant Native Voice AI"}
        </h2>
        
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Hindi', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'English'].map(lang => (
             <span key={lang} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
               {lang}
             </span>
          ))}
        </div>

        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed text-sm">
          {isActive 
            ? "Speak naturally. I'm listening and ready to help in your language." 
            : "Connect instantly to solve exam doubts in your mother tongue using native voice AI."}
        </p>

        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 group"
            >
              {isConnecting ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:rotate-12 transition-transform" />}
              {isConnecting ? "Establishing Socket..." : "Activate Native AI"}
            </button>
          ) : (
            <button
              onClick={() => stopSession()}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-10 py-5 rounded-2xl font-bold transition-all border border-slate-200 dark:border-slate-600 shadow-lg"
            >
              <MicOff size={20} />
              End Session
            </button>
          )}
        </div>
      </div>

      {(isActive || transcript.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[200px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            Live Dialogue Transcript
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {transcript.map((line, idx) => (
              <div key={idx} className={`p-4 rounded-2xl animate-in slide-in-from-bottom-2 ${line.startsWith('ExamSaathi:') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/50' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800'}`}>
                {line}
              </div>
            ))}
            {lastMessage && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/50">
                <span className="font-bold">ExamSaathi:</span> {lastMessage}
              </div>
            )}
            {isActive && !lastMessage && transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-4">
                 <div className="flex gap-1.5 h-6 items-end">
                   <div className="w-1.5 h-3 bg-blue-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                   <div className="w-1.5 h-3 bg-blue-500/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                 </div>
                 <p className="italic text-sm">Identifying your language and dialect...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
