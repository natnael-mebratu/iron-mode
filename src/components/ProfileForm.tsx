import { useState } from "react";
import { PRESETS } from "../data/presets";
import { newProfileState, type NewProfileOptions } from "../lib/newProfile";
import { cleanName, type AppState } from "../lib/storage";

interface Props {
  /** Other profiles on this phone whose gym can be copied. */
  others: { id: string; name: string; state: AppState }[];
  submitLabel: string;
  /** Pre-selected gym preset. */
  defaultGym?: string;
  onSubmit: (name: string, state: AppState) => void;
  onCancel?: () => void;
}

export function ProfileForm({ others, submitLabel, defaultGym = "commercial", onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [gym, setGym] = useState(defaultGym);
  const [elbowFriendly, setElbow] = useState(false);
  const [fastingDays, setFasting] = useState(false);

  const options: NewProfileOptions = { gym, elbowFriendly, fastingDays };
  const valid = cleanName(name).length > 0;

  return (
    <form
      className="profileform"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(cleanName(name), newProfileState(options, others));
      }}
    >
      <label className="field">
        <span>
          <strong>Your name</strong>
        </span>
        <input
          className="textinput"
          type="text"
          autoComplete="given-name"
          maxLength={30}
          placeholder="e.g. Sam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <fieldset className="choices">
        <legend>
          <strong>What does your gym have?</strong>
          <span className="muted small block">A starting point. You can change every item later in My gym.</span>
        </legend>
        {others.map((o) => (
          <label key={o.id} className={`choice${gym === `copy:${o.id}` ? " choice--on" : ""}`}>
            <input type="radio" name="gym" checked={gym === `copy:${o.id}`} onChange={() => setGym(`copy:${o.id}`)} />
            <span>
              <strong>Same gym as {o.name}</strong>
              <span className="muted small block">Copies {o.name}'s equipment list (not their workouts).</span>
            </span>
          </label>
        ))}
        {PRESETS.map((p) => (
          <label key={p.id} className={`choice${gym === p.id ? " choice--on" : ""}`}>
            <input type="radio" name="gym" checked={gym === p.id} onChange={() => setGym(p.id)} />
            <span>
              <strong>{p.name}</strong>
              <span className="muted small block">{p.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choices">
        <legend>
          <strong>Anything to take into account?</strong> <span className="muted small">(optional)</span>
        </legend>
        <label className="choice">
          <input type="checkbox" checked={elbowFriendly} onChange={(e) => setElbow(e.target.checked)} />
          <span>
            <strong>Go easy on my elbows</strong>
            <span className="muted small block">
              Leaves out exercises that bend the elbow deeply under load (e.g. overhead triceps extensions).
            </span>
          </span>
        </label>
        <label className="choice">
          <input type="checkbox" checked={fastingDays} onChange={(e) => setFasting(e.target.checked)} />
          <span>
            <strong>Fasting days (Wednesday and Friday)</strong>
            <span className="muted small block">Adds a reminder that a lighter session is fine on those days.</span>
          </span>
        </label>
      </fieldset>

      <div className="btnrow">
        <button type="submit" className="btn btn--block" disabled={!valid}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="linkbtn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
