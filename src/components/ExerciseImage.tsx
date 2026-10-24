import { useState } from "react";
import { gymPhotosFor } from "../data/equipment";
import { demoUrl } from "../data/exercises";
import { useOwnPhotos } from "./OwnPhotos";
import type { Exercise } from "../lib/types";

const base = import.meta.env.BASE_URL;

/** A photo that falls back to an honest label if it fails (e.g. offline). */
function Photo({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="photo photo--failed" role="img" aria-label={alt}>
        Photo unavailable{typeof navigator !== "undefined" && !navigator.onLine ? " offline" : ""}
      </div>
    );
  }
  return (
    <figure className="photo">
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Card thumbnail. Prefers a photo of the user's own machine, then a demo
 * photo (only if the user turned demos on), then an honest placeholder.
 * Never substitutes a generic image.
 */
export function ExerciseThumb({ exercise, showDemo }: { exercise: Exercise; showDemo: boolean }) {
  const [failed, setFailed] = useState(false);
  const own = useOwnPhotos();
  const gym = gymPhotosFor(exercise.equipmentIds)[0];
  const src = gym ? base + gym : showDemo && exercise.demo ? demoUrl(exercise.demo, 1) : null;

  if (src && !failed) {
    return (
      <div className="thumb">
        <img src={src} alt={gym ? `${own ? "The machine at your gym" : "Example machine"} for ${exercise.name}` : `${exercise.name} demonstration`} loading="lazy" onError={() => setFailed(true)} />
        {gym && <span className="thumb__tag">{own ? "Your gym" : "Example"}</span>}
      </div>
    );
  }
  return (
    <div className="thumb thumb--placeholder" role="img" aria-label={`No photo for ${exercise.name}`}>
      <span className="thumb__group">{exercise.muscleGroup}</span>
      <span className="thumb__text">{exercise.demo && !showDemo ? "Demo photos off" : "No photo yet"}</span>
    </div>
  );
}

/** Full gallery for the details view. */
export function ExerciseGallery({ exercise, showDemo }: { exercise: Exercise; showDemo: boolean }) {
  const own = useOwnPhotos();
  const gym = gymPhotosFor(exercise.equipmentIds);
  const demo = showDemo && exercise.demo;
  if (!gym.length && !demo) {
    return (
      <p className="muted small">
        {exercise.demo
          ? "Demo photos are off. Turn them on in My gym → Settings."
          : "No photo for this exercise yet. Follow the written steps below."}
      </p>
    );
  }
  return (
    <div className="gallery">
      {gym.map((p) => (
        <Photo key={p} src={base + p} alt={`${own ? "The machine at your gym" : "Example machine"} used for ${exercise.name}`} caption={own ? "Your gym" : "Example machine"} />
      ))}
      {demo && (
        <>
          <Photo src={demoUrl(demo, 0)} alt={`${exercise.name}: start position`} caption="Start" />
          <Photo src={demoUrl(demo, 1)} alt={`${exercise.name}: end position`} caption="Finish" />
        </>
      )}
      {demo && (
        <p className="muted tiny gallery__credit">
          Demo photos: Free Exercise DB (github.com/yuhonas/free-exercise-db).
          {exercise.demoNote ? ` ${exercise.demoNote}` : ""}
        </p>
      )}
    </div>
  );
}
