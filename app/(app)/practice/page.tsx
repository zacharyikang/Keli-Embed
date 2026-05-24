import { Suspense } from "react";
import { PracticeClient } from "./practice-client";

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      }
    >
      <PracticeClient />
    </Suspense>
  );
}
