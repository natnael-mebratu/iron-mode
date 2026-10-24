import { describe, expect, it } from "vitest";
import { EXERCISES_BY_ID } from "../data/exercises";
import { PLANS } from "../data/plans";
import { alternativesFor, resolveSlot } from "./resolve";
import { defaultEquipment } from "./storage";
import type { Slot } from "./types";

const inventory = defaultEquipment();
const allSlots = PLANS.flatMap((p) => p.sessions.flatMap((s) => s.slots));
const slotById = (id: string) => allSlots.find((s) => s.id === id)!;
const nameOf = (r: ReturnType<typeof resolveSlot>) => (r.kind === "assigned" ? r.exercise.id : null);

describe("workout rebuilds when equipment changes", () => {
  const curl = slotById("sa-curl"); // ez-preacher-curl → rope-cable-curl

  it("uses the first plan option the gym can do, and switches when equipment is removed or added", () => {
    expect(nameOf(resolveSlot(curl, inventory))).toBe("ez-preacher-curl");
    expect(nameOf(resolveSlot(curl, { ...inventory, "preacher-curl": "unavailable" }))).toBe("rope-cable-curl");
    expect(nameOf(resolveSlot(curl, { ...inventory, "preacher-curl": "unavailable", "cable-rope": "unavailable" }))).toBeNull();
  });

  it("unlocks a slot once the missing machine is confirmed", () => {
    const slot: Slot = { id: "x", options: ["bayesian-curl", "rope-cable-curl"], sets: 3, reps: "10–12", restSec: 60 };
    const before = resolveSlot(slot, inventory);
    expect(nameOf(before)).toBe("rope-cable-curl");
    expect(before.kind === "assigned" && before.askAbout).toEqual(["cable-handle"]);
    // Confirming the D-handle rebuilds the slot with the preferred exercise.
    const after = resolveSlot(slot, { ...inventory, "cable-handle": "available" });
    expect(nameOf(after)).toBe("bayesian-curl");
    expect(after.kind === "assigned" && after.askAbout).toEqual([]);
    // Saying "no" stops the question and keeps the substitute.
    const no = resolveSlot(slot, { ...inventory, "cable-handle": "unavailable" });
    expect(nameOf(no)).toBe("rope-cable-curl");
    expect(no.kind === "assigned" && no.askAbout).toEqual([]);
  });

  it("never hides an exercise that already has logged sets, even after the plan's pick changes", () => {
    // The user logged leg press calf raises, then confirmed the seated calf raise.
    const slot = slotById("lb-calf");
    const confirmed = { ...inventory, "seated-calf-raise": "available" as const };
    expect(nameOf(resolveSlot(slot, confirmed))).toBe("seated-calf-raise");
    const kept = resolveSlot(slot, confirmed, { pinned: "leg-press-calf-raise" });
    expect(nameOf(kept)).toBe("leg-press-calf-raise");
    expect(kept.kind === "assigned" && kept.source).toBe("logged");
  });

  it("keeps a logged exercise even if its equipment is later marked unavailable", () => {
    const r = resolveSlot(curl, { ...inventory, "preacher-curl": "unavailable" }, { pinned: "ez-preacher-curl" });
    expect(nameOf(r)).toBe("ez-preacher-curl");
  });
});

describe("swapping an exercise", () => {
  const press = slotById("ct-press"); // chest-press-machine → db-bench-press

  it("shows the chosen exercise and marks it as a swap", () => {
    const r = resolveSlot(press, inventory, { choice: "low-incline-db-press" });
    expect(nameOf(r)).toBe("low-incline-db-press");
    expect(r.kind === "assigned" && r.source).toBe("swap");
    expect(r.kind === "assigned" && r.askAbout).toEqual([]);
  });

  it("ignores a saved swap whose equipment is no longer available, falling back to the plan", () => {
    const r = resolveSlot(press, { ...inventory, dumbbells: "unavailable" }, { choice: "low-incline-db-press" });
    expect(nameOf(r)).toBe("chest-press-machine");
    expect(r.kind === "assigned" && r.source).toBe("plan");
  });

  it("never swaps in an elbow-caution exercise while elbow-friendly mode is on", () => {
    const tri = slotById("sa-tri");
    expect(nameOf(resolveSlot(tri, inventory, { choice: "rope-overhead-extension", elbowFriendly: true }))).toBe("rope-triceps-pushdown");
    expect(nameOf(resolveSlot(tri, inventory, { choice: "rope-overhead-extension", elbowFriendly: false }))).toBe("rope-overhead-extension");
  });

  it("a swap wins over the plan, and a logged exercise wins over a swap", () => {
    const r = resolveSlot(press, inventory, { choice: "db-bench-press", pinned: "chest-press-machine" });
    expect(nameOf(r)).toBe("chest-press-machine");
  });
});

describe("alternativesFor", () => {
  const press = slotById("ct-press");
  const current = EXERCISES_BY_ID.get("chest-press-machine")!;

  it("offers same-muscle exercises the gym can do, without the current one", () => {
    const { ready } = alternativesFor(press, current, inventory);
    const ids = ready.map((a) => a.exercise.id);
    expect(ids).toContain("db-bench-press");
    expect(ids).toContain("push-up");
    expect(ids).not.toContain("chest-press-machine");
    for (const a of ready) expect(a.exercise.muscleGroup).toBe("Chest");
  });

  it("only offers exercises whose equipment is confirmed in 'ready'", () => {
    for (const slot of allSlots) {
      const cur = resolveSlot(slot, inventory);
      const { ready } = alternativesFor(slot, cur.kind === "assigned" ? cur.exercise : null, inventory, { elbowFriendly: true });
      for (const a of ready) {
        for (const id of a.exercise.equipmentIds) expect(inventory[id], `${slot.id} → ${a.exercise.id} needs ${id}`).toBe("available");
      }
    }
  });

  it("never offers exercises that need equipment the gym doesn't have", () => {
    const noDumbbells = { ...inventory, dumbbells: "unavailable" as const };
    const { ready, needsEquipment } = alternativesFor(press, current, noDumbbells);
    for (const a of [...ready, ...needsEquipment]) expect(a.exercise.equipmentIds).not.toContain("dumbbells");
  });

  it("lists exercises with unconfirmed equipment separately, with the question to ask", () => {
    const curlSlot = slotById("sa-curl");
    const cur = EXERCISES_BY_ID.get("ez-preacher-curl")!;
    const { ready, needsEquipment } = alternativesFor(curlSlot, cur, inventory);
    const bayesian = needsEquipment.find((a) => a.exercise.id === "bayesian-curl");
    expect(bayesian?.askAbout).toEqual(["cable-handle"]);
    expect(ready.some((a) => a.askAbout.length > 0)).toBe(false);
  });

  it("moves an exercise from 'needs equipment' to 'ready' once the equipment is confirmed", () => {
    const lat = slotById("sa-curl");
    const cur = EXERCISES_BY_ID.get("ez-preacher-curl")!;
    const before = alternativesFor(lat, cur, inventory);
    expect(before.needsEquipment.map((a) => a.exercise.id)).toContain("bayesian-curl");
    const after = alternativesFor(lat, cur, { ...inventory, "cable-handle": "available" });
    expect(after.ready.map((a) => a.exercise.id)).toContain("bayesian-curl");
    expect(after.needsEquipment.map((a) => a.exercise.id)).not.toContain("bayesian-curl");
  });

  it("skips exercises used elsewhere in the session and elbow-caution ones when asked", () => {
    const tri = slotById("sa-tri");
    const cur = EXERCISES_BY_ID.get("rope-triceps-pushdown")!;
    const friendly = alternativesFor(tri, cur, inventory, { elbowFriendly: true });
    expect([...friendly.ready, ...friendly.needsEquipment].map((a) => a.exercise.id)).not.toContain("rope-overhead-extension");
    const open = alternativesFor(tri, cur, inventory, { elbowFriendly: false });
    expect(open.ready.map((a) => a.exercise.id)).toContain("rope-overhead-extension");
    const used = alternativesFor(tri, cur, inventory, { exclude: new Set(["db-kickback"]) });
    expect(used.ready.map((a) => a.exercise.id)).not.toContain("db-kickback");
  });

  it("can offer exercises from other muscle groups on request", () => {
    const narrow = alternativesFor(press, current, inventory).ready.map((a) => a.exercise.muscleGroup);
    const wide = alternativesFor(press, current, inventory, { all: true }).ready.map((a) => a.exercise.muscleGroup);
    expect(new Set(narrow).size).toBe(1);
    expect(new Set(wide).size).toBeGreaterThan(1);
  });

  it("can offer something for a slot that currently has nothing", () => {
    const noCables = { ...inventory, "cable-rope": "unavailable" as const };
    const slot: Slot = { id: "x", options: ["rope-face-pull"], sets: 2, reps: "12–15", restSec: 60 };
    expect(resolveSlot(slot, noCables).kind).toBe("blocked");
    const { ready } = alternativesFor(slot, null, noCables);
    expect(ready.map((a) => a.exercise.id)).toContain("rear-delt-fly");
  });
});
