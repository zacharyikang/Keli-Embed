"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/storage/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resending
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setStep("otp");
    setCountdown(60);
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    const supabase = createBrowserSupabase();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: "signup",
    });

    setVerifying(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/today");
    router.refresh();
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setError(null);

    const supabase = createBrowserSupabase();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setCountdown(60);
  }

  if (step === "otp") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>验证邮箱</CardTitle>
          <CardDescription>
            我们已向 {email} 发送了验证码，请输入 6 位数字验证码以完成注册。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp">验证码</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="请输入 6 位验证码"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoComplete="one-time-code"
                className="text-center font-mono text-lg tracking-[0.2em]"
              />
            </div>
            {error && (
              <p className="text-sm text-error">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? "验证中..." : "验证并注册"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 justify-center text-sm">
          <button
            onClick={handleResendOtp}
            disabled={countdown > 0}
            className="text-brand hover:underline disabled:text-muted-foreground disabled:no-underline font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `重新发送验证码 (${countdown}s)` : "重新发送验证码"}
          </button>
          <button
            onClick={() => {
              setStep("form");
              setError(null);
            }}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            返回修改邮箱/密码
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>注册 EmbedStudio</CardTitle>
        <CardDescription>创建账号开始科学刷题</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少6位字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "发送验证码中..." : "注册并发送验证码"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/auth/sign-in" className="text-brand underline underline-offset-4">
            登录
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
