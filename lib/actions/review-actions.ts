"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseCardStore, SupabaseReviewLogStore } from "@/lib/storage/supabase";
import { submitAnswer } from "@/lib/services/review-service";
import { markAsWeak } from "@/lib/srs";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthError } from "@/lib/errors";
import type { Rating } from "@/lib/domain";

export async function submitAnswerAction(
  qid: string,
  rating: Rating,
): Promise<void> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const cardStore = new SupabaseCardStore(supabase);
  const logStore = new SupabaseReviewLogStore(supabase);
  await submitAnswer(
    { cardStore, logStore },
    user.id,
    qid,
    rating,
    new Date(),
  );
}

export async function toggleWeakAction(qid: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const cardStore = new SupabaseCardStore(supabase);
  const prev = await cardStore.get(user.id, qid);

  if (prev?.isWeak) {
    await cardStore.save(user.id, {
      ...prev,
      isWeak: false,
      weakMarkedAt: null,
    });
    return false;
  }

  const state = markAsWeak(prev ?? null, qid, new Date());
  await cardStore.save(user.id, state);
  return true;
}
