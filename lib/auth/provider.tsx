"use client";

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/storage/supabase/client";

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ supabase, user, session, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
