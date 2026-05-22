import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "@/components/questions/question-card";
import type { Question, CardState } from "@/lib/domain";

const testQuestion: Question = {
  id: "test-q1",
  title: "volatile 关键字的作用",
  body: "请解释 volatile 关键字在嵌入式开发中的作用。",
  type: "concept",
  direction: "c-language",
  difficulty: "easy",
  tags: ["volatile", "C语言"],
  answer: "volatile 告诉编译器不要对变量进行优化，每次访问都必须从内存读取。",
  explanation: "在 ISR 中修改的变量必须标记为 volatile。",
  choices: null,
  companies: ["huawei"],
  interviewYear: 2023,
  interviewRound: "笔试",
  source: null,
  isPremium: false,
};

const testCard: CardState = {
  questionId: "test-q1",
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  dueAt: new Date("2026-05-20"),
  isWeak: false,
  weakMarkedAt: null,
  lastRating: null,
  lastReviewedAt: null,
  totalReviews: 0,
};

function renderCard(props?: Partial<{ question: Question; card: CardState; onFlip: () => void }>) {
  return render(
    <QuestionCard
      question={props?.question ?? testQuestion}
      card={props?.card ?? testCard}
      onFlip={props?.onFlip}
    />,
  );
}

describe("QuestionCard", () => {
  it("renders question title and metadata", () => {
    renderCard();
    expect(screen.getAllByText("volatile 关键字的作用").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("c-language").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("简单").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("概念题").length).toBeGreaterThanOrEqual(1);
  });

  it("renders tags", () => {
    renderCard();
    expect(screen.getAllByText("volatile").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("C语言").length).toBeGreaterThanOrEqual(1);
  });

  it("shows flip hint before flipping", () => {
    renderCard();
    expect(screen.getByText("点击查看答案")).toBeDefined();
  });

  it("shows answer after clicking card", () => {
    renderCard();
    fireEvent.click(screen.getAllByText("volatile 关键字的作用")[0]);
    // Answer appears in both front (showAnswer=true) and back face
    const answers = screen.getAllByText(/volatile 告诉编译器/);
    expect(answers.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onFlip callback", () => {
    const onFlip = vi.fn();
    renderCard({ onFlip });
    fireEvent.click(screen.getAllByText("volatile 关键字的作用")[0]);
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("renders choice question type", () => {
    const choiceQ: Question = {
      ...testQuestion,
      type: "choice",
      choices: [
        { id: "a", text: "选项 A", correct: true },
        { id: "b", text: "选项 B", correct: false },
      ],
    };
    renderCard({ question: choiceQ });
    expect(screen.getAllByText("选择题").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("选项 A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("选项 B").length).toBeGreaterThanOrEqual(1);
  });

  it("renders code-reading question type", () => {
    const codeQ: Question = {
      ...testQuestion,
      type: "code-reading",
      body: "int *p = NULL;\n*p = 42;",
    };
    renderCard({ question: codeQ });
    expect(screen.getAllByText("读代码").length).toBeGreaterThanOrEqual(1);
  });

  it("shows flip back hint and triggers onFlip when flipped is true", () => {
    const onFlip = vi.fn();
    render(
      <QuestionCard
        question={testQuestion}
        card={testCard}
        flipped={true}
        onFlip={onFlip}
      />
    );
    expect(screen.getByText("点击返回题目")).toBeDefined();
    fireEvent.click(screen.getByText("点击返回题目"));
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("triggers onSwipeLeft when swiped left", () => {
    const onSwipeLeft = vi.fn();
    render(
      <QuestionCard
        question={testQuestion}
        card={testCard}
        onSwipeLeft={onSwipeLeft}
      />
    );
    const cardEl = screen.getAllByText("volatile 关键字的作用")[0].closest(".flip-container");
    expect(cardEl).not.toBeNull();
    if (cardEl) {
      fireEvent.touchStart(cardEl, { touches: [{ clientX: 200, clientY: 200 }] });
      fireEvent.touchMove(cardEl, { touches: [{ clientX: 50, clientY: 200 }] }); // -150px delta
      fireEvent.touchEnd(cardEl);
      expect(onSwipeLeft).toHaveBeenCalledOnce();
    }
  });

  it("triggers onSwipeRight when swiped right", () => {
    const onSwipeRight = vi.fn();
    render(
      <QuestionCard
        question={testQuestion}
        card={testCard}
        onSwipeRight={onSwipeRight}
      />
    );
    const cardEl = screen.getAllByText("volatile 关键字的作用")[0].closest(".flip-container");
    expect(cardEl).not.toBeNull();
    if (cardEl) {
      fireEvent.touchStart(cardEl, { touches: [{ clientX: 100, clientY: 200 }] });
      fireEvent.touchMove(cardEl, { touches: [{ clientX: 250, clientY: 200 }] }); // +150px delta
      fireEvent.touchEnd(cardEl);
      expect(onSwipeRight).toHaveBeenCalledOnce();
    }
  });
});
