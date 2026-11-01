import { formatSet, type HistoryEntry, type Suggestion } from "../lib/progression";
import type { Exercise } from "../lib/types";
import { Sheet } from "./Sheet";

interface Props {
  exercise: Exercise;
  history: HistoryEntry[];
  best: { weight: number; reps: number; date: string } | null;
  suggestion: Suggestion | null;
  note?: string;
  /** Number of sets planned today. */
  plannedSets: number;
  onUseLast: (weights: number[]) => void;
  onClose: () => void;
}

const day = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** What you did before on this exercise, so you can decide today's weight. */
export function HistorySheet({ exercise, history, best, suggestion, note, plannedSets, onUseLast, onClose }: Props) {
  const last = history[0];
  const weighted = (exercise.load ?? "weight") === "weight";
  const lastWeights = last ? last.sets.map((s) => s.weight ?? 0) : [];
  const canFill = weighted && lastWeights.some((w) => w > 0);

  const fill = () => {
    // Match today's set count; if you plan more sets than last time, repeat the last weight.
    onUseLast(Array.from({ length: plannedSets }, (_, i) => lastWeights[Math.min(i, lastWeights.length - 1)]));
    onClose();
  };

  return (
    <Sheet title={exercise.name} subtitle="Your history on this exercise" onClose={onClose}>
      {!last && <p className="empty">First time on this exercise. Nothing to compare yet. Log it today and it shows up here next time.</p>}

      {note && <p className="note">📝 {note}</p>}

      {suggestion && last && <p className={`hint hint--${suggestion.kind}`}>{suggestion.message}</p>}

      {last && (
        <section className="panel">
          <h3>Last time · {day(last.date)}</h3>
          <ul className="lastsets">
            {last.sets.map((s, i) => (
              <li key={i}>
                <span className="muted">Set {i + 1}</span>
                <strong>{formatSet(s, exercise)}</strong>
              </li>
            ))}
          </ul>
          {last.symptom && <p className="safety-inline">You flagged symptoms in this session.</p>}
          {canFill && (
            <button type="button" className="btn btn--block" onClick={fill}>
              Use last time's weights
            </button>
          )}
        </section>
      )}

      {best && (
        <p className="pb">
          🏆 Personal best: <strong>{formatSet({ weight: best.weight, reps: best.reps }, exercise)}</strong>{" "}
          <span className="muted small">{day(best.date)}</span>
        </p>
      )}

      {history.length > 1 && (
        <section>
          <h3 className="sheet__sub">Recent sessions</h3>
          <ul className="sessions">
            {history.map((h, i) => {
              const older = history[i + 1];
              const trend = !older || !weighted ? "" : h.topWeight > older.topWeight ? "▲" : h.topWeight < older.topWeight ? "▼" : "＝";
              return (
                <li key={h.date}>
                  <span>
                    <strong>{day(h.date)}</strong>
                    <span className="muted small block">{h.sets.map((s) => formatSet(s, exercise)).join(" · ")}</span>
                  </span>
                  {weighted && h.topWeight > 0 && (
                    <span className={`trend trend--${trend === "▲" ? "up" : trend === "▼" ? "down" : "same"}`}>
                      {h.topWeight} kg {trend}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </Sheet>
  );
}
