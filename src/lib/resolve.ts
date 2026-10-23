import { EXERCISES_BY_ID } from "../data/exercises";
import type { Availability, Exercise, Slot } from "./types";

export type Inventory = Record<string, Availability>;

export function availabilityOf(id: string, inventory: Inventory): Availability {
  return inventory[id] ?? "unknown";
}

/** An exercise is only as available as its least-available piece of equipment. */
export function exerciseAvailability(exercise: Exercise, inventory: Inventory): Availability {
  let result: Availability = "available";
  for (const id of exercise.equipmentIds) {
    const a = availabilityOf(id, inventory);
    if (a === "unavailable") return "unavailable";
    if (a === "unknown") result = "unknown";
  }
  return result;
}

export type SlotResolution =
  | {
      kind: "assigned";
      exercise: Exercise;
      /** True when a preferred option was skipped. */
      isSubstitute: boolean;
      /** Unknown equipment that, if confirmed, would allow a preferred option. */
      askAbout: string[];
    }
  | {
      kind: "blocked";
      /** Unknown equipment the user could confirm to unlock this slot. */
      askAbout: string[];
    };

/**
 * Picks the first option whose equipment is all confirmed available. Unknown
 * equipment is never treated as available.
 */
export function resolveSlot(slot: Slot, inventory: Inventory): SlotResolution {
  const askAbout: string[] = [];
  const addUnknowns = (ex: Exercise) => {
    for (const id of ex.equipmentIds) {
      if (availabilityOf(id, inventory) === "unknown" && !askAbout.includes(id)) askAbout.push(id);
    }
  };

  for (const [index, id] of slot.options.entries()) {
    const exercise = EXERCISES_BY_ID.get(id);
    if (!exercise) continue;
    const availability = exerciseAvailability(exercise, inventory);
    if (availability === "available") {
      return { kind: "assigned", exercise, isSubstitute: index > 0, askAbout };
    }
    if (availability === "unknown") addUnknowns(exercise);
  }
  return { kind: "blocked", askAbout };
}
