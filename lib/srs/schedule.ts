import type { CardState, Rating } from "@/lib/domain";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const EASE_FLOOR = 1.3;

const EASE_DELTA: Record<Exclude<Rating, "again">, number> = {
  hard: -0.15,
  good: 0,
  easy: 0.15,
};

export function schedule(
  state: CardState,
  rating: Rating,
  now: Date,
): CardState {
  const next: CardState = { ...state };
  next.lastRating = rating;
  next.lastReviewedAt = now;
  next.totalReviews = state.totalReviews + 1;

  if (rating === "again") {
    next.easeFactor = Math.max(EASE_FLOOR, state.easeFactor - 0.2);
    next.intervalDays = 0;
    next.repetitions = 0;
    next.dueAt = addMinutes(now, 10);
    return next;
  }

  next.easeFactor = Math.max(
    EASE_FLOOR,
    state.easeFactor + EASE_DELTA[rating],
  );

  let interval: number;
  if (state.repetitions === 0) {
    interval = 1;
  } else if (state.repetitions === 1) {
    interval = 3;
  } else {
    interval = Math.round(state.intervalDays * next.easeFactor);
  }

  if (rating === "hard") {
    interval = Math.max(1, Math.round(interval * 0.8));
  }

  next.intervalDays = interval;
  next.repetitions = state.repetitions + 1;
  next.dueAt = addDays(now, interval);
  return next;
}

export { addMinutes, addDays };
