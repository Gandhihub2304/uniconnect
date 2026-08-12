import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let vibrateInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

// Plays one short dual-tone "ring" burst, roughly matching a phone ringtone's pitch.
function playRingBurst() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [480, 620].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1);
    });
  } catch { /* audio unavailable — fail silently */ }
}

// Softer single-tone "outgoing ring" beep for the caller's side while waiting for pickup.
function playOutgoingBeep() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch { /* audio unavailable — fail silently */ }
}

export function startIncomingRingtone() {
  stopRingtone();
  playRingBurst();
  ringInterval = setInterval(playRingBurst, 2000);

  if (Capacitor.isNativePlatform()) {
    const pulse = () => { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); };
    pulse();
    vibrateInterval = setInterval(pulse, 1000);
  }
}

export function startOutgoingRingtone() {
  stopRingtone();
  playOutgoingBeep();
  ringInterval = setInterval(playOutgoingBeep, 1500);
}

export function stopRingtone() {
  if (ringInterval) { clearInterval(ringInterval); ringInterval = null; }
  if (vibrateInterval) { clearInterval(vibrateInterval); vibrateInterval = null; }
}
