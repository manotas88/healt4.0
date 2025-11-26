export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  private isListening: boolean = false;

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      source.connect(this.analyser);
      this.isListening = true;
    } catch (error) {
      console.error("Microphone access denied or error:", error);
      throw new Error("Microphone access is required for this therapy session.");
    }
  }

  getVolume(): number {
    if (!this.analyser || !this.dataArray || !this.isListening) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    // Normalize average volume (0-255) to a roughly 0-100 scale
    const average = sum / this.dataArray.length;
    return average;
  }

  playPopSound() {
    if (!this.audioContext) return;
    const o = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();
    o.frequency.setValueAtTime(400, this.audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    o.connect(g);
    g.connect(this.audioContext.destination);
    o.start();
    o.stop(this.audioContext.currentTime + 0.15);
  }

  playWinSound() {
    if (!this.audioContext) return;
    [523, 659, 784].forEach((f, i) => {
      const o = this.audioContext!.createOscillator();
      const g = this.audioContext!.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, this.audioContext!.currentTime);
      g.gain.linearRampToValueAtTime(0.1, this.audioContext!.currentTime + 0.1);
      g.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 1);
      o.connect(g);
      g.connect(this.audioContext!.destination);
      o.start(this.audioContext!.currentTime + i * 0.2);
      o.stop(this.audioContext!.currentTime + 1.5);
    });
  }

  cleanup() {
    this.isListening = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
  }
}

export const audioService = new AudioService();