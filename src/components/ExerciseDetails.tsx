import { equipmentName } from "../data/equipment";
import { TECHNIQUE } from "../data/technique";
import type { Exercise } from "../lib/types";
import { ExerciseGallery } from "./ExerciseImage";

export function ExerciseBadges({ exercise }: { exercise: Exercise }) {
  return (
    <>
      {exercise.gem && <span className="badge badge--gem">★ Hidden gem</span>}
      {exercise.elbowCaution && <span className="badge badge--warn">Elbow caution</span>}
    </>
  );
}

/** Everything needed to do the exercise well; used in cards and the library. */
export function ExerciseDetails({ exercise, showDemo }: { exercise: Exercise; showDemo: boolean }) {
  const technique = TECHNIQUE[exercise.id];
  return (
    <div className="details">
      <ExerciseGallery exercise={exercise} showDemo={showDemo} />
      <p className="why">{exercise.why}</p>
      <p className="small muted">
        <strong>Muscles:</strong> {exercise.targetMuscles.join(", ")}
        <br />
        <strong>Equipment:</strong>{" "}
        {exercise.equipmentIds.length ? exercise.equipmentIds.map(equipmentName).join(", ") : "None (bodyweight)"}
      </p>
      <p>
        <strong>Setup:</strong> {exercise.setup}
      </p>
      {technique && (
        <div className="target-box">
          <p className="details__label">Where you should feel it</p>
          <p>{technique.feel}</p>
          <p className="details__label">Make the target muscle work</p>
          <ul>
            {technique.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="details__label">Form cues</p>
      <ul>
        {exercise.formCues.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="details__label">Common mistakes</p>
      <ul>
        {exercise.commonMistakes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {exercise.safetyNotes?.map((n) => (
        <p key={n} className="safety-inline">
          {n}
        </p>
      ))}
    </div>
  );
}
