import type { Question } from "@/lib/domain";

export type QuestionFilters = {
  direction?: string;
  companySlug?: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: "concept" | "choice" | "code-reading";
  search?: string;
};

export interface QuestionStore {
  getById(id: string): Promise<Question | null>;
  findByIds(ids: string[]): Promise<Question[]>;
  findByDirection(direction: string): Promise<Question[]>;
  findByCompany(companySlug: string): Promise<Question[]>;
  findNewCandidates(userId: string, limit: number): Promise<Question[]>;
  search(filters: QuestionFilters): Promise<Question[]>;
}
