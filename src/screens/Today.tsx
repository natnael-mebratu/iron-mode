import { useState } from "react";
import { ExerciseCard } from "../components/ExerciseCard";
import { PLANS_BY_ID } from "../data/plans";
import { WEEK_ORDER, WEEKDAY_NAMES, dateForWeekday, toISODate } from "../lib/dates";
import { resolveSlot } from "../lib/resolve";
import type { AppState } from "../lib/storage";
import type { Availability, Weekday } from "../lib/types";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onAnswerEquipment: (id: string, value: Availability) => void;
}

export function Today({ state, setState, onAnswerEquipment }: Props) {
  const [day, setDay] = useState<Weekday>(() => new Date().getDay() as Weekday);
  const plan = PLANS_BY_ID.get(state.activePlanId)!;
  const week = state.weeks[plan.id];
  const session = plan.sessions.find((s) => s.id === week[day]) ?? null;
  const date = dateForWeekday(day);
  const dateKey = toISODate(date);
  const dayProgress = state.progress[dateKey] ?? {};
  const isToday = toISODate(new Date()) === dateKey;

  const resolved = session ? session.slots.map((slot) => ({ slot, resolution: resolveSlot(slot, state.equipment) })) : [];
  let totalSets = 0;
  let doneSets = 0;
  const setsFor = (slotId: string, exerciseId: string) => {
    const p = dayProgress[slotId];
    // If the assigned exercise changed (e.g. new equipment), start that slot fresh.
    return p && p.exerciseId === exerciseId ? p.sets : [];
  };
  for (const { slot, resolution } of resolved) {
    if (resolution.kind !== "assigned") continue;
    totalSets += slot.sets;
    doneSets += setsFor(slot.id, resolution.exercise.id).filter(Boolean).length;
  }

  const toggleSet = (slotId: string, exerciseId: string, count: number, index: number) => {
    setState((s) => {
      const day = { ...(s.progress[dateKey] ?? {}) };
      const prev = day[slotId]?.exerciseId === exerciseId ? day[slotId].sets : [];
      const sets = Array.from({ length: count }, (_, i) => !!prev[i]);
      sets[index] = !sets[index];
      day[slotId] = { exerciseId, sets };
      return { ...s, progress: { ...s.progress, [dateKey]: day } };
    });
  };

  return (
    <section>
      <div className="day-chips" role="tablist" aria-label="Day of the week">
        {WEEK_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            className={`chip${d === day ? " chip--active" : ""}${week[d] ? "" : " chip--rest"}`}
            onClick={() => setDay(d)}
          >
            {WEEKDAY_NAMES[d].slice(0, 3)}
          </button>
        ))}
      </div>

      <header className="session-head">
        <p className="muted small">
          {isToday ? "Today · " : ""}
          {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
        </p>
        <h2>{session ? session.name : "Rest day"}</h2>
        {session && <p className="muted">{session.focus}</p>}
      </header>

      {!state.safetyNoteDismissed && (
        <aside className="safety">
          <p>
            <strong>Stop any exercise</strong> that causes an electric-shock feeling, tingling, numbness or pain,
            especially around the left elbow. If it keeps coming back, get it checked by a doctor or physio. Get
            help promptly for numbness that won't go away, weakness, trouble moving your fingers, major swelling or
            severe pain.
          </p>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setState((s) => ({ ...s, safetyNoteDismissed: true }))}>
            Got it
          </button>
        </aside>
      )}

      {!session && (
        <div className="empty">
          <p>Nothing planned. Rest and recovery are part of the program.</p>
          <p className="muted small">To train today, move a session here from the Plan tab.</p>
        </div>
      )}

      {session && totalSets > 0 && (
        <div className="progress" aria-label={`${doneSets} of ${totalSets} sets done`}>
          <div className="progress__bar" style={{ width: `${(doneSets / totalSets) * 100}%` }} />
          <span className="progress__label">
            {doneSets} / {totalSets} sets
          </span>
        </div>
      )}

      <div className="cards">
        {resolved.map(({ slot, resolution }) => (
          <ExerciseCard
            key={slot.id}
            slot={slot}
            resolution={resolution}
            sets={resolution.kind === "assigned" ? setsFor(slot.id, resolution.exercise.id) : []}
            onToggleSet={(i) =>
              resolution.kind === "assigned" && toggleSet(slot.id, resolution.exercise.id, slot.sets, i)
            }
            onAnswerEquipment={onAnswerEquipment}
          />
        ))}
      </div>
    </section>
  );
}
