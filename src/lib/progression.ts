import { EXERCISES_BY_ID } from "../data/exercises";
import type { ExerciseLog, SetEntry, WorkoutLog } from "./storage";
import type { Exercise, Slot } from "./types";

export function parseRepRange(reps: string): [number, number] | null {
  const m = reps.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const single = reps.match(/^\s*(\d+)\s*$/);
  return single ? [Number(single[1]), Number(single[1])] : null;
}

export interface PreviousPerformance {
  date: string;
  log: ExerciseLog;
}

/** The most recent earlier session where this exercise had at least one completed set. */
export function previousPerformance(
  logs: Record<string, WorkoutLog>,
  exerciseId: string,
  beforeDate: string,
): PreviousPerformance | null {
  const dates = Object.keys(logs)
    .filter((d) => d < beforeDate)
    .sort()
    .reverse();
  for (const date of dates) {
    for (const entry of Object.values(logs[date].entries)) {
      if (entry.exerciseId === exerciseId && entry.sets.some((s) => s.done)) return { date, log: entry };
    }
  }
  return null;
}

const round = (n: number, step: number) => Math.round(n / step) * step;

export interface Suggestion {
  /** Pre-filled starting values for the sets; never applied automatically. */
  weight: number | null;
  reps: number | null;
  message: string;
  kind: "first" | "increase" | "hold" | "caution";
}

/**
 * Double progression: keep the weight until every planned set reaches the top
 * of the rep range, then add the smallest sensible jump. Never increases after
 * a session where symptoms were flagged.
 */
export function suggest(exercise: Exercise, slot: Slot, prev: PreviousPerformance | null): Suggestion {
  const range = parseRepRange(slot.reps);
  const load = exercise.load ?? "weight";
  const unit = load === "time" ? "s" : "reps";

  if (!prev) {
    return {
      weight: null,
      reps: null,
      kind: "first",
      message:
        load === "weight"
          ? "First time: pick a weight you could lift for about 3 more reps than the target with good form."
          : "First time: find a comfortable starting point and note it down.",
    };
  }

  const done = prev.log.sets.filter((s) => s.done);
  const lastWeight = Math.max(0, ...done.map((s) => s.weight ?? 0)) || null;
  const lastReps = done.length ? Math.min(...done.map((s) => s.reps ?? 0)) : null;

  if (prev.log.symptom) {
    return {
      weight: lastWeight,
      reps: lastReps,
      kind: "caution",
      message: "Last time you flagged symptoms. Keep it light or swap the exercise. No increase today.",
    };
  }

  const allSetsDone = done.length >= slot.sets;
  const hitTop = range && done.length > 0 && done.every((s: SetEntry) => (s.reps ?? 0) >= range[1]);

  if (allSetsDone && hitTop && range) {
    if (load === "weight" && lastWeight) {
      const next = round(lastWeight + (exercise.increment ?? 2.5), 0.5);
      return {
        weight: next,
        reps: range[0],
        kind: "increase",
        message: `You hit ${range[1]} ${unit} on every set. Try ${next} kg and build back up from ${range[0]}, if form stays clean and symptom-free.`,
      };
    }
    return {
      weight: lastWeight,
      reps: range[1],
      kind: "increase",
      message:
        load === "time"
          ? "You held the top of the range. Add a few seconds or a harder variation."
          : "You hit the top of the range. Slow the lowering down or add a little weight.",
    };
  }

  const target = range ? Math.min(range[1], (lastReps ?? range[0]) + 1) : lastReps;
  return {
    weight: lastWeight,
    reps: target,
    kind: "hold",
    message: lastWeight
      ? `Stay at ${lastWeight} kg. Aim for ${target} ${unit} on each set before adding weight.`
      : `Aim for ${target ?? "a few more"} ${unit} on each set.`,
  };
}

/** Best (heaviest weight, then most reps) completed set in a log. */
export function bestSet(sets: SetEntry[]): SetEntry | null {
  let best: SetEntry | null = null;
  for (const s of sets) {
    if (!s.done) continue;
    if (
      !best ||
      (s.weight ?? 0) > (best.weight ?? 0) ||
      ((s.weight ?? 0) === (best.weight ?? 0) && (s.reps ?? 0) > (best.reps ?? 0))
    ) {
      best = s;
    }
  }
  return best;
}

export function formatSet(s: Pick<SetEntry, "weight" | "reps">, exercise?: Exercise): string {
  const unit = exercise?.load === "time" ? "s" : "";
  if (s.weight) return `${s.weight} kg × ${s.reps ?? "?"}${unit}`;
  return s.reps != null ? `${s.reps}${unit || " reps"}` : "—";
}

export function sessionVolume(log: WorkoutLog): { sets: number; volume: number } {
  let sets = 0;
  let volume = 0;
  for (const e of Object.values(log.entries)) {
    const timed = EXERCISES_BY_ID.get(e.exerciseId)?.load === "time";
    for (const s of e.sets) {
      if (!s.done) continue;
      sets++;
      if (!timed) volume += (s.weight ?? 0) * (s.reps ?? 0);
    }
  }
  return { sets, volume };
}
