import type { Rating } from "./rating";

export type CardState = {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  isWeak: boolean;
  weakMarkedAt: Date | null;
  lastRating: Rating | null;
  lastReviewedAt: Date | null;
  totalReviews: number;
};

export function emptyCardState(questionId: string): CardState {
  return {
    questionId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: new Date(0),
    isWeak: false,
    weakMarkedAt: null,
    lastRating: null,
    lastReviewedAt: null,
    totalReviews: 0,
  };
}
