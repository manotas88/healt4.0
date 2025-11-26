import React, { useEffect, useState } from 'react';
import { Activity, Heart, Wind, Watch } from 'lucide-react';
import { biometricService } from '../services/biometricService';
import { BiometricData } from '../types';

const BiometricHeader: React.FC = () => {
  const [data, setData] = useState<BiometricData>({
    heartRate: 72,
    hrv: 45,
    oxygen: 98,
    stressLevel: 'Low'
  });

  useEffect(() => {
    biometricService.startSimulation();
    const unsubscribe = biometricService.subscribe(setData);
    return () => {
      unsubscribe();
      // We don't stop simulation here to keep it running across component mounts if desired
    };
  }, []);

  return (
    <div className="w-full bg-slate-900 text-white p-3 shadow-md flex items-center justify-between overflow-x-auto">
      <div className="flex items-center gap-2 mr-4 text-gray-400 text-xs uppercase tracking-widest border-r border-gray-700 pr-4">
        <Watch size={16} />
        <span>Connected</span>
      </div>
      
      <div className="flex gap-6 flex-1 justify-around min-w-max">
        {/* Heart Rate */}
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-red-500 animate-pulse" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold font-mono">{data.heartRate} <span className="text-xs text-gray-400">BPM</span></span>
          </div>
        </div>

        {/* HRV */}
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-400" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold font-mono">{data.hrv} <span className="text-xs text-gray-400">ms (HRV)</span></span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="flex items-center gap-2">
          <Wind size={18} className="text-cyan-400" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold font-mono">{data.oxygen}% <span className="text-xs text-gray-400">SpO2</span></span>
          </div>
        </div>

        {/* Stress Indicator */}
        <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
          <span className="text-xs text-gray-400 uppercase mr-1">Stress</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            data.stressLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
            data.stressLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {data.stressLevel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BiometricHeader;
