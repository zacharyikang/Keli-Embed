"use client";

import { useCallback, useMemo, useState } from "react";
import type { Question, CardState } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConceptRenderer } from "./renderers/concept-renderer";
import { ChoiceRenderer } from "./renderers/choice-renderer";
import { CodeReadingRenderer } from "./renderers/code-reading-renderer";

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

type Props = {
  question: Question;
  card: CardState;
  flipped?: boolean;
  onFlip?: () => void;
};

function QuestionMeta({ question }: { question: Question }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter uppercase">{question.id}</span>
      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-md border-muted-foreground/20">{question.direction}</Badge>
      <Badge variant={difficultyVariant[question.difficulty] ?? "default"} className="text-[10px] uppercase font-bold tracking-wider rounded-md">
        {difficultyLabel[question.difficulty] ?? question.difficulty}
      </Badge>
      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-md border-muted-foreground/20">{typeLabel[question.type] ?? question.type}</Badge>
    </div>
  );
}

export function QuestionCard({ question, flipped, onFlip }: Props) {
  const handleClick = useCallback(() => {
    if (!flipped) {
      onFlip?.();
    }
  }, [flipped, onFlip]);

  const frontRenderer = useMemo(() => {
    switch (question.type) {
      case "concept":
        return <ConceptRenderer question={question} showAnswer={false} />;
      case "choice":
        return <ChoiceRenderer question={question} showAnswer={false} />;
      case "code-reading":
        return <CodeReadingRenderer question={question} showAnswer={false} />;
    }
  }, [question]);

  const backRenderer = useMemo(() => {
    switch (question.type) {
      case "concept":
        return <ConceptRenderer question={question} showAnswer={true} />;
      case "choice":
        return <ChoiceRenderer question={question} showAnswer={true} />;
      case "code-reading":
        return <CodeReadingRenderer question={question} showAnswer={true} />;
    }
  }, [question]);

  return (
    <div className={cn("flip-container w-full max-w-2xl mx-auto min-h-[400px] animate-slide-up")}>
      <div className={cn("flip-inner relative w-full h-full", flipped ? "flip-flipped" : "flip-front")}>
        {/* Front */}
        <Card
          className="flip-face flip-front cursor-pointer select-none h-full glass glass-dark rounded-[2rem] border-2 border-white/5 shadow-2xl transition-all duration-500 hover:border-brand/30 group"
          onClick={handleClick}
        >
          <CardHeader className="p-8 pb-4">
            <QuestionMeta question={question} />
            <CardTitle className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-brand transition-colors">{question.title}</CardTitle>
            {question.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] rounded-full bg-white/5 border-none px-2.5">{tag}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="mt-4 opacity-80 leading-relaxed">
              {frontRenderer}
            </div>
            {!flipped && (
              <div className="mt-12 flex flex-col items-center gap-2">
                 <div className="h-px w-12 bg-muted-foreground/20" />
                 <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  点击查看答案
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back */}
        <Card className="flip-face flip-back h-full glass glass-dark rounded-[2rem] border-2 border-brand/20 shadow-[0_0_50px_-12px_var(--color-brand)]">
          <CardHeader className="p-8 pb-4">
            <QuestionMeta question={question} />
            <CardTitle className="text-2xl md:text-3xl font-bold leading-tight text-brand">{question.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 overflow-y-auto max-h-[300px] custom-scrollbar">
            <div className="leading-relaxed">
              {backRenderer}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


