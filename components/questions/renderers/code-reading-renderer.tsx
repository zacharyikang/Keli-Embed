import type { Question } from "@/lib/domain";

type Props = { question: Question; showAnswer: boolean };

export function CodeReadingRenderer({ question, showAnswer }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative group/code w-full">
        <div className="rounded-lg border bg-muted/50 p-3 overflow-x-auto custom-scrollbar">
          <pre className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre">
            {question.body}
          </pre>
        </div>
        {/* Right-side gradient overlay indicating scroll availability */}
        <div className="pointer-events-none absolute right-px top-px bottom-px w-8 rounded-r-lg bg-gradient-to-l from-background/40 to-transparent opacity-80" />
      </div>
      {showAnswer && (
        <div className="rounded-lg border bg-muted/50 p-3.5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">代码分析</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.answer.replace(/\\n/g, "\n")}</p>
          {question.explanation && (
            <div className="mt-2.5 border-t pt-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">解析</h3>
              <p className="text-[13px] text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
                {question.explanation.replace(/\\n/g, "\n")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
