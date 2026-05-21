"use server";

import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseProfileStore } from "@/lib/storage/supabase";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthError } from "@/lib/errors";
import type { User } from "@/lib/domain";

export async function getProfileAction(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const profileStore = new SupabaseProfileStore(supabase);
  return profileStore.get(user.id);
}

export async function updateDailyGoalAction(dailyGoal: number): Promise<void> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError("未登录");

  const profileStore = new SupabaseProfileStore(supabase);
  const profile = await profileStore.get(user.id);

  if (profile) {
    await profileStore.upsert({ ...profile, dailyGoal });
  } else {
    await profileStore.upsert({
      id: user.id,
      username: null,
      avatarUrl: null,
      dailyGoal,
      streakCount: 0,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });
  }
}
