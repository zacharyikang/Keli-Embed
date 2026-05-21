import { cn } from "@/lib/utils";

type ActivityData = Record<string, number>;

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 5) return "bg-success/20";
  if (count <= 15) return "bg-success/40";
  if (count <= 30) return "bg-success/60";
  return "bg-success/80";
}

/**
 * Displays a simple activity heatmap as a grid of colored squares.
 * Each cell represents one day for the past `weeks * 7` days.
 */
export function Heatmap({
  data,
  weeks = 18,
}: {
  data: ActivityData;
  weeks?: number;
}) {
  const days = weeks * 7;
  const cells: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: data[key] ?? 0 });
  }

  // Build rows by week (7 days per row)
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-0.5 flex-wrap">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.map((cell) => (
            <div
              key={cell.date}
              className={cn(
                "size-3 rounded-[2px]",
                getIntensityClass(cell.count),
              )}
              title={`${cell.date}: ${cell.count} 次复习`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
