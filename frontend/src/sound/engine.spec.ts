import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
});

const node = () => ({ connect: vi.fn((next: unknown) => next) });

/** Just enough of an AudioContext to count the sounds it was asked to make. */
class FakeAudio {
  static made: FakeAudio[] = [];
  state = 'suspended';
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  oscillators = 0;
  resume = vi.fn(async () => {
    this.state = 'running';
  });

  constructor() {
    FakeAudio.made.push(this);
  }

  createGain() {
    return { ...node(), gain: param() };
  }
  createOscillator() {
    this.oscillators += 1;
    return { ...node(), type: 'sine', frequency: param(), start: vi.fn(), stop: vi.fn() };
  }
  createBiquadFilter() {
    return { ...node(), type: 'lowpass', Q: param(), frequency: param() };
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    return { ...node(), buffer: null, loop: false, start: vi.fn(), stop: vi.fn() };
  }
}

let uninstall: (() => void)[] = [];
// Each reading of the clock is a second after the last, unless a test holds it still.
let clock = 0;
let tick = 1000;

const load = async () => {
  vi.resetModules();
  const engine = await import('./engine');
  return {
    ...engine,
    installSound: () => {
      uninstall.push(engine.installSound());
    },
  };
};

const settle = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

const press = async (target: EventTarget, pointerType = 'mouse') => {
  target.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType }));
  await settle();
};

const click = (target: EventTarget, detail: number) =>
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));

const sounds = () => FakeAudio.made[0].oscillators;

describe('sound', () => {
  beforeEach(() => {
    FakeAudio.made = [];
    localStorage.clear();
    clock = 0;
    tick = 1000;
    vi.stubGlobal('AudioContext', FakeAudio);
    vi.spyOn(performance, 'now').mockImplementation(() => (clock += tick));
    document.body.innerHTML = '<button id="go">Go</button><p id="text">Hi</p>';
  });

  afterEach(() => {
    uninstall.forEach((stop) => stop());
    uninstall = [];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  const text = () => document.getElementById('text')!;
  const button = () => document.getElementById('go')!;

  it('should make no sound before the person has touched the page', async () => {
    const { installSound, play } = await load();
    installSound();

    play('ding');

    expect(FakeAudio.made).toHaveLength(0);
  });

  it('should click at the first press of the mouse, the one that lets sound play', async () => {
    const { installSound } = await load();
    installSound();

    await press(text());

    expect(FakeAudio.made[0].resume).toHaveBeenCalled();
    expect(sounds()).toBe(1);
  });

  it('should click on every press of the mouse, on something or on nothing', async () => {
    const { installSound } = await load();
    installSound();
    await press(text());

    await press(button());
    await press(document.body);

    expect(sounds()).toBe(3);
  });

  it('should click on a tap of the finger, and not when the finger starts a scroll', async () => {
    const { installSound } = await load();
    installSound();

    await press(text(), 'touch');
    expect(sounds()).toBe(0);

    click(text(), 1);
    expect(sounds()).toBe(1);
  });

  it('should click on what a key presses, and on nothing else', async () => {
    const { installSound } = await load();
    installSound();
    await press(text());
    const before = sounds();

    click(text(), 0);
    expect(sounds()).toBe(before);

    click(button(), 0);
    expect(sounds()).toBe(before + 1);
  });

  it('should keep quiet when turned off, and remember it', async () => {
    const { installSound, play, setSoundOn } = await load();
    installSound();
    await press(text());
    const before = sounds();

    setSoundOn(false);
    play('tada');
    await press(text());

    expect(sounds()).toBe(before);
    expect(localStorage.getItem('pop-search:sound-off')).not.toBeNull();

    const again = await load();
    again.installSound();
    await press(text());
    again.play('tada');
    expect(FakeAudio.made.at(-1)!.oscillators).toBe(0);
  });

  it('should ring once when turned back on', async () => {
    const { installSound, setSoundOn } = await load();
    installSound();
    await press(text());
    setSoundOn(false);
    const before = sounds();

    setSoundOn(true);
    await settle();

    expect(sounds()).toBeGreaterThan(before);
    expect(localStorage.getItem('pop-search:sound-off')).toBeNull();
  });

  it('should not play a quieter sound right on top of a louder one', async () => {
    const { installSound, play } = await load();
    installSound();
    await press(text());
    tick = 0;

    play('tada');
    const afterTada = sounds();
    play('click');

    expect(sounds()).toBe(afterTada);
  });

  it('should not play in a tab nobody is looking at', async () => {
    const { installSound, play } = await load();
    installSound();
    await press(text());
    const before = sounds();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    play('ding');

    expect(sounds()).toBe(before);
  });
});
