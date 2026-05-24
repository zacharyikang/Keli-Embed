"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseQuestionStore, SupabaseCardStore } from "@/lib/storage/supabase";
import { getCurrentUser } from "@/lib/auth/server";
import type { Question, CardState } from "@/lib/domain";

export async function getRandomQuestionsAction(
  limit = 20,
  filters?: { direction?: string; companySlug?: string },
): Promise<Question[]> {
  const supabase = await createServerSupabase();
  const questionStore = new SupabaseQuestionStore(supabase);

  const all = await questionStore.search({
    direction: filters?.direction,
    companySlug: filters?.companySlug,
  });

  // Shuffle and take limit
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export async function getWeakCardsAction(): Promise<
  { question: Question; card: CardState }[]
> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) return [];

  const cardStore = new SupabaseCardStore(supabase);
  const questionStore = new SupabaseQuestionStore(supabase);

  const states = await cardStore.findDueOrWeak(user.id, new Date());
  const weakStates = states.filter((s) => s.isWeak);

  if (weakStates.length === 0) return [];

  const questionIds = weakStates.map((s) => s.questionId);
  const questions = await questionStore.findByIds(questionIds);

  return weakStates.map((card) => {
    const question = questions.find((q) => q.id === card.questionId);
    return { question: question!, card };
  }).filter((item) => item.question !== undefined);
}
