# Phase 7: 核心答题流程 (Today 页面 + Question Card + 评价)

## Goal

主交互链路完整可用：登录用户访问 `/today` → 看到今日队列 → 翻牌 → 评价 → 进度条更新 → 全部完成。

## Architecture

```
app/(app)/today/
├── page.tsx                    # Server Component: auth check + 加载骨架
└── today-client.tsx            # Client Component: 队列状态管理 + 评价回调

components/questions/
├── question-card.tsx           # 卡片容器：翻面动画 + 题型分发
├── renderers/
│   ├── concept-renderer.tsx    # 概念问答渲染
│   ├── choice-renderer.tsx     # 选择题渲染
│   └── code-reading-renderer.tsx  # 代码阅读题渲染
├── rating-bar.tsx              # 4 评价按钮 + 键盘快捷键
└── weak-badge.tsx              # 标记薄弱点按钮 + 上限提示

tests/components/
├── question-card.test.tsx
└── rating-bar.test.tsx
```

## Component Tree

```
today/page.tsx (RSC)
  └─ AuthGuard (redirect if not authed)
     └─ today-client.tsx
        ├─ 进度条 (local state: answered / total)
        ├─ QuestionCard
        │  ├─ CardHeader: 题型标签 / 方向 / 难度 / WeakBadge
        │  ├─ CardBody (choose renderer by type)
        │  │  ├─ ConceptRenderer
        │  │  ├─ ChoiceRenderer
        │  │  └─ CodeReadingRenderer
        │  ├─ CardFooter (only after flip)
        │  │  └─ RatingBar
```

## QuestionCard Design

### 翻面交互

```
正面: 题干
  [点击翻面] 或 按 Space
          ↓
背面: 答案 + 解析
  底部显示 RatingBar (1-4 评价按钮)
```

- CSS 3D transform: `rotateY(180deg)`, 250ms ease-in-out
- `backface-visibility: hidden` + `transform-style: preserve-3d`
- 翻面后不可翻回
- 评价后 200ms 淡出切下一题

### 键盘快捷键

| 键 | 动作 | 条件 |
|----|------|------|
| Space | 翻面 | 卡片正面可见 |
| 1 | Again (忘了) | 翻面后 |
| 2 | Hard (困难) | 翻面后 |
| 3 | Good (一般) | 翻面后 |
| 4 | Easy (简单) | 翻面后 |
| W | 标记薄弱点 | 任何时候 |

快捷键守卫：`document.activeElement` 不是 `INPUT`/`TEXTAREA` 时才生效。

### 题型分发

```typescript
function QuestionCard({ question, onRate, onMarkWeak }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="card-container">
      <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
        <div className="card-front">
          <CardHeader>...</CardHeader>
          <CardBody>
            {question.type === 'concept' && <ConceptRenderer q={question} />}
            {question.type === 'choice' && <ChoiceRenderer q={question} />}
            {question.type === 'code-reading' && <CodeReadingRenderer q={question} />}
          </CardBody>
          <button onClick={() => setFlipped(true)}>点击翻面 (Space)</button>
        </div>
        <div className="card-back">
          <CardBody>{question.answer}</CardBody>
          {question.explanation && <p>{question.explanation}</p>}
          <RatingBar onRate={onRate} />
        </div>
      </div>
    </div>
  );
}
```

## Renderers

每个 renderer 只接 `q: Question` props，不知 SRS / 存储。

### ConceptRenderer
- 题干 Markdown 渲染（使用 marked / react-markdown）
- 代码块用 Geist Mono

### ChoiceRenderer
- 题干 + 选项列表
- 选择后显示正确/错误（选择后不可改）
- 翻面后显示解析

### CodeReadingRenderer
- 代码块展示（高亮，用 shiki 或 Prism）
- 问题在代码下方
- 翻面后显示答案解析

## RatingBar

```typescript
type RatingBarProps = {
  onRate: (rating: Rating) => void;
  disabled?: boolean;       // 防止重复点击
};
```

- 4 个按钮：Again (红) / Hard (橙) / Good (绿) / Easy (蓝绿)
- 快捷键显示在按钮上：`1` / `2` / `3` / `4`
- 点击后 disabled，等待 Server Action 完成
- loading 状态显示 spinner 或按钮变灰

## WeakBadge

```typescript
type WeakBadgeProps = {
  isWeak: boolean;
  totalWeakCount: number;   // 当前总标记数
  onMarkWeak: () => void;
};
```

- 非薄弱点：旗帜图标 + "标记不会"
- 已标记：实心旗帜 + "已标记"
- totalWeakCount >= 30 时：按钮旁小字 "已标记 30 题，建议先消化再继续"
- 不强制拦截，仅 UI 提示

## Today Page States

| 状态 | 展示 |
|------|------|
| **Loading** | 骨架屏（灰色 Card 轮廓 + pulse 动画） |
| **Empty queue** | "今天已完成！明日 N 题待复习" + 推荐自由刷题/题库 |
| **In-progress** | 进度条 `12/30` + 卡片流 |
| **Exhausted** | 总结画面（答了 X 题 + 鼓励语 + 明日继续） |
| **Network error** | Toast "网络异常，请重试" + 卡片不动 |

## Test Plan

### question-card.test.tsx
```
- renders question body on front
- flips to show answer on Space key
- dispatches to correct renderer by type
- shows RatingBar only after flip
- shows WeakBadge with correct state
```

### rating-bar.test.tsx
```
- renders 4 buttons with correct labels
- calls onRate with correct rating on click
- disables buttons after click
- enables keyboard shortcuts
- ignores shortcuts when input focused
```

## Verification

- `/today` 展示今日队列（使用 LocalStore 模拟数据）
- Space 翻牌，1-4 评价
- 进度条从 0/10 走到 10/10
- 全部答完显示总结
- 标记薄弱点后在队列中优先出现
- 超过 30 题标记显示提示
