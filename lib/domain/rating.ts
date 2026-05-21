export type Rating = "again" | "hard" | "good" | "easy";

export const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

export function isRating(value: string): value is Rating {
  return RATINGS.includes(value as Rating);
}
