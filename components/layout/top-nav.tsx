"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { BookOpen, BarChart3, Swords, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useMastery } from "@/components/providers/mastery-provider";
import { getQuestionByIdAction } from "@/lib/actions/library-actions";

const navItems = [
  { href: "/today", label: "今日复习", icon: Zap },
  { href: "/library", label: "题库", icon: BookOpen },
  { href: "/practice", label: "自由练习", icon: Swords },
  { href: "/weak", label: "薄弱点", icon: BarChart3 },
];

function TopNavTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [questionTitle, setQuestionTitle] = useState<string>("");

  useEffect(() => {
    if (pathname.startsWith("/q/")) {
      const id = pathname.split("/q/")[1]?.split("/")[0];
      if (id) {
        getQuestionByIdAction(id)
          .then((question) => {
            if (question) {
              setQuestionTitle(question.title);
            } else {
              setQuestionTitle("题目详情");
            }
          })
          .catch(() => {
            setQuestionTitle("题目详情");
          });
      }
    } else {
      setQuestionTitle("");
    }
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.startsWith("/today")) {
      return "今日复习";
    }
    if (pathname.startsWith("/practice")) {
      return "自由练习";
    }
    if (pathname.startsWith("/weak")) {
      return "薄弱点";
    }
    if (pathname.startsWith("/stats")) {
      return "进度统计";
    }
    if (pathname.startsWith("/settings")) {
      return "设置";
    }
    if (pathname.startsWith("/q/")) {
      return questionTitle || "加载中...";
    }
    if (pathname.startsWith("/library")) {
      const company = searchParams?.get("company");
      const dir = searchParams?.get("dir");
      if (company) {
        const companyNames: Record<string, string> = {
          huawei: "华为",
          dji: "大疆",
          xiaomi: "小米",
          hikvision: "海康威视",
          byd: "比亚迪",
        };
        return (companyNames[company] || company) + "真题";
      }
      if (dir) {
        const directionNames: Record<string, string> = {
          "c-language": "C 语言",
          mcu: "MCU 裸机开发",
          rtos: "RTOS",
          protocol: "通信协议",
          "linux-embedded": "Linux 嵌入式",
          algorithm: "数据结构与算法",
          "interview-mixed": "面试综合",
        };
        return directionNames[dir] || dir;
      }
      return "题库";
    }
    return "";
  };

  const pageTitle = getPageTitle();

  if (!pageTitle) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground select-none shrink-0 min-w-0">
      <span className="text-muted-foreground/30 font-light">/</span>
      <span className="text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-[320px]">
        {pageTitle}
      </span>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { masteryPercentage, isLoading } = useMastery();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 md:gap-4 border-b bg-background px-2 md:px-4">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
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

        <Suspense fallback={null}>
          <TopNavTitle />
        </Suspense>
      </div>

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


