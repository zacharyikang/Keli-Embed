"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRandomQuestionsAction } from "@/lib/actions/explore-actions";
import type { Question, CardState, Rating } from "@/lib/domain";
import { QuestionCard } from "@/components/questions/question-card";
import { RatingBar } from "@/components/questions/rating-bar";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PracticeClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getRandomQuestionsAction(20)
      .then((qs) => {
        if (!cancelled) {
          setQuestions(qs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("加载题目失败");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const current = questions[index] ?? null;
  const total = questions.length;
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;

  const handleFlip = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setFlipped(prev => !prev);
  }, []);

  const handleRate = useCallback(
    (r: Rating) => {
      void r;
      if (busyRef.current) return;
      busyRef.current = true;

      const nextIndex = index + 1;
      if (nextIndex >= total) {
        setDone(true);
      } else {
        setIndex(nextIndex);
        setFlipped(false);
      }
      busyRef.current = false;
    },
    [index, total],
  );

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
        case "2":
        case "3":
        case "4":
          e.preventDefault();
          handleRate("good");
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipped, handleFlip, handleRate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          重试
        </button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">题库为空</h2>
        <p className="text-muted-foreground">还没有题目，请稍后再来</p>
        <a href="/library" className={cn(buttonVariants({ variant: "outline" }))}>
          去题库看看
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">练习完成</h2>
        <p className="text-muted-foreground">已练习了 {total} 题</p>
        <a href="/practice" className={cn(buttonVariants({ variant: "outline" }))}>
          再来一轮
        </a>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-6 md:gap-8 px-6 py-8 md:py-10 min-h-[90vh] w-full max-w-5xl mx-auto overflow-hidden">
      {/* Background Depth Sync */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-blue-500/[0.02] blur-[150px] rounded-full -z-10 animate-pulse-glow" />

      {/* Header Info */}
      <div className="w-full max-w-3xl flex flex-col gap-4 animate-slide-up">
        <div className="flex items-end justify-between px-1">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Free Practice Session</span>
             </div>
             <h1 className="text-xl md:text-2xl font-black tracking-tighter">自由练习.</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 text-right">Completion Status</span>
             <span className="text-lg font-mono font-black text-foreground">{progress}%</span>
          </div>
        </div>
        
        <div className="relative h-1.5 w-full bg-foreground/[0.03] rounded-full overflow-hidden border border-foreground/[0.05]">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="flex justify-between px-1 text-[10px] font-mono font-bold text-foreground/30 uppercase tracking-widest">
           <span>Unit {index + 1} of {total}</span>
           <span>Randomized Learning Mode</span>
        </div>
      </div>

      {/* Card Section */}
      <div className="w-full flex flex-col gap-6 md:gap-8 items-center">
        {current && (
          <>
            <div className="w-full relative">
               <QuestionCard
                key={current.id}
                question={current}
                card={
                  {
                    questionId: current.id,
                    easeFactor: 2.5,
                    intervalDays: 0,
                    repetitions: 0,
                    dueAt: new Date(0),
                    isWeak: false,
                    weakMarkedAt: null,
                    lastRating: null,
                    lastReviewedAt: null,
                    totalReviews: 0,
                  } as CardState
                }
                flipped={flipped}
                onFlip={handleFlip}
              />
            </div>

            {/* Controller Module */}
            <div className="w-full max-w-3xl flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between w-full border-b border-foreground/5 pb-3">
                <div className="px-3 py-1.5 rounded-full glass glass-dark text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 italic border-foreground/5">
                   RANDOM // NO-RECORD
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass glass-dark text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80 border-blue-400/10">
                   <div className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                   练习模式
                </div>
              </div>

              <div className="w-full space-y-4">
                <RatingBar
                  onRate={handleRate}
                  disabled={!flipped}
                />

                <div className="flex justify-center pt-3">
                  <div className="flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-foreground/[0.02] border border-foreground/5 shadow-inner">
                    <span className="size-1.5 rounded-full bg-foreground/10" />
                    <p className="text-[9px] text-foreground/40 font-black uppercase tracking-[0.2em]">
                      {flipped
                        ? "Execute Rating to Advance"
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


