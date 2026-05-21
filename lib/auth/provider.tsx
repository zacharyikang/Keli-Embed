"use client";

import { createContext, useState, useCallback, type ReactNode } from "react";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/storage/supabase/client";

const MOCK_USER: User = {
  id: "default-user",
  email: "dev@embedstudio.local",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
} as User;

type AuthState = {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  loading: boolean;
};

export const AuthContext = createContext<AuthState>({
  supabase: null!,
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabase());
  const [user] = useState<User | null>(MOCK_USER);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ supabase, user, session: null, signOut, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}
