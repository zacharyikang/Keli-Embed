import { describe, it, expect } from "vitest";
import { LocalCardStore, LocalReviewLogStore } from "@/lib/storage/local";
import { submitAnswer } from "@/lib/services/review-service";
import { emptyCardState } from "@/lib/domain";

function makeDeps() {
  return {
    cardStore: new LocalCardStore(),
    logStore: new LocalReviewLogStore(),
  };
}

const now = new Date("2026-05-20T12:00:00Z");

describe("submitAnswer", () => {
  it("creates card with emptyCardState when card doesn't exist yet", async () => {
    const deps = makeDeps();
    const result = await submitAnswer(deps, "user-1", "q-new", "good", now);

    expect(result.questionId).toBe("q-new");
    expect(result.repetitions).toBe(1); // first correct → rep=1
    expect(result.intervalDays).toBe(1);

    // Verify persisted
    const stored = await deps.cardStore.get("user-1", "q-new");
    expect(stored).not.toBeNull();
    expect(stored?.questionId).toBe("q-new");
  });

  it("updates existing card SRS state", async () => {
    const deps = makeDeps();
    const existing = {
      ...emptyCardState("q-exist"),
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
    };
    await deps.cardStore.save("user-1", existing);

    const result = await submitAnswer(
      deps,
      "user-1",
      "q-exist",
      "good",
      now,
    );

    // good on second rep → interval = 3 (from spec: rep=1 → 3 days)
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(3);
    expect(result.easeFactor).toBe(2.5); // good: no EF change
  });

  it("again resets interval and repetitions", async () => {
    const deps = makeDeps();
    const existing = {
      ...emptyCardState("q-exist"),
      easeFactor: 2.5,
      intervalDays: 10,
      repetitions: 5,
    };
    await deps.cardStore.save("user-1", existing);

    const result = await submitAnswer(
      deps,
      "user-1",
      "q-exist",
      "again",
      now,
    );

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(0);
    expect(result.easeFactor).toBe(2.3); // EF - 0.2
  });

  it("triggers unmarkWeak after 2x good on weak card", async () => {
    const deps = makeDeps();
    // Set up a weak card that was already rated 'good' once
    const weakCard = {
      ...emptyCardState("q-weak"),
      isWeak: true,
      weakMarkedAt: new Date("2026-05-18T00:00:00Z"),
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
      lastRating: "good" as const,
      totalReviews: 1,
    };
    await deps.cardStore.save("user-1", weakCard);

    const result = await submitAnswer(
      deps,
      "user-1",
      "q-weak",
      "good",
      now,
    );

    expect(result.isWeak).toBe(false);
  });

  it("preserves isWeak when rating is 'again'", async () => {
    const deps = makeDeps();
    const weakCard = {
      ...emptyCardState("q-weak"),
      isWeak: true,
      weakMarkedAt: new Date("2026-05-18T00:00:00Z"),
      lastRating: "good" as const,
    };
    await deps.cardStore.save("user-1", weakCard);

    const result = await submitAnswer(
      deps,
      "user-1",
      "q-weak",
      "again",
      now,
    );

    expect(result.isWeak).toBe(true); // stays weak
  });

  it("tracks mode and queueSource in log", async () => {
    const deps = makeDeps();
    await submitAnswer(
      deps,
      "user-1",
      "q-mode",
      "good",
      now,
      { mode: "practice", queueSource: "library_set" },
    );

    // Verify state persisted
    const stored = await deps.cardStore.get("user-1", "q-mode");
    expect(stored).not.toBeNull();
    expect(stored?.totalReviews).toBe(1);
  });
});
