"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useAuthLoading } from "@/lib/auth/client";
import { getWeakCardsAction } from "@/lib/actions/explore-actions";
import { toggleWeakAction } from "@/lib/actions/review-actions";
import type { Question, CardState } from "@/lib/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Star, Trash2, ArrowUpDown } from "lucide-react";

type WeakItem = { question: Question; card: CardState };

type SortKey = "date" | "difficulty";

const difficultyOrder: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const difficultyLabel: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export function WeakClient() {
  const user = useUser();
  const loading = useAuthLoading();
  const [items, setItems] = useState<WeakItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    setFetching(true);
    getWeakCardsAction()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError("加载薄弱点失败");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRemoveWeak = useCallback(
    async (qid: string) => {
      try {
        await toggleWeakAction(qid);
        setItems((prev) => prev.filter((item) => item.question.id !== qid));
      } catch {
        // silently fail
      }
    },
    [],
  );

  const sorted = [...items].sort((a, b) => {
    if (sortKey === "date") {
      const da = a.card.weakMarkedAt ? new Date(a.card.weakMarkedAt).getTime() : 0;
      const db = b.card.weakMarkedAt ? new Date(b.card.weakMarkedAt).getTime() : 0;
      return db - da;
    }
    // difficulty: hard → medium → easy
    const da = difficultyOrder[a.question.difficulty] ?? 0;
    const db = difficultyOrder[b.question.difficulty] ?? 0;
    return db - da;
  });

  if (loading || fetching) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 animate-slide-up">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-6">薄弱点分析.</h1>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse glass glass-dark rounded-xl h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-6 text-center animate-slide-up">
        <div className="size-20 flex items-center justify-center rounded-3xl bg-foreground/5 text-foreground/20">
           <Star className="size-10" />
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black tracking-tighter">登录以启动诊断.</h2>
           <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-tight">登录后可查看和复习标记的薄弱题目，实现精准知识隔离。</p>
        </div>
        <a
          href="/auth/sign-in"
          className={cn(buttonVariants({ size: "lg" }), "bg-foreground text-background font-black px-12 rounded-full shadow-2xl")}
        >
          立即登录
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-slide-up">
      <div className="flex items-end justify-between mb-8 border-b border-foreground/5 pb-4">
        <div className="space-y-1">
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand bg-brand/10 w-fit px-2.5 py-0.5 rounded-full">Weakness Diagnostic</span>
           <h1 className="text-2xl md:text-3xl font-black tracking-tighter">薄弱环节清单.</h1>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortKey(sortKey === "date" ? "difficulty" : "date")}
            className="rounded-full px-5 border border-foreground/10 font-black uppercase tracking-widest text-[9px] h-9 hover:bg-foreground hover:text-background transition-all"
          >
            <ArrowUpDown className="size-3 mr-1.5" />
            {sortKey === "date" ? "SORT BY DATE" : "SORT BY DIFFICULTY"}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive font-bold mb-6 flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
          {error}
        </div>
      )}

      {!error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-12 flex items-center justify-center rounded-full bg-foreground/5 text-foreground/20">
             <Star className="size-6" />
          </div>
          <div className="space-y-1">
             <p className="text-lg font-black tracking-tight">目前系统库中无薄弱标记</p>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">
               Mark questions during review for isolation.
             </p>
          </div>
        </div>
      )}

      {!error && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {sorted.map(({ question, card }) => (
            <a
              key={question.id}
              href={`/q/${question.id}`}
              className="block group"
            >
              <Card className="glass glass-dark rounded-xl border-2 border-foreground/5 hover:border-brand/40 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-brand/5">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="default"
                          className="text-[8px] font-black uppercase tracking-widest bg-foreground text-background px-2.5"
                        >
                          {difficultyLabel[question.difficulty] ?? question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-foreground/10 text-foreground/40">
                          {question.direction}
                        </Badge>
                      </div>
                      <p className="text-base md:text-lg font-black tracking-tight truncate group-hover:text-brand transition-colors">{question.title}</p>
                      {card.weakMarkedAt && (
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 font-mono font-bold uppercase tracking-tighter">
                           <span className="size-1 rounded-full bg-foreground/10" />
                           标记于 {new Date(card.weakMarkedAt).toLocaleDateString("zh-CN")} // DIAG-LOG
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveWeak(question.id);
                        }}
                        className="text-foreground/20 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <div className="size-9 flex items-center justify-center rounded-lg bg-foreground/5 text-foreground/40 group-hover:bg-brand group-hover:text-black transition-all">
                         <Star className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="h-px w-20 bg-foreground/5" />
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20">
             End of Diagnostic Report.
           </p>
        </div>
      )}
    </div>
  );
}

