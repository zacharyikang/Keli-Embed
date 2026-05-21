import { describe, it, expect } from "vitest";
import { schedule } from "@/lib/srs";
import { emptyCardState } from "@/lib/domain";

function makeState(overrides: Partial<ReturnType<typeof emptyCardState>> = {}) {
  return { ...emptyCardState("q-001"), ...overrides };
}

describe("schedule()", () => {
  it("returns a new object (does not mutate input)", () => {
    const state = makeState();
    const result = schedule(state, "good", new Date());
    expect(result).not.toBe(state);
    expect(state.totalReviews).toBe(0);
  });

  describe('rating "again"', () => {
    it("resets repetitions to 0", () => {
      const state = makeState({ repetitions: 3, intervalDays: 8 });
      const result = schedule(state, "again", new Date("2026-01-01"));
      expect(result.repetitions).toBe(0);
    });

    it("resets intervalDays to 0", () => {
      const state = makeState({ intervalDays: 8 });
      const result = schedule(state, "again", new Date("2026-01-01"));
      expect(result.intervalDays).toBe(0);
    });

    it("sets dueAt to now + 10 minutes", () => {
      const now = new Date("2026-01-01T12:00:00Z");
      const result = schedule(makeState(), "again", now);
      expect(result.dueAt).toEqual(new Date("2026-01-01T12:10:00Z"));
    });

    it("reduces easeFactor by 0.2", () => {
      const state = makeState({ easeFactor: 2.5 });
      const result = schedule(state, "again", new Date());
      expect(result.easeFactor).toBeCloseTo(2.3);
    });

    it("clamps easeFactor to 1.3 floor", () => {
      const state = makeState({ easeFactor: 1.3 });
      const result = schedule(state, "again", new Date());
      expect(result.easeFactor).toBe(1.3);
    });

    it("increments totalReviews", () => {
      const result = schedule(makeState({ totalReviews: 5 }), "again", new Date());
      expect(result.totalReviews).toBe(6);
    });

    it("sets lastRating to again", () => {
      const result = schedule(makeState(), "again", new Date());
      expect(result.lastRating).toBe("again");
    });

    it("sets lastReviewedAt", () => {
      const now = new Date("2026-06-01");
      const result = schedule(makeState(), "again", now);
      expect(result.lastReviewedAt).toEqual(now);
    });
  });

  describe("first correct answer", () => {
    it.each(["hard", "good", "easy"] as const)(
      'sets intervalDays to 1 on first correct (%s)',
      (rating) => {
        const state = makeState({ repetitions: 0, intervalDays: 0 });
        const result = schedule(state, rating, new Date("2026-01-01"));
        expect(result.intervalDays).toBe(1);
        expect(result.repetitions).toBe(1);
      },
    );
  });

  describe("second correct answer", () => {
    it.each(["good", "easy"] as const)(
      'sets intervalDays to 3 on second correct (%s)',
      (rating) => {
        const state = makeState({ repetitions: 1, intervalDays: 1 });
        const result = schedule(state, rating, new Date("2026-01-01"));
        expect(result.intervalDays).toBe(3);
        expect(result.repetitions).toBe(2);
      },
    );

    it('sets intervalDays to 2 on second correct (hard — 0.8 multiplier)', () => {
      const state = makeState({ repetitions: 1, intervalDays: 1 });
      const result = schedule(state, "hard", new Date("2026-01-01"));
      expect(result.intervalDays).toBe(2); // round(3 * 0.8) = 2
      expect(result.repetitions).toBe(2);
    });
  });

  describe("subsequent correct answers", () => {
    it("multiplies interval by easeFactor (good)", () => {
      const state = makeState({
        repetitions: 2,
        intervalDays: 3,
        easeFactor: 2.5,
      });
      const result = schedule(state, "good", new Date("2026-01-01"));
      expect(result.intervalDays).toBe(8); // round(3 * 2.5)
      expect(result.repetitions).toBe(3);
    });

    it("multiplies interval by increased EF (easy)", () => {
      const state = makeState({
        repetitions: 3,
        intervalDays: 8,
        easeFactor: 2.5,
      });
      const result = schedule(state, "easy", new Date("2026-01-01"));
      expect(result.easeFactor).toBeCloseTo(2.65);
      expect(result.intervalDays).toBe(21); // round(8 * 2.65)
    });

    it("hard multiplies interval by 0.8", () => {
      const state = makeState({
        repetitions: 3,
        intervalDays: 8,
        easeFactor: 2.5,
      });
      const result = schedule(state, "hard", new Date("2026-01-01"));
      expect(result.easeFactor).toBeCloseTo(2.35);
      expect(result.intervalDays).toBe(15); // round(8 * 2.35 * 0.8)
    });

    it("hard interval has floor of 1", () => {
      const state = makeState({
        repetitions: 2,
        intervalDays: 1,
        easeFactor: 1.3,
      });
      const result = schedule(state, "hard", new Date("2026-01-01"));
      expect(result.intervalDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe("easeFactor adjustments", () => {
    it("good leaves easeFactor unchanged", () => {
      const result = schedule(makeState({ easeFactor: 2.5 }), "good", new Date());
      expect(result.easeFactor).toBeCloseTo(2.5);
    });

    it("easy increases easeFactor by 0.15", () => {
      const result = schedule(makeState({ easeFactor: 2.5 }), "easy", new Date());
      expect(result.easeFactor).toBeCloseTo(2.65);
    });

    it("hard decreases easeFactor by 0.15", () => {
      const result = schedule(makeState({ easeFactor: 2.5 }), "hard", new Date());
      expect(result.easeFactor).toBeCloseTo(2.35);
    });

    it("clamps easeFactor to 1.3 floor after hard decrease", () => {
      const result = schedule(makeState({ easeFactor: 1.3 }), "hard", new Date());
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe("preserves unrelated fields", () => {
    it("preserves isWeak when not changed", () => {
      const state = makeState({ isWeak: true, weakMarkedAt: new Date("2026-01-01") });
      const result = schedule(state, "good", new Date("2026-01-02"));
      expect(result.isWeak).toBe(true);
      expect(result.weakMarkedAt).toEqual(state.weakMarkedAt);
    });

    it("preserves questionId", () => {
      const result = schedule(makeState(), "good", new Date());
      expect(result.questionId).toBe("q-001");
    });
  });

  describe("typical progression", () => {
    it("matches SRS expected intervals", () => {
      const now = new Date("2026-01-01");
      let state = makeState();

      // 1st review: Good → 1 day
      state = schedule(state, "good", now);
      expect(state.intervalDays).toBe(1);
      expect(state.repetitions).toBe(1);

      // 2nd review: Good → 3 days
      const day2 = new Date("2026-01-02");
      state = schedule(state, "good", day2);
      expect(state.intervalDays).toBe(3);
      expect(state.repetitions).toBe(2);

      // 3rd review: Good → round(3 * 2.5) = 8 days
      const day5 = new Date("2026-01-05");
      state = schedule(state, "good", day5);
      expect(state.intervalDays).toBe(8);
      expect(state.repetitions).toBe(3);

      // 4th review: Easy → round(8 * 2.65) = 21 days
      const day13 = new Date("2026-01-13");
      state = schedule(state, "easy", day13);
      expect(state.intervalDays).toBe(21);
      expect(state.repetitions).toBe(4);

      // 5th review: Hard → round(round(21 * 2.5) * 0.8) = 42 days
      const day34 = new Date("2026-02-03");
      state = schedule(state, "hard", day34);
      expect(state.intervalDays).toBe(42);
      expect(state.repetitions).toBe(5);
    });
  });
});
