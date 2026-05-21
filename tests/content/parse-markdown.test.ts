import { describe, it, expect } from "vitest";
import { parseMarkdownQuestion } from "@/lib/content/parse-markdown";

describe("parseMarkdownQuestion", () => {
  it("parses a basic concept question", () => {
    const md = `---
id: "test-001"
title: "测试题目"
type: "concept"
direction: "c-language"
difficulty: "easy"
tags: ["tag1", "tag2"]
answer: "这是一个答案"
explanation: "这是解析"
companies: ["company-a", "company-b"]
interviewYear: 2023
interviewRound: "一面"
isPremium: false
---
这是题目内容。`;

    const result = parseMarkdownQuestion(md);

    expect(result.id).toBe("test-001");
    expect(result.title).toBe("测试题目");
    expect(result.type).toBe("concept");
    expect(result.direction).toBe("c-language");
    expect(result.difficulty).toBe("easy");
    expect(result.tags).toEqual(["tag1", "tag2"]);
    expect(result.answer).toBe("这是一个答案");
    expect(result.explanation).toBe("这是解析");
    expect(result.companies).toEqual(["company-a", "company-b"]);
    expect(result.interviewYear).toBe(2023);
    expect(result.interviewRound).toBe("一面");
    expect(result.isPremium).toBe(false);
    expect(result.body).toBe("这是题目内容。");
    expect(result.choices).toBeNull();
    expect(result.source).toBeNull();
  });

  it("parses a question with minimal fields", () => {
    const md = `---
id: "minimal-001"
title: "最小题目"
type: "concept"
direction: "mcu"
difficulty: "medium"
answer: "简短答案"
---
题目内容`;

    const result = parseMarkdownQuestion(md);

    expect(result.id).toBe("minimal-001");
    expect(result.tags).toEqual([]);
    expect(result.companies).toEqual([]);
    expect(result.explanation).toBeNull();
    expect(result.interviewYear).toBeNull();
    expect(result.interviewRound).toBeNull();
    expect(result.isPremium).toBe(false);
  });

  it("throws on missing frontmatter", () => {
    const md = "No frontmatter here.";

    expect(() => parseMarkdownQuestion(md)).toThrow("No frontmatter found");
  });

  it("throws on missing required fields", () => {
    const md = `---
title: "No ID"
---
Body`;

    expect(() => parseMarkdownQuestion(md)).toThrow("Missing required field: id");
  });

  it("throws on invalid type", () => {
    const md = `---
id: "bad-001"
title: "Bad"
type: "invalid-type"
direction: "test"
difficulty: "easy"
answer: "ans"
---
Body`;

    expect(() => parseMarkdownQuestion(md)).toThrow("Invalid type");
  });

  it("throws on invalid difficulty", () => {
    const md = `---
id: "bad-001"
title: "Bad"
type: "concept"
direction: "test"
difficulty: "super-hard"
answer: "ans"
---
Body`;

    expect(() => parseMarkdownQuestion(md)).toThrow("Invalid difficulty");
  });

  it("parses a choice question with choices", () => {
    const md = `---
id: "choice-001"
title: "选择题"
type: "choice"
direction: "c-language"
difficulty: "easy"
answer: "A"
choices: [{"id": "A", "text": "选项A", "correct": true}, {"id": "B", "text": "选项B", "correct": false}]
---
题目内容`;

    const result = parseMarkdownQuestion(md);

    expect(result.type).toBe("choice");
    expect(result.choices).toHaveLength(2);
    expect(result.choices![0].id).toBe("A");
    expect(result.choices![0].correct).toBe(true);
    expect(result.choices![1].id).toBe("B");
    expect(result.choices![1].correct).toBe(false);
  });

  it("parses tags as multi-line list", () => {
    const md = `---
id: "multitag-001"
title: "多标签"
type: "concept"
direction: "mcu"
difficulty: "hard"
tags:
  - tag1
  - tag2
  - tag3
answer: "ans"
---
Body`;

    const result = parseMarkdownQuestion(md);

    expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("handles empty tags", () => {
    const md = `---
id: "notag-001"
title: "无标签"
type: "concept"
direction: "mcu"
difficulty: "easy"
tags: []
answer: "ans"
---
Body`;

    const result = parseMarkdownQuestion(md);

    expect(result.tags).toEqual([]);
  });

  it("parses multi-line answer", () => {
    const md = `---
id: "multi-001"
title: "多行答案"
type: "concept"
direction: "mcu"
difficulty: "medium"
answer: "第一行答案\\n第二行答案"
---
内容`;

    const result = parseMarkdownQuestion(md);

    expect(result.answer).toBe("第一行答案\\n第二行答案");
  });

  it("parses premium flag", () => {
    const md = `---
id: "premium-001"
title: "付费"
type: "concept"
direction: "linux-embedded"
difficulty: "hard"
answer: "ans"
isPremium: true
---
内容`;

    const result = parseMarkdownQuestion(md);

    expect(result.isPremium).toBe(true);
  });

  it("parses source field", () => {
    const md = `---
id: "src-001"
title: "来源"
type: "concept"
direction: "rtos"
difficulty: "easy"
answer: "ans"
source: "FreeRTOS 官方文档"
---
内容`;

    const result = parseMarkdownQuestion(md);

    expect(result.source).toBe("FreeRTOS 官方文档");
  });
});
