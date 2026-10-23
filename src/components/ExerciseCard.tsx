import { useState } from "react";
import { TECHNIQUE } from "../data/technique";
import { formatSet, type PreviousPerformance, type Suggestion } from "../lib/progression";
import type { SlotResolution } from "../lib/resolve";
import type { ExerciseLog, SetEntry } from "../lib/storage";
import type { Availability, Slot } from "../lib/types";
import { AskEquipment } from "./AskEquipment";
import { ExerciseBadges, ExerciseDetails } from "./ExerciseDetails";
import { ExerciseThumb } from "./ExerciseImage";

interface Props {
  slot: Slot;
  resolution: SlotResolution;
  entry: ExerciseLog | undefined;
  prev: PreviousPerformance | null;
  suggestion: Suggestion | null;
  showDemo: boolean;
  /** Highlight as the next exercise to do. */
  upNext?: boolean;
  onSetChange: (index: number, set: SetEntry) => void;
  /** Called after a set is ticked done, to start the rest timer. */
  onSetDone: () => void;
  onSymptom: (flag: boolean) => void;
  onAnswerEquipment: (id: string, value: Availability) => void;
}

function formatRest(sec: number) {
  return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : `${sec}s`;
}

const parse = (v: string): number | null => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

export function ExerciseCard(props: Props) {
  const { slot, resolution, entry, prev, suggestion, showDemo, upNext, onSetChange, onSetDone, onSymptom, onAnswerEquipment } =
    props;
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (resolution.kind === "blocked") {
    return (
      <article className="card card--blocked">
        <header className="card__head">
          <h3>No exercise for this slot</h3>
          {slot.optional && <span className="badge">Optional</span>}
        </header>
        <p className="muted small">None of its exercises fit the equipment confirmed at your gym, so it's skipped.</p>
        {resolution.askAbout.length > 0 && (
          <AskEquipment equipmentId={resolution.askAbout[0]} prompt="This would unlock it." onAnswer={onAnswerEquipment} />
        )}
      </article>
    );
  }

  const { exercise, isSubstitute, askAbout } = resolution;
  const load = exercise.load ?? "weight";
  const sets: SetEntry[] = Array.from(
    { length: Math.max(slot.sets, entry?.sets.length ?? 0) },
    (_, i) => entry?.sets[i] ?? { weight: null, reps: null, done: false },
  );
  const doneCount = sets.filter((s) => s.done).length;
  const complete = doneCount >= slot.sets;

  const placeholder = (i: number) => {
    const p = prev?.log.sets[i] ?? prev?.log.sets.at(-1);
    return {
      weight: suggestion?.weight ?? p?.weight ?? null,
      reps: suggestion?.reps ?? p?.reps ?? null,
    };
  };

  if (complete && !expanded) {
    return (
      <article className="card card--done card--compact">
        <button type="button" className="compact" onClick={() => setExpanded(true)} aria-expanded={false}>
          <span className="compact__check" aria-hidden="true">
            ✓
          </span>
          <span className="compact__body">
            <strong>{exercise.name}</strong>
            <span className="muted small block">
              {sets.filter((s) => s.done).map((s) => formatSet(s, exercise)).join(" · ")}
            </span>
          </span>
          <span className="muted small">Edit</span>
        </button>
      </article>
    );
  }

  const tips = TECHNIQUE[exercise.id]?.tips.slice(0, 2) ?? [];

  const toggle = (i: number) => {
    const s = sets[i];
    if (s.done) return onSetChange(i, { ...s, done: false });
    const ph = placeholder(i);
    onSetChange(i, {
      weight: load === "weight" ? (s.weight ?? ph.weight) : s.weight,
      reps: s.reps ?? ph.reps,
      done: true,
    });
    onSetDone();
  };

  return (
    <article
      className={`card${complete ? " card--done" : ""}${entry?.symptom ? " card--symptom" : ""}${upNext ? " card--next" : ""}`}
    >
      {upNext && <span className="next-tag">Up next</span>}
      <button type="button" className="card__top" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ExerciseThumb exercise={exercise} showDemo={showDemo} />
        <div className="card__summary">
          <h3>{exercise.name}</h3>
          <div className="badges">
            {isSubstitute && <span className="badge badge--sub">Substitute</span>}
            {slot.optional && <span className="badge">Optional</span>}
            <ExerciseBadges exercise={exercise} />
            {complete && <span className="badge badge--done">Done</span>}
          </div>
          <p className="target">{exercise.targetMuscles.join(" · ")}</p>
          <p className="prescription">
            <strong>
              {slot.sets} × {slot.reps}
              {load === "time" ? " s" : ""}
            </strong>{" "}
            <span className="muted">· rest {formatRest(slot.restSec)}</span>
          </p>
          {slot.note && <p className="muted small">{slot.note}</p>}
          <span className="card__more">{open ? "Hide how-to ▲" : "How to do it ▼"}</span>
        </div>
      </button>

      {open && <ExerciseDetails exercise={exercise} showDemo={showDemo} />}

      {!open && tips.length > 0 && (
        <ul className="keycues" aria-label="Key technique cues">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}

      {suggestion && (
        <p className={`hint hint--${suggestion.kind}`}>
          {suggestion.message}
          {prev && <span className="muted"> Last time: {prev.log.sets.filter((s) => s.done).map((s) => formatSet(s, exercise)).join(", ")}.</span>}
        </p>
      )}

      <div className="setgrid" role="table" aria-label={`Sets for ${exercise.name}`}>
        <div className="setgrid__head" role="row">
          <span role="columnheader">Set</span>
          <span role="columnheader">Previous</span>
          <span role="columnheader">{load === "weight" ? "kg" : ""}</span>
          <span role="columnheader">{load === "time" ? "sec" : "reps"}</span>
          <span role="columnheader" className="sr-only">
            Done
          </span>
        </div>
        {sets.map((s, i) => {
          const ph = placeholder(i);
          const p = prev?.log.sets[i];
          return (
            <div key={i} className={`setrow${s.done ? " setrow--done" : ""}`} role="row">
              <span className="setrow__n">{i + 1}</span>
              <span className="setrow__prev">{p?.done ? formatSet(p, exercise) : "—"}</span>
              {load === "weight" ? (
                <input
                  aria-label={`Set ${i + 1} weight in kg`}
                  inputMode="decimal"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder={ph.weight != null ? String(ph.weight) : "kg"}
                  value={s.weight ?? ""}
                  onChange={(e) => onSetChange(i, { ...s, weight: parse(e.target.value) })}
                />
              ) : (
                <span className="setrow__bw">{load === "time" ? "" : "BW"}</span>
              )}
              <input
                aria-label={`Set ${i + 1} ${load === "time" ? "seconds" : "reps"}`}
                inputMode="numeric"
                type="number"
                min="0"
                placeholder={ph.reps != null ? String(ph.reps) : load === "time" ? "sec" : "reps"}
                value={s.reps ?? ""}
                onChange={(e) => onSetChange(i, { ...s, reps: parse(e.target.value) })}
              />
              <button
                type="button"
                className="setrow__check"
                aria-pressed={s.done}
                aria-label={s.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}
                onClick={() => toggle(i)}
              >
                ✓
              </button>
            </div>
          );
        })}
      </div>
      <div className="card__foot">
        <button
          type="button"
          className="linkbtn"
          onClick={() => onSetChange(sets.length, { weight: null, reps: null, done: false })}
        >
          + Add set
        </button>
        <button
          type="button"
          className={`linkbtn linkbtn--warn${entry?.symptom ? " linkbtn--active" : ""}`}
          aria-pressed={!!entry?.symptom}
          onClick={() => onSymptom(!entry?.symptom)}
        >
          ⚡ {entry?.symptom ? "Symptoms flagged" : "Felt tingling / pain"}
        </button>
      </div>
      {entry?.symptom && (
        <p className="safety-inline">
          Stop this exercise for today; don't push through it. The app won't suggest a heavier weight next time. If it
          keeps happening, get it checked by a doctor or physio.
        </p>
      )}

      {askAbout.length > 0 && (
        <AskEquipment
          equipmentId={askAbout[0]}
          prompt="Using a substitute because this isn't confirmed."
          onAnswer={onAnswerEquipment}
        />
      )}
    </article>
  );
}
