import type { ReviewLog } from "@/lib/domain";

export interface ReviewLogStore {
  append(
    userId: string,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void>;
  findByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ReviewLog[]>;
  countByDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<string, number>>;
}
