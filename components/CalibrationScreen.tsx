
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Check, ChevronRight, Camera, ScanFace, Smile, Zap, Eye, Heart, Wind, FileText, Brain, AlertTriangle } from 'lucide-react';
import { DifficultyProfile, BiometricData } from '../types';
import { biometricService } from '../services/biometricService';

interface CalibrationScreenProps {
  onComplete: (profile: DifficultyProfile, recommendedGame: string) => void;
}

interface FacialAnalysis {
  stress: number;   // 0-100
  fatigue: number;  // 0-100
  happiness: number;// 0-100
  completed: boolean;
}

const CalibrationScreen: React.FC<CalibrationScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  
  // Phase 1: Facial Analysis State
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("Iniciando sensores...");
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis>({ stress: 0, fatigue: 0, happiness: 0, completed: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Phase 2 & 3 State
  const [sleepQuality, setSleepQuality] = useState<'good'|'avg'|'poor' | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [bioData, setBioData] = useState<BiometricData | null>(null);

  // Subscribe to biometrics for visualization
  useEffect(() => {
    biometricService.startSimulation();
    const unsub = biometricService.subscribe(setBioData);
    return () => {
      unsub();
    };
  }, []);

  // Cleanup camera on unmount or step change
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Scanning Animation in Step 3 (Biometrics)
  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        startScanProcess();
      }
    } catch (err) {
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const startScanProcess = () => {
    setIsScanning(true);
    setScanMessage("Detectando puntos faciales...");
    
    // Simulate Analysis Steps
    setTimeout(() => setScanMessage("Midiendo tensión micro-muscular..."), 1000);
    setTimeout(() => setScanMessage("Analizando patrones de parpadeo..."), 2000);
    setTimeout(() => setScanMessage("Correlacionando con biomarcadores..."), 3000);

    setTimeout(() => {
      // Simulate Results (In a real app, this would use face-api.js)
      const simulatedResults = {
        stress: Math.floor(Math.random() * 40) + 30, // 30-70 range
        fatigue: Math.floor(Math.random() * 50) + 20,
        happiness: Math.floor(Math.random() * 40) + 10,
        completed: true
      };
      setFacialAnalysis(simulatedResults);
      setIsScanning(false);
    }, 4000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleNextStep = () => {
    stopCamera();
    setStep(2);
  };

  const calculateResults = () => {
    let riskFactor = 0;
    
    // Camera Analysis Factors
    if (facialAnalysis.stress > 60) riskFactor += 2;
    if (facialAnalysis.fatigue > 60) riskFactor += 1;
    if (facialAnalysis.happiness > 60) riskFactor -= 1; // Happiness mitigates stress

    // Sleep Factors
    if (sleepQuality === 'poor') riskFactor += 2;
    
    // Biometric Factors
    if (bioData?.stressLevel === 'High') riskFactor += 2;
    else if (bioData?.stressLevel === 'Medium') riskFactor += 1;

    // 1. Difficulty Profile
    let profile: DifficultyProfile;
    if (riskFactor >= 2) {
      profile = {
        breathDurationMod: 1.5, // 50% slower breathing required to force relaxation
        visualSpeed: 'slow',
        targetLabel: 'Modo Restaurativo (Relajación)'
      };
    } else {
      profile = {
        breathDurationMod: 1.0,
        visualSpeed: 'normal',
        targetLabel: 'Modo Alto Rendimiento'
      };
    }

    // 2. Module Recommendation Logic
    let recommendedGame = 'neurobreath'; // Default: Breathwork is good for everything
    let diagnosisTitle = "Protocolo: ACTIVACIÓN";
    
    const isHighStress = facialAnalysis.stress > 65 || bioData?.stressLevel === 'High';
    const isHighFatigue = facialAnalysis.fatigue > 60 || sleepQuality === 'poor';

    if (isHighFatigue) {
        // High Fatigue -> Needs gentle flow, no cognitive load
        recommendedGame = 'mandala'; 
        diagnosisTitle = "Protocolo: FLUJO SENSORIAL";
    } else if (isHighStress) {
        // High Stress but ok energy -> Needs active breath regulation
        recommendedGame = 'neurobreath';
        diagnosisTitle = "Protocolo: REGULACIÓN VAGAL";
    } else {
        // Good stats -> Ready for cognitive challenge
        recommendedGame = 'math';
        diagnosisTitle = "Protocolo: RESILIENCIA COGNITIVA";
    }

    return { profile, recommendedGame, diagnosisTitle };
  };

  const handleFinish = () => {
    const { profile, recommendedGame } = calculateResults();
    onComplete(profile, recommendedGame);
  };

  const { diagnosisTitle, recommendedGame } = calculateResults();

  // Helper for Diagnosis Display (Visuals only)
  const getVisualDiagnosis = () => {
    if (recommendedGame === 'mandala') {
        return {
            title: diagnosisTitle,
            desc: "Se detecta fatiga significativa. Redireccionando a módulo de Arte Generativo para descanso activo.",
            color: "text-pink-600",
            bg: "bg-pink-50",
            border: "border-pink-200",
            icon: <Eye />
        };
    }
    if (recommendedGame === 'neurobreath') {
        return {
            title: diagnosisTitle,
            desc: "Marcadores de estrés elevados. Se requiere intervención de Biofeedback Respiratorio.",
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            border: "border-cyan-200",
            icon: <Wind />
        };
    }
    return {
        title: diagnosisTitle,
        desc: "Biometría óptima. Asignando desafío de matemáticas bio-adaptativas para entrenamiento de enfoque.",
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: <Brain />
    };
  };

  const diag = getVisualDiagnosis();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
      <div className="absolute top-10 right-10 opacity-5 animate-pulse text-cyan-600 pointer-events-none">
         <Activity size={200} />
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 z-10 transition-all duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-4">
          <div className={`p-3 rounded-2xl text-white transition-colors duration-500 ${step === 3 ? 'bg-purple-600' : 'bg-slate-900'}`}>
            {step === 1 ? <ScanFace size={24} /> : step === 2 ? <Brain size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Evaluación Bio-Psicológica</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
               Fase {step} de 3: {step === 1 ? 'Análisis Facial' : step === 2 ? 'Subjetiva' : 'Diagnóstico'}
            </p>
          </div>
        </div>

        {/* STEP 1: Camera Facial Scan */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Camera size={20} className="text-cyan-500"/> Scan Facial
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              Analizando micro-expresiones para detectar biomarcadores de estrés y fatiga ocular.
            </p>
            
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-6 shadow-xl border-4 border-slate-100 group">
              {!cameraActive && !facialAnalysis.completed && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 backdrop-blur-sm z-10">
                    <ScanFace size={48} className="mb-2 opacity-50"/>
                    <span className="text-xs font-bold uppercase tracking-wider">Esperando Cámara...</span>
                 </div>
              )}
              
              <video 
                 ref={videoRef} 
                 autoPlay 
                 muted 
                 playsInline
                 className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${!cameraActive ? 'opacity-0' : 'opacity-100'}`}
              />

              {/* Advanced Scanning UI Overlay */}
              {isScanning && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
                    
                    {/* Scanning Bar */}
                    <div className="w-full h-2 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,1)] absolute animate-[scan_2s_ease-in-out_infinite]" />
                    
                    {/* Data Readout */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-cyan-300 bg-black/60 backdrop-blur px-2 py-1 rounded border border-cyan-500/30 animate-pulse">
                            {scanMessage}
                        </span>
                        <span className="text-[10px] font-mono text-green-300 bg-black/60 backdrop-blur px-2 py-1 rounded border border-green-500/30">
                            FACE_DETECTED: TRUE
                        </span>
                    </div>

                    {/* Face Target Frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-cyan-500/50 rounded-[3rem] shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                    </div>
                </div>
              )}
            </div>

            {/* Results Display */}
            {facialAnalysis.completed ? (
              <div className="mb-6 grid grid-cols-3 gap-2">
                 <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center border border-slate-200">
                    <Zap size={20} className={`mb-1 ${facialAnalysis.stress > 50 ? 'text-orange-500' : 'text-green-500'}`} />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Estrés</span>
                    <span className="font-mono font-bold text-lg">{facialAnalysis.stress}%</span>
                 </div>
                 
                 <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center border border-slate-200">
                    <Eye size={20} className={`mb-1 ${facialAnalysis.fatigue > 50 ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Fatiga</span>
                    <span className="font-mono font-bold text-lg">{facialAnalysis.fatigue}%</span>
                 </div>

                 <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center border border-slate-200">
                    <Smile size={20} className="mb-1 text-yellow-500" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Ánimo</span>
                    <span className="font-mono font-bold text-lg">{facialAnalysis.happiness}%</span>
                 </div>
              </div>
            ) : null}

            {!cameraActive && !facialAnalysis.completed && (
                <button 
                onClick={startCamera}
                className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200/50 hover:shadow-cyan-200 hover:scale-[1.02]"
                >
                <ScanFace size={20} /> Iniciar Escaneo Facial
                </button>
            )}

            {cameraActive && isScanning && (
                 <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> Procesando Datos...
                 </div>
            )}

            {facialAnalysis.completed && (
                <button 
                onClick={handleNextStep}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                Confirmar Datos <ChevronRight size={20} />
                </button>
            )}
            
          </div>
        )}

        {/* STEP 2: Sleep Quality */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Brain size={20} className="text-purple-500"/> Higiene del Sueño
            </h2>
            <p className="text-slate-500 mb-6 text-sm">Validación subjetiva. ¿Cómo fue tu descanso?</p>
            
            <div className="flex flex-col gap-3 mb-8">
              <button 
                onClick={() => setSleepQuality('good')}
                className={`group p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${sleepQuality === 'good' ? 'border-green-500 bg-green-50 text-green-900' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <span className="font-bold block text-lg">Bueno / Reparador</span>
                        <span className="text-xs opacity-70">Me siento con energía.</span>
                    </div>
                    {sleepQuality === 'good' && <Check size={24} className="text-green-600"/>}
                </div>
              </button>
              
              <button 
                onClick={() => setSleepQuality('avg')}
                className={`group p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${sleepQuality === 'avg' ? 'border-yellow-500 bg-yellow-50 text-yellow-900' : 'border-slate-100 hover:border-slate-300'}`}
              >
                 <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <span className="font-bold block text-lg">Regular</span>
                        <span className="text-xs opacity-70">Despertares intermitentes.</span>
                    </div>
                    {sleepQuality === 'avg' && <Check size={24} className="text-yellow-600"/>}
                </div>
              </button>

              <button 
                onClick={() => setSleepQuality('poor')}
                className={`group p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${sleepQuality === 'poor' ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 hover:border-slate-300'}`}
              >
                 <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <span className="font-bold block text-lg">Malo / Insuficiente</span>
                        <span className="text-xs opacity-70">Siento fatiga y somnolencia.</span>
                    </div>
                    {sleepQuality === 'poor' && <Check size={24} className="text-red-600"/>}
                </div>
              </button>
            </div>

            <button 
              disabled={!sleepQuality}
              onClick={() => setStep(3)}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar a Biometría <Activity size={20} />
            </button>
          </div>
        )}

        {/* STEP 3: Summary & Auto-Diagnosis */}
        {step === 3 && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
            
            {scanProgress < 100 ? (
               <>
                <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                    {/* SVG Background Circle */}
                    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="58" stroke="#f1f5f9" strokeWidth="8" fill="none"/>
                        <circle 
                            cx="64" cy="64" r="58" 
                            stroke="#8b5cf6" strokeWidth="8" fill="none"
                            strokeDasharray={365}
                            strokeDashoffset={365 - (365 * scanProgress) / 100}
                            className="transition-all duration-300 ease-linear"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="flex flex-col items-center animate-pulse">
                         <Activity size={32} className="text-purple-500 mb-1"/>
                         <span className="text-2xl font-bold text-slate-800">{scanProgress}%</span>
                    </div>
                </div>

                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs space-y-2">
                   <div className="flex justify-between text-slate-500">
                      <span>STATUS:</span> <span className="text-purple-600 font-bold">SYNCHRONIZING</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="flex gap-2 items-center"><Heart size={10}/> SENSOR CARDÍACO</span>
                      <span className={scanProgress > 20 ? "text-green-600 font-bold" : "text-slate-300"}>{scanProgress > 20 ? "OK" : "WAITING"}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="flex gap-2 items-center"><Wind size={10}/> OXÍMETRO (SpO2)</span>
                      <span className={scanProgress > 50 ? "text-green-600 font-bold" : "text-slate-300"}>{scanProgress > 50 ? "OK" : "WAITING"}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="flex gap-2 items-center"><Brain size={10}/> ALGORITMO AUTO-DIAGNÓSTICO</span>
                      <span className={scanProgress > 80 ? "text-green-600 font-bold" : "text-slate-300"}>{scanProgress > 80 ? "COMPLETED" : "CALCULATING"}</span>
                   </div>
                </div>
               </>
            ) : (
                <div className="w-full animate-in fade-in slide-in-from-bottom duration-500">
                    
                    {/* AUTO-DIAGNOSIS CARD */}
                    <div className={`w-full rounded-2xl shadow-lg border-2 p-5 mb-6 relative overflow-hidden ${diag.bg} ${diag.border}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            {diag.icon}
                        </div>
                        <div className="relative z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Resultado del Auto-Diagnóstico</span>
                            <h3 className={`text-2xl font-extrabold mb-2 ${diag.color} flex items-center gap-2`}>
                                {diag.title}
                            </h3>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                {diag.desc}
                            </p>
                        </div>
                    </div>

                    {/* DETAILED METRICS GRID */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* 1. Stress (Facial + HRV) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <Zap size={14} />
                                <span className="text-[10px] font-bold uppercase">Nivel Estrés</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className={`text-lg font-bold ${facialAnalysis.stress > 50 ? 'text-orange-500' : 'text-slate-700'}`}>
                                    {facialAnalysis.stress > 50 ? 'ALTO' : 'NORMAL'}
                                </span>
                                <span className="text-xs text-slate-400 mb-1">{facialAnalysis.stress}/100</span>
                            </div>
                        </div>

                        {/* 2. SpO2 (Biometric) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <Wind size={14} />
                                <span className="text-[10px] font-bold uppercase">Vol. Oxígeno</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-lg font-bold text-cyan-600">
                                    {bioData?.oxygen || '--'}%
                                </span>
                                <span className="text-xs text-slate-400 mb-1">SpO2</span>
                            </div>
                        </div>

                         {/* 3. Heart Rate */}
                         <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <Heart size={14} />
                                <span className="text-[10px] font-bold uppercase">Frec. Cardíaca</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-lg font-bold text-rose-500 animate-pulse">
                                    {bioData?.heartRate || '--'}
                                </span>
                                <span className="text-xs text-slate-400 mb-1">BPM</span>
                            </div>
                        </div>

                        {/* 4. Mood/Fatigue Composite */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <Smile size={14} />
                                <span className="text-[10px] font-bold uppercase">Estado Ánimo</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-lg font-bold text-slate-700">
                                    {facialAnalysis.happiness > 40 ? 'POSITIVO' : 'NEUTRO'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleFinish}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl transition-transform hover:scale-[1.02] text-white ${diag.bg === 'bg-orange-50' ? 'bg-orange-600 hover:bg-orange-700' : diag.bg === 'bg-pink-50' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        Iniciar Módulo: {recommendedGame === 'neurobreath' ? 'NeuroBreath' : recommendedGame === 'mandala' ? 'Mandala Flow' : 'Math Resilience'} <ChevronRight size={20} />
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-400 mt-4 max-w-xs mx-auto">
                        * El sistema asignará automáticamente el módulo terapéutico más adecuado según tus biomarcadores.
                    </p>
                </div>
            )}
          </div>
        )}

      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CalibrationScreen;
