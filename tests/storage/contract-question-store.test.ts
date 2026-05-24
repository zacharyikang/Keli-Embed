import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { LocalQuestionStore } from "@/lib/storage/local";
import { SupabaseQuestionStore } from "@/lib/storage/supabase";
import type { QuestionStore } from "@/lib/storage/question-store";
import type { Question } from "@/lib/domain";

const seedQuestions: Question[] = [
  {
    id: "q1",
    title: "volatile in ISR",
    body: "...",
    type: "concept",
    direction: "c-language",
    difficulty: "easy",
    tags: ["volatile"],
    answer: "...",
    explanation: null,
    choices: null,
    companies: ["huawei"],
    interviewYear: 2023,
    interviewRound: "笔试",
    source: null,
    isPremium: false,
  },
  {
    id: "q2",
    title: "SPI modes",
    body: "...",
    type: "concept",
    direction: "protocol",
    difficulty: "medium",
    tags: ["SPI"],
    answer: "...",
    explanation: null,
    choices: null,
    companies: ["xiaomi"],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: false,
  },
  {
    id: "q3",
    title: "I2C timing",
    body: "...",
    type: "concept",
    direction: "protocol",
    difficulty: "easy",
    tags: ["I2C"],
    answer: "...",
    explanation: null,
    choices: null,
    companies: ["huawei", "dji"],
    interviewYear: 2022,
    interviewRound: "笔试",
    source: null,
    isPremium: false,
  },
  {
    id: "q4",
    title: "Ring buffer",
    body: "...",
    type: "code-reading",
    direction: "algorithm",
    difficulty: "hard",
    tags: ["buffer"],
    answer: "...",
    explanation: null,
    choices: null,
    companies: [],
    interviewYear: null,
    interviewRound: null,
    source: null,
    isPremium: true,
  },
];

const testIds = ["q1", "q2", "q3", "q4"];
const runSupabaseContracts = process.env.RUN_SUPABASE_CONTRACTS === "1";

function createTestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

describe.each([
  ["LocalQuestionStore", () => new LocalQuestionStore(seedQuestions)] as const,
  ...(runSupabaseContracts
    ? [["SupabaseQuestionStore", () => new SupabaseQuestionStore(createTestClient())] as const]
    : []),
])("QuestionStore contract: %s", (name, createStore) => {
  const store: QuestionStore = createStore();

  beforeAll(async () => {
    if (name === "SupabaseQuestionStore") {
      const client = createTestClient();
      // Clean up first
      await client.from("questions").delete().in("id", testIds);
      // Insert seed questions
      const dbRows = seedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        body: q.body,
        type: q.type,
        direction: q.direction,
        difficulty: q.difficulty,
        tags: q.tags,
        answer: q.answer,
        explanation: q.explanation,
        choices: q.choices,
        companies: q.companies,
        interview_year: q.interviewYear,
        interview_round: q.interviewRound,
        source: q.source,
        is_premium: q.isPremium
      }));
      const { error } = await client.from("questions").insert(dbRows);
      if (error) {
        console.error("Failed to seed questions for SupabaseQuestionStore tests:", error);
      }
    }
  });

  afterAll(async () => {
    if (name === "SupabaseQuestionStore") {
      const client = createTestClient();
      await client.from("questions").delete().in("id", testIds);
    }
  });

  it("getById returns question", async () => {
    const q = await store.getById("q1");
    expect(q).not.toBeNull();
    expect(q?.id).toBe("q1");
    expect(q?.title).toBe("volatile in ISR");
  });

  it("getById returns null for unknown id", async () => {
    const q = await store.getById("nonexistent");
    expect(q).toBeNull();
  });

  it("findByIds returns all requested questions", async () => {
    const results = await store.findByIds(["q1", "q3", "nonexistent"]);
    expect(results).toHaveLength(2);
    expect(results.map((q) => q.id).sort()).toEqual(["q1", "q3"]);
  });

  it("findByIds returns empty for empty array", async () => {
    const results = await store.findByIds([]);
    expect(results).toEqual([]);
  });

  it("findByDirection filters by direction", async () => {
    const rawResults = await store.findByDirection("protocol");
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(2);
    expect(results.every((q) => q.direction === "protocol")).toBe(true);
  });

  it("findByDirection returns empty for unknown direction", async () => {
    const results = await store.findByDirection("unknown-dir");
    expect(results).toEqual([]);
  });

  it("findByCompany returns questions for company", async () => {
    const rawResults = await store.findByCompany("huawei");
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(2);
    expect(results.every((q) => q.companies.includes("huawei"))).toBe(true);
  });

  it("findByCompany returns empty for unknown company", async () => {
    const results = await store.findByCompany("unknown-company");
    expect(results).toEqual([]);
  });

  it("findNewCandidates returns questions", async () => {
    const results = await store.findNewCandidates("any-user", 10);
    expect(results.length).toBeGreaterThan(0);
  });

  it("search by direction filter", async () => {
    const rawResults = await store.search({ direction: "c-language" });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("q1");
  });

  it("search by difficulty filter", async () => {
    const rawResults = await store.search({ difficulty: "easy" });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(2);
    expect(results.every((q) => q.difficulty === "easy")).toBe(true);
  });

  it("search by type filter", async () => {
    const rawResults = await store.search({ type: "code-reading" });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("q4");
  });

  it("search by text matches title and tags", async () => {
    const rawResults = await store.search({ search: "SPI" });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("q2");
  });

  it("search by companySlug filter", async () => {
    const rawResults = await store.search({ companySlug: "dji" });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("q3");
  });

  it("search combines multiple filters", async () => {
    const rawResults = await store.search({
      direction: "protocol",
      difficulty: "easy",
    });
    const results = rawResults.filter(q => testIds.includes(q.id));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("q3");
  });

  it("Question fields match domain type", async () => {
    const q = await store.getById("q1");
    expect(q).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      body: expect.any(String),
      type: expect.any(String),
      direction: expect.any(String),
      difficulty: expect.any(String),
      tags: expect.any(Array),
      answer: expect.any(String),
    });
    expect(["easy", "medium", "hard"]).toContain(q?.difficulty);
    expect(["concept", "choice", "code-reading"]).toContain(q?.type);
  });
});
