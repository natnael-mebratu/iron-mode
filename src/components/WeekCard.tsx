import { weekSummary } from "../lib/summary";
import type { AppState } from "../lib/storage";

const kg = (n: number) => `${Math.round(n).toLocaleString()} kg`;

function change(now: number, before: number, unit: (n: number) => string): string | null {
  if (before <= 0 || now <= 0) return null;
  const diff = now - before;
  if (Math.abs(diff) < before * 0.02) return "about the same as last week";
  return `${diff > 0 ? "up" : "down"} ${unit(Math.abs(diff))} on last week`;
}

/** A short, neutral recap of the training week (Saturday to Friday). */
export function WeekCard({ state }: { state: AppState }) {
  const w = weekSummary(state);
  const volumeNote = change(w.volume, w.prevVolume, kg);
  const empty = w.done === 0;

  return (
    <div className="panel weekcard">
      <h3>This week</h3>
      <div className="stats">
        <div className="stat">
          <span className="stat__value">
            {w.done}
            {w.planned > 0 && <span className="stat__of"> / {w.planned}</span>}
          </span>
          <span className="stat__label">workouts</span>
        </div>
        <div className="stat">
          <span className="stat__value">{w.sets}</span>
          <span className="stat__label">sets{w.prevSets > 0 ? ` (last week ${w.prevSets})` : ""}</span>
        </div>
      </div>

      {empty ? (
        <p className="muted small">Nothing logged yet this week. Whenever you're ready. There's no need to make up for missed days.</p>
      ) : (
        <>
          {w.volume > 0 && (
            <p className="small">
              <strong>{kg(w.volume)}</strong> lifted{volumeNote ? `, ${volumeNote}` : ""}.
            </p>
          )}
          {w.records.length > 0 && (
            <p className="small">
              🏆 <strong>New best weights:</strong> {w.records.join(", ")}
            </p>
          )}
          {w.symptoms.length > 0 && (
            <p className="safety-inline">
              You flagged tingling or pain on {w.symptoms.join(", ")}. Go lighter or swap it, and get it checked if it
              keeps coming back.
            </p>
          )}
          {w.planned > 0 && w.done < w.planned && <p className="muted small">The week isn't over. Missed days are fine; don't stack extra sets to catch up.</p>}
        </>
      )}
    </div>
  );
}
