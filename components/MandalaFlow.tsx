
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, Palette, Wind } from 'lucide-react';
import { biometricService } from '../services/biometricService';
import { BiometricData } from '../types';

interface MandalaFlowProps {
  onExit: () => void;
}

const MandalaFlow: React.FC<MandalaFlowProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bioData, setBioData] = useState<BiometricData | null>(null);
  const [flowScore, setFlowScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Physics refs
  const hueRef = useRef(0);
  const angleRef = useRef(0);
  const particlesRef = useRef<{x: number, y: number, hue: number, life: number, vx: number, vy: number}[]>([]);

  // Subscribe to Biometrics
  useEffect(() => {
    const unsub = biometricService.subscribe((data) => {
      setBioData(data);
      // Clinical Metric: Score increases only when in "Relaxation Zone" (Flow State)
      if (data.heartRate < 80) {
        setFlowScore(prev => prev + 10);
      }
    });
    return () => unsub();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bioData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear with trailing effect (Flow aesthetic)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 2. Determine Physics based on HR (Biofeedback)
    // High HR = Fast, Chaotic, Red/Orange
    // Low HR = Slow, Smooth, Blue/Green/Cyan
    const isStressed = bioData.heartRate > 85;
    const rotationSpeed = isStressed ? 0.05 : 0.005;
    const baseHue = isStressed ? 0 : 180; // Red vs Cyan
    
    angleRef.current += rotationSpeed;
    hueRef.current = (hueRef.current + 1) % 360;

    // 3. Draw Particles (Mandala Symmetry)
    if (isDrawing) {
        for(let i=0; i<3; i++) {
            particlesRef.current.push({
                x: centerX + Math.cos(angleRef.current * (i+1)) * 50,
                y: centerY + Math.sin(angleRef.current * (i+1)) * 50,
                hue: baseHue + Math.random() * 60,
                life: 1.0,
                vx: (Math.random() - 0.5) * (isStressed ? 5 : 2),
                vy: (Math.random() - 0.5) * (isStressed ? 5 : 2)
            });
        }
    }

    // Update and render particles
    particlesRef.current.forEach((p, index) => {
        p.life -= 0.01;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life <= 0) {
            particlesRef.current.splice(index, 1);
            return;
        }

        const symmetry = 6; // Mandala sections
        ctx.save();
        ctx.translate(centerX, centerY);
        
        for (let i = 0; i < symmetry; i++) {
            ctx.rotate((Math.PI * 2) / symmetry);
            ctx.beginPath();
            ctx.arc(p.x - centerX, p.y - centerY, p.life * 10, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${p.life})`;
            ctx.fill();
        }
        ctx.restore();
    });

    requestAnimationFrame(draw);
  }, [bioData, isDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden touch-none">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <button onClick={onExit} className="p-3 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-600 hover:scale-110 transition-transform">
          <Home size={24} />
        </button>
        <div className="px-6 py-2 bg-white/80 backdrop-blur rounded-full shadow-lg flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Estado de Flow (Score)</span>
            <span className="text-xl font-mono font-bold text-cyan-600">{flowScore} pts</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
        <div className={`
             px-8 py-4 rounded-2xl shadow-xl backdrop-blur-md border border-white/50
             transition-all duration-1000
             ${(bioData?.heartRate || 70) > 85 ? 'bg-red-500/10 text-red-600' : 'bg-cyan-500/10 text-cyan-700'}
        `}>
           <div className="flex items-center gap-3">
               {(bioData?.heartRate || 70) > 85 ? <Wind className="animate-pulse" /> : <Palette />}
               <div>
                   <p className="font-bold text-sm">
                       {(bioData?.heartRate || 70) > 85 ? 'Ritmo Elevado Detectado' : 'Ritmo Creativo Óptimo'}
                   </p>
                   <p className="text-xs opacity-80">
                       {(bioData?.heartRate || 70) > 85 ? 'Respira lento para suavizar los trazos.' : 'Mantén este estado de calma.'}
                   </p>
               </div>
           </div>
        </div>
      </div>

      {/* Canvas Layer */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onPointerDown={() => setIsDrawing(true)}
        onPointerUp={() => setIsDrawing(false)}
        onPointerMove={(e) => {
            if (isDrawing) {
               // Add interaction logic if needed
            }
        }}
      />
      
      {!isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <p className="text-slate-300 text-2xl font-bold animate-pulse">Mantén presionado para crear</p>
          </div>
      )}
    </div>
  );
};

export default MandalaFlow;
