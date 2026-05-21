import type { Question } from "@/lib/domain";

const VALID_TYPES = ["concept", "choice", "code-reading"] as const;
const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const VALID_ROUNDS = ["笔试", "一面", "二面", "三面", "终面"];

export type ValidationError = {
  questionId: string;
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
};

export function validateQuestion(question: Question): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  function addError(field: string, message: string) {
    errors.push({ questionId: question.id, field, message });
  }

  function addWarning(field: string, message: string) {
    warnings.push({ questionId: question.id, field, message });
  }

  // Required string fields
  if (!question.id || typeof question.id !== "string") {
    addError("id", "id is required and must be a string");
  } else if (!/^[a-z0-9_-]+$/i.test(question.id)) {
    addWarning("id", "id should match [a-z0-9_-]");
  }

  if (!question.title || typeof question.title !== "string") {
    addError("title", "title is required");
  }

  if (!question.body || typeof question.body !== "string") {
    addError("body", "body is required");
  }

  if (!question.answer || typeof question.answer !== "string") {
    addError("answer", "answer is required");
  }

  if (!question.direction || typeof question.direction !== "string") {
    addError("direction", "direction is required");
  }

  // Type validation
  if (!VALID_TYPES.includes(question.type as typeof VALID_TYPES[number])) {
    addError("type", `type must be one of ${VALID_TYPES.join(", ")}`);
  }

  // Difficulty validation
  if (!VALID_DIFFICULTIES.includes(question.difficulty as typeof VALID_DIFFICULTIES[number])) {
    addError("difficulty", `difficulty must be one of ${VALID_DIFFICULTIES.join(", ")}`);
  }

  // Interview round validation
  if (
    question.interviewRound !== null &&
    !VALID_ROUNDS.includes(question.interviewRound)
  ) {
    addError("interviewRound", `interviewRound must be one of ${VALID_ROUNDS.join(", ")} or null`);
  }

  // Tags validation
  if (!Array.isArray(question.tags)) {
    addError("tags", "tags must be an array");
  }

  // Companies validation
  if (!Array.isArray(question.companies)) {
    addError("companies", "companies must be an array");
  }

  // Choices validation (only for choice type)
  if (question.type === "choice") {
    if (!question.choices || question.choices.length < 2) {
      addError("choices", "choice type questions must have at least 2 choices");
    } else {
      const hasCorrect = question.choices.some((c) => c.correct);
      if (!hasCorrect) {
        addError("choices", "choice type questions must have exactly one correct choice");
      }
    }
  }

  // Warnings
  if (question.tags.length === 0) {
    addWarning("tags", "no tags provided");
  }

  if (question.body.length < 10) {
    addWarning("body", "body is very short");
  }

  if (question.answer.length < 5) {
    addWarning("answer", "answer is very short");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateQuestionBatch(questions: Question[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const seenIds = new Map<string, number>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const result = validateQuestion(q);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);

    // Check duplicate ids
    const prevIdx = seenIds.get(q.id);
    if (prevIdx !== undefined) {
      allErrors.push({
        questionId: q.id,
        field: "id",
        message: `Duplicate id: previously seen at index ${prevIdx}`,
      });
    } else {
      seenIds.set(q.id, i);
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
}
