"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import { useUser, useSignOut, useAuthLoading } from "@/lib/auth/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const user = useUser();
  const loading = useAuthLoading();
  const signOut = useSignOut();
  const router = useRouter();

  if (loading) {
    return <div className="size-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <a
        href="/auth/sign-in"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        登录
      </a>
    );
  }

  const initials = (user.email?.slice(0, 2) ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs bg-brand text-black font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
            {user.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/stats")}
          className="cursor-pointer"
        >
          <User className="mr-2 size-4" />
          个人主页
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 size-4" />
          设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 size-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
