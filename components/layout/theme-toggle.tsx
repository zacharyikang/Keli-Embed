"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/utils/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
    >
      {theme === "dark" ? (
        <Sun className="size-5 text-warning" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  );
}
