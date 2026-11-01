import type { Alternative } from "./resolve";
import type { Exercise } from "./types";

/** Why someone doesn't want an exercise. It changes what we suggest instead. */
export type DislikeReason = "balance" | "hurts" | "feel" | "other";

export const DISLIKE_REASONS: { id: DislikeReason; label: string }[] = [
  { id: "balance", label: "Hard to balance" },
  { id: "hurts", label: "Hurts or feels wrong" },
  { id: "feel", label: "Don't feel the right muscle" },
  { id: "other", label: "Just don't like it" },
];

type Kind = "machine" | "cable" | "free" | "bodyweight";

const FREE = new Set(["dumbbells", "barbell", "ez-bar", "kettlebells"]);

export function exerciseKind(ex: Exercise): Kind {
  if (ex.equipmentIds.length === 0) return "bodyweight";
  if (ex.equipmentIds.some((id) => id.startsWith("cable"))) return "cable";
  if (ex.equipmentIds.every((id) => FREE.has(id) || id.includes("bench"))) return "free";
  return "machine";
}

const STOP = new Set(["and", "the", "of", "head", "part", "lower", "upper", "deep", "outer", "inner"]);

/** "Calves" and "calf", "glutes" and "glute" should count as the same muscle. */
function normalise(word: string): string {
  if (word === "calves") return "calf";
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

function wordsOf(muscles: string[]): Set<string> {
  return new Set(
    muscles
      .flatMap((m) => m.toLowerCase().split(/[^a-z]+/))
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(normalise),
  );
}

/** All muscles named in an exercise. */
const muscleWords = (ex: Exercise) => wordsOf(ex.targetMuscles);
/** The first-listed muscle, which is the one the exercise mainly trains. */
const primaryWords = (ex: Exercise) => wordsOf(ex.targetMuscles.slice(0, 1));

export interface Ranked extends Alternative {
  /** Trains at least one of the same muscles as the exercise being replaced. */
  related: boolean;
  score: number;
  /** Short reasons shown next to the suggestion. */
  because: string[];
}

export interface RankContext {
  /** The exercise being replaced. */
  current: Exercise | null;
  ratings: Record<string, number>;
  reason?: DislikeReason;
}

/**
 * Orders replacement exercises by how well they do the same job: same muscles
 * first, then similar kind of equipment, then the user's own star ratings.
 * The reason for disliking the old one shapes the result: "balance" removes
 * anything that needs balance, "hurts" removes elbow-heavy moves.
 */
export function rankAlternatives(alts: Alternative[], ctx: RankContext): Ranked[] {
  const { current, ratings, reason } = ctx;
  const want = current ? muscleWords(current) : new Set<string>();
  const wantPrimary = current ? primaryWords(current) : new Set<string>();
  const kind = current ? exerciseKind(current) : null;
  const out: Ranked[] = [];

  for (const alt of alts) {
    const ex = alt.exercise;
    if (reason === "balance" && ex.unstable) continue;
    if (reason === "hurts" && ex.elbowCaution) continue;

    const because: string[] = [];
    let score = 0;
    let related = !current;

    if (current) {
      const mine = muscleWords(ex);
      const shared = [...want].filter((w) => mine.has(w)).length;
      const overlap = want.size ? shared / want.size : 0;
      related = shared > 0;
      score += overlap * 3;
      // Doing the same main job matters most: a hamstring curl replaces an RDL better than a glute bridge does.
      const samePrimary = [...primaryWords(ex)].some((w) => wantPrimary.has(w));
      if (samePrimary) {
        score += 4;
        because.push("trains the same main muscle");
      } else if (overlap >= 0.5) because.push("similar muscles");
      if (ex.muscleGroup === current.muscleGroup) score += 2;
      if (kind && exerciseKind(ex) === kind) {
        score += 1.5;
        because.push(kind === "machine" ? "machine like it" : kind === "cable" ? "cable like it" : kind === "free" ? "free weights like it" : "no equipment like it");
      }
    }
    if (reason === "balance") {
      score += 1.5;
      because.push("no balance needed");
    }
    const stars = ratings[ex.id];
    if (stars) {
      score += (stars - 3) * 2;
      if (stars >= 4) because.push(`you rated it ${stars}★`);
    }
    if (alt.inPlan) score += 1;
    if (ex.gem) score += 0.2;
    // Exercises for other muscles can still be offered, but only after every related one.
    if (!related) {
      score -= 10;
      because.length = 0;
    }
    out.push({ ...alt, related, score, because });
  }
  return out.sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));
}
