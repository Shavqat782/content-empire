
import React, { useState } from 'react';
import { Copy, Check, Loader2, Volume2, Clapperboard, Monitor, User } from 'lucide-react';
import { speakText } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { VideoFrame } from '../types';

interface ContentCardProps {
  title: string;
  icon: React.ReactNode;
  content?: string;
  subContent?: string[];
  timeline?: VideoFrame[];
  leadMagnetFooter?: string;
  accentColor?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ title, icon, content, subContent, timeline, leadMagnetFooter, accentColor = "amber" }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    const textToCopy = timeline 
      ? timeline.map(f => `[${f.timestamp}] ${f.visual}\nРечь: ${f.speech}\nТекст: ${f.textOverlay}`).join('\n\n')
      : content || (subContent ? subContent.join('\n') : "");
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const textToSpeak = timeline 
        ? timeline.map(f => f.speech).join(' ') 
        : content || "";
      const base64Audio = await speakText(textToSpeak);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Ошибка озвучки:", error);
      setIsSpeaking(false);
    }
  };

  const accentClass = accentColor === "red" ? "text-red-500 bg-red-500/10" : "text-amber-500 bg-amber-500/10";
  const borderClass = accentColor === "red" ? "hover:border-red-500/30" : "hover:border-amber-500/30";

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all ${borderClass}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accentClass}`}>
            {icon}
          </div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-amber-500"
          >
            {isSpeaking ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
          </button>
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {content && (
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}

        {timeline && (
          <div className="space-y-6">
            {timeline.map((frame, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-white/10 pb-2">
                <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${accentColor === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded">{frame.timestamp}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs text-zinc-400 italic">
                    <User size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{frame.visual}</span>
                  </div>
                  <div className="text-sm text-zinc-200 bg-white/5 p-3 rounded-lg border border-white/5">
                    "{frame.speech}"
                  </div>
                  <div className="flex gap-2 text-xs font-semibold text-amber-500/80 items-center">
                    <Monitor size={12} />
                    <span>Overlay: {frame.textOverlay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {subContent && subContent.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Детали</h4>
            <ul className="space-y-2">
              {subContent.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <span className={`flex-shrink-0 mt-1.5 w-1 h-1 rounded-full ${accentColor === 'red' ? 'bg-red-500/50' : 'bg-amber-500/50'}`}></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {leadMagnetFooter && (
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-xl border border-white/10 text-center">
            <p className="text-xs text-zinc-400 mb-2 uppercase font-bold tracking-widest">Призыв для сбора лидов</p>
            <p className="text-sm font-bold text-white">
              Пиши слово <span className="text-amber-500">"{leadMagnetFooter}"</span> в комментариях, чтобы получить этот материал!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
