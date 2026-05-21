import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewLog } from "@/lib/domain";
import type { ReviewLogStore } from "@/lib/storage/review-log-store";

type LogRow = {
  id: number;
  user_id: string;
  question_id: string;
  rating: string;
  prev_interval: number;
  next_interval: number;
  mode: string;
  queue_source: string;
  client_id: string | null;
  reviewed_at: string;
};

function mapRowToLog(row: LogRow): ReviewLog {
  return {
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    rating: row.rating as ReviewLog["rating"],
    prevInterval: row.prev_interval,
    nextInterval: row.next_interval,
    mode: row.mode as ReviewLog["mode"],
    queueSource: row.queue_source as ReviewLog["queueSource"],
    clientId: row.client_id,
    reviewedAt: new Date(row.reviewed_at),
  };
}

export class SupabaseReviewLogStore implements ReviewLogStore {
  constructor(private supabase: SupabaseClient) {}

  async append(
    _userId: string,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void> {
    const { error } = await this.supabase.from("review_logs").insert({
      question_id: log.questionId,
      rating: log.rating,
      prev_interval: log.prevInterval,
      next_interval: log.nextInterval,
      mode: log.mode,
      queue_source: log.queueSource,
      client_id: log.clientId,
      reviewed_at: log.reviewedAt.toISOString(),
    });
    if (error) throw error;
  }

  async findByUser(
    _userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ReviewLog[]> {
    let query = this.supabase
      .from("review_logs")
      .select("*")
      .order("reviewed_at", { ascending: false });

    if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);
    else if (limit) query = query.limit(limit);

    const { data } = await query;
    return (data as LogRow[] | null)?.map(mapRowToLog) ?? [];
  }

  async countByDateRange(
    _userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<string, number>> {
    const { data } = await this.supabase
      .from("review_logs")
      .select("reviewed_at")
      .gte("reviewed_at", start.toISOString())
      .lte("reviewed_at", end.toISOString());

    const rows = data as { reviewed_at: string }[] | null;
    const result: Record<string, number> = {};
    for (const row of rows ?? []) {
      const dateKey = row.reviewed_at.slice(0, 10);
      result[dateKey] = (result[dateKey] ?? 0) + 1;
    }
    return result;
  }
}
