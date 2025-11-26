import React from 'react';
import { Stethoscope } from 'lucide-react';

interface MedicalAssistantProps {
  message: string;
}

const MedicalAssistant: React.FC<MedicalAssistantProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-white/95 backdrop-blur shadow-xl border-l-4 border-cyan-500 rounded-r-lg p-4 flex gap-4 items-center animate-in fade-in slide-in-from-bottom-4 duration-500 z-50 rounded-xl">
      <div className="bg-cyan-100 p-2 rounded-full text-cyan-600 shrink-0">
        <Stethoscope size={24} />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
          Asistente Médico
        </h4>
        <p className="text-slate-600 text-sm leading-snug font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default MedicalAssistant;