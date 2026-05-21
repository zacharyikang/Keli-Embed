import type { Question } from "@/lib/domain";

type Props = { question: Question; showAnswer: boolean };

export function CodeReadingRenderer({ question, showAnswer }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {question.body}
        </pre>
      </div>
      {showAnswer && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">代码分析</h3>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{question.answer}</p>
          {question.explanation && (
            <div className="mt-3 border-t pt-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">解析</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
