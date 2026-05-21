import type { SupabaseClient, User } from "@supabase/supabase-js";

// Temporarily returns a default user — login bypassed
const DEFAULT_USER = {
  id: "default-user",
  email: "dev@embedstudio.local",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
} satisfies Partial<User> as unknown as User;

export async function getCurrentUser(
  _supabase: SupabaseClient,
): Promise<User | null> {
  return DEFAULT_USER;
}
