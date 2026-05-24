import { describe, expect, it } from "vitest";
import { SupabaseReviewLogStore } from "@/lib/storage/supabase";

type Operation = [string, unknown?];

class FakeQuery {
  operations: Operation[] = [];

  constructor(private response: unknown = { data: [], error: null }) {}

  select(value: string) {
    this.operations.push(["select", value]);
    return this;
  }

  eq(column: string, value: unknown) {
    this.operations.push(["eq", { column, value }]);
    return this;
  }

  gte(column: string, value: unknown) {
    this.operations.push(["gte", { column, value }]);
    return this;
  }

  lte(column: string, value: unknown) {
    this.operations.push(["lte", { column, value }]);
    return this;
  }

  order(column: string, options: unknown) {
    this.operations.push(["order", { column, options }]);
    return this;
  }

  range(from: number, to: number) {
    this.operations.push(["range", { from, to }]);
    return this;
  }

  limit(value: number) {
    this.operations.push(["limit", value]);
    return this;
  }

  insert(payload: unknown) {
    this.operations.push(["insert", payload]);
    return { error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.response).then(onfulfilled, onrejected);
  }
}

function makeStore(response?: unknown) {
  const query = new FakeQuery(response);
  const supabase = {
    from: (table: string) => {
      query.operations.push(["from", table]);
      return query;
    },
  };

  return {
    query,
    store: new SupabaseReviewLogStore(supabase as never),
  };
}

describe("SupabaseReviewLogStore", () => {
  it("append writes the user id into review_logs", async () => {
    const { store, query } = makeStore();

    await store.append("user-1", {
      questionId: "q1",
      rating: "good",
      prevInterval: 0,
      nextInterval: 1,
      mode: "review",
      queueSource: "due",
      clientId: null,
      reviewedAt: new Date("2026-05-20T12:00:00Z"),
    });

    expect(query.operations).toContainEqual([
      "insert",
      expect.objectContaining({ user_id: "user-1" }),
    ]);
  });

  it("findByUser filters review logs by user id", async () => {
    const { store, query } = makeStore({ data: [], error: null });

    await store.findByUser("user-1", 10, 5);

    expect(query.operations).toContainEqual([
      "eq",
      { column: "user_id", value: "user-1" },
    ]);
  });

  it("countByDateRange filters review logs by user id", async () => {
    const { store, query } = makeStore({ data: [], error: null });

    await store.countByDateRange(
      "user-1",
      new Date("2026-05-01T00:00:00Z"),
      new Date("2026-05-31T23:59:59Z"),
    );

    expect(query.operations).toContainEqual([
      "eq",
      { column: "user_id", value: "user-1" },
    ]);
  });
});
