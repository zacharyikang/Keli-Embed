import { describe, it, expect } from "vitest";
import { validateQuestion, validateQuestionBatch } from "@/lib/content/validate";
import type { Question } from "@/lib/domain";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "test-001",
    title: "测试题目",
    body: "题目内容测试",
    type: "concept",
    direction: "c-language",
    difficulty: "easy",
    tags: ["tag1"],
    answer: "正确答案",
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

describe("validateQuestion", () => {
  it("validates a correct question", () => {
    const result = validateQuestion(makeQuestion());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("requires id", () => {
    const result = validateQuestion(makeQuestion({ id: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "id")).toBe(true);
  });

  it("requires title", () => {
    const result = validateQuestion(makeQuestion({ title: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
  });

  it("requires body", () => {
    const result = validateQuestion(makeQuestion({ body: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "body")).toBe(true);
  });

  it("requires answer", () => {
    const result = validateQuestion(makeQuestion({ answer: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "answer")).toBe(true);
  });

  it("requires valid type", () => {
    const result = validateQuestion(makeQuestion({ type: "invalid" as Question["type"] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "type")).toBe(true);
  });

  it("requires valid difficulty", () => {
    const result = validateQuestion(makeQuestion({ difficulty: "extreme" as Question["difficulty"] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("requires valid interviewRound", () => {
    const result = validateQuestion(
      makeQuestion({ interviewRound: "四面" as Question["interviewRound"] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "interviewRound")).toBe(true);
  });

  it("allows null interviewRound", () => {
    const result = validateQuestion(makeQuestion({ interviewRound: null }));
    expect(result.valid).toBe(true);
  });

  it("validates choice type has choices", () => {
    const result = validateQuestion(
      makeQuestion({ type: "choice", choices: [] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("validates choice type has correct answer", () => {
    const result = validateQuestion(
      makeQuestion({
        type: "choice",
        choices: [
          { id: "A", text: "A", correct: false },
          { id: "B", text: "B", correct: false },
        ],
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("warns on empty tags", () => {
    const result = validateQuestion(makeQuestion({ tags: [] }));
    expect(result.warnings.some((w) => w.field === "tags")).toBe(true);
  });

  it("warns on short body", () => {
    const result = validateQuestion(makeQuestion({ body: "ab" }));
    expect(result.warnings.some((w) => w.field === "body")).toBe(true);
  });

  it("warns on short answer", () => {
    const result = validateQuestion(makeQuestion({ answer: "ab" }));
    expect(result.warnings.some((w) => w.field === "answer")).toBe(true);
  });
});

describe("validateQuestionBatch", () => {
  it("detects duplicate ids", () => {
    const result = validateQuestionBatch([
      makeQuestion({ id: "dup-001" }),
      makeQuestion({ id: "dup-001" }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
  });

  it("reports all errors across batch", () => {
    const result = validateQuestionBatch([
      makeQuestion({ id: "" }),
      makeQuestion({ id: "valid-001" }),
      makeQuestion({ id: "bad-type", type: "invalid" as Question["type"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("passes for valid batch", () => {
    const result = validateQuestionBatch([
      makeQuestion({ id: "a-001" }),
      makeQuestion({ id: "a-002" }),
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
