import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { LocalCardStore } from "@/lib/storage/local";
import { SupabaseCardStore } from "@/lib/storage/supabase";
import type { CardStore } from "@/lib/storage/card-store";
import { emptyCardState } from "@/lib/domain";

function createTestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const userA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const testUserIds = [userA, userB];
const runSupabaseContracts = process.env.RUN_SUPABASE_CONTRACTS === "1";

const cardStoreQuestionIds = [
  "rt-q-001",
  "gm-q-001",
  "gm-q-002",
  "gm-q-003",
  "fb-q-001",
  "fb-q-002",
  "fd-due-1",
  "fd-weak-1",
  "fd-future-1",
  "wf-weak-1",
  "sw-q-001",
  "rm-q-001",
  "q-a",
  "q-b",
  "up-q-001",
  "dt-q",
];

describe.each([
  ["LocalCardStore", () => new LocalCardStore()] as const,
  ...(runSupabaseContracts
    ? [["SupabaseCardStore", () => new SupabaseCardStore(createTestClient())] as const]
    : []),
])("CardStore contract: %s", (name, createStore) => {
  let store: CardStore;

  beforeAll(async () => {
    if (name === "SupabaseCardStore") {
      const client = createTestClient();
      
      // Clean up states
      await client.from("user_card_states").delete().in("user_id", testUserIds);
      // Clean up logs
      await client.from("review_logs").delete().in("user_id", testUserIds);

      // Create test questions
      const questionsToUpsert = cardStoreQuestionIds.map(id => ({
        id,
        title: `Test Question ${id}`,
        body: `Test Body ${id}`,
        type: "concept",
        direction: "c-language",
        difficulty: "easy",
        answer: "Test Answer",
      }));
      await client.from("questions").upsert(questionsToUpsert);

      // Create test users in parallel
      await Promise.all(
        testUserIds.map(async (uid) => {
          await client.auth.admin.deleteUser(uid).catch(() => {});
          const { error } = await client.auth.admin.createUser({
            id: uid,
            email: `test-${uid}@example.com`,
            password: "password123",
            email_confirm: true,
          });
          if (error) {
            console.error(`Failed to create test user ${uid}:`, error);
          }
        })
      );
    }
  });

  afterAll(async () => {
    if (name === "SupabaseCardStore") {
      const client = createTestClient();
      // Clean up states
      await client.from("user_card_states").delete().in("user_id", testUserIds);
      // Clean up logs
      await client.from("review_logs").delete().in("user_id", testUserIds);
      // Clean up questions
      await client.from("questions").delete().in("id", cardStoreQuestionIds);
      // Clean up users
      await Promise.all(
        testUserIds.map(async (uid) => {
          await client.auth.admin.deleteUser(uid).catch(() => {});
        })
      );
    }
  });

  beforeEach(async () => {
    store = createStore();
    try {
      globalThis.localStorage?.clear();
    } catch {}

    if (name === "SupabaseCardStore") {
      const client = createTestClient();
      await client.from("user_card_states").delete().in("user_id", testUserIds);
      await client.from("review_logs").delete().in("user_id", testUserIds);
    }
  });

  it("save + get roundtrip", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "11111111-1111-1111-1111-111111111111";
    const state = emptyCardState("rt-q-001");
    await store.save(userId, state);
    const got = await store.get(userId, "rt-q-001");
    expect(got).toMatchObject({ questionId: "rt-q-001", easeFactor: 2.5 });
  });

  it("get returns null for unknown questionId", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "22222222-2222-2222-2222-222222222222";
    const got = await store.get(userId, "nonexistent");
    expect(got).toBeNull();
  });

  it("getMany returns all requested cards", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "33333333-3333-3333-3333-333333333333";
    await store.save(userId, emptyCardState("gm-q-001"));
    await store.save(userId, emptyCardState("gm-q-002"));
    await store.save(userId, emptyCardState("gm-q-003"));

    const results = await store.getMany(userId, ["gm-q-001", "gm-q-003"]);
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.questionId).sort()).toEqual([
      "gm-q-001",
      "gm-q-003",
    ]);
  });

  it("findByUser returns all cards for user", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "44444444-4444-4444-4444-444444444444";
    await store.save(userId, emptyCardState("fb-q-001"));
    await store.save(userId, emptyCardState("fb-q-002"));

    const cards = await store.findByUser(userId);
    expect(cards).toHaveLength(2);
  });

  it("findDueOrWeak returns only due or weak cards", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "55555555-5555-5555-5555-555555555555";
    const now = new Date("2026-05-20T12:00:00Z");
    const past = new Date("2026-05-19T12:00:00Z");
    const future = new Date("2026-05-21T12:00:00Z");

    const dueCard = { ...emptyCardState("fd-due-1"), dueAt: past };
    const weakCard = {
      ...emptyCardState("fd-weak-1"),
      isWeak: true,
      dueAt: future,
    };
    const futureCard = {
      ...emptyCardState("fd-future-1"),
      dueAt: future,
    };

    await store.save(userId, dueCard);
    await store.save(userId, weakCard);
    await store.save(userId, futureCard);

    const result = await store.findDueOrWeak(userId, now);
    const ids = result.map((c) => c.questionId);
    expect(ids).toContain("fd-due-1");
    expect(ids).toContain("fd-weak-1");
    expect(ids).not.toContain("fd-future-1");
  });

  it("findDueOrWeak returns weak cards even if dueAt is in future", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "66666666-6666-6666-6666-666666666666";
    const now = new Date("2026-05-20T12:00:00Z");
    const future = new Date("2026-05-21T12:00:00Z");

    const weakCard = {
      ...emptyCardState("wf-weak-1"),
      isWeak: true,
      weakMarkedAt: now,
      dueAt: future,
    };

    await store.save(userId, weakCard);
    const result = await store.findDueOrWeak(userId, now);
    expect(result).toHaveLength(1);
  });

  it("saveWithLog persists state", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "77777777-7777-7777-7777-777777777777";
    const now = new Date("2026-05-20T12:00:00Z");
    const state = emptyCardState("sw-q-001");

    await store.saveWithLog(userId, state, {
      questionId: "sw-q-001",
      rating: "good",
      prevInterval: 0,
      nextInterval: 1,
      mode: "review",
      queueSource: "due",
      clientId: null,
      reviewedAt: now,
    });

    const got = await store.get(userId, "sw-q-001");
    expect(got).not.toBeNull();
    expect(got?.questionId).toBe("sw-q-001");
  });

  it("remove deletes card", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "88888888-8888-8888-8888-888888888888";
    await store.save(userId, emptyCardState("rm-q-001"));
    await store.remove(userId, "rm-q-001");

    const got = await store.get(userId, "rm-q-001");
    expect(got).toBeNull();
  });

  it("user data is isolated by userId", async () => {
    const uidA = name === "SupabaseCardStore" ? userA : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const uidB = name === "SupabaseCardStore" ? userB : "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    await store.save(uidA, emptyCardState("q-a"));
    await store.save(uidB, emptyCardState("q-b"));

    const cardsA = await store.findByUser(uidA);
    const cardsB = await store.findByUser(uidB);

    expect(cardsA).toHaveLength(1);
    expect(cardsA[0].questionId).toBe("q-a");
    expect(cardsB).toHaveLength(1);
    expect(cardsB[0].questionId).toBe("q-b");
  });

  it("save updates existing card", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "99999999-9999-9999-9999-999999999999";
    const original = emptyCardState("up-q-001");
    await store.save(userId, original);

    const updated = { ...original, easeFactor: 2.0, repetitions: 3 };
    await store.save(userId, updated);

    const got = await store.get(userId, "up-q-001");
    expect(got?.easeFactor).toBe(2.0);
    expect(got?.repetitions).toBe(3);
  });

  it("Date fields roundtrip correctly", async () => {
    const userId = name === "SupabaseCardStore" ? userA : "10101010-1010-1010-1010-101010101010";
    const dueAt = new Date("2026-06-01T08:00:00Z");
    const markedAt = new Date("2026-05-15T12:00:00Z");
    const reviewedAt = new Date("2026-05-10T10:00:00Z");

    const state = {
      ...emptyCardState("dt-q"),
      dueAt,
      isWeak: true,
      weakMarkedAt: markedAt,
      lastReviewedAt: reviewedAt,
    };

    await store.save(userId, state);
    const got = await store.get(userId, "dt-q");

    expect(got?.dueAt).toBeInstanceOf(Date);
    expect(got?.dueAt.toISOString()).toBe(dueAt.toISOString());
    expect(got?.weakMarkedAt).toBeInstanceOf(Date);
    expect(got?.weakMarkedAt?.toISOString()).toBe(markedAt.toISOString());
    expect(got?.lastReviewedAt).toBeInstanceOf(Date);
    expect(got?.lastReviewedAt?.toISOString()).toBe(reviewedAt.toISOString());
  });
});
