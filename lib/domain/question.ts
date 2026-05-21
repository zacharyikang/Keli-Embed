export type QuestionType = "concept" | "choice" | "code-reading";

export type QuestionChoice = {
  id: string;
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  type: QuestionType;
  direction: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  answer: string;
  explanation: string | null;
  choices: QuestionChoice[] | null;
  companies: string[];
  interviewYear: number | null;
  interviewRound: "笔试" | "一面" | "二面" | "三面" | "终面" | null;
  source: string | null;
  isPremium: boolean;
};
