import type { User } from "@/lib/domain";

export interface ProfileStore {
  get(userId: string): Promise<User | null>;
  upsert(profile: User): Promise<void>;
  updateStreak(userId: string, lastActiveAt: Date): Promise<void>;
}
