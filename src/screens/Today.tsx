import { useEffect, useMemo, useRef, useState } from "react";
import { ExerciseCard } from "../components/ExerciseCard";
import { AddExerciseSheet } from "../components/AddExerciseSheet";
import { DislikeSheet } from "../components/DislikeSheet";
import { HistorySheet } from "../components/HistorySheet";
import { NotesSheet } from "../components/NotesSheet";
import { PlateSheet } from "../components/PlateSheet";
import { SwapSheet } from "../components/SwapSheet";
import { EXERCISES_BY_ID } from "../data/exercises";
import { PLANS_BY_ID, findSession } from "../data/plans";
import { WEEK_ORDER, WEEKDAY_NAMES, dateForWeekday, toISODate } from "../lib/dates";
import { exportJSON } from "../lib/backup";
import { daySlots, moveInOrder } from "../lib/day";
import { defaultBase, takesPlates } from "../lib/plates";
import { bestSet, exerciseHistory, formatSet, personalBest, previousPerformance, sessionVolume, suggest } from "../lib/progression";
import { backupDue, weekSummary } from "../lib/summary";
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

  const isLogged = (e: ExerciseLog | undefined) =>
    !!e && e.sets.some((x) => x.done || x.weight != null || x.reps != null);

  const avoided = useMemo(() => new Set(state.avoided), [state.avoided]);
  const noteOf = (id: string) => state.exerciseNotes[id]?.note;

  const resolved = (session ? daySlots(session, log) : []).map(({ slot, extra, skipped }) => {
    const logged = log?.entries[slot.id];
    const resolution = resolveSlot(slot, state.equipment, {
      elbowFriendly: state.settings.elbowFriendly,
      avoided,
      choice: extra ? null : (log?.swaps?.[slot.id] ?? state.swaps[slot.id] ?? null),
      pinned: isLogged(logged) ? logged!.exerciseId : null,
    });
    const ex = resolution.kind === "assigned" ? resolution.exercise : null;
    const entry = ex && logged?.exerciseId === ex.id ? logged : undefined;
    const prev = ex ? previousPerformance(state.logs, ex.id, dateKey) : null;
    return { slot, extra, skipped, resolution, entry, prev, suggestion: ex ? suggest(ex, slot, prev) : null };
  });
  type Row = (typeof resolved)[number];
  const assignedId = (r: Row) => (r.resolution.kind === "assigned" ? r.resolution.exercise.id : null);

  const userAction = useRef(false);

  // ── Swapping ────────────────────────────────────────────────────────
  const [sheet, setSheet] = useState<{ kind: "swap" | "dislike" | "history" | "plates" | "notes"; slotId: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const target = sheet ? (resolved.find((r) => r.slot.id === sheet.slotId) ?? null) : null;
  const targetEx = target?.resolution.kind === "assigned" ? target.resolution.exercise : null;
  const usedIds = new Set(resolved.filter((r) => r.slot.id !== sheet?.slotId).map(assignedId).filter((x): x is string => !!x));
  const closeSheet = () => setSheet(null);

  const applySwap = (row: Row, exerciseId: string | null, always: boolean) => {
    userAction.current = true;
    const slotId = row.slot.id;
    const current = log?.entries[slotId];
    const discard = isLogged(current) && current!.exerciseId !== exerciseId;
    if (discard && current!.sets.some((x) => x.done) && !confirm("This removes the sets you logged for this exercise today. Swap anyway?")) {
      userAction.current = false;
      return;
    }
    setState((st) => {
      const day = st.logs[dateKey] ?? { date: dateKey, planId: plan.id, sessionId: session!.id, entries: {} };
      const entries = { ...day.entries };
      if (discard) delete entries[slotId];
      if (row.extra) {
        // An added exercise is replaced in place; there is no plan slot to remember a swap for.
        const extras = (day.extras ?? []).map((e) => (e.id === slotId && exerciseId ? { ...e, exerciseId } : e));
        return { ...st, logs: { ...st.logs, [dateKey]: { ...day, entries, extras } } };
      }
      const todays = { ...(day.swaps ?? {}) };
      const saved = { ...st.swaps };
      delete todays[slotId];
      if (exerciseId === null) {
        delete saved[slotId];
      } else if (always) {
        saved[slotId] = exerciseId;
      } else {
        todays[slotId] = exerciseId;
      }
      const next = { ...day, entries, ...(Object.keys(todays).length ? { swaps: todays } : { swaps: undefined }) };
      return { ...st, swaps: saved, logs: { ...st.logs, [dateKey]: next } };
    });
    closeSheet();
  };

  // ── Not for me ──────────────────────────────────────────────────────
  const confirmDislike = (row: Row, replacementId: string | null) => {
    userAction.current = true;
    const slotId = row.slot.id;
    const exerciseId = row.resolution.kind === "assigned" ? row.resolution.exercise.id : null;
    const keepToday = isLogged(log?.entries[slotId]);
    setState((st) => {
      const next = { ...st, avoided: exerciseId ? [...new Set([...st.avoided, exerciseId])] : st.avoided };
      const day = st.logs[dateKey];
      if (row.extra) {
        if (keepToday || !day) return next;
        const extras = replacementId
          ? (day.extras ?? []).map((e) => (e.id === slotId ? { ...e, exerciseId: replacementId } : e))
          : (day.extras ?? []).filter((e) => e.id !== slotId);
        return { ...next, logs: { ...st.logs, [dateKey]: { ...day, extras } } };
      }
      const saved = { ...st.swaps };
      if (replacementId) saved[slotId] = replacementId;
      else delete saved[slotId];
      next.swaps = saved;
      if (!keepToday && day?.swaps?.[slotId]) {
        const todays = { ...day.swaps };
        delete todays[slotId];
        next.logs = { ...st.logs, [dateKey]: { ...day, swaps: Object.keys(todays).length ? todays : undefined } };
      }
      return next;
    });
    closeSheet();
  };

  // ── Ratings, notes, plates ──────────────────────────────────────────
  const rate = (exerciseId: string, stars: number) =>
    setState((s) => {
      const ratings = { ...s.ratings };
      if (stars) ratings[exerciseId] = stars;
      else delete ratings[exerciseId];
      return { ...s, ratings };
    });

  const patchNote = (exerciseId: string, patch: { note?: string; base?: number }) =>
    setState((s) => {
      const merged = { ...(s.exerciseNotes[exerciseId] ?? {}), ...patch };
      if (!merged.note) delete merged.note;
      const notes = { ...s.exerciseNotes };
      if (merged.note === undefined && merged.base === undefined) delete notes[exerciseId];
      else notes[exerciseId] = merged;
      return { ...s, exerciseNotes: notes };
    });

  /** Fill weights into sets that aren't done yet and have no weight typed. */
  const fillWeights = (row: Row, weights: number[], overwrite = false) => {
    if (row.resolution.kind !== "assigned") return;
    updateEntry(row.slot.id, row.resolution.exercise.id, (e) => {
      const count = Math.max(row.slot.sets, e.sets.length, weights.length);
      const sets = Array.from({ length: count }, (_, i) => e.sets[i] ?? { weight: null, reps: null, done: false });
      return {
        ...e,
        sets: sets.map((s, i) => (s.done || (!overwrite && s.weight != null) || i >= row.slot.sets ? s : { ...s, weight: weights[Math.min(i, weights.length - 1)] })),
      };
    });
  };

  // ── Editing today's workout ─────────────────────────────────────────
  const skip = (slotId: string, on: boolean) =>
    updateLog((l) => ({ ...l, skipped: on ? [...new Set([...(l.skipped ?? []), slotId])] : (l.skipped ?? []).filter((x) => x !== slotId) }));

  const move = (slotId: string, dir: -1 | 1) =>
    updateLog((l) => ({ ...l, order: moveInOrder(resolved.map((r) => r.slot.id), slotId, dir) }));

  const addExtra = (exerciseId: string) => {
    const ex = EXERCISES_BY_ID.get(exerciseId);
    if (!ex) return;
    const reps = ex.load === "time" ? "30" : ex.load === "bodyweight" ? "10–15" : "8–12";
    updateLog((l) => ({
      ...l,
      extras: [...(l.extras ?? []), { id: `x${Date.now().toString(36)}`, exerciseId, sets: 3, reps, restSec: 90 }],
    }));
    setAdding(false);
  };

  const removeExtra = (row: Row) => {
    if (isLogged(log?.entries[row.slot.id]) && !confirm("Remove this exercise and the sets you logged for it today?")) return;
    userAction.current = true;
    const id = row.slot.id;
    updateLog((l) => {
      const entries = { ...l.entries };
      delete entries[id];
      return {
        ...l,
        entries,
        extras: (l.extras ?? []).filter((e) => e.id !== id),
        order: l.order?.filter((x) => x !== id),
        skipped: l.skipped?.filter((x) => x !== id),
      };
    });
  };

  // ── Backup reminder and weekly line ─────────────────────────────────
  const setSetting = (patch: Partial<AppState["settings"]>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const wk = weekSummary(state);
  const reminder = backupDue(state);
  const snoozeBackup = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setSetting({ backupSnoozedUntil: toISODate(d) });
  };

  // ── "Workout updated" notice ────────────────────────────────────────
  // The workout rebuilds itself whenever equipment changes. Say what changed,
  // so it never shifts under the user's thumb without explanation.
  const signature = resolved.map((r) => `${r.slot.id}:${assignedId(r) ?? "-"}`).join("|");
  const sessionKey = `${dateKey}/${session?.id ?? ""}`;
  const lastSeen = useRef<{ key: string; map: Record<string, string> } | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const r of resolved) map[r.slot.id] = r.resolution.kind === "assigned" ? r.resolution.exercise.name : "";
    const before = lastSeen.current;
    if (before && before.key === sessionKey && !userAction.current) {
      const diff = Object.keys(map)
        .filter((id) => before.map[id] !== undefined && before.map[id] !== map[id])
        .map((id) => `${before.map[id] || "Nothing"} → ${map[id] || "nothing"}`);
      if (diff.length) setChanges(diff);
    } else if (!before || before.key !== sessionKey) {
      setChanges([]);
    }
    userAction.current = false;
    lastSeen.current = { key: sessionKey, map };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, sessionKey]);

  const live = resolved.filter((r) => !r.skipped);
  const required = live.filter((r) => r.resolution.kind === "assigned" && !r.slot.optional);
  const totalSets = required.reduce((n, r) => n + r.slot.sets, 0);
  const doneSets = live.reduce((n, r) => n + (r.entry?.sets.filter((s) => s.done).length ?? 0), 0);
  const started = doneSets > 0;
  const upNextId = live.find(
    (r) => r.resolution.kind === "assigned" && !r.slot.optional && (r.entry?.sets.filter((s) => s.done).length ?? 0) < r.slot.sets,
  )?.slot.id;
  const fastingDay = state.settings.fastingDays && (day === 3 || day === 5);

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
              <span className="chip__day">{WEEKDAY_NAMES[d].slice(0, 3)}</span>
              <span className="chip__label">{shortName(plan.sessions.find((s) => s.id === week[d])?.name)}</span>
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
        {wk.planned > 0 && (
          <p className="muted small weekline">
            This week: {wk.done} of {wk.planned} workouts · {wk.sets} sets
          </p>
        )}
      </header>

      {reminder && (
        <aside className="prompt">
          <p>
            <strong>Save a backup of your progress.</strong> Your workouts live only on this phone. A backup file keeps
            them safe if you clear the browser or change phones.
          </p>
          <div className="btnrow">
            <button
              type="button"
              className="btn btn--small"
              onClick={() => {
                exportJSON(state);
                setSetting({ lastBackupAt: new Date().toISOString() });
              }}
            >
              Save backup
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={snoozeBackup}>
              Remind me in a week
            </button>
          </div>
        </aside>
      )}

      {!state.settings.safetyNoteDismissed && (
        <aside className="safety">
          <p>
            <strong>Stop any exercise</strong> that causes an electric-shock feeling, tingling, numbness or pain,
            {state.settings.elbowFriendly ? "especially around the elbow. " : ""}If it keeps coming back, get it checked by a doctor or physio. Get help
            promptly for numbness that won't go away, weakness, trouble moving your fingers, major swelling or severe
            pain.
          </p>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => setSetting({ safetyNoteDismissed: true })}
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

      {session && !state.settings.photoPromptSeen && !state.settings.showDemoPhotos && (
        <aside className="prompt">
          <p>
            <strong>Show exercise photos?</strong> Start/finish demo photos load from the internet (free) and are saved
            for offline use once you've seen them. {state.settings.ownGymPhotos ? "Your own gym photos always show." : "Example machine photos always show."}
          </p>
          <div className="btnrow">
            <button type="button" className="btn btn--small" onClick={() => setSetting({ showDemoPhotos: true, photoPromptSeen: true })}>
              Yes, show photos
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => setSetting({ photoPromptSeen: true })}>
              Not now
            </button>
          </div>
        </aside>
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

      {changes.length > 0 && (
        <aside className="note note--update" role="status">
          <strong>Workout updated for your equipment</strong>
          <ul>
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button type="button" className="linkbtn" onClick={() => setChanges([])}>
            OK
          </button>
        </aside>
      )}

      <div className="cards">
        {resolved.map((row, index) => {
          const { slot, resolution, entry, prev, suggestion } = row;
          const ex = resolution.kind === "assigned" ? resolution.exercise : null;
          return (
            <ExerciseCard
              key={slot.id}
              slot={slot}
              resolution={resolution}
              entry={entry}
              prev={prev}
              suggestion={suggestion}
              showDemo={state.settings.showDemoPhotos}
              upNext={started && slot.id === upNextId}
              extra={row.extra}
              skipped={row.skipped}
              rating={ex ? (state.ratings[ex.id] ?? 0) : 0}
              note={ex ? noteOf(ex.id) : undefined}
              canMoveUp={index > 0}
              canMoveDown={index < resolved.length - 1}
              takesPlates={!!ex && takesPlates(ex.equipmentIds)}
              hasHistory={!!prev}
              onSetChange={(i, set: SetEntry) =>
                ex &&
                updateEntry(slot.id, ex.id, (e) => {
                  const sets = [...e.sets];
                  while (sets.length < Math.max(slot.sets, i + 1)) sets.push({ weight: null, reps: null, done: false });
                  sets[i] = set;
                  return { ...e, sets };
                })
              }
              onSetDone={() => ex && onStartRest(slot.restSec, ex.name)}
              onSymptom={(flag) => ex && updateEntry(slot.id, ex.id, (e) => ({ ...e, symptom: flag }))}
              onSwap={() => setSheet({ kind: "swap", slotId: slot.id })}
              onRate={(n) => ex && rate(ex.id, n)}
              onDislike={() => setSheet({ kind: "dislike", slotId: slot.id })}
              onHistory={() => setSheet({ kind: "history", slotId: slot.id })}
              onNotes={() => setSheet({ kind: "notes", slotId: slot.id })}
              onPlates={() => setSheet({ kind: "plates", slotId: slot.id })}
              onSkip={(on) => skip(slot.id, on)}
              onMove={(dir) => move(slot.id, dir)}
              onRemove={() => removeExtra(row)}
              onAnswerEquipment={onAnswerEquipment}
            />
          );
        })}
      </div>

      {session && (
        <button type="button" className="btn btn--ghost btn--block addbtn" onClick={() => setAdding(true)}>
          + Add an exercise to today
        </button>
      )}

      {target && sheet?.kind === "swap" && (
        <SwapSheet
          slot={target.slot}
          current={targetEx}
          inventory={state.equipment}
          elbowFriendly={state.settings.elbowFriendly}
          usedIds={usedIds}
          hasLogged={isLogged(log?.entries[target.slot.id])}
          isSwapped={target.resolution.kind === "assigned" && target.resolution.source !== "plan"}
          ratings={state.ratings}
          avoided={avoided}
          canSave={!target.extra}
          onPick={(id, always) => applySwap(target, id, always)}
          onReset={() => applySwap(target, null, false)}
          onAnswerEquipment={onAnswerEquipment}
          onClose={closeSheet}
        />
      )}

      {target && targetEx && sheet?.kind === "dislike" && (
        <DislikeSheet
          slot={target.slot}
          exercise={targetEx}
          inventory={state.equipment}
          elbowFriendly={state.settings.elbowFriendly}
          usedIds={usedIds}
          ratings={state.ratings}
          avoided={avoided}
          hasLogged={isLogged(log?.entries[target.slot.id])}
          onConfirm={(id) => confirmDislike(target, id)}
          onAnswerEquipment={onAnswerEquipment}
          onClose={closeSheet}
        />
      )}

      {target && targetEx && sheet?.kind === "history" && (
        <HistorySheet
          exercise={targetEx}
          history={exerciseHistory(state.logs, targetEx.id, dateKey)}
          best={personalBest(state.logs, targetEx.id, dateKey)}
          suggestion={target.suggestion}
          note={noteOf(targetEx.id)}
          plannedSets={target.slot.sets}
          onUseLast={(weights) => fillWeights(target, weights)}
          onClose={closeSheet}
        />
      )}

      {target && targetEx && sheet?.kind === "notes" && (
        <NotesSheet name={targetEx.name} note={noteOf(targetEx.id) ?? ""} onSave={(note) => patchNote(targetEx.id, { note })} onClose={closeSheet} />
      )}

      {target && targetEx && sheet?.kind === "plates" && (
        <PlateSheet
          name={targetEx.name}
          initialTotal={target.entry?.sets.find((x) => x.weight)?.weight ?? target.suggestion?.weight ?? null}
          base={state.exerciseNotes[targetEx.id]?.base ?? defaultBase(targetEx.equipmentIds)}
          plates={state.settings.plates}
          hasBar={defaultBase(targetEx.equipmentIds) > 0}
          onBase={(base) => patchNote(targetEx.id, { base })}
          onPlates={(plates) => setSetting({ plates })}
          onUse={(total) => fillWeights(target, [total], true)}
          onClose={closeSheet}
        />
      )}

      {adding && (
        <AddExerciseSheet
          inventory={state.equipment}
          elbowFriendly={state.settings.elbowFriendly}
          avoided={avoided}
          used={usedIds}
          onAdd={addExtra}
          onClose={() => setAdding(false)}
        />
      )}

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

/** Short label for a day chip, e.g. "Legs A + Abs" → "Legs A". */
function shortName(name: string | undefined) {
  if (!name) return "Rest";
  return name.split(/ \+ | \(/)[0];
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
