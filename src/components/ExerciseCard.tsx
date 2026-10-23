import { equipmentName } from "../data/equipment";
import type { SlotResolution } from "../lib/resolve";
import type { Availability, Slot } from "../lib/types";
import { AskEquipment } from "./AskEquipment";
import { ExerciseImage } from "./ExerciseImage";

interface Props {
  slot: Slot;
  resolution: SlotResolution;
  sets: boolean[];
  onToggleSet: (index: number) => void;
  onAnswerEquipment: (id: string, value: Availability) => void;
}

function formatRest(sec: number) {
  return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} min` : `${sec} s`;
}

export function ExerciseCard({ slot, resolution, sets, onToggleSet, onAnswerEquipment }: Props) {
  if (resolution.kind === "blocked") {
    return (
      <article className="card card--blocked">
        <header className="card__head">
          <h3>No exercise assigned</h3>
          {slot.optional && <span className="badge">Optional</span>}
        </header>
        <p className="muted">
          None of the exercises for this slot can be done with the equipment confirmed at your gym, so it's
          skipped for now.
        </p>
        {resolution.askAbout.length > 0 && (
          <AskEquipment
            equipmentId={resolution.askAbout[0]}
            prompt="This would unlock it."
            onAnswer={onAnswerEquipment}
          />
        )}
      </article>
    );
  }

  const { exercise, isSubstitute, askAbout } = resolution;
  const doneCount = sets.filter(Boolean).length;
  const complete = doneCount === slot.sets;

  return (
    <article className={`card${complete ? " card--done" : ""}`}>
      <div className="card__top">
        <ExerciseImage exercise={exercise} />
        <div className="card__summary">
          <header className="card__head">
            <h3>{exercise.name}</h3>
          </header>
          <div className="badges">
            {isSubstitute && <span className="badge badge--sub">Substitute</span>}
            {slot.optional && <span className="badge">Optional</span>}
            {complete && <span className="badge badge--done">Done</span>}
          </div>
          <p className="target">{exercise.targetMuscles.join(" · ")}</p>
          <p className="prescription">
            <strong>
              {slot.sets} × {slot.reps}
            </strong>{" "}
            <span className="muted">· rest {formatRest(slot.restSec)}</span>
          </p>
          <p className="muted small">
            {exercise.equipmentIds.length
              ? exercise.equipmentIds.map(equipmentName).join(", ")
              : "Bodyweight, no equipment"}
          </p>
        </div>
      </div>

      <div className="sets" role="group" aria-label={`Sets for ${exercise.name}`}>
        {Array.from({ length: slot.sets }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`set${sets[i] ? " set--done" : ""}`}
            aria-pressed={!!sets[i]}
            onClick={() => onToggleSet(i)}
          >
            Set {i + 1}
            <span aria-hidden="true">{sets[i] ? " ✓" : ""}</span>
          </button>
        ))}
      </div>

      {askAbout.length > 0 && (
        <AskEquipment
          equipmentId={askAbout[0]}
          prompt="Using a substitute because this isn't confirmed."
          onAnswer={onAnswerEquipment}
        />
      )}

      <details className="howto">
        <summary>How to do it</summary>
        <p>
          <strong>Setup:</strong> {exercise.setup}
        </p>
        <p className="howto__label">Form cues</p>
        <ul>
          {exercise.formCues.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="howto__label">Common mistakes</p>
        <ul>
          {exercise.commonMistakes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {slot.note && <p className="muted">{slot.note}</p>}
      </details>

      {exercise.safetyNotes?.map((n) => (
        <p key={n} className="safety-inline">
          {n}
        </p>
      ))}
    </article>
  );
}
