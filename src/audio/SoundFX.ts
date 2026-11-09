// Web Audio API Synthesizer for 100% self-contained, zero-asset street football audio

class SoundFXManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Voice commentary announcement
  public speakVoiceLine(text: string) {
    if (this.isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Cancel previous utterances to avoid queuing delay
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.volume;
        utterance.rate = 1.05;
        utterance.pitch = 1.15; // punchy, lively street energy

        // Prefer English voices
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-NG') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Fallback silently if speech synthesis blocked by browser permission
      }
    }
  }

  // Ball Kick Sound
  public playKick(power: number = 0.6) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch drop from 180Hz to 40Hz gives that punchy football kick feel
    const startFreq = 140 + power * 90;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    // Click transient
    gain.gain.setValueAtTime(this.volume * (0.6 + power * 0.5), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Wall Rebound
  public playWallBounce(speedRatio: number = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);

    gain.gain.setValueAtTime(this.volume * Math.min(0.8, 0.2 + speedRatio * 0.5), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Post Strike (Metallic hollow pipe clink / stone crack)
  public playPostHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Metallic resonance uses multiple inharmonic sines
    [840, 1320, 2150].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.35);

      gain.gain.setValueAtTime(this.volume * (0.4 / (idx + 1)), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // Sliding tackle on sand/dirt
  public playTackle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(250, this.ctx.currentTime + 0.22);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Referee Street Whistle
  public playWhistle(short: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = short ? 0.18 : 0.45;

    // Dual oscillator whistle creates beat frequency
    [2400, 2520].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // Tremolo / flutter
      osc.frequency.linearRampToValueAtTime(freq + 40, t + duration * 0.5);
      osc.frequency.linearRampToValueAtTime(freq, t + duration);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.35, t + duration - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + duration + 0.01);
    });
  }

  // Street Crowd Cheers on Goal
  public playGoalCelebration() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // 1. Whistle blast
    this.playWhistle(false);

    // 2. Vuvuzela horn
    setTimeout(() => this.playVuvuzela(233, 1.2), 100);
    setTimeout(() => this.playVuvuzela(293, 0.9), 280);

    // 3. Crowd cheering noise burst
    const t = this.ctx.currentTime;
    const cheerDuration = 2.4;
    const bufferSize = Math.floor(this.ctx.sampleRate * cheerDuration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.6);
    filter.frequency.linearRampToValueAtTime(600, t + cheerDuration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(this.volume * 0.55, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + cheerDuration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Authentic Nigerian Vuvuzela / Stadium Horn
  public playVuvuzela(freq: number = 233, duration: number = 0.8) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    // Slight vibrato
    osc.frequency.linearRampToValueAtTime(freq + 4, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(freq - 2, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq * 2;
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }
}

export const soundFX = new SoundFXManager();

