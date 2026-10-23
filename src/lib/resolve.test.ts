import { describe, expect, it } from "vitest";
import { EQUIPMENT } from "../data/equipment";
import { EXERCISES, EXERCISES_BY_ID } from "../data/exercises";
import { PLANS } from "../data/plans";
import { resolveSlot } from "./resolve";
import { defaultEquipment, defaultState, sanitize } from "./storage";

const confirmed = defaultEquipment();
const equipmentIds = new Set(EQUIPMENT.map((e) => e.id));

describe("data integrity", () => {
  it("every exercise references known equipment", () => {
    for (const ex of EXERCISES) for (const id of ex.equipmentIds) expect(equipmentIds, ex.id).toContain(id);
  });

  it("every plan slot references known exercises and slot ids are unique per plan", () => {
    for (const plan of PLANS) {
      const seen = new Set<string>();
      for (const session of plan.sessions) {
        for (const slot of session.slots) {
          for (const id of slot.options) expect(EXERCISES_BY_ID.has(id), id).toBe(true);
          expect(seen.has(slot.id), slot.id).toBe(false);
          seen.add(slot.id);
        }
      }
      const sessionIds = plan.sessions.map((s) => s.id);
      for (const id of Object.values(plan.defaultWeek)) if (id) expect(sessionIds).toContain(id);
    }
  });

  it("no exercise uses the hip abduction/adduction machines", () => {
    for (const ex of EXERCISES) {
      expect(ex.equipmentIds).not.toContain("hip-abduction");
      expect(ex.equipmentIds).not.toContain("hip-adduction");
    }
  });
});

describe("resolveSlot with the confirmed default inventory", () => {
  it("only ever assigns exercises whose equipment is confirmed available", () => {
    for (const plan of PLANS)
      for (const session of plan.sessions)
        for (const slot of session.slots) {
          const r = resolveSlot(slot, confirmed);
          if (r.kind === "assigned") {
            for (const id of r.exercise.equipmentIds) expect(confirmed[id], `${slot.id} → ${id}`).toBe("available");
          }
        }
  });

  it("substitutes rope curls for a straight bar that isn't confirmed, and asks about it", () => {
    const slot = PLANS[0].sessions[0].slots.find((s) => s.id === "sa-curl")!;
    const r = resolveSlot(slot, confirmed);
    expect(r.kind).toBe("assigned");
    if (r.kind !== "assigned") return;
    expect(r.exercise.id).toBe("rope-cable-curl");
    expect(r.isSubstitute).toBe(true);
    expect(r.askAbout[0]).toBe("cable-straight-bar");
  });

  it("uses the preferred option once the user confirms the equipment", () => {
    const slot = PLANS[0].sessions[0].slots.find((s) => s.id === "sa-curl")!;
    const r = resolveSlot(slot, { ...confirmed, "cable-straight-bar": "available" });
    expect(r.kind === "assigned" && r.exercise.id).toBe("straight-bar-cable-curl");
  });

  it("blocks a slot rather than assigning an unconfirmed machine", () => {
    const slot = PLANS[0].sessions[3].slots.find((s) => s.id === "bb-pulldown")!;
    const r = resolveSlot(slot, confirmed);
    expect(r).toEqual({ kind: "blocked", askAbout: ["lat-pulldown"] });
  });

  it("never treats unavailable equipment as available", () => {
    const r = resolveSlot({ id: "x", options: ["leg-press"], sets: 1, reps: "1", restSec: 0 }, {
      ...confirmed,
      "leg-press": "unavailable",
    });
    expect(r).toEqual({ kind: "blocked", askAbout: [] });
  });
});

describe("sanitize", () => {
  it("returns defaults for garbage", () => {
    expect(sanitize("nope")).toEqual(defaultState());
    expect(sanitize({ version: 99 })).toEqual(defaultState());
  });

  it("keeps valid fields and drops invalid ones", () => {
    const s = sanitize({
      version: 1,
      equipment: { dumbbells: "available", "leg-press": "maybe", fake: "available" },
      activePlanId: "ppl-3",
      progress: {
        "2026-10-24": { "push-press": { exerciseId: "chest-press-machine", sets: [true, false] } },
        "not-a-date": {},
      },
    });
    expect(s.equipment.dumbbells).toBe("available");
    expect(s.equipment["leg-press"]).toBe("available");
    expect("fake" in s.equipment).toBe(false);
    expect(s.activePlanId).toBe("ppl-3");
    expect(Object.keys(s.progress)).toEqual(["2026-10-24"]);
  });
});
