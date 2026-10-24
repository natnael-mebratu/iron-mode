import { EXERCISES, EXERCISES_BY_ID } from "../data/exercises";
import type { Availability, Exercise, MuscleGroup, Slot } from "./types";

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

export interface ResolveOptions {
  /** Skip exercises that bend the elbow deeply under load. */
  elbowFriendly?: boolean;
  /** The exercise the user picked for this slot (a swap for today or a saved one). */
  choice?: string | null;
  /**
   * An exercise already logged in this slot today. It stays put, so changing
   * equipment or the plan never hides sets that have been recorded.
   */
  pinned?: string | null;
}

/**
 * Where the shown exercise came from:
 * - plan: the first option in the plan that the gym's equipment allows
 * - swap: the user chose it
 * - logged: it was already logged today, so it's kept even though the plan has since changed
 */
export type Source = "plan" | "swap" | "logged";

export type SlotResolution =
  | {
      kind: "assigned";
      exercise: Exercise;
      source: Source;
      /** True when the plan's own first-choice exercise was skipped for equipment reasons. */
      isSubstitute: boolean;
      /** Unknown equipment that, if confirmed, would allow a preferred option. Only set for source "plan". */
      askAbout: string[];
    }
  | {
      kind: "blocked";
      /** Unknown equipment the user could confirm to unlock this slot. */
      askAbout: string[];
    };

function planPick(slot: Slot, inventory: Inventory, elbowFriendly: boolean) {
  const askAbout: string[] = [];
  for (const [index, id] of slot.options.entries()) {
    const exercise = EXERCISES_BY_ID.get(id);
    if (!exercise || (elbowFriendly && exercise.elbowCaution)) continue;
    const availability = exerciseAvailability(exercise, inventory);
    if (availability === "available") return { exercise, index, askAbout };
    if (availability === "unknown") {
      for (const eq of exercise.equipmentIds) {
        if (availabilityOf(eq, inventory) === "unknown" && !askAbout.includes(eq)) askAbout.push(eq);
      }
    }
  }
  return { exercise: null, index: -1, askAbout };
}

/**
 * Decides which exercise a slot shows. Order of precedence:
 * 1. what's already logged today (never hide recorded sets),
 * 2. the user's own choice, if its equipment is available,
 * 3. the plan's first option whose equipment is all confirmed available.
 * Unknown equipment is never treated as available.
 */
export function resolveSlot(slot: Slot, inventory: Inventory, opts: ResolveOptions = {}): SlotResolution {
  const friendly = !!opts.elbowFriendly;
  const plan = planPick(slot, inventory, friendly);

  const sourceOf = (ex: Exercise): Source => (ex.id === opts.choice ? "swap" : ex.id === plan.exercise?.id ? "plan" : "logged");

  const pinned = opts.pinned ? EXERCISES_BY_ID.get(opts.pinned) : undefined;
  if (pinned) {
    const source = sourceOf(pinned);
    return {
      kind: "assigned",
      exercise: pinned,
      source,
      isSubstitute: source === "plan" && plan.index > 0,
      askAbout: source === "plan" ? plan.askAbout : [],
    };
  }

  const choice = opts.choice ? EXERCISES_BY_ID.get(opts.choice) : undefined;
  if (choice && !(friendly && choice.elbowCaution) && exerciseAvailability(choice, inventory) === "available") {
    return { kind: "assigned", exercise: choice, source: "swap", isSubstitute: false, askAbout: [] };
  }

  if (plan.exercise) {
    return { kind: "assigned", exercise: plan.exercise, source: "plan", isSubstitute: plan.index > 0, askAbout: plan.askAbout };
  }
  return { kind: "blocked", askAbout: plan.askAbout };
}

export interface Alternative {
  exercise: Exercise;
  /** Part of the plan's own list for this slot. */
  inPlan: boolean;
  /** Unknown equipment that must be confirmed before this can be used. */
  askAbout: string[];
}

export interface Alternatives {
  /** Can be used right now. */
  ready: Alternative[];
  /** Would work if the gym has some equipment that hasn't been confirmed yet. */
  needsEquipment: Alternative[];
}

export interface AlternativesOptions {
  elbowFriendly?: boolean;
  /** Exercises already used in other slots of this session. */
  exclude?: Set<string>;
  /** Offer every exercise, not only the same muscle group. */
  all?: boolean;
}

/**
 * Replacements for a slot: the plan's own options first, then other exercises
 * for the same muscle group. Equipment the gym lacks is never offered.
 */
export function alternativesFor(
  slot: Slot,
  current: Exercise | null,
  inventory: Inventory,
  opts: AlternativesOptions = {},
): Alternatives {
  const planned = slot.options.map((id) => EXERCISES_BY_ID.get(id)).filter((e): e is Exercise => !!e);
  const group: MuscleGroup | undefined = current?.muscleGroup ?? planned[0]?.muscleGroup;
  const pool = [...planned, ...EXERCISES.filter((e) => opts.all || e.muscleGroup === group)];
  const planIds = new Set(planned.map((e) => e.id));

  const seen = new Set<string>();
  const ready: Alternative[] = [];
  const needsEquipment: Alternative[] = [];
  for (const exercise of pool) {
    if (seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    if (exercise.id === current?.id || opts.exclude?.has(exercise.id)) continue;
    if (opts.elbowFriendly && exercise.elbowCaution) continue;
    const availability = exerciseAvailability(exercise, inventory);
    if (availability === "unavailable") continue;
    const askAbout = exercise.equipmentIds.filter((id) => availabilityOf(id, inventory) === "unknown");
    const alt = { exercise, inPlan: planIds.has(exercise.id), askAbout };
    (availability === "available" ? ready : needsEquipment).push(alt);
  }
  return { ready, needsEquipment };
}
