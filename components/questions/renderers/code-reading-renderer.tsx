import type { Question } from "@/lib/domain";

type Props = { question: Question; showAnswer: boolean };

export function CodeReadingRenderer({ question, showAnswer }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-muted/50 p-3 overflow-x-auto">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {question.body}
        </pre>
      </div>
      {showAnswer && (
        <div className="rounded-lg border bg-muted/50 p-3.5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">代码分析</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.answer}</p>
          {question.explanation && (
            <div className="mt-2.5 border-t pt-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">解析</h3>
              <p className="text-[13px] text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
