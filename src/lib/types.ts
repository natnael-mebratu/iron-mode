export type Availability = "available" | "unavailable" | "unknown";

export interface Equipment {
  id: string;
  name: string;
  /** What we know about the user's gym before they change anything. */
  defaultAvailability: Availability;
  notes?: string;
  /** Photos of this machine at the user's own gym, relative to public/. */
  photos?: string[];
}

export type MuscleGroup =
  | "Chest"
  | "Shoulders"
  | "Back"
  | "Biceps"
  | "Triceps"
  | "Forearms"
  | "Quads"
  | "Hamstrings & Glutes"
  | "Calves & Shins"
  | "Abs & Core";

/** How the set is measured. Weight sets log kg × reps. */
export type LoadType = "weight" | "bodyweight" | "time";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetMuscles: string[];
  /** One line on what this exercise is for and why it's in the library. */
  why: string;
  /** Every item listed is required. An empty list means bodyweight only. */
  equipmentIds: string[];
  setup: string;
  formCues: string[];
  commonMistakes: string[];
  safetyNotes?: string[];
  /** A lesser-known exercise picked for a specific reason (see RESEARCH.md). */
  gem?: boolean;
  /**
   * Loads the elbow in deep bending or overhead, which can irritate the ulnar
   * nerve. Hidden while elbow-friendly mode is on.
   */
  elbowCaution?: boolean;
  load?: LoadType;
  /** Smallest sensible weight jump in kg. */
  increment?: number;
  /** Free Exercise DB folder name for optional online demo photos. */
  demo?: string;
  /** Note shown when the demo photo differs from our exact setup. */
  demoNote?: string;
}

/**
 * One position in a workout. `options` is ordered by preference; the first
 * option whose equipment is available at the user's gym is used.
 */
export interface Slot {
  id: string;
  options: string[];
  sets: number;
  reps: string;
  restSec: number;
  optional?: boolean;
  note?: string;
}

export interface Session {
  id: string;
  name: string;
  focus: string;
  slots: Slot[];
}

/** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Week = Record<Weekday, string | null>;

export interface Plan {
  id: string;
  name: string;
  description: string;
  sessions: Session[];
  defaultWeek: Week;
}
