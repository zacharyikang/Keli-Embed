import { describe, it, expect } from "vitest";
import {
  LocalCardStore,
  LocalQuestionStore,
} from "@/lib/storage/local";
import { getTodayQueue } from "@/lib/services/queue-service";
import { emptyCardState } from "@/lib/domain";
import type { Question } from "@/lib/domain";

const seedQuestions: Question[] = [
  {
    id: "q-a1",
    title: "A1",
    body: "...",
    type: "concept",
    direction: "c-language",
    difficulty: "easy",
    tags: [],
    answer: "...",
    explanation: null,
    choices: null,
    companies: [],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: false,
  },
  {
    id: "q-a2",
    title: "A2",
    body: "...",
    type: "concept",
    direction: "c-language",
    difficulty: "medium",
    tags: [],
    answer: "...",
    explanation: null,
    choices: null,
    companies: [],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: false,
  },
  {
    id: "q-b1",
    title: "B1",
    body: "...",
    type: "concept",
    direction: "mcu",
    difficulty: "easy",
    tags: [],
    answer: "...",
    explanation: null,
    choices: null,
    companies: [],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: false,
  },
];

function makeDeps() {
  return {
    cardStore: new LocalCardStore(),
    questionStore: new LocalQuestionStore(seedQuestions),
  };
}

const now = new Date("2026-05-20T12:00:00Z");

describe("getTodayQueue", () => {
  it("returns weak cards before due cards before new cards", async () => {
    const deps = makeDeps();
    const userId = "test-user";
    const past = new Date("2026-05-19T12:00:00Z");

    // Save a due card and a weak card
    await deps.cardStore.save(
      userId,
      { ...emptyCardState("q-due"), dueAt: past },
    );
    await deps.cardStore.save(
      userId,
      {
        ...emptyCardState("q-weak"),
        isWeak: true,
        weakMarkedAt: past,
        dueAt: past,
      },
    );

    const queue = await getTodayQueue(deps, userId, now);

    expect(queue.length).toBeGreaterThanOrEqual(2);
    const priorities = queue.map((c) => c.priority);
    // weak (0) should be before due (1)
    expect(priorities[0]).toBe(0);
    expect(priorities.indexOf(1)).toBeGreaterThan(priorities.indexOf(0));
  });

  it("respects dailyNewLimit", async () => {
    const deps = makeDeps();
    const userId = "test-user-2";

    const queue = await getTodayQueue(deps, userId, now, {
      dailyNewLimit: 2,
      dailyTotalLimit: 50,
    });

    const newCards = queue.filter((c) => c.priority === 2);
    expect(newCards.length).toBeLessThanOrEqual(2);
  });

  it("does not schedule cards with existing user state as new cards", async () => {
    const deps = makeDeps();
    const userId = "test-user-existing-state";

    await deps.cardStore.save(userId, {
      ...emptyCardState("q-a1"),
      totalReviews: 1,
      dueAt: new Date("2026-06-20T12:00:00Z"),
    });

    const queue = await getTodayQueue(deps, userId, now, {
      dailyNewLimit: 3,
      dailyTotalLimit: 50,
    });

    const newCardIds = queue
      .filter((item) => item.priority === 2)
      .map((item) => item.card.questionId);

    expect(newCardIds).not.toContain("q-a1");
  });

  it("returns empty array when nothing due/weak and no new candidates", async () => {
    const deps = makeDeps();
    const userId = "test-user-3";

    // Seed has 3 questions, all returned as new candidates by LocalQuestionStore
    const queue = await getTodayQueue(
      {
        cardStore: deps.cardStore,
        questionStore: new LocalQuestionStore([]),
      },
      userId,
      now,
    );

    // No due cards, no weak cards, no new candidates → empty
    expect(queue).toHaveLength(0);
  });

  it("sorts weak cards by weakMarkedAt ascending", async () => {
    const deps = makeDeps();
    const userId = "test-user-4";
    const nowDate = new Date("2026-05-20T12:00:00Z");

    await deps.cardStore.save(userId, {
      ...emptyCardState("old-weak"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01T00:00:00Z"),
      dueAt: nowDate,
    });
    await deps.cardStore.save(userId, {
      ...emptyCardState("new-weak"),
      isWeak: true,
      weakMarkedAt: new Date("2026-05-01T00:00:00Z"),
      dueAt: nowDate,
    });

    const queue = await getTodayQueue(deps, userId, nowDate);
    const weakCards = queue.filter((c) => c.priority === 0);
    expect(weakCards[0].card.questionId).toBe("old-weak");
  });

  it("respects dailyTotalLimit", async () => {
    const deps = makeDeps();
    const userId = "test-user-5";
    const past = new Date("2026-05-19T12:00:00Z");

    // Create many due cards
    for (let i = 0; i < 5; i++) {
      await deps.cardStore.save(userId, {
        ...emptyCardState(`bulk-${i}`),
        dueAt: past,
      });
    }

    const queue = await getTodayQueue(deps, userId, now, {
      dailyNewLimit: 10,
      dailyTotalLimit: 3,
    });

    expect(queue.length).toBe(3);
  });
});
