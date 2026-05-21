# Phase 1: 项目脚手架 + 领域类型 + 开发工具链

## Goal

可编译、可 lint、可测试的项目骨架。所有领域类型定义完成，工具链验证通过。

## Architecture

```
embedstudio/
├── package.json                  # Next.js 16 + 依赖
├── tsconfig.json                 # TypeScript strict + @/ path alias
├── next.config.ts                # Next.js 配置
├── eslint.config.mjs             # ESLint + 分层边界规则
├── vitest.config.ts              # Vitest + jsdom
├── postcss.config.mjs            # Tailwind CSS v4 PostCSS
├── .gitignore
├── .env.local.example
├── app/
│   ├── layout.tsx                # Root layout: Geist fonts, 主题 inline script
│   ├── globals.css               # 品牌色 CSS 变量 (+ dark/light 主题)
│   ├── page.tsx                  # 落地页占位
│   ├── (app)/layout.tsx          # 应用布局壳
│   └── (marketing)/layout.tsx    # 营销页布局壳
├── lib/
│   ├── domain/                   # 纯领域类型
│   │   ├── card-state.ts         # CardState + emptyCardState
│   │   ├── question.ts           # Question, QuestionType, QuestionChoice
│   │   ├── rating.ts             # Rating 类型 + 常量
│   │   ├── review-log.ts         # ReviewLog
│   │   ├── direction.ts          # Direction
│   │   ├── company.ts            # Company
│   │   ├── user.ts               # User
│   │   └── index.ts              # barrel export
│   ├── errors/                   # 错误类型
│   │   ├── app-error.ts          # AppError 基类
│   │   ├── network-error.ts      # 网络异常
│   │   ├── auth-error.ts         # 认证过期
│   │   ├── validation-error.ts   # 校验失败
│   │   ├── not-found-error.ts    # 资源不存在
│   │   └── index.ts              # barrel export
│   └── utils/
│       └── cn.ts                 # clsx + tailwind-merge
├── tests/
│   └── domain/
│       └── card-state.test.ts    # emptyCardState 测试 (12 cases)
└── docs/superpowers/plans/       # 实施计划
```

## 技术选型

| 决策 | 选择 | 理由 |
|------|------|------|
| 包管理器 | npm | create-next-app 默认 |
| CSS 方案 | Tailwind CSS v4 | @theme inline 定义令牌 |
| UI 工具 | shadcn/ui | 按需安装，CSS 变量主题 |
| 测试框架 | Vitest + jsdom | 原生 TS/ESM，快速 |
| ESLint | v9 flat config + no-restricted-imports | 原生支持，无需第三方插件 |
| 字体 | Geist Sans + Geist Mono | 设计规范指定 |
| 日期处理 | 原生 Date | 纯函数友好，无外部依赖 |
| 路径别名 | @/ → project root | next/tsconfig 标准配置 |

## ESLint 边界规则

（按 spec §5.3 + §5.6.3 实现）

```
lib/srs/** + lib/domain/**:
  禁止 import: react*, next*, @supabase/*, app/**, components/**, lib/storage/**, lib/services/**, lib/auth/**

lib/storage/**:
  禁止 import: react*, next*, lib/services/**, lib/srs/**, lib/auth/**, app/**, components/**

lib/services/**:
  禁止 import: react*, next*, lib/storage/supabase/**, lib/storage/local/**, lib/auth/**, app/**, components/**, @supabase/*, next/headers, next/server

components/**:
  禁止 import: lib/storage/**, lib/services/**, lib/srs/**, lib/auth/**
```

tests/** 全部解禁。

## 主题设计

CSS 变量方案（已注入 globals.css）：

```css
@theme inline {
  --color-brand: #c4f542;
  --color-brand-hover: #d4ff52;
  --color-bg-primary: #0a0a0a;
  --color-bg-card: #171717;
  --color-border: #262626;
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1a1;
  --color-success: #4ade80;
  --color-error: #f87171;
  --color-warning: #fbbf24;
  /* light variants */
}

:root { --background: #fafafa; --foreground: #0a0a0a; }
.dark  { --background: #0a0a0a; --foreground: #fafafa; }
```

Root layout 含 inline script 从 localStorage 恢复主题偏好，默认 dark。

## Domain Types

### CardState (lib/domain/card-state.ts)
```typescript
type CardState = {
  questionId: string;
  easeFactor: number;       // 默认 2.5，下限 1.3
  intervalDays: number;     // SRS 间隔天数
  repetitions: number;      // 连续答对次数
  dueAt: Date;              // 到期时间
  isWeak: boolean;          // 薄弱点标记
  weakMarkedAt: Date | null;
  lastRating: Rating | null;
  lastReviewedAt: Date | null;
  totalReviews: number;
};

emptyCardState(id: string): CardState
```

### Question (lib/domain/question.ts)
```typescript
type QuestionType = 'concept' | 'choice' | 'code-reading';
type Question = {
  id, title, body, type, direction, difficulty,
  tags, answer, explanation, choices,
  companies, interviewYear, interviewRound, source,
  isPremium, isInterview
};
```

### Rating (lib/domain/rating.ts)
```typescript
type Rating = 'again' | 'hard' | 'good' | 'easy';
```

### Error Types
```typescript
class AppError extends Error    // 基类 (code 属性)
class NetworkError extends AppError    // "网络异常，请重试"
class AuthError extends AppError       // "登录已过期"
class ValidationError extends AppError  // 自定义消息
class NotFoundError extends AppError   // "资源不存在"
```

## Verification

- `npm test` → 12 passed (emptyCardState × 12)
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run dev` → localhost 正常启动
