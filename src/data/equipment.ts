import type { Equipment } from "../lib/types";

// Source: IRON MODE handoff brief, section 4. Only the first four items are
// confirmed available. Do not change an "unknown" default to "available"
// without the user confirming it.
export const EQUIPMENT: Equipment[] = [
  { id: "chest-press", name: "Chest press machine", defaultAvailability: "available" },
  {
    id: "cable-rope",
    name: "Cable station with rope attachment",
    defaultAvailability: "available",
    notes: "Adjustable-height pulley with a rope.",
  },
  { id: "leg-press", name: "Leg press machine", defaultAvailability: "available" },
  { id: "leg-extension", name: "Leg extension machine", defaultAvailability: "available" },

  { id: "seated-leg-curl", name: "Seated leg curl machine", defaultAvailability: "unavailable" },
  { id: "seated-calf-raise", name: "Seated calf raise machine", defaultAvailability: "unavailable" },
  { id: "hip-abduction", name: "Hip abduction machine", defaultAvailability: "unavailable" },
  { id: "hip-adduction", name: "Hip adduction machine", defaultAvailability: "unavailable" },

  { id: "incline-chest-press", name: "Incline chest press machine", defaultAvailability: "unknown" },
  { id: "pec-deck", name: "Pec deck / chest fly machine", defaultAvailability: "unknown" },
  { id: "lying-leg-curl", name: "Lying leg curl machine", defaultAvailability: "unknown" },
  { id: "smith", name: "Smith machine", defaultAvailability: "unknown" },
  { id: "lat-pulldown", name: "Lat pulldown machine", defaultAvailability: "unknown" },
  { id: "seated-cable-row", name: "Seated cable row", defaultAvailability: "unknown" },
  { id: "adjustable-bench", name: "Adjustable / incline bench", defaultAvailability: "unknown" },
  { id: "preacher-curl", name: "Preacher curl bench or machine", defaultAvailability: "unknown" },
  { id: "dumbbells", name: "Dumbbells", defaultAvailability: "unknown" },
  { id: "cable-straight-bar", name: "Cable straight-bar attachment", defaultAvailability: "unknown" },
  { id: "cable-ez-bar", name: "Cable EZ-bar attachment", defaultAvailability: "unknown" },
  { id: "cable-handle", name: "Cable single handle (D-handle)", defaultAvailability: "unknown" },
];

export const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map((e) => [e.id, e]));

export function equipmentName(id: string): string {
  return EQUIPMENT_BY_ID.get(id)?.name ?? id;
}
