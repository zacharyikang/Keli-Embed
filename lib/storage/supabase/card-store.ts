import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardState, ReviewLog } from "@/lib/domain";
import type { CardStore } from "@/lib/storage/card-store";

type CardRow = {
  question_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  is_weak: boolean;
  weak_marked_at: string | null;
  last_rating: string | null;
  last_reviewed_at: string | null;
  total_reviews: number;
};

function mapRowToCardState(row: CardRow): CardState {
  return {
    questionId: row.question_id,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueAt: new Date(row.due_at),
    isWeak: row.is_weak,
    weakMarkedAt: row.weak_marked_at ? new Date(row.weak_marked_at) : null,
    lastRating: row.last_rating as CardState["lastRating"],
    lastReviewedAt: row.last_reviewed_at
      ? new Date(row.last_reviewed_at)
      : null,
    totalReviews: row.total_reviews,
  };
}

function mapCardStateToRow(
  state: CardState,
): Omit<CardRow, "question_id"> {
  return {
    ease_factor: state.easeFactor,
    interval_days: state.intervalDays,
    repetitions: state.repetitions,
    due_at: state.dueAt.toISOString(),
    is_weak: state.isWeak,
    weak_marked_at: state.weakMarkedAt?.toISOString() ?? null,
    last_rating: state.lastRating,
    last_reviewed_at: state.lastReviewedAt?.toISOString() ?? null,
    total_reviews: state.totalReviews,
  };
}

export class SupabaseCardStore implements CardStore {
  constructor(private supabase: SupabaseClient) {}

  async get(
    userId: string,
    questionId: string,
  ): Promise<CardState | null> {
    const { data } = await this.supabase
      .from("user_card_states")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .maybeSingle();

    return data ? mapRowToCardState(data as CardRow) : null;
  }

  async getMany(
    userId: string,
    questionIds: string[],
  ): Promise<CardState[]> {
    const { data } = await this.supabase
      .from("user_card_states")
      .select("*")
      .eq("user_id", userId)
      .in("question_id", questionIds);

    return (data as CardRow[] | null)?.map(mapRowToCardState) ?? [];
  }

  async findByUser(userId: string): Promise<CardState[]> {
    const { data } = await this.supabase
      .from("user_card_states")
      .select("*")
      .eq("user_id", userId);

    return (data as CardRow[] | null)?.map(mapRowToCardState) ?? [];
  }

  async findDueOrWeak(userId: string, now: Date): Promise<CardState[]> {
    const { data } = await this.supabase
      .from("user_card_states")
      .select("*")
      .eq("user_id", userId)
      .or(`is_weak.eq.true,due_at.lte.${now.toISOString()}`);

    return (data as CardRow[] | null)?.map(mapRowToCardState) ?? [];
  }

  async save(userId: string, state: CardState): Promise<void> {
    const { error } = await this.supabase.from("user_card_states").upsert({
      user_id: userId,
      question_id: state.questionId,
      ...mapCardStateToRow(state),
    });
    if (error) throw error;
  }

  async saveWithLog(
    userId: string,
    state: CardState,
    log: Omit<ReviewLog, "id" | "userId">,
  ): Promise<void> {
    // Note: RPC relies on auth.uid() inside the database. If there's no auth session (e.g. in tests with service_role),
    // we perform the operations via direct inserts to support service_role context.
    const userResponse = await this.supabase.auth.getUser();
    if (!userResponse.data.user) {
      // Direct inserts for test/service-role environment
      const { error: stateError } = await this.supabase.from("user_card_states").upsert({
        user_id: userId,
        question_id: state.questionId,
        ...mapCardStateToRow(state),
      });
      if (stateError) throw stateError;

      const { error: logError } = await this.supabase.from("review_logs").insert({
        user_id: userId,
        question_id: log.questionId,
        rating: log.rating,
        prev_interval: log.prevInterval,
        next_interval: log.nextInterval,
        mode: log.mode,
        queue_source: log.queueSource,
        client_id: log.clientId,
        reviewed_at: log.reviewedAt.toISOString(),
      });
      if (logError) throw logError;
      return;
    }

    const { error } = await this.supabase.rpc("save_review_with_log", {
      p_question_id: state.questionId,
      p_ease_factor: state.easeFactor,
      p_interval_days: state.intervalDays,
      p_repetitions: state.repetitions,
      p_due_at: state.dueAt.toISOString(),
      p_is_weak: state.isWeak,
      p_weak_marked_at: state.weakMarkedAt?.toISOString() ?? null,
      p_last_rating: state.lastRating,
      p_last_reviewed_at: state.lastReviewedAt?.toISOString() ?? null,
      p_total_reviews: state.totalReviews,
      p_rating: log.rating,
      p_prev_interval: log.prevInterval,
      p_next_interval: log.nextInterval,
      p_mode: log.mode,
      p_queue_source: log.queueSource,
      p_client_id: log.clientId,
      p_reviewed_at: log.reviewedAt.toISOString(),
    });
    if (error) throw error;
  }

  async remove(userId: string, questionId: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_card_states")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
    if (error) throw error;
  }
}
