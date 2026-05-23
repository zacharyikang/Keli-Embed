"use client";

import { useCallback, useMemo, useState, useRef } from "react";
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
  nextQuestion?: Question;
  card: CardState;
  flipped?: boolean;
  onFlip?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

function QuestionMeta({ question }: { question: Question }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter uppercase">{question.id}</span>
      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-md border-muted-foreground/20">{question.direction}</Badge>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] uppercase font-bold tracking-wider rounded-md border shrink-0",
          question.difficulty === "easy" && "badge-easy",
          question.difficulty === "medium" && "badge-medium",
          question.difficulty === "hard" && "badge-hard"
        )}
      >
        {difficultyLabel[question.difficulty] ?? question.difficulty}
      </Badge>
      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-md border-muted-foreground/20">{typeLabel[question.type] ?? question.type}</Badge>
    </div>
  );
}

export function QuestionCard({ question, nextQuestion, flipped, onFlip, onSwipeLeft, onSwipeRight }: Props) {
  const handleClick = useCallback(() => {
    onFlip?.();
  }, [onFlip]);

  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwipePending = useRef(false);

  const [hasFlipped, setHasFlipped] = useState(false);
  const [prevFlipped, setPrevFlipped] = useState(flipped);

  if (flipped !== prevFlipped) {
    setPrevFlipped(flipped);
    setHasFlipped(true);
  }

  const dragThreshold = 5;
  const swipeThreshold = 100;

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    isSwipePending.current = true;
    setIsDragging(true);
    setOffsetX(0);
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number, e: { preventDefault: () => void }) => {
    if (!isDragging) return;
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    if (isSwipePending.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absY > dragThreshold && absY > absX) {
        // Vertical scroll taking place, cancel horizontal swipe drag
        setIsDragging(false);
        isSwipePending.current = false;
        setOffsetX(0);
        return;
      }
      if (absX > dragThreshold) {
        // Confirmed horizontal swipe
        isSwipePending.current = false;
      }
    }

    if (!isSwipePending.current) {
      e.preventDefault();
      setOffsetX(deltaX);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    isSwipePending.current = false;

    if (offsetX > swipeThreshold) {
      setOffsetX(600);
      onSwipeRight?.();
    } else if (offsetX < -swipeThreshold) {
      setOffsetX(-600);
      onSwipeLeft?.();
    } else {
      setOffsetX(0);
    }
  }, [isDragging, offsetX, onSwipeLeft, onSwipeRight]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest(".custom-scrollbar")) {
      return;
    }
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY, e);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest(".custom-scrollbar")) {
      return;
    }
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY, e);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

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
    <div className="relative w-full max-w-3xl mx-auto h-[480px] sm:h-[540px] select-none">
      {/* Background card (Next Card Stack) */}
      {nextQuestion && (
        <div 
          className="absolute inset-0 w-full h-full glass glass-dark rounded-2xl border border-white/5 select-none pointer-events-none"
          style={{
            transform: `scale(${0.95 + Math.min(0.05, (Math.abs(offsetX) / swipeThreshold) * 0.05)}) translateY(${10 - Math.min(10, (Math.abs(offsetX) / swipeThreshold) * 10)}px)`,
            opacity: 0.3 + Math.min(0.7, (Math.abs(offsetX) / swipeThreshold) * 0.7),
            transition: isDragging ? "none" : "transform 0.4s ease, opacity 0.4s ease",
            zIndex: 10,
          }}
        >
          {/* Skeleton or simple preview of next question */}
          <div className="p-4 sm:p-5 h-full flex flex-col justify-between opacity-30">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-12 bg-white/10 rounded-md animate-pulse" />
                <div className="h-4 w-16 bg-white/10 rounded-md animate-pulse" />
                <div className="h-4 w-10 bg-white/10 rounded-md animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-white/10 rounded-md animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active card wrapper */}
      <div 
        className={cn("flip-container w-full h-full animate-slide-up relative select-none")}
        style={{
          transform: `translateX(${offsetX}px) rotate(${offsetX * 0.04}deg)`,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          zIndex: 20,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Swipe Left stamp: "重来 / AGAIN" */}
        <div 
          className={cn(
            "absolute top-8 right-8 border-4 border-destructive text-destructive font-black uppercase tracking-widest px-4 py-2 rounded-xl text-xs md:text-sm pointer-events-none select-none z-30 flex items-center gap-1.5 shadow-lg bg-background/95 stamp-distressed",
            offsetX < -swipeThreshold ? "animate-stamp-bounce-left" : "transition-opacity duration-75 rotate-12"
          )}
          style={{ opacity: offsetX < -swipeThreshold ? 1 : (offsetX < 0 ? Math.min(1, Math.abs(offsetX) / swipeThreshold) : 0) }}
        >
          <span className="size-2 rounded-full bg-destructive animate-pulse" />
          重来 / AGAIN
        </div>

        {/* Swipe Right stamp: "掌握 / GOOD" */}
        <div 
          className={cn(
            "absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-black uppercase tracking-widest px-4 py-2 rounded-xl text-xs md:text-sm pointer-events-none select-none z-30 flex items-center gap-1.5 shadow-lg bg-background/95 stamp-distressed",
            offsetX > swipeThreshold ? "animate-stamp-bounce-right" : "transition-opacity duration-75 -rotate-12"
          )}
          style={{ opacity: offsetX > swipeThreshold ? 1 : (offsetX > 0 ? Math.min(1, Math.abs(offsetX) / swipeThreshold) : 0) }}
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          掌握 / GOOD
        </div>

        <div className={cn("flip-inner relative w-full h-full", hasFlipped ? (flipped ? "animate-flip-to-back" : "animate-flip-to-front") : (flipped ? "flip-flipped" : "flip-front"))}>
          {/* Front */}
          <Card
            className="flip-face flip-front cursor-pointer select-none h-full flex flex-col glass glass-dark rounded-2xl border border-white/5 transition-all duration-500 hover:border-brand/30 group"
            onClick={handleClick}
          >
            <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 shrink-0">
              <QuestionMeta question={question} />
              <CardTitle className="text-base sm:text-lg font-bold leading-tight group-hover:text-brand transition-colors">{question.title}</CardTitle>
              {question.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] rounded-full bg-white/5 border-none px-2.5">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="mt-2 opacity-80 leading-relaxed flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                {frontRenderer}
              </div>
              {!flipped && (
                <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1.5 pt-4 shrink-0">
                   <div className="h-px w-10 bg-muted-foreground/20" />
                   <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    点击查看答案
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className="flip-face flip-back cursor-pointer select-none h-full flex flex-col glass glass-dark rounded-2xl border border-brand/20 transition-all duration-500 hover:border-brand/40 group"
            onClick={handleClick}
          >
            <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 shrink-0">
              <QuestionMeta question={question} />
              <CardTitle className="text-base sm:text-lg font-bold leading-tight text-brand">{question.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="leading-relaxed flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                {backRenderer}
              </div>
              {flipped && (
                <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1.5 pt-4 shrink-0">
                   <div className="h-px w-10 bg-brand/20" />
                   <p className="text-[10px] text-brand/60 font-medium uppercase tracking-widest">
                    点击返回题目
                   </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SVG Ink Distress Filter definition */}
      <svg className="hidden">
        <defs>
          <filter id="ink-distress">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}


