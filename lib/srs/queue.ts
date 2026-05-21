import type { CardState, Question } from "@/lib/domain";

export type ScheduledCard = {
  card: CardState;
  priority: 0 | 1 | 2;
  question?: Question;
};

export type BuildTodayQueueOptions = {
  weakCards: CardState[];
  dueCards: CardState[];
  newCardsCandidates: Question[];
  dailyNewLimit: number;
  dailyTotalLimit: number;
};

export function buildTodayQueue(opts: BuildTodayQueueOptions): ScheduledCard[] {
  const weak = [...opts.weakCards].sort(
    (a, b) => +(a.weakMarkedAt ?? 0) - +(b.weakMarkedAt ?? 0),
  );

  const due = [...opts.dueCards].sort(
    (a, b) => +a.dueAt - +b.dueAt,
  );

  const fresh = pickNewCards(opts.newCardsCandidates, opts.dailyNewLimit);

  const queue: ScheduledCard[] = [
    ...weak.map((card) => ({ card, priority: 0 as const })),
    ...due.map((card) => ({ card, priority: 1 as const })),
    ...fresh.map((question) => ({
      card: {
        questionId: question.id,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueAt: new Date(0),
        isWeak: false,
        weakMarkedAt: null,
        lastRating: null,
        lastReviewedAt: null,
        totalReviews: 0,
      } as CardState,
      priority: 2 as const,
      question,
    })),
  ];

  return queue.slice(0, opts.dailyTotalLimit);
}

export function pickNewCards(
  candidates: Question[],
  limit: number,
): Question[] {
  if (candidates.length === 0 || limit <= 0) return [];

  // Group by direction, sorted by difficulty within each group
  const byDirection = new Map<string, Question[]>();
  for (const q of candidates) {
    const group = byDirection.get(q.direction) ?? [];
    group.push(q);
    byDirection.set(q.direction, group);
  }

  // Sort each direction group: easy → medium → hard
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  for (const [, group] of byDirection) {
    group.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
  }

  const directions = [...byDirection.keys()];
  const result: Question[] = [];
  const indices = new Map(directions.map((d) => [d, 0]));

  let directionIdx = 0;
  while (result.length < limit) {
    const dir = directions[directionIdx % directions.length];
    const idx = indices.get(dir)!;
    const group = byDirection.get(dir)!;

    if (idx < group.length) {
      result.push(group[idx]);
      indices.set(dir, idx + 1);
    }

    directionIdx++;

    // Stop if all groups exhausted
    const totalRemaining = directions.reduce(
      (sum, d) => sum + byDirection.get(d)!.length - (indices.get(d) ?? 0),
      0,
    );
    if (totalRemaining === 0) break;
  }

  return result;
}
