import { EQUIPMENT } from "../data/equipment";
import { defaultEquipment, type AppState } from "../lib/storage";
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

export function Gym({ state, setState }: Props) {
  const set = (id: string, value: Availability) =>
    setState((s) => ({ ...s, equipment: { ...s.equipment, [id]: value } }));

  return (
    <section>
      <h2>My gym</h2>
      <p className="muted">
        Workouts only use equipment marked <strong>Have it</strong>. "Not sure" is treated as not available.
      </p>

      <ul className="equipment">
        {EQUIPMENT.map((e) => (
          <li key={e.id}>
            <div className="equipment__name">
              {e.name}
              {e.notes && <span className="muted small block">{e.notes}</span>}
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
          if (confirm("Reset equipment to the original confirmed list?")) {
            setState((s) => ({ ...s, equipment: defaultEquipment() }));
          }
        }}
      >
        Reset to confirmed list
      </button>
    </section>
  );
}
