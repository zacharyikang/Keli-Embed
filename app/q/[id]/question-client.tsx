"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useMastery } from "@/components/providers/mastery-provider";
import type { Question } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { 
  CheckCircle, 
  CheckCircle2, 
  ChevronLeft, 
  Tag, 
  HelpCircle, 
  BookOpen, 
  Cpu, 
  Layers, 
  Radio, 
  Terminal, 
  Binary, 
  Microchip,
  Calendar,
  Building
} from "lucide-react";

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

const difficultyClass: Record<string, string> = {
  easy: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  hard: "bg-error/15 text-error border-error/20",
};

const typeLabel: Record<string, string> = {
  concept: "概念题",
  choice: "选择题",
  "code-reading": "代码阅读题",
};

export function QuestionClient({ question }: { question: Question }) {
  const { isMastered, toggleMastery } = useMastery();
  const mastered = isMastered(question.id);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const dirMeta = directionMeta[question.direction] ?? { name: question.direction, icon: HelpCircle };
  const Icon = dirMeta.icon;

  const choices = question.choices ?? [];

  const handleToggle = useCallback(() => {
    toggleMastery(question.id);
  }, [toggleMastery, question.id]);

  function getChoiceState(choiceId: string) {
    // Show correct answer anyway on detail page for maximum study efficiency
    const choice = choices.find((c) => c.id === choiceId);
    if (choice?.correct) return "correct";
    if (selectedChoice === choiceId && !choice?.correct) return "incorrect";
    return "idle";
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-slide-up space-y-6">
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/library"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "group flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground pl-2"
          )}
        >
          <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>返回题库</span>
        </Link>

        {/* Mastery Toggle Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 border",
            mastered
              ? "bg-success/15 border-success/30 text-success hover:bg-success/20"
              : "bg-foreground text-background border-transparent hover:bg-brand hover:text-black"
          )}
        >
          {mastered ? (
            <>
              <CheckCircle2 className="size-3.5 animate-scale-up" />
              <span>已掌握</span>
            </>
          ) : (
            <>
              <div className="size-1.5 rounded-full bg-background animate-pulse" />
              <span>标记掌握</span>
            </>
          )}
        </button>
      </div>

      {/* Main Question Panel */}
      <div className="glass glass-dark rounded-2xl border border-foreground/5 p-6 shadow-xl space-y-6">
        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2 py-0.5 rounded border border-foreground/5">
            {question.id}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20 uppercase tracking-wider">
            <Icon className="size-3 shrink-0" />
            <span>{dirMeta.name}</span>
          </span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
            difficultyClass[question.difficulty] || "bg-foreground/5 text-muted-foreground"
          )}>
            {difficultyLabel[question.difficulty] || question.difficulty}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full border border-foreground/5">
            {typeLabel[question.type] || question.type}
          </span>
        </div>

        {/* Question Title */}
        <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-foreground">
          {question.title}
        </h1>

        {/* Question Body */}
        {question.type === "code-reading" ? (
          <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4 overflow-x-auto shadow-inner">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre text-foreground/90">
              <code>{question.body}</code>
            </pre>
          </div>
        ) : (
          <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap bg-foreground/[0.01] p-4 rounded-xl border border-foreground/[0.03]">
            {question.body}
          </div>
        )}

        {/* Choice list for Choice questions */}
        {question.type === "choice" && choices.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {choices.map((choice) => {
              const state = getChoiceState(choice.id);
              const isSelected = selectedChoice === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setSelectedChoice(choice.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left text-[13px] font-medium transition-all duration-200",
                    state === "idle" && "bg-foreground/[0.01] border-foreground/5 hover:bg-foreground/[0.03] hover:border-foreground/15",
                    state === "correct" && "bg-success/5 border-success/30 text-success shadow-sm",
                    state === "incorrect" && "bg-error/5 border-error/30 text-error shadow-sm"
                  )}
                >
                  <span className={cn(
                    "size-5.5 flex items-center justify-center rounded-md text-[11px] font-mono font-bold border transition-colors shrink-0",
                    state === "idle" && "bg-foreground/5 border-foreground/10 text-muted-foreground",
                    state === "correct" && "bg-success/15 border-success/40 text-success",
                    state === "incorrect" && "bg-error/15 border-error/40 text-error"
                  )}>
                    {choice.id.toUpperCase()}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-foreground/90">{choice.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Core Takeaway Answer (Blue Box) */}
        <div className="border-l-4 border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] p-4 rounded-r-xl space-y-1.5 shadow-sm">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">核心答题要点</h4>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
            {question.answer}
          </p>
        </div>

        {/* 3. Deep explanation */}
        {question.explanation && (
          <div className="space-y-2.5 pt-3 border-t border-foreground/5">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">技术演进与深度解析</h4>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap bg-foreground/[0.01] p-4 rounded-xl border border-foreground/[0.03]">
              {question.explanation}
            </div>
          </div>
        )}

        {/* 4. Tips / Handbook Notes (Yellow Box) */}
        <div className="border-l-4 border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] p-4 rounded-r-xl space-y-2 shadow-sm">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">面试官视角与底层建议</h4>
          <div className="text-xs leading-relaxed text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-amber-500" />
              <span>考察要点：该题主要考察底层嵌入式系统的核心概念与高级实践技巧。</span>
            </div>
            {question.companies.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-amber-500" />
                <span>
                  历史考点：曾出现在 <strong>{question.companies.map(c => companyNames[c] || c).join("、")}</strong> 等公司的技术面试中。
                </span>
              </div>
            )}
            {question.interviewYear && (
              <div className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-amber-500" />
                <span>出镜年份：{question.interviewYear} 年 {question.interviewRound || "技术面"}。</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Tag badging */}
        {question.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center pt-3 border-t border-foreground/5">
            <Tag className="size-3.5 text-muted-foreground/60 mr-1" />
            {question.tags.map((t) => (
              <span key={t} className="text-[10px] font-semibold text-muted-foreground/80 bg-foreground/5 px-2 py-0.5 rounded border border-foreground/5">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Extra metadata details card */}
      <div className="glass glass-dark rounded-2xl border border-foreground/5 p-4 shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-foreground/5">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">掌握状态</span>
            <span className={cn("text-xs font-bold", mastered ? "text-success" : "text-muted-foreground")}>
              {mastered ? "已掌握" : "未学习 / 复习中"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">公司背景</span>
            <span className="text-xs font-bold text-foreground">
              {question.companies.length > 0 ? question.companies.map(c => companyNames[c] || c).join(", ") : "公开题库"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">真题年份</span>
            <span className="text-xs font-bold text-foreground">
              {question.interviewYear ? `${question.interviewYear} 年` : "未录入"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">数据来源</span>
            <span className="text-xs font-bold text-foreground truncate max-w-full block px-2">
              {question.source || "EmbedStudio"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
