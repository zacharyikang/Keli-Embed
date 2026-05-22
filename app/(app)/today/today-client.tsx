"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Rating } from "@/lib/domain";
import type { ScheduledCard } from "@/lib/srs";
import { QuestionCard } from "@/components/questions/question-card";
import { RatingBar } from "@/components/questions/rating-bar";
import { WeakBadge } from "@/components/questions/weak-badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitAnswerAction, toggleWeakAction } from "@/lib/actions/review-actions";

type Props = {
  initialQueue: ScheduledCard[];
};

export function TodayClient({ initialQueue }: Props) {
  const [queue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [weak, setWeak] = useState(false);
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);

  const current = queue[index] ?? null;
  const total = queue.length;
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;

  const handleFlip = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setFlipped(prev => !prev);
  }, []);

  const handleRate = useCallback(
    async (r: Rating) => {
      if (!current || busyRef.current) return;
      busyRef.current = true;

      try {
        await submitAnswerAction(current.card.questionId, r);
      } catch {
        // Silently fail — toast system in Phase 9
      }

      const nextIndex = index + 1;
      if (nextIndex >= total) {
        setDone(true);
      } else {
        setIndex(nextIndex);
        setFlipped(false);
        setWeak(false);
      }
      busyRef.current = false;
    },
    [current, index, total],
  );

  const handleToggleWeak = useCallback(async () => {
    if (!current) return;
    try {
      const isWeak = await toggleWeakAction(current.card.questionId);
      setWeak(isWeak);
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
  }, [flipped, handleFlip, handleRate]);

  // Empty queue
  if (total === 0) {
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
        <h2 className="text-2xl font-bold">今日答了 {total} 题</h2>
        <p className="text-muted-foreground">坚持每天复习，效果更好！</p>
        <a href="/library" className={cn(buttonVariants({ variant: "outline" }))}>
          去题库看看
        </a>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-6 md:gap-8 px-6 py-8 md:py-10 min-h-[90vh] w-full max-w-5xl mx-auto overflow-hidden">
      {/* Background Depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-foreground/[0.02] blur-[150px] rounded-full -z-10 animate-pulse-glow" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-20" />

      {/* Header Technical Info */}
      <div className="w-full max-w-3xl flex flex-col gap-4 animate-slide-up">
        <div className="flex items-end justify-between px-1">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Active Session</span>
             </div>
             <h1 className="text-xl md:text-2xl font-black tracking-tighter">Systematic Review.</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 text-right">Recall Efficiency</span>
             <span className="text-lg font-mono font-black text-foreground">{progress}%</span>
          </div>
        </div>
        
        <div className="relative h-1.5 w-full bg-foreground/[0.03] rounded-full overflow-hidden border border-foreground/[0.05]">
          <div 
            className="h-full bg-foreground rounded-full transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)" 
            style={{ width: `${progress}%` }} 
          />
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-brand/20 to-transparent blur-sm" style={{ left: `calc(${progress}% - 96px)` }} />
        </div>
        
        <div className="flex justify-between px-1 text-[10px] font-mono font-bold text-foreground/30 uppercase tracking-widest">
           <span>Unit {index + 1} of {total}</span>
           <span>Optimizing Retention</span>
        </div>
      </div>

      {/* Card Section */}
      <div className="w-full flex flex-col gap-6 md:gap-8 items-center">
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
                onFlip={handleFlip}
              />
            </div>

            {/* Controller Module */}
            <div className="w-full max-w-3xl flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between w-full border-b border-foreground/5 pb-3">
                <WeakBadge
                  isWeak={weak}
                  onToggle={handleToggleWeak}
                />
                <div className="px-3 py-1.5 rounded-full glass glass-dark text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 border-foreground/10">
                   {current.question.direction.replace('-', ' ')} // PR-GRADE
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="flex flex-col items-center gap-1 mb-2">
                   <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20">Input Feedback</span>
                </div>
                
                <RatingBar
                  onRate={handleRate}
                  disabled={!flipped}
                />

                <div className="flex justify-center pt-3">
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
    </div>
  );
}


