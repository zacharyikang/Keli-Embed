/**
 * Script to upsert questions from markdown files into Supabase.
 *
 * Usage: npx tsx lib/content/sync.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL env vars.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { parseMarkdownQuestion } from "./parse-markdown";
import { validateQuestionBatch } from "./validate";
import type { Question } from "@/lib/domain";

function readMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...readMarkdownFiles(fullPath));
    } else if (extname(entry) === ".md") {
      files.push(fullPath);
    }
  }

  return files;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertQuestions(supabase: Awaited<ReturnType<typeof createClient<any>>>, questions: Question[]) {
  for (const q of questions) {
    const { error } = await supabase.from("questions").upsert(
      {
        id: q.id,
        title: q.title,
        body: q.body,
        type: q.type,
        direction: q.direction,
        difficulty: q.difficulty,
        tags: q.tags,
        answer: q.answer,
        explanation: q.explanation,
        choices: q.choices,
        companies: q.companies,
        interview_year: q.interviewYear,
        interview_round: q.interviewRound,
        source: q.source,
        is_premium: q.isPremium,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error(`Error upserting ${q.id}:`, error.message);
    } else {
      console.log(`Upserted: ${q.id} - ${q.title}`);
    }
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    );
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient<any>(supabaseUrl, serviceRoleKey);

  const contentDir = join(process.cwd(), "content", "questions");
  console.log(`Reading markdown files from: ${contentDir}`);

  const files = readMarkdownFiles(contentDir);
  console.log(`Found ${files.length} markdown files`);

  const questions: Question[] = [];
  const parseErrors: string[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const question = parseMarkdownQuestion(content);
      questions.push(question);
    } catch (err) {
      parseErrors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (parseErrors.length > 0) {
    console.error("Parse errors:");
    for (const err of parseErrors) {
      console.error(`  ${err}`);
    }
  }

  if (questions.length === 0) {
    console.error("No valid questions found");
    process.exit(1);
  }

  // Validate
  const validation = validateQuestionBatch(questions);
  if (validation.errors.length > 0) {
    console.error("Validation errors:");
    for (const err of validation.errors) {
      console.error(`  [${err.questionId}] ${err.field}: ${err.message}`);
    }
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn("Validation warnings:");
    for (const w of validation.warnings) {
      console.warn(`  [${w.questionId}] ${w.field}: ${w.message}`);
    }
  }

  console.log(`Upserting ${questions.length} questions...`);
  await upsertQuestions(supabase, questions);
  console.log("Sync complete.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
