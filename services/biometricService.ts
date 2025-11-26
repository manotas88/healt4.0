
import { BiometricData } from '../types';

// Simulates data coming from a wearable (Apple Watch, Garmin, etc.)
export class BiometricService {
  private listeners: ((data: BiometricData) => void)[] = [];
  private intervalId: number | null = null;
  
  private currentData: BiometricData = {
    heartRate: 78, // Started a bit higher to show improvement
    hrv: 40,
    oxygen: 97,
    stressLevel: 'Medium'
  };

  startSimulation() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      // Simulate natural fluctuations
      const hrChange = Math.floor(Math.random() * 3) - 1; // -1 to +1
      let newHr = this.currentData.heartRate + hrChange;
      
      // Clamp values
      if (newHr < 55) newHr = 55;
      if (newHr > 110) newHr = 110;

      const hrvChange = Math.floor(Math.random() * 3) - 1;
      let newHrv = this.currentData.hrv + hrvChange;
      if (newHrv < 20) newHrv = 20;
      if (newHrv > 100) newHrv = 100;

      // Recalculate stress
      this.updateStressLevel(newHrv);

      this.currentData = {
        ...this.currentData,
        heartRate: newHr,
        hrv: newHrv,
      };

      this.notify(this.currentData);
    }, 2000); // Update every 2 seconds
  }

  // Called by GameEngine when successful breath cycles occur
  triggerRecoveryEvent() {
    // Immediate therapeutic effect: Lower HR, Higher HRV
    let newHr = this.currentData.heartRate - 2;
    if (newHr < 60) newHr = 60; // Don't go too low

    let newHrv = this.currentData.hrv + 4; 
    if (newHrv > 90) newHrv = 90;

    let newOx = 98 + (Math.random() > 0.5 ? 1 : 0);

    this.currentData = {
      heartRate: newHr,
      hrv: newHrv,
      oxygen: Math.min(100, newOx),
      stressLevel: this.currentData.stressLevel // Updated via helper
    };
    
    this.updateStressLevel(newHrv);
    this.notify(this.currentData);
  }

  private updateStressLevel(hrv: number) {
     let stress: 'Low' | 'Medium' | 'High' = 'Low';
     if (hrv < 35) stress = 'High';
     else if (hrv < 55) stress = 'Medium';
     this.currentData.stressLevel = stress;
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(callback: (data: BiometricData) => void) {
    this.listeners.push(callback);
    callback(this.currentData); // Immediate initial data
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(data: BiometricData) {
    this.listeners.forEach(cb => cb(data));
  }
}

export const biometricService = new BiometricService();
