"use client";

import Link from "next/link";
import type { Question } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const difficultyLabel: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const difficultyVariant: Record<string, "default" | "secondary" | "destructive"> = {
  easy: "default",
  medium: "secondary",
  hard: "destructive",
};

const typeLabel: Record<string, string> = {
  concept: "概念题",
  choice: "选择题",
  "code-reading": "读代码",
};

export function QuestionListItem({
  question,
  progress,
}: {
  question: Question;
  progress?: number | null;
}) {
  return (
    <Link
      href={`/q/${question.id}`}
      className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {question.id}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border shrink-0",
              question.difficulty === "easy" && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
              question.difficulty === "medium" && "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
              question.difficulty === "hard" && "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20"
            )}
          >
            {difficultyLabel[question.difficulty] ?? question.difficulty}
          </Badge>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {typeLabel[question.type] ?? question.type}
          </Badge>
        </div>
        <p className="mt-1 text-sm font-medium truncate">{question.title}</p>
        {question.tags.length > 0 && (
          <div className="mt-0.5 flex gap-1 flex-wrap">
            {question.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {question.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{question.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {progress !== undefined && progress !== null && (
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "text-xs font-medium",
              progress >= 100 ? "text-success" : "text-muted-foreground",
            )}
          >
            {progress >= 100 ? "已掌握" : `${progress}%`}
          </span>
        </div>
      )}

      {/* Chevron */}
      <svg
        className="size-4 shrink-0 text-muted-foreground/50"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
