import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISES_BY_ID } from "../data/exercises";
import { PLANS } from "../data/plans";
import { TECHNIQUE } from "../data/technique";
import { daySlots, moveInOrder } from "./day";
import { platesFor, takesPlates, defaultBase } from "./plates";
import { exerciseHistory, personalBest } from "./progression";
import { rankAlternatives } from "./rank";
import { alternativesFor, resolveSlot } from "./resolve";
import { defaultEquipment, defaultState, mergeStates, sanitize, type WorkoutLog } from "./storage";
import { backupDue, weekSummary } from "./summary";
import type { Slot } from "./types";

const inventory = { ...defaultEquipment(), "lying-leg-curl": "available" as const };
const allSlots = PLANS.flatMap((p) => p.sessions.flatMap((s) => s.slots));
const slotById = (id: string) => allSlots.find((s) => s.id === id)!;
const id = (r: ReturnType<typeof resolveSlot>) => (r.kind === "assigned" ? r.exercise.id : null);

const log = (date: string, exerciseId: string, sets: [number, number][], extra: Partial<WorkoutLog> = {}): WorkoutLog => ({
  date,
  planId: "current-split",
  sessionId: "legs-a",
  entries: { s: { exerciseId, sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })) } },
  ...extra,
});

describe("plan changes from the user's feedback", () => {
  it("calves use the seated machine first (it's confirmed at this gym), then the leg press, never standing-with-dumbbell first", () => {
    for (const slotId of ["la-calf", "lb-calf", "ppl-legs-calf"]) {
      expect(id(resolveSlot(slotById(slotId), defaultEquipment()))).toBe("seated-calf-raise");
      expect(id(resolveSlot(slotById(slotId), { ...defaultEquipment(), "seated-calf-raise": "unavailable" }))).toBe("leg-press-calf-raise");
    }
  });

  it("no default hamstring slot starts with a balance-heavy exercise", () => {
    for (const slotId of ["la-rdl", "lb-hinge", "ppl-legs-rdl"]) {
      const first = EXERCISES_BY_ID.get(slotById(slotId).options[0])!;
      expect(first.unstable, slotId).toBeFalsy();
      const r = resolveSlot(slotById(slotId), defaultEquipment());
      expect(r.kind === "assigned" && !r.exercise.unstable, slotId).toBe(true);
    }
  });

  it("uses the lying leg curl for hamstrings once it's confirmed", () => {
    expect(id(resolveSlot(slotById("la-rdl"), inventory))).toBe("lying-leg-curl");
    expect(id(resolveSlot(slotById("la-rdl"), defaultEquipment()))).toBe("rope-pull-through");
  });

  it("abs are trained on three separate days of each plan, not added as an extra session", () => {
    const absIds = new Set(EXERCISES.filter((e) => e.muscleGroup === "Abs & Core").map((e) => e.id));
    for (const plan of PLANS) {
      const days = plan.sessions.filter((s) => s.slots.some((sl) => !sl.optional && sl.options.some((o) => absIds.has(o))));
      expect(days.length, plan.id).toBe(3);
      // On the default week those days are never back-to-back.
      const weekdays = Object.entries(plan.defaultWeek).filter(([, sid]) => days.some((d) => d.id === sid)).map(([d]) => (Number(d) + 1) % 7).sort((a, b) => a - b);
      for (let i = 1; i < weekdays.length; i++) expect(weekdays[i] - weekdays[i - 1], `${plan.id} abs days`).toBeGreaterThan(1);
    }
  });

  it("every exercise still has coaching, and new ones are in the library", () => {
    for (const ex of EXERCISES) expect(TECHNIQUE[ex.id], ex.id).toBeDefined();
    for (const e of ["lying-leg-curl", "towel-slider-curl", "barbell-rdl", "lying-leg-raise", "hanging-knee-raise"]) expect(EXERCISES_BY_ID.has(e), e).toBe(true);
  });
});

describe("not for me", () => {
  const rdl = slotById("la-rdl");

  it("never picks an exercise the user has marked as not for them", () => {
    const avoided = new Set(["rope-pull-through"]);
    expect(id(resolveSlot(rdl, defaultEquipment(), { avoided }))).toBe("barbell-rdl");
    expect(id(resolveSlot(rdl, defaultEquipment(), { choice: "rope-pull-through", avoided }))).toBe("barbell-rdl");
  });

  it("keeps an avoided exercise that was already logged today", () => {
    expect(id(resolveSlot(rdl, defaultEquipment(), { pinned: "rope-pull-through", avoided: new Set(["rope-pull-through"]) }))).toBe("rope-pull-through");
  });

  it("leaves the slot empty rather than using an avoided exercise", () => {
    const slot: Slot = { id: "x", options: ["leg-press"], sets: 3, reps: "10", restSec: 60 };
    expect(resolveSlot(slot, defaultEquipment(), { avoided: new Set(["leg-press"]) }).kind).toBe("blocked");
  });

  it("does not offer avoided exercises as replacements", () => {
    const cur = EXERCISES_BY_ID.get("db-rdl")!;
    const { ready } = alternativesFor(rdl, cur, inventory, { avoided: new Set(["rope-pull-through"]) });
    expect(ready.map((a) => a.exercise.id)).not.toContain("rope-pull-through");
  });
});

describe("ranking the best alternatives", () => {
  const cur = EXERCISES_BY_ID.get("db-rdl")!;
  const slot = slotById("la-rdl");
  const rank = (reason?: "balance" | "hurts" | "feel" | "other", ratings: Record<string, number> = {}) => {
    const { ready } = alternativesFor(slot, cur, inventory, { all: true });
    return rankAlternatives(ready, { current: cur, ratings, reason });
  };

  it("puts same-muscle exercises first", () => {
    const top = rank().slice(0, 6).map((r) => r.exercise.id);
    expect(top.every((i) => EXERCISES_BY_ID.get(i)!.muscleGroup === "Hamstrings & Glutes")).toBe(true);
    expect(top).toContain("lying-leg-curl");
  });

  it("for someone who can't balance, the leg curl and floor/cable moves lead, not standing hinges", () => {
    const top = rank("balance").slice(0, 4).map((r) => r.exercise.id);
    expect(top).toContain("lying-leg-curl");
    expect(top).not.toContain("barbell-rdl");
    expect(top).not.toContain("b-stance-rdl");
  });

  it("'hard to balance' removes everything that needs balance and says so", () => {
    const ranked = rank("balance");
    expect(ranked.every((r) => !r.exercise.unstable)).toBe(true);
    expect(ranked[0].because).toContain("no balance needed");
    expect(rank().some((r) => r.exercise.unstable)).toBe(true);
  });

  it("'hurts' removes elbow-loading exercises", () => {
    const tri = EXERCISES_BY_ID.get("rope-triceps-pushdown")!;
    const { ready } = alternativesFor(slotById("sa-tri"), tri, inventory, { all: true });
    const without = rankAlternatives(ready, { current: tri, ratings: {}, reason: "hurts" });
    expect(without.some((r) => r.exercise.elbowCaution)).toBe(false);
  });

  it("the user's star ratings move exercises up and down", () => {
    const plain = rank().map((r) => r.exercise.id);
    const boosted = rank(undefined, { "barbell-rdl": 5, "lying-leg-curl": 1 }).map((r) => r.exercise.id);
    expect(boosted.indexOf("barbell-rdl")).toBeLessThanOrEqual(plain.indexOf("barbell-rdl"));
    expect(boosted.indexOf("lying-leg-curl")).toBeGreaterThan(plain.indexOf("lying-leg-curl"));
  });

  it("only calls an exercise related if it trains one of the same muscles, and ranks the rest last", () => {
    const calf = EXERCISES_BY_ID.get("seated-calf-raise")!;
    const { ready } = alternativesFor(slotById("la-calf"), calf, defaultEquipment(), { all: true });
    const ranked = rankAlternatives(ready, { current: calf, ratings: {}, reason: "balance" });
    const related = ranked.filter((r) => r.related).map((r) => r.exercise.id);
    expect(related).toEqual(["leg-press-calf-raise"]);
    const firstUnrelated = ranked.findIndex((r) => !r.related);
    expect(ranked.slice(0, firstUnrelated).every((r) => r.related)).toBe(true);
    expect(ranked.filter((r) => !r.related).every((r) => r.because.length === 0)).toBe(true);
    expect(ranked.find((r) => r.exercise.id === "kelso-shrug")?.related).toBe(false);
  });

  it("prefers the same kind of equipment (machine for machine)", () => {
    const calf = EXERCISES_BY_ID.get("seated-calf-raise")!;
    const { ready } = alternativesFor(slotById("la-calf"), calf, defaultEquipment());
    const ranked = rankAlternatives(ready, { current: calf, ratings: {} });
    expect(ranked[0].exercise.id).toBe("leg-press-calf-raise");
  });
});

describe("plate calculator", () => {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];

  it("finds the fewest plates per side", () => {
    expect(platesFor(100, 20, plates)).toMatchObject({ perSide: [25, 15], total: 100, approximate: false });
    expect(platesFor(60, 20, plates).perSide).toEqual([20]);
    expect(platesFor(42.5, 20, plates).perSide).toEqual([10, 1.25]);
  });

  it("handles machines with no base weight", () => {
    expect(platesFor(50, 0, plates).perSide).toEqual([25]);
  });

  it("copes with decimals without floating-point error", () => {
    expect(platesFor(27.5, 20, plates)).toMatchObject({ perSide: [2.5, 1.25], total: 27.5, approximate: false });
  });

  it("reports the nearest loads when the target can't be made", () => {
    const r = platesFor(21, 20, [5, 10]);
    expect(r.approximate).toBe(true);
    expect(r.nearest?.below?.total).toBe(20);
    expect(r.nearest?.above?.total).toBe(30);
  });

  it("returns no plates when the target is at or below the base", () => {
    expect(platesFor(20, 20, plates)).toMatchObject({ perSide: [], approximate: false });
    expect(platesFor(10, 20, plates).approximate).toBe(true);
  });

  it("knows which exercises take plates and the usual bar weight", () => {
    expect(takesPlates(["barbell"])).toBe(true);
    expect(takesPlates(["chest-press"])).toBe(false);
    expect(defaultBase(["ez-bar"])).toBe(10);
    expect(defaultBase(["barbell"])).toBe(20);
    expect(defaultBase(["lat-pulldown"])).toBe(0);
  });
});

describe("exercise history and personal best", () => {
  const logs = {
    "2026-10-01": log("2026-10-01", "leg-press", [[100, 10], [100, 10]]),
    "2026-10-08": log("2026-10-08", "leg-press", [[110, 8], [110, 8]]),
    "2026-10-15": log("2026-10-15", "leg-extension", [[40, 12]]),
    "2026-10-22": log("2026-10-22", "leg-press", [[120, 6]]),
  };

  it("lists earlier sessions of just that exercise, newest first", () => {
    const h = exerciseHistory(logs, "leg-press", "2026-10-30");
    expect(h.map((e) => e.date)).toEqual(["2026-10-22", "2026-10-08", "2026-10-01"]);
    expect(h[1]).toMatchObject({ topWeight: 110, volume: 1760 });
  });

  it("excludes today and later, and respects the limit", () => {
    expect(exerciseHistory(logs, "leg-press", "2026-10-22").map((e) => e.date)).toEqual(["2026-10-08", "2026-10-01"]);
    expect(exerciseHistory(logs, "leg-press", "2026-10-30", 1)).toHaveLength(1);
  });

  it("finds the heaviest set before a date", () => {
    expect(personalBest(logs, "leg-press", "2026-10-30")).toEqual({ weight: 120, reps: 6, date: "2026-10-22" });
    expect(personalBest(logs, "leg-press", "2026-10-22")).toMatchObject({ weight: 110 });
    expect(personalBest(logs, "chest-press-machine", "2026-10-30")).toBeNull();
  });
});

describe("editing today's workout", () => {
  const session = PLANS[0].sessions[2]; // chest + triceps
  const first = session.slots[0].id;

  it("applies skips, extras and a custom order", () => {
    const l = log("2026-10-24", "chest-press-machine", [], {
      skipped: [first],
      extras: [{ id: "x1", exerciseId: "push-up", sets: 3, reps: "10–15", restSec: 60 }],
      order: ["x1", session.slots[1].id],
    });
    const slots = daySlots(session, l);
    expect(slots[0].slot.id).toBe("x1");
    expect(slots[0].extra).toBe(true);
    expect(slots[1].slot.id).toBe(session.slots[1].id);
    expect(slots.find((s) => s.slot.id === first)?.skipped).toBe(true);
    expect(slots).toHaveLength(session.slots.length + 1);
  });

  it("returns the plain plan when nothing was changed", () => {
    expect(daySlots(session, undefined).map((s) => s.slot.id)).toEqual(session.slots.map((s) => s.id));
  });

  it("moves an exercise up or down by one and stops at the ends", () => {
    expect(moveInOrder(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveInOrder(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    expect(moveInOrder(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(moveInOrder(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
  });
});

describe("saving the new data", () => {
  it("round-trips ratings, avoided exercises, notes, plates and day edits, dropping junk", () => {
    const s = sanitize({
      version: 2,
      ratings: { "leg-press": 5, "bad-low": 0, "bad-high": 6, "bad-frac": 2.5, "bad-type": "5" },
      avoided: ["db-rdl", "db-rdl", 5, "db-calf-raise"],
      exerciseNotes: { "leg-press": { note: "seat 4", base: 20 }, x: { note: "  " }, y: { base: -1 }, z: "no" },
      settings: { plates: [20, 10, 0, -5, "x", 10], lastBackupAt: "2026-10-01T10:00:00Z", backupSnoozedUntil: "not-a-date" },
      logs: {
        "2026-10-24": {
          planId: "current-split",
          sessionId: "legs-a",
          entries: {},
          skipped: ["la-calf", 3],
          order: ["a", "b"],
          extras: [{ id: "x1", exerciseId: "push-up", sets: 99, reps: "10", restSec: 60 }, { id: 5 }],
        },
      },
    });
    expect(s.ratings).toEqual({ "leg-press": 5 });
    expect(s.avoided).toEqual(["db-rdl", "db-calf-raise"]);
    expect(s.exerciseNotes).toEqual({ "leg-press": { note: "seat 4", base: 20 } });
    expect(s.settings.plates).toEqual([20, 10]);
    expect(s.settings.lastBackupAt).toBe("2026-10-01T10:00:00Z");
    expect(s.settings.backupSnoozedUntil).toBeNull();
    const day = s.logs["2026-10-24"];
    expect(day.skipped).toEqual(["la-calf"]);
    expect(day.order).toEqual(["a", "b"]);
    expect(day.extras).toEqual([{ id: "x1", exerciseId: "push-up", sets: 3, reps: "10", restSec: 60 }]);
  });

  it("upgrades data saved before these features, with sensible defaults", () => {
    const s = sanitize({ version: 2, settings: { elbowFriendly: true } });
    expect(s.ratings).toEqual({});
    expect(s.avoided).toEqual([]);
    expect(s.exerciseNotes).toEqual({});
    expect(s.settings.plates).toEqual([25, 20, 15, 10, 5, 2.5, 1.25]);
    expect(s.settings.lastBackupAt).toBeNull();
  });

  it("merging a backup keeps the current ratings and combines the not-for-me lists", () => {
    const a = { ...defaultState(), ratings: { x: 5 }, avoided: ["a"], exerciseNotes: { x: { note: "mine" } } };
    const b = { ...defaultState(), ratings: { x: 1, y: 4 }, avoided: ["a", "b"], exerciseNotes: { x: { note: "theirs" }, y: { note: "y" } } };
    const m = mergeStates(a, b);
    expect(m.ratings).toEqual({ x: 5, y: 4 });
    expect(m.avoided.sort()).toEqual(["a", "b"]);
    expect(m.exerciseNotes.x.note).toBe("mine");
    expect(m.exerciseNotes.y.note).toBe("y");
  });
});

describe("weekly summary and backup reminder", () => {
  // Saturday 24 Oct 2026 starts the week; Friday 30 Oct ends it.
  const today = new Date(2026, 9, 28); // Wednesday
  const state = defaultState();
  state.logs = {
    "2026-10-20": log("2026-10-20", "leg-press", [[100, 10], [100, 10]]),
    "2026-10-24": log("2026-10-24", "leg-press", [[110, 10], [110, 10], [110, 9]]),
    "2026-10-26": log("2026-10-26", "leg-extension", [[40, 12]], { sessionId: "legs-b" }),
  };

  it("counts this week's workouts, sets and volume against last week", () => {
    const w = weekSummary(state, today);
    expect(w.start).toBe("2026-10-24");
    expect(w.end).toBe("2026-10-30");
    expect(w.done).toBe(2);
    expect(w.sets).toBe(4);
    expect(w.volume).toBe(110 * 10 * 2 + 110 * 9 + 40 * 12);
    expect(w.prevDone).toBe(1);
    expect(w.prevSets).toBe(2);
    expect(w.planned).toBe(5);
  });

  it("lists new records only when an earlier weight existed to beat", () => {
    expect(weekSummary(state, today).records).toEqual(["Leg press"]);
  });

  it("flags symptoms reported this week", () => {
    const withSymptom = structuredClone(state);
    withSymptom.logs["2026-10-26"].entries.s.symptom = true;
    expect(weekSummary(withSymptom, today).symptoms).toEqual(["Leg extension"]);
  });

  it("reminds about a backup only after a few workouts and a couple of weeks", () => {
    const now = new Date(2026, 10, 15);
    expect(backupDue(defaultState(), now)).toBe(false);
    expect(backupDue(state, now)).toBe(true);
    const saved = structuredClone(state);
    saved.settings.lastBackupAt = new Date(2026, 10, 10).toISOString();
    expect(backupDue(saved, now)).toBe(false);
    saved.settings.lastBackupAt = new Date(2026, 9, 1).toISOString();
    expect(backupDue(saved, now)).toBe(true);
    saved.settings.backupSnoozedUntil = "2026-11-20";
    expect(backupDue(saved, now)).toBe(false);
  });
});
