/**
 * Extract seed.json from markdown files.
 *
 * Usage: npx tsx lib/content/extract-seed.ts
 */

import { writeFileSync, readFileSync, readdirSync, statSync } from "fs";
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

function main() {
  const contentDir = join(process.cwd(), "content", "questions");
  const outputPath = join(process.cwd(), "public", "seed.json");

  console.log(`Reading markdown files from: ${contentDir}`);

  const files = readMarkdownFiles(contentDir);
  console.log(`Found ${files.length} markdown files`);

  const questions: Question[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const question = parseMarkdownQuestion(content);
      questions.push(question);
      console.log(`  Parsed: ${question.id}`);
    } catch (err) {
      console.error(`  Error in ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (questions.length === 0) {
    console.error("No valid questions found");
    process.exit(1);
  }

  const validation = validateQuestionBatch(questions);
  if (validation.errors.length > 0) {
    console.error("Validation errors:");
    for (const err of validation.errors) {
      console.error(`  [${err.questionId}] ${err.field}: ${err.message}`);
    }
    process.exit(1);
  }

  const seed = {
    version: new Date().toISOString().slice(0, 10),
    questions,
  };

  writeFileSync(outputPath, JSON.stringify(seed, null, 2), "utf-8");
  console.log(`Written ${questions.length} questions to ${outputPath}`);
}

main();
