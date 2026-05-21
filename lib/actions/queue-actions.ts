"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseCardStore, SupabaseQuestionStore } from "@/lib/storage/supabase";
import { getTodayQueue } from "@/lib/services/queue-service";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthError } from "@/lib/errors";
import type { ScheduledCard } from "@/lib/srs";

export async function getTodayQueueAction(): Promise<ScheduledCard[]> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const cardStore = new SupabaseCardStore(supabase);
  const questionStore = new SupabaseQuestionStore(supabase);
  return getTodayQueue(
    { cardStore, questionStore },
    user.id,
    new Date(),
  );
}
