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

  const candidates = await deps.questionStore.findNewCandidates(
    userId,
    dailyNewLimit * 5,
  );

  return buildTodayQueue({
    weakCards,
    dueCards,
    newCardsCandidates: candidates,
    dailyNewLimit,
    dailyTotalLimit,
  });
}
