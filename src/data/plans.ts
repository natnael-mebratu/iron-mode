import type { Plan, Slot } from "../lib/types";

const slot = (
  id: string,
  options: string[],
  sets: number,
  reps: string,
  restSec: number,
  extra: Partial<Slot> = {},
): Slot => ({ id, options, sets, reps, restSec, ...extra });

// Beginner volumes: roughly 14–18 working sets per session, 2–3 sets per
// exercise, rep ranges for double progression. Optional slots are extras for
// good days, not targets.
const CURRENT_SPLIT: Plan = {
  id: "current-split",
  name: "Current split",
  description: "Your existing 5-day body-part split, rebuilt around the machines at your gym.",
  sessions: [
    {
      id: "shoulders-arms",
      name: "Shoulders + Biceps + Triceps",
      focus: "Shoulders, biceps, triceps",
      slots: [
        slot("sa-press", ["machine-shoulder-press", "db-shoulder-press"], 3, "8–12", 120),
        slot("sa-lateral", ["db-lateral-raise"], 3, "12–15", 60),
        slot("sa-lean", ["incline-side-lateral"], 2, "12–15", 60, { optional: true, note: "Each arm." }),
        slot("sa-rear", ["rope-face-pull", "rear-delt-fly"], 2, "12–15", 60),
        slot("sa-curl", ["ez-preacher-curl", "rope-cable-curl"], 3, "8–12", 90),
        slot("sa-hammer", ["rope-hammer-curl", "cross-body-hammer-curl"], 2, "10–12", 75),
        slot("sa-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
        slot("sa-tri2", ["db-kickback"], 2, "12–15", 60, { optional: true }),
      ],
    },
    {
      id: "legs-a",
      name: "Legs A (quads) + Abs",
      focus: "Quads, hamstrings, calves, abs",
      slots: [
        slot("la-press", ["leg-press"], 3, "10–12", 150),
        slot("la-ext", ["leg-extension"], 3, "12–15", 90),
        slot("la-rdl", ["db-rdl", "rope-pull-through"], 3, "8–12", 120),
        slot("la-split", ["bulgarian-split-squat", "goblet-squat"], 2, "8–10", 90, {
          optional: true,
          note: "Each leg. Start with bodyweight.",
        }),
        slot("la-calf", ["db-calf-raise", "leg-press-calf-raise"], 3, "10–15", 60),
        slot("la-tib", ["tibialis-raise"], 2, "15–20", 45, { optional: true }),
        slot("la-abs", ["rope-cable-crunch", "crunch"], 3, "10–15", 60),
      ],
    },
    {
      id: "chest-triceps",
      name: "Chest + Triceps",
      focus: "Chest, front shoulders, triceps",
      slots: [
        slot("ct-press", ["chest-press-machine", "db-bench-press"], 3, "8–12", 120),
        slot("ct-incline", ["plate-incline-press", "machine-incline-press", "low-incline-db-press"], 3, "8–12", 120),
        slot("ct-fly", ["incline-db-fly"], 2, "12–15", 75),
        slot("ct-pullover", ["db-pullover"], 2, "10–12", 75, { optional: true }),
        slot("ct-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
        slot("ct-tri2", ["db-kickback"], 2, "12–15", 60, { optional: true }),
      ],
    },
    {
      id: "back-biceps",
      name: "Back + Biceps",
      focus: "Back, rear shoulders, biceps, forearms",
      slots: [
        slot("bb-pulldown", ["lat-pulldown"], 3, "8–12", 120),
        slot("bb-row", ["chest-supported-row", "incline-db-row"], 3, "8–12", 120),
        slot("bb-straight", ["rope-straight-arm-pulldown"], 2, "12–15", 60),
        slot("bb-kelso", ["kelso-shrug"], 2, "10–12", 60, { optional: true }),
        slot("bb-curl", ["spider-curl", "incline-db-curl", "rope-cable-curl"], 2, "10–12", 75),
        slot("bb-curl2", ["incline-db-curl", "bayesian-curl"], 2, "10–12", 75, { optional: true }),
        slot("bb-forearm", ["zottman-curl", "db-wrist-curl"], 2, "10–12", 60, { optional: true }),
      ],
    },
    {
      id: "legs-b",
      name: "Legs B (glutes & hamstrings) + Abs",
      focus: "Glutes, hamstrings, inner/outer hips, calves, core",
      slots: [
        slot("lb-press", ["leg-press-high-feet"], 3, "10–12", 150),
        slot("lb-hinge", ["b-stance-rdl", "db-rdl"], 3, "8–12", 120, { note: "Each leg for B-stance." }),
        slot("lb-thrust", ["barbell-hip-thrust", "single-leg-glute-bridge"], 3, "8–12", 120),
        slot("lb-single", ["single-leg-press"], 2, "10–12", 90, { optional: true, note: "Each leg." }),
        slot("lb-adductor", ["copenhagen-plank"], 2, "15–30", 45, { note: "Seconds per side." }),
        slot("lb-abductor", ["standing-hip-abduction"], 2, "12–15", 45, { optional: true, note: "Each side." }),
        slot("lb-calf", ["seated-calf-raise", "leg-press-calf-raise"], 3, "12–15", 60),
        slot("lb-core", ["ab-wheel-rollout", "rope-pallof-press", "dead-bug"], 3, "8–12", 60),
      ],
    },
  ],
  defaultWeek: {
    6: "shoulders-arms",
    0: "legs-a",
    1: null,
    2: "chest-triceps",
    3: "back-biceps",
    4: "legs-b",
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
        slot("push-press", ["chest-press-machine", "db-bench-press"], 3, "8–12", 120),
        slot("push-incline", ["plate-incline-press", "low-incline-db-press"], 3, "8–12", 120),
        slot("push-shoulder", ["machine-shoulder-press", "db-shoulder-press"], 2, "8–12", 120),
        slot("push-lateral", ["db-lateral-raise"], 3, "12–15", 60),
        slot("push-tri", ["rope-triceps-pushdown"], 3, "10–12", 75),
        slot("push-fly", ["incline-db-fly"], 2, "12–15", 60, { optional: true }),
      ],
    },
    {
      id: "pull",
      name: "Pull",
      focus: "Back, rear shoulders, biceps, forearms",
      slots: [
        slot("pull-vertical", ["lat-pulldown"], 3, "8–12", 120),
        slot("pull-row", ["chest-supported-row", "incline-db-row"], 3, "8–12", 120),
        slot("pull-straight", ["rope-straight-arm-pulldown"], 2, "12–15", 60),
        slot("pull-face", ["rope-face-pull"], 2, "12–15", 60),
        slot("pull-curl", ["ez-preacher-curl", "rope-cable-curl"], 2, "8–12", 90),
        slot("pull-hammer", ["rope-hammer-curl", "cross-body-hammer-curl"], 2, "10–12", 75),
        slot("pull-kelso", ["kelso-shrug"], 2, "10–12", 60, { optional: true }),
      ],
    },
    {
      id: "legs",
      name: "Legs",
      focus: "Quads, hamstrings, glutes, calves (abs optional)",
      slots: [
        slot("ppl-legs-press", ["leg-press"], 3, "10–12", 150),
        slot("ppl-legs-rdl", ["db-rdl", "rope-pull-through"], 3, "8–12", 120),
        slot("ppl-legs-ext", ["leg-extension"], 3, "12–15", 90),
        slot("ppl-legs-thrust", ["barbell-hip-thrust", "single-leg-glute-bridge"], 2, "8–12", 120, { optional: true }),
        slot("ppl-legs-calf", ["db-calf-raise", "leg-press-calf-raise"], 3, "10–15", 60),
        slot("ppl-legs-abs", ["rope-cable-crunch", "crunch"], 2, "10–15", 60, { optional: true }),
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

export function findSession(planId: string, sessionId: string) {
  return PLANS_BY_ID.get(planId)?.sessions.find((s) => s.id === sessionId);
}
