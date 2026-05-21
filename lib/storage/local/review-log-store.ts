import type { ReviewLog } from "@/lib/domain";
import type { ReviewLogStore } from "@/lib/storage/review-log-store";

type StoredReviewLog = Omit<ReviewLog, "reviewedAt"> & {
  reviewedAt: string;
};

function deserialize(stored: StoredReviewLog): ReviewLog {
  return {
    ...stored,
    reviewedAt: new Date(stored.reviewedAt),
  };
}

function deserializeAll(raw: string | null): ReviewLog[] {
  if (!raw) return [];
  const stored = JSON.parse(raw) as StoredReviewLog[];
  return stored.map(deserialize);
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

export class LocalReviewLogStore implements ReviewLogStore {
  private getKey(userId: string): string {
    return `embedstudio:review_logs:${userId}`;
  }

  async append(
    userId: string,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void> {
    const key = this.getKey(userId);
    const logs = deserializeAll(getItem(key));
    const entry: ReviewLog = { ...log, userId };
    logs.push(entry);
    const stored = logs.map((l) => ({
      ...l,
      reviewedAt: l.reviewedAt.toISOString(),
    }));
    setItem(key, JSON.stringify(stored));
  }

  async findByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ReviewLog[]> {
    const logs = deserializeAll(getItem(this.getKey(userId)));
    const start = offset ?? 0;
    const end = limit ? start + limit : undefined;
    return logs.slice(start, end);
  }

  async countByDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<string, number>> {
    const logs = deserializeAll(getItem(this.getKey(userId)));
    const result: Record<string, number> = {};
    for (const log of logs) {
      if (log.reviewedAt >= start && log.reviewedAt <= end) {
        const dateKey = log.reviewedAt.toISOString().slice(0, 10);
        result[dateKey] = (result[dateKey] ?? 0) + 1;
      }
    }
    return result;
  }
}
