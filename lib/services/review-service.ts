import type { CardStore } from "@/lib/storage";
import type { ReviewLogStore } from "@/lib/storage";
import type { CardState, Rating } from "@/lib/domain";
import { emptyCardState } from "@/lib/domain";
import { schedule, maybeUnmarkWeak } from "@/lib/srs";

export async function submitAnswer(
  deps: { cardStore: CardStore; logStore: ReviewLogStore },
  userId: string,
  qid: string,
  rating: Rating,
  now: Date,
  context?: {
    mode?: "review" | "practice";
    queueSource?: "weak" | "due" | "new" | "practice" | "library_set";
  },
): Promise<CardState> {
  const prev = (await deps.cardStore.get(userId, qid)) ?? emptyCardState(qid);
  const scheduled = schedule(prev, rating, now);
  const final = maybeUnmarkWeak(scheduled, rating);

  await deps.cardStore.saveWithLog(userId, final, {
    questionId: qid,
    rating,
    prevInterval: prev.intervalDays,
    nextInterval: final.intervalDays,
    mode: context?.mode ?? "review",
    queueSource: context?.queueSource ?? "due",
    clientId: null,
    reviewedAt: now,
  });

  void deps.logStore;
  return final;
}
