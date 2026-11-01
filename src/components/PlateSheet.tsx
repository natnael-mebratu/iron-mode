import { useState } from "react";
import { platesFor } from "../lib/plates";
import { Sheet } from "./Sheet";

const SIZES = [0.5, 1.25, 2.5, 5, 10, 15, 20, 25];

interface Props {
  name: string;
  /** Starting total, e.g. the weight already typed into the first set. */
  initialTotal: number | null;
  base: number;
  plates: number[];
  /** True when the exercise's weight is a bar plus plates (so a bar weight makes sense). */
  hasBar: boolean;
  onBase: (base: number) => void;
  onPlates: (plates: number[]) => void;
  onUse: (total: number) => void;
  onClose: () => void;
}

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : 0;
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(n));

/** Which plates to load on each side of a bar or plate-loaded machine. */
export function PlateSheet({ name, initialTotal, base, plates, hasBar, onBase, onPlates, onUse, onClose }: Props) {
  const [total, setTotal] = useState(initialTotal ? String(initialTotal) : "");
  const [baseText, setBaseText] = useState(String(base));
  const target = num(total);
  const result = platesFor(target, num(baseText), plates);

  const toggle = (size: number) => {
    const next = plates.includes(size) ? plates.filter((p) => p !== size) : [...plates, size];
    if (next.length) onPlates(next.sort((a, b) => b - a));
  };

  const choose = (t: number) => setTotal(String(t));

  return (
    <Sheet title="Plate calculator" subtitle={name} onClose={onClose}>
      <div className="platefields">
        <label className="field">
          <span>Total weight (kg)</span>
          <input
            className="textinput"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 60"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span>{hasBar ? "Bar weight (kg)" : "Machine arm / empty weight (kg)"}</span>
          <input
            className="textinput"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.5"
            value={baseText}
            onChange={(e) => {
              setBaseText(e.target.value);
              onBase(num(e.target.value));
            }}
          />
        </label>
      </div>

      {target > 0 && (
        <section className="panel" aria-live="polite">
          {result.perSide.length === 0 && !result.approximate && <p>No plates needed: just the {fmt(num(baseText))} kg.</p>}
          {result.perSide.length > 0 && (
            <>
              <p className="details__label">Each side</p>
              <div className="plates">
                {result.perSide.map((p, i) => (
                  <span key={i} className="plate" style={{ ["--w" as string]: Math.min(1, 0.45 + p / 40) }}>
                    {fmt(p)}
                  </span>
                ))}
              </div>
              <p className="muted small">
                {result.perSide.map(fmt).join(" + ")} = {fmt(result.perSide.reduce((a, b) => a + b, 0))} kg per side
              </p>
            </>
          )}
          {result.approximate && (
            <div className="note">
              <p>
                <strong>{fmt(target)} kg can't be made exactly</strong> with the plates ticked below.
              </p>
              <div className="btnrow">
                {result.nearest?.below && (
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => choose(result.nearest!.below!.total)}>
                    {fmt(result.nearest.below.total)} kg
                  </button>
                )}
                {result.nearest?.above && (
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => choose(result.nearest!.above!.total)}>
                    {fmt(result.nearest.above.total)} kg
                  </button>
                )}
              </div>
            </div>
          )}
          {!result.approximate && target > 0 && (
            <button type="button" className="btn btn--block" onClick={() => (onUse(target), onClose())}>
              Use {fmt(target)} kg for my sets
            </button>
          )}
        </section>
      )}

      <h3 className="sheet__sub">Plates your gym has</h3>
      <div className="pills pills--plates" aria-label="Plate sizes">
        {SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={plates.includes(s)} onClick={() => toggle(s)}>
            {fmt(s)}
          </button>
        ))}
      </div>
      <p className="muted tiny">
        Plate-loaded machines can feel lighter or heavier than the plates suggest, because of the lever. Compare the same
        machine from week to week, not against other machines.
      </p>
    </Sheet>
  );
}
