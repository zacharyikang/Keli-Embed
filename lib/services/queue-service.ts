import type { CardStore, QuestionStore } from "@/lib/storage";
import type { ScheduledCard } from "@/lib/srs";
import { buildTodayQueue } from "@/lib/srs";

export async function getTodayQueue(
  deps: { cardStore: CardStore; questionStore: QuestionStore },
  userId: string,
  now: Date,
  options?: { dailyNewLimit?: number; dailyTotalLimit?: number },
): Promise<ScheduledCard[]> {
  const dailyNewLimit = options?.dailyNewLimit ?? 10;
  const dailyTotalLimit = options?.dailyTotalLimit ?? 50;

  const states = await deps.cardStore.findDueOrWeak(userId, now);
  const weakCards = states.filter((s) => s.isWeak);
  const dueCards = states.filter((s) => !s.isWeak && s.dueAt <= now);

  const existingCards = await deps.cardStore.findByUser(userId);
  const existingQuestionIds = existingCards.map((card) => card.questionId);
  const existingQuestionIdSet = new Set(existingQuestionIds);

  const candidates = await deps.questionStore.findNewCandidates(
    userId,
    dailyNewLimit * 5,
    existingQuestionIds,
  );
  const unseenCandidates = candidates.filter(
    (question) => !existingQuestionIdSet.has(question.id),
  );

  return buildTodayQueue({
    weakCards,
    dueCards,
    newCardsCandidates: unseenCandidates,
    dailyNewLimit,
    dailyTotalLimit,
  });
}
