import { EQUIPMENT } from "../data/equipment";
import { defaultEquipment, type AppState, type Settings } from "../lib/storage";
import type { Availability } from "../lib/types";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const OPTIONS: { value: Availability; label: string }[] = [
  { value: "available", label: "Have it" },
  { value: "unknown", label: "Not sure" },
  { value: "unavailable", label: "Don't have" },
];

const base = import.meta.env.BASE_URL;

export function Gym({ state, setState }: Props) {
  const set = (id: string, value: Availability) =>
    setState((s) => ({ ...s, equipment: { ...s.equipment, [id]: value } }));
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setState((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));

  return (
    <section>
      <h2>My gym</h2>
      <p className="muted">
        Workouts only use equipment marked <strong>Have it</strong>. "Not sure" is treated as not available. Changes
        rebuild your workouts straight away; if a better exercise becomes possible, you'll see it on the Workout tab.
      </p>

      <ul className="equipment">
        {EQUIPMENT.map((e) => (
          <li key={e.id}>
            <div className="equipment__top">
              {e.photos?.[0] && <img className="equipment__photo" src={base + e.photos[0]} alt={`${e.name}${state.settings.ownGymPhotos ? " at your gym" : " (example photo)"}`} loading="lazy" />}
              <div className="equipment__name">
                {e.name}
                {e.notes && <span className="muted small block">{e.notes}</span>}
              </div>
            </div>
            <div className="segmented" role="radiogroup" aria-label={e.name}>
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={state.equipment[e.id] === o.value}
                  className={`segmented__opt segmented__opt--${o.value}`}
                  onClick={() => set(e.id, o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn btn--ghost btn--small"
        onClick={() => {
          if (confirm("Reset equipment to the original list?")) setState((s) => ({ ...s, equipment: defaultEquipment() }));
        }}
      >
        Reset equipment list
      </button>

      <h2 className="spaced">Settings</h2>
      <ul className="settings">
        <li>
          <label className="toggle">
            <input type="checkbox" checked={state.settings.elbowFriendly} onChange={(e) => setSetting("elbowFriendly", e.target.checked)} />
            <span>
              <strong>Elbow-friendly mode</strong>
              <span className="muted small block">
                Leaves out exercises that bend the elbow deeply under load (e.g. overhead triceps extensions), which can
                irritate the nerve behind the elbow.
              </span>
            </span>
          </label>
        </li>
        <li>
          <label className="toggle">
            <input type="checkbox" checked={state.settings.showDemoPhotos} onChange={(e) => setSetting("showDemoPhotos", e.target.checked)} />
            <span>
              <strong>Show demo photos (online)</strong>
              <span className="muted small block">
                Start/finish photos from the free Free Exercise DB project, loaded from GitHub when you open an
                exercise. The project marks them public domain, but many appear to come from an older commercial
                site, so they aren't stored in this app. Photos you've viewed stay available offline.
              </span>
            </span>
          </label>
        </li>
        <li>
          <label className="toggle">
            <input type="checkbox" checked={state.settings.timerSound} onChange={(e) => setSetting("timerSound", e.target.checked)} />
            <span>
              <strong>Rest timer sound</strong>
              <span className="muted small block">The phone also vibrates where supported.</span>
            </span>
          </label>
        </li>
        {state.settings.safetyNoteDismissed && (
          <li>
            <button type="button" className="linkbtn" onClick={() => setSetting("safetyNoteDismissed", false)}>
              Show the safety note again
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
