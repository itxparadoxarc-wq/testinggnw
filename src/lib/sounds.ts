// Web Audio API Synthesizer for Premium Sound Cues
// Bypasses static asset loading completely and runs instantly on the client audio thread.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Organic damped click/pop sound for standard interactions (e.g. wishlist toggling)
 */
export function playPop() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // High-fidelity natural woodblock frequency sweep
  const now = ctx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);

  // Fast rise, organic smooth exponential decay
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Premium double chime bell for positive/completion actions (e.g. Add to Cart)
 */
export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playChime = (timeOffset: number, freq: number, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Add a bandpass filter to sweeten the bell chime
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1.5;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + timeOffset);
    // Add sub-harmonics for depth
    osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + timeOffset + 0.3);

    gain.gain.setValueAtTime(0.001, now + timeOffset);
    gain.gain.linearRampToValueAtTime(volume, now + timeOffset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4);

    osc.start(now + timeOffset);
    osc.stop(now + timeOffset + 0.42);
  };

  // Luxury double-ding sequence (major 5th interval: 880Hz -> 1320Hz)
  playChime(0, 880, 0.08);
  playChime(0.08, 1320, 0.06);
}

/**
 * Silk air rustle/swish for page transitions and drawer openings
 */
export function playSwish() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * 0.25; // 0.25 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Create customized white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  // Bandpass filter to sweep frequency like silk blowing
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';

  const gain = ctx.createGain();

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  noiseNode.start(now);
  noiseNode.stop(now + 0.26);
}
