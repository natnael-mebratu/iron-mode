import { useMemo, useRef, useState } from "react";
import { LineChart } from "../components/LineChart";
import { EXERCISES_BY_ID } from "../data/exercises";
import { findSession } from "../data/plans";
import { bodyToCSV, download, exportJSON, readBackup, setsToCSV, type ImportPreview } from "../lib/backup";
import { toISODate } from "../lib/dates";
import { bestSet, formatSet, sessionVolume } from "../lib/progression";
import { mergeStates, type AppState, type BodyEntry } from "../lib/storage";

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const longDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export function Progress({ state, setState }: Props) {
  const logs = useMemo(
    () =>
      Object.values(state.logs)
        .filter((l) => Object.values(l.entries).some((e) => e.sets.some((s) => s.done)))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.logs],
  );

  const today = toISODate(new Date());
  const last28 = toISODate(new Date(Date.now() - 27 * 864e5));
  const recent = logs.filter((l) => l.date >= last28).length;

  return (
    <section>
      <h2>Progress</h2>
      <div className="stats">
        <div className="stat">
          <span className="stat__value">{logs.length}</span>
          <span className="stat__label">workouts logged</span>
        </div>
        <div className="stat">
          <span className="stat__value">{recent}</span>
          <span className="stat__label">in the last 4 weeks</span>
        </div>
      </div>

      <ExerciseProgress state={state} />
      <History logs={logs} />
      <Body state={state} setState={setState} today={today} />
      <Backup state={state} setState={setState} />
    </section>
  );
}

function ExerciseProgress({ state }: { state: AppState }) {
  const series = useMemo(() => {
    const byExercise = new Map<string, { date: string; value: number; label: string }[]>();
    for (const log of Object.values(state.logs)) {
      for (const e of Object.values(log.entries)) {
        const ex = EXERCISES_BY_ID.get(e.exerciseId);
        const best = bestSet(e.sets);
        if (!ex || !best) continue;
        const value = (ex.load ?? "weight") === "weight" ? best.weight : best.reps;
        if (!value) continue;
        const list = byExercise.get(ex.id) ?? [];
        list.push({ date: log.date, value, label: formatSet(best, ex) });
        byExercise.set(ex.id, list);
      }
    }
    for (const list of byExercise.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return byExercise;
  }, [state.logs]);

  const ids = [...series.keys()].sort((a, b) => EXERCISES_BY_ID.get(a)!.name.localeCompare(EXERCISES_BY_ID.get(b)!.name));
  const [selected, setSelected] = useState<string>("");
  const id = selected && series.has(selected) ? selected : ids[0];

  return (
    <div className="panel">
      <h3>Exercise progress</h3>
      {!id ? (
        <p className="muted small">Log a few workouts with weights and your progress shows up here.</p>
      ) : (
        <>
          <select className="select" value={id} onChange={(e) => setSelected(e.target.value)} aria-label="Exercise">
            {ids.map((i) => (
              <option key={i} value={i}>
                {EXERCISES_BY_ID.get(i)!.name}
              </option>
            ))}
          </select>
          {(() => {
            const ex = EXERCISES_BY_ID.get(id)!;
            const unit = (ex.load ?? "weight") === "weight" ? "kg" : ex.load === "time" ? "s" : "reps";
            return (
              <>
                <LineChart points={series.get(id)!} unit={unit} title={`Best set for ${ex.name}`} />
                <p className="muted tiny">Best set each session ({unit === "kg" ? "heaviest weight" : unit}).</p>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

function History({ logs }: { logs: AppState["logs"][string][] }) {
  const [shown, setShown] = useState(10);
  return (
    <div className="panel">
      <h3>History</h3>
      {logs.length === 0 && <p className="muted small">No workouts logged yet.</p>}
      <ul className="history">
        {logs.slice(0, shown).map((log) => {
          const { sets, volume } = sessionVolume(log);
          return (
            <li key={log.date}>
              <details>
                <summary>
                  <span>
                    <strong>{findSession(log.planId, log.sessionId)?.name ?? "Workout"}</strong>
                    <span className="muted small block">{longDate(log.date)}</span>
                  </span>
                  <span className="muted small">
                    {sets} sets{volume ? ` · ${Math.round(volume).toLocaleString()} kg` : ""}
                  </span>
                </summary>
                <ul className="history__ex">
                  {Object.values(log.entries)
                    .filter((e) => e.sets.some((s) => s.done))
                    .map((e) => {
                      const ex = EXERCISES_BY_ID.get(e.exerciseId);
                      return (
                        <li key={e.exerciseId}>
                          {ex?.name ?? e.exerciseId}
                          {e.symptom && <span className="badge badge--warn">symptoms</span>}
                          <span className="muted small block">
                            {e.sets.filter((s) => s.done).map((s) => formatSet(s, ex)).join(" · ")}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                {log.readiness && (
                  <p className="muted tiny">
                    Energy {["low", "OK", "good"][log.readiness.energy - 1]} · soreness{" "}
                    {["none", "a bit", "very sore"][log.readiness.soreness - 1]}
                  </p>
                )}
              </details>
            </li>
          );
        })}
      </ul>
      {logs.length > shown && (
        <button type="button" className="linkbtn" onClick={() => setShown((n) => n + 20)}>
          Show more
        </button>
      )}
    </div>
  );
}

function Body({ state, setState, today }: Props & { today: string }) {
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");
  const toNum = (v: string) => {
    const n = Number(v.replace(",", "."));
    return v.trim() && Number.isFinite(n) && n > 0 ? n : null;
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: BodyEntry = { date, weightKg: toNum(weight), waistCm: toNum(waist), note: note.trim() };
    if (entry.weightKg == null && entry.waistCm == null && !entry.note) return;
    setState((s) => ({
      ...s,
      body: [...s.body.filter((b) => b.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setWeight("");
    setWaist("");
    setNote("");
  };

  const remove = (d: string) =>
    confirm("Delete this entry?") && setState((s) => ({ ...s, body: s.body.filter((b) => b.date !== d) }));

  const weights = state.body.filter((b) => b.weightKg != null).map((b) => ({ date: b.date, value: b.weightKg! }));
  const waists = state.body.filter((b) => b.waistCm != null).map((b) => ({ date: b.date, value: b.waistCm! }));

  return (
    <div className="panel">
      <h3>Body (optional)</h3>
      <p className="muted small">
        Track only what's useful to you. Day-to-day weight moves with water and food, so look at the trend over
        weeks.
      </p>
      <form className="bodyform" onSubmit={save}>
        <label>
          <span>Date</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          <span>Weight (kg)</span>
          <input inputMode="decimal" type="number" step="0.1" min="0" placeholder="e.g. 56" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label>
          <span>Waist (cm)</span>
          <input inputMode="decimal" type="number" step="0.5" min="0" placeholder="optional" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
        <label className="bodyform__note">
          <span>Note</span>
          <input type="text" placeholder="optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--small">
          Save
        </button>
      </form>

      {weights.length > 0 && <LineChart points={weights} unit="kg" title="Body weight" />}
      {waists.length > 1 && <LineChart points={waists} unit="cm" title="Waist" />}

      {state.body.length > 0 && (
        <ul className="bodylist">
          {[...state.body].reverse().slice(0, 12).map((b) => (
            <li key={b.date}>
              <span>
                {longDate(b.date)}
                <span className="muted small block">
                  {[b.weightKg && `${b.weightKg} kg`, b.waistCm && `waist ${b.waistCm} cm`, b.note].filter(Boolean).join(" · ")}
                </span>
              </span>
              <button type="button" className="linkbtn" onClick={() => remove(b.date)} aria-label={`Delete entry for ${b.date}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="explain">
        <summary>About the lower belly</summary>
        <p>
          Crunches, leg raises and other ab exercises make the abs stronger and more visible over time, but they can't
          burn fat from one spot. Where your body stores and loses fat is mostly genetic, and the lower belly is often
          one of the last places to change.
        </p>
        <p>
          What helps: steady strength training (which you're doing), enough protein and sleep, and eating in a way you
          can keep up. Your goal is to build muscle, so slow, gradual changes are normal. No extreme diets needed.
        </p>
      </details>
    </div>
  );
}

function Backup({ state, setState }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const stamp = toISODate(new Date());

  const onFile = async (file: File | undefined) => {
    setError(null);
    setMessage(null);
    if (!file) return;
    try {
      setPreview(readBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const apply = (mode: "merge" | "replace") => {
    if (!preview) return;
    if (mode === "replace") {
      if (!confirm("Replace ALL data on this phone with the backup? A copy of your current data will download first.")) return;
      exportJSON(state);
      setState(preview.state);
    } else {
      setState((s) => mergeStates(s, preview.state));
    }
    setMessage(mode === "merge" ? "Backup merged. Nothing you already had was changed." : "Backup restored.");
    setPreview(null);
  };

  return (
    <div className="panel">
      <h3>Backup &amp; export</h3>
      <p className="muted small">
        Your data lives only on this phone, in this browser. Save a backup now and then (to Google Drive, email
        yourself, etc.) so you don't lose it if you clear the browser or change phones.
      </p>
      <div className="btnrow">
        <button type="button" className="btn btn--small" onClick={() => exportJSON(state)}>
          Save backup (.json)
        </button>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => download(`iron-mode-sets-${stamp}.csv`, setsToCSV(state), "text/csv")}>
          Workouts (.csv)
        </button>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => download(`iron-mode-body-${stamp}.csv`, bodyToCSV(state), "text/csv")}>
          Body (.csv)
        </button>
      </div>
      <p className="muted tiny">
        The .json backup can be restored here. The .csv files open in Excel or Google Sheets.
      </p>

      <label className="btn btn--small btn--ghost filebtn">
        Restore from backup…
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {error && <p className="error">{error}</p>}
      {message && <p className="ok">{message}</p>}
      {preview && (
        <div className="confirm">
          <p>
            This backup has <strong>{preview.workouts}</strong> workout{preview.workouts === 1 ? "" : "s"}
            {preview.from && (
              <>
                {" "}
                ({longDate(preview.from)} – {longDate(preview.to!)})
              </>
            )}{" "}
            and <strong>{preview.bodyEntries}</strong> body entr{preview.bodyEntries === 1 ? "y" : "ies"}.
          </p>
          <p className="muted small">
            <strong>Merge</strong> adds days you don't have yet and keeps everything already here.{" "}
            <strong>Replace</strong> swaps all data (including equipment and plan settings) for the backup.
          </p>
          <div className="btnrow">
            <button type="button" className="btn btn--small" onClick={() => apply("merge")}>
              Merge
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => apply("replace")}>
              Replace
            </button>
            <button type="button" className="linkbtn" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
