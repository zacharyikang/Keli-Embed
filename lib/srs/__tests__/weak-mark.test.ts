import { describe, it, expect } from "vitest";
import { markAsWeak, maybeUnmarkWeak } from "@/lib/srs";
import { emptyCardState } from "@/lib/domain";

describe("markAsWeak", () => {
  it("creates new card state when state is null", () => {
    const now = new Date("2026-01-01");
    const result = markAsWeak(null, "q-001", now);
    expect(result.questionId).toBe("q-001");
    expect(result.isWeak).toBe(true);
    expect(result.weakMarkedAt).toEqual(now);
    expect(result.dueAt).toEqual(now);
  });

  it("marks existing state as weak", () => {
    const now = new Date("2026-01-01");
    const state = emptyCardState("q-001");
    const result = markAsWeak(state, "q-001", now);
    expect(result.isWeak).toBe(true);
    expect(result.weakMarkedAt).toEqual(now);
  });

  it("sets dueAt to now so card appears in today queue", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const result = markAsWeak(null, "q-001", now);
    expect(result.dueAt).toEqual(now);
  });

  it("preserves SRS parameters from existing state", () => {
    const state = { ...emptyCardState("q-001"), repetitions: 3, intervalDays: 8, easeFactor: 2.3 };
    const result = markAsWeak(state, "q-001", new Date());
    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(8);
    expect(result.easeFactor).toBe(2.3);
  });

  it("preserves lastRating from existing state", () => {
    const state = { ...emptyCardState("q-001"), lastRating: "good" as const };
    const result = markAsWeak(state, "q-001", new Date());
    expect(result.lastRating).toBe("good");
  });
});

describe("maybeUnmarkWeak", () => {
  it("no-op if card is not weak", () => {
    const state = emptyCardState("q-001");
    const result = maybeUnmarkWeak(state, "good");
    expect(result).toBe(state);
  });

  it("removes weak flag after 2 consecutive good-or-better ratings", () => {
    const state = {
      ...emptyCardState("q-001"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01"),
      lastRating: "good" as const,
    };
    const result = maybeUnmarkWeak(state, "good");
    expect(result.isWeak).toBe(false);
    expect(result.weakMarkedAt).toBeNull();
  });

  it("removes weak flag after good then easy", () => {
    const state = {
      ...emptyCardState("q-001"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01"),
      lastRating: "good" as const,
    };
    const result = maybeUnmarkWeak(state, "easy");
    expect(result.isWeak).toBe(false);
  });

  it("does not unmark if only one good rating", () => {
    const state = {
      ...emptyCardState("q-001"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01"),
      lastRating: "hard" as const,
    };
    const result = maybeUnmarkWeak(state, "good");
    expect(result.isWeak).toBe(true);
  });

  it("does not unmark after again rating even if last was good", () => {
    const state = {
      ...emptyCardState("q-001"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01"),
      lastRating: "good" as const,
    };
    const result = maybeUnmarkWeak(state, "again");
    expect(result.isWeak).toBe(true);
  });

  it("does not unmark after hard even if last was good", () => {
    const state = {
      ...emptyCardState("q-001"),
      isWeak: true,
      weakMarkedAt: new Date("2026-01-01"),
      lastRating: "good" as const,
    };
    const result = maybeUnmarkWeak(state, "hard");
    expect(result.isWeak).toBe(true);
  });
});
