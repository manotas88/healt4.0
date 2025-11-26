
import React from 'react';
import { BreathPhase } from '../types';
import { Wind, Heart } from 'lucide-react';

interface BreathHudProps {
  phase: BreathPhase;
  inhaleProgress: number;
  exhaleProgress: number;
  timerText: string;
}

const BreathHud: React.FC<BreathHudProps> = ({ phase, inhaleProgress, exhaleProgress, timerText }) => {
  const inhaleCount = Math.ceil((inhaleProgress / 100) * 3);

  return (
    <div className="w-full max-w-md mx-auto mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm relative overflow-hidden">
      
      {/* Background Pulse Effect during action */}
      {phase !== BreathPhase.Idle && (
        <div className={`absolute inset-0 z-0 opacity-20 transition-colors duration-500 ${phase === BreathPhase.Inhale ? 'bg-green-100' : 'bg-blue-100'}`} />
      )}

      <div className="relative z-10 flex justify-center gap-6 items-end h-32">
        
        {/* Inhale Meter */}
        <div className={`flex flex-col items-center transition-all duration-300 ${phase === BreathPhase.Inhale ? 'opacity-100 scale-105' : 'opacity-40 scale-90 grayscale'}`}>
          <div className="relative w-10 h-20 bg-slate-100 border-4 border-slate-300 rounded-2xl overflow-hidden flex items-end justify-center">
            <div 
              className="absolute bottom-0 w-full bg-green-400 transition-all duration-100 ease-linear"
              style={{ height: `${inhaleProgress}%` }}
            />
            {phase === BreathPhase.Inhale && (
               <span className="absolute bottom-2 z-10 text-xl font-bold text-white drop-shadow-md">
                 {Math.min(3, Math.max(1, inhaleCount))}
               </span>
            )}
          </div>
          <span className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Inhale</span>
        </div>

        {/* CENTER ANIMATED ICON */}
        <div className="flex flex-col items-center justify-center w-24 h-24 mb-4">
           {phase === BreathPhase.Idle && (
               <div className="text-slate-300 animate-pulse">
                   <Wind size={48} />
               </div>
           )}

           {phase === BreathPhase.Inhale && (
               <div className="relative">
                   <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                   <Heart 
                      size={48} 
                      className="text-green-500 transition-transform duration-100 ease-out" 
                      style={{ transform: `scale(${1 + (inhaleProgress / 100) * 0.5})` }}
                      fill="currentColor"
                   />
               </div>
           )}

           {phase === BreathPhase.Exhale && (
               <div className="relative">
                   <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20"></div>
                   <Wind 
                      size={48} 
                      className="text-blue-500 animate-[bounce_0.2s_infinite]" 
                   />
               </div>
           )}
        </div>

        {/* Exhale Meter */}
        <div className={`flex flex-col items-center transition-all duration-300 ${phase === BreathPhase.Exhale ? 'opacity-100 scale-105' : 'opacity-40 scale-90 grayscale'}`}>
          <div className="relative w-10 h-20 bg-slate-100 border-4 border-slate-300 rounded-2xl overflow-hidden flex items-end">
            <div 
              className="w-full bg-blue-400 transition-all duration-100 ease-linear"
              style={{ height: `${exhaleProgress}%` }}
            />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-600 font-mono">{timerText}</span>
        </div>

      </div>
      
      <div className="text-center h-6 relative z-10">
        {phase === BreathPhase.Inhale && <p className="text-green-600 font-bold text-lg animate-pulse">Llenando pulmones...</p>}
        {phase === BreathPhase.Exhale && <p className="text-blue-600 font-bold text-lg animate-pulse">Soltando tensión...</p>}
        {phase === BreathPhase.Idle && <p className="text-slate-400 text-sm">Toca una nube gris para comenzar</p>}
      </div>
    </div>
  );
};

export default BreathHud;
