
import React, { useState, useEffect, useRef } from 'react';
import { Home, Brain, AlertTriangle, Play, Pause } from 'lucide-react';
import { biometricService } from '../services/biometricService';
import { BiometricData } from '../types';

interface BioAdaptiveMathProps {
  onExit: () => void;
}

const BioAdaptiveMath: React.FC<BioAdaptiveMathProps> = ({ onExit }) => {
  const [bioData, setBioData] = useState<BiometricData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState<{q: string, a: number, options: number[]}>({q:'', a:0, options:[]});
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  // Clinical Metrics
  const [stressBlur, setStressBlur] = useState(0); // 0 to 10px blur
  const [recoveryPauses, setRecoveryPauses] = useState(0);

  // Subscribe to Biometrics
  useEffect(() => {
    const unsub = biometricService.subscribe((data) => {
      setBioData(data);
      
      // BIO-ADAPTIVE MECHANIC:
      // If Heart Rate > 90, the screen starts to blur.
      // This forces the user to apply coping strategies (pause, breathe) to see the numbers.
      if (data.heartRate > 90) {
        // Map 90-120bpm to 0-8px blur
        const blurAmount = Math.min(8, (data.heartRate - 90) / 3);
        setStressBlur(blurAmount);
      } else {
        setStressBlur(0);
      }
    });
    return () => unsub();
  }, []);

  const generateProblem = () => {
    const op = Math.random() > 0.5 ? '+' : '-';
    const a = Math.floor(Math.random() * 20) + 10;
    const b = Math.floor(Math.random() * 9) + 1;
    const ans = op === '+' ? a + b : a - b;
    
    // Generate distractors
    const options = [
        ans,
        ans + 1,
        ans - 1,
        ans + Math.floor(Math.random() * 5) + 2
    ].sort(() => Math.random() - 0.5);

    setProblem({
        q: `${a} ${op} ${b}`,
        a: ans,
        options: options
    });
    setFeedback(null);
  };

  const handleAnswer = (val: number) => {
    if (val === problem.a) {
        setScore(s => s + 100);
        setFeedback('correct');
        setTimeout(generateProblem, 500);
    } else {
        setScore(s => Math.max(0, s - 50));
        setFeedback('wrong');
        // Wrong answers slightly increase simulated stress in a real app, 
        // here we rely on the interval simulation
    }
  };

  const startGame = () => {
      setIsPlaying(true);
      generateProblem();
      setScore(0);
      setRecoveryPauses(0);
  };

  // Coping Strategy: Explicit Pause Button
  const handleTacticalPause = () => {
      setIsPlaying(false);
      setRecoveryPauses(p => p + 1);
      // In a real scenario, this is where the user breathes.
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full bg-white p-4 shadow-sm flex justify-between items-center z-20">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800"><Home size={24}/></button>
        <div className="flex items-center gap-2">
            <Brain className="text-purple-500" />
            <span className="font-bold text-slate-800">Desafío Bio-Adaptativo</span>
        </div>
        <div className="font-mono text-xl font-bold text-purple-600">{score} pts</div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        {/* Bio-Feedback Overlay (The Blur) */}
        <div 
            className="absolute inset-0 bg-white/0 pointer-events-none transition-all duration-1000 z-10 flex items-center justify-center"
            style={{ backdropFilter: `blur(${stressBlur}px)` }}
        >
            {stressBlur > 2 && (
                <div className="bg-white/90 p-6 rounded-2xl shadow-2xl border-l-4 border-red-500 flex items-center gap-4 animate-bounce">
                    <AlertTriangle className="text-red-500" size={32} />
                    <div>
                        <h3 className="font-bold text-red-600">Alta Excitación Detectada ({bioData?.heartRate} BPM)</h3>
                        <p className="text-sm text-slate-600">La visión se nubla por el estrés.</p>
                        <p className="text-xs font-bold mt-1 text-slate-800 uppercase">INSTRUCCIÓN: Pausa y respira para recuperar claridad.</p>
                    </div>
                </div>
            )}
        </div>

        {!isPlaying ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center z-0">
                <Brain size={48} className="mx-auto text-purple-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Entrenamiento de Resiliencia</h2>
                <p className="text-slate-500 mb-6">
                    Resuelve problemas matemáticos bajo presión. Si tu ritmo cardíaco sube demasiado, el juego se volverá más difícil de ver.
                </p>
                <button onClick={startGame} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors flex justify-center items-center gap-2">
                    <Play size={20} /> Iniciar Sesión
                </button>
            </div>
        ) : (
            <div className="w-full max-w-md flex flex-col gap-6 z-0">
                {/* Question Card */}
                <div className="bg-white p-12 rounded-3xl shadow-lg border-b-4 border-purple-200 flex justify-center items-center h-48 relative">
                    <span className="text-6xl font-bold text-slate-700 tracking-wider">
                        {problem.q} = ?
                    </span>
                    {feedback === 'correct' && <div className="absolute inset-0 flex items-center justify-center bg-green-100/80 rounded-3xl text-green-600 text-4xl font-bold">✓</div>}
                    {feedback === 'wrong' && <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 rounded-3xl text-red-600 text-4xl font-bold">✗</div>}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {problem.options.map((opt, i) => (
                        <button 
                            key={i}
                            onClick={() => handleAnswer(opt)}
                            className="py-6 bg-white hover:bg-purple-50 border-2 border-transparent hover:border-purple-200 rounded-2xl shadow-sm text-3xl font-bold text-slate-600 transition-all active:scale-95"
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Tactical Pause (Coping Mechanism) */}
                <button 
                    onClick={handleTacticalPause}
                    className="mt-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors"
                >
                    <Pause size={18} /> Pausa Táctica (Recuperación)
                </button>
            </div>
        )}

      </div>
      
      {/* Footer Stats */}
      <div className="bg-white p-2 flex justify-around text-xs text-slate-400 uppercase tracking-wider font-bold border-t border-slate-100">
          <span>Pausas de Recuperación: {recoveryPauses}</span>
          <span>Visibilidad: {Math.max(0, 100 - (stressBlur * 12))}%</span>
      </div>
    </div>
  );
};

export default BioAdaptiveMath;
