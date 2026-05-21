import type { Question } from "@/lib/domain";
import type { QuestionStore, QuestionFilters } from "@/lib/storage/question-store";
import seedData from "../../../public/seed.json";

export class LocalQuestionStore implements QuestionStore {
  private questions: Question[];

  constructor(questions?: Question[]) {
    this.questions = questions ?? (seedData.questions as Question[]);
  }

  async getById(id: string): Promise<Question | null> {
    return this.questions.find((q) => q.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Question[]> {
    const idSet = new Set(ids);
    return this.questions.filter((q) => idSet.has(q.id));
  }

  async findByDirection(direction: string): Promise<Question[]> {
    return this.questions.filter((q) => q.direction === direction);
  }

  async findByCompany(companySlug: string): Promise<Question[]> {
    return this.questions.filter((q) => q.companies.includes(companySlug));
  }

  async findNewCandidates(
    _userId: string,
    _limit: number,
  ): Promise<Question[]> {
    // Params intentionally unused — LocalStore returns all questions.
    // Service layer uses CardStore to filter learned questions.
    void _userId;
    void _limit;
    return this.questions;
  }

  async search(filters: QuestionFilters): Promise<Question[]> {
    return this.questions.filter((q) => {
      if (filters.direction && q.direction !== filters.direction) return false;
      if (filters.companySlug && !q.companies.includes(filters.companySlug))
        return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty)
        return false;
      if (filters.type && q.type !== filters.type) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          q.title.toLowerCase().includes(s) ||
          q.body.toLowerCase().includes(s) ||
          q.tags.some((t) => t.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }
}
