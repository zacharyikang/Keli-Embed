"use client";

import { useEffect, useState } from "react";
import { useUser, useAuthLoading } from "@/lib/auth/client";
import { getStatsAction } from "@/lib/actions/stats-actions";
import type { UserStats } from "@/lib/services/stats-service";
import { Card } from "@/components/ui/card";
import { Heatmap } from "@/components/stats/heatmap";
import { DirectionProgressList } from "@/components/stats/direction-progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flame, BookOpen, Star, TrendingUp } from "lucide-react";

export function StatsClient() {
  const user = useUser();
  const loading = useAuthLoading();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    setFetching(true);
    getStatsAction()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError("加载统计数据失败");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading || fetching) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 animate-slide-up">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-6">数据透视.</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
           <TrendingUp className="size-10" />
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black tracking-tighter">登录开启性能分析.</h2>
           <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-tight">登录后可查看学习进度和统计数据，量化你的技术成长曲线。</p>
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

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 animate-slide-up">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-6">数据透视.</h1>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive font-bold flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-slide-up">
      <div className="flex flex-col gap-1.5 mb-8 border-b border-foreground/5 pb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand bg-brand/10 w-fit px-2.5 py-0.5 rounded-full">Engineering Analytics</span>
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter">性能概览.</h1>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass glass-dark border-foreground/5 rounded-xl p-4 md:p-5 relative overflow-hidden group">
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
              <BookOpen className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Total Reviews</span>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.totalReviews}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 size-20 bg-foreground/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-700" />
        </Card>

        <Card className="glass glass-dark border-foreground/5 rounded-xl p-4 md:p-5 relative overflow-hidden group">
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-brand transition-colors">
              <Flame className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Active Streak</span>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.streakCount}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 size-20 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-700" />
        </Card>

        <Card className="glass glass-dark border-foreground/5 rounded-xl p-4 md:p-5 relative overflow-hidden group">
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
              <Star className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Learned Units</span>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.totalLearned}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 size-20 bg-foreground/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-700" />
        </Card>

        <Card className="glass glass-dark border-foreground/5 rounded-xl p-4 md:p-5 relative overflow-hidden group">
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
              <TrendingUp className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Recall Score</span>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.averageRating}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 size-20 bg-foreground/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-700" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Activity heatmap */}
        <Card className="lg:col-span-2 glass glass-dark border-foreground/5 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-6 relative z-10">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight">神经网络热力图.</h2>
                <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Learning Density Map</span>
             </div>
             <div className="p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
                <Heatmap data={stats.recentActivity} />
             </div>
          </div>
          <div className="absolute top-0 right-0 p-6 opacity-[0.02] -rotate-12">
             <TrendingUp className="size-32" />
          </div>
        </Card>

        {/* Direction progress */}
        <Card className="glass glass-dark border-foreground/5 rounded-2xl p-5 md:p-6 shadow-2xl">
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight">知识覆盖度.</h2>
                <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Skill Map</span>
             </div>
             <div className="custom-scrollbar pr-2">
                <DirectionProgressList items={stats.directionProgress} />
             </div>
          </div>
        </Card>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
         <div className="h-px w-20 bg-foreground/5" />
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20">
           Real-time Telemetry Active.
         </p>
      </div>
    </div>
  );
}
