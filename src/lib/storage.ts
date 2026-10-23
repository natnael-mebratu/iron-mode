import { useEffect, useState } from "react";
import { EQUIPMENT } from "../data/equipment";
import { PLANS, PLANS_BY_ID } from "../data/plans";
import type { Availability, Week, Weekday } from "./types";

export interface SetEntry {
  /** kg for weight exercises; null when not entered. */
  weight: number | null;
  /** Reps, or seconds for timed exercises. */
  reps: number | null;
  done: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetEntry[];
  /** The user flagged tingling, shock or pain on this exercise. */
  symptom?: boolean;
}

export interface Readiness {
  energy: 1 | 2 | 3;
  soreness: 1 | 2 | 3;
}

export interface WorkoutLog {
  date: string;
  planId: string;
  sessionId: string;
  /** Keyed by slot id. */
  entries: Record<string, ExerciseLog>;
  readiness?: Readiness;
  finishedAt?: string;
  notes?: string;
}

export interface BodyEntry {
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  note: string;
}

export interface Settings {
  elbowFriendly: boolean;
  showDemoPhotos: boolean;
  timerSound: boolean;
  safetyNoteDismissed: boolean;
  /** The one-time "turn on photos?" question has been answered. */
  photoPromptSeen: boolean;
}

export interface AppState {
  version: 2;
  equipment: Record<string, Availability>;
  activePlanId: string;
  /** The user's arrangement of sessions across the week, per plan. */
  weeks: Record<string, Week>;
  /** Keyed by local date (YYYY-MM-DD). */
  logs: Record<string, WorkoutLog>;
  body: BodyEntry[];
  settings: Settings;
}

const KEY = "iron-mode:state";
const BACKUP_KEY = "iron-mode:unreadable-backup";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function defaultEquipment(): Record<string, Availability> {
  return Object.fromEntries(EQUIPMENT.map((e) => [e.id, e.defaultAvailability]));
}

export function defaultState(): AppState {
  return {
    version: 2,
    equipment: defaultEquipment(),
    activePlanId: PLANS[0].id,
    weeks: Object.fromEntries(PLANS.map((p) => [p.id, { ...p.defaultWeek }])),
    logs: {},
    body: [],
    settings: {
      elbowFriendly: true,
      showDemoPhotos: false,
      timerSound: true,
      safetyNoteDismissed: false,
      photoPromptSeen: false,
    },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const AVAILABILITIES: Availability[] = ["available", "unavailable", "unknown"];

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

function sanitizeSets(raw: unknown): SetEntry[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map((s) =>
    // Version 1 stored plain booleans for "set done".
    typeof s === "boolean"
      ? { weight: null, reps: null, done: s }
      : isRecord(s)
        ? { weight: num(s.weight), reps: num(s.reps), done: s.done === true }
        : { weight: null, reps: null, done: false },
  );
}

function sanitizeLog(date: string, raw: unknown): WorkoutLog | null {
  if (!isRecord(raw) || typeof raw.planId !== "string" || typeof raw.sessionId !== "string") return null;
  const entries: Record<string, ExerciseLog> = {};
  if (isRecord(raw.entries)) {
    for (const [slotId, e] of Object.entries(raw.entries)) {
      if (!isRecord(e) || typeof e.exerciseId !== "string") continue;
      const sets = sanitizeSets(e.sets);
      if (!sets) continue;
      entries[slotId] = { exerciseId: e.exerciseId, sets, ...(e.symptom === true ? { symptom: true } : {}) };
    }
  }
  const log: WorkoutLog = { date, planId: raw.planId, sessionId: raw.sessionId, entries };
  const r = raw.readiness;
  if (isRecord(r) && [1, 2, 3].includes(r.energy as number) && [1, 2, 3].includes(r.soreness as number)) {
    log.readiness = { energy: r.energy as 1 | 2 | 3, soreness: r.soreness as 1 | 2 | 3 };
  }
  if (typeof raw.finishedAt === "string") log.finishedAt = raw.finishedAt;
  if (typeof raw.notes === "string") log.notes = raw.notes;
  return log;
}

/** Version 1 kept set ticks per date and slot, without plan or session. */
function migrateV1Progress(progress: Record<string, unknown>, planId: string): Record<string, WorkoutLog> {
  const slotToSession = new Map<string, [string, string]>();
  for (const plan of PLANS) for (const s of plan.sessions) for (const sl of s.slots) slotToSession.set(sl.id, [plan.id, s.id]);
  const logs: Record<string, WorkoutLog> = {};
  for (const [date, slots] of Object.entries(progress)) {
    if (!DATE_RE.test(date) || !isRecord(slots)) continue;
    const first = Object.keys(slots).map((id) => slotToSession.get(id)).find(Boolean);
    const log = sanitizeLog(date, {
      planId: first?.[0] ?? planId,
      sessionId: first?.[1] ?? "unknown",
      entries: slots,
    });
    if (log && Object.keys(log.entries).length) logs[date] = log;
  }
  return logs;
}

/**
 * Accepts stored or imported data field by field, keeping defaults for
 * anything missing or malformed, so one bad field never wipes the rest.
 */
export function sanitize(raw: unknown): AppState {
  const state = defaultState();
  if (!isRecord(raw) || (raw.version !== 1 && raw.version !== 2)) return state;

  if (isRecord(raw.equipment)) {
    for (const [id, value] of Object.entries(raw.equipment)) {
      if (!(id in state.equipment) || !AVAILABILITIES.includes(value as Availability)) continue;
      // Version 1 predates the gym photos, so only carry over items the user
      // confirmed; everything else takes the newer, better-informed defaults.
      if (raw.version === 1 && value !== "available") continue;
      state.equipment[id] = value as Availability;
    }
  }

  if (typeof raw.activePlanId === "string" && PLANS_BY_ID.has(raw.activePlanId)) {
    state.activePlanId = raw.activePlanId;
  }

  if (isRecord(raw.weeks)) {
    for (const plan of PLANS) {
      const week = raw.weeks[plan.id];
      if (!isRecord(week)) continue;
      const sessionIds = new Set(plan.sessions.map((s) => s.id));
      // Only accept a saved week if every session in it still exists.
      const values = Array.from({ length: 7 }, (_, d) => week[d]);
      if (values.every((v) => v === null || (typeof v === "string" && sessionIds.has(v)))) {
        values.forEach((v, d) => (state.weeks[plan.id][d as Weekday] = v as string | null));
      }
    }
  }

  if (raw.version === 1 && isRecord(raw.progress)) {
    state.logs = migrateV1Progress(raw.progress, state.activePlanId);
  }
  if (isRecord(raw.logs)) {
    for (const [date, value] of Object.entries(raw.logs)) {
      if (!DATE_RE.test(date)) continue;
      const log = sanitizeLog(date, value);
      if (log) state.logs[date] = log;
    }
  }

  if (Array.isArray(raw.body)) {
    state.body = raw.body
      .filter((b): b is Record<string, unknown> => isRecord(b) && typeof b.date === "string" && DATE_RE.test(b.date))
      .map((b) => ({
        date: b.date as string,
        weightKg: num(b.weightKg),
        waistCm: num(b.waistCm),
        note: typeof b.note === "string" ? b.note : "",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const s = isRecord(raw.settings) ? raw.settings : {};
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  state.settings = {
    elbowFriendly: bool(s.elbowFriendly, true),
    showDemoPhotos: bool(s.showDemoPhotos, false),
    timerSound: bool(s.timerSound, true),
    safetyNoteDismissed: bool(s.safetyNoteDismissed, raw.safetyNoteDismissed === true),
    photoPromptSeen: bool(s.photoPromptSeen, false),
  };
  return state;
}

/** Imported data is merged so nothing already on the phone is overwritten. */
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const bodyByDate = new Map(current.body.map((b) => [b.date, b]));
  for (const b of incoming.body) if (!bodyByDate.has(b.date)) bodyByDate.set(b.date, b);
  return {
    ...current,
    logs: { ...incoming.logs, ...current.logs },
    body: [...bodyByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function load(): AppState {
  let text: string | null = null;
  try {
    text = localStorage.getItem(KEY);
  } catch {
    return defaultState();
  }
  if (text === null) return defaultState();
  try {
    return sanitize(JSON.parse(text));
  } catch {
    // Keep a copy of anything we can't read rather than silently overwriting it.
    try {
      localStorage.setItem(BACKUP_KEY, text);
    } catch {
      /* storage full or blocked */
    }
    return defaultState();
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    // Ask the browser not to clear this app's storage under pressure (no prompt on most phones).
    void navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode or storage full: the app still works for this visit */
    }
  }, [state]);

  return [state, setState] as const;
}
