"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Rating } from "@/lib/domain";
import type { ScheduledCard } from "@/lib/srs";
import { QuestionCard } from "@/components/questions/question-card";
import { RatingBar } from "@/components/questions/rating-bar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitAnswerAction, toggleWeakAction } from "@/lib/actions/review-actions";

type Props = {
  initialQueue: ScheduledCard[];
};

export function TodayClient({ initialQueue }: Props) {
  const [queue, setQueue] = useState(initialQueue);
  const [completedCount, setCompletedCount] = useState(0);
  const [initialTotal] = useState(initialQueue.length);
  const [history, setHistory] = useState<Array<{ queue: ScheduledCard[]; completedCount: number }>>([]);
  const [flipped, setFlipped] = useState(false);
  const [weak, setWeak] = useState(false);
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);

  const current = queue[0] ?? null;
  const progress = initialTotal > 0 ? Math.round((completedCount / initialTotal) * 100) : 0;

  useEffect(() => {
    if (current) {
      setWeak(current.card.isWeak);
    }
  }, [current]);

  const handleFlip = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setFlipped(prev => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    if (queue.length <= 1) return;
    
    // Save snapshot to history
    setHistory(prev => [...prev, { queue, completedCount }]);

    setQueue(prev => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    setFlipped(false);
  }, [queue, completedCount]);

  const handleRate = useCallback(
    async (r: Rating) => {
      if (!current || busyRef.current) return;
      busyRef.current = true;

      // Save snapshot to history
      setHistory(prev => [...prev, { queue, completedCount }]);

      try {
        await submitAnswerAction(current.card.questionId, r);
      } catch {
        // Silently fail — toast system in Phase 9
      }

      if (r === "again") {
        // Re-queue the card 3 slots later (or at the end)
        setQueue(prev => {
          const next = [...prev.slice(1)];
          const insertIdx = Math.min(3, next.length);
          next.splice(insertIdx, 0, prev[0]);
          return next;
        });
        setFlipped(false);
      } else {
        const nextQueue = queue.slice(1);
        setCompletedCount(prev => prev + 1);
        setQueue(nextQueue);
        setFlipped(false);
        if (nextQueue.length === 0) {
          setDone(true);
        }
      }
      busyRef.current = false;
    },
    [current, queue, completedCount],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setQueue(lastState.queue);
    setCompletedCount(lastState.completedCount);
    setHistory(prev => prev.slice(0, -1));
    setFlipped(false);
    setDone(false);
  }, [history]);

  const handleToggleWeak = useCallback(async () => {
    if (!current) return;
    try {
      const isWeak = await toggleWeakAction(current.card.questionId);
      setWeak(isWeak);
      setQueue(prev => {
        const next = [...prev];
        if (next[0]) {
          next[0] = {
            ...next[0],
            card: {
              ...next[0].card,
              isWeak,
            }
          };
        }
        return next;
      });
    } catch {
      // Silently fail
    }
  }, [current]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleFlip();
        return;
      }

      if ((e.key === "s" || e.key === "S") && !busyRef.current) {
        e.preventDefault();
        handleSkip();
        return;
      }

      if ((e.key === "z" || e.key === "Z") && !busyRef.current) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (!flipped || busyRef.current) return;

      switch (e.key) {
        case "1":
          e.preventDefault();
          handleRate("again");
          break;
        case "2":
          e.preventDefault();
          handleRate("hard");
          break;
        case "3":
          e.preventDefault();
          handleRate("good");
          break;
        case "4":
          e.preventDefault();
          handleRate("easy");
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipped, handleFlip, handleRate, handleSkip, handleUndo]);

  // Empty queue
  if (initialTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">今日复习已完成！</h2>
        <p className="text-muted-foreground">明天会有新的题目等待你复习</p>
        <a href="/library" className={cn(buttonVariants({ variant: "outline" }))}>
          去题库看看
        </a>
      </div>
    );
  }

  // Done
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">今日答了 {initialTotal} 题</h2>
        <p className="text-muted-foreground">坚持每天复习，效果更好！</p>
        <div className="flex items-center gap-4">
          {history.length > 0 && (
            <button 
              onClick={handleUndo}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              撤销上一步 (Z)
            </button>
          )}
          <a href="/library" className={cn(buttonVariants({ variant: "default" }))}>
            去题库看看
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-4 md:gap-6 px-6 pt-4 min-h-[90vh] w-full max-w-5xl mx-auto overflow-y-auto">
      {/* Background Depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-foreground/[0.02] blur-[150px] rounded-full -z-10 animate-pulse-glow" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-20" />

      {/* Header Info */}
      <div className="w-full max-w-3xl flex flex-col gap-2 animate-slide-up">
        <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground/60">
          <span className="font-semibold tracking-tight">复习进度：{completedCount} / {initialTotal}</span>
          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <button 
                onClick={handleUndo}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-brand hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1"
                title="按 Z 键撤销上一步操作"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                撤销 / UNDO (Z)
              </button>
            )}
            {queue.length > 1 && (
              <button 
                onClick={handleSkip}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-brand hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                title="按 S 键跳过此题"
              >
                跳过 / SKIP (S)
              </button>
            )}
          </div>
          <span className="font-mono font-semibold">{progress}%</span>
        </div>
        <div className="relative h-1 w-full bg-foreground/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand/80 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Card Section */}
      <div className="w-full flex flex-col gap-4 md:gap-6 items-center">
        {current?.question && (
          <>
            <div className="w-full relative">
               {/* Decorative Side Markers */}
               <div className="absolute -left-12 top-1/2 -translate-y-1/2 h-24 w-1 bg-foreground/5 rounded-full hidden lg:block" />
               <div className="absolute -right-12 top-1/2 -translate-y-1/2 h-24 w-1 bg-foreground/5 rounded-full hidden lg:block" />
               
               <QuestionCard
                key={current.question.id}
                question={current.question}
                card={current.card}
                flipped={flipped}
                isWeak={weak}
                onToggleWeak={handleToggleWeak}
                onFlip={handleFlip}
                onSwipeLeft={() => handleRate("again")}
                onSwipeRight={() => handleRate("good")}
              />
            </div>

            {/* Controller Module */}
            <div className="w-full max-w-3xl flex flex-col gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-full space-y-2">
                <RatingBar
                  onRate={handleRate}
                  disabled={!flipped}
                />

                <div className="flex justify-center pt-1">
                  <div className="flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-foreground/[0.02] border border-foreground/5 shadow-inner">
                    <span className="size-1.5 rounded-full bg-foreground/10" />
                    <p className="text-[9px] text-foreground/40 font-black uppercase tracking-[0.2em]">
                      {flipped
                        ? "Execute Rating Sequence [1-4]"
                        : "Initialize Data Reveal [Space]"}
                    </p>
                    <span className="size-1.5 rounded-full bg-foreground/10" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile spacer to prevent bottom navigation overlap */}
      <div className="h-32 md:h-40 w-full shrink-0" aria-hidden="true" />
    </div>
  );


  );
}

