import type { Question } from "@/lib/domain";

type Props = { question: Question; showAnswer: boolean };

export function ConceptRenderer({ question, showAnswer }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{question.body}</p>
      </div>
      {showAnswer && (
        <div className="mt-3 rounded-lg border bg-muted/50 p-3.5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">答案</h3>
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
