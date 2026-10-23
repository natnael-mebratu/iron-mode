import { PLANS, PLANS_BY_ID } from "../data/plans";
import { WEEK_ORDER, WEEKDAY_NAMES } from "../lib/dates";
import type { AppState } from "../lib/storage";
import type { Weekday } from "../lib/types";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function Plan({ state, setState }: Props) {
  const plan = PLANS_BY_ID.get(state.activePlanId)!;
  const week = state.weeks[plan.id];
  const sessionName = (id: string | null) => plan.sessions.find((s) => s.id === id)?.name ?? "Rest";

  /** Swap two days, so moving a session never deletes another one. */
  const moveDay = (from: Weekday, to: Weekday) => {
    if (from === to) return;
    setState((s) => {
      const w = { ...s.weeks[plan.id] };
      [w[from], w[to]] = [w[to], w[from]];
      return { ...s, weeks: { ...s.weeks, [plan.id]: w } };
    });
  };

  const resetWeek = () =>
    setState((s) => ({ ...s, weeks: { ...s.weeks, [plan.id]: { ...plan.defaultWeek } } }));

  return (
    <section>
      <h2>Weekly plan</h2>

      <div className="plan-picker" role="radiogroup" aria-label="Training plan">
        {PLANS.map((p) => (
          <label key={p.id} className={`plan-option${p.id === plan.id ? " plan-option--active" : ""}`}>
            <input
              type="radio"
              name="plan"
              checked={p.id === plan.id}
              onChange={() => setState((s) => ({ ...s, activePlanId: p.id }))}
            />
            <span>
              <strong>{p.name}</strong>
              <span className="muted small block">{p.description}</span>
            </span>
          </label>
        ))}
      </div>

      <ul className="week">
        {WEEK_ORDER.map((d) => (
          <li key={d} className={week[d] ? "" : "week--rest"}>
            <div>
              <span className="week__day">{WEEKDAY_NAMES[d]}</span>
              <span className="week__session">{sessionName(week[d])}</span>
            </div>
            <label className="move">
              <span className="sr-only">Move {WEEKDAY_NAMES[d]} to</span>
              <select value="" onChange={(e) => moveDay(d, Number(e.target.value) as Weekday)}>
                <option value="" disabled>
                  Swap with…
                </option>
                {WEEK_ORDER.filter((o) => o !== d).map((o) => (
                  <option key={o} value={o}>
                    {WEEKDAY_NAMES[o]} ({sessionName(week[o])})
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--ghost btn--small" onClick={resetWeek}>
        Reset days to default
      </button>

      <details className="explain">
        <summary>What is Push / Pull / Legs (PPL)?</summary>
        <p>
          PPL is a way of grouping muscles: <strong>Push</strong> = chest, shoulders, triceps.{" "}
          <strong>Pull</strong> = back, biceps, forearms. <strong>Legs</strong> = quads, hamstrings, glutes, calves
          (abs optional).
        </p>
        <p>
          It is a way to <em>organise</em> training, not automatically a harder workout. Three PPL days a week with
          rest in between is a sensible beginner option. Six hard days a week is not recommended to start.
        </p>
        <p>
          <strong>Progressive overload</strong> means slowly asking a bit more of the muscle over time. Change one
          thing at a time (reps, then weight, then sets), and only when the current target feels solid with good
          form and no symptoms. Don't make up a missed session by piling extra sets onto the next one.
        </p>
      </details>
    </section>
  );
}
