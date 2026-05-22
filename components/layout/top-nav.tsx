"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BarChart3, Swords, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useMastery } from "@/components/providers/mastery-provider";

const navItems = [
  { href: "/today", label: "今日复习", icon: Zap },
  { href: "/library", label: "题库", icon: BookOpen },
  { href: "/practice", label: "自由练习", icon: Swords },
  { href: "/weak", label: "薄弱点", icon: BarChart3 },
];

export function TopNav() {
  const pathname = usePathname();
  const { masteryPercentage, isLoading } = useMastery();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 md:gap-4 border-b bg-background px-2 md:px-4">
      <Link
        href="/"
        className="flex items-center gap-1.5 md:gap-2 font-black text-lg tracking-tighter shrink-0 hover:opacity-80 transition-opacity group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-brand/40 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex size-8 items-center justify-center rounded-lg bg-foreground text-background font-black text-sm border border-foreground/10">
            ES
          </span>
        </div>
        <span className="hidden sm:inline text-foreground tracking-[0.1em] uppercase">EmbedStudio</span>
      </Link>


      <nav className="flex items-center gap-1 ml-2 md:ml-4 overflow-x-auto scrollbar-none whitespace-nowrap">
        {navItems.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const hideOnMobile = ["/today", "/library", "/practice"].includes(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "items-center gap-1.5 rounded-lg px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                hideOnMobile ? "hidden md:inline-flex" : "inline-flex",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {!isLoading && (
        <div className="flex items-center gap-1.5 md:gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-brand/10 text-brand rounded-full text-[10px] md:text-xs font-bold border border-brand/20 hover:bg-brand/15 transition-all shadow-sm shrink-0">
          <span className="relative flex h-1.5 w-1.5 md:size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-brand"></span>
          </span>
          <span>掌握率: {masteryPercentage}%</span>
        </div>
      )}

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}

