export type Availability = "available" | "unavailable" | "unknown";

export interface Equipment {
  id: string;
  name: string;
  /** What we know about the user's gym before they change anything. */
  defaultAvailability: Availability;
  notes?: string;
}

export type MuscleGroup =
  | "Chest"
  | "Shoulders"
  | "Back"
  | "Biceps"
  | "Triceps"
  | "Forearms"
  | "Legs"
  | "Abs";

export interface ExerciseImage {
  src: string;
  alt: string;
  attribution?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetMuscles: string[];
  /** Every item listed is required. An empty list means bodyweight only. */
  equipmentIds: string[];
  setup: string;
  formCues: string[];
  commonMistakes: string[];
  safetyNotes?: string[];
  /** Absent until a real, correctly matched photo is added to the repo. */
  image?: ExerciseImage;
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
