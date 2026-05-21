"use client";

import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastItem } from "@/lib/utils/use-toast";

const iconMap: Record<ToastItem["type"], React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap: Record<ToastItem["type"], string> = {
  info: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  success: "border-green-500/50 bg-green-500/10 text-green-400",
  warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  error: "border-red-500/50 bg-red-500/10 text-red-400",
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm"
    >
      {toasts.map((item) => {
        const Icon = iconMap[item.type];
        return (
          <div
            key={item.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-slide-in-right",
              colorMap[item.type],
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              aria-label="关闭通知"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
