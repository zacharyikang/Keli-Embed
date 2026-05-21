import type { User } from "@/lib/domain";
import type { ProfileStore } from "@/lib/storage/profile-store";

type StoredUser = Omit<User, "lastActiveAt" | "createdAt"> & {
  lastActiveAt: string;
  createdAt: string;
};

function serialize(user: User): StoredUser {
  return {
    ...user,
    lastActiveAt: user.lastActiveAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
  };
}

function deserialize(stored: StoredUser): User {
  return {
    ...stored,
    lastActiveAt: new Date(stored.lastActiveAt),
    createdAt: new Date(stored.createdAt),
  };
}

const memStore: Map<string, string> = new Map();

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memStore.get(key) ?? null;
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memStore.set(key, value);
  }
}

export class LocalProfileStore implements ProfileStore {
  private getKey(userId: string): string {
    return `embedstudio:profile:${userId}`;
  }

  async get(userId: string): Promise<User | null> {
    const raw = getItem(this.getKey(userId));
    if (!raw) return null;
    return deserialize(JSON.parse(raw) as StoredUser);
  }

  async upsert(profile: User): Promise<void> {
    setItem(
      this.getKey(profile.id),
      JSON.stringify(serialize(profile)),
    );
  }

  async updateStreak(
    userId: string,
    lastActiveAt: Date,
  ): Promise<void> {
    const profile = await this.get(userId);
    if (!profile) return;
    profile.lastActiveAt = lastActiveAt;
    await this.upsert(profile);
  }
}
