# Phase 5: Supabase 后端 (DB + Auth + SupabaseStore)

## Goal

完成所有 Supabase 相关代码：数据库迁移、RLS 策略、SupabaseStore 实现、认证流程、登录/注册 UI、middleware。

## Architecture

```
supabase/
├── migrations/
│   ├── 001_questions.sql
│   ├── 002_directions.sql
│   ├── 003_companies.sql
│   ├── 004_question_companies.sql
│   ├── 005_user_card_states.sql
│   ├── 006_review_logs.sql
│   ├── 007_user_profiles.sql
│   └── 008_auto_create_profile.sql    (trigger)
├── seed.sql                            (directions, companies, 30+ sample questions)

lib/storage/supabase/
├── client.ts           # createServerSupabase / createBrowserSupabase / createServiceRoleSupabase
├── card-store.ts       # SupabaseCardStore (userId 参数接收但由 RLS 实际过滤)
├── question-store.ts   # SupabaseQuestionStore
├── review-log-store.ts # SupabaseReviewLogStore
├── profile-store.ts    # SupabaseProfileStore
└── index.ts

lib/auth/
├── server.ts           # getCurrentUser(supabase): Promise<User | null>
├── client.ts           # useUser / useSession hooks
└── provider.tsx        # AuthProvider (Context, onAuthStateChange)

components/auth/                # ★ 认证 UI 归属 Phase 5，不归属 Phase 6
├── sign-in-form.tsx            # 登录表单（GitHub OAuth + 邮箱密码 Tab）
└── sign-up-form.tsx            # 注册表单

app/auth/
├── sign-in/page.tsx            # 引用 SignInForm
├── sign-up/page.tsx            # 引用 SignUpForm
└── callback/route.ts           # OAuth 回调处理

middleware.ts                   # 保护 /(app) 路由
```

## Migration Design

### 001_questions.sql

```sql
create table questions (
  id              text primary key,
  title           text not null,
  body            text not null,
  type            text not null check (type in ('concept','choice','code-reading')),
  direction       text not null references directions(slug),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  tags            text[] default '{}',
  answer          text not null,
  explanation     text,
  choices         jsonb,
  companies       text[] default '{}',
  interview_year  integer,
  interview_round text check (interview_round in ('笔试','一面','二面','三面','终面')),
  source          text,
  is_interview    boolean generated always as (array_length(companies, 1) > 0) stored,
  is_premium      boolean default false,
  deleted_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index on questions (direction);
create index on questions (difficulty);
create index on questions using gin (tags);
create index on questions using gin (companies);
```

### 002 → 007 (其余表)

按 spec §3.2 完全对应的 DDL，含：
- 所有约束、默认值、外键
- `user_card_states` 复合主键 `(user_id, question_id)`
- `review_logs` mode/queue_source check 约束
- `directions` / `companies` 基础数据表

### RLS 策略

所有迁移文件内直接带 RLS 策略：
- 用户数据表: `using (auth.uid() = user_id)` + `with check (auth.uid() = user_id)`
- 题库表: `using (deleted_at is null)` + `for select` (所有人可读)
- `directions` / `companies` / `question_companies`: `using (true)` + `for select`

### 008_auto_create_profile.sql

```sql
create function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  insert into public.user_profiles (user_id, username)
  values (new.id, new.raw_user_meta_data ->> 'user_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## SupabaseStore Implementation

### 设计原则

CardStore 接口所有方法接收 `userId` 参数（与 LocalStore 接口一致）。SupabaseStore 端接收 `userId` 但可忽略——实际数据隔离由 RLS 策略在数据库层保证。这样两端签名统一，service 层无需关心底层实现。

### SupabaseCardStore

```typescript
export class SupabaseCardStore implements CardStore {
  constructor(private supabase: SupabaseClient) {}

  async get(_userId: string, questionId: string): Promise<CardState | null> {
    // userId 由 RLS 自动过滤，此处接收但忽略
    const { data } = await this.supabase
      .from('user_card_states')
      .select('*')
      .eq('question_id', questionId)
      .single();
    return data ? mapRowToCardState(data) : null;
  }

  async getMany(_userId: string, questionIds: string[]): Promise<CardState[]> { ... }
  async findByUser(_userId: string): Promise<CardState[]> { ... }
  async findDueOrWeak(_userId: string, now: Date): Promise<CardState[]> { ... }

  async save(_userId: string, state: CardState): Promise<void> {
    const { error } = await this.supabase
      .from('user_card_states')
      .upsert(mapCardStateToRow(state));
    if (error) throw error;
  }

  async saveWithLog(_userId: string, state: CardState, log: Omit<ReviewLog, 'id' | 'userId'>): Promise<void> {
    // 使用 Supabase RPC 调 Postgres 函数包事务
    // userId 由 RPC 内部从 auth.uid() 获取，不通过参数传入
    const { error } = await this.supabase.rpc('save_review_with_log', {
      p_question_id: state.questionId,
      p_ease_factor: state.easeFactor,
      p_interval_days: state.intervalDays,
      p_repetitions: state.repetitions,
      p_due_at: state.dueAt.toISOString(),
      p_is_weak: state.isWeak,
      p_weak_marked_at: state.weakMarkedAt?.toISOString() ?? null,
      p_last_rating: state.lastRating,
      p_last_reviewed_at: state.lastReviewedAt?.toISOString() ?? null,
      p_total_reviews: state.totalReviews,
      // log fields (不含 userId，RPC 内部从 auth.uid() 获取)
      p_rating: log.rating,
      p_prev_interval: log.prevInterval,
      p_next_interval: log.nextInterval,
      p_mode: log.mode,
      p_queue_source: log.queueSource,
      p_client_id: log.clientId,
      p_reviewed_at: log.reviewedAt.toISOString(),
    });
    if (error) throw error;
  }

  async remove(_userId: string, questionId: string): Promise<void> { ... }
}
```

### Snake↔Camel 转换

所有 snake_case 转换集中在 `lib/storage/supabase/card-store.ts` 文件底部：

```typescript
function mapRowToCardState(row: any): CardState {
  return {
    questionId: row.question_id,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueAt: new Date(row.due_at),
    isWeak: row.is_weak,
    weakMarkedAt: row.weak_marked_at ? new Date(row.weak_marked_at) : null,
    lastRating: row.last_rating,
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
    totalReviews: row.total_reviews,
  };
}
```

### save_review_with_log RPC

```sql
create function save_review_with_log(
  p_question_id text,
  p_ease_factor float,
  p_interval_days integer,
  p_repetitions integer,
  p_due_at timestamptz,
  p_is_weak boolean,
  p_weak_marked_at timestamptz,
  p_last_rating text,
  p_last_reviewed_at timestamptz,
  p_total_reviews integer,
  p_rating text,
  p_prev_interval integer,
  p_next_interval integer,
  p_mode text,
  p_queue_source text,
  p_client_id text,
  p_reviewed_at timestamptz
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
begin
  insert into user_card_states (user_id, question_id, ease_factor, interval_days, repetitions, due_at, is_weak, weak_marked_at, last_rating, last_reviewed_at, total_reviews, updated_at)
  values (v_user_id, p_question_id, p_ease_factor, p_interval_days, p_repetitions, p_due_at, p_is_weak, p_weak_marked_at, p_last_rating, p_last_reviewed_at, p_total_reviews, now())
  on conflict (user_id, question_id) do update set
    ease_factor = excluded.ease_factor,
    interval_days = excluded.interval_days,
    repetitions = excluded.repetitions,
    due_at = excluded.due_at,
    is_weak = excluded.is_weak,
    weak_marked_at = excluded.weak_marked_at,
    last_rating = excluded.last_rating,
    last_reviewed_at = excluded.last_reviewed_at,
    total_reviews = excluded.total_reviews,
    updated_at = now();

  insert into review_logs (user_id, question_id, rating, prev_interval, next_interval, mode, queue_source, client_id, reviewed_at)
  values (v_user_id, p_question_id, p_rating, p_prev_interval, p_next_interval, p_mode, p_queue_source, p_client_id, p_reviewed_at);
end;
$$;
```

关键变更：RPC 不再接收 `p_user_id` 参数，改为内部从 `auth.uid()` 获取。这消除了一类安全隐患（客户端不可伪造 userId）。

## Supabase Client

```typescript
// lib/storage/supabase/client.ts
import { createServerClient } from '@supabase/ssr';
import { createBrowserClient } from '@supabase/ssr';

export async function createServerSupabase() {
  const { cookies } = await import('next/headers');
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookies().getAll() } },
  );
}

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function createServiceRoleSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

## Auth Flow

### AuthProvider (`lib/auth/provider.tsx`)
- 用 Supabase `onAuthStateChange` 监听会话
- 提供 `useUser()` 和 `useSession()` hooks
- 包裹 `(app)` layout

### getCurrentUser (`lib/auth/server.ts`)
- 接收 `supabase` client 参数（由调用方创建）
- 调用 `supabase.auth.getUser()` 返回 `User | null`
- 不抛异常，由调用方决定跳转

```typescript
export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}
```

### Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value }) => res.cookies.set(name, value)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL('/auth/sign-in', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return res;
}

export const config = {
  matcher: ['/((?!auth|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### 认证页面

- `/auth/sign-in`: 引用 `SignInForm` 组件（GitHub OAuth + 邮箱密码 Tab）
- `/auth/sign-up`: 引用 `SignUpForm` 组件（邮箱注册）
- `/auth/callback`: OAuth 回调处理（`supabase.auth.exchangeCodeForSession`）

### 认证表单组件（归属 Phase 5，非 Phase 6）

- `components/auth/sign-in-form.tsx` — Client Component，含 GitHub OAuth 按钮 + 邮箱/密码 Tab
- `components/auth/sign-up-form.tsx` — Client Component，邮箱注册表单

表单组件依赖 shadcn/ui 的 Button/Card/Input 组件，需在 Phase 6 shadcn 组件安装完成后才能渲染。Phase 5 中先创建文件骨架，等 Phase 6 安装完 shadcn 组件后替换为完整 UI。

### Middleware POC 验证

Phase 5 实现 middleware 后需验证的关键场景：
1. 未登录访问 `/today` → 302 到 `/auth/sign-in?redirect=/today`
2. 登录完成后 redirect 回 `/today`
3. 已登录访问 `/auth/sign-in` → 直接跳 `/today`
4. 公开路由 (`/`, `/q/*`) 不触发拦截

## Seed Data

`supabase/seed.sql` 包含：
- 8 个 directions（c-language, mcu, rtos, protocol, hardware, linux-embedded, algorithm, interview-mixed）
- 5 个 companies（huawei, dji, hikvision, byd, xiaomi）
- 30+ 样本题目覆盖各方向和公司

## Verification

- SupabaseStore contract tests 通过（与 Phase 3 LocalStore 相同断言）
- Auth flow: sign-up → confirm → redirect → session persists 可操作
- RLS: 用 service_role / anon / authenticated 三种角色验证数据隔离
- middleware 拦截未登录访问 `/today` → 跳转 sign-in
- sign-in 完成后 redirect 回原路径
- `save_review_with_log` RPC 内 `auth.uid()` 获取 userId（不可伪造）
