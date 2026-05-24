"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMastery } from "@/components/providers/mastery-provider";
import { listAllQuestionsAction } from "@/lib/actions/library-actions";
import type { Question } from "@/lib/domain";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Cpu,
  Radio,
  Microchip,
  Terminal,
  Binary,
  Layers,
  Search,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  RotateCcw,
  Tag,
  CircleDot,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const directionMeta: Record<string, { name: string; icon: any }> = {
  "c-language": { name: "C 语言", icon: BookOpen },
  mcu: { name: "MCU 裸机开发", icon: Cpu },
  rtos: { name: "RTOS", icon: Layers },
  protocol: { name: "通信协议", icon: Radio },
  "linux-embedded": { name: "Linux 嵌入式", icon: Terminal },
  algorithm: { name: "数据结构与算法", icon: Binary },
  "interview-mixed": { name: "面试综合", icon: Microchip },
};

const companyNames: Record<string, string> = {
  huawei: "华为",
  dji: "大疆",
  xiaomi: "小米",
  hikvision: "海康威视",
  byd: "比亚迪",
};

const difficultyLabel: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export function LibraryClient() {
  const { 
    isMastered, 
    toggleMastery, 
    setTotalQuestionsCount, 
    masteredIds, 
    masteryPercentage 
  } = useMastery();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<{ type: "all" | "direction" | "company"; value: string }>({ type: "all", value: "" });
  const [activeTab, setActiveTab] = useState<"directions" | "companies">("directions");
  const [expandedQid, setExpandedQid] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const handleCategoryChange = useCallback((newCategory: { type: "all" | "direction" | "company"; value: string }) => {
    setCategory(newCategory);
    const params = new URLSearchParams();
    if (newCategory.type === "direction") {
      params.set("dir", newCategory.value);
    } else if (newCategory.type === "company") {
      params.set("company", newCategory.value);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/library${queryStr}`, { scroll: false });
  }, [router]);

  // Load questions on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await listAllQuestionsAction();
        setQuestions(data);
        setTotalQuestionsCount(data.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setTotalQuestionsCount]);

  // Handle Query Parameters for dynamic routing fallback
  useEffect(() => {
    const dir = searchParams.get("dir");
    const company = searchParams.get("company");
    if (dir) {
      setCategory({ type: "direction", value: dir });
      setActiveTab("directions");
    } else if (company) {
      setCategory({ type: "company", value: company });
      setActiveTab("companies");
    } else {
      setCategory({ type: "all", value: "" });
    }
  }, [searchParams]);

  // Filtered by search query only (for interlocking categories counts)
  const searchQueryFilteredQuestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === "") {
      return questions;
    }
    const query = trimmed.toLowerCase();
    return questions.filter((q) => {
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchBody = q.body.toLowerCase().includes(query);
      const matchId = q.id.toLowerCase().includes(query);
      const matchTags = q.tags.some((t) => t.toLowerCase().includes(query));
      const matchAnswer = q.answer.toLowerCase().includes(query);
      const matchExplanation = q.explanation?.toLowerCase().includes(query) ?? false;
      return matchTitle || matchBody || matchId || matchTags || matchAnswer || matchExplanation;
    });
  }, [questions, searchQuery]);

  // Calculate dynamic stats for sidebar
  const stats = useMemo(() => {
    const directions = new Map<string, { total: number; mastered: number }>();
    const companies = new Map<string, { total: number; mastered: number }>();

    // Initialize with all known directions and companies to 0 to prevent layout-shifting
    Object.keys(directionMeta).forEach((dirSlug) => {
      directions.set(dirSlug, { total: 0, mastered: 0 });
    });
    Object.keys(companyNames).forEach((compSlug) => {
      companies.set(compSlug, { total: 0, mastered: 0 });
    });

    // Count matching questions
    searchQueryFilteredQuestions.forEach((q) => {
      // Directions
      const dir = q.direction;
      const dirCur = directions.get(dir) ?? { total: 0, mastered: 0 };
      dirCur.total++;
      if (isMastered(q.id)) dirCur.mastered++;
      directions.set(dir, dirCur);

      // Companies
      q.companies.forEach((comp) => {
        const compCur = companies.get(comp) ?? { total: 0, mastered: 0 };
        compCur.total++;
        if (isMastered(q.id)) compCur.mastered++;
        companies.set(comp, compCur);
      });
    });

    // Total counts filtered by search query
    const totalFiltered = searchQueryFilteredQuestions.length;
    const totalMasteredFiltered = searchQueryFilteredQuestions.filter((q) => isMastered(q.id)).length;

    return { directions, companies, totalFiltered, totalMasteredFiltered };
  }, [searchQueryFilteredQuestions, isMastered]);

  // Filtered list of questions
  const filteredQuestions = useMemo(() => {
    return searchQueryFilteredQuestions.filter((q) => {
      // Category Filter
      if (category.type === "direction" && q.direction !== category.value) {
        return false;
      }
      if (category.type === "company" && !q.companies.includes(category.value)) {
        return false;
      }
      return true;
    });
  }, [searchQueryFilteredQuestions, category]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    handleCategoryChange({ type: "all", value: "" });
  }, [handleCategoryChange]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 animate-pulse text-center space-y-4">
        <div className="h-6 w-48 bg-foreground/10 rounded-full mx-auto" />
        <div className="h-10 w-96 bg-foreground/10 rounded-full mx-auto" />
        <div className="h-64 w-full bg-foreground/5 rounded-2xl mt-8" />
      </div>
    );
  }

  const totalQuestionsCount = questions.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-slide-up">
      {/* Page Title */}
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand bg-brand/10 w-fit px-2.5 py-0.5 rounded-full">Knowledge Repository</span>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">题库体系.</h1>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sticky Sidebar (Column 4 of 12) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 self-start">
          
          {/* Progress Card */}
          <div className="glass glass-dark rounded-2xl border border-foreground/5 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">当前总进度</span>
              <span className="text-xs font-mono font-bold text-brand">{masteredIds.size} / {totalQuestionsCount}</span>
            </div>
            
            <div className="relative h-1.5 w-full bg-foreground/[0.03] rounded-full overflow-hidden border border-foreground/[0.05]">
              <div 
                className="h-full bg-brand rounded-full transition-all duration-500" 
                style={{ width: `${masteryPercentage}%` }} 
              />
            </div>
            
            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wide">
              <span>掌握率</span>
              <span>{masteryPercentage}%</span>
            </div>
          </div>

          {/* Category Tabs Widget */}
          <div className="glass glass-dark rounded-2xl border border-foreground/5 p-5 space-y-3.5 shadow-xl">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">分类目录</div>
            
            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 bg-foreground/[0.02] p-1 rounded-xl border border-foreground/5 h-9">
              <button
                onClick={() => setActiveTab("directions")}
                className={cn(
                  "font-black text-[9px] uppercase tracking-wider rounded-lg transition-all",
                  activeTab === "directions"
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                按专业方向
              </button>
              <button
                onClick={() => setActiveTab("companies")}
                className={cn(
                  "font-black text-[9px] uppercase tracking-wider rounded-lg transition-all",
                  activeTab === "companies"
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                按名企真题
              </button>
            </div>

            {/* List items inside Sidebar */}
            <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {/* "All" button */}
              <button
                onClick={() => handleCategoryChange({ type: "all", value: "" })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all border",
                  category.type === "all"
                    ? "bg-brand/10 border-brand/30 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
                )}
              >
                <div className="flex items-center gap-2">
                  <CircleDot className="size-3.5 text-brand shrink-0" />
                  <span>全部题库</span>
                </div>
                <span className="font-mono text-[9px] bg-foreground/5 px-2 py-0.5 rounded text-muted-foreground">
                  {stats.totalMasteredFiltered}/{stats.totalFiltered}
                </span>
              </button>

              {activeTab === "directions" && Array.from(stats.directions.entries()).map(([dirSlug, item]) => {
                const meta = directionMeta[dirSlug] ?? { name: dirSlug, icon: HelpCircle };
                const Icon = meta.icon;
                const isSelected = category.type === "direction" && category.value === dirSlug;

                return (
                  <button
                    key={dirSlug}
                    onClick={() => handleCategoryChange({ type: "direction", value: dirSlug })}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all border",
                      isSelected
                        ? "bg-brand/10 border-brand/30 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={cn("size-3.5 shrink-0", isSelected ? "text-brand" : "text-muted-foreground/60")} />
                      <span className="truncate">{meta.name}</span>
                    </div>
                    <span className="font-mono text-[9px] bg-foreground/5 px-2 py-0.5 rounded text-muted-foreground">
                      {item.mastered}/{item.total}
                    </span>
                  </button>
                );
              })}

              {activeTab === "companies" && Array.from(stats.companies.entries()).map(([compSlug, item]) => {
                const name = companyNames[compSlug] ?? compSlug;
                const isSelected = category.type === "company" && category.value === compSlug;

                return (
                  <button
                    key={compSlug}
                    onClick={() => handleCategoryChange({ type: "company", value: compSlug })}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all border",
                      isSelected
                        ? "bg-brand/10 border-brand/30 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("size-1 rounded-full shrink-0", isSelected ? "bg-brand" : "bg-muted-foreground/40")} />
                      <span>{name}</span>
                    </div>
                    <span className="font-mono text-[9px] bg-foreground/5 px-2 py-0.5 rounded text-muted-foreground">
                      {item.mastered}/{item.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content Panel (Column 8 of 12) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索题目、ID、解析或标签..."
              className="w-full pl-10 pr-9 py-2 bg-foreground/[0.02] border border-foreground/5 hover:border-foreground/15 focus:border-brand/40 focus:ring-1 focus:ring-brand/20 outline-none rounded-xl transition-all font-medium text-xs shadow-sm placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* List and Accordions */}
          {filteredQuestions.length === 0 ? (
            <div className="glass glass-dark rounded-2xl border border-foreground/5 p-10 text-center space-y-4.5 shadow-xl">
              <div className="size-12 bg-muted/30 text-muted-foreground flex items-center justify-center rounded-xl mx-auto">
                <RotateCcw className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight">未找到匹配题目</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  尝试更换左侧的知识目录分类，或在输入框中精简搜索关键字。
                </p>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-full bg-foreground text-background font-black text-[10px] uppercase tracking-wider hover:bg-brand hover:text-black transition-all shadow-md active:scale-95"
              >
                重置过滤条件
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredQuestions.map((q) => {
                const isExpanded = expandedQid === q.id;
                const mastered = isMastered(q.id);
                const dirMeta = directionMeta[q.direction] ?? { name: q.direction };

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "glass glass-dark rounded-2xl border border-foreground/5 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:border-brand/30 hover:scale-[1.01]",
                      isExpanded ? "border-brand/30 shadow-xl bg-foreground/[0.01]" : ""
                    )}
                  >
                    {/* Card Header (Visible Summary Row) */}
                    <div 
                      className="py-3 px-5 flex items-center justify-between gap-3.5 cursor-pointer select-none"
                      onClick={() => setExpandedQid(isExpanded ? null : q.id)}
                    >
                      {/* Left: Mastery Checkbox & Question Header */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Custom Mastery Checkbox */}
                        <button
                          type="button"
                          className="shrink-0 p-0.5 rounded hover:bg-foreground/5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand/40"
                          aria-label={mastered ? "取消已掌握标记" : "标记已掌握"}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid expanding card
                            toggleMastery(q.id);
                          }}
                        >
                          {mastered ? (
                            <CheckCircle2 className="size-4.5 text-success fill-success/10 animate-scale-up" />
                          ) : (
                            <div className="size-4.5 rounded-full border border-muted-foreground/30 hover:border-brand transition-colors" />
                          )}
                        </button>

                        {/* Title and Badge Meta row */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-1.5 py-0.5 rounded">
                              {q.id}
                            </span>
                            <span className="text-[8px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              {dirMeta.name}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border",
                              q.difficulty === "easy" && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
                              q.difficulty === "medium" && "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
                              q.difficulty === "hard" && "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20"
                            )}>
                              {difficultyLabel[q.difficulty]}
                            </span>
                          </div>
                          
                          <h3 className={cn(
                            "text-sm font-bold tracking-tight leading-snug truncate",
                            mastered ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-foreground"
                          )}>
                            {q.title}
                          </h3>
                        </div>
                      </div>

                      {/* Right: Expand Chevron */}
                      <div className="shrink-0">
                        <ChevronDown className={cn(
                          "size-4 text-muted-foreground transition-transform duration-300",
                          isExpanded ? "rotate-180 text-brand" : ""
                        )} />
                      </div>
                    </div>

                    {/* Collapsible Accordion Content */}
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] border-t border-foreground/5 opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                      )}
                    >
                      <div className="overflow-hidden min-h-0">
                        <div className="py-4 px-5 space-y-4">
                          
                          {/* 1. Body / Question Content */}
                          <div className="prose prose-neutral dark:prose-invert max-w-none text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/80 bg-foreground/[0.01] p-4 rounded-xl border border-foreground/[0.03]">
                            {q.body}
                          </div>

                          {/* Choices block for Choice-type questions */}
                          {q.type === "choice" && q.choices && q.choices.length > 0 && (
                            <div className="grid grid-cols-1 gap-2">
                              {q.choices.map((c) => (
                                <div
                                  key={c.id}
                                  className={cn(
                                    "flex items-center gap-2.5 p-2.5 rounded-lg border text-[13px] font-medium",
                                    c.correct 
                                      ? "bg-success/5 border-success/20 text-success" 
                                      : "bg-foreground/[0.01] border-foreground/5 text-muted-foreground"
                                  )}
                                >
                                  <span className={cn(
                                    "size-5 flex items-center justify-center rounded-md text-[11px] font-mono border",
                                    c.correct
                                      ? "bg-success/15 border-success/30 text-success"
                                      : "bg-foreground/5 border-foreground/10 text-muted-foreground"
                                  )}>
                                    {c.id}
                                  </span>
                                  <span>{c.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2. Core Takeaway Answer (Blue Box) */}
                          <div className="border-l-4 border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] p-4 rounded-r-xl space-y-1.5">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400">核心要点</h4>
                            <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                              {q.answer}
                            </p>
                          </div>

                          {/* 3. Deep explanation */}
                          {q.explanation && (
                            <div className="space-y-2">
                              <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">技术演进与深度解析</h4>
                              <p className="text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap bg-foreground/[0.01] p-4 rounded-xl border border-foreground/[0.03]">
                                {q.explanation}
                              </p>
                            </div>
                          )}

                          {/* 4. Tips / Handbook Notes (Yellow Box) */}
                          <div className="border-l-4 border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] p-4 rounded-r-xl space-y-1.5">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">面试官视角与底层建议</h4>
                            <div className="text-[12px] leading-relaxed text-muted-foreground space-y-1">
                              <div>• 考察要点：该题主要考察底层嵌入式系统的关键概念与实际编程注意点。</div>
                              {q.companies.length > 0 && (
                                <div>• 历史考点：曾作为 <strong>{q.companies.map(c => companyNames[c] || c).join("、")}</strong> 等公司的面试真题。</div>
                              )}
                              {q.interviewYear && (
                                <div>• 出镜年份：{q.interviewYear} 年 {q.interviewRound || ""}。</div>
                              )}
                            </div>
                          </div>

                          {/* 5. Tag badging */}
                          {q.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap items-center">
                              <Tag className="size-3 text-muted-foreground/60 mr-1" />
                              {q.tags.map((t) => (
                                <span key={t} className="text-[9px] font-semibold text-muted-foreground/70 bg-foreground/5 px-2 py-0.5 rounded border border-foreground/5">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Accordion Action Bar */}
                          <div className="flex items-center justify-between border-t border-foreground/5 pt-3">
                            <Link
                              href={`/q/${q.id}`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-brand transition-colors"
                            >
                              <span>在独立页面查看</span>
                              <ExternalLink className="size-3" />
                            </Link>

                            <button
                              onClick={() => setExpandedQid(null)}
                              className="px-3 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground font-black text-[9px] uppercase tracking-wider transition-all"
                            >
                              收起解析
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
