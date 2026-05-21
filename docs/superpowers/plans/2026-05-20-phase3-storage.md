# Phase 3: 存储抽象层 (Interfaces + LocalStore + 契约测试)

## Goal

定义存储契约（TypeScript 接口），实现 LocalStore 端，建立契约测试模式。保证存储层可替换（Supabase / LocalStorage 可互换，service 层零感知）。

## Architecture

```
lib/storage/
├── card-store.ts          # interface CardStore (含 saveWithLog)
├── question-store.ts      # interface QuestionStore
├── review-log-store.ts    # interface ReviewLogStore
├── profile-store.ts       # interface ProfileStore
├── index.ts               # barrel re-exports
├── supabase/              # Phase 5 实现
│   └── card-store.ts
└── local/
    ├── card-store.ts      # localStorage 实现
    ├── question-store.ts  # 从 seed.json 读取（首次手写，Phase 8 刷新）
    ├── review-log-store.ts
    └── index.ts

public/
└── seed.json              # ★ Phase 3 手写 20+ 题（Phase 8 用 extract-seed 刷新）

tests/storage/
├── contract-card-store.test.ts      # describe.each 跑两端
└── contract-question-store.test.ts
```

## Interface Definitions

### CardStore

```typescript
export interface CardStore {
  get(userId: string, questionId: string): Promise<CardState | null>;
  getMany(userId: string, questionIds: string[]): Promise<CardState[]>;
  findByUser(userId: string): Promise<CardState[]>;
  findDueOrWeak(userId: string, now: Date): Promise<CardState[]>;
  save(userId: string, state: CardState): Promise<void>;
  saveWithLog(userId: string, state: CardState, log: Omit<ReviewLog, 'id' | 'userId'>): Promise<void>;
  remove(userId: string, questionId: string): Promise<void>;
}
```

所有读/写方法统一接收 `userId`。Supabase 端可忽略（RLS 自动过滤），LocalStore 端用 `userId` 做数据隔离。

- `get` — 按 questionId 取单条
- `getMany` — 批量取（给 queue service 用）
- `findByUser` — 用户全部卡片
- `findDueOrWeak` — 今日到期 + 标记薄弱（userId + 时间条件）
- `save` — upsert（insert or update）
- `saveWithLog` — 原子性边界：upsert state + insert log
- `remove` — 删除

### ReviewLogStore

```typescript
export interface ReviewLogStore {
  append(userId: string, log: Omit<ReviewLog, 'id' | 'userId'>): Promise<void>;
  findByUser(userId: string, limit?: number, offset?: number): Promise<ReviewLog[]>;
  countByDateRange(userId: string, start: Date, end: Date): Promise<Record<string, number>>;
}
```

### QuestionStore

```typescript
export interface QuestionStore {
  getById(id: string): Promise<Question | null>;
  findByIds(ids: string[]): Promise<Question[]>;
  findByDirection(direction: string): Promise<Question[]>;
  findByCompany(companySlug: string): Promise<Question[]>;
  findNewCandidates(userId: string, limit: number): Promise<Question[]>;
  search(filters: QuestionFilters): Promise<Question[]>;
}
```

question 是公开数据（无数据隔离），不需要 userId 参数（除 `findNewCandidates` 需要排除已学）。

### ProfileStore

```typescript
export interface ProfileStore {
  get(userId: string): Promise<User | null>;
  upsert(profile: User): Promise<void>;
  updateStreak(userId: string, lastActiveAt: Date): Promise<void>;
}
```

## LocalStore Implementation

### LocalCardStore
- 存储键: `embedstudio:card_states:${userId}`（用户隔离）
- 数据结构: `Record<string, LocalCardState>`
- `saveWithLog`: 同时写 card_states + review_logs 两个 localStorage key，同步 setItem（无事务但浏览器主线程不会打断）
- 读回时 ISO 字符串 → Date

### LocalQuestionStore
- 从 `public/seed.json` 读取（**Phase 3 手写**，不是生成。Phase 8 的 `extract-seed.ts` 负责后续刷新）
- findByIds / findByDirection 执行内存过滤
- `findNewCandidates` 接收已学 questionId 数组过滤

### LocalReviewLogStore
- 存储键: `embedstudio:review_logs:${userId}`
- 数据结构: `ReviewLog[]` (JSON)
- 内存中做日期范围计数

## Seed Data (`public/seed.json`)

Phase 3 直接手写 JSON。包含 20+ 题，覆盖：

| 方向 | 题数 | 难度分布 |
|------|------|----------|
| c-language | 5 | easy 2, medium 2, hard 1 |
| mcu | 3 | easy 1, medium 1, hard 1 |
| rtos | 3 | easy 1, medium 1, hard 1 |
| protocol | 3 | easy 1, medium 2 |
| linux-embedded | 3 | easy 1, medium 2 |
| algorithm | 3 | easy 1, medium 2 |
| interview-mixed | 3 | easy 1, medium 2 |

每道题包含完整字段——写死数据，不依赖外部工具。

Phase 8 `extract-seed.ts` 从 Supabase 重新生成 seed.json 覆盖此文件。

## Contract Tests

```typescript
describe.each([
  ['LocalCardStore', () => new LocalCardStore()],
  ['SupabaseCardStore', () => new SupabaseCardStore(testClient)],
])('CardStore contract: %s', (_name, createStore) => {
  const userId = 'test-user';

  it('save + get roundtrip', async () => {
    const state = emptyCardState('q-001');
    await store.save(userId, state);
    const got = await store.get(userId, 'q-001');
    expect(got).toMatchObject({ questionId: 'q-001', easeFactor: 2.5 });
  });

  it('saveWithLog persists both state and log', async () => { ... });
  it('findDueOrWeak returns correct subset', async () => { ... });
  it('get returns null for unknown questionId', async () => { ... });
});
```

Supabase 端需要 `testClient` — Phase 5 才实现该注入，当前只跑 LocalStore 端。

## Verification

- contract tests 全部通过 LocalStore
- TypeScript strict 零 `any`
- `seed.json` 有效且可解析
- ESLint: storage/ 不能 import services/、srs/、auth/、app/
