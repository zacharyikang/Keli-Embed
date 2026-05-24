"use client";

import type { Rating } from "@/lib/domain";
import { cn } from "@/lib/utils";

const ratingConfig: { value: Rating; label: string; key: string; color: string; glow: string }[] = [
  { 
    value: "again", 
    label: "重来", 
    key: "1", 
    color: "text-error border-error/20 hover:bg-error/5 hover:border-error/40",
    glow: "shadow-[0_0_15px_-5px_var(--color-error)]"
  },
  { 
    value: "hard", 
    label: "困难", 
    key: "2", 
    color: "text-warning border-warning/20 hover:bg-warning/5 hover:border-warning/40",
    glow: "shadow-[0_0_15px_-5px_var(--color-warning)]"
  },
  { 
    value: "good", 
    label: "良好", 
    key: "3", 
    color: "text-success border-success/20 hover:bg-success/5 hover:border-success/40",
    glow: "shadow-[0_0_15px_-5px_var(--color-success)]"
  },
  { 
    value: "easy", 
    label: "简单", 
    key: "4", 
    color: "text-brand border-brand/20 hover:bg-brand/5 hover:border-brand/40",
    glow: "shadow-[0_0_15px_-5px_var(--color-brand)]"
  },
];

type Props = {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

export function RatingBar({ onRate, disabled }: Props) {
  return (
    <div className="flex gap-3 w-full max-w-3xl mx-auto">
      {ratingConfig.map(({ value, label, key, color, glow }) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onRate(value)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1.5 rounded-2xl border py-2.5 text-sm font-bold transition-all duration-300 glass glass-dark",
            disabled 
              ? "opacity-20 cursor-not-allowed scale-95 grayscale" 
              : cn(color, "hover:-translate-y-1 active:scale-95", glow),
          )}
        >
          <span className="uppercase tracking-widest text-[10px] opacity-60 font-black">{key}</span>
          <span className="text-sm tracking-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

