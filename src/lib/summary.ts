import { EXERCISES_BY_ID } from "../data/exercises";
import { PLANS_BY_ID } from "../data/plans";
import { dateForWeekday, toISODate } from "./dates";
import { bestSet, sessionVolume } from "./progression";
import type { AppState, WorkoutLog } from "./storage";

const hasDoneSets = (l: WorkoutLog) => Object.values(l.entries).some((e) => e.sets.some((s) => s.done));

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export interface WeekSummary {
  start: string;
  end: string;
  /** Sessions in this week's plan. */
  planned: number;
  done: number;
  sets: number;
  volume: number;
  prevDone: number;
  prevSets: number;
  prevVolume: number;
  /** Exercises where this week beat every earlier weight. */
  records: string[];
  /** Exercises skipped or flagged with symptoms this week, for a gentle heads-up. */
  symptoms: string[];
}

/** The training week runs Saturday to Friday, like the plan. */
export function weekSummary(state: AppState, today: Date = new Date()): WeekSummary {
  const start = toISODate(dateForWeekday(6, today));
  const end = addDays(start, 6);
  const prevStart = addDays(start, -7);
  const prevEnd = addDays(start, -1);

  const plan = PLANS_BY_ID.get(state.activePlanId);
  const planned = plan ? Object.values(state.weeks[plan.id] ?? {}).filter(Boolean).length : 0;

  const inRange = (a: string, b: string) => Object.values(state.logs).filter((l) => l.date >= a && l.date <= b && hasDoneSets(l));
  const thisWeek = inRange(start, end);
  const lastWeek = inRange(prevStart, prevEnd);

  const total = (logs: WorkoutLog[]) =>
    logs.reduce(
      (acc, l) => {
        const v = sessionVolume(l);
        return { sets: acc.sets + v.sets, volume: acc.volume + v.volume };
      },
      { sets: 0, volume: 0 },
    );
  const now = total(thisWeek);
  const before = total(lastWeek);

  const earlierBest = new Map<string, number>();
  for (const l of Object.values(state.logs)) {
    if (l.date >= start) continue;
    for (const e of Object.values(l.entries)) {
      const w = bestSet(e.sets)?.weight ?? 0;
      if (w > (earlierBest.get(e.exerciseId) ?? 0)) earlierBest.set(e.exerciseId, w);
    }
  }
  const records = new Set<string>();
  const symptoms = new Set<string>();
  for (const l of thisWeek) {
    for (const e of Object.values(l.entries)) {
      const name = EXERCISES_BY_ID.get(e.exerciseId)?.name ?? e.exerciseId;
      const w = bestSet(e.sets)?.weight ?? 0;
      const prior = earlierBest.get(e.exerciseId);
      if (w > 0 && prior !== undefined && w > prior) records.add(name);
      if (e.symptom) symptoms.add(name);
    }
  }

  return {
    start,
    end,
    planned,
    done: thisWeek.length,
    sets: now.sets,
    volume: now.volume,
    prevDone: lastWeek.length,
    prevSets: before.sets,
    prevVolume: before.volume,
    records: [...records],
    symptoms: [...symptoms],
  };
}

/** True when it's time to nudge the user to save a backup. */
export function backupDue(state: AppState, today: Date = new Date()): boolean {
  const workouts = Object.values(state.logs).filter(hasDoneSets).length;
  if (workouts < 3) return false;
  const iso = toISODate(today);
  if (state.settings.backupSnoozedUntil && state.settings.backupSnoozedUntil > iso) return false;
  const last = state.settings.lastBackupAt;
  if (!last) return true;
  const days = (today.getTime() - new Date(last).getTime()) / 864e5;
  return days > 14;
}
