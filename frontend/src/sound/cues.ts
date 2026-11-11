/**
 * Every sound of the app, made on the spot with the Web Audio API: oscillators
 * and filtered noise, shaped to recall the desktop it imitates. There are no
 * recordings to download, and none to license.
 */
type Make = (context: AudioContext, out: AudioNode, at: number) => void;

interface Tone {
  freq: number;
  /** Where the pitch glides to by the end. */
  to?: number;
  type?: OscillatorType;
  dur: number;
  gain: number;
  attack?: number;
}

const tone = (context: AudioContext, out: AudioNode, at: number, { freq, to, type = 'sine', dur, gain, attack = 0.005 }: Tone) => {
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + dur);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
};

/** A struck note: the pitch, and the overtones of a small metal bar over it. */
const bell = (context: AudioContext, out: AudioNode, at: number, freq: number, dur: number, gain: number) => {
  tone(context, out, at, { freq, dur, gain });
  tone(context, out, at, { freq: freq * 2.76, dur: dur * 0.45, gain: gain * 0.22 });
  tone(context, out, at, { freq: freq * 5.4, dur: dur * 0.2, gain: gain * 0.07 });
};

const noises = new WeakMap<AudioContext, AudioBuffer>();

const whiteNoise = (context: AudioContext) => {
  let buffer = noises.get(context);
  if (!buffer) {
    buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    noises.set(context, buffer);
  }
  return buffer;
};

interface Noise {
  filter: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  dur: number;
  gain: number;
  attack?: number;
}

const noise = (context: AudioContext, out: AudioNode, at: number, { filter, freq, to, q = 1, dur, gain, attack = 0.003 }: Noise) => {
  const source = context.createBufferSource();
  source.buffer = whiteNoise(context);
  source.loop = true;
  const band = context.createBiquadFilter();
  band.type = filter;
  band.Q.value = q;
  band.frequency.setValueAtTime(freq, at);
  if (to) band.frequency.exponentialRampToValueAtTime(to, at + dur);
  const amp = context.createGain();
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  source.connect(band).connect(amp).connect(out);
  source.start(at, Math.random() * 0.5);
  source.stop(at + dur + 0.05);
};

interface Rustle {
  /** How long the hand works the sheet, in seconds. */
  total: number;
  /** Bits of rustle a second, each a short soft swell of noise. They overlap. */
  density: number;
  grain: [number, number];
  /** A few sharper crinkles over the rustle. */
  snaps: number;
  attack: number;
  release: number;
}

/**
 * A sheet of paper worked by one hand, in one go, written sample by sample:
 * many short swells of noise that overlap into a rustle, rising as the hand
 * closes and fading as it lets go. No two are the same.
 */
const rustle = (context: AudioContext, { total, density, grain, snaps, attack, release }: Rustle) => {
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.floor(rate * total), rate);
  const data = buffer.getChannelData(0);

  const swell = (begin: number, length: number, loud: number) => {
    for (let i = 0; i < length && begin + i < data.length; i += 1) {
      const shape = Math.sin((Math.PI * i) / length) ** 2;
      data[begin + i] += (Math.random() * 2 - 1) * loud * shape;
    }
  };

  for (let g = 0; g < total * density; g += 1) {
    const length = Math.floor(between(grain[0], grain[1]) * rate);
    swell(Math.floor(Math.random() * data.length), length, 0.25 + Math.random() ** 2 * 0.75);
  }
  for (let c = 0; c < snaps; c += 1) {
    swell(Math.floor(between(0.05, 0.85) * data.length), Math.floor(between(0.003, 0.006) * rate), between(0.8, 1.4));
  }

  let peak = 0;
  for (let i = 0; i < data.length; i += 1) {
    const t = i / rate;
    const into = Math.min(1, t / attack);
    const out = Math.min(1, (total - t) / release);
    data[i] *= into * out * out;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak > 0) for (let i = 0; i < data.length; i += 1) data[i] *= 0.8 / peak;

  return buffer;
};

interface Sheet {
  /** Below this the sound is cut: paper has no low end. */
  low: number;
  /** Where the papery hiss is lifted. */
  bright: number;
  gain: number;
}

const paper = (context: AudioContext, out: AudioNode, at: number, shape: Rustle, { low, bright, gain }: Sheet) => {
  const source = context.createBufferSource();
  source.buffer = rustle(context, shape);
  const cut = context.createBiquadFilter();
  cut.type = 'highpass';
  cut.frequency.value = low;
  const lift = context.createBiquadFilter();
  lift.type = 'peaking';
  lift.frequency.value = bright;
  lift.Q.value = 0.8;
  lift.gain.value = 6;
  const soften = context.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 7500;
  const level = context.createGain();
  level.gain.value = gain;
  source.connect(cut).connect(lift).connect(soften).connect(level).connect(out);
  source.start(at);
};

const CRUMPLE: Rustle = { total: 0.5, density: 260, grain: [0.004, 0.018], snaps: 8, attack: 0.05, release: 0.2 };
const SHEET: Sheet = { low: 900, bright: 3400, gain: 0.26 };

// The keys of a telephone: a low and a high tone at once for each digit.
const DTMF: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], '0': [941, 1336],
};

const between = (low: number, high: number) => low + Math.random() * (high - low);

/**
 * The rank says what may be heard over what: a sound right after a louder one
 * is lost under it anyway, and is not played.
 */
export const CUES = {
  click: {
    rank: 0,
    make: (context, out, at) => {
      noise(context, out, at, { filter: 'highpass', freq: 4500, dur: 0.012, gain: 0.1 });
      tone(context, out, at, { freq: 3600, to: 2800, type: 'triangle', dur: 0.01, gain: 0.025 });
    },
  },
  chirp: {
    rank: 1,
    make: (context, out, at) => {
      const blips = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < blips; i += 1) {
        const freq = between(1000, 1900);
        tone(context, out, at + i * 0.065, {
          freq,
          to: freq * between(0.75, 1.35),
          type: 'triangle',
          dur: 0.05,
          gain: 0.035,
        });
      }
    },
  },
  slide: {
    rank: 1,
    make: (context, out, at) => noise(context, out, at, { filter: 'bandpass', freq: 1500, to: 700, q: 0.9, dur: 0.32, gain: 0.3, attack: 0.06 }),
  },
  open: {
    rank: 2,
    make: (context, out, at) => {
      tone(context, out, at, { freq: 392, to: 784, type: 'triangle', dur: 0.12, gain: 0.16 });
      bell(context, out, at + 0.07, 1046, 0.25, 0.07);
    },
  },
  close: {
    rank: 2,
    make: (context, out, at) => tone(context, out, at, { freq: 784, to: 330, type: 'triangle', dur: 0.14, gain: 0.15 }),
  },
  knock: {
    rank: 2,
    make: (context, out, at) => {
      // Knuckles on glass: a sharp tap and the short ring of the pane under it.
      for (const when of [0, 0.17]) {
        noise(context, out, at + when, { filter: 'bandpass', freq: 1200, q: 1.5, dur: 0.045, gain: 0.6 });
        noise(context, out, at + when, { filter: 'lowpass', freq: 450, dur: 0.06, gain: 0.3 });
        tone(context, out, at + when, { freq: 560, to: 400, dur: 0.07, gain: 0.18 });
      }
    },
  },
  flap: {
    rank: 2,
    make: (context, out, at) => tone(context, out, at, { freq: 420, to: 760, type: 'square', dur: 0.06, gain: 0.09 }),
  },
  jump: {
    rank: 2,
    make: (context, out, at) => tone(context, out, at, { freq: 300, to: 720, type: 'square', dur: 0.11, gain: 0.09 }),
  },
  point: {
    rank: 2,
    make: (context, out, at) => {
      tone(context, out, at, { freq: 988, type: 'square', dur: 0.05, gain: 0.08 });
      tone(context, out, at + 0.05, { freq: 1319, type: 'square', dur: 0.1, gain: 0.08 });
    },
  },
  sweep: {
    rank: 2,
    make: (context, out, at) => noise(context, out, at, { filter: 'bandpass', freq: 1100, to: 3200, q: 0.8, dur: 1.05, gain: 0.13, attack: 0.25 }),
  },
  ding: {
    rank: 3,
    make: (context, out, at) => bell(context, out, at, 1318, 0.7, 0.22),
  },
  found: {
    rank: 3,
    make: (context, out, at) => bell(context, out, at, 1046, 0.4, 0.14),
  },
  notify: {
    rank: 3,
    make: (context, out, at) => {
      bell(context, out, at, 988, 0.45, 0.16);
      bell(context, out, at + 0.09, 1318, 0.5, 0.16);
    },
  },
  empty: {
    rank: 3,
    make: (context, out, at) => {
      tone(context, out, at, { freq: 440, type: 'triangle', dur: 0.2, gain: 0.13 });
      tone(context, out, at + 0.14, { freq: 330, type: 'triangle', dur: 0.26, gain: 0.13 });
    },
  },
  error: {
    rank: 3,
    make: (context, out, at) => {
      bell(context, out, at, 587, 0.45, 0.17);
      bell(context, out, at + 0.12, 440, 0.6, 0.17);
    },
  },
  trash: {
    rank: 3,
    make: (context, out, at) => paper(context, out, at, CRUMPLE, SHEET),
  },
  hit: {
    rank: 3,
    make: (context, out, at) => {
      noise(context, out, at, { filter: 'lowpass', freq: 650, dur: 0.22, gain: 0.4 });
      tone(context, out, at, { freq: 200, to: 50, type: 'square', dur: 0.3, gain: 0.08 });
    },
  },
  dial: {
    rank: 3,
    make: (context, out, at) => {
      [...'5550198'].forEach((digit, i) => {
        for (const freq of DTMF[digit]) tone(context, out, at + i * 0.13, { freq, dur: 0.09, gain: 0.08 });
      });
    },
  },
  modem: {
    rank: 3,
    make: (context, out, at) => {
      tone(context, out, at, { freq: 2100, dur: 0.45, gain: 0.08, attack: 0.02 });
      tone(context, out, at + 0.5, { freq: 1650, to: 1850, type: 'triangle', dur: 0.3, gain: 0.08 });
      for (let i = 0; i < 6; i += 1) {
        tone(context, out, at + 0.85 + i * 0.08, { freq: i % 2 ? 1180 : 980, type: 'square', dur: 0.07, gain: 0.04 });
      }
      noise(context, out, at + 1.35, { filter: 'bandpass', freq: 1900, q: 2, dur: 0.75, gain: 0.2, attack: 0.05 });
    },
  },
  tada: {
    rank: 4,
    make: (context, out, at) => {
      [523, 659, 784].forEach((freq, i) => bell(context, out, at + i * 0.09, freq, 0.5, 0.13));
      bell(context, out, at + 0.27, 1046, 1, 0.15);
      for (const freq of [523, 659, 784]) {
        tone(context, out, at + 0.27, { freq, type: 'triangle', dur: 0.8, gain: 0.04, attack: 0.04 });
      }
    },
  },
  crash: {
    rank: 4,
    make: (context, out, at) => {
      noise(context, out, at, { filter: 'lowpass', freq: 900, to: 150, dur: 0.7, gain: 0.45 });
      tone(context, out, at, { freq: 220, to: 55, type: 'square', dur: 0.6, gain: 0.09 });
    },
  },
  startup: {
    rank: 4,
    make: (context, out, at) => {
      [262, 392, 523, 659].forEach((freq, i) => {
        tone(context, out, at + i * 0.12, { freq, type: 'triangle', dur: 1.8, gain: 0.06, attack: 0.25 });
      });
      bell(context, out, at + 0.55, 1568, 0.9, 0.05);
    },
  },
  bsod: {
    rank: 5,
    make: (context, out, at) => {
      tone(context, out, at, { freq: 110, type: 'square', dur: 0.5, gain: 0.1 });
      tone(context, out, at, { freq: 116, type: 'square', dur: 0.5, gain: 0.1 });
    },
  },
} satisfies Record<string, { rank: number; make: Make }>;

export type Cue = keyof typeof CUES;
