import { describe, it, expect } from "vitest";
import { emptyCardState, type CardState } from "@/lib/domain";

describe("emptyCardState", () => {
  it("creates default state with given questionId", () => {
    const state = emptyCardState("q-001");
    expect(state.questionId).toBe("q-001");
  });

  it("sets default easeFactor to 2.5", () => {
    const state = emptyCardState("test");
    expect(state.easeFactor).toBe(2.5);
  });

  it("sets intervalDays to 0", () => {
    const state = emptyCardState("test");
    expect(state.intervalDays).toBe(0);
  });

  it("sets repetitions to 0", () => {
    const state = emptyCardState("test");
    expect(state.repetitions).toBe(0);
  });

  it("sets dueAt to epoch (0)", () => {
    const state = emptyCardState("test");
    expect(state.dueAt.getTime()).toBe(0);
  });

  it("sets isWeak to false", () => {
    const state = emptyCardState("test");
    expect(state.isWeak).toBe(false);
  });

  it("sets weakMarkedAt to null", () => {
    const state = emptyCardState("test");
    expect(state.weakMarkedAt).toBeNull();
  });

  it("sets lastRating to null", () => {
    const state = emptyCardState("test");
    expect(state.lastRating).toBeNull();
  });

  it("sets lastReviewedAt to null", () => {
    const state = emptyCardState("test");
    expect(state.lastReviewedAt).toBeNull();
  });

  it("sets totalReviews to 0", () => {
    const state = emptyCardState("test");
    expect(state.totalReviews).toBe(0);
  });
});

describe("CardState type", () => {
  it("allows valid ratings for lastRating", () => {
    const state: CardState = {
      ...emptyCardState("test"),
      lastRating: "good",
    };
    expect(state.lastRating).toBe("good");
  });

  it("rejects invalid rating at type level (compile check)", () => {
    // @ts-expect-error - invalid rating
    const state: CardState = { ...emptyCardState("test"), lastRating: "bad" };
    expect(state).toBeDefined();
  });
});
