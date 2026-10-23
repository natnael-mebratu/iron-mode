import { EXERCISES_BY_ID } from "../data/exercises";
import { findSession } from "../data/plans";
import { toISODate } from "./dates";
import { sanitize, type AppState } from "./storage";

export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJSON(state: AppState) {
  const payload = { app: "IRON MODE", exportedAt: new Date().toISOString(), ...state };
  download(`iron-mode-backup-${toISODate(new Date())}.json`, JSON.stringify(payload, null, 2), "application/json");
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per logged set, readable in any spreadsheet. */
export function setsToCSV(state: AppState): string {
  const rows = [["date", "session", "exercise", "set", "weight_kg", "reps_or_seconds", "done", "symptoms_flagged"]];
  for (const log of Object.values(state.logs).sort((a, b) => a.date.localeCompare(b.date))) {
    const session = findSession(log.planId, log.sessionId)?.name ?? log.sessionId;
    for (const entry of Object.values(log.entries)) {
      const name = EXERCISES_BY_ID.get(entry.exerciseId)?.name ?? entry.exerciseId;
      entry.sets.forEach((s, i) => {
        if (!s.done && s.weight == null && s.reps == null) return;
        rows.push([log.date, session, name, String(i + 1), String(s.weight ?? ""), String(s.reps ?? ""), s.done ? "yes" : "no", entry.symptom ? "yes" : ""]);
      });
    }
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function bodyToCSV(state: AppState): string {
  const rows = [["date", "body_weight_kg", "waist_cm", "note"]];
  for (const b of state.body) rows.push([b.date, String(b.weightKg ?? ""), String(b.waistCm ?? ""), b.note]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export interface ImportPreview {
  state: AppState;
  workouts: number;
  bodyEntries: number;
  from: string | null;
  to: string | null;
}

/** Validates a backup file. Throws a readable error if it isn't one. */
export function readBackup(text: string): ImportPreview {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON. Choose a file exported from IRON MODE.");
  }
  if (typeof raw !== "object" || raw === null || !("version" in raw)) {
    throw new Error("This doesn't look like an IRON MODE backup.");
  }
  const state = sanitize(raw);
  const dates = Object.keys(state.logs).sort();
  return {
    state,
    workouts: dates.length,
    bodyEntries: state.body.length,
    from: dates[0] ?? null,
    to: dates.at(-1) ?? null,
  };
}
