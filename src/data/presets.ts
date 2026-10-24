import type { Availability } from "../lib/types";
import { EQUIPMENT } from "./equipment";

export interface GymPreset {
  id: string;
  name: string;
  description: string;
  /** True when the equipment photos in this app show this gym. */
  ownPhotos: boolean;
  build(): Record<string, Availability>;
}

const all = (value: Availability): Record<string, Availability> =>
  Object.fromEntries(EQUIPMENT.map((e) => [e.id, value]));

const only = (ids: string[], rest: Availability): Record<string, Availability> => {
  const out = all(rest);
  for (const id of ids) if (id in out) out[id] = "available";
  return out;
};

export const PRESETS: GymPreset[] = [
  {
    id: "original",
    name: "The gym IRON MODE was built around",
    description:
      "Multi-press, plate-loaded incline press, chest-supported row, lat pulldown, preacher bench, leg press, leg extension, calf raise, cables with rope, dumbbells and more.",
    ownPhotos: true,
    build: () => Object.fromEntries(EQUIPMENT.map((e) => [e.id, e.defaultAvailability])),
  },
  {
    id: "commercial",
    name: "A typical commercial gym",
    description: "Dumbbells, barbell, benches, cables, leg press and extension, lat pulldown. Adjust anything that's wrong.",
    ownPhotos: false,
    build: () =>
      only(
        [
          "dumbbells",
          "adjustable-bench",
          "barbell",
          "bench-press-station",
          "incline-bench-station",
          "ez-bar",
          "kettlebells",
          "ab-wheel",
          "cable-rope",
          "cable-handle",
          "cable-straight-bar",
          "leg-press",
          "leg-extension",
          "lat-pulldown",
          "lying-leg-curl",
          "seated-calf-raise",
          "pull-up-bar",
          "preacher-curl",
          "back-extension",
        ],
        "unknown",
      ),
  },
  {
    id: "home-dumbbells",
    name: "Home: dumbbells and a bench",
    description: "Dumbbells and an adjustable bench, plus your own body.",
    ownPhotos: false,
    build: () => only(["dumbbells", "adjustable-bench"], "unavailable"),
  },
  {
    id: "bodyweight",
    name: "Bodyweight only",
    description: "No equipment at all.",
    ownPhotos: false,
    build: () => all("unavailable"),
  },
  {
    id: "later",
    name: "I'll set it up myself",
    description: "Start with nothing confirmed and answer the app's questions as they come up.",
    ownPhotos: false,
    build: () => all("unknown"),
  },
];

export const PRESETS_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
