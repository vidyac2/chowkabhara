// Tiny Web Audio synth for game sound effects — no audio files needed.

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || muted) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; when?: number; slideTo?: number } = {},
) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + (opts.when ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.15, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function click(when: number, freq: number, gain = 0.25) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const len = Math.floor(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 3;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t);
}

export const sfx = {
  /** Shells rattling in the hand. */
  roll() {
    for (let i = 0; i < 9; i++) click(i * 0.08 + Math.random() * 0.03, 2200 + Math.random() * 1800, 0.3);
  },
  /** Shells hitting the floor. */
  land() {
    for (let i = 0; i < 4; i++) click(i * 0.035, 1400 + Math.random() * 900, 0.4);
  },
  step(i = 0) {
    tone(520 + (i % 4) * 40, 0.08, { type: "triangle", gain: 0.12 });
  },
  capture() {
    tone(660, 0.35, { type: "sawtooth", gain: 0.08, slideTo: 110 });
    click(0, 600, 0.5);
    tone(196, 0.25, { type: "square", gain: 0.05, when: 0.12 });
  },
  finish() {
    tone(660, 0.12, { type: "triangle", gain: 0.12 });
    tone(990, 0.2, { type: "triangle", gain: 0.12, when: 0.1 });
  },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone(f, 0.22, { type: "triangle", gain: 0.13, when: i * 0.12 }),
    );
  },
};
