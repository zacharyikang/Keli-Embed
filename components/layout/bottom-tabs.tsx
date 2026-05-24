"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, BookOpen, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "复习", icon: Zap },
  { href: "/library", label: "题库", icon: BookOpen },
  { href: "/stats", label: "统计", icon: BarChart3 },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-8 left-6 z-50 pointer-events-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="size-12 flex items-center justify-center glass glass-dark rounded-full pointer-events-auto shadow-xl border-foreground/10 hover:bg-foreground/5 transition-all active:scale-95 text-muted-foreground hover:text-foreground"
          title="展开导航栏"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    );
  }

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
        
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-foreground/5 group"
          title="收起导航栏"
        >
          <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[100px] transition-all duration-500 overflow-hidden">
            收起
          </span>
        </button>
      </nav>
    </div>
  );
}


