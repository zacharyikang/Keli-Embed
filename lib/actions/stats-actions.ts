"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import {
  SupabaseCardStore,
  SupabaseQuestionStore,
  SupabaseReviewLogStore,
} from "@/lib/storage/supabase";
import { getStats } from "@/lib/services/stats-service";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthError } from "@/lib/errors";
import type { UserStats } from "@/lib/services/stats-service";

export async function getStatsAction(): Promise<UserStats> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const cardStore = new SupabaseCardStore(supabase);
  const logStore = new SupabaseReviewLogStore(supabase);
  const questionStore = new SupabaseQuestionStore(supabase);

  return getStats({ cardStore, logStore, questionStore }, user.id);
}
