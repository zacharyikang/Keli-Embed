import type { SupabaseClient, User } from "@supabase/supabase-js";

// Temporarily returns a default user — login bypassed
export async function getCurrentUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
