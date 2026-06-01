// Web Audio API Synthesizer for Pet Companion sound effects

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBarkSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 🐾 A dog bark consists of two main parts:
    // 1. A short, low-frequency pitch sweep (the "woof")
    // 2. A burst of bandpass-filtered noise for the breathy texture

    // --- Pitch Sweep (Oscillator) ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // Triangle wave gives a round, warm, dog-like vocal shape
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
    
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.18);

    // --- Noise Burst (breathy rasp) ---
    const bufferSize = ctx.sampleRate * 0.15; // 0.15s of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter the noise to keep only mid-frequencies (300Hz - 2000Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1.5, now);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.15);
  } catch (err) {
    console.warn("Audio Context failed to play bark sound:", err);
  }
}

export function playMunchSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // 🍖 Chomping/munching is synthesized using small, rapid clicks of filtered noise.
    // We'll play 3 rapid chomps separated by ~0.08s
    const chomps = [0, 0.07, 0.14];
    
    chomps.forEach((delay) => {
      const chompTime = now + delay;
      
      // Noise buffer for the crunch
      const bufferSize = ctx.sampleRate * 0.05; // very short click
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, chompTime);
      filter.Q.setValueAtTime(2.0, chompTime);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, chompTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, chompTime + 0.04);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start(chompTime);
      noise.stop(chompTime + 0.05);
    });
  } catch (err) {
    console.warn("Audio Context failed to play munch sound:", err);
  }
}

export function playHappyYip() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    
    oscGain.gain.setValueAtTime(0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn("Audio Context failed to play yip sound:", err);
  }
}
