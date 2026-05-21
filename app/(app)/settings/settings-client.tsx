"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useAuthLoading } from "@/lib/auth/client";
import { useTheme } from "@/lib/utils/theme-provider";
import { getProfileAction, updateDailyGoalAction } from "@/lib/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, Moon, Target, Settings2 } from "lucide-react";

export function SettingsClient() {
  const user = useUser();
  const loading = useAuthLoading();
  const { theme, toggle: toggleTheme } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(20);
  const [goalDirty, setGoalDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    getProfileAction()
      .then((profile) => {
        if (profile) setDailyGoal(profile.dailyGoal);
      })
      .catch(() => {});
  }, [user, loading]);

  const handleSaveGoal = useCallback(async () => {
    setSaving(true);
    try {
      await updateDailyGoalAction(dailyGoal);
      setGoalDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [dailyGoal]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">登录查看设置</h2>
        <p className="text-muted-foreground">登录后可修改个人设置</p>
        <a
          href="/auth/sign-in"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          去登录
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      {/* Daily Goal */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="size-5 text-brand" />
            <CardTitle className="text-base">每日复习目标</CardTitle>
          </div>
          <CardDescription>每天计划复习的卡片数量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-24">
              <Label htmlFor="dailyGoal" className="sr-only">
                每日目标
              </Label>
              <Input
                id="dailyGoal"
                type="number"
                min={5}
                max={200}
                step={5}
                value={dailyGoal}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 5 && val <= 200) {
                    setDailyGoal(val);
                    setGoalDirty(true);
                    setSaved(false);
                  }
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground">题 / 天</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveGoal}
              disabled={!goalDirty || saving}
            >
              {saving ? "保存中..." : saved ? "已保存" : "保存"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="size-5 text-warning" />
            ) : (
              <Sun className="size-5" />
            )}
            <CardTitle className="text-base">主题</CardTitle>
          </div>
          <CardDescription>切换亮色或暗色模式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={toggleTheme}
            >
              <Moon className="size-4 mr-1" />
              暗色
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={toggleTheme}
            >
              <Sun className="size-4 mr-1" />
              亮色
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">关于</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            EmbedStudio v0.1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            嵌入式工程师的科学刷题平台，基于间隔重复算法（SRS）
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
