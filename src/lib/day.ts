import type { ExtraSlot, WorkoutLog } from "./storage";
import type { Session, Slot } from "./types";

export interface DaySlot {
  slot: Slot;
  /** Added by the user for this day only. */
  extra: boolean;
  skipped: boolean;
}

export const extraToSlot = (e: ExtraSlot): Slot => ({
  id: e.id,
  options: [e.exerciseId],
  sets: e.sets,
  reps: e.reps,
  restSec: e.restSec,
});

/** The session's slots for one day: plan + added exercises, in the user's order, with skips marked. */
export function daySlots(session: Session, log: WorkoutLog | undefined): DaySlot[] {
  const all: DaySlot[] = [
    ...session.slots.map((slot) => ({ slot, extra: false, skipped: false })),
    ...(log?.extras ?? []).map((e) => ({ slot: extraToSlot(e), extra: true, skipped: false })),
  ];
  const skipped = new Set(log?.skipped ?? []);
  for (const d of all) d.skipped = skipped.has(d.slot.id);
  const order = log?.order;
  if (!order?.length) return all;
  const index = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  // Array#sort is stable, so slots missing from `order` keep their original relative order at the end.
  return [...all].sort((a, b) => index(a.slot.id) - index(b.slot.id));
}

/** New order after moving `id` one place up (-1) or down (+1). */
export function moveInOrder(ids: string[], id: string, dir: -1 | 1): string[] {
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
