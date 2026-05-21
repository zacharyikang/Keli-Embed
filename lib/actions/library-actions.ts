"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseCardStore, SupabaseQuestionStore } from "@/lib/storage/supabase";
import { listByCompany, listByDirection } from "@/lib/services/library-service";
import type { Question, CardState } from "@/lib/domain";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthError } from "@/lib/errors";

export async function listByCompanyAction(
  companySlug: string,
  userId?: string,
): Promise<
  { question: Question; progress?: { reviewed: number; total: number } }[]
> {
  const supabase = await createServerSupabase();
  const questionStore = new SupabaseQuestionStore(supabase);
  const cardStore = new SupabaseCardStore(supabase);
  return listByCompany(
    { questionStore, cardStore },
    companySlug,
    userId,
  );
}

export async function listByDirectionAction(
  directionSlug: string,
): Promise<Question[]> {
  const supabase = await createServerSupabase();
  const questionStore = new SupabaseQuestionStore(supabase);
  return listByDirection({ questionStore }, directionSlug);
}

export async function listAllQuestionsAction(): Promise<Question[]> {
  const supabase = await createServerSupabase();
  const questionStore = new SupabaseQuestionStore(supabase);
  return questionStore.search({});
}

export async function getCardStatesAction(): Promise<CardState[]> {
  try {
    const supabase = await createServerSupabase();
    const user = await getCurrentUser(supabase);
    if (!user) return [];
    const cardStore = new SupabaseCardStore(supabase);
    return cardStore.findByUser(user.id);
  } catch (err) {
    console.error("Failed to fetch card states:", err);
    return [];
  }
}

export async function updateCardMasteryAction(
  questionId: string,
  isMastered: boolean,
): Promise<void> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const cardStore = new SupabaseCardStore(supabase);
  if (isMastered) {
    const existing = await cardStore.get(user.id, questionId);
    const now = new Date();
    const state: CardState = existing
      ? {
          ...existing,
          intervalDays: 30, // > 21 days for mastery
          totalReviews: existing.totalReviews === 0 ? 1 : existing.totalReviews,
          repetitions: existing.repetitions === 0 ? 1 : existing.repetitions,
          lastReviewedAt: now,
          dueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          lastRating: "easy",
        }
      : {
          questionId,
          easeFactor: 2.5,
          intervalDays: 30,
          repetitions: 1,
          dueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          isWeak: false,
          weakMarkedAt: null,
          lastRating: "easy",
          lastReviewedAt: now,
          totalReviews: 1,
        };
    await cardStore.save(user.id, state);
  } else {
    const existing = await cardStore.get(user.id, questionId);
    if (existing) {
      await cardStore.remove(user.id, questionId);
    }
  }
}

