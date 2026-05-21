import type { CardState, ReviewLog } from "@/lib/domain";
import type { CardStore } from "@/lib/storage/card-store";

type StoredCardState = Omit<
  CardState,
  "dueAt" | "weakMarkedAt" | "lastReviewedAt"
> & {
  dueAt: string;
  weakMarkedAt: string | null;
  lastReviewedAt: string | null;
};

type StoredReviewLog = Omit<ReviewLog, "reviewedAt"> & {
  reviewedAt: string;
};

function serialize(card: CardState): StoredCardState {
  return {
    ...card,
    dueAt: card.dueAt.toISOString(),
    weakMarkedAt: card.weakMarkedAt?.toISOString() ?? null,
    lastReviewedAt: card.lastReviewedAt?.toISOString() ?? null,
  };
}

function deserialize(stored: StoredCardState): CardState {
  return {
    ...stored,
    dueAt: new Date(stored.dueAt),
    weakMarkedAt: stored.weakMarkedAt ? new Date(stored.weakMarkedAt) : null,
    lastReviewedAt: stored.lastReviewedAt
      ? new Date(stored.lastReviewedAt)
      : null,
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

export class LocalCardStore implements CardStore {
  private getKey(userId: string): string {
    return `embedstudio:card_states:${userId}`;
  }

  private readAll(userId: string): Record<string, CardState> {
    const raw = getItem(this.getKey(userId));
    if (!raw) return {};
    const stored = JSON.parse(raw) as Record<string, StoredCardState>;
    const result: Record<string, CardState> = {};
    for (const [id, s] of Object.entries(stored)) {
      result[id] = deserialize(s);
    }
    return result;
  }

  private writeAll(userId: string, data: Record<string, CardState>): void {
    const stored: Record<string, StoredCardState> = {};
    for (const [id, card] of Object.entries(data)) {
      stored[id] = serialize(card);
    }
    setItem(this.getKey(userId), JSON.stringify(stored));
  }

  async get(
    userId: string,
    questionId: string,
  ): Promise<CardState | null> {
    const all = this.readAll(userId);
    return all[questionId] ?? null;
  }

  async getMany(
    userId: string,
    questionIds: string[],
  ): Promise<CardState[]> {
    const all = this.readAll(userId);
    return questionIds.map((id) => all[id]).filter(Boolean) as CardState[];
  }

  async findByUser(userId: string): Promise<CardState[]> {
    return Object.values(this.readAll(userId));
  }

  async findDueOrWeak(userId: string, now: Date): Promise<CardState[]> {
    const all = this.readAll(userId);
    return Object.values(all).filter(
      (c) => c.isWeak || c.dueAt <= now,
    );
  }

  async save(userId: string, state: CardState): Promise<void> {
    const all = this.readAll(userId);
    all[state.questionId] = state;
    this.writeAll(userId, all);
  }

  async saveWithLog(
    userId: string,
    state: CardState,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void> {
    const all = this.readAll(userId);
    all[state.questionId] = state;
    this.writeAll(userId, all);

    const logKey = `embedstudio:review_logs:${userId}`;
    const raw = getItem(logKey);
    const logs: StoredReviewLog[] = raw ? JSON.parse(raw) : [];
    const reviewLog: ReviewLog = {
      ...log,
      userId,
    };
    logs.push({
      ...reviewLog,
      reviewedAt: reviewLog.reviewedAt.toISOString(),
    });
    setItem(logKey, JSON.stringify(logs));
  }

  async remove(userId: string, questionId: string): Promise<void> {
    const all = this.readAll(userId);
    delete all[questionId];
    this.writeAll(userId, all);
  }
}
