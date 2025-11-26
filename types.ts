
export enum BubbleColor {
  Red = 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/50',
  Blue = 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/50',
  Green = 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-500/50',
  Purple = 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/50',
  Yellow = 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/50'
}

export enum BubbleState {
  Hidden = 'hidden',     // Gray "fog", needs breath to reveal
  Revealed = 'revealed', // Colored, can be matched
  Popped = 'popped',     // Animation state before removal
}

export interface BubbleEntity {
  id: string; // Unique ID for React keys
  index: number;
  color: BubbleColor;
  state: BubbleState;
  isNew?: boolean; // For entrance animation
}

export interface LevelConfig {
  id: number;
  breathDurationSec: number;
  scoreGoal: number;
  bgColor: string;
}

export enum GamePhase {
  Calibration = 'CALIBRATION', // New Phase
  Dashboard = 'DASHBOARD',
  ModeSelect = 'MODE_SELECT',
  Playing = 'PLAYING',
  LevelComplete = 'LEVEL_COMPLETE',
  Victory = 'VICTORY',
  GameOver = 'GAME_OVER'
}

export enum BreathPhase {
  Idle = 'IDLE',
  Inhale = 'INHALE',
  Exhale = 'EXHALE'
}

export enum GameMode {
  Therapy = 'THERAPY',      // Original level based
  TimeTrial = 'TIME_TRIAL', // 2 minutes max score
  Infinite = 'INFINITE'     // 3 Lives, lost on invalid moves
}

export interface BiometricData {
  heartRate: number;
  hrv: number;
  oxygen: number;
  stressLevel: 'Low' | 'Medium' | 'High';
}

// New Interface for Personalization
export interface DifficultyProfile {
  breathDurationMod: number; // Multiplier for breath duration (e.g., 1.5x for stressed users)
  visualSpeed: 'slow' | 'normal';
  targetLabel: string; // "Relax Mode" vs "Focus Mode"
}
