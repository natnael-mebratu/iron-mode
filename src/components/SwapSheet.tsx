import { useEffect, useRef, useState } from "react";
import { equipmentName } from "../data/equipment";
import { alternativesFor, type Alternative, type Inventory } from "../lib/resolve";
import type { Availability, Exercise, Slot } from "../lib/types";

interface Props {
  slot: Slot;
  /** The exercise currently shown (null when nothing fits this slot). */
  current: Exercise | null;
  inventory: Inventory;
  elbowFriendly: boolean;
  /** Exercises used in the session's other slots. */
  usedIds: Set<string>;
  /** Sets are already logged for the current exercise. */
  hasLogged: boolean;
  /** The current exercise came from a swap. */
  isSwapped: boolean;
  onPick: (exerciseId: string, always: boolean) => void;
  onReset: () => void;
  onAnswerEquipment: (id: string, value: Availability) => void;
  onClose: () => void;
}

/** Bottom sheet for replacing one exercise, e.g. when a machine is busy or missing. */
export function SwapSheet(props: Props) {
  const { slot, current, inventory, elbowFriendly, usedIds, hasLogged, isSwapped, onPick, onReset, onAnswerEquipment, onClose } = props;
  const [always, setAlways] = useState(false);
  const [all, setAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    document.body.classList.add("noscroll");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("noscroll");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const { ready, needsEquipment } = alternativesFor(slot, current, inventory, { elbowFriendly, exclude: usedIds, all });

  const row = (alt: Alternative) => (
    <li key={alt.exercise.id} className="swap__item">
      {alt.askAbout.length === 0 ? (
        <button type="button" className="swap__pick" onClick={() => onPick(alt.exercise.id, always)}>
          <strong>{alt.exercise.name}</strong>
          <span className="muted small block">{alt.exercise.targetMuscles.join(" · ")}</span>
          <span className="muted small block">{alt.exercise.why}</span>
          <span className="badges">
            {alt.inPlan && <span className="badge">In the plan</span>}
            {alt.exercise.gem && <span className="badge badge--gem">★ Hidden gem</span>}
          </span>
        </button>
      ) : (
        <div className="swap__pick swap__pick--locked">
          <strong>{alt.exercise.name}</strong>
          <span className="muted small block">{alt.exercise.targetMuscles.join(" · ")}</span>
          <span className="block small">
            Needs: <strong>{equipmentName(alt.askAbout[0])}</strong>. Does your gym have it?
          </span>
          <span className="btnrow">
            <button type="button" className="btn btn--small" onClick={() => onAnswerEquipment(alt.askAbout[0], "available")}>
              Yes, it does
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => onAnswerEquipment(alt.askAbout[0], "unavailable")}>
              No
            </button>
          </span>
        </div>
      )}
    </li>
  );

  return (
    <div className="sheet" role="presentation" onClick={onClose}>
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-title"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <div>
            <h2 id="swap-title">{current ? `Swap ${current.name}` : "Choose an exercise"}</h2>
            <p className="muted small">Same sets and reps. Only exercises your gym can do are shown.</p>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {hasLogged && (
          <p className="note">
            You've already logged sets for {current?.name}. Swapping removes those sets from today.
          </p>
        )}

        <label className="toggle">
          <input type="checkbox" checked={always} onChange={(e) => setAlways(e.target.checked)} />
          <span>
            <strong>Use it every time</strong>
            <span className="muted small block">Off = just for this workout. On = also next time.</span>
          </span>
        </label>

        {isSwapped && (
          <button type="button" className="btn btn--ghost btn--small" onClick={onReset}>
            ↩ Back to the plan's exercise
          </button>
        )}

        <h3 className="sheet__sub">Available now</h3>
        {ready.length === 0 && <p className="muted small">Nothing else fits right now. Try "Show all exercises" below.</p>}
        <ul className="swap__list">{ready.map(row)}</ul>

        {needsEquipment.length > 0 && (
          <>
            <h3 className="sheet__sub">Need equipment confirmed</h3>
            <p className="muted small">Tell the app what your gym has, and these move up to "Available now".</p>
            <ul className="swap__list">{needsEquipment.map(row)}</ul>
          </>
        )}

        {!all && (
          <button type="button" className="linkbtn" onClick={() => setAll(true)}>
            Show all exercises (other muscle groups)
          </button>
        )}
      </div>
    </div>
  );
}
