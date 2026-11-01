import { useState } from "react";
import { ExerciseBadges, ExerciseDetails } from "../components/ExerciseDetails";
import { ExerciseThumb } from "../components/ExerciseImage";
import { RatingStars } from "../components/RatingStars";
import { EXERCISES } from "../data/exercises";
import { TECHNIQUE_BASICS } from "../data/technique";
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

type Filter = "all" | "available" | "gems" | "top" | "avoided";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function Library({ state, setState }: Props) {
  const [filter, setFilter] = useState<Filter>("available");
  const [open, setOpen] = useState<string | null>(null);
  const showDemo = state.settings.showDemoPhotos;
  const avoided = new Set(state.avoided);

  const rate = (id: string, stars: number) =>
    setState((s) => {
      const ratings = { ...s.ratings };
      if (stars) ratings[id] = stars;
      else delete ratings[id];
      return { ...s, ratings };
    });
  const bringBack = (id: string) => setState((s) => ({ ...s, avoided: s.avoided.filter((x) => x !== id) }));
  const hide = (id: string) => setState((s) => ({ ...s, avoided: [...new Set([...s.avoided, id])] }));

  return (
    <section>
      <h2>Exercises</h2>
      <details className="basics">
        <summary>Technique basics: how to make the right muscle work</summary>
        {TECHNIQUE_BASICS.map((topic) => (
          <div key={topic.title} className="basics__topic">
            <h4>{topic.title}</h4>
            <ul>
              {topic.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
      <div className="pills pills--wide" aria-label="Filter">
        {(
          [
            ["available", "At my gym"],
            ["gems", "★ Hidden gems"],
            ["top", "Top rated"],
            ["avoided", `Not for me${state.avoided.length ? ` (${state.avoided.length})` : ""}`],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {filter === "avoided" && (
        <p className="muted small">
          These are never suggested or picked for your workouts. Open one and tap "Bring it back" to use it again.
        </p>
      )}
      {filter === "avoided" && state.avoided.length === 0 && <p className="empty">Nothing hidden. Use "Not for me" on any exercise you don't want.</p>}
      {filter === "top" && <p className="muted small">Exercises you rated 4 or 5 stars. The app ranks these higher when suggesting swaps.</p>}
      {filter === "gems" && (
        <p className="muted small">
          Lesser-known exercises picked for a reason: they hit a muscle from a different angle, use your machines in a
          way most people don't, or replace equipment your gym doesn't have. See docs/RESEARCH.md for the reasoning.
        </p>
      )}

      {GROUPS.map((group) => {
        const items = EXERCISES.filter((e) => e.muscleGroup === group)
          .map((e) => ({ e, a: exerciseAvailability(e, state.equipment) }))
          .filter(({ e, a }) => {
            const hidden = avoided.has(e.id);
            if (filter === "avoided") return hidden;
            if (filter === "top") return (state.ratings[e.id] ?? 0) >= 4;
            if (filter === "gems") return !!e.gem && !hidden;
            if (filter === "available") return a === "available" && !hidden;
            return true;
          });
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
                        {avoided.has(e.id) && <span className="badge badge--warn">Not for me</span>}
                      </div>
                      {state.ratings[e.id] ? <span className="stars-read" aria-label={`Your rating: ${state.ratings[e.id]} of 5`}>{"★".repeat(state.ratings[e.id])}</span> : null}
                      <span className="muted small block">{e.targetMuscles.join(" · ")}</span>
                    </div>
                  </button>
                  {open === e.id && (
                    <>
                      <div className="ratingrow ratingrow--lib">
                        <RatingStars value={state.ratings[e.id] ?? 0} onChange={(n) => rate(e.id, n)} label={`Rate ${e.name}`} />
                        {avoided.has(e.id) ? (
                          <button type="button" className="linkbtn" onClick={() => bringBack(e.id)}>
                            ↩ Bring it back
                          </button>
                        ) : (
                          <button type="button" className="linkbtn linkbtn--hate" onClick={() => hide(e.id)}>
                            👎 Not for me
                          </button>
                        )}
                      </div>
                      <ExerciseDetails exercise={e} showDemo={showDemo} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
