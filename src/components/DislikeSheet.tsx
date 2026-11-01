import { useState } from "react";
import { equipmentName } from "../data/equipment";
import { DISLIKE_REASONS, rankAlternatives, type DislikeReason, type Ranked } from "../lib/rank";
import { alternativesFor, type Inventory } from "../lib/resolve";
import type { Availability, Exercise, Slot } from "../lib/types";
import { Sheet } from "./Sheet";

interface Props {
  slot: Slot;
  exercise: Exercise;
  inventory: Inventory;
  elbowFriendly: boolean;
  usedIds: Set<string>;
  ratings: Record<string, number>;
  avoided: ReadonlySet<string>;
  /** Sets are logged for this exercise today, so it stays for today. */
  hasLogged: boolean;
  /** Replace it with this exercise (or null to just hide it) and never suggest it again. */
  onConfirm: (replacementId: string | null, reason: DislikeReason | null) => void;
  onAnswerEquipment: (id: string, value: Availability) => void;
  onClose: () => void;
}

const FIRST = 6;

/** "Not for me": hide an exercise for good and pick the best stand-in. */
export function DislikeSheet(props: Props) {
  const { slot, exercise, inventory, elbowFriendly, usedIds, ratings, avoided, hasLogged, onConfirm, onAnswerEquipment, onClose } = props;
  const [reason, setReason] = useState<DislikeReason | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  const alts = alternativesFor(slot, exercise, inventory, { elbowFriendly, exclude: usedIds, avoided, all: true });
  const rank = (list: typeof alts.ready) => rankAlternatives(list, { current: exercise, ratings, reason: reason ?? undefined });
  const everything = rank(alts.ready);
  // Replacements should train the same muscles. Anything else is tucked away.
  const ready = everything.filter((r) => r.related);
  const others = everything.filter((r) => !r.related);
  // Equipment questions only for the best few; a long list of "does your gym have…" is noise.
  const needs = rank(alts.needsEquipment).filter((r) => r.related).slice(0, 4);
  const shown = showAll ? ready : ready.slice(0, FIRST);

  const row = (r: Ranked, locked: boolean) => (
    <li key={r.exercise.id} className="swap__item">
      {!locked ? (
        <button type="button" className="swap__pick" onClick={() => onConfirm(r.exercise.id, reason)}>
          <strong>{r.exercise.name}</strong>
          <span className="muted small block">{r.exercise.targetMuscles.join(" · ")}</span>
          {r.because.length > 0 && (
            <span className="badges">
              {r.because.map((b) => (
                <span key={b} className="badge badge--good">
                  {b}
                </span>
              ))}
            </span>
          )}
        </button>
      ) : (
        <div className="swap__pick swap__pick--locked">
          <strong>{r.exercise.name}</strong>
          <span className="muted small block">{r.exercise.targetMuscles.join(" · ")}</span>
          <span className="block small">
            Needs: <strong>{equipmentName(r.askAbout[0])}</strong>. Does your gym have it?
          </span>
          <span className="btnrow">
            <button type="button" className="btn btn--small" onClick={() => onAnswerEquipment(r.askAbout[0], "available")}>
              Yes, it does
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => onAnswerEquipment(r.askAbout[0], "unavailable")}>
              No
            </button>
          </span>
        </div>
      )}
    </li>
  );

  return (
    <Sheet title={`Not for me: ${exercise.name}`} subtitle="It won't be suggested again. Pick what to do instead." onClose={onClose}>
      <p className="details__label">Why? (optional, helps pick better ones)</p>
      <div className="pills pills--wide pills--2" aria-label="Reason">
        {DISLIKE_REASONS.map((r) => (
          <button key={r.id} type="button" aria-pressed={reason === r.id} onClick={() => setReason(reason === r.id ? null : r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      {reason === "hurts" && (
        <p className="safety-inline">
          If it hurts rather than just feels hard, stop it. If the pain keeps coming back, get it checked by a doctor or physio.
        </p>
      )}
      {hasLogged && <p className="note">You've logged sets on this today, so it stays for today. The change starts next workout.</p>}

      <h3 className="sheet__sub">Best matches</h3>
      {ready.length === 0 && <p className="muted small">Nothing else for the same muscles fits your gym right now.</p>}
      <ul className="swap__list">{shown.map((r) => row(r, false))}</ul>
      {ready.length > FIRST && !showAll && (
        <button type="button" className="linkbtn" onClick={() => setShowAll(true)}>
          Show {ready.length - FIRST} more
        </button>
      )}

      {others.length > 0 && !showOthers && (
        <button type="button" className="linkbtn" onClick={() => setShowOthers(true)}>
          Show exercises for other muscles
        </button>
      )}
      {showOthers && (
        <>
          <h3 className="sheet__sub">Other muscles</h3>
          <ul className="swap__list">{others.map((r) => row(r, false))}</ul>
        </>
      )}

      {needs.length > 0 && (
        <>
          <h3 className="sheet__sub">Could work, if your gym has…</h3>
          <ul className="swap__list">{needs.map((r) => row(r, true))}</ul>
        </>
      )}

      <div className="btnrow sheet__foot">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => onConfirm(null, reason)}>
          Just hide it, no replacement
        </button>
        <button type="button" className="linkbtn" onClick={onClose}>
          Keep it
        </button>
      </div>
    </Sheet>
  );
}
