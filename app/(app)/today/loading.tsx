export default function TodayLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto w-full animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-12 rounded bg-muted" />
        <div className="h-1.5 flex-1 rounded bg-muted" />
      </div>
      <div className="h-[300px] rounded-xl bg-muted" />
      <div className="flex justify-end">
        <div className="h-8 w-24 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 flex-1 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
