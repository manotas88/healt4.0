
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Check, ChevronRight, Camera, ScanFace, AlertCircle, Smile, Zap, Eye, Heart, Wind, Thermometer } from 'lucide-react';
import { DifficultyProfile, BiometricData } from '../types';
import { biometricService } from '../services/biometricService';

interface CalibrationScreenProps {
  onComplete: (profile: DifficultyProfile) => void;
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
    // Simulate Analysis Delay
    setTimeout(() => {
      // Simulate Results (In a real app, this would use face-api.js)
      // We assume a moderately stressed user for the demo
      const simulatedResults = {
        stress: Math.floor(Math.random() * 40) + 40, // 40-80 range
        fatigue: Math.floor(Math.random() * 50) + 20,
        happiness: Math.floor(Math.random() * 30) + 10,
        completed: true
      };
      setFacialAnalysis(simulatedResults);
      setIsScanning(false);
    }, 3500);
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

  const calculateProfile = (): DifficultyProfile => {
    // Logic: 
    // High Stress/Fatigue from Camera OR Poor Sleep OR Low HRV -> Relax Mode
    
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

    if (riskFactor >= 2) {
      return {
        breathDurationMod: 1.5, // 50% slower breathing required to force relaxation
        visualSpeed: 'slow',
        targetLabel: 'Modo Relajación Profunda'
      };
    } else {
      return {
        breathDurationMod: 1.0,
        visualSpeed: 'normal',
        targetLabel: 'Modo Activación Cognitiva'
      };
    }
  };

  const handleFinish = () => {
    const profile = calculateProfile();
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
      <div className="absolute top-10 right-10 opacity-10 animate-pulse text-cyan-600">
         <Activity size={120} />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 z-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            {step === 1 ? <ScanFace size={24} /> : step === 2 ? <Activity size={24} /> : <Heart size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Calibración Médica</h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
               {step === 1 ? 'Análisis Facial IA' : step === 2 ? 'Higiene del Sueño' : 'Bio-Sincronización'}
            </p>
          </div>
        </div>

        {/* STEP 1: Camera Facial Scan */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-lg font-semibold mb-2">1. Diagnóstico Visual</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Escaneando micro-expresiones para detectar tensión facial y fatiga.
            </p>
            
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-6 shadow-inner border border-slate-200">
              {!cameraActive && !facialAnalysis.completed && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Camera size={48} className="mb-2 opacity-50"/>
                    <span className="text-xs font-bold uppercase">Cámara Inactiva</span>
                 </div>
              )}
              
              <video 
                 ref={videoRef} 
                 autoPlay 
                 muted 
                 playsInline
                 className={`w-full h-full object-cover transform scale-x-[-1] ${!cameraActive ? 'hidden' : ''}`}
              />

              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 z-20">
                    <div className="w-full h-1 bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.8)] absolute animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-cyan-400 bg-black/50 px-2 py-1 rounded">TENSION: ANALYZING</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-black/50 px-2 py-1 rounded">EYE_OPENNESS: CHECKING</span>
                    </div>
                    {/* Face Frame */}
                    <div className="absolute inset-8 border-2 border-dashed border-cyan-500/30 rounded-3xl"></div>
                </div>
              )}
            </div>

            {/* Results Display */}
            {facialAnalysis.completed ? (
              <div className="mb-6 space-y-3">
                 <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className={facialAnalysis.stress > 50 ? 'text-orange-500' : 'text-green-500'} />
                        <span className="text-sm font-bold text-slate-700">Nivel Estrés Detectado</span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${facialAnalysis.stress > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                        {facialAnalysis.stress}%
                    </span>
                 </div>
                 
                 <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Eye size={16} className={facialAnalysis.fatigue > 50 ? 'text-red-500' : 'text-blue-500'} />
                        <span className="text-sm font-bold text-slate-700">Signos de Fatiga</span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${facialAnalysis.fatigue > 50 ? 'text-red-600' : 'text-blue-600'}`}>
                        {facialAnalysis.fatigue > 50 ? 'DETECTADA' : 'BAJA'}
                    </span>
                 </div>

                 <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Smile size={16} className="text-yellow-500" />
                        <span className="text-sm font-bold text-slate-700">Factor Ánimo</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-slate-600">
                        {facialAnalysis.happiness}%
                    </span>
                 </div>
              </div>
            ) : null}

            {!cameraActive && !facialAnalysis.completed && (
                <button 
                onClick={startCamera}
                className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200"
                >
                <ScanFace size={20} /> Iniciar Escaneo Facial
                </button>
            )}

            {cameraActive && isScanning && (
                 <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2">
                    Procesando...
                 </div>
            )}

            {facialAnalysis.completed && (
                <button 
                onClick={handleNextStep}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                Confirmar y Continuar <ChevronRight size={20} />
                </button>
            )}
            
          </div>
        )}

        {/* STEP 2: Sleep Quality */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-lg font-semibold mb-2">2. Higiene del Sueño</h2>
            <p className="text-slate-500 mb-6 text-sm">¿Cómo fue tu calidad de sueño anoche?</p>
            
            <div className="flex flex-col gap-3 mb-8">
              <button 
                onClick={() => setSleepQuality('good')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${sleepQuality === 'good' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <span className="font-bold block">Bien / Reparador</span>
                <span className="text-xs opacity-70">Me siento descansado.</span>
              </button>
              
              <button 
                onClick={() => setSleepQuality('avg')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${sleepQuality === 'avg' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <span className="font-bold block">Regular</span>
                <span className="text-xs opacity-70">Desperté algunas veces.</span>
              </button>

              <button 
                onClick={() => setSleepQuality('poor')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${sleepQuality === 'poor' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <span className="font-bold block">Mal / Insuficiente</span>
                <span className="text-xs opacity-70">Tengo sueño o fatiga.</span>
              </button>
            </div>

            <button 
              disabled={!sleepQuality}
              onClick={() => setStep(3)}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Escanear Biometría <Activity size={20} />
            </button>
          </div>
        )}

        {/* STEP 3: Scanning */}
        {step === 3 && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
            
            {scanProgress < 100 ? (
               <>
                <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                    {/* SVG Background Circle */}
                    <svg 
                        className="absolute top-0 left-0 w-full h-full transform -rotate-90"
                        viewBox="0 0 128 128"
                    >
                        <circle cx="64" cy="64" r="58" stroke="#e2e8f0" strokeWidth="8" fill="none"/>
                        <circle 
                        cx="64" cy="64" r="58" 
                        stroke="#3b82f6" strokeWidth="8" fill="none"
                        strokeDasharray={365}
                        strokeDashoffset={365 - (365 * scanProgress) / 100}
                        className="transition-all duration-300 ease-linear"
                        strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-2xl font-bold text-slate-700">{scanProgress}%</div>
                </div>

                <h2 className="text-lg font-bold text-slate-800 mb-1">Analizando Señales...</h2>
                <div className="text-sm text-slate-500 mb-6 flex flex-col gap-1 items-center font-mono">
                   {scanProgress > 20 && <span className="text-green-600 flex gap-2 items-center"><Check size={12}/> Sensor Cardíaco: Conectado ({bioData?.heartRate} BPM)</span>}
                   {scanProgress > 50 && <span className="text-green-600 flex gap-2 items-center"><Check size={12}/> VFC: Analizada ({bioData?.hrv} ms)</span>}
                   {scanProgress > 80 && <span className="text-green-600 flex gap-2 items-center"><Check size={12}/> Cortisol Estimado: Calculado</span>}
                </div>
               </>
            ) : (
                <div className="w-full animate-in fade-in slide-in-from-bottom duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                        <h3 className="text-center font-bold text-slate-800 text-lg mb-4 border-b pb-2 flex items-center justify-center gap-2">
                          <Check className="text-green-500" size={20}/>
                          Resumen Diagnóstico
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Stress Analysis */}
                            <div className={`p-3 rounded-xl border-l-4 ${facialAnalysis.stress > 50 || bioData?.stressLevel === 'High' ? 'bg-orange-50 border-orange-500' : 'bg-green-50 border-green-500'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className={facialAnalysis.stress > 50 ? 'text-orange-500' : 'text-green-600'} />
                                    <span className="text-xs font-bold uppercase text-slate-500">Nivel Estrés</span>
                                </div>
                                <div className="font-bold text-slate-800 text-sm">
                                    {facialAnalysis.stress > 50 || bioData?.stressLevel === 'High' ? 'Elevado' : 'Controlado'}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Facial: {facialAnalysis.stress}% | VFC: {bioData?.stressLevel}
                                </div>
                            </div>

                            {/* Fatigue Analysis */}
                            <div className={`p-3 rounded-xl border-l-4 ${facialAnalysis.fatigue > 50 || sleepQuality === 'poor' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye size={14} className={facialAnalysis.fatigue > 50 ? 'text-red-500' : 'text-blue-500'} />
                                    <span className="text-xs font-bold uppercase text-slate-500">Fatiga</span>
                                </div>
                                <div className="font-bold text-slate-800 text-sm">
                                    {facialAnalysis.fatigue > 50 || sleepQuality === 'poor' ? 'Alta' : 'Normal'}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Sueño: {sleepQuality === 'poor' ? 'Malo' : 'OK'} | Ojos: {facialAnalysis.fatigue}%
                                </div>
                            </div>

                             {/* Mood Analysis */}
                             <div className="p-3 rounded-xl border-l-4 bg-yellow-50 border-yellow-400">
                                <div className="flex items-center gap-2 mb-1">
                                    <Smile size={14} className="text-yellow-600" />
                                    <span className="text-xs font-bold uppercase text-slate-500">Ánimo</span>
                                </div>
                                <div className="font-bold text-slate-800 text-sm">
                                    {facialAnalysis.happiness > 50 ? 'Positivo' : 'Neutro/Bajo'}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Micro-expresiones: {facialAnalysis.happiness}%
                                </div>
                            </div>

                            {/* Physiology */}
                            <div className="p-3 rounded-xl border-l-4 bg-slate-50 border-slate-400">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity size={14} className="text-slate-600" />
                                    <span className="text-xs font-bold uppercase text-slate-500">Fisiología</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400">Ritmo</span>
                                        <span className="font-mono font-bold text-sm">{bioData?.heartRate || '--'} <span className="text-[8px]">BPM</span></span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-slate-400">Oxígeno</span>
                                        <span className="font-mono font-bold text-sm text-cyan-600">{bioData?.oxygen || '--'}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed border border-slate-200">
                            <strong className="block mb-1 text-slate-800">Recomendación Clínica:</strong>
                            { (facialAnalysis.stress > 50 || bioData?.stressLevel === 'High') 
                                ? "Se han detectado biomarcadores de estrés. El sistema activará el protocolo de 'Relajación Profunda' con tiempos de respiración extendidos."
                                : "Tus métricas indican un estado óptimo para el entrenamiento cognitivo. Se activará el 'Modo Activación' para potenciar el enfoque."
                            }
                        </div>
                    </div>

                    <button 
                        onClick={handleFinish}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        Iniciar Terapia Personalizada <ChevronRight size={20} />
                    </button>
                </div>
            )}
          </div>
        )}

      </div>
      
      <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
        * Estos datos se utilizan únicamente para ajustar la dificultad de la terapia digital.
      </p>
      
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
