# Phase 8a: 内容管线 (Markdown → Supabase + Seed 抽取)

## Goal

建立内容工程管线：从 `content/` Markdown 文件解析、校验、同步到 Supabase，以及从 Supabase 抽取 `seed.json` 供 LocalStore 使用。

## Architecture

```
lib/content/
├── parse-markdown.ts                     # Markdown + frontmatter → ParsedQuestion
├── validate.ts                           # 字段校验 + id 唯一性
├── sync.ts                               # content/* → Supabase upsert
└── extract-seed.ts                       # Supabase → seed.json 抽取

content/
├── directions.yaml                       # 方向元数据
├── companies.yaml                        # 公司元数据
└── questions/
    ├── c-language/
    │   ├── volatile-001.md
    │   ├── pointer-001.md
    │   └── ...
    ├── mcu/
    ├── rtos/
    ├── protocol/
    ├── linux-embedded/
    ├── algorithm/
    └── interview-mixed/

scripts/
├── validate-content.ts                   # CLI 入口：校验全部 content
├── sync-content.ts                       # CLI 入口：同步到 Supabase
└── extract-seed.ts                       # CLI 入口：抽取 seed.json

tests/content/
├── parse-markdown.test.ts
└── validate.test.ts
```

## Markdown 文件格式

每道题一个 `.md` 文件，YAML frontmatter + Markdown body：

```markdown
---
id: c-lang-volatile-001
title: volatile 关键字在中断中的作用
type: concept
direction: c-language
difficulty: easy
tags: [volatile, interrupt]
answer: |
  volatile 告知编译器不要优化该变量...
explanation: 中断服务函数中修改的全局变量必须声明为 volatile...
companies: [huawei, dji]
interview_year: 2023
interview_round: 笔试
---

## 题目

在嵌入式系统中，为什么中断服务函数中修改的全局变量必须声明为 `volatile`？

## 选项（仅 choice 类型需要）

（concept 类型此题无选项）
```

### Frontmatter 字段规范

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 全局唯一标识 |
| title | string | ✓ | 题目标题 |
| type | concept\|choice\|code-reading | ✓ | 题型 |
| direction | string | ✓ | 方向 slug |
| difficulty | easy\|medium\|hard | ✓ | 难度 |
| tags | string[] | | 标签列表 |
| answer | string | ✓ | 答案（支持多行） |
| explanation | string | | 解析（支持多行） |
| choices | object[] | | choice 题型必填，含 id/text/correct |
| companies | string[] | | 关联公司 slug |
| interview_year | number | | 面试年份 |
| interview_round | string | | 面试轮次 |
| source | string | | 题目来源 |
| is_premium | boolean | | 是否付费，默认 false |

## parse-markdown.ts

```typescript
import { readFileSync } from 'fs';
import matter from 'gray-matter';

type ParsedQuestion = {
  frontmatter: Record<string, any>;
  body: string;                    // Markdown body (不含 frontmatter)
  raw: string;                     // 完整文件内容
  filePath: string;                // 源文件路径（用于报错定位）
};

export function parseMarkdownFile(filePath: string): ParsedQuestion {
  const content = readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  return { frontmatter: data, body, raw: content, filePath };
}

export function parseAllQuestions(contentDir: string): ParsedQuestion[] {
  // glob content/questions/**/*.md → parseMarkdownFile
}
```

## validate.ts

校验所有字段，失败时明确报告文件路径 + 缺失/非法字段：

```typescript
type ValidationError = {
  filePath: string;
  field: string;
  message: string;
};

type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];     // 非阻断性问题（如缺少 tags）
};

export function validateQuestion(parsed: ParsedQuestion): ValidationResult {
  const errors: ValidationError[] = [];
  const { frontmatter, filePath } = parsed;

  // 必填字段检查
  const required = ['id', 'title', 'type', 'direction', 'difficulty', 'answer'];
  for (const field of required) {
    if (!frontmatter[field]) {
      errors.push({ filePath, field, message: `缺少必填字段: ${field}` });
    }
  }

  // 枚举值校验
  if (frontmatter.type && !['concept', 'choice', 'code-reading'].includes(frontmatter.type)) {
    errors.push({ filePath, field: 'type', message: `非法 type: ${frontmatter.type}` });
  }
  if (frontmatter.difficulty && !['easy', 'medium', 'hard'].includes(frontmatter.difficulty)) {
    errors.push({ filePath, field: 'difficulty', message: `非法 difficulty: ${frontmatter.difficulty}` });
  }

  // choice 题型必须含 choices
  if (frontmatter.type === 'choice' && !frontmatter.choices) {
    errors.push({ filePath, field: 'choices', message: 'choice 题型必须提供 choices' });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateUniqueIds(questions: ParsedQuestion[]): ValidationError[] {
  // 检查 id 全局唯一性
}
```

## sync.ts

```typescript
type SyncResult = {
  inserted: number;
  updated: number;
  deleted: number;
  errors: ValidationError[];
};

export async function syncContent(
  supabase: SupabaseClient,
  contentDir: string,
): Promise<SyncResult> {
  // 1. 读取所有 content/questions/**/*.md
  // 2. 解析 frontmatter
  // 3. 校验
  // 4. 获取 Supabase 中已有题目 id 集合
  // 5. upsert 到 questions 表（通过 service_role client）
  // 6. 同步 question_companies 关联表
  // 7. 检测已删除文件（Supabase 有但 content/ 无）→ 设置 deleted_at
  // 8. 返回 { inserted, updated, deleted, errors }
}
```

### 软删除策略

不硬删除 DB 行。`sync.ts` 检测 Supabase 中存在但 `content/` 中已删除的题目 → 设置 `deleted_at = now()`。`deleted_at` 非空的题目对所有查询不可见。

## extract-seed.ts

```typescript
// 从已同步的 Supabase questions 表抽取子集
// 输出到 public/seed.json（~20 题精选，覆盖各方向）
// 供 LocalQuestionStore 使用
// 使用 service_role key 直连 Supabase

type SeedOutput = {
  version: string;       // 生成时间戳
  questions: Question[]; // 精选 20+ 题
};

export async function extractSeed(supabase: SupabaseClient): Promise<SeedOutput> {
  // 每方向取 2-4 题，优先 easy/medium
  // 确保各题型（concept/choice/code-reading）都有覆盖
}
```

**注意：** Phase 3 的 `public/seed.json` 是手写的。Phase 8a 的 `extract-seed.ts` 脚本用于后续从 Supabase 刷新 seed.json。两者不冲突——手写版是初始数据，脚本是维护工具。

## CLI 入口

```typescript
// scripts/validate-content.ts
// 用法: npx tsx scripts/validate-content.ts

// scripts/sync-content.ts
// 用法: npx tsx scripts/sync-content.ts
// 需要环境变量: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// scripts/extract-seed.ts
// 用法: npx tsx scripts/extract-seed.ts
// 输出: public/seed.json
```

## Verification

- 内容管线解析有效 `.md` 文件，校验成功通过
- 校验 catch 非法 frontmatter（缺字段、非法枚举值）并报告文件路径
- `id` 重复检测生效
- `sync.ts` upsert 到 Supabase 正确
- 软删除：`content/` 中删除的文件 → DB 该行 `deleted_at` 非空
- `extract-seed.ts` 生成的 `seed.json` 可被 LocalQuestionStore 正确解析
