"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, BookOpen, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "复习", icon: Zap },
  { href: "/library", label: "题库", icon: BookOpen },
  { href: "/stats", label: "统计", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-8 inset-x-0 z-50 flex justify-center px-6 pointer-events-none">
      <nav className="flex h-16 items-center gap-1 glass glass-dark px-3 rounded-full pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-foreground/10 bg-background/80 backdrop-blur-2xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 group overflow-hidden",
                active
                  ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              )}
            >
              <Icon className={cn(
                "size-5 transition-transform duration-500 group-hover:scale-110 relative z-10",
                active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className={cn(
                "text-xs font-black uppercase tracking-widest transition-all duration-500 relative z-10",
                active ? "opacity-100 max-w-[100px]" : "opacity-0 max-w-0"
              )}>
                {label}
              </span>
              {active && (
                <div className="absolute inset-0 bg-gradient-to-tr from-foreground via-foreground to-foreground/80" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


