import type { Equipment } from "../lib/types";

// Sources: the IRON MODE brief (section 4), the user's follow-up ("all kinds of
// dumbbells", rope, chest-supported row) and the 10 gym photos they shared,
// now in public/equipment/. Anything not confirmed stays "unknown" and is
// never treated as available.
export const EQUIPMENT: Equipment[] = [
  // Machines seen in the user's photos or confirmed by the user
  {
    id: "chest-press",
    name: "Multi-press machine (chest, incline & shoulder press)",
    defaultAvailability: "available",
    notes: "Life Fitness multi-press: one seat with chest, incline and shoulder press positions.",
    photos: ["equipment/multi-press.jpg"],
  },
  {
    id: "plate-incline-press",
    name: "Plate-loaded incline press (each arm moves separately)",
    defaultAvailability: "available",
    photos: ["equipment/plate-incline-press-1.jpg", "equipment/plate-incline-press-2.jpg"],
  },
  {
    id: "chest-row",
    name: "Plate-loaded chest-supported row",
    defaultAvailability: "available",
    notes: "Chest pad + seat, wide and neutral handles.",
    photos: ["equipment/chest-supported-row.jpg"],
  },
  {
    id: "lat-pulldown",
    name: "Plate-loaded lat pulldown",
    defaultAvailability: "available",
    notes: "Each arm moves separately, thigh pads.",
    photos: ["equipment/plate-lat-pulldown.jpg"],
  },
  {
    id: "cable-rope",
    name: "Cable station with rope attachment",
    defaultAvailability: "available",
    notes: "Adjustable-height pulley with a rope.",
  },
  { id: "leg-press", name: "Leg press machine", defaultAvailability: "available" },
  { id: "leg-extension", name: "Leg extension machine", defaultAvailability: "available" },
  {
    id: "preacher-curl",
    name: "Preacher curl bench",
    defaultAvailability: "available",
    photos: ["equipment/preacher-bench.jpg"],
  },

  // Free weights
  { id: "dumbbells", name: "Dumbbells (full range)", defaultAvailability: "available" },
  {
    id: "adjustable-bench",
    name: "Adjustable / incline bench",
    defaultAvailability: "available",
    notes: "Seen in the background of your photos. Switch off if that's wrong.",
  },
  { id: "ez-bar", name: "EZ curl bar", defaultAvailability: "available", photos: ["equipment/preacher-bench.jpg"] },
  { id: "barbell", name: "Barbell and plates", defaultAvailability: "available" },
  {
    id: "bench-press-station",
    name: "Flat bench press station",
    defaultAvailability: "available",
    photos: ["equipment/bench-press-station.jpg"],
  },
  {
    id: "incline-bench-station",
    name: "Incline bench press station",
    defaultAvailability: "available",
    photos: ["equipment/incline-bench-station.jpg"],
  },
  { id: "kettlebells", name: "Kettlebells", defaultAvailability: "available" },
  { id: "ab-wheel", name: "Ab wheel", defaultAvailability: "available", notes: "Seen in photo 6." },

  // Not confirmed
  {
    id: "seated-calf-raise",
    name: "Seated calf raise machine",
    defaultAvailability: "unknown",
    notes:
      "You said earlier there isn't one, but photo 1 looks like a plate-loaded seated calf raise. Please check.",
    photos: ["equipment/mystery-plate-machine.jpg"],
  },
  { id: "cable-handle", name: "Cable single handle (D-handle)", defaultAvailability: "unknown" },
  { id: "cable-straight-bar", name: "Cable straight-bar attachment", defaultAvailability: "unknown" },
  { id: "lying-leg-curl", name: "Lying leg curl machine", defaultAvailability: "unknown" },
  { id: "smith", name: "Smith machine", defaultAvailability: "unknown" },
  { id: "pull-up-bar", name: "Pull-up bar", defaultAvailability: "unknown" },
  { id: "back-extension", name: "45° back extension bench", defaultAvailability: "unknown" },

  // Confirmed not available
  { id: "seated-leg-curl", name: "Seated leg curl machine", defaultAvailability: "unavailable" },
  { id: "hip-abduction", name: "Hip abduction machine", defaultAvailability: "unavailable" },
  { id: "hip-adduction", name: "Hip adduction machine", defaultAvailability: "unavailable" },
];

export const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map((e) => [e.id, e]));

export function equipmentName(id: string): string {
  return EQUIPMENT_BY_ID.get(id)?.name ?? id;
}

/** Photos of the user's own machines needed for an exercise. */
export function gymPhotosFor(equipmentIds: string[]): string[] {
  return [...new Set(equipmentIds.flatMap((id) => EQUIPMENT_BY_ID.get(id)?.photos ?? []))];
}
