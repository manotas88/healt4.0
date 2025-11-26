
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BubbleEntity, BubbleColor, BubbleState, LevelConfig, GamePhase, BreathPhase, GameMode, DifficultyProfile } from '../types';
import { audioService } from '../services/audioService';
import { biometricService } from '../services/biometricService'; // Import Biometric Service
import BubbleGrid from './BubbleGrid';
import BreathHud from './BreathHud';
import MedicalAssistant from './MedicalAssistant';
import { Zap, Play, RotateCcw, Home, Clock, Heart, Skull, Stethoscope } from 'lucide-react';

const LEVELS: LevelConfig[] = [
  { id: 1, breathDurationSec: 3.0, scoreGoal: 500, bgColor: 'bg-calm-bg' },
  { id: 2, breathDurationSec: 3.0, scoreGoal: 1000, bgColor: 'bg-green-50' },
  { id: 3, breathDurationSec: 3.0, scoreGoal: 2000, bgColor: 'bg-orange-50' },
];

const ROWS = 7; // Increased grid density
const COLS = 7;
const COLORS = [BubbleColor.Red, BubbleColor.Blue, BubbleColor.Green, BubbleColor.Purple, BubbleColor.Yellow];

// Utils
const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

interface GameEngineProps {
  onExit: () => void;
  difficultyProfile: DifficultyProfile;
}

const GameEngine: React.FC<GameEngineProps> = ({ onExit, difficultyProfile }) => {
  // Game State
  const [phase, setPhase] = useState<GamePhase>(GamePhase.ModeSelect);
  const [mode, setMode] = useState<GameMode>(GameMode.Therapy);
  
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleEntity[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  
  // Tutorial State
  const [instruction, setInstruction] = useState<string>("¡Bienvenido! Toca una nube gris para empezar.");
  const [tutorialStep, setTutorialStep] = useState(0); // 0: Start, 1: Breath, 2: Swap
  
  // Mode specific state
  const [timeLeft, setTimeLeft] = useState(120); // For Time Trial
  const [lives, setLives] = useState(3); // For Infinite
  
  // Breath State
  const [breathPhase, setBreathPhase] = useState<BreathPhase>(BreathPhase.Idle);
  const [breathTargetId, setBreathTargetId] = useState<string | null>(null);
  const [inhaleProg, setInhaleProg] = useState(0);
  const [exhaleProg, setExhaleProg] = useState(0);
  
  // Refs for loop
  const requestRef = useRef<number>(0);
  const gameStateRef = useRef({ breathPhase: BreathPhase.Idle, inhaleProg: 0, exhaleProg: 0 });

  // Timer Effect (Time Trial)
  useEffect(() => {
    let interval: number;
    if (phase === GamePhase.Playing && mode === GameMode.TimeTrial) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             setPhase(GamePhase.Victory); // End of time
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, mode]);

  // Initialize Level / Game
  const initGame = useCallback((selectedMode: GameMode, levelIdx = 0) => {
    setMode(selectedMode);
    setCurrentLevelIdx(levelIdx);
    setScore(0);
    setBreathPhase(BreathPhase.Idle);
    setBreathTargetId(null);
    setInhaleProg(0);
    setExhaleProg(0);
    gameStateRef.current = { breathPhase: BreathPhase.Idle, inhaleProg: 0, exhaleProg: 0 };
    
    // Tutorial Reset
    setTutorialStep(0);
    setInstruction("Selecciona una nube gris para empezar.");

    // Mode defaults
    setTimeLeft(120);
    setLives(3);

    // Generate initial board with REDUCED clustering logic (Harder)
    const newBubbles: BubbleEntity[] = [];
    for (let i = 0; i < ROWS * COLS; i++) {
        // Reduced clustering: Only 15% chance to copy left neighbor's color (was 50%)
        let color = getRandomColor();
        if (i % COLS > 0 && Math.random() > 0.85) {
             color = newBubbles[i-1].color;
        }
        
        newBubbles.push({
            id: generateId(),
            index: i,
            color: color,
            state: BubbleState.Hidden
        });
    }
    setBubbles(newBubbles);
    setPhase(GamePhase.Playing);
  }, []);

  const handleStartMode = async (selectedMode: GameMode) => {
    try {
      await audioService.initialize();
      initGame(selectedMode);
    } catch (e) {
      alert("Se requiere acceso al micrófono para las funciones terapéuticas.");
    }
  };

  const handleNextLevel = () => {
    if (mode === GameMode.Therapy && currentLevelIdx < LEVELS.length - 1) {
      initGame(GameMode.Therapy, currentLevelIdx + 1);
    } else {
      setPhase(GamePhase.Victory);
    }
  };

  const handleRetry = () => {
    initGame(mode, 0);
  };

  // --- Logic: Gravity & Matching ---
  const applyGravity = useCallback((currentBubbles: BubbleEntity[]) => {
    const newBubbles = [...currentBubbles];
    let hasChanges = false;

    for (let c = 0; c < COLS; c++) {
      let writePtr = ROWS - 1;
      
      for (let r = ROWS - 1; r >= 0; r--) {
        const idx = r * COLS + c;
        if (newBubbles[idx].state !== BubbleState.Popped) {
            if (writePtr !== r) {
              const targetIdx = writePtr * COLS + c;
              newBubbles[targetIdx] = { ...newBubbles[idx], index: targetIdx, isNew: false };
            }
            writePtr--;
        }
      }

      while (writePtr >= 0) {
        const targetIdx = writePtr * COLS + c;
        // REDUCED SMART GRAVITY: Only 30% chance to copy neighbor (was 70%)
        let newColor = getRandomColor();
        
        // Check neighbor below (which we just processed/filled)
        const belowIdx = targetIdx + COLS;
        if (belowIdx < ROWS * COLS && Math.random() > 0.7) {
            newColor = newBubbles[belowIdx].color;
        }

        newBubbles[targetIdx] = {
          id: generateId(),
          index: targetIdx,
          color: newColor,
          state: BubbleState.Hidden,
          isNew: true
        };
        writePtr--;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setBubbles(newBubbles);
    }
  }, []);

  const findMatches = (currentBubbles: BubbleEntity[]): number[] => {
    const matches = new Set<number>();
    const visited = new Set<number>();

    const getNeighbors = (i: number) => {
      const r = Math.floor(i / COLS), c = i % COLS;
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(i - COLS);
      if (r < ROWS - 1) neighbors.push(i + COLS);
      if (c > 0) neighbors.push(i - 1);
      if (c < COLS - 1) neighbors.push(i + 1);
      return neighbors;
    };

    for (let i = 0; i < currentBubbles.length; i++) {
      if (currentBubbles[i].state === BubbleState.Revealed && !visited.has(i)) {
        const color = currentBubbles[i].color;
        const group: number[] = [];
        const stack = [i];
        const seenInGroup = new Set([i]);

        while (stack.length) {
          const curr = stack.pop()!;
          group.push(curr);
          getNeighbors(curr).forEach(n => {
            if (!seenInGroup.has(n) && currentBubbles[n].state === BubbleState.Revealed && currentBubbles[n].color === color) {
              seenInGroup.add(n);
              stack.push(n);
            }
          });
        }

        group.forEach(idx => visited.add(idx));
        if (group.length >= 3) {
          group.forEach(idx => matches.add(idx));
        }
      }
    }
    return Array.from(matches);
  };

  const processMatches = (matchIndices: number[], currentBubbles: BubbleEntity[]) => {
    audioService.playPopSound();
    biometricService.triggerRecoveryEvent(); // MEDICAL BENEFIT: IMPROVE STATS
    
    // Tutorial Update
    if (tutorialStep === 2) {
        setInstruction("¡Excelente! Has entendido la mecánica básica.");
        setTutorialStep(3); 
    }

    const nextBubbles = [...currentBubbles];
    matchIndices.forEach(idx => {
      nextBubbles[idx] = { ...nextBubbles[idx], state: BubbleState.Popped };
    });
    
    setBubbles(nextBubbles);
    
    const points = matchIndices.length * 10;
    setScore(s => {
      const updated = s + points;
      // In Therapy mode, check level goal
      if (mode === GameMode.Therapy) {
        const target = LEVELS[currentLevelIdx].scoreGoal;
        if (updated >= target) {
          setTimeout(() => {
              audioService.playWinSound();
              setPhase(GamePhase.LevelComplete);
          }, 1000);
        }
      }
      return updated;
    });

    setTimeout(() => {
      applyGravity(nextBubbles);
    }, 400);
  };

  const handleSwap = (fromIdx: number, toIdx: number) => {
    if (bubbles[fromIdx].state !== BubbleState.Revealed || bubbles[toIdx].state !== BubbleState.Revealed) return;

    const nextBubbles = [...bubbles];
    const tempObj = { ...nextBubbles[fromIdx] };
    nextBubbles[fromIdx] = { ...nextBubbles[toIdx], index: fromIdx };
    nextBubbles[toIdx] = { ...tempObj, index: toIdx };

    setBubbles(nextBubbles);

    setTimeout(() => {
      const matches = findMatches(nextBubbles);
      if (matches.length > 0) {
        processMatches(matches, nextBubbles);
      } else {
        // INVALID MOVE
        
        // Mode: Infinite - Lose Life
        if (mode === GameMode.Infinite) {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setPhase(GamePhase.GameOver);
                }
                return newLives;
            });
        }

        // Revert
        const revertBubbles = [...nextBubbles];
        const rTemp = { ...revertBubbles[fromIdx] };
        revertBubbles[fromIdx] = { ...revertBubbles[toIdx], index: fromIdx };
        revertBubbles[toIdx] = { ...rTemp, index: toIdx };
        setBubbles(revertBubbles);
        
        // Tutorial Tip on Error
        if (tutorialStep === 2) {
             setInstruction("Intenta unir al menos 3 burbujas del mismo color.");
        }
      }
    }, 300);
  };

  const handleBubbleClick = (index: number) => {
    if (bubbles[index].state === BubbleState.Hidden) {
      setBreathTargetId(bubbles[index].id);
      setBreathPhase(BreathPhase.Inhale);
      gameStateRef.current.breathPhase = BreathPhase.Inhale;
      
      if (tutorialStep === 0) {
          setInstruction("Inhala profundo por la nariz (1... 2... 3...)");
          setTutorialStep(1);
      }
    }
  };

  // Expanded Blast Area (Radius 3)
  const getBlastAreaIndices = (centerIdx: number) => {
    const r = Math.floor(centerIdx / COLS), c = centerIdx % COLS;
    const indices: number[] = [];
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        // Diamond shape radius 3
        if (Math.abs(x) + Math.abs(y) <= 3) {
          const nr = r + y, nc = c + x;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            indices.push(nr * COLS + nc);
          }
        }
      }
    }
    return indices;
  };

  // --- Breath Loop ---
  const updateBreath = () => {
    if (gameStateRef.current.breathPhase === BreathPhase.Idle) {
      requestRef.current = requestAnimationFrame(updateBreath);
      return;
    }

    const level = LEVELS[currentLevelIdx]; 
    const personalizedDuration = level.breathDurationSec * difficultyProfile.breathDurationMod;
    const speed = 100 / (personalizedDuration * 60);

    if (gameStateRef.current.breathPhase === BreathPhase.Inhale) {
      gameStateRef.current.inhaleProg += speed;
      if (gameStateRef.current.inhaleProg >= 100) {
        gameStateRef.current.inhaleProg = 100;
        gameStateRef.current.breathPhase = BreathPhase.Exhale;
        setBreathPhase(BreathPhase.Exhale);
        
        if (tutorialStep === 1) {
            setInstruction("¡Ahora sopla fuerte al micrófono!");
        }
      }
      setInhaleProg(gameStateRef.current.inhaleProg);
    } 
    else if (gameStateRef.current.breathPhase === BreathPhase.Exhale) {
      const vol = audioService.getVolume();
      if (vol > 10) {
        gameStateRef.current.exhaleProg += speed;
        if (gameStateRef.current.exhaleProg >= 100) {
           gameStateRef.current.exhaleProg = 100;
           setExhaleProg(100);
           
           audioService.playPopSound();
           
           // TRIGGER EFFECTS
           setScreenShake(true);
           setTimeout(() => setScreenShake(false), 500);

           setBubbles(prev => {
             const newB = [...prev];
             const target = newB.find(b => b.id === breathTargetId);
             if (target) {
               const blastIndices = getBlastAreaIndices(target.index);
               blastIndices.forEach(idx => {
                  if (newB[idx].state === BubbleState.Hidden) {
                      newB[idx].state = BubbleState.Revealed;
                  }
               });
             }
             return newB;
           });
           
           // Medical Benefit on Breath Complete
           biometricService.triggerRecoveryEvent();

           gameStateRef.current.breathPhase = BreathPhase.Idle;
           gameStateRef.current.inhaleProg = 0;
           gameStateRef.current.exhaleProg = 0;
           setBreathPhase(BreathPhase.Idle);
           setBreathTargetId(null);
           setInhaleProg(0);
           setExhaleProg(0);
           
           if (tutorialStep === 1) {
                setInstruction("¡Muy bien! Arrastra para unir 3 colores.");
                setTutorialStep(2);
           }
        }
        setExhaleProg(gameStateRef.current.exhaleProg);
      }
    }
    requestRef.current = requestAnimationFrame(updateBreath);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateBreath);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [currentLevelIdx, breathTargetId, tutorialStep, difficultyProfile]);

  // --- Render Views ---

  if (phase === GamePhase.ModeSelect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-calm-bg w-full">
        <button onClick={onExit} className="absolute top-4 left-4 p-2 bg-white rounded-full shadow text-slate-500">
           <Home size={20} />
        </button>
        <div className="mb-4 text-6xl">🫧</div>
        <h1 className="text-3xl font-bold text-calm-secondary mb-2">Selecciona Terapia</h1>
        
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
           <Stethoscope size={14} />
           {difficultyProfile.targetLabel}
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-sm">
            <button 
                onClick={() => handleStartMode(GameMode.Therapy)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md hover:bg-cyan-50 transition-colors text-left border-l-4 border-cyan-400"
            >
                <div className="p-3 bg-cyan-100 text-cyan-600 rounded-full"><Heart size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800">Modo Guiado</h3>
                    <p className="text-xs text-slate-500">Ajustado a tu nivel de estrés actual.</p>
                </div>
            </button>

            <button 
                onClick={() => handleStartMode(GameMode.TimeTrial)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md hover:bg-cyan-50 transition-colors text-left"
            >
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><Clock size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800">Contrarreloj</h3>
                    <p className="text-xs text-slate-500">2 Minutos. Máxima Puntuación.</p>
                </div>
            </button>

            <button 
                onClick={() => handleStartMode(GameMode.Infinite)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md hover:bg-cyan-50 transition-colors text-left"
            >
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Zap size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800">Zen Infinito</h3>
                    <p className="text-xs text-slate-500">No cometas errores.</p>
                </div>
            </button>
        </div>
      </div>
    );
  }

  if (phase === GamePhase.LevelComplete || phase === GamePhase.Victory || phase === GamePhase.GameOver) {
     return (
        <div className={`flex flex-col items-center justify-center min-h-screen w-full ${phase === GamePhase.GameOver ? 'bg-red-50' : 'bg-green-50'}`}>
             <div className="text-6xl mb-4 animate-bounce">
                {phase === GamePhase.GameOver ? '💀' : '✨'}
             </div>
             <h2 className="text-3xl font-bold text-calm-secondary mb-2">
                {phase === GamePhase.GameOver ? 'Sesión Terminada' : 
                 phase === GamePhase.Victory ? 'Ciclo Completo' : '¡Nivel Superado!'}
             </h2>
             <p className="mb-4 text-slate-600 text-lg font-bold">Bio-Puntuación: {score}</p>
             <div className="flex gap-4">
                 <button onClick={onExit} className="px-6 py-3 bg-white text-slate-600 rounded-full shadow-lg border border-slate-200">
                    Salir
                 </button>
                 <button onClick={handleRetry} className="px-6 py-3 bg-calm-secondary text-white rounded-full shadow-lg flex items-center gap-2">
                    <RotateCcw size={20} /> Reiniciar
                 </button>
                 {(phase === GamePhase.LevelComplete && mode === GameMode.Therapy) && (
                     <button onClick={handleNextLevel} className="px-6 py-3 bg-calm-accent text-white rounded-full shadow-lg">
                        Siguiente
                     </button>
                 )}
             </div>
        </div>
     )
  }

  // PLAYING
  return (
    <div className={`flex flex-col items-center min-h-screen pt-4 px-4 pb-8 transition-colors duration-1000 w-full ${LEVELS[currentLevelIdx].bgColor} ${screenShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      
      {/* Top Bar */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4">
        <button onClick={onExit} className="p-2 text-slate-400 hover:text-slate-600"><Home size={20}/></button>
        
        {/* Mode Specific Indicators */}
        {mode === GameMode.TimeTrial && (
            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                <Clock size={20} />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
        )}

        {mode === GameMode.Infinite && (
             <div className="flex items-center gap-1">
                {[1, 2, 3].map(i => (
                    <Heart key={i} size={24} className={i <= lives ? 'fill-red-500 text-red-500' : 'text-slate-300'} />
                ))}
             </div>
        )}

        {mode === GameMode.Therapy && (
             <span className="text-sm font-bold text-slate-400 uppercase">Nivel {LEVELS[currentLevelIdx].id}</span>
        )}
      </div>

      {/* Score Bar */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-slate-500 uppercase font-bold">Progreso Neuro-Cognitivo</span>
            <span className="text-xl font-bold text-calm-secondary">{score} {mode === GameMode.Therapy && `/ ${LEVELS[currentLevelIdx].scoreGoal}`}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
                className="h-full bg-calm-highlight transition-all duration-500" 
                style={{ width: mode === GameMode.Therapy ? `${Math.min(100, (score / LEVELS[currentLevelIdx].scoreGoal) * 100)}%` : '100%'}}
            />
        </div>
      </div>

      <BreathHud 
        phase={breathPhase}
        inhaleProgress={inhaleProg}
        exhaleProgress={exhaleProg}
        timerText={((exhaleProg / 100) * (LEVELS[currentLevelIdx].breathDurationSec * difficultyProfile.breathDurationMod)).toFixed(1) + 's'}
      />

      <BubbleGrid 
        bubbles={bubbles}
        breathPhase={breathPhase}
        targetBubbleId={breathTargetId}
        onBubbleClick={handleBubbleClick}
        onSwap={handleSwap}
        rows={ROWS}
        cols={COLS}
      />
      
      {/* INSTRUCTION POPUP */}
      <MedicalAssistant message={instruction} />

    </div>
  );
};

export default GameEngine;
