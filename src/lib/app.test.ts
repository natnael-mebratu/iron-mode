import { describe, expect, it } from "vitest";
import { EQUIPMENT } from "../data/equipment";
import { EXERCISES, EXERCISES_BY_ID } from "../data/exercises";
import { PLANS } from "../data/plans";
import { TECHNIQUE } from "../data/technique";
import { readBackup, setsToCSV } from "./backup";
import { parseRepRange, previousPerformance, suggest } from "./progression";
import { resolveSlot } from "./resolve";
import { defaultEquipment, defaultState, mergeStates, sanitize, type WorkoutLog } from "./storage";
import type { Slot } from "./types";

const inventory = defaultEquipment();
const equipmentIds = new Set(EQUIPMENT.map((e) => e.id));
const allSlots = PLANS.flatMap((p) => p.sessions.flatMap((s) => s.slots));
const slotById = (id: string) => allSlots.find((s) => s.id === id)!;

describe("data integrity", () => {
  it("every exercise has a unique id and references known equipment", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const ex of EXERCISES) for (const id of ex.equipmentIds) expect(equipmentIds, ex.id).toContain(id);
  });

  it("every plan slot references known exercises; slot ids are unique per plan", () => {
    for (const plan of PLANS) {
      const seen = new Set<string>();
      for (const session of plan.sessions) {
        for (const slot of session.slots) {
          for (const id of slot.options) expect(EXERCISES_BY_ID.has(id), id).toBe(true);
          expect(seen.has(slot.id), slot.id).toBe(false);
          seen.add(slot.id);
          expect(parseRepRange(slot.reps), slot.id).not.toBeNull();
        }
      }
      const sessionIds = plan.sessions.map((s) => s.id);
      for (const id of Object.values(plan.defaultWeek)) if (id) expect(sessionIds).toContain(id);
    }
  });

  it("every exercise has technique coaching, and no coaching is orphaned", () => {
    for (const ex of EXERCISES) {
      expect(TECHNIQUE[ex.id], ex.id).toBeDefined();
      expect(TECHNIQUE[ex.id].tips.length, ex.id).toBeGreaterThanOrEqual(2);
    }
    for (const id of Object.keys(TECHNIQUE)) expect(EXERCISES_BY_ID.has(id), id).toBe(true);
  });

  it("no exercise needs a machine the user said the gym doesn't have", () => {
    for (const ex of EXERCISES) {
      for (const id of ["hip-abduction", "hip-adduction", "seated-leg-curl"]) expect(ex.equipmentIds).not.toContain(id);
    }
  });
});

describe("resolveSlot", () => {
  it("only assigns exercises whose equipment is confirmed available", () => {
    for (const slot of allSlots) {
      const r = resolveSlot(slot, inventory, { elbowFriendly: true });
      if (r.kind === "assigned") {
        for (const id of r.exercise.equipmentIds) expect(inventory[id], `${slot.id} → ${id}`).toBe("available");
      }
    }
  });

  it("every non-optional slot gets an exercise with the default gym", () => {
    for (const slot of allSlots.filter((s) => !s.optional)) {
      expect(resolveSlot(slot, inventory, { elbowFriendly: true }).kind, slot.id).toBe("assigned");
    }
  });

  it("uses the seated calf raise, and falls back if it's marked unavailable", () => {
    const r = resolveSlot(slotById("lb-calf"), inventory);
    expect(r.kind === "assigned" && r.exercise.id).toBe("seated-calf-raise");
    const without = resolveSlot(slotById("lb-calf"), { ...inventory, "seated-calf-raise": "unavailable" });
    expect(without.kind === "assigned" && without.exercise.id).toBe("leg-press-calf-raise");
  });

  it("skips elbow-caution exercises in elbow-friendly mode", () => {
    const slot: Slot = { id: "x", options: ["rope-overhead-extension", "rope-triceps-pushdown"], sets: 3, reps: "10–12", restSec: 60 };
    const friendly = resolveSlot(slot, inventory, { elbowFriendly: true });
    expect(friendly.kind === "assigned" && friendly.exercise.id).toBe("rope-triceps-pushdown");
    const off = resolveSlot(slot, inventory, { elbowFriendly: false });
    expect(off.kind === "assigned" && off.exercise.id).toBe("rope-overhead-extension");
  });

  it("never treats unavailable equipment as available", () => {
    const r = resolveSlot({ id: "x", options: ["leg-press"], sets: 1, reps: "1", restSec: 0 }, { ...inventory, "leg-press": "unavailable" });
    expect(r).toEqual({ kind: "blocked", askAbout: [] });
  });
});

const log = (date: string, exerciseId: string, sets: [number, number][], extra: Partial<WorkoutLog["entries"][string]> = {}): WorkoutLog => ({
  date,
  planId: "current-split",
  sessionId: "legs-a",
  entries: { s: { exerciseId, sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })), ...extra } },
});

describe("progression", () => {
  const legPress = EXERCISES_BY_ID.get("leg-press")!;
  const slot: Slot = { id: "s", options: ["leg-press"], sets: 3, reps: "10–12", restSec: 90 };

  it("finds the most recent earlier session only", () => {
    const logs = { "2026-10-01": log("2026-10-01", "leg-press", [[50, 10]]), "2026-10-08": log("2026-10-08", "leg-press", [[55, 10]]) };
    expect(previousPerformance(logs, "leg-press", "2026-10-08")?.date).toBe("2026-10-01");
    expect(previousPerformance(logs, "leg-press", "2026-10-09")?.date).toBe("2026-10-08");
    expect(previousPerformance(logs, "leg-extension", "2026-10-09")).toBeNull();
  });

  it("suggests an increase only after every set hits the top of the range", () => {
    const prev = { date: "d", log: log("d", "leg-press", [[50, 12], [50, 12], [50, 12]]).entries.s };
    const s = suggest(legPress, slot, prev);
    expect(s.kind).toBe("increase");
    expect(s.weight).toBe(55);
    expect(s.reps).toBe(10);
  });

  it("holds the weight when reps are short", () => {
    const prev = { date: "d", log: log("d", "leg-press", [[50, 12], [50, 11], [50, 9]]).entries.s };
    const s = suggest(legPress, slot, prev);
    expect(s.kind).toBe("hold");
    expect(s.weight).toBe(50);
    expect(s.reps).toBe(10);
  });

  it("never increases after symptoms were flagged", () => {
    const prev = { date: "d", log: log("d", "leg-press", [[50, 12], [50, 12], [50, 12]], { symptom: true }).entries.s };
    expect(suggest(legPress, slot, prev).kind).toBe("caution");
  });

  it("does not increase when fewer sets than planned were done", () => {
    const prev = { date: "d", log: log("d", "leg-press", [[50, 12]]).entries.s };
    expect(suggest(legPress, slot, prev).kind).toBe("hold");
  });
});

describe("storage", () => {
  it("returns defaults for garbage", () => {
    expect(sanitize("nope")).toEqual(defaultState());
    expect(sanitize({ version: 99 })).toEqual(defaultState());
  });

  it("migrates version 1 data without losing ticked sets", () => {
    const s = sanitize({
      version: 1,
      equipment: { "cable-straight-bar": "available", dumbbells: "unknown" },
      activePlanId: "current-split",
      progress: { "2026-10-17": { "sa-tri": { exerciseId: "rope-triceps-pushdown", sets: [true, false, true] } } },
      safetyNoteDismissed: true,
    });
    expect(s.version).toBe(2);
    expect(s.equipment["cable-straight-bar"]).toBe("available");
    // v1 "unknown" defaults give way to what the photos showed.
    expect(s.equipment.dumbbells).toBe("available");
    const entry = s.logs["2026-10-17"].entries["sa-tri"];
    expect(entry.sets.map((x) => x.done)).toEqual([true, false, true]);
    expect(s.logs["2026-10-17"].sessionId).toBe("shoulders-arms");
    expect(s.settings.safetyNoteDismissed).toBe(true);
  });

  it("drops invalid values field by field", () => {
    const s = sanitize({
      version: 2,
      equipment: { dumbbells: "maybe", fake: "available" },
      logs: { "not-a-date": {}, "2026-10-20": { planId: "ppl-3", sessionId: "push", entries: { a: { exerciseId: "x", sets: "bad" } } } },
      body: [{ date: "2026-10-20", weightKg: 56, waistCm: -3 }, { date: "nope" }],
    });
    expect(s.equipment.dumbbells).toBe("available");
    expect("fake" in s.equipment).toBe(false);
    expect(Object.keys(s.logs)).toEqual(["2026-10-20"]);
    expect(s.logs["2026-10-20"].entries).toEqual({});
    expect(s.body).toEqual([{ date: "2026-10-20", weightKg: 56, waistCm: null, note: "" }]);
  });

  it("merging a backup never overwrites existing days", () => {
    const current = { ...defaultState(), logs: { "2026-10-01": log("2026-10-01", "leg-press", [[60, 10]]) } };
    const incoming = {
      ...defaultState(),
      logs: { "2026-10-01": log("2026-10-01", "leg-press", [[1, 1]]), "2026-09-01": log("2026-09-01", "leg-press", [[40, 10]]) },
    };
    const merged = mergeStates(current, incoming);
    expect(merged.logs["2026-10-01"].entries.s.sets[0].weight).toBe(60);
    expect(merged.logs["2026-09-01"]).toBeDefined();
  });
});

describe("backup", () => {
  it("round-trips through JSON and rejects non-backups", () => {
    const state = { ...defaultState(), logs: { "2026-10-01": log("2026-10-01", "leg-press", [[60, 10]]) } };
    const preview = readBackup(JSON.stringify({ app: "IRON MODE", ...state }));
    expect(preview.workouts).toBe(1);
    expect(preview.state.logs).toEqual(state.logs);
    expect(() => readBackup("{not json")).toThrow(/valid JSON/);
    expect(() => readBackup("[1,2]")).toThrow(/IRON MODE backup/);
  });

  it("exports sets as CSV with quoted text", () => {
    const state = { ...defaultState(), logs: { "2026-10-01": log("2026-10-01", "leg-press", [[60, 10]]) } };
    const csv = setsToCSV(state).split("\n");
    expect(csv[0]).toBe("date,session,exercise,set,weight_kg,reps_or_seconds,done,symptoms_flagged");
    expect(csv[1]).toBe('2026-10-01,Legs A (quads) + Abs,Leg press,1,60,10,yes,');
  });
});
