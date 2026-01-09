
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Sparkles, MessageSquare, AlertCircle, RefreshCw, HelpCircle, ChevronLeft } from 'lucide-react';
import { encode, decode, decodeAudioData, float32ToInt16 } from '../utils/audio';

const VoiceAssistant: React.FC<{ addToHistory: (d: string, t: any) => void; onBack: () => void }> = ({ addToHistory, onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const isActiveRef = useRef(false);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = async () => {
    console.log("Terminating session and releasing resources...");
    
    isActiveRef.current = false;
    setIsActive(false);
    setIsConnecting(false);

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      try { scriptProcessorRef.current.disconnect(); } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (e) {}
      sourceNodeRef.current = null;
    }

    if (sessionPromiseRef.current) {
      const currentPromise = sessionPromiseRef.current;
      sessionPromiseRef.current = null;
      try {
        const session = await currentPromise;
        if (session) session.close();
      } catch(e) {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

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
    console.log("Cleanup complete.");
  };

  const startSession = async () => {
    // Explicitly await cleanup before starting a new connection
    await stopSession();

    if (!process.env.API_KEY) {
      setError("System Configuration Error: API Key is missing. Please ensure your environment variable is set up correctly in Vercel.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setLastMessage("");
    
    try {
      if (!window.isSecureContext) {
        throw new Error("Microphone access requires a secure connection (HTTPS).");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support high-quality voice interactions.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      inputAudioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });

      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error("Microphone Permission Denied. Please allow access and try again.");
        } else {
          throw new Error(`Microphone Access Failed: ${err.message}`);
        }
      }

      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("Gemini session ready.");
            isActiveRef.current = true;
            setIsActive(true);
            setIsConnecting(false);
            addToHistory('Started AI Voice Session', 'voice');
            
            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            sourceNodeRef.current = source;
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (!isActiveRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16Data = float32ToInt16(inputData);
              const pcmData = encode(new Uint8Array(int16Data.buffer));
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  if (isActiveRef.current) {
                    session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } });
                  }
                }).catch(() => {});
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isActiveRef.current) return;

            if (message.serverContent?.outputTranscription) {
              setLastMessage(prev => prev + (message.serverContent?.outputTranscription?.text || ""));
            }
            if (message.serverContent?.turnComplete) {
              setTranscript(prev => [...prev, "ExamSaathi: " + lastMessage]);
              setLastMessage("");
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && isActiveRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Gemini Live Error Details:', e);
            // Catch error even if handshake hasn't completed
            setError("AI Service Error: " + (e.message || "Network issue or invalid API key."));
            stopSession();
          },
          onclose: (e: any) => {
            console.log("Connection closed.", e);
            if (isActiveRef.current) stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are ExamSaathi, a friendly assistant for the student. Help solve exam doubts quickly. Match their language and style. Keep responses concise and spoken-friendly.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {}
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Session failed:", err);
      setError(err.message || "An unexpected error occurred.");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors mb-2">
        <ChevronLeft size={20} /> Go Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 text-center">
        {error && (
          <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-left animate-in fade-in slide-in-from-top border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold mb-1">Network / Connection Error</h4>
                <p className="text-sm leading-relaxed mb-4">{error}</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={startSession} 
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                  >
                    <RefreshCw size={16} /> Try Reconnecting
                  </button>
                </div>
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
          {isActive ? "ExamSaathi is Listening" : "Instant Doubt Solver"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          {isActive 
            ? "I can hear you! Ask your exam doubt, and I'll explain it clearly in your style." 
            : "Click 'Start' and allow microphone access to talk to our AI assistant. It's built to help you solve concepts quickly during exams."}
        </p>

        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 group"
            >
              {isConnecting ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:rotate-12 transition-transform" />}
              {isConnecting ? "Connecting to AI..." : "Start AI Conversation"}
            </button>
          ) : (
            <button
              onClick={() => stopSession()}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-10 py-5 rounded-2xl font-bold transition-all border border-slate-200 dark:border-slate-600 shadow-lg"
            >
              <MicOff size={20} />
              Stop & End Session
            </button>
          )}
        </div>
      </div>

      {(isActive || transcript.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[200px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            Dialogue History
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {transcript.map((line, idx) => (
              <div key={idx} className={`p-4 rounded-2xl ${line.startsWith('ExamSaathi:') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/50' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800'}`}>
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
                 <p className="italic text-sm">Waiting for you to speak...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
