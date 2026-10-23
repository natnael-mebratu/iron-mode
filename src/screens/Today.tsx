import { useState } from "react";
import { ExerciseCard } from "../components/ExerciseCard";
import { EXERCISES_BY_ID } from "../data/exercises";
import { PLANS_BY_ID, findSession } from "../data/plans";
import { WEEK_ORDER, WEEKDAY_NAMES, dateForWeekday, toISODate } from "../lib/dates";
import { bestSet, formatSet, previousPerformance, sessionVolume, suggest } from "../lib/progression";
import { resolveSlot } from "../lib/resolve";
import type { AppState, ExerciseLog, Readiness, SetEntry, WorkoutLog } from "../lib/storage";
import type { Availability, Weekday } from "../lib/types";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onAnswerEquipment: (id: string, value: Availability) => void;
  onStartRest: (seconds: number, label: string) => void;
}

const ENERGY = ["Low", "OK", "Good"];
const SORENESS = ["None", "A bit", "Very sore"];

export function Today({ state, setState, onAnswerEquipment, onStartRest }: Props) {
  const [day, setDay] = useState<Weekday>(() => new Date().getDay() as Weekday);
  const plan = PLANS_BY_ID.get(state.activePlanId)!;
  const week = state.weeks[plan.id];
  const date = dateForWeekday(day);
  const dateKey = toISODate(date);
  const log: WorkoutLog | undefined = state.logs[dateKey];
  // A logged workout keeps its own session even if the plan or week changes later.
  const session = log ? findSession(log.planId, log.sessionId) : plan.sessions.find((s) => s.id === week[day]);
  const isToday = toISODate(new Date()) === dateKey;
  const isFuture = dateKey > toISODate(new Date());

  const updateLog = (fn: (log: WorkoutLog) => WorkoutLog) =>
    setState((s) => {
      const current = s.logs[dateKey] ?? {
        date: dateKey,
        planId: plan.id,
        sessionId: session!.id,
        entries: {},
      };
      return { ...s, logs: { ...s.logs, [dateKey]: fn(current) } };
    });

  const updateEntry = (slotId: string, exerciseId: string, fn: (e: ExerciseLog) => ExerciseLog) =>
    updateLog((l) => {
      const prev = l.entries[slotId];
      // If the assigned exercise changed (e.g. new equipment), that slot starts fresh.
      const entry = prev && prev.exerciseId === exerciseId ? prev : { exerciseId, sets: [] };
      return { ...l, entries: { ...l.entries, [slotId]: fn(entry) } };
    });

  const startSession = (sessionId: string) =>
    setState((s) => ({
      ...s,
      logs: { ...s.logs, [dateKey]: { date: dateKey, planId: plan.id, sessionId, entries: {} } },
    }));

  const clearDay = () => {
    if (!log) return;
    const hasSets = Object.values(log.entries).some((e) => e.sets.some((x) => x.done));
    if (hasSets && !confirm("Remove this day's logged sets? This can't be undone.")) return;
    setState((s) => {
      const logs = { ...s.logs };
      delete logs[dateKey];
      return { ...s, logs };
    });
  };

  const resolved =
    session?.slots.map((slot) => {
      const resolution = resolveSlot(slot, state.equipment, { elbowFriendly: state.settings.elbowFriendly });
      const ex = resolution.kind === "assigned" ? resolution.exercise : null;
      const entry = ex && log?.entries[slot.id]?.exerciseId === ex.id ? log.entries[slot.id] : undefined;
      const prev = ex ? previousPerformance(state.logs, ex.id, dateKey) : null;
      return { slot, resolution, entry, prev, suggestion: ex ? suggest(ex, slot, prev) : null };
    }) ?? [];

  const required = resolved.filter((r) => r.resolution.kind === "assigned" && !r.slot.optional);
  const totalSets = required.reduce((n, r) => n + r.slot.sets, 0);
  const doneSets = resolved.reduce((n, r) => n + (r.entry?.sets.filter((s) => s.done).length ?? 0), 0);
  const started = doneSets > 0;
  const fastingDay = day === 3 || day === 5;

  return (
    <section>
      <div className="day-chips" role="tablist" aria-label="Day of the week">
        {WEEK_ORDER.map((d) => {
          const k = toISODate(dateForWeekday(d));
          const logged = state.logs[k] && Object.values(state.logs[k].entries).some((e) => e.sets.some((s) => s.done));
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === day}
              className={`chip${d === day ? " chip--active" : ""}${week[d] ? "" : " chip--rest"}`}
              onClick={() => setDay(d)}
            >
              {WEEKDAY_NAMES[d].slice(0, 3)}
              {logged && <span className="chip__dot" aria-label="logged" />}
            </button>
          );
        })}
      </div>

      <header className="session-head">
        <p className="muted small">
          {isToday ? "Today · " : ""}
          {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
        </p>
        <h2>{session ? session.name : "Rest day"}</h2>
        {session && <p className="muted">{session.focus}</p>}
      </header>

      {!state.settings.safetyNoteDismissed && (
        <aside className="safety">
          <p>
            <strong>Stop any exercise</strong> that causes an electric-shock feeling, tingling, numbness or pain,
            especially around the left elbow. If it keeps coming back, get it checked by a doctor or physio. Get help
            promptly for numbness that won't go away, weakness, trouble moving your fingers, major swelling or severe
            pain.
          </p>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, safetyNoteDismissed: true } }))}
          >
            Got it
          </button>
        </aside>
      )}

      {!session && (
        <div className="empty">
          <p>Nothing planned. Rest and recovery are part of the program.</p>
          {!isFuture && (
            <label className="field">
              <span className="muted small">Training today anyway? Pick a session (your weekly plan stays the same):</span>
              <select value="" onChange={(e) => e.target.value && startSession(e.target.value)}>
                <option value="">Choose a session…</option>
                {plan.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {session && fastingDay && (
        <p className="note">
          Fasting day: if your energy is low, doing just the non-optional exercises, or one set fewer each, is a good
          session.
        </p>
      )}

      {session && !started && !log?.readiness && !isFuture && (
        <ReadinessCheck onSave={(r) => updateLog((l) => ({ ...l, readiness: r }))} />
      )}
      {log?.readiness && (log.readiness.energy === 1 || log.readiness.soreness === 3) && !log.finishedAt && (
        <p className="note">
          {log.readiness.soreness === 3
            ? "Very sore muscles: go lighter on them today or skip them. Soreness isn't a sign of a better workout."
            : "Low energy: skip the optional exercises and stop each set a couple of reps earlier."}{" "}
          There's no need to make up for it next time.
        </p>
      )}

      {session && totalSets > 0 && (
        <div className="progress" aria-label={`${Math.min(doneSets, totalSets)} of ${totalSets} main sets done`}>
          <div className="progress__bar" style={{ width: `${Math.min(1, doneSets / totalSets) * 100}%` }} />
          <span className="progress__label">
            {doneSets} / {totalSets} sets
          </span>
        </div>
      )}

      {log?.finishedAt && <Summary state={state} log={log} />}

      <div className="cards">
        {resolved.map(({ slot, resolution, entry, prev, suggestion }) => (
          <ExerciseCard
            key={slot.id}
            slot={slot}
            resolution={resolution}
            entry={entry}
            prev={prev}
            suggestion={suggestion}
            showDemo={state.settings.showDemoPhotos}
            onSetChange={(i, set: SetEntry) =>
              resolution.kind === "assigned" &&
              updateEntry(slot.id, resolution.exercise.id, (e) => {
                const sets = [...e.sets];
                while (sets.length < Math.max(slot.sets, i + 1)) sets.push({ weight: null, reps: null, done: false });
                sets[i] = set;
                return { ...e, sets };
              })
            }
            onSetDone={() => resolution.kind === "assigned" && onStartRest(slot.restSec, resolution.exercise.name)}
            onSymptom={(flag) =>
              resolution.kind === "assigned" && updateEntry(slot.id, resolution.exercise.id, (e) => ({ ...e, symptom: flag }))
            }
            onAnswerEquipment={onAnswerEquipment}
          />
        ))}
      </div>

      {session && (
        <div className="finish">
          {started && !log?.finishedAt && (
            <button
              type="button"
              className="btn btn--block"
              onClick={() => updateLog((l) => ({ ...l, finishedAt: new Date().toISOString() }))}
            >
              Finish workout
            </button>
          )}
          {log && (
            <button type="button" className="linkbtn" onClick={clearDay}>
              {started ? "Clear this day's log" : "Reset this day"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ReadinessCheck({ onSave }: { onSave: (r: Readiness) => void }) {
  const [energy, setEnergy] = useState<1 | 2 | 3 | null>(null);
  const [soreness, setSoreness] = useState<1 | 2 | 3 | null>(null);
  const pick = (e: typeof energy, s: typeof soreness) => {
    setEnergy(e);
    setSoreness(s);
    if (e && s) onSave({ energy: e, soreness: s });
  };
  return (
    <aside className="readiness">
      <p className="readiness__title">Quick check-in (optional)</p>
      <div className="readiness__row">
        <span>Energy</span>
        <div className="pills">
          {ENERGY.map((label, i) => (
            <button key={label} type="button" aria-pressed={energy === i + 1} onClick={() => pick((i + 1) as 1 | 2 | 3, soreness)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="readiness__row">
        <span>Soreness</span>
        <div className="pills">
          {SORENESS.map((label, i) => (
            <button key={label} type="button" aria-pressed={soreness === i + 1} onClick={() => pick(energy, (i + 1) as 1 | 2 | 3)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Summary({ state, log }: { state: AppState; log: WorkoutLog }) {
  const { sets, volume } = sessionVolume(log);
  const bests: string[] = [];
  for (const entry of Object.values(log.entries)) {
    const ex = EXERCISES_BY_ID.get(entry.exerciseId);
    const best = bestSet(entry.sets);
    if (!ex || !best?.weight) continue;
    const earlier = Object.values(state.logs)
      .filter((l) => l.date < log.date)
      .flatMap((l) => Object.values(l.entries))
      .filter((e) => e.exerciseId === entry.exerciseId)
      .map((e) => bestSet(e.sets)?.weight ?? 0);
    if (earlier.length && best.weight > Math.max(...earlier)) bests.push(`${ex.name}: ${formatSet(best, ex)}`);
  }
  return (
    <aside className="summary">
      <p className="summary__title">Workout logged ✓</p>
      <p>
        {sets} sets{volume > 0 ? ` · ${Math.round(volume).toLocaleString()} kg moved` : ""}
      </p>
      {bests.length > 0 && (
        <>
          <p className="details__label">New best weights</p>
          <ul>
            {bests.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
