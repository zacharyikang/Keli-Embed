import type { CardState, ReviewLog } from "@/lib/domain";

export interface CardStore {
  get(userId: string, questionId: string): Promise<CardState | null>;
  getMany(userId: string, questionIds: string[]): Promise<CardState[]>;
  findByUser(userId: string): Promise<CardState[]>;
  findDueOrWeak(userId: string, now: Date): Promise<CardState[]>;
  save(userId: string, state: CardState): Promise<void>;
  saveWithLog(
    userId: string,
    state: CardState,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void>;
  remove(userId: string, questionId: string): Promise<void>;
}
