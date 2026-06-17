import type { AudioKey, AudioStatus } from "./types";

type AudioMeta = {
  buffer: AudioBuffer;
  startOffset: number;
  endOffset: number;
};

const AUDIO_KEYS: AudioKey[] = [
  "love-all",
  "fifteen-love",
  "thirty-love",
  "forty-love",
  "love-fifteen",
  "fifteen-all",
  "thirty-fifteen",
  "forty-fifteen",
  "love-thirty",
  "fifteen-thirty",
  "thirty-all",
  "forty-thirty",
  "love-forty",
  "fifteen-forty",
  "thirty-forty",
  "forty-all",
  "deuce",
  "advantage-server",
  "advantage-receiver",
  "game-server",
  "game-receiver",
  "set-server",
  "set-receiver",
  "fault",
  "second-serve",
  "let",
  "advantage-player-a",
  "advantage-player-b",
  "game-player-a",
  "game-player-b",
  "out"
];

function trimRange(buffer: AudioBuffer) {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.max(64, Math.floor(sampleRate * 0.01));
  const threshold = 0.0035;

  let first = 0;
  let last = channel.length - 1;

  for (let i = 0; i < channel.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(channel.length, i + windowSize);
    for (let j = i; j < end; j += 1) {
      const value = channel[j] ?? 0;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / Math.max(1, end - i));
    if (rms > threshold) {
      first = i;
      break;
    }
  }

  for (let i = channel.length - 1; i >= 0; i -= windowSize) {
    let sum = 0;
    const start = Math.max(0, i - windowSize);
    for (let j = start; j <= i; j += 1) {
      const value = channel[j] ?? 0;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / Math.max(1, i - start + 1));
    if (rms > threshold) {
      last = i;
      break;
    }
  }

  return {
    startOffset: Math.max(0, first / sampleRate - 0.01),
    endOffset: Math.min(buffer.duration, last / sampleRate + 0.03)
  };
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private clips = new Map<AudioKey, AudioMeta>();
  private preloadStarted = false;
  private readyPromise: Promise<void> | null = null;
  private status: AudioStatus = "locked";
  private listeners = new Set<(status: AudioStatus) => void>();
  private gainMultiplier = 2;
  private audioOnRef = { current: true };

  subscribe(listener: (status: AudioStatus) => void) {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setAudioEnabled(value: boolean) {
    this.audioOnRef.current = value;
  }

  setGainMultiplier(value: 2 | 4) {
    this.gainMultiplier = value;
  }

  private emitStatus(status: AudioStatus) {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private ensureContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      this.ctx = new AudioContextCtor();
    }
    return this.ctx;
  }

  private async loadClip(key: AudioKey) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    try {
      const response = await fetch(`/audio/${key}.mp3`);
      if (!response.ok) {
        return;
      }
      const data = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(data.slice(0));
      this.clips.set(key, { buffer, ...trimRange(buffer) });
    } catch {
      // Missing or invalid audio files should fail silently.
    }
  }

  async unlockAndPreload() {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
    }

    if (!this.preloadStarted) {
      this.preloadStarted = true;
      this.emitStatus("loading");
      this.readyPromise = Promise.all(AUDIO_KEYS.map((key) => this.loadClip(key))).then(() => {
        this.emitStatus("ready");
      });
    }

    await this.readyPromise;
  }

  private buildVoiceChain() {
    const ctx = this.ensureContext();
    if (!ctx) {
      return null;
    }

    const sourceGain = ctx.createGain();
    sourceGain.gain.value = Math.min(this.gainMultiplier, 4);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 120;

    const peaking = ctx.createBiquadFilter();
    peaking.type = "peaking";
    peaking.frequency.value = 2500;
    peaking.gain.value = 6;
    peaking.Q.value = 2.5;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.knee.value = 8;

    sourceGain.connect(highpass);
    highpass.connect(peaking);
    peaking.connect(compressor);
    compressor.connect(ctx.destination);

    return { ctx, sourceGain };
  }

  playSound(key?: AudioKey) {
    if (!key || !this.audioOnRef.current) {
      return;
    }

    const clip = this.clips.get(key);
    const chain = this.buildVoiceChain();
    if (!clip || !chain) {
      return;
    }

    const source = chain.ctx.createBufferSource();
    source.buffer = clip.buffer;
    source.connect(chain.sourceGain);
    source.start(0, clip.startOffset, Math.max(0, clip.endOffset - clip.startOffset));
  }

  playChained(keys: AudioKey[]) {
    if (!this.audioOnRef.current) {
      return;
    }

    const chain = this.buildVoiceChain();
    if (!chain) {
      return;
    }

    let cursor = chain.ctx.currentTime;

    for (const key of keys) {
      const clip = this.clips.get(key);
      if (!clip) {
        continue;
      }

      const duration = Math.max(0.05, clip.endOffset - clip.startOffset);
      const source = chain.ctx.createBufferSource();
      source.buffer = clip.buffer;
      source.connect(chain.sourceGain);
      source.start(cursor, clip.startOffset, duration);
      cursor += duration + 0.04;
    }
  }
}

export const audioEngine = new AudioEngine();
