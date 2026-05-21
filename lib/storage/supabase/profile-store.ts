import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/lib/domain";
import type { ProfileStore } from "@/lib/storage/profile-store";

type ProfileRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  daily_goal: number;
  streak_count: number;
  last_active_at: string;
  created_at: string;
};

function mapRowToUser(row: ProfileRow): User {
  return {
    id: row.user_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    dailyGoal: row.daily_goal,
    streakCount: row.streak_count,
    lastActiveAt: new Date(row.last_active_at),
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseProfileStore implements ProfileStore {
  constructor(private supabase: SupabaseClient) {}

  async get(userId: string): Promise<User | null> {
    const { data } = await this.supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data ? mapRowToUser(data as ProfileRow) : null;
  }

  async upsert(profile: User): Promise<void> {
    const { error } = await this.supabase.from("user_profiles").upsert({
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatarUrl,
      daily_goal: profile.dailyGoal,
      streak_count: profile.streakCount,
      last_active_at: profile.lastActiveAt.toISOString(),
    });
    if (error) throw error;
  }

  async updateStreak(
    userId: string,
    lastActiveAt: Date,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("user_profiles")
      .update({ last_active_at: lastActiveAt.toISOString() })
      .eq("user_id", userId);
    if (error) throw error;
  }
}
