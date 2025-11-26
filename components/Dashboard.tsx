
import React from 'react';
import { Brain, Waves, Calculator, Palette } from 'lucide-react';

interface DashboardProps {
  onSelectGame: (gameId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectGame }) => {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 w-full pt-8 pb-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Health Hub</h1>
        <p className="text-slate-500">Selecciona tu terapia digital diaria</p>
      </div>

      <div className="grid gap-6 w-full max-w-4xl grid-cols-1 md:grid-cols-3">
        
        {/* Card 1: NeuroBreath (Guided) */}
        <button 
          onClick={() => onSelectGame('neurobreath')}
          className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <div className="mb-4 p-4 bg-cyan-50 text-cyan-600 rounded-full group-hover:scale-110 transition-transform">
            <Waves size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">NeuroBreath</h2>
          <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
            Biofeedback respiratorio + Patrones cognitivos.
          </p>
          <div className="mt-auto w-full pt-4 border-t border-slate-50 flex flex-col gap-1">
             <span className="text-[10px] uppercase font-bold text-slate-400">Objetivo Clínico:</span>
             <span className="text-xs font-semibold text-cyan-700">Coherencia Cardíaca</span>
          </div>
        </button>

        {/* Card 2: Mandala Flow (Sensory/Flow) */}
        <button 
          onClick={() => onSelectGame('mandala')}
          className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-rose-500" />
          <div className="mb-4 p-4 bg-pink-50 text-pink-600 rounded-full group-hover:scale-110 transition-transform">
            <Palette size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Mandala Flow</h2>
          <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
            Arte generativo sincronizado con tu pulso.
          </p>
          <div className="mt-auto w-full pt-4 border-t border-slate-50 flex flex-col gap-1">
             <span className="text-[10px] uppercase font-bold text-slate-400">Objetivo Clínico:</span>
             <span className="text-xs font-semibold text-pink-700">Inducción Estado de Flow</span>
          </div>
        </button>

        {/* Card 3: Bio-Adaptive Math (Progressive Challenge) */}
        <button 
          onClick={() => onSelectGame('math')}
          className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-indigo-500" />
          <div className="mb-4 p-4 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
            <Calculator size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Math Resiliencia</h2>
          <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
            El estrés nubla la visión. Respira para resolver.
          </p>
          <div className="mt-auto w-full pt-4 border-t border-slate-50 flex flex-col gap-1">
             <span className="text-[10px] uppercase font-bold text-slate-400">Objetivo Clínico:</span>
             <span className="text-xs font-semibold text-purple-700">Regulación Emocional</span>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
