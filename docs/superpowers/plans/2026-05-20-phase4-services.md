# Phase 4: 业务服务层 (Services + Server Actions)

## Goal

把 SRS 纯函数 + 存储接口组装成完整的业务操作。所有 Service 可只用 LocalStore 测试。Server Actions 是薄封装，只负责选择 Store 实现。

## Architecture

```
lib/services/
├── review-service.ts       # submitAnswer 核心流程
├── queue-service.ts        # getTodayQueue / fetchDueAndWeakCards
├── library-service.ts      # listByCompany / listByDirection
├── stats-service.ts        # getStats / directionProgress
└── index.ts                # barrel

lib/actions/
├── review-actions.ts       # submitAnswerAction (Server Action)
├── queue-actions.ts        # getTodayQueueAction
└── library-actions.ts      # getLibraryDataAction

tests/services/
├── review-service.test.ts
└── queue-service.test.ts
```

## Service Design

所有 Service 函数接受依赖注入作为第一个参数，`userId` 作为第二个参数（由调用方从 auth context 提取）：

```typescript
type ServiceDeps = {
  cardStore: CardStore;
  logStore: ReviewLogStore;
  questionStore?: QuestionStore;  // 按需
};
```

Service 层不引入任何具体存储实现（ESLint 禁止 import supabase/local）。

## Review Service

```typescript
export async function submitAnswer(
  deps: { cardStore: CardStore; logStore: ReviewLogStore },
  userId: string,
  qid: string,
  rating: Rating,
  now: Date,
  context?: { mode?: 'review' | 'practice'; queueSource?: ReviewLog['queueSource'] },
): Promise<CardState> {
  const prev = (await deps.cardStore.get(userId, qid)) ?? emptyCardState(qid);
  const scheduled = schedule(prev, rating, now);
  const final = maybeUnmarkWeak(scheduled, rating);

  await deps.cardStore.saveWithLog(userId, final, {
    questionId: qid,
    rating,
    prevInterval: prev.intervalDays,
    nextInterval: final.intervalDays,
    mode: context?.mode ?? 'review',
    queueSource: context?.queueSource ?? 'due',
    clientId: null,
    reviewedAt: now,
  });

  return final;
}
```

### 流程

```
get(userId, qid) → CardState | null
  → emptyCardState if null
  → schedule(state, rating, now)              # 纯函数
  → maybeUnmarkWeak(scheduled, rating)        # 纯函数
  → saveWithLog(userId, final, log)           # 原子性边界
  → return final
```

## Queue Service

```typescript
export async function getTodayQueue(
  deps: { cardStore: CardStore; questionStore: QuestionStore },
  userId: string,
  now: Date,
  options?: { dailyNewLimit?: number; dailyTotalLimit?: number },
): Promise<ScheduledCard[]> {
  // 1. 取到期 / 薄弱卡片
  const states = await deps.cardStore.findDueOrWeak(userId, now);
  const weakCards = states.filter(s => s.isWeak);
  const dueCards = states.filter(s => !s.isWeak && s.dueAt <= now);

  // 2. 取新题候选池
  const limit = options?.dailyNewLimit ?? 10;
  const candidates = await deps.questionStore.findNewCandidates(userId, limit * 5);

  // 3. 纯函数调度
  return buildTodayQueue({
    weakCards,
    dueCards,
    newCardsCandidates: candidates,
    dailyNewLimit: limit,
    dailyTotalLimit: options?.dailyTotalLimit ?? 50,
  });
}
```

### 关键决策

- 两次显式查询 + 内存 join（spec §3.3）。不建 Postgres 视图
- `findDueOrWeak` 在 CardStore 接口中定义，由各实现在自己的存储层做
- 候选池大小 = `dailyNewLimit * 5`，避免全表扫描

## Library Service

```typescript
export async function listByCompany(
  deps: { questionStore: QuestionStore; cardStore?: CardStore },
  companySlug: string,
  userId?: string,        // 可选，传入则带进度信息
): Promise<{ question: Question; progress?: { reviewed: number; total: number } }[]>

export async function listByDirection(
  deps: { questionStore: QuestionStore },
  directionSlug: string,
): Promise<Question[]>
```

- `listByCompany` 返回题列表 + 可选进度（已学/总数）
- `listByDirection` 返回方向下所有题

## Stats Service

```typescript
export async function getStats(
  deps: { cardStore: CardStore; logStore: ReviewLogStore; questionStore: QuestionStore },
  userId: string,
): Promise<UserStats>

type UserStats = {
  totalLearned: number;                  // 学过至少一次的总题数
  streakCount: number;                   // 连续打卡天数
  totalReviews: number;                  // 总答题次数
  averageRating: number;                 // 平均评分
  directionProgress: DirectionProgress[];// 各方向掌握度
  recentActivity: Record<string, number>;// 近 30 天每日答题数
};

type DirectionProgress = {
  direction: string;
  total: number;
  learned: number;
  mastered: number;                      // 间隔 > 21 天的题 = 已掌握
};
```

## Server Actions (薄封装)

选择 Store 实现 + 调 service，不写业务逻辑：

```typescript
// lib/actions/review-actions.ts
'use server';

import { createServerSupabase } from '@/lib/storage/supabase/client';
import { SupabaseCardStore, SupabaseReviewLogStore } from '@/lib/storage/supabase';
import { submitAnswer } from '@/lib/services/review-service';
import { getCurrentUser } from '@/lib/auth/server';

export async function submitAnswerAction(qid: string, rating: Rating) {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser(supabase);
  if (!user) throw new AuthError('未登录');
  const cardStore = new SupabaseCardStore(supabase);
  const logStore = new SupabaseReviewLogStore(supabase);
  return submitAnswer({ cardStore, logStore }, user.id, qid, rating, new Date());
}
```

Phase 4 中 Server Actions 文件创建但运行时需 Supabase（推迟到 Phase 5 验证）。

## Test Plan

### review-service.test.ts (使用 LocalStore)
```
- submitAnswer when card doesn't exist yet → creates with emptyCardState
- submitAnswer existing card → updates SRS state
- submitAnswer triggers unmarkWeak after 2× good
- submitAnswer with 'again' resets interval
- submitAnswer preserves isWeak when rating is 'hard' or 'again'
```

### queue-service.test.ts (使用 LocalStore)
```
- getTodayQueue includes weak before due before new
- getTodayQueue respects dailyNewLimit
- getTodayQueue returns empty when nothing due/weak/new
- getTodayQueue with mixed states correctly separates buckets
```

## Verification

- 所有 service 测试使用 LocalStore 通过
- Service 文件不能 import `lib/storage/supabase/` / `lib/storage/local/` / `@supabase/*`
- Server Action 文件编译通过
- 所有 service 函数签名含 `userId` 参数，与 CardStore 接口一致
