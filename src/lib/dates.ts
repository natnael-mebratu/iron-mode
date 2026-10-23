import type { Weekday } from "./types";

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Saturday-first, matching how the user describes their training week. */
export const WEEK_ORDER: Weekday[] = [6, 0, 1, 2, 3, 4, 5];

/** Local calendar date as YYYY-MM-DD (not UTC, so late-night sessions stay on the right day). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The date of the given weekday within the Saturday-starting week that contains `from`. */
export function dateForWeekday(weekday: Weekday, from: Date = new Date()): Date {
  const offsetFromSaturday = (from.getDay() + 1) % 7;
  const saturday = new Date(from.getFullYear(), from.getMonth(), from.getDate() - offsetFromSaturday);
  const target = (weekday + 1) % 7;
  return new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + target);
}
