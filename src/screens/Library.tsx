import { useState } from "react";
import { ExerciseBadges, ExerciseDetails } from "../components/ExerciseDetails";
import { ExerciseThumb } from "../components/ExerciseImage";
import { EXERCISES } from "../data/exercises";
import { exerciseAvailability } from "../lib/resolve";
import type { AppState } from "../lib/storage";
import type { MuscleGroup } from "../lib/types";

const GROUPS: MuscleGroup[] = [
  "Chest",
  "Shoulders",
  "Back",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quads",
  "Hamstrings & Glutes",
  "Calves & Shins",
  "Abs & Core",
];

const LABEL = {
  available: "Available",
  unknown: "Needs confirming",
  unavailable: "NOT AVAILABLE AT MY GYM",
};

type Filter = "all" | "available" | "gems";

export function Library({ state }: { state: AppState }) {
  const [filter, setFilter] = useState<Filter>("available");
  const [open, setOpen] = useState<string | null>(null);
  const showDemo = state.settings.showDemoPhotos;

  return (
    <section>
      <h2>Exercises</h2>
      <div className="pills pills--wide" aria-label="Filter">
        {(
          [
            ["available", "At my gym"],
            ["gems", "★ Hidden gems"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {filter === "gems" && (
        <p className="muted small">
          Lesser-known exercises picked for a reason: they hit a muscle from a different angle, use your machines in a
          way most people don't, or replace equipment your gym doesn't have. See docs/RESEARCH.md for the reasoning.
        </p>
      )}

      {GROUPS.map((group) => {
        const items = EXERCISES.filter((e) => e.muscleGroup === group)
          .map((e) => ({ e, a: exerciseAvailability(e, state.equipment) }))
          .filter(({ e, a }) => (filter === "available" ? a === "available" : filter === "gems" ? e.gem : true));
        if (!items.length) return null;
        return (
          <div key={group} className="lib-group">
            <h3>{group}</h3>
            <ul className="lib-list">
              {items.map(({ e, a }) => (
                <li key={e.id} className={`lib-item lib-item--${a}`}>
                  <button type="button" className="lib-item__row" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
                    <ExerciseThumb exercise={e} showDemo={showDemo} />
                    <div>
                      <strong>{e.name}</strong>
                      <div className="badges">
                        <span className={`avail avail--${a}`}>{LABEL[a]}</span>
                        <ExerciseBadges exercise={e} />
                      </div>
                      <span className="muted small block">{e.targetMuscles.join(" · ")}</span>
                    </div>
                  </button>
                  {open === e.id && <ExerciseDetails exercise={e} showDemo={showDemo} />}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
