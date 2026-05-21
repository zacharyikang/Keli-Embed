import type { CardState, Rating } from "@/lib/domain";

export function markAsWeak(
  state: CardState | null,
  questionId: string,
  now: Date,
): CardState {
  const base: CardState = state ?? {
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

  return {
    ...base,
    isWeak: true,
    weakMarkedAt: now,
    dueAt: now,
  };
}

function goodOrBetter(rating: Rating | null): boolean {
  return rating === "good" || rating === "easy";
}

export function maybeUnmarkWeak(
  state: CardState,
  newRating: Rating,
): CardState {
  if (!state.isWeak) return state;
  if (goodOrBetter(newRating) && goodOrBetter(state.lastRating)) {
    return { ...state, isWeak: false, weakMarkedAt: null };
  }
  return state;
}
