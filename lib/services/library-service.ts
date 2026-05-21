import type { QuestionStore, CardStore } from "@/lib/storage";
import type { Question } from "@/lib/domain";

export async function listByCompany(
  deps: { questionStore: QuestionStore; cardStore?: CardStore },
  companySlug: string,
  userId?: string,
): Promise<
  { question: Question; progress?: { reviewed: number; total: number } }[]
> {
  const questions = await deps.questionStore.findByCompany(companySlug);

  if (!userId || !deps.cardStore) {
    return questions.map((question) => ({ question }));
  }

  const questionIds = questions.map((q) => q.id);
  const cards = await deps.cardStore.getMany(userId, questionIds);
  const reviewedCount = cards.filter((c) => c.totalReviews > 0).length;

  return questions.map((question) => ({
    question,
    progress: { reviewed: reviewedCount, total: questions.length },
  }));
}

export async function listByDirection(
  deps: { questionStore: QuestionStore },
  directionSlug: string,
): Promise<Question[]> {
  return deps.questionStore.findByDirection(directionSlug);
}
