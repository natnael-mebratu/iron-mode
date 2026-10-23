import { useEffect, useRef, useState } from "react";

export interface TimerState {
  /** Epoch ms when rest ends. Using an end time keeps it correct after the phone sleeps. */
  endsAt: number;
  total: number;
  label: string;
}

let audio: AudioContext | null = null;

/** Must be called from a tap so mobile browsers allow sound later. */
export function unlockAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    /* no Web Audio: vibration only */
  }
}

function beep() {
  if (!audio) return;
  const now = audio.currentTime;
  for (const offset of [0, 0.25, 0.5]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.2);
  }
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

interface Props {
  timer: TimerState | null;
  sound: boolean;
  onChange: (t: TimerState | null) => void;
}

export function RestTimer({ timer, sound, onChange }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const alerted = useRef<number | null>(null);

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer]);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!timer || remaining > 0 || alerted.current === timer.endsAt) return;
    alerted.current = timer.endsAt;
    navigator.vibrate?.([200, 100, 200]);
    if (sound) beep();
    const id = window.setTimeout(() => onChange(null), 4000);
    return () => window.clearTimeout(id);
  }, [timer, remaining, sound, onChange]);

  if (!timer) return null;
  const adjust = (sec: number) => onChange({ ...timer, endsAt: timer.endsAt + sec * 1000, total: timer.total + sec });
  const progress = timer.total > 0 ? 1 - remaining / timer.total : 1;

  return (
    <div className={`timer${remaining === 0 ? " timer--done" : ""}`} role="timer" aria-live="polite">
      <div className="timer__bar" style={{ width: `${progress * 100}%` }} />
      <div className="timer__body">
        <div>
          <div className="timer__time">{remaining === 0 ? "Go!" : fmt(remaining)}</div>
          <div className="timer__label">{remaining === 0 ? "Rest done — next set" : `Rest · ${timer.label}`}</div>
        </div>
        <div className="timer__actions">
          <button type="button" onClick={() => adjust(-15)} aria-label="15 seconds less">
            −15
          </button>
          <button type="button" onClick={() => adjust(15)} aria-label="15 seconds more">
            +15
          </button>
          <button type="button" onClick={() => onChange(null)}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
