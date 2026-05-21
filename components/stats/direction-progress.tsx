import { Progress } from "@/components/ui/progress";
import type { DirectionProgress } from "@/lib/services/stats-service";

const directionNames: Record<string, string> = {
  "c-language": "C 语言",
  mcu: "MCU 裸机开发",
  rtos: "RTOS",
  protocol: "通信协议",
  "linux-embedded": "Linux 嵌入式",
  algorithm: "数据结构与算法",
  "interview-mixed": "面试综合",
};

export function DirectionProgressList({
  items,
}: {
  items: DirectionProgress[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const pct = item.total > 0 ? Math.round((item.learned / item.total) * 100) : 0;
        const masteredPct = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;

        return (
          <div key={item.direction} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {directionNames[item.direction] ?? item.direction}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.learned}/{item.total}
                {item.mastered > 0 && (
                  <span className="text-success ml-1">({item.mastered} 掌握)</span>
                )}
              </span>
            </div>
            <div className="relative">
              <Progress value={pct} className="h-2" />
              {masteredPct > 0 && (
                <Progress
                  value={masteredPct}
                  className="absolute inset-0 h-2 [&_[data-slot=progress-indicator]]:bg-success"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
