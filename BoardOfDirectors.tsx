
import React, { useState } from 'react';
import { 
  Users, 
  Lightbulb, 
  BarChart4, 
  Zap, 
  Target, 
  Send, 
  Loader2, 
  Quote,
  Rocket
} from 'lucide-react';
import { getBoardAdvice } from '../services/geminiService';
import { BoardOfDirectorsOutput, DirectorAdvice } from '../types';

const BoardOfDirectors: React.FC = () => {
  const [problem, setProblem] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [advice, setAdvice] = useState<BoardOfDirectorsOutput | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;
    setIsProcessing(true);
    setAdvice(null);
    try {
      setAdvice(await getBoardAdvice(problem));
    } catch (error) {
      console.error('Ошибка получения совета от Совета Директоров:', error);
      alert('Не удалось получить совет. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const DirectorCard = ({ data, icon, color }: { data: DirectorAdvice, icon: React.ReactNode, color: string }) => (
    <div className={`glass-card p-6 rounded-2xl border-l-4 transition-all ${color === 'amber' ? 'border-amber-500' : color === 'blue' ? 'border-blue-500' : color === 'red' ? 'border-red-500' : 'border-zinc-500'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-white/5 ${color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : color === 'red' ? 'text-red-500' : 'text-zinc-500'}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-black text-sm text-white uppercase">{data.name}</h3>
          <p className="text-[10px] text-zinc-500 uppercase font-bold">{data.role}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed mb-4 italic whitespace-pre-wrap">"{data.advice}"</p>
      <div className="pt-3 border-t border-white/5">
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Правило:</p>
        <p className="text-[11px] text-white font-bold">{data.quote}</p>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight">СОВЕТ <br/><span className="gradient-text">ДИРЕКТОРОВ</span></h1>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Опишите проблему... (денежный разрыв, наем, стратегия)"
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pr-14 text-sm text-white focus:outline-none focus:border-amber-500/50 min-h-[140px] resize-none"
        />
        <button type="submit" disabled={isProcessing || !problem.trim()} className="absolute bottom-4 right-4 p-3 bg-amber-500 text-zinc-900 rounded-xl shadow-xl shadow-amber-500/10">
          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>

      {isProcessing && (
        <div className="py-10 text-center space-y-4">
          <Users size={32} className="text-amber-500 animate-bounce mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Собрание началось...</p>
        </div>
      )}

      {advice && (
        <div className="grid grid-cols-1 gap-4">
          <DirectorCard data={advice.jobs} icon={<Lightbulb size={20}/>} color="amber" />
          <DirectorCard data={advice.buffett} icon={<BarChart4 size={20}/>} color="blue" />
          <DirectorCard data={advice.cardone} icon={<Rocket size={20}/>} color="red" />
          <DirectorCard data={advice.tzu} icon={<Target size={20}/>} color="zinc" />
        </div>
      )}
    </div>
  );
};

export default BoardOfDirectors;
