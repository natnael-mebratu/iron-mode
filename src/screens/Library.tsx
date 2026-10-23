import { useState } from "react";
import { equipmentName } from "../data/equipment";
import { EXERCISES } from "../data/exercises";
import { exerciseAvailability } from "../lib/resolve";
import type { AppState } from "../lib/storage";
import type { MuscleGroup } from "../lib/types";
import { ExerciseImage } from "../components/ExerciseImage";

const GROUPS: MuscleGroup[] = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Forearms", "Legs", "Abs"];

const LABEL = {
  available: "Available",
  unknown: "Needs confirming",
  unavailable: "NOT AVAILABLE AT MY GYM",
};

export function Library({ state }: { state: AppState }) {
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  return (
    <section>
      <h2>Exercises</h2>
      <label className="toggle">
        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
        Only show what I can do at my gym
      </label>

      {GROUPS.map((group) => {
        const items = EXERCISES.filter((e) => e.muscleGroup === group)
          .map((e) => ({ e, a: exerciseAvailability(e, state.equipment) }))
          .filter(({ a }) => !onlyAvailable || a === "available");
        if (!items.length) return null;
        return (
          <div key={group} className="lib-group">
            <h3>{group}</h3>
            <ul className="lib-list">
              {items.map(({ e, a }) => (
                <li key={e.id} className={`lib-item lib-item--${a}`}>
                  <ExerciseImage exercise={e} />
                  <div>
                    <strong>{e.name}</strong>
                    <span className={`avail avail--${a}`}>{LABEL[a]}</span>
                    <span className="muted small block">{e.targetMuscles.join(" · ")}</span>
                    <span className="muted small block">
                      {e.equipmentIds.length ? e.equipmentIds.map(equipmentName).join(", ") : "Bodyweight"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
