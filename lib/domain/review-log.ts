import type { Rating } from "./rating";

export type ReviewLog = {
  id?: number;
  userId: string;
  questionId: string;
  rating: Rating;
  prevInterval: number;
  nextInterval: number;
  mode: "review" | "practice";
  queueSource: "weak" | "due" | "new" | "practice" | "library_set";
  clientId: string | null;
  reviewedAt: Date;
};
