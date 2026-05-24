import type { SupabaseClient } from "@supabase/supabase-js";
import type { Question } from "@/lib/domain";
import type { QuestionStore, QuestionFilters } from "@/lib/storage/question-store";

function mapRowToQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    type: row.type as Question["type"],
    direction: row.direction as string,
    difficulty: row.difficulty as Question["difficulty"],
    tags: (row.tags as string[]) ?? [],
    answer: row.answer as string,
    explanation: (row.explanation as string) ?? null,
    choices: (row.choices as Question["choices"]) ?? null,
    companies: (row.companies as string[]) ?? [],
    interviewYear: (row.interview_year as number) ?? null,
    interviewRound: (row.interview_round as Question["interviewRound"]) ?? null,
    source: (row.source as string) ?? null,
    isPremium: (row.is_premium as boolean) ?? false,
  };
}

function formatPostgrestInList(values: readonly string[]): string {
  const quoted = values.map((value) => {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  });
  return `(${quoted.join(",")})`;
}

export class SupabaseQuestionStore implements QuestionStore {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<Question | null> {
    const { data, error } = await this.supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToQuestion(data) : null;
  }

  async findByIds(ids: string[]): Promise<Question[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .from("questions")
      .select("*")
      .in("id", ids)
      .is("deleted_at", null);

    if (error) throw error;
    return (data as Record<string, unknown>[] | null)?.map(mapRowToQuestion) ?? [];
  }

  async findByDirection(direction: string): Promise<Question[]> {
    const { data, error } = await this.supabase
      .from("questions")
      .select("*")
      .eq("direction", direction)
      .is("deleted_at", null);

    if (error) throw error;
    return (data as Record<string, unknown>[] | null)?.map(mapRowToQuestion) ?? [];
  }

  async findByCompany(companySlug: string): Promise<Question[]> {
    const { data, error } = await this.supabase
      .from("questions")
      .select("*")
      .contains("companies", [companySlug])
      .is("deleted_at", null);

    if (error) throw error;
    return (data as Record<string, unknown>[] | null)?.map(mapRowToQuestion) ?? [];
  }

  async findNewCandidates(
    _userId: string,
    limit: number,
    excludeQuestionIds: readonly string[] = [],
  ): Promise<Question[]> {
    let query = this.supabase
      .from("questions")
      .select("*")
      .is("deleted_at", null);

    if (excludeQuestionIds.length > 0) {
      query = query.not("id", "in", formatPostgrestInList(excludeQuestionIds));
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return (data as Record<string, unknown>[] | null)?.map(mapRowToQuestion) ?? [];
  }

  async search(filters: QuestionFilters): Promise<Question[]> {
    let query = this.supabase.from("questions").select("*").is("deleted_at", null);

    if (filters.direction) {
      query = query.eq("direction", filters.direction);
    }
    if (filters.companySlug) {
      query = query.contains("companies", [filters.companySlug]);
    }
    if (filters.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Record<string, unknown>[] | null)?.map(mapRowToQuestion) ?? [];
  }
}
