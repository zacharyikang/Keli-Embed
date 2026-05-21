import { describe, it, expect } from "vitest";
import { buildTodayQueue, pickNewCards } from "@/lib/srs";
import type { CardState, Question } from "@/lib/domain";

function makeCard(overrides: Partial<CardState> = {}): CardState {
  return {
    questionId: "q-001",
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: new Date(0),
    isWeak: false,
    weakMarkedAt: null,
    lastRating: null,
    lastReviewedAt: null,
    totalReviews: 0,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: `q-${Math.random().toString(36).slice(2, 6)}`,
    title: "Test question",
    body: "Test body",
    type: "concept",
    direction: "c-language",
    difficulty: "easy",
    tags: [],
    answer: "Test answer",
    explanation: null,
    choices: null,
    companies: [],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: false,
    ...overrides,
  };
}

describe("buildTodayQueue", () => {
  it("places weak cards before due cards before new cards", () => {
    const weakCard = makeCard({ questionId: "weak-1", isWeak: true, weakMarkedAt: new Date("2026-01-01"), dueAt: new Date("2026-01-01") });
    const dueCard = makeCard({ questionId: "due-1", dueAt: new Date("2026-01-01") });
    const newQuestion = makeQuestion({ id: "new-1" });

    const queue = buildTodayQueue({
      weakCards: [weakCard],
      dueCards: [dueCard],
      newCardsCandidates: [newQuestion],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });

    expect(queue[0].priority).toBe(0);
    expect(queue[0].card.questionId).toBe("weak-1");
    expect(queue[1].priority).toBe(1);
    expect(queue[1].card.questionId).toBe("due-1");
    expect(queue[2].priority).toBe(2);
    expect(queue[2].question?.id).toBe("new-1");
  });

  it("sorts weak cards by weakMarkedAt ascending", () => {
    const weak1 = makeCard({ questionId: "old", isWeak: true, weakMarkedAt: new Date("2026-01-01"), dueAt: new Date("2026-01-01") });
    const weak2 = makeCard({ questionId: "newer", isWeak: true, weakMarkedAt: new Date("2026-01-05"), dueAt: new Date("2026-01-05") });

    const queue = buildTodayQueue({
      weakCards: [weak2, weak1],
      dueCards: [],
      newCardsCandidates: [],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });

    expect(queue[0].card.questionId).toBe("old");
    expect(queue[1].card.questionId).toBe("newer");
  });

  it("sorts due cards by dueAt ascending", () => {
    const due1 = makeCard({ questionId: "old", dueAt: new Date("2026-01-01") });
    const due2 = makeCard({ questionId: "newer", dueAt: new Date("2026-01-05") });

    const queue = buildTodayQueue({
      weakCards: [],
      dueCards: [due2, due1],
      newCardsCandidates: [],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });

    expect(queue[0].card.questionId).toBe("old");
    expect(queue[1].card.questionId).toBe("newer");
  });

  it("respects dailyNewLimit", () => {
    const candidates = [
      makeQuestion({ id: "n1", direction: "c-language" }),
      makeQuestion({ id: "n2", direction: "mcu" }),
      makeQuestion({ id: "n3", direction: "rtos" }),
    ];

    const queue = buildTodayQueue({
      weakCards: [],
      dueCards: [],
      newCardsCandidates: candidates,
      dailyNewLimit: 2,
      dailyTotalLimit: 50,
    });

    const newCards = queue.filter((c) => c.priority === 2);
    expect(newCards.length).toBe(2);
  });

  it("respects dailyTotalLimit by slicing the combined queue", () => {
    const weakCards = [
      makeCard({ questionId: "w1", isWeak: true, weakMarkedAt: new Date(), dueAt: new Date() }),
      makeCard({ questionId: "w2", isWeak: true, weakMarkedAt: new Date(), dueAt: new Date() }),
    ];
    const dueCards = [
      makeCard({ questionId: "d1", dueAt: new Date() }),
      makeCard({ questionId: "d2", dueAt: new Date() }),
    ];

    const queue = buildTodayQueue({
      weakCards,
      dueCards,
      newCardsCandidates: [],
      dailyNewLimit: 10,
      dailyTotalLimit: 2,
    });

    expect(queue.length).toBe(2);
    expect(queue[0].card.questionId).toBe("w1");
    expect(queue[1].card.questionId).toBe("w2");
  });

  it("returns empty when all inputs empty", () => {
    const queue = buildTodayQueue({
      weakCards: [],
      dueCards: [],
      newCardsCandidates: [],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });
    expect(queue).toHaveLength(0);
  });

  it("handles empty candidates gracefully", () => {
    const dueCard = makeCard({ questionId: "d1", dueAt: new Date() });
    const queue = buildTodayQueue({
      weakCards: [],
      dueCards: [dueCard],
      newCardsCandidates: [],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });

    expect(queue).toHaveLength(1);
    expect(queue[0].card.questionId).toBe("d1");
  });

  it("creates emptyCardState for new card entries", () => {
    const newQuestion = makeQuestion({ id: "fresh" });
    const queue = buildTodayQueue({
      weakCards: [],
      dueCards: [],
      newCardsCandidates: [newQuestion],
      dailyNewLimit: 10,
      dailyTotalLimit: 50,
    });

    const newEntry = queue[0];
    expect(newEntry.card.repetitions).toBe(0);
    expect(newEntry.card.intervalDays).toBe(0);
    expect(newEntry.card.isWeak).toBe(false);
  });
});

describe("pickNewCards", () => {
  it("returns empty array for empty candidates", () => {
    expect(pickNewCards([], 10)).toEqual([]);
  });

  it("returns empty array for limit 0", () => {
    const q = makeQuestion();
    expect(pickNewCards([q], 0)).toEqual([]);
  });

  it("returns at most `limit` items", () => {
    const questions = [
      makeQuestion({ id: "q1", direction: "c-language" }),
      makeQuestion({ id: "q2", direction: "mcu" }),
      makeQuestion({ id: "q3", direction: "rtos" }),
      makeQuestion({ id: "q4", direction: "c-language" }),
      makeQuestion({ id: "q5", direction: "mcu" }),
    ];
    expect(pickNewCards(questions, 3)).toHaveLength(3);
  });

  it("round-robins across directions", () => {
    const questions = [
      makeQuestion({ id: "q1", direction: "c-language" }),
      makeQuestion({ id: "q2", direction: "mcu" }),
      makeQuestion({ id: "q3", direction: "c-language" }),
    ];
    const result = pickNewCards(questions, 3);
    expect(result[0].direction).toBe("c-language");
    expect(result[1].direction).toBe("mcu");
    expect(result[2].direction).toBe("c-language");
  });

  it("sorts within direction by difficulty: easy → medium → hard", () => {
    const questions = [
      makeQuestion({ id: "q1", direction: "c-language", difficulty: "hard" }),
      makeQuestion({ id: "q2", direction: "c-language", difficulty: "easy" }),
      makeQuestion({ id: "q3", direction: "c-language", difficulty: "medium" }),
    ];
    const result = pickNewCards(questions, 3);
    const cLang = result.filter((q) => q.direction === "c-language");
    expect(cLang[0].difficulty).toBe("easy");
    expect(cLang[1].difficulty).toBe("medium");
    expect(cLang[2].difficulty).toBe("hard");
  });
});
