import { Suspense } from "react";
import { LibraryClient } from "./library-client";

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080B10] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">加载题库中...</span>
        </div>
      </div>
    }>
      <LibraryClient />
    </Suspense>
  );
}
