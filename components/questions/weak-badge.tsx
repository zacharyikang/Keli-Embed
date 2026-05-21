"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  isWeak: boolean;
  onToggle: () => void;
  weakCount?: number;
};

export function WeakBadge({ isWeak, onToggle, weakCount }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest gap-2 h-9 px-4 rounded-full transition-all duration-300 glass glass-dark",
          isWeak 
            ? "text-warning border-warning/40 shadow-[0_0_15px_-5px_var(--color-warning)]" 
            : "text-muted-foreground/60 hover:text-foreground",
        )}
      >
        <span className={cn("text-sm", isWeak ? "animate-pulse" : "opacity-40")}>
          {isWeak ? "★" : "☆"}
        </span>
        {isWeak ? "已标记薄弱" : "标记薄弱点"}
      </Button>
      {weakCount !== undefined && isWeak && (
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
          {weakCount} / 30 限制
        </span>
      )}
    </div>
  );
}

