import { useState } from "react";
import type { Exercise } from "../lib/types";

/**
 * Shows the exercise photo when one has been added, otherwise an honest
 * placeholder. Never substitutes a generic image.
 */
export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  const [failed, setFailed] = useState(false);
  const image = exercise.image;

  if (image && !failed) {
    return (
      <figure className="ex-image">
        <img
          src={import.meta.env.BASE_URL + image.src}
          alt={image.alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
        {image.attribution && <figcaption>{image.attribution}</figcaption>}
      </figure>
    );
  }

  return (
    <div className="ex-image ex-image--placeholder" role="img" aria-label={`No photo yet for ${exercise.name}`}>
      <span className="ex-image__group">{exercise.muscleGroup}</span>
      <span className="ex-image__text">{failed ? "Photo failed to load" : "Photo needed"}</span>
    </div>
  );
}
