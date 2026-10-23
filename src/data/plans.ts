import type { Plan, Session, Slot } from "../lib/types";

const slot = (
  id: string,
  options: string[],
  sets: number,
  reps: string,
  restSec: number,
  extra: Partial<Slot> = {},
): Slot => ({ id, options, sets, reps, restSec, ...extra });

const LEGS_ABS: Session = {
  id: "legs-abs",
  name: "Legs + Abs",
  focus: "Quads, hamstrings, glutes, calves, abs",
  slots: [
    slot("legs-press", ["leg-press"], 3, "10–12", 120),
    slot("legs-ext", ["leg-extension"], 3, "12–15", 90),
    slot("legs-ham", ["lying-leg-curl", "rope-pull-through", "glute-bridge"], 3, "10–12", 90),
    slot("legs-calf", ["standing-calf-raise", "leg-press-calf-raise"], 3, "12–15", 60),
    slot("legs-abs1", ["rope-cable-crunch", "crunch"], 3, "12–15", 60, { optional: true }),
    slot("legs-abs2", ["reverse-crunch", "dead-bug"], 2, "10–12", 60, { optional: true }),
  ],
};

const CURRENT_SPLIT: Plan = {
  id: "current-split",
  name: "Current split",
  description: "Your existing 5-day body-part split.",
  sessions: [
    {
      id: "shoulders-arms",
      name: "Shoulders + Biceps + Triceps",
      focus: "Shoulders, biceps, triceps",
      slots: [
        slot("sa-press", ["dumbbell-shoulder-press"], 3, "8–12", 90),
        slot("sa-lateral", ["dumbbell-lateral-raise", "cable-lateral-raise"], 3, "12–15", 60),
        slot("sa-rear", ["rope-face-pull"], 3, "12–15", 60),
        slot("sa-curl", ["straight-bar-cable-curl", "ez-bar-cable-curl", "rope-cable-curl"], 3, "10–12", 75),
        slot("sa-hammer", ["rope-hammer-curl"], 2, "10–12", 75),
        slot("sa-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
      ],
    },
    LEGS_ABS,
    {
      id: "chest-triceps",
      name: "Chest + Triceps",
      focus: "Chest, front shoulders, triceps",
      slots: [
        slot("ct-press", ["chest-press-machine"], 3, "8–12", 120),
        slot("ct-incline", ["incline-chest-press-machine"], 3, "8–12", 120),
        slot("ct-fly", ["pec-deck-fly", "cable-chest-fly"], 3, "12–15", 75),
        slot("ct-pushup", ["push-up"], 2, "As many good reps as you can, stop 2 short", 75, {
          optional: true,
        }),
        slot("ct-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
      ],
    },
    {
      id: "back-biceps",
      name: "Back + Biceps",
      focus: "Back, rear shoulders, biceps, forearms",
      slots: [
        slot("bb-pulldown", ["lat-pulldown"], 3, "8–12", 120),
        slot("bb-row", ["seated-cable-row", "standing-rope-row"], 3, "10–12", 90),
        slot("bb-face", ["rope-face-pull"], 2, "12–15", 60),
        slot("bb-curl", ["straight-bar-cable-curl", "ez-bar-cable-curl", "rope-cable-curl"], 3, "10–12", 75),
        slot("bb-hammer", ["rope-hammer-curl"], 2, "10–12", 75),
        slot("bb-incline", ["incline-dumbbell-curl"], 2, "10–12", 75, { optional: true }),
        slot("bb-wrist", ["dumbbell-wrist-curl"], 2, "12–15", 60, { optional: true }),
      ],
    },
  ],
  defaultWeek: {
    6: "shoulders-arms",
    0: "legs-abs",
    1: null,
    2: "chest-triceps",
    3: "back-biceps",
    4: "legs-abs",
    5: null,
  },
};

const PPL_3_DAY: Plan = {
  id: "ppl-3",
  name: "Beginner Push / Pull / Legs (3 days)",
  description:
    "Each muscle trained once a week across 3 sessions, with rest days in between. Not automatically harder than your current split.",
  sessions: [
    {
      id: "push",
      name: "Push",
      focus: "Chest, shoulders, triceps",
      slots: [
        slot("push-press", ["chest-press-machine"], 3, "8–12", 120),
        slot("push-fly", ["pec-deck-fly", "cable-chest-fly"], 2, "12–15", 75),
        slot("push-shoulder", ["dumbbell-shoulder-press", "dumbbell-lateral-raise", "cable-lateral-raise"], 3, "10–12", 90),
        slot("push-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
      ],
    },
    {
      id: "pull",
      name: "Pull",
      focus: "Back, biceps, forearms",
      slots: [
        slot("pull-vertical", ["lat-pulldown"], 3, "8–12", 120),
        slot("pull-row", ["seated-cable-row", "standing-rope-row"], 3, "10–12", 90),
        slot("pull-face", ["rope-face-pull"], 2, "12–15", 60),
        slot("pull-curl", ["straight-bar-cable-curl", "ez-bar-cable-curl", "rope-cable-curl"], 2, "10–12", 75),
        slot("pull-hammer", ["rope-hammer-curl"], 2, "10–12", 75),
        slot("pull-wrist", ["dumbbell-wrist-curl"], 2, "12–15", 60, { optional: true }),
      ],
    },
    {
      id: "legs",
      name: "Legs",
      focus: "Quads, hamstrings, glutes, calves (abs optional)",
      slots: [
        slot("ppl-legs-press", ["leg-press"], 3, "10–12", 120),
        slot("ppl-legs-ext", ["leg-extension"], 3, "12–15", 90),
        slot("ppl-legs-ham", ["lying-leg-curl", "rope-pull-through", "glute-bridge"], 3, "10–12", 90),
        slot("ppl-legs-calf", ["standing-calf-raise", "leg-press-calf-raise"], 3, "12–15", 60),
        slot("ppl-legs-abs", ["rope-cable-crunch", "crunch"], 2, "12–15", 60, { optional: true }),
      ],
    },
  ],
  defaultWeek: {
    6: "push",
    0: null,
    1: null,
    2: "pull",
    3: null,
    4: "legs",
    5: null,
  },
};

export const PLANS: Plan[] = [CURRENT_SPLIT, PPL_3_DAY];
export const PLANS_BY_ID = new Map(PLANS.map((p) => [p.id, p]));
