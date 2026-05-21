import { createServerSupabase } from "@/lib/storage/supabase/client";
import { SupabaseQuestionStore } from "@/lib/storage/supabase";
import type { Question } from "@/lib/domain";
import { QuestionClient } from "./question-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let question: Question | null = null;
  let error: string | null = null;

  try {
    const supabase = await createServerSupabase();
    const questionStore = new SupabaseQuestionStore(supabase);
    question = await questionStore.getById(id);

    if (!question) {
      error = "题目不存在";
    }
  } catch (err) {
    console.error("Failed to load question details:", err);
    error = "加载失败，请稍后重试";
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">{error ?? "题目不存在"}</h2>
        <Link
          href="/library"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          返回题库
        </Link>
      </div>
    );
  }

  return <QuestionClient question={question} />;
}
