import { S } from './state';

/**
 * Efeitos sonoros gerados por código (Web Audio). Nada de arquivos de áudio.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (S.muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, slideTo?: number) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.2, hp = 2000) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + start;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}

const NOTES: Record<string, number> = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G4: 392, A4: 440, C4: 261.63, E4: 329.63 };

export const SFX: Record<string, () => void> = {
  click: () => tone(880, 0, 0.07, 'triangle', 0.3, 1100),
  pop: () => tone(520, 0, 0.09, 'sine', 0.45, 900),
  step: () => tone(200, 0, 0.04, 'sine', 0.08, 160),
  coin: () => {
    tone(NOTES.B5, 0, 0.08, 'square', 0.15);
    tone(NOTES.E6, 0.07, 0.22, 'square', 0.15);
  },
  coins: () => {
    for (let i = 0; i < 5; i++) tone(1200 + i * 120, i * 0.06, 0.12, 'square', 0.1);
  },
  star: () => {
    tone(NOTES.C5, 0, 0.12, 'triangle', 0.4);
    tone(NOTES.E5, 0.08, 0.12, 'triangle', 0.4);
    tone(NOTES.G5, 0.16, 0.25, 'triangle', 0.4);
  },
  win: () => {
    const seq = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6];
    seq.forEach((n, i) => tone(n, i * 0.11, 0.3, 'triangle', 0.4));
    tone(NOTES.E6, 0.45, 0.5, 'sine', 0.3);
  },
  fanfare: () => {
    const seq = [NOTES.G4, NOTES.C5, NOTES.E5, NOTES.G5, NOTES.E5, NOTES.G5, NOTES.C6];
    seq.forEach((n, i) => tone(n, i * 0.12, 0.28, 'triangle', 0.38));
    noise(0.8, 0.4, 0.06, 5000);
  },
  error: () => {
    tone(330, 0, 0.12, 'sawtooth', 0.15, 260);
    tone(260, 0.1, 0.18, 'sawtooth', 0.15, 200);
  },
  good: () => {
    tone(NOTES.E5, 0, 0.1, 'sine', 0.4);
    tone(NOTES.A5, 0.07, 0.16, 'sine', 0.4);
  },
  whoosh: () => noise(0, 0.25, 0.12, 1500),
  splash: () => noise(0, 0.3, 0.15, 800),
  magic: () => {
    for (let i = 0; i < 6; i++) tone(1400 + i * 180, i * 0.045, 0.15, 'sine', 0.18);
  },
  tick: () => tone(1500, 0, 0.03, 'square', 0.08),
  drum: () => {
    tone(140, 0, 0.12, 'sine', 0.6, 60);
  },
  hat: () => noise(0, 0.05, 0.06, 7000),
  meow: () => tone(700, 0, 0.35, 'triangle', 0.3, 450),
  chirp: () => {
    tone(2200, 0, 0.06, 'sine', 0.2, 2800);
    tone(2400, 0.08, 0.06, 'sine', 0.2, 3000);
  },
  levelup: () => {
    [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.G5, NOTES.C6].forEach((n, i) => tone(n, i * 0.09, 0.2, 'square', 0.12));
  },
};

export function sfx(name: string) {
  if (S.muted) return;
  try {
    SFX[name]?.();
  } catch {
    /* ignora */
  }
}

/** Toca uma nota musical (usada no mini game de dança). */
export function note(freq: number, dur = 0.18, type: OscillatorType = 'triangle', vol = 0.3) {
  tone(freq, 0, dur, type, vol);
}
