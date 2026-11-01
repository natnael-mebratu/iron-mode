import { useState } from "react";
import { EXERCISES } from "../data/exercises";
import { exerciseAvailability, type Inventory } from "../lib/resolve";
import type { MuscleGroup } from "../lib/types";
import { Sheet } from "./Sheet";

const GROUPS: MuscleGroup[] = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Forearms", "Quads", "Hamstrings & Glutes", "Calves & Shins", "Abs & Core"];

interface Props {
  inventory: Inventory;
  elbowFriendly: boolean;
  avoided: ReadonlySet<string>;
  /** Already in today's workout. */
  used: Set<string>;
  onAdd: (exerciseId: string) => void;
  onClose: () => void;
}

/** Add any exercise your gym can do to today's workout, on top of the plan. */
export function AddExerciseSheet({ inventory, elbowFriendly, avoided, used, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const list = EXERCISES.filter(
    (e) =>
      !used.has(e.id) &&
      !avoided.has(e.id) &&
      !(elbowFriendly && e.elbowCaution) &&
      exerciseAvailability(e, inventory) === "available" &&
      (!q || e.name.toLowerCase().includes(q) || e.targetMuscles.join(" ").toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)),
  );

  return (
    <Sheet title="Add an exercise" subtitle="Only for today. Your plan stays the same." onClose={onClose}>
      <input
        className="textinput"
        type="search"
        placeholder="Search, e.g. calves, curl, abs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search exercises"
      />
      {list.length === 0 && <p className="muted small">No match. Only exercises your gym can do are listed.</p>}
      {GROUPS.map((g) => {
        const items = list.filter((e) => e.muscleGroup === g);
        if (!items.length) return null;
        return (
          <div key={g}>
            <h3 className="sheet__sub">{g}</h3>
            <ul className="swap__list">
              {items.map((e) => (
                <li key={e.id}>
                  <button type="button" className="swap__pick" onClick={() => onAdd(e.id)}>
                    <strong>{e.name}</strong>
                    <span className="muted small block">{e.targetMuscles.join(" · ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </Sheet>
  );
}
