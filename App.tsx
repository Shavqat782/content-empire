
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Sparkles, 
  LayoutGrid, 
  Loader2,
  AlertCircle,
  Clapperboard,
  DollarSign,
  Users,
  Instagram,
  Linkedin
} from 'lucide-react';
import { AppTab, ContentEmpireOutput } from './types';
import { transcribeAudio, generateContentEmpire } from './services/geminiService';
import { blobToBase64 } from './utils/audioUtils';
import ContentCard from './components/ContentCard';
import BoardOfDirectors from './components/BoardOfDirectors';

interface NavButtonProps {
  tab: AppTab;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  icon: any;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ tab, activeTab, setActiveTab, icon: Icon, label }) => (
  <button 
    onClick={() => setActiveTab(tab)}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${activeTab === tab ? 'text-amber-500 scale-110' : 'text-zinc-500'}`}
  >
    <Icon size={22} strokeWidth={activeTab === tab ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FACTORY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContentEmpireOutput | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Очистка потоков микрофона при размонтировании (предотвращение утечек памяти)
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Разрешите доступ к микрофону");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(blob);
      const transcription = await transcribeAudio(base64);
      const content = await generateContentEmpire(transcription);
      setResults(content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка. Попробуйте еще раз.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Шапка (минималистичная) */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={20} />
          <span className="text-sm font-black tracking-widest uppercase">Content Empire</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => { localStorage.removeItem('empire_mem0_facts'); alert('Память Mem0 очищена! ИИ забыл прошлый контекст.'); }}
            className="text-[10px] font-bold uppercase tracking-widest text-amber-500/50 hover:text-amber-500 transition-colors"
          >
            Сброс Mem0
          </button>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 overflow-y-auto pb-28">
        {activeTab === AppTab.FACTORY && (
          <div className="px-4 py-8 space-y-10 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black tracking-tighter leading-none">ФАБРИКА <br/><span className="gradient-text">КОНТЕНТА</span></h1>
              <p className="text-zinc-500 text-sm max-w-[280px] mx-auto leading-relaxed uppercase font-bold tracking-tight">Запишите идею — мы сделаем всё остальное</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 shadow-2xl ${
                  isRecording 
                  ? 'bg-red-500 animate-pulse ring-8 ring-red-500/10' 
                  : 'bg-amber-500 glow-button'
                }`}
              >
                {isRecording ? <Square size={32} fill="white" stroke="white" /> : <Mic size={32} className="text-zinc-900" strokeWidth={2.5} />}
              </button>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isRecording ? 'text-red-500' : 'text-zinc-600'}`}>
                {isRecording ? "Слушаю..." : isProcessing ? "Магия AI..." : "Нажать для записи"}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500 text-xs font-bold mx-auto max-w-xs">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="py-10 text-center space-y-4">
                <Loader2 size={32} className="text-amber-500 animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Генерация империи...</p>
              </div>
            )}

            {results && !isProcessing && (
              <div className="space-y-6">
                <ContentCard 
                  title="REELS DIRECTOR" 
                  icon={<Clapperboard size={18} />} 
                  accentColor="red"
                  timeline={results.videoDirectorPlan.timeline}
                />
                <ContentCard 
                  title="MONEY MAKER (MAGNET)" 
                  icon={<DollarSign size={18} />} 
                  content={results.leadMagnet.description}
                  subContent={results.leadMagnet.points}
                  leadMagnetFooter={results.leadMagnet.ctaTrigger}
                />
                <ContentCard 
                  title="INSTAGRAM POST" 
                  icon={<Instagram size={18} />} 
                  content={results.instagramPost.caption}
                  subContent={results.instagramPost.hashtags}
                />
                <ContentCard 
                  title="LINKEDIN ARTICLE" 
                  icon={<Linkedin size={18} />} 
                  content={results.linkedInArticle.content}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.DIRECTORS && <BoardOfDirectors />}
      </main>

      {/* Нижняя навигация (Bottom Nav) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 px-4 pb-6 pt-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <NavButton tab={AppTab.FACTORY} activeTab={activeTab} setActiveTab={setActiveTab} icon={LayoutGrid} label="Фабрика" />
          <NavButton tab={AppTab.DIRECTORS} activeTab={activeTab} setActiveTab={setActiveTab} icon={Users} label="Совет" />
        </div>
      </nav>
    </div>
  );
};

export default App;
