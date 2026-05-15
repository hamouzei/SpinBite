/**
 * SpinBite Audio Manager
 * 
 * Manages a shared AudioContext for mobile-compatible sound playback.
 * Mobile browsers (iOS/Android) require AudioContext to be created & resumed
 * within a user gesture. This module initializes once on first tap, then
 * reuses the context for all subsequent sounds.
 */

let audioCtx: AudioContext | null = null;
let initialized = false;

/** Get or create the shared AudioContext. Must be called from a user gesture the first time. */
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    // Resume if suspended (required on iOS after creation)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Initialize audio on user gesture (call from spin button tap).
 * This ensures the AudioContext is unlocked on mobile.
 */
export function initAudio(): void {
  if (initialized) return;
  const ctx = getAudioContext();
  if (ctx) {
    // Play a silent buffer to fully unlock audio on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    initialized = true;
  }
}

/** Play a short tick sound for wheel segment crossing */
export function playTickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    // Haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore audio errors gracefully
  }
}

/** Play a happy win arpeggio (C major ascending) */
export function playWinSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.12;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });

    // Victory vibration pattern
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  } catch {
    // Ignore audio errors
  }
}

/** Play a descending "womp womp" for try-again / loss */
export function playLoseSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }
  } catch {
    // Ignore audio errors
  }
}

/** Play a short click/pop sound for button presses */
export function playClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore audio errors
  }
}
