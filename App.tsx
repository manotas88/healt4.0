
import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import Dashboard from './components/Dashboard';
import BiometricHeader from './components/BiometricHeader';
import CalibrationScreen from './components/CalibrationScreen';
import MandalaFlow from './components/MandalaFlow';
import BioAdaptiveMath from './components/BioAdaptiveMath';
import { DifficultyProfile } from './types';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile | null>(null);

  const handleCalibrationComplete = (profile: DifficultyProfile, recommendedGame: string) => {
    setDifficultyProfile(profile);
    setIsCalibrated(true);
    // Automatic redirection to the prescribed module
    setActiveGame(recommendedGame);
  };

  const handleSelectGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleBackToDashboard = () => {
    setActiveGame(null);
  };

  // 1. Initial Flow: Calibration
  if (!isCalibrated) {
    return <CalibrationScreen onComplete={handleCalibrationComplete} />;
  }

  // 2. Main App Flow
  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Persistent Biometric Header */}
      <BiometricHeader />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {activeGame === 'neurobreath' ? (
          <GameEngine 
            onExit={handleBackToDashboard} 
            difficultyProfile={difficultyProfile!}
          />
        ) : activeGame === 'mandala' ? (
          <MandalaFlow onExit={handleBackToDashboard} />
        ) : activeGame === 'math' ? (
          <BioAdaptiveMath onExit={handleBackToDashboard} />
        ) : (
          <Dashboard onSelectGame={handleSelectGame} />
        )}
      </div>
    </div>
  );
};

export default App;
