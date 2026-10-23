import { useEffect, useState } from "react";
import { EQUIPMENT } from "../data/equipment";
import { PLANS, PLANS_BY_ID } from "../data/plans";
import type { Availability, Week, Weekday } from "./types";

export interface SlotProgress {
  exerciseId: string;
  sets: boolean[];
}

export interface AppState {
  version: 1;
  equipment: Record<string, Availability>;
  activePlanId: string;
  /** The user's arrangement of sessions across the week, per plan. */
  weeks: Record<string, Week>;
  /** Keyed by local date (YYYY-MM-DD), then by slot id. */
  progress: Record<string, Record<string, SlotProgress>>;
  safetyNoteDismissed: boolean;
}

const KEY = "iron-mode:state";
const BACKUP_KEY = "iron-mode:unreadable-backup";

export function defaultEquipment(): Record<string, Availability> {
  return Object.fromEntries(EQUIPMENT.map((e) => [e.id, e.defaultAvailability]));
}

export function defaultState(): AppState {
  return {
    version: 1,
    equipment: defaultEquipment(),
    activePlanId: PLANS[0].id,
    weeks: Object.fromEntries(PLANS.map((p) => [p.id, { ...p.defaultWeek }])),
    progress: {},
    safetyNoteDismissed: false,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const AVAILABILITIES: Availability[] = ["available", "unavailable", "unknown"];

/**
 * Accepts stored data field by field, keeping defaults for anything missing or
 * malformed, so one bad field never wipes the rest.
 */
export function sanitize(raw: unknown): AppState {
  const state = defaultState();
  if (!isRecord(raw) || raw.version !== 1) return state;

  if (isRecord(raw.equipment)) {
    for (const [id, value] of Object.entries(raw.equipment)) {
      if (id in state.equipment && AVAILABILITIES.includes(value as Availability)) {
        state.equipment[id] = value as Availability;
      }
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
      for (let d = 0; d < 7; d++) {
        const value = week[d];
        if (value === null || (typeof value === "string" && sessionIds.has(value))) {
          state.weeks[plan.id][d as Weekday] = value;
        }
      }
    }
  }

  if (isRecord(raw.progress)) {
    for (const [date, slots] of Object.entries(raw.progress)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRecord(slots)) continue;
      const day: Record<string, SlotProgress> = {};
      for (const [slotId, entry] of Object.entries(slots)) {
        if (
          isRecord(entry) &&
          typeof entry.exerciseId === "string" &&
          Array.isArray(entry.sets) &&
          entry.sets.every((s) => typeof s === "boolean")
        ) {
          day[slotId] = { exerciseId: entry.exerciseId, sets: entry.sets as boolean[] };
        }
      }
      state.progress[date] = day;
    }
  }

  state.safetyNoteDismissed = raw.safetyNoteDismissed === true;
  return state;
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
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode or storage full: the app still works for this visit */
    }
  }, [state]);

  return [state, setState] as const;
}
