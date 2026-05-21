# Phase 8b: 剩余页面 (Library + Practice + Weak + Stats + Settings + Landing + SEO)

## Goal

所有剩余页面路由渲染真实数据，覆盖完整的用户功能矩阵。

## Architecture

```
app/
├── (app)/
│   ├── library/
│   │   ├── page.tsx                      # 题库入口（公司 + 方向双 Tab）
│   │   ├── library-client.tsx            # Tab 切换状态
│   │   ├── companies/[slug]/page.tsx     # 某公司面经页
│   │   └── directions/[slug]/page.tsx    # 某方向页
│   ├── practice/page.tsx                 # 自由刷题
│   ├── weak/page.tsx                     # 薄弱点专项
│   ├── stats/page.tsx                    # 学习统计
│   └── settings/page.tsx                 # 设置
├── (marketing)/
│   └── page.tsx                          # 落地页（补充完善）
├── q/[id]/page.tsx                       # 单题直链（SEO）

components/
├── library/
│   ├── company-card.tsx                  # 公司卡片（logo + 名称 + 进度）
│   ├── direction-card.tsx                # 方向卡片
│   └── question-list-item.tsx            # 题列表项（标题 + 元信息）
└── stats/
    ├── heatmap.tsx                       # GitHub 风格活跃图
    └── direction-progress.tsx            # 方向掌握度条
```

## Page States

每个页面统一处理四种状态：**loading → empty → error → data**

| 状态 | 表现 |
|------|------|
| Loading | 骨架屏（Skeleton card） |
| Empty | 引导文案 + CTA |
| Error | "加载失败，请刷新" + 重试按钮 |
| Data | 正常数据渲染 |

## Library Page

### 题库入口 (`/library`)

```
[Tab: 公司面经 | 知识方向]

公司面经 Tab (默认):
┌─────────┐ ┌─────────┐ ┌─────────┐
│  华为   │ │  大疆   │ │  海康   │
│  82 题  │ │  46 题  │ │  31 题  │
│ 12/82 ▶│ │  3/46 ▶│ │  0/31 ▶│
└─────────┘ └─────────┘ └─────────┘

知识方向 Tab:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ C/C++   │ │ MCU     │ │ RTOS    │
│ 45 题   │ │ 32 题   │ │ 28 题   │
│ 68% ▶   │ │ 32% ▶   │ │ 10% ▶   │
└─────────┘ └─────────┘ └─────────┘
```

- `library-client.tsx` 管理 tab 状态（Client Component）
- 每个 tab 请求不同数据源
- 公司卡片显示进度（已学/总数）
- 方向卡片显示掌握百分比

### Company Detail Page (`/library/companies/[slug]`)

```
华为 · 82 题
国内嵌入式岗位主要雇主之一

筛选: [全部] [笔试] [一面] [二面]  年份:[▾]  方向:[▾]  难度:[▾]

□ volatile 关键字在中断中的作用       2023 笔试 · 简单
□ 实现绝对值函数（无 if-else）        2023 笔试 · 中等
□ 进程和线程的区别                    2022 一面 · 中等

[加入今日队列]
```

- 筛选项：面试轮次、年份、方向、难度
- 题列表：复选框（选中加入队列）+ 元信息
- 底部："加入今日队列"按钮

### Direction Detail Page (`/library/directions/[slug]`)

同公司页布局，按方向+难度筛选。

## Practice Page (`/practice`)

- 随机出题（不更新 SRS，`mode: 'practice'`）
- 题型、方向、难度筛选器
- 答题后仅记录 `review_logs`（不计入每日进度）
- 复用 Phase 7 的 QuestionCard + RatingBar 组件

## Weak Page (`/weak`)

```
薄弱点 (3 题)

□ volatile 关键字 · C 语言 · 标记于 3 天前  [已掌握]
□ 中断嵌套 · MCU · 标记于 1 天前             [已掌握]
□ RTOS 调度算法 · RTOS · 标记于 5 天前        [已掌握]
```

- 按标记时间排序（最新的最前）
- 每道题可点击进入答题（跳转 `/today?qid=xxx`）
- "已掌握"按钮手动移除薄弱点标记
- 空状态："还没有薄弱点，刷题时遇到不会的题可点 ⚑ 标记"

## Stats Page (`/stats`)

```
学习统计

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 已学题数   │ │ 连续打卡   │ │ 总答题次数 │
│   142      │ │ 🔥 12 天  │ │  856       │
└────────────┘ └────────────┘ └────────────┘

过去 30 天活跃
▓░▓▓░▓▓▓░▓▓░░▓▓░▓░▓░░▓░▓▓░▓

各方向掌握度
C 基础     ▓▓▓▓▓▓▓▓░░░░  68%
MCU        ▓▓▓▓░░░░░░░░  32%
...

各公司进度
华为       ▓▓▓▓▓▓░░░░░░  12/82
大疆       ▓░░░░░░░░░░░  3/46
```

- Stats Service（Phase 4）提供数据
- heatmap：按日期颜色深浅显示活跃度（近 30 天）
- 方向/公司进度条

## Settings Page (`/settings`)

- 每日目标 (dailyGoal): 下拉选择 5/10/15/20/30 → 写入 `user_profiles` 表
- 主题切换：暗色/浅色（复用 ThemeProvider toggle）
- 账户信息显示（邮箱、注册时间）
- 退出登录按钮
- MVP 阶段简单设置，无需复杂表单

## Single Question Page (`/q/[id]`)

- SEO 入口，公开可访问（无需登录）
- `generateMetadata` 动态生成 SEO meta（title = 题目标题，description = 题目摘要）
- 展示完整题目内容（含答案、解析）
- 底部 CTA：登录后开始刷题
- 社交分享 meta: Open Graph, Twitter Card

## Landing Page (`/`)

补全 Phase 1 占位版：

- Hero 区：品牌语（"嵌入式工程师的科学刷题工具"）+ CTA（"开始刷题" → `/today`）
- 特性区：3 列（科学复习算法 / 嵌入式垂直题库 / PWA 离线可用）
- 题库预览：2-3 道可展开样题
- 作者介绍区
- Footer：版权信息、链接

## Verification

- 所有 8 个页面路由正常渲染
- Library 公司/方向 Tab 可切换，进度数据显示
- Company detail 页筛选器功能正常
- 标记薄弱点 → 在 Weak 页可见
- "已掌握"按钮正确移除薄弱点标记
- Stats 页显示热力图和方向进度
- `/q/[id]` 公开可访问，SEO meta 正确
- 落地页品牌信息和 CTA 正确
- 每个页面四种状态（loading/empty/error/data）均可触发
