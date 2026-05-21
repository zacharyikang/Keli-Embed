# EmbedStudio 设计文档

- **创建日期**：2026-05-19
- **状态**：v1.2 确认（§12 开放问题已确认，已移除访客模式，可进入 writing-plans）
- **作者**：Albert（个人公司）
- **产品定位**：面向中国嵌入式软件工程师的"科学刷题"工具，主打面试/笔试题，类似背单词体验
- **商业模式**：MVP 阶段完全免费 → 半年后演进为 Freemium 订阅

### 修订记录

| 版本 | 日期 | 主要变更 |
| --- | --- | --- |
| v1.0 | 2026-05-19 | 初稿（架构 / 数据模型 / SRS / 解耦结构 / UI / 错误处理 / 测试 / 视觉 / 部署） |
| v1.1 | 2026-05-19 | 合并第一轮 subagent 审查反馈，共修复 5 Critical + 9 Important + 4 Minor，详见各章节标注。要点：C1 拆分 Server Action vs 客户端两条 store 选择路径（§5.4 + 新增 §5.6）；C2 删除 `user_due_cards` 视图改 service 层 join（§3.3）；C3 新增 §3.6 命名/类型约定；C4 完整 `CardState` 类型；C5 `markAsWeak` 接受新题；I1/I9 队列排序与新题挑选策略明确化；I4 新增 `question_companies` 关联表；I6 内容同步拆分代码 vs 内容专项两条路径 + §11.5 frontmatter 规范冻结；I8 `saveWithLog` 原子性原语。 |
| v1.2 | 2026-05-20 | §12 开放问题全部确认（共 13 项）；移除访客模式（强制登录），保留双 store 架构用于测试 + 架构预留；更新入口层选择表；Sentry 推迟到 v1.1；新题排序改为用户自选方向；新增 content-quality 备忘录。 |

---

## 1. 概述与目标

### 1.1 产品一句话

EmbedStudio 是一个用"间隔重复算法"帮嵌入式工程师高效记忆和复习面试题/基础题的 Web 应用。

### 1.2 目标用户

- **核心人群**：准备校招/社招的嵌入式软件工程师（国内为主）
- **次级人群**：在职嵌入式工程师做基础查漏补缺
- **品牌价值**：同时作为创始人个人公司的对外作品

### 1.3 核心差异化

| 维度 | 普通题库站（牛客等） | EmbedStudio |
| --- | --- | --- |
| 复习机制 | 自由刷题，无记忆调度 | SRS 间隔重复算法 + 主动标记薄弱点 |
| 内容垂直度 | 综合，嵌入式只是子板块 | 嵌入式垂直，按公司面经 + 知识方向双路径 |
| 使用体验 | 网页论坛感 | 卡片式背单词体验，PWA 可离线 |
| 视觉调性 | 传统、信息密度高 | 暗色 + 电光绿，工程师审美 |

### 1.4 非目标（MVP 不做）

- 在线代码编辑器 / 评测系统（v2 再做）
- 微信登录、手机号登录、ICP 备案（v2 再做）
- 移动端原生 App（v2 用 Capacitor 套壳）
- 用户投稿、评论、社区（长期路线）

---

## 2. 整体架构

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────┐
│  浏览器（PC / 手机）                                          │
│  ├─ Next.js 16 App Router（前端 + 服务端组件）                │
│  ├─ Tailwind + shadcn/ui                                      │
│  ├─ PWA（Service Worker，离线缓存今日队列）                   │
│  └─ localStorage（访客模式学习记录）                          │
└────────────┬─────────────────────────────────────────────────┘
             │ HTTPS
┌────────────▼─────────────────────────────────────────────────┐
│  Vercel（海外节点部署）                                       │
│  ├─ Server Components（首屏 SSR / RSC）                       │
│  ├─ Server Actions（答题、SRS 更新、标记薄弱点）              │
│  └─ Route Handlers（内容同步 webhook）                        │
└────────────┬─────────────────────────────────────────────────┘
             │ Supabase Client SDK
┌────────────▼─────────────────────────────────────────────────┐
│  Supabase                                                     │
│  ├─ Postgres（题库 + 用户学习状态 + SRS 调度）                │
│  ├─ Auth（GitHub OAuth + 邮箱密码）                           │
│  ├─ Row Level Security（用户数据严格隔离）                    │
│  └─ Storage（题目附件图片，可选）                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Git 内容仓库                                                 │
│  └─ content/questions/**/*.md                                 │
│        ↓ 通过同步脚本（Vercel Build Hook 或本地）             │
│        → upsert 到 Supabase questions 表                      │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 关键架构选择

| 决策 | 选择 | 理由 |
| --- | --- | --- |
| 框架 | Next.js 16 App Router | RSC + Server Actions 组合，最适合"内容站 + 应用"混合形态 |
| 后端 | Supabase（不自建） | Auth + DB + RLS 一站式，省 2 周后端开发 |
| 部署 | Vercel 海外节点 | MVP 阶段免备案；后期可加 CDN 或国内备份 |
| 内容存储 | Markdown + Git，构建期同步到 Supabase | 编辑效率高、版本可控、AI 生成的草稿直接粘贴 |
| 写操作 | Server Actions | 前后端类型贯通；不写独立 API |
| 离线 | Service Worker 缓存今日队列 | 地铁无网也能刷 |
| 双 Store 架构 | Supabase 做生产存储，LocalStorage 做测试替身 | 同份契约测试跑两端，验证解耦正确性 |

### 2.3 不变量（项目宪法）

1. **解耦优先**：domain / storage / UI 严格分层，ESLint 边界规则强制
2. **业务核心是纯函数**：SRS 算法、调度策略不依赖任何框架
3. **存储是可替换的**：生产用 Supabase，测试用 LocalStorage，service 层零感知
4. **Server Components 优先**：能 SSR 就不 CSR；Client Components 只用于交互

---

## 3. 数据模型

### 3.1 ER 总览

```
auth.users (Supabase 内置)
   ▲                ▲
   │                │
user_profiles    user_card_states ───┐
                       ▲              │
                       │              ▼
                  review_logs    questions
                                   ▲    ▲
                                   │    │
                              directions companies
```

### 3.2 表结构

#### 3.2.1 `questions` 题目主表

```sql
create table questions (
  id              text primary key,           -- 'huawei-2023-volatile-001'
  title           text not null,
  body            text not null,              -- 题干 Markdown
  type            text not null check (type in ('concept','choice','code-reading')),
  direction       text not null references directions(slug),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  tags            text[]    default '{}',
  answer          text not null,              -- 答案 Markdown
  explanation     text,                       -- 解析 Markdown
  choices         jsonb,                      -- 选择题：[{id,text,correct},...]

  -- 面试题专属字段
  companies       text[]    default '{}',     -- 公司 slug 数组
  interview_year  integer,
  interview_round text check (interview_round in ('笔试','一面','二面','三面','终面')),
  source          text,                       -- '华为 2023 嵌入式社招笔试'
  is_interview    boolean generated always as (array_length(companies, 1) > 0) stored,

  -- 商业化预留
  is_premium      boolean default false,

  deleted_at      timestamptz,                -- 软删除
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index on questions (direction);
create index on questions (difficulty);
create index on questions using gin (tags);
create index on questions using gin (companies);
-- 不再为 is_interview 建独立 btree（GIN(companies) 可覆盖过滤；
-- 如有 ORDER BY 需求，按真实查询模式建 partial index）
```

> **关于 `companies text[]` 的查询权衡**：数组列对"按公司筛题"够用，但"每个公司有多少题"、"用户在每家公司的进度"这类聚合查询需要 unnest，扫描成本高。因此另设关联表 `question_companies` 作为聚合查询的真源，见 §3.2.7。`companies text[]` 保留作为 Markdown frontmatter 直接映射的便利字段，由内容同步脚本同时写入两处。

#### 3.2.2 `user_card_states` 学习状态（SRS 核心表）

```sql
create table user_card_states (
  user_id          uuid    references auth.users on delete cascade,
  question_id      text    references questions(id) on delete cascade,

  -- SRS 算法参数（简化 SM-2）
  ease_factor      real    default 2.5,       -- 易度因子，下限 1.3
  interval_days    integer default 0,
  repetitions      integer default 0,
  due_at           timestamptz default now(),

  -- 用户主动信号
  is_weak          boolean default false,
  weak_marked_at   timestamptz,

  -- 历史汇总
  last_rating      text check (last_rating in ('again','hard','good','easy')),
  last_reviewed_at timestamptz,
  total_reviews    integer default 0,

  updated_at       timestamptz default now(),
  primary key (user_id, question_id)
);

create index on user_card_states (user_id, due_at);
create index on user_card_states (user_id, is_weak) where is_weak = true;
```

#### 3.2.3 `review_logs` 答题日志

```sql
create table review_logs (
  id            bigserial primary key,
  user_id       uuid    references auth.users on delete cascade,
  question_id   text    references questions(id) on delete cascade,
  rating        text    not null check (rating in ('again','hard','good','easy')),
  prev_interval integer,
  next_interval integer,

  -- 上下文：从哪个队列/路径触发的本次答题
  mode          text    not null default 'review'
                check (mode in ('review','practice')),
  queue_source  text    not null default 'due'
                check (queue_source in ('weak','due','new','practice','library_set')),

  -- 客户端会话标识（访客模式有 client_id 无 user_id；登录后合并时保留来源痕迹）
  client_id     text,

  reviewed_at   timestamptz default now()
);

create index on review_logs (user_id, reviewed_at desc);
create index on review_logs (user_id, queue_source);
```

#### 3.2.4 `user_profiles` 用户扩展信息

```sql
create table user_profiles (
  user_id        uuid primary key references auth.users on delete cascade,
  username       text unique,
  avatar_url     text,
  daily_goal     integer default 10,
  streak_count   integer default 0,
  last_active_at timestamptz default now(),
  created_at     timestamptz default now()
);
```

#### 3.2.5 `directions` 知识方向元数据

```sql
create table directions (
  slug          text primary key,             -- 'c-language'
  name          text not null,                -- 'C/C++ 语言基础'
  description   text,
  icon          text,                         -- lucide 图标名
  display_order integer default 0
);
```

初始数据：`c-language` / `mcu` / `rtos` / `protocol` / `hardware` / `linux-embedded` / `algorithm` / `interview-mixed`

#### 3.2.6 `companies` 公司元数据

```sql
create table companies (
  slug          text primary key,             -- 'huawei'
  name          text not null,                -- '华为'
  full_name     text,
  logo_url      text,
  description   text,
  category      text,                         -- '通信'|'消费电子'|'汽车'|'安防'|'家电'|'芯片'|'互联网硬件'
  display_order integer default 0
);
```

初始公司：华为、中兴、大疆、海康、比亚迪、蔚来、理想、小米、OPPO、vivo、美的、地平线、兆易创新、字节火山、阿里平头哥（按题源逐步铺）

可选冗余字段（由内容同步脚本计算并刷新，避免实时聚合）：

```sql
alter table companies add column question_count integer default 0;
```

#### 3.2.7 `question_companies` 题目↔公司 关联表

聚合查询的真源（"华为有几道题"、"用户在华为的进度"）：

```sql
create table question_companies (
  question_id  text references questions(id) on delete cascade,
  company_slug text references companies(slug) on delete cascade,
  primary key (question_id, company_slug)
);

create index on question_companies (company_slug);
```

内容同步脚本 (`lib/content/sync.ts`) 同时维护 `questions.companies` 数组和该关联表，保持一致。`questions.companies` 为只读冗余字段，所有"按公司"的查询走 `question_companies`。

### 3.3 今日待复习题目（已删除视图，改为 service 层组合）

**原设计**：用 Postgres 视图 `user_due_cards` 做 join + 优先级 bucket。
**变更原因**：Postgres 视图与 RLS 的交互不直观（视图默认以 owner 权限执行，PG 15 起才有 `security_invoker = true` 选项），容易在生产产生隐式越权读取。同时视图把"查询逻辑"藏到数据库层，违反了 §2.3 "业务核心是纯函数" 的不变量。

**新方案**：在 `lib/services/queue-service.ts` 中用两次显式查询 + 内存 join：

```ts
// 伪代码（实际为 SupabaseQuestionStore + SupabaseCardStore 协作）
async function fetchDueAndWeakCards(userId: string, now: Date) {
  const states = await cardStore.findDueOrWeak(userId, now);          // user_card_states
  const ids    = states.map(s => s.questionId);
  const qs     = await questionStore.findByIds(ids);                  // questions
  return states.map(s => ({
    state: s,
    question: qs.find(q => q.id === s.questionId)!,
    priorityBucket: s.isWeak ? 0 : 1,
  }));
}
```

RLS 自然生效（两次查询分别走自己表的策略），调度排序逻辑落在 `lib/srs/queue.ts` 纯函数里，可单测。

### 3.4 Row Level Security 策略

`using` 控制能"看到/修改"哪些行；`with check` 控制"写入时新值是否合法"。两者都要设，否则用户可以 INSERT 一行 `user_id = 别人的 uuid` 绕过策略。

```sql
-- 用户数据：仅本人可读写（select/insert/update/delete 全覆盖）
alter table user_card_states enable row level security;
create policy "owners only" on user_card_states
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table review_logs enable row level security;
create policy "owners only" on review_logs
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table user_profiles enable row level security;
create policy "owners only" on user_profiles
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 题库、方向、公司、关联表：所有人可读（含未登录访客通过 anon key）
alter table questions          enable row level security;
alter table directions         enable row level security;
alter table companies          enable row level security;
alter table question_companies enable row level security;
create policy "public read" on questions          for select using (deleted_at is null);
create policy "public read" on directions         for select using (true);
create policy "public read" on companies          for select using (true);
create policy "public read" on question_companies for select using (true);

-- 写入题库的能力仅给 service_role（由内容同步脚本持有），普通用户/anon 不可写
-- 默认不创建 insert/update/delete 策略即可（RLS 默认拒绝）
```

**anon key 只读题库**：上述 `public read` 策略对未登录用户同样生效（`auth.uid()` 为 null 时不影响 select 类策略），但在 MVP 中用户必须先登录才能答题。

### 3.5 本地存储（双 Store 的测试替身 + 架构预留）

MVP 强制登录，但保留 localStorage 端 `LocalCardStore` 实现，用途为：

1. **§8.3 契约测试**：同一份测试用例跑 `SupabaseCardStore` + `LocalCardStore`，验证解耦正确性
2. **架构预留**：未来离线回写、轻量缓存可复用

schema 与 DB 表保持字段名一致：

```ts
// localStorage key: "embedstudio:card_states"
type LocalCardState = {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;            // ISO timestamp
  isWeak: boolean;
  weakMarkedAt: string | null;
  lastRating: 'again' | 'hard' | 'good' | 'easy' | null;
  lastReviewedAt: string | null;
  totalReviews: number;
};
```

`lib/storage/local/` 中的 Store 实现使用 URL-safe base64 编码存储以兼容 localStorage 的字符限制；`dueAt` 等时间字段一律序列化为 ISO 字符串，读回时反序列化为 `Date`。



### 3.6 命名与类型约定（项目宪法的一部分）

跨层一致是解耦的前提。本项目唯一允许的命名/类型转换点是 **`lib/storage/supabase/*`** 内部：

| 层 | 风格 | 示例 |
| --- | --- | --- |
| Postgres 列名 | `snake_case` | `ease_factor`, `is_weak`, `due_at`, `last_reviewed_at` |
| TypeScript 领域类型（`lib/domain/*`） | `camelCase` | `easeFactor`, `isWeak`, `dueAt`, `lastReviewedAt` |
| 域内时间类型 | `Date`（不是字符串） | `dueAt: Date`, `lastReviewedAt: Date \| null` |
| 序列化边界（API / localStorage） | ISO 字符串 | `"2026-05-19T12:34:56.789Z"` |

**强制规则**：

1. `lib/srs/**`、`lib/services/**`、`components/**` 只接触 camelCase + `Date` —— 不感知 SQL 列名、不解析字符串
2. `lib/storage/supabase/*` 是唯一允许写 `snake_case` 字段名和 `new Date(string)` 转换的地方
3. `lib/storage/local/*` 把 `Date` 序列化成 ISO 字符串存 localStorage，读出时反序列化 —— 同样不暴露字符串到外层
4. 跨网络的 Server Action 参数 / 返回值：自动用 Next.js 内置的 superjson 序列化保持 `Date` 不丢类型

ESLint 边界规则（§5.3）保证以上分层不被违反。

---

## 4. SRS 算法

### 4.1 算法选择：简化版 SM-2

SuperMemo 2 算法的简化版本：保留核心思想（易度因子 + 间隔倍增），舍弃过于复杂的细节（如 EF 微调公式）。

### 4.2 用户评价

每答完一道题，用户在四个评价中选一个：

| 评价 | 含义 | 快捷键 |
| --- | --- | --- |
| Again 忘了 | 完全不会 / 答错 | `1` |
| Hard 困难 | 想了很久才想起来 | `2` |
| Good 一般 | 正常想起来了 | `3` |
| Easy 简单 | 一秒就答出来 | `4` |

### 4.3 类型与调度函数（伪代码）

#### 4.3.1 完整 `CardState` 类型

所有 SRS 函数必须接收和返回**完整**的 `CardState`，避免字段丢失：

```ts
type Rating = 'again' | 'hard' | 'good' | 'easy';

type CardState = {
  questionId:     string;
  easeFactor:     number;          // 默认 2.5，下限 1.3
  intervalDays:   number;
  repetitions:    number;
  dueAt:          Date;

  // 用户主动信号
  isWeak:         boolean;
  weakMarkedAt:   Date | null;

  // 历史汇总
  lastRating:     Rating | null;
  lastReviewedAt: Date | null;
  totalReviews:   number;
};

function emptyCardState(questionId: string): CardState {
  return {
    questionId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: new Date(0),       // epoch：表示"从未到期"，buildTodayQueue 当成新题处理
    isWeak: false,
    weakMarkedAt: null,
    lastRating: null,
    lastReviewedAt: null,
    totalReviews: 0,
  };
}
```

#### 4.3.2 `schedule()` 调度函数

```ts
function schedule(state: CardState, rating: Rating, now: Date): CardState {
  const next: CardState = { ...state };   // 始终基于完整 state spread，避免丢字段
  next.lastRating     = rating;
  next.lastReviewedAt = now;
  next.totalReviews   = state.totalReviews + 1;

  if (rating === 'again') {
    // 答错：归零 + 10 分钟后再问
    next.easeFactor   = Math.max(1.3, state.easeFactor - 0.2);
    next.intervalDays = 0;
    next.repetitions  = 0;
    next.dueAt        = addMinutes(now, 10);
    return next;
  }

  // 答对：先调整易度因子
  const easeDelta = { hard: -0.15, good: 0, easy: 0.15 }[rating];
  next.easeFactor = Math.max(1.3, state.easeFactor + easeDelta);

  // 计算新间隔
  let interval: number;
  if (state.repetitions === 0)      interval = 1;     // 首次答对：明天
  else if (state.repetitions === 1) interval = 3;     // 第二次：3 天后
  else                              interval = Math.round(state.intervalDays * next.easeFactor);

  if (rating === 'hard') interval = Math.max(1, Math.round(interval * 0.8));

  next.intervalDays = interval;
  next.repetitions  = state.repetitions + 1;
  next.dueAt        = addDays(now, interval);
  return next;
}
```

### 4.4 典型节奏

| 次数 | 评价 | 之前间隔 | 新间隔 |
| --- | --- | --- | --- |
| 1 | Good | 0 | 1 天 |
| 2 | Good | 1 天 | 3 天 |
| 3 | Good | 3 天 | 8 天（3 × 2.5） |
| 4 | Easy | 8 天 | 21 天（8 × 2.65） |
| 5 | Hard | 21 天 | 39 天（21 × 2.35 × 0.8） |

### 4.5 薄弱点机制

#### 4.5.1 标记

接受 `CardState | null` —— 用户可以标记**从未答过**的新题为薄弱点：

```ts
function markAsWeak(
  state: CardState | null,
  questionId: string,
  now: Date,
): CardState {
  const base = state ?? emptyCardState(questionId);
  return {
    ...base,
    isWeak: true,
    weakMarkedAt: now,
    dueAt: now,           // 立刻进入今日队列
    // 不修改 easeFactor / intervalDays / repetitions / lastRating，避免污染 SRS
  };
}
```

Service 层负责：(a) 调用前用 `cardStore.get(qid)` 取已有 state；(b) 调用后 `cardStore.save(result)`，对新行执行 INSERT，对老行执行 UPDATE（用 upsert）。

#### 4.5.2 自动解除

连续 2 次评价 ≥ Good 时自动清除标记（避免堆积）：

```ts
function maybeUnmarkWeak(state: CardState, newRating: Rating): CardState {
  if (!state.isWeak) return state;
  const goodOrBetter = (r: Rating | null) => r === 'good' || r === 'easy';
  if (goodOrBetter(newRating) && goodOrBetter(state.lastRating)) {
    return { ...state, isWeak: false, weakMarkedAt: null };
  }
  return state;
}
```

#### 4.5.3 标记上限提示

当用户已标记题数 ≥ 30 时，标记按钮旁出现轻提示「已标记 30 题，建议先消化再继续」，不强制拦截。

### 4.6 调度器：今日队列

#### 4.6.1 三层 bucket + 桶内显式排序

```ts
function buildTodayQueue(opts: {
  weakCards: CardState[];           // 用户标记为"不会"
  dueCards:  CardState[];           // due_at <= now 且 !isWeak
  newCardsCandidates: Question[];   // 用户尚未学过的题（候选池）
  dailyNewLimit:   number;          // 默认 10
  dailyTotalLimit: number;          // 默认 50
}): ScheduledCard[] {
  // 桶内排序规则：
  //   weak 桶：weakMarkedAt 早的先出（先标的先消化）
  //   due  桶：dueAt 早的先出（最久没复习的优先）
  //   new  桶：按方向均衡 + 难度从易到难（见 4.6.3）
  const weak = [...opts.weakCards]
    .sort((a, b) => +(a.weakMarkedAt ?? 0) - +(b.weakMarkedAt ?? 0));

  const due = [...opts.dueCards]
    .sort((a, b) => +a.dueAt - +b.dueAt);

  const fresh = pickNewCards(opts.newCardsCandidates, opts.dailyNewLimit);

  return [
    ...weak .map(c => ({ card: c,                       priority: 0 as const })),
    ...due  .map(c => ({ card: c,                       priority: 1 as const })),
    ...fresh.map(q => ({ card: emptyCardState(q.id),    priority: 2 as const, question: q })),
  ].slice(0, opts.dailyTotalLimit);
}
```

#### 4.6.2 "again" 同日重现的处理

`schedule()` 答错时设 `dueAt = now + 10min`。当天再次进 `/today`：

- 10 分钟内：该卡片仍在内存队列里，继续等待；
- 超过 10 分钟：算入 `dueCards` 桶，按 `dueAt asc` 排序，自然靠前；
- 用户当天没刷完关掉应用，第二天打开：上一天的"again 卡片"`dueAt` 已经过去 N 小时，依旧属于到期复习的最前面（不会与昨日历史复习题混乱，因为桶内按 `dueAt asc`）；不引入额外"学习子桶"以保持 MVP 简单。

#### 4.6.3 新题挑选 `pickNewCards`

"新题"定义：用户对此 `questionId` 在 `user_card_states` 中无行。等价的 SQL（登录用户路径）：

```sql
select q.id, q.direction, q.difficulty
from questions q
where q.deleted_at is null
  and not exists (
    select 1 from user_card_states ucs
    where ucs.user_id = $1 and ucs.question_id = q.id
  )
order by q.direction, q.difficulty       -- 稳定排序，再由 service 做均衡
limit $2;                                -- 候选池：dailyNewLimit * 5
```

候选池取出后，纯函数 `pickNewCards(candidates, limit)` 负责均衡：

- 按 `direction` 轮转（round-robin），避免一天里全是 C 语言题；
- 同方向内按 `difficulty` 从易到难（`easy → medium → hard`）；
- 用户已通过 `/library` 选定"开始这套题"加入队列的题，跳过该均衡，按用户选定顺序追加。

`pickNewCards` 是纯函数，可单测。性能上 candidates 限 `limit * 5`（默认 50 行），即使题库膨胀到 5000 题，左反连接也走 `user_card_states (user_id, question_id)` 复合主键索引，查询毫秒级。

### 4.7 自由刷题模式

用户进入 `/practice`，按方向/难度/标签筛选随机出题：

- **不更新** SRS 状态（`user_card_states` 不变）
- **写入** `review_logs`，`mode = 'practice'`
- 让数据分析能区分"复习"和"练习"行为

### 4.8 纯函数纪律

`lib/srs/*` 全部为纯函数：

- 输入 `state + rating + now` → 输出 `newState`
- 不读取 `Date.now()`、不依赖 `Math.random()` 之外的环境
- 不 `import React / Next / Supabase`
- 单测可遍历所有评分组合 + 边界值

---

## 5. 代码结构（解耦原则）

### 5.1 核心原则

> **解耦优先**：所有功能必须能在 (a) 不启动 Next.js (b) 不连数据库 (c) 不渲染 UI 的前提下被单独验证。

### 5.2 目录结构

```
embedstudio/
├── app/                                # Next.js 路由层（仅组装，不写业务）
│   ├── (marketing)/
│   │   └── page.tsx                    # 落地页
│   ├── (app)/
│   │   ├── today/page.tsx
│   │   ├── library/page.tsx
│   │   ├── library/companies/[slug]/page.tsx
│   │   ├── library/directions/[slug]/page.tsx
│   │   ├── practice/page.tsx
│   │   ├── weak/page.tsx
│   │   ├── stats/page.tsx
│   │   └── settings/page.tsx
│   ├── q/[id]/page.tsx                 # 单题直链 / SEO 入口
│   ├── auth/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts
│   └── api/
│       └── content-sync/route.ts       # 构建后内容同步 webhook
│
├── lib/
│   ├── domain/                         # ★ 纯领域类型，无任何依赖
│   │   ├── question.ts
│   │   ├── card-state.ts
│   │   ├── rating.ts
│   │   ├── review-log.ts
│   │   ├── direction.ts
│   │   ├── company.ts
│   │   └── user.ts
│   │
│   ├── srs/                            # ★ SRS 算法（纯函数）
│   │   ├── schedule.ts
│   │   ├── queue.ts
│   │   ├── weak-mark.ts
│   │   ├── ease-factor.ts
│   │   └── __tests__/
│   │
│   ├── storage/                        # ★ 存储抽象层
│   │   ├── card-store.ts               # interface CardStore
│   │   ├── question-store.ts           # interface QuestionStore
│   │   ├── review-log-store.ts         # interface ReviewLogStore
│   │   ├── profile-store.ts            # interface ProfileStore
│   │   ├── supabase/
│   │   │   ├── card-store.ts
│   │   │   ├── question-store.ts
│   │   │   ├── review-log-store.ts
│   │   │   └── profile-store.ts
│   │   └── local/
│   │       ├── card-store.ts           # 读写 localStorage
│   │       ├── question-store.ts       # 从 /public/seed.json 读
│   │       └── review-log-store.ts     # IndexedDB 暂存，恢复网络后回写
│   │
│   ├── services/                       # 组合 storage + srs 的业务用例
│   │   ├── review-service.ts           # submitAnswer(...)
│   │   ├── queue-service.ts            # getTodayQueue(...)
│   │   ├── library-service.ts          # listByCompany / listByDirection
│   │   ├── stats-service.ts
│   │   └── migration-service.ts        # 访客 → 登录用户合并
│   │
│   ├── content/                        # 内容管线
│   │   ├── parse-markdown.ts
│   │   ├── validate.ts
│   │   ├── sync.ts                     # content/*.md → Supabase
│   │   └── extract-seed.ts             # 抽取 seed.json 给访客用
│   │
│   ├── auth/                           # 认证适配层
│   │   ├── server.ts                   # getCurrentUser (Server)
│   │   ├── client.ts                   # useUser (Client hook)
│   │   └── provider.tsx                # AuthProvider Context
│   │
│   ├── errors/                         # 错误类型
│   │   ├── network-error.ts
│   │   ├── auth-error.ts
│   │   ├── validation-error.ts
│   │   └── not-found-error.ts
│   │
│   ├── observability/                  # 日志/监控
│   │   └── track.ts                    # 统一上报接口
│   │
│   └── utils/                          # 通用工具（日期、格式化）
│
├── components/                         # 纯 UI（只接 props）
│   ├── ui/                             # shadcn/ui 基础组件
│   ├── questions/
│   │   ├── question-card.tsx
│   │   ├── renderers/
│   │   │   ├── concept-renderer.tsx
│   │   │   ├── choice-renderer.tsx
│   │   │   └── code-reading-renderer.tsx
│   │   ├── rating-bar.tsx
│   │   └── weak-badge.tsx
│   ├── library/
│   │   ├── company-card.tsx
│   │   ├── direction-card.tsx
│   │   └── question-list-item.tsx
│   ├── stats/
│   │   ├── heatmap.tsx
│   │   └── direction-progress.tsx
│   ├── layout/
│   │   ├── top-nav.tsx
│   │   ├── bottom-tabs.tsx
│   │   └── theme-toggle.tsx
│   └── auth/
│       ├── sign-in-form.tsx
│       └── sign-up-form.tsx
│
├── content/                            # Markdown 题库（Git 管理）
│   ├── questions/
│   │   ├── c-language/
│   │   ├── mcu/
│   │   └── ...
│   ├── directions.yaml
│   └── companies.yaml
│
├── tests/
│   ├── srs/                            # 单元测试
│   ├── services/                       # 集成测试（同份用例跑 Local + Supabase）
│   └── e2e/                            # Playwright
│
├── public/
│   └── seed.json                       # 访客模式精选题（构建时生成）
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

### 5.3 依赖方向（ESLint 边界规则强制）

允许的依赖方向（箭头表示"可以 import"）：

```
domain  ←  srs
domain  ←  storage/*
domain  ←  services
domain  ←  components

storage/local       ←  services
storage/supabase    ←  services
srs                 ←  services
services            ←  app/
components          ←  app/
```

**严禁**：

- `lib/srs/**` 和 `lib/domain/**` 不能 `import` 任何 React / Next / Supabase 包
- `components/**` 不能 `import lib/services/` 或 `lib/storage/`（只接 props）
- `lib/storage/**` 不能 `import lib/services/`（避免循环依赖）
- `lib/storage/supabase/**` 不能被 `lib/storage/local/**` 引用，反之亦然

用 `eslint-plugin-boundaries` 或 `eslint-plugin-import` 的 `no-restricted-paths` 规则在 CI 拦截违规 import。

### 5.4 例子：用户答题这个动作的全链路

> ⚠️ 关键规则：**Store 的选择发生在"进入 service 的边界"，service 内部对 store 类型零感知。** 详见 §5.6。

#### 5.4.A 登录用户路径（走 Server Action）

```ts
// 1. UI 层 components/questions/rating-bar.tsx
<RatingBar onRate={(rating) => onRate(rating)} />

// 2. 页面层 app/(app)/today/today-client.tsx（Client Component）
'use client';
async function onRate(rating: Rating) {
  await submitAnswerAction(currentQuestionId, rating);
}

// 3. Server Action（lib/actions/review-actions.ts —— service 入口边界）
'use server';
import { createServerSupabase } from '@/lib/storage/supabase/client';
import { SupabaseCardStore, SupabaseReviewLogStore } from '@/lib/storage/supabase';
import { submitAnswer } from '@/lib/services/review-service';

export async function submitAnswerAction(qid: string, rating: Rating) {
  const supabase = await createServerSupabase();          // 已带当前用户的 cookie/session
  const cardStore   = new SupabaseCardStore(supabase);
  const logStore    = new SupabaseReviewLogStore(supabase);
  return submitAnswer({ cardStore, logStore }, qid, rating, new Date());
}
```

#### 5.4.B 测试/预留路径（不走 Server Action，客户端直接调 service）

```ts
// 2. 用于集成测试或未来本地客户端路径
import { LocalCardStore, LocalReviewLogStore } from '@/lib/storage/local';
import { submitAnswer } from '@/lib/services/review-service';

const cardStore = new LocalCardStore();        // 读写 localStorage
const logStore  = new LocalReviewLogStore();   // 内存 / IndexedDB

async function onRate(rating: Rating) {
  await submitAnswer({ cardStore, logStore }, currentQuestionId, rating, new Date());
}
```

#### 5.4.C 公共 Service 层（两条路径共用）

```ts
// lib/services/review-service.ts —— 不知道 store 是 local 还是 supabase
import type { CardStore, ReviewLogStore } from '@/lib/storage';
import { schedule, maybeUnmarkWeak } from '@/lib/srs';
import { emptyCardState } from '@/lib/domain/card-state';

export async function submitAnswer(
  deps: { cardStore: CardStore; logStore: ReviewLogStore },
  qid: string,
  rating: Rating,
  now: Date,
) {
  const prev = (await deps.cardStore.get(qid)) ?? emptyCardState(qid);
  const scheduled = schedule(prev, rating, now);              // 纯函数
  const final     = maybeUnmarkWeak(scheduled, rating);       // 纯函数

  // 见 §8.3：保证 save + append 在同一原子边界
  await deps.cardStore.saveWithLog(final, {
    questionId: qid,
    rating,
    prevInterval: prev.intervalDays,
    nextInterval: final.intervalDays,
    mode: 'review',
    queueSource: 'due',                                       // 由上层注入
    reviewedAt: now,
  });
  return final;
}
```

`saveWithLog` 是 CardStore 接口的一个方法，两端实现：

- `SupabaseCardStore.saveWithLog`：调一个 Postgres 函数（rpc），把 upsert state + insert log 包在事务里
- `LocalCardStore.saveWithLog`：把 state 和 log 一次性写入一个 wrapper 对象后 `localStorage.setItem` —— 单次同步写入，崩溃也不会半写

这样 §8.3 的"同一份测试两端跑过"在原子性上也成立。

### 5.5 添加新题型的影响范围（衡量解耦质量）

未来加"代码编写题"需要改动：

| 改动 | 文件 |
| --- | --- |
| ✅ 新增题型枚举 | `lib/domain/question.ts` |
| ✅ 新增 renderer | `components/questions/renderers/code-writing-renderer.tsx` |
| ✅ 注册到 switch | `components/questions/question-card.tsx` |
| ❌ SRS 算法 | 不动 |
| ❌ 存储层 | 不动 |
| ❌ 调度逻辑 | 不动 |
| ❌ 其他题型 | 不动 |

### 5.6 Store 选择边界（解耦的关键约束）

> **规则**：决定"用哪个 Store 实现"是 **入口层** 的职责（Server Action / Client Component / RSC），**不在 service 内部**。Service 接受 `CardStore` 接口 + `ReviewLogStore` 接口作为依赖注入参数，对实现一无所知。

#### 5.6.1 入口层选择表

| 入口 | Store 选择 |
| --- | --- |
| Server Action（`lib/actions/*`） | `SupabaseCardStore`（带 cookie 的 server client） |
| Server Component / RSC（用户数据） | `SupabaseCardStore`（带 cookie 的 server client） |
| Server Component / RSC（公开题库） | 直接 `supabase.from('questions').select()` |
| Client Component | 通过 Server Action 间接访问，**不在客户端构造 SupabaseCardStore** |
| 单元测试 / 集成测试 | `LocalCardStore` / `LocalReviewLogStore` |

#### 5.6.2 禁止的反模式

- ❌ 在 service 函数内部 `if (user) new SupabaseCardStore else new LocalCardStore` —— service 必须不知道 user 概念
- ❌ 在 Server Action 内 `new LocalCardStore()` —— `localStorage` 在服务端不存在，运行时崩
- ❌ 在 Client Component 直接 `new SupabaseCardStore(browserClient)` 做写操作 —— 绕过 Server Action 后 RLS 仍生效但失去服务端权威性、且与 Server Action 路径分叉，难以测试
- ❌ Service 内部 `import { createServerSupabase } from ...` —— service 直接依赖具体实现，破坏可测性

#### 5.6.3 ESLint 边界规则（落地）

`lib/services/**` 禁止 `import` 以下路径：

- `@/lib/storage/supabase/**`
- `@/lib/storage/local/**`
- `@/lib/auth/**`
- `next/headers`, `next/server`
- `@supabase/*`

只允许 `import type` 从 `@/lib/storage/index.ts`（仅类型，运行时无依赖）。

---

## 6. UI 流程与主要页面

### 6.1 站点地图

```
embedstudio.com（暂定）
│
├── /                                落地页（公开，推广用）
│
├── /today                           ★ 今日复习（登录后默认页）
├── /weak                            薄弱点专项
├── /practice                        自由刷题（不进 SRS）
│
├── /library                         题库主入口（公司 + 方向双 Tab）
├── /library/companies/[slug]        某公司面经（如 /library/companies/huawei）
├── /library/directions/[slug]       某知识方向（如 /library/directions/rtos）
│
├── /q/[id]                          单题直链（SEO + 分享入口）
│
├── /stats                           学习统计
├── /settings                        设置
│
├── /auth/sign-in
├── /auth/sign-up
└── /auth/callback                   OAuth 回调
```

### 6.2 三条核心用户旅程

#### 旅程 1：新用户首次体验

```
落地页 /
  ↓ 点击「立即开始 →」
GitHub / 邮箱注册
  ↓ 完成注册（~15 秒）
今日复习 /today（首次为空）
  ↓ 引导：「欢迎！选择方向开始你的第一个刷题计划」
  ↓ 自动跳转 /library → 用户选择方向 → 加入今日队列
  ↓ 翻牌 → 评价 → 翻牌 → 评价...
答完今日队列
  ↓ 展示成就：今天答了 10 题，正确率 70%
```

#### 旅程 2：登录用户日常使用

```
主屏 PWA 图标
  ↓ 1 秒打开应用，自动停在 /today
今日复习 /today
  ↓ 顶部：今日任务 23/30，连续 5 天 🔥
  ↓ 卡片正面 → 思考 → 翻面 → Again/Hard/Good/Easy
  ↓ 中途暂停：进度自动保存（每次评价立即落库）
  ↓ 全部完成 → 总结 + 鼓励语 + 引导明天再来
```

#### 旅程 3：专项学习 / 面试冲刺

```
任意页面
  ↓ 顶部导航 → 题库
题库 /library
  ↓ 默认「公司面经」Tab：6-12 个公司卡片
  ↓ 点击「华为」
公司页 /library/companies/huawei
  ↓ 82 题，筛选：[全部] [笔试] [一面] [二面] / 年份 / 方向 / 难度
  ↓ 底部按钮：「开始这套题」→ 把全部题加入今日队列
答题流程（同旅程 2 的卡片流）
```

### 6.3 关键页面线框（文字版）

#### `/today` 今日复习

```
┌─────────────────────────────────────────────────────────────┐
│  EmbedStudio    今日 题库 薄弱点 练习 统计    🌙  头像 ▾        │
├─────────────────────────────────────────────────────────────┤
│   今日任务 12/30        🔥 连续 5 天          ⏸️ 暂停        │
│   ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  40%                            │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  概念问答 · C 语言 · 简单            [⚑ 标记不会]   │  │
│   │  ─────────────────────────────────────────────────  │  │
│   │   volatile 关键字的作用是什么？                       │  │
│   │              [ 点击翻面 ]（或按空格）                 │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────┬──────────┬──────────┬──────────┐            │
│   │ ❌ 忘了 │ 😅 困难 │ ✓ 一般  │ 🚀 简单 │            │
│   │  (1)     │  (2)     │  (3)     │  (4)     │            │
│   └──────────┴──────────┴──────────┴──────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：

- 卡片正面只显示题干；点「点击翻面」或按 `Space` → 翻转动画 → 显示答案 + 解析
- 翻面后才显示底部 4 个评价按钮
- 评价后切下一题（淡入淡出，250ms 内）
- 全键盘操作：`Space` 翻面，`1/2/3/4` 评分，`W` 标记薄弱点
- 输入框获得焦点时不响应快捷键（通过 `document.activeElement` 判断）

#### `/library` 题库主入口

```
┌─────────────────────────────────────────────────────────────┐
│  题库                                                        │
│  [Tab: 公司面经 ◀]  [Tab: 知识方向]                          │
│  ───── 公司面经 ─────                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  华为   │ │  大疆   │ │  海康   │ │ 比亚迪  │            │
│  │  82 题  │ │  46 题  │ │  31 题  │ │  28 题  │            │
│  │ 12/82 ▶│ │  3/46  ▶│ │  0/31  ▶│ │  0/28  ▶│            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│  ...                                                         │
│  [按类别筛选 ▾]  [显示更多公司]                              │
└─────────────────────────────────────────────────────────────┘
```

#### `/library/companies/huawei` 单公司页

```
┌─────────────────────────────────────────────────────────────┐
│  华为 · 82 题                                                │
│  国内嵌入式岗位主要雇主之一，笔试侧重 C 基础和系统编程        │
│                                                              │
│  筛选：[全部] [笔试] [一面] [二面]                            │
│        年份：[全部▾]   方向：[全部▾]   难度：[全部▾]          │
│                                                              │
│  ▢ 解释 volatile 关键字在中断中的作用       2023 笔试 · 简单 │
│  ▢ 实现不使用 if-else 的绝对值函数         2023 笔试 · 中等 │
│  ▢ 进程和线程的区别                         2022 一面 · 中等 │
│  ▢ 状态机实现 UART 协议解析                 2022 笔试 · 困难 │
│  ...                                                         │
│  [开始这套题 →]（按 SRS 加入今日队列）                       │
└─────────────────────────────────────────────────────────────┘
```

#### `/stats` 学习统计

```
┌─────────────────────────────────────────────────────────────┐
│  学习统计                                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ 已学题数   │  │ 连续打卡   │  │ 总学习时长 │            │
│  │   142      │  │  🔥 12 天  │  │  6 小时    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  过去 30 天活跃热力图（GitHub 贡献图风格）                    │
│  ▓░▓▓░▓▓▓░▓▓░░▓▓░▓░▓░░▓░▓▓░▓                              │
│                                                              │
│  各方向掌握度：                                              │
│  C 基础     ▓▓▓▓▓▓▓▓░░░░  68%                              │
│  MCU        ▓▓▓▓░░░░░░░░  32%                              │
│  RTOS       ▓░░░░░░░░░░░  10%                              │
│  ...                                                         │
│                                                              │
│  各公司进度：                                                │
│  华为       ▓▓▓▓▓▓░░░░░░  12/82                             │
│  大疆       ▓░░░░░░░░░░░  3/46                              │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

#### `/` 落地页

```
[Hero]
  电光绿大标题 + 价值主张
  "嵌入式工程师的科学刷题法 · 每天 15 分钟"
  副标题："覆盖华为、大疆、海康、比亚迪等 30+ 公司面经"
  主 CTA：[立即开始 →]（直达 /today，无需注册）
  次 CTA：[GitHub 仓库 ⭐]

[特性区·3 列]
  科学复习      |  嵌入式垂直     |  离线可用
  SM-2 算法 +  |  公司面经 + 知识 |  PWA 安装到桌面
  薄弱点标记    |  方向双路径       |  地铁也能刷

[题库预览]
  展示 2-3 道精选题（可展开），证明内容质量
  按方向标签滚动展示题数

[作者区]
  "由 Albert 创建 · 嵌入式工程师 · [个人介绍 + 公司链接]"

[尾部 CTA + Footer]
```

### 6.4 导航策略

| 设备 | 导航形式 |
| --- | --- |
| PC / 平板 | 顶部导航栏：今日 / 题库 / 薄弱点 / 练习 / 统计 + 右侧主题切换 + 头像 |
| 手机 | 底部 5 Tab：今日 / 题库 / 薄弱点 / 统计 / 我的 |
| 未登录 | 顶部仅显示「登录 / 注册」+ 落地页 CTA |
| PWA 安装 | 登录后第一次进 `/today` 弹一次「安装到桌面」，关掉就不再弹 |

### 6.5 题型渲染的解耦

`<QuestionCard>` 根据 `question.type` 分发到对应 renderer：

```tsx
function QuestionCard({ question, ...handlers }) {
  return (
    <Card>
      <CardHeader>{/* 元信息 + 标记按钮 */}</CardHeader>
      <CardBody>
        {(() => {
          switch (question.type) {
            case 'concept':      return <ConceptRenderer q={question} />;
            case 'choice':       return <ChoiceRenderer q={question} />;
            case 'code-reading': return <CodeReadingRenderer q={question} />;
          }
        })()}
      </CardBody>
      <CardFooter>
        <RatingBar onRate={handlers.onRate} />
      </CardFooter>
    </Card>
  );
}
```

每个 renderer 只接 `q: Question`，不知道 SRS、不知道存储。

### 6.6 用户范围说明

MVP 强制登录。所有功能（答题、题库浏览、统计）均需认证。

`/` 落地页和 `/q/[id]` 单题直链页无需登录（SEO 入口），但点击答题时引导注册/登录。题库表（`questions` / `companies` / `directions`）通过 anon key + RLS `public read` 对搜索引擎可见（§3.4）。



---

## 7. 错误处理与边界情况

### 7.1 错误处理总原则

1. 不要红色 toast 满天飞 —— 只对用户**当前操作**失败报错
2. 可恢复的错误自动重试 —— 不打扰用户
3. 不可恢复的错误明确说明 —— 「X 失败 · 已重试 3 次 · 请刷新」
4. 绝不显示原始错误堆栈 —— Error Boundary 兜底，统一友好提示
5. 错误日志写到 Sentry（免费层够用）

### 7.2 网络相关

| 场景 | 处理 |
| --- | --- |
| 答题中网络断开 | Server Action 失败 → 客户端显示「网络异常，请重试」；已评价的题在提交成功前不更新本地队列 |
| PWA 离线时打开 | Service Worker 显示已缓存的页面；写操作不可用，顶部显示「离线模式，答题需联网」|
| Server Action 超时 | 客户端 5s 后显示「网络较慢，请重试」；重试 3 次（指数退避 1s/3s/9s），全部失败后提示用户刷新 |
| Supabase 服务挂了 | 关键操作走重试 + 退避；持续失败显示「服务暂时不可用」，不降级到本地模式 |

### 7.3 状态一致性

| 场景 | 处理 |
| --- | --- |
| 答题中刷新页面 | 已评价的题状态已落库（每次评价立即写），刷新后从今日队列下一题继续 |
| 多设备同时刷题 | `user_card_states` 用 `updated_at` 做乐观并发；后写入覆盖；冲突极罕见 |

### 7.4 内容相关

| 场景 | 处理 |
| --- | --- |
| Markdown frontmatter 损坏 | `validate.ts` 打印明确错误（「文件 X 缺 id 字段」），CI fail，不入库 |
| 题目 id 重复 | 同步时检测，构建失败，CI 拦截 |
| 题目被删除（`.md` 删了） | 同步脚本检测「DB 有但文件没有」，软删除（`deleted_at`），用户在学的题不消失但不再出新题 |
| 题目内容更新 | 按 `id` upsert；用户下次刷到看到新内容；不重置 SRS 状态 |
| 用户反馈答案错误 | 题底「反馈」链接 → GitHub Issue 模板（或写入 `feedback` 表） |

### 7.5 认证相关

| 场景 | 处理 |
| --- | --- |
| GitHub OAuth 用户取消 | 跳回登录页，显示「未完成 GitHub 授权」，不当作错误 |
| 邮箱未验证 | 仍能用应用；保存关键数据时提示「请先验证邮箱」 |
| 会话过期 | Server Action 检测 401 → 客户端弹「登录已过期」+ 自动跳登录页（保留当前 URL 做 redirect） |
| 同邮箱已用 GitHub 注册过又用邮箱注册 | 提示「该邮箱已绑定 GitHub 账号，请用 GitHub 登录」 |

### 7.6 用户行为边界

| 场景 | 处理 |
| --- | --- |
| 今日队列为空（新用户或已答完） | 空状态：「今天已完成！明日 14 题待复习」+ 推荐「自由刷题」/「薄弱点专项」 |
| 今日队列中途中断（关闭浏览器/掉电） | 每次评价立即落库（authed）或 `localStorage.setItem`（guest）。下次打开 `/today` 自动从队列下一张未完成的卡片继续，进度条恢复 |
| 同一天多次进 `/today` | 队列重新计算（`buildTodayQueue` 每次调用都基于实时 `due_at`），已答过的卡片自然消失 |
| 薄弱点为空 | 「目前没有薄弱点，刷题时遇到不会的题可点 ⚑ 标记」 |
| 某方向题目全部学完 | 该方向卡片显示「已完成」徽章；不影响访问 |
| 用户标记薄弱点数 ≥ 30 | 标记按钮旁出小提示「已标记 30 题，建议先消化再继续」 |
| 输入框焦点时按 1-4 | 卡片层用 `document.activeElement` 判断，输入框焦点时不响应快捷键 |

### 7.7 解耦：错误处理同样分层

- `lib/errors/` 定义错误类型：`NetworkError`, `AuthError`, `ValidationError`, `NotFoundError`
- Service 层抛业务错误（`throw new NotFoundError('question')`），不抛字符串
- UI 层捕获后映射成用户友好提示（`<ErrorView>` 组件只接 props）
- 日志上报集中在 `lib/observability/track.ts`，业务代码调 `track(error)`，不直接 `import * as Sentry`

---

## 8. 测试策略

### 8.1 测试金字塔

```
       ╱╲
      ╱E2E╲              10-15 个，最关键的用户旅程  (Playwright)
     ╱──────╲
    ╱集成测试╲           30-50 个，service + 真实/mock storage  (Vitest)
   ╱──────────╲
  ╱ 单元测试   ╲          100+，纯函数 + 组件  (Vitest + RTL)
  ─────────────
```

### 8.2 单元测试（必须扎实的一层）

| 模块 | 重点测试内容 |
| --- | --- |
| `lib/srs/schedule.ts` | 所有评分组合 × 多个 repetitions 状态；EF 边界（下限 1.3）；间隔归零；`again` 重置到 10 分钟 |
| `lib/srs/queue.ts` | 优先级排序（薄弱 > 到期 > 新题）；空队列；超大队列上限 |
| `lib/srs/weak-mark.ts` | 标记 / 连续 2 次 good 自动取消 |
| `lib/content/parse-markdown.ts` | 正常解析、frontmatter 缺字段、Markdown 损坏 |
| `lib/content/validate.ts` | id 唯一性、字段类型、枚举值合法 |
| `lib/storage/local/card-store.ts` | localStorage 读写、quota 超限、JSON 损坏恢复 |
| `components/questions/*` | 翻面交互、键盘快捷键、按钮 disabled 状态 |

示例：

```ts
// lib/srs/__tests__/schedule.test.ts
describe('schedule()', () => {
  it('answers "again" resets to 10 minutes interval', () => {
    const state = { easeFactor: 2.5, intervalDays: 8, repetitions: 3, lastRating: 'good' };
    const result = schedule(state, 'again', new Date('2026-01-01T00:00:00Z'));
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(0);
    expect(result.easeFactor).toBeCloseTo(2.3, 2);
    expect(result.dueAt).toEqual(new Date('2026-01-01T00:10:00Z'));
  });

  it('ease factor floor is 1.3', () => {
    const state = { easeFactor: 1.3, intervalDays: 1, repetitions: 1, lastRating: 'good' };
    const result = schedule(state, 'again', new Date());
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('first correct answer schedules 1 day later', () => {
    const state = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lastRating: null };
    const result = schedule(state, 'good', new Date('2026-01-01'));
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
  });
});
```

### 8.3 集成测试（验证解耦设计的安全网）

**关键技巧**：同一份测试代码跑两次 —— 一次用 `LocalCardStore`，一次用 `SupabaseCardStore`（连本地 Supabase 实例）。结果必须**在功能行为上**完全一致。

> **原子性的边界声明**：契约测试断言 `submitAnswer`、`markWeak` 等 **正常完成**后两端状态一致。**进程崩溃中途**的一致性由 `saveWithLog` 接口保证：Supabase 端走 rpc 事务，Local 端走单次 `localStorage.setItem` 写入合并对象（见 §5.4.C）。
>
> 此外，仅 Supabase 实现需要**额外的事务测试**（并发写竞争、网络中断后回滚等），不参与契约测试。

```ts
// tests/services/review-service.test.ts
describe.each([
  ['LocalCardStore', () => new LocalCardStore()],
  ['SupabaseCardStore', () => new SupabaseCardStore(testClient)],
])('reviewService with %s', (name, makeStore) => {
  let store: CardStore;
  beforeEach(() => { store = makeStore(); });

  it('first answer creates card state', async () => {
    await submitAnswer(store, 'q-001', 'good', new Date());
    const state = await store.get('q-001');
    expect(state.repetitions).toBe(1);
    expect(state.intervalDays).toBe(1);
  });

  it('marking weak does not corrupt SRS state', async () => {
    await submitAnswer(store, 'q-001', 'good', new Date());
    await markWeak(store, 'q-001', new Date());
    const state = await store.get('q-001');
    expect(state.isWeak).toBe(true);
    expect(state.repetitions).toBe(1);   // SRS 数据不动
  });
});
```

### 8.4 E2E 测试（最关键的几条路径）

MVP 阶段必备 8 个 Playwright 场景：

1. **访客首次刷题**：进首页 → 点开始 → 答 3 道题 → 看到完成提示
2. **访客转登录数据合并**：访客刷 5 题 → 注册邮箱 → 进入应用 → 学习记录已合并
3. **GitHub 登录全流程**：点 GitHub → 模拟 OAuth → 返回应用 → 进 `/today`
4. **答题键盘流**：进 `/today` → 按 `Space` 翻面 → 按 `3` → 切到下一题
5. **标记薄弱点联动**：今日刷题时标记 → 进 `/weak` → 看到该题
6. **公司面经浏览到答题**：进 `/library` → 切到公司 Tab → 点华为 → 列表 → 点开 → 答题
7. **PWA 离线访问**：登录后联网刷题 → 断网 → 刷新 → 仍能看到已缓存题
8. **深浅模式切换**：点切换 → 主题立即生效 → 刷新后保留

```ts
// tests/e2e/guest-flow.spec.ts
test('guest can answer questions without signing up', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '立即开始' }).click();
  await expect(page).toHaveURL('/today');

  await page.keyboard.press('Space');
  await expect(page.getByText(/答案/)).toBeVisible();

  await page.keyboard.press('3');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
});
```

### 8.5 视觉回归测试（可选但推荐）

用 Playwright 截图能力对关键页面建立基线：

- `/today` 三种题型展示
- `/library` 公司 / 方向两个 Tab
- `/stats` 含数据 / 空状态
- 深色 + 浅色两套

每次 PR 自动对比，差异超过阈值 fail。

### 8.6 CI 流程

```
git push
  ↓
GitHub Actions:
  ├── lint           （ESLint + Prettier + boundaries 边界规则）
  ├── typecheck      （tsc --noEmit）
  ├── 单元测试       （Vitest）
  ├── 集成测试       （Vitest + 本地 Supabase）
  ├── 内容校验       （validate.ts 检查所有 .md）
  └── 构建           （next build）
  ↓
Vercel Preview Deployment
  ↓
Playwright E2E 跑 preview URL
  ↓
全部通过才能 merge
```

### 8.7 测试纪律（写进项目宪法）

1. **新功能必须先写测试**（TDD）—— 尤其是 SRS 算法、调度、内容解析
2. **修 bug 必须先有失败的测试**，再修代码让测试通过
3. **service 层重构不允许改测试** —— 如果改测试才能 pass，说明 service 接口设计错了
4. **不测私有实现细节** —— 只测对外行为
5. **测试代码也要审 PR** —— 不放任写得很烂的测试混进 main

---

## 9. MVP 范围与版本路线

### 9.1 MVP（v1.0 上线）

#### 9.1.1 功能清单

- [ ] GitHub OAuth 登录
- [ ] 邮箱密码注册 / 登录
- [ ] 三种题型：概念问答（卡片翻转）、选择题、代码阅读题
- [ ] SRS 间隔重复算法（简化 SM-2）
- [ ] 「标记为不会」+ 薄弱点专项视图（P2，可推迟到 v1.1）
- [ ] 自由刷题模式（不进 SRS，P3）
- [ ] 题库浏览：公司面经 Tab + 知识方向 Tab
- [ ] 单题直链页 `/q/[id]`（SEO + 分享）
- [ ] 个人学习统计（已学题数、连续打卡、各方向 / 公司掌握度、活跃热力图）
- [ ] 每日复习提示（页面内提示，无邮件 / 短信）
- [ ] Markdown 题库 + 构建期同步到 Supabase
- [ ] Supabase 抽象封装层（预留国内云迁移）
- [ ] PWA 支持（可安装到主屏 + 离线只读今日队列）
- [ ] 深浅色模式
- [ ] `is_premium` 字段预留，所有内容暂免费

#### 9.1.2 内容门槛

- **首发题量目标：≥ 200 道**（避免用户两天刷完；内容质量优先，不达标则延迟上线）
- **方向覆盖**：C/C++、MCU、RTOS、通信协议、嵌入式 Linux、算法、面试综合（共 7 个方向）
- **公司覆盖**：首发至少 5 家（华为 / 大疆 / 海康 / 比亚迪 / 小米），共 ≥ 80 道面试题
- **内容来源**：50% B（整理网上资源）+ 35% C（AI 生成审核）+ 15% A（自造高质量题）
- **内容质量**：每道题标注置信度（`verified` / `auto-reviewed` / `unverified`）；题底加「反馈」链接；上线前创始人通读全部题

#### 9.1.3 工期估计（个人开发参考）

- 基础架构 + 认证 + Supabase 封装层：1 周
- 数据模型 + 内容管线：1 周
- SRS 算法 + 调度 + 单元测试：1 周
- 核心 UI（today / library / q / stats）：3 周
- PWA + 离线只读 + 边界处理：1 周
- 内容生产（首批 200 题）：与编码并行
- E2E 测试 + CI + 部署上线：1 周

合计 **约 8-9 周**（强度依个人节奏；UI 层为最多变量）。

### 9.2 v2 路线（MVP 上线后 3-6 个月）

- 代码编写题（在线编辑器 + 测试用例）
- 手机号 + 短信验证码登录
- ICP 备案 + 国内 CDN
- Freemium 付费墙 + Stripe（或后续接国内支付）
- 微信登录（依赖企业资质 / 个体工商户）
- 题目搜索 / 标签筛选
- 错题导出 PDF
- 移动 App 套壳（Capacitor）

### 9.3 长期路线

- 用户投稿题目 + 审核流
- 评论 / 题解区
- 排行榜 / 学习社区
- 公司面经众包

---

## 10. 视觉规范

### 10.1 设计调性

「克制的高级感」—— 对标 Linear、Vercel、Cal.com、Raycast、Arc、Cursor 这一批面向开发者的产品。

### 10.2 颜色

| 用途 | 色值 | 备注 |
| --- | --- | --- |
| 主品牌色 | `#C4F542` | 电光绿，示波器 / 调试灯的视觉母语 |
| 品牌色 hover | `#D4FF52` | 微亮 |
| 深色背景 | `#0A0A0A` | 近黑但不死黑 |
| 深色卡片 | `#171717` | 卡片表面 |
| 深色边框 | `#262626` | 1px 细线 |
| 浅色背景 | `#FAFAFA` | 纸白 |
| 浅色卡片 | `#FFFFFF` | |
| 主文字（深色） | `#FAFAFA` | |
| 次文字（深色） | `#A1A1A1` | |
| 主文字（浅色） | `#0A0A0A` | |
| 次文字（浅色） | `#525252` | |
| 成功 | `#4ADE80` | 评价 Good/Easy 的辅助色（弱于品牌色） |
| 错误 | `#F87171` | 克制的红，不要刺眼 |
| 警告 | `#FBBF24` | 不大面积使用 |

### 10.3 字体

- **界面无衬线**：Geist Sans（fallback：Inter）
- **代码等宽**：Geist Mono（fallback：JetBrains Mono）
- 中文 fallback：系统字体 → `PingFang SC` / `Microsoft YaHei`

### 10.4 间距 / 圆角 / 阴影

- 圆角：`8px`（按钮）/ `12px`（卡片）/ `16px`（大区块）—— 不过分圆，保持工业感
- 阴影：极淡 + `1px` 边框 的"卡片"质感（参考 Linear）
- 间距：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`（Tailwind 默认 scale）

### 10.5 动效

- 翻面：CSS 3D `transform: rotateY(180deg)`，250ms `ease-in-out`
- 切下一题：淡入淡出，200ms
- 评价按钮按下：`scale(0.96)` 反馈
- 整体克制 —— 不做花哨过场动画

---

## 11. 部署与基础设施

### 11.1 环境

| 环境 | 用途 | 部署目标 |
| --- | --- | --- |
| local | 开发 | 本地 Next.js + 本地 Supabase（Docker） |
| preview | PR 预览 | Vercel Preview + 共享 Supabase staging 项目 |
| production | 生产 | Vercel Production + Supabase production 项目 |

### 11.2 环境变量（关键项）

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY           # 仅 server side（内容同步用）
NEXT_PUBLIC_SITE_URL
SENTRY_DSN
GITHUB_OAUTH_CLIENT_ID              # Supabase 端配置
GITHUB_OAUTH_CLIENT_SECRET          # 仅 Supabase 端
```

### 11.3 内容同步流程

分两条路径，避免"内容小修一次就触发整站重新部署"的浪费 / 风险：

#### 11.3.A 代码变更触发的正常部署

```
git push（含代码 / 含或不含 content）
  ↓
GitHub Actions:
  ├── scripts/validate-content.ts（独立 job，fail 则整体 fail）
  ├── lint / typecheck / 单元 / 集成 / e2e
  └── Vercel build
  ↓
Vercel 部署完成 → 触发 Vercel Deploy Hook → scripts/sync-content.ts upsert 到生产 Supabase
  ↓
生成 public/seed.json 跟随 build 产物
  ↓
部署完成
```

#### 11.3.B 仅内容变更（只改 `content/**/*.md`）

```
git push（path 仅匹配 content/**）
  ↓
GitHub Actions（条件触发）:
  ├── scripts/validate-content.ts
  └── scripts/sync-content.ts（直接连生产 Supabase 用 SERVICE_ROLE_KEY）
  ↓
不触发 Vercel 部署，不重新构建 seed.json
  ↓
线上立即生效（题库表更新；客户端下次请求拿到新内容）
  ↓
注意：seed.json 在下次正常部署时刷新；访客模式短期内可能看到旧 seed
```

#### 内容校验失败的处理

- `validate.ts` 任一题失败 → GitHub Action fail → 不进入 sync → 不影响线上现有内容
- 错误信息明确到文件 + 行号 + 缺失/不合法字段
- 必填字段：`id`, `title`, `type`, `direction`, `difficulty`, `answer`
- 面试题 `companies` 数组中每个 slug 必须存在于 `companies` 表（强外键校验）

### 11.5 Markdown frontmatter 规范（v1 冻结）

题目源文件统一格式，写代码前冻结，避免后续返工：

```yaml
---
id:              huawei-2023-volatile-001        # 必填，全局唯一，URL safe，发布后不可改
title:           解释 volatile 关键字在中断中的作用  # 必填
type:            concept                          # 必填：concept | choice | code-reading
direction:       c-language                       # 必填，存在于 directions 表
difficulty:      easy                             # 必填：easy | medium | hard
tags:            [关键字, volatile, 中断]          # 可选
# 面试题专属字段（全部可选，填了即视为面试题，is_interview = true）
companies:       [huawei]                         # 公司 slug 数组
interview_year:  2023
interview_round: 笔试                              # 笔试 | 一面 | 二面 | 三面 | 终面
source:          "华为 2023 嵌入式社招笔试"
is_premium:      false                            # 商业化预留，MVP 全 false
---

## 题干
（题干 Markdown，可包含代码块、图片）

## 选项                # 仅 type=choice 需要
- [ ] A. 选项 A
- [x] B. 选项 B（正确）
- [ ] C. 选项 C
- [ ] D. 选项 D

## 答案
（答案 Markdown）

## 解析                # 可选
（解析 Markdown）
```

`parseMarkdown.ts` 严格按本节解析；任何偏差都由 `validate.ts` 报错。

### 11.4 监控

- **错误**：Sentry（免费 5k 事件/月够 MVP）
- **性能**：Vercel Analytics（自带）
- **用户行为**：先不接，避免合规复杂度；后期视情况接 Plausible / Umami

---

## 12. 开放问题（全部已确认 ✅）

> 2026-05-20 经 CEO 战略评审确认，以下决策即日起生效。后续修改需记录原因。

### 12.1 品牌与内容

1. **域名**：✅ `embedstudio.com`（需注册时确认可用性；备用 `embedstudio.dev`）
2. **品牌名**：✅ 「EmbedStudio」定稿
3. **首批公司**：✅ 华为 + 大疆 + 海康 + 比亚迪 + 小米
4. **内容构成**：✅ 50% B + 35% C + 15% A

### 12.2 技术与运维

5. **Sentry**：✅ 暂不接入。MVP 用 Vercel 日志排查错误；v1.1 再按需接入
6. **离线写回放**：✅ MVP 不做离线写。聚焦刷题流，写操作必须在线。IndexedDB 挂起队列推迟
7. **iOS 3D 翻转**：✅ CSS 3D `rotateY`，不降级。目标 iOS 15+
8. **国内云迁移预留**：✅ MVP 阶段就封装 Supabase 抽象层（`lib/storage/supabase/*`），方便未来切换

### 12.3 产品策略

9. **访客模式 seed.json**：✅ 已移除（无访客模式），此问题不适用
10. **新题排序**：✅ 用户自行选择方向学（通过 `/library` 挑选要加入队列的题），不做系统自动轮转
11. **薄弱点上限**：✅ 仅 UI 提示，不硬性拦截

### 12.4 可访问性 / 国际化

12. **A11y**：✅ 接受缺口，v1.1 补齐
13. **i18n**：✅ 仅简体中文，不预留多语言架构

---

## 13. 附录：相关文档

---

## 13. 附录：相关文档

- `docs/superpowers/plans/`（下一步用 writing-plans 拆出来的实施计划）
- `supabase/migrations/`（数据库 SQL，按本文档第 3 章实现）
- `content/directions.yaml` / `content/companies.yaml`（元数据初始值）

---

> **文档结束（v1.2 ✅ §12 已确认）。**
> 下一步：进入 `writing-plans` 阶段，把本设计拆成实施任务。
