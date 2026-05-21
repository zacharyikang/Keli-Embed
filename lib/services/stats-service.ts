import type { CardStore, ReviewLogStore, QuestionStore } from "@/lib/storage";

export type UserStats = {
  totalLearned: number;
  streakCount: number;
  totalReviews: number;
  averageRating: number;
  directionProgress: DirectionProgress[];
  recentActivity: Record<string, number>;
};

export type DirectionProgress = {
  direction: string;
  total: number;
  learned: number;
  mastered: number;
};

export async function getStats(
  deps: {
    cardStore: CardStore;
    logStore: ReviewLogStore;
    questionStore: QuestionStore;
  },
  userId: string,
): Promise<UserStats> {
  const cards = await deps.cardStore.findByUser(userId);
  const totalLearned = cards.filter((c) => c.totalReviews > 0).length;

  const totalReviews = cards.reduce((sum, c) => sum + c.totalReviews, 0);

  const ratings: number[] = cards
    .filter((c) => c.lastRating)
    .map((c) => {
      switch (c.lastRating) {
        case "again":
          return 1;
        case "hard":
          return 2;
        case "good":
          return 3;
        case "easy":
          return 4;
        default:
          return 0;
      }
    });
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 0;

  // Get question counts per direction
  const allQuestions = await deps.questionStore.search({});
  const dirCounts = new Map<string, number>();
  for (const q of allQuestions) {
    dirCounts.set(q.direction, (dirCounts.get(q.direction) ?? 0) + 1);
  }

  // Get distinct questionIds from cards and map to directions
  const cardQuestionIds = cards.map((c) => c.questionId);
  const cardQuestions = await deps.questionStore.findByIds(cardQuestionIds);

  const dirProgressMap = new Map<string, { learned: number; mastered: number }>();
  for (const card of cards) {
    const q = cardQuestions.find((q) => q.id === card.questionId);
    const dir = q?.direction ?? "unknown";
    const cur = dirProgressMap.get(dir) ?? { learned: 0, mastered: 0 };
    if (card.totalReviews > 0) cur.learned++;
    if (card.intervalDays > 21) cur.mastered++;
    dirProgressMap.set(dir, cur);
  }

  const directionProgress: DirectionProgress[] = [...dirCounts.entries()]
    .map(([direction, total]) => ({
      direction,
      total,
      learned: dirProgressMap.get(direction)?.learned ?? 0,
      mastered: dirProgressMap.get(direction)?.mastered ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Recent activity (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentActivity = await deps.logStore.countByDateRange(
    userId,
    thirtyDaysAgo,
    now,
  );

  // Calculate streak
  const streakCount = computeStreak(recentActivity, now);

  return {
    totalLearned,
    streakCount,
    totalReviews,
    averageRating: Math.round(averageRating * 100) / 100,
    directionProgress,
    recentActivity,
  };
}

function computeStreak(
  activity: Record<string, number>,
  today: Date,
): number {
  let streak = 0;
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  while (true) {
    const key = current.toISOString().slice(0, 10);
    if (activity[key] && activity[key] > 0) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function directionProgress(
  deps: { questionStore: QuestionStore },
  directionSlug: string,
): Promise<{
  direction: string;
  total: number;
}> {
  const questions = await deps.questionStore.findByDirection(directionSlug);
  return {
    direction: directionSlug,
    total: questions.length,
  };
}
