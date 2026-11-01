/** Plate maths for plate-loaded machines and barbells. Everything is in kg. */

export interface PlateResult {
  /** Plates to load on each side, heaviest first. */
  perSide: number[];
  /** Total weight with those plates (base + both sides). */
  total: number;
  /** True when the requested total can't be made exactly. */
  approximate: boolean;
  /** Nearest totals below and above the request, when the request can't be hit. */
  nearest?: { below: PlateResult | null; above: PlateResult | null };
}

const SCALE = 100; // work in hundredths of a kg to avoid floating-point error
const units = (kg: number) => Math.round(kg * SCALE);

/** Fewest plates that add up to exactly `target` units, or null. */
function fewestPlates(target: number, plates: number[]): number[] | null {
  const best: (number[] | null)[] = new Array(target + 1).fill(null);
  best[0] = [];
  for (let t = 1; t <= target; t++) {
    for (const p of plates) {
      if (p > t) continue;
      const prev = best[t - p];
      if (prev && (!best[t] || prev.length + 1 < best[t]!.length)) best[t] = [...prev, p];
    }
  }
  return best[target];
}

export function platesFor(total: number, base: number, available: number[]): PlateResult {
  const sorted = [...new Set(available)].filter((p) => p > 0).sort((a, b) => b - a);
  const plateUnits = sorted.map(units);
  const perSideTarget = (units(total) - units(base)) / 2;

  const build = (sideUnits: number): PlateResult | null => {
    const combo = fewestPlates(sideUnits, plateUnits);
    if (!combo) return null;
    const perSide = combo.sort((a, b) => b - a).map((u) => u / SCALE);
    return { perSide, total: units(base) / SCALE + (sideUnits * 2) / SCALE, approximate: false };
  };

  if (perSideTarget < 0 || sorted.length === 0) {
    return { perSide: [], total: base, approximate: units(total) !== units(base) };
  }

  if (Number.isInteger(perSideTarget)) {
    const exact = build(perSideTarget);
    if (exact) return exact;
  }

  // Not exactly possible: find the closest loads either side of the request.
  const step = Math.min(...plateUnits);
  const lowest = Math.floor(perSideTarget);
  let below: PlateResult | null = null;
  for (let u = lowest; u >= 0 && !below; u--) below = build(u);
  let above: PlateResult | null = null;
  for (let u = Math.ceil(perSideTarget); u <= perSideTarget + step * 4 + plateUnits[0] && !above; u++) above = build(u);

  const pick = [below, above].filter((x): x is PlateResult => !!x).sort((a, b) => Math.abs(a.total - total) - Math.abs(b.total - total))[0];
  return { ...(pick ?? { perSide: [], total: base }), approximate: true, nearest: { below, above } };
}

/** Typical bar weights, used as starting values the user can change. */
export function defaultBase(equipmentIds: string[]): number {
  if (equipmentIds.includes("ez-bar")) return 10;
  if (equipmentIds.includes("barbell") || equipmentIds.includes("bench-press-station") || equipmentIds.includes("incline-bench-station")) return 20;
  return 0;
}

/** Equipment that takes weight plates. */
const PLATE_LOADED = new Set([
  "barbell",
  "ez-bar",
  "bench-press-station",
  "incline-bench-station",
  "plate-incline-press",
  "chest-row",
  "lat-pulldown",
  "seated-calf-raise",
  "leg-press",
  "lying-leg-curl",
]);

export const takesPlates = (equipmentIds: string[]) => equipmentIds.some((id) => PLATE_LOADED.has(id));
