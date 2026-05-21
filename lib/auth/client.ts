"use client";

import { useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./provider";

export function useUser(): User | null {
  return useContext(AuthContext).user;
}

export function useAuthLoading(): boolean {
  return useContext(AuthContext).loading;
}

export function useSession(): Session | null {
  return useContext(AuthContext).session;
}

export function useSignOut(): () => Promise<void> {
  return useContext(AuthContext).signOut;
}
