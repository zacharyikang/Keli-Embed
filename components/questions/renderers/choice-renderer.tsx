"use client";

import { useState } from "react";
import type { Question } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Props = { question: Question; showAnswer: boolean };

export function ChoiceRenderer({ question, showAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const choices = question.choices ?? [];

  function getChoiceState(choiceId: string) {
    if (!showAnswer) {
      return selected === choiceId ? "selected" : "idle";
    }
    const choice = choices.find((c) => c.id === choiceId);
    if (choice?.correct) return "correct";
    if (selected === choiceId && !choice?.correct) return "incorrect";
    return "idle";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{question.body}</p>
      </div>
      <div className="flex flex-col gap-2">
        {choices.map((choice) => {
          const state = getChoiceState(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              disabled={showAnswer}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(choice.id);
              }}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors",
                state === "idle" && "hover:bg-muted/50",
                state === "selected" && "border-foreground/40 bg-muted",
                state === "correct" && "border-success/40 bg-success/10",
                state === "incorrect" && "border-error/40 bg-error/10",
              )}
            >
              <span className="flex size-5.5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold">
                {choice.id.toUpperCase()}
              </span>
              <span className="pt-0.5 leading-relaxed text-[13px] sm:text-sm">{choice.text}</span>
            </button>
          );
        })}
      </div>
      {showAnswer && question.explanation && (
        <div className="mt-2 rounded-lg border bg-muted/50 p-3.5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">解析</h3>
          <p className="text-[13px] text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
