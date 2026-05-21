# Phase 6: UI 设计系统 (Theme + Layout + shadcn 组件)

## Goal

所有基础 UI 元素、主题切换、响应式导航、shadcn/ui 组件库。不涉及业务逻辑。**认证表单组件已移至 Phase 5。**

## Prerequisites

Phase 6 依赖 Phase 1 建立的 CSS 变量体系（`app/globals.css` 中的 `@theme inline` 块），以及 `components.json` 配置。

## Architecture

```
components/
├── ui/                                    # shadcn/ui 组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── progress.tsx
│   ├── tabs.tsx
│   ├── avatar.tsx
│   ├── dropdown-menu.tsx
│   └── input.tsx                          # 供 Phase 5 auth 表单使用
├── layout/
│   ├── top-nav.tsx                        # 桌面端顶部导航
│   ├── bottom-tabs.tsx                    # 移动端底部 Tab
│   └── theme-toggle.tsx                   # 深浅模式切换按钮

app/
├── layout.tsx                             # Root: Geist fonts, 主题 script（Phase 1 已建）
├── (app)/layout.tsx                       # AuthGuard + TopNav/BottomTabs + ThemeProvider
└── (marketing)/layout.tsx                 # 公开页面布局

lib/utils/
├── cn.ts                                  # clsx + tailwind-merge (Phase 1 已建)
└── theme-provider.tsx                     # ThemeProvider Context
```

## Step 0: 创建 components.json

Phase 6 第一步是初始化 shadcn/ui 配置，使后续 `npx shadcn@latest add` 命令能正确工作：

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

创建后执行 `npx shadcn@latest add button card badge progress tabs avatar dropdown-menu input` 安装基础组件集。

## Theme Design

### CSS Variables（Phase 1 `app/globals.css` 已建立）

Phase 1 已通过 Tailwind v4 的 `@theme inline` 语法定义了品牌色变量：

```css
@theme inline {
  --color-brand: #C4F542;
  --color-brand-hover: #D4FF52;
}

:root {
  --background: #FAFAFA;
  --foreground: #0A0A0A;
  --card-bg: #FFFFFF;
  --card-border: #E5E5E5;
  --text-secondary: #525252;
}

.dark {
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --card-bg: #171717;
  --card-border: #262626;
  --text-secondary: #A1A1A1;
}
```

Phase 6 只扩展 Phase 1 的 CSS 变量，不重复定义已存在的变量。

### ThemeProvider

```typescript
// lib/utils/theme-provider.tsx
type Theme = 'dark' | 'light';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');  // 默认暗色

  useEffect(() => {
    const saved = localStorage.getItem('embedstudio:theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('embedstudio:theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
```

初始化时 `localStorage` 优先，无则 `prefers-color-scheme`，默认 dark。

## Navigation

### 桌面端 (>=768px): TopNav

```
[EmbedStudio logo]  今日  题库  薄弱点  练习  统计  |  🌙  头像▼
```

- 水平导航链接
- 当前活跃路由高亮
- 右侧：主题切换 + 用户下拉菜单（avatar / 设置 / 退出）

### 移动端 (<768px): BottomTabs

```
[今日] [题库] [薄弱点] [统计] [我的]
```

- 5 个 Tab，底部固定
- 图标 + 文字
- 活跃 Tab 高亮

### 路由匹配表

| 路由 | Nav 高亮 | Tab 高亮 |
|------|----------|----------|
| /today | 今日 | 今日 |
| /library/* | 题库 | 题库 |
| /weak | 薄弱点 | 薄弱点 |
| /practice | 练习 | (沿用今日 Tab) |
| /stats | 统计 | 统计 |
| /settings | - | 我的 |
| /auth/* | (隐藏 nav) | (隐藏 tab) |

## shadcn/ui 组件

Phase 6 通过 `npx shadcn@latest add` 安装以下最小集：

| 组件 | 用途 |
|------|------|
| button | 评价按钮、CTA、操作按钮 |
| card | 问答卡片、统计卡片、公司卡片 |
| badge | 标签、难度徽章、完成状态 |
| progress | 今日进度条 |
| tabs | 题库公司/方向切换 |
| avatar | 用户头像 |
| dropdown-menu | 用户菜单 |
| input | 供 Phase 5 auth 表单使用 |
| dialog | 确认对话框（预留） |

shadcn 使用 Neutral 色系，品牌绿色通过 `@theme inline` 定义的 `--color-brand` 引用。

## Verification

- 主题切换（暗色/浅色）正确切换 CSS 变量
- 桌面端(>768px)显示 TopNav，移动端(<768px)显示 BottomTabs
- 所有 shadcn 组件渲染无报错
- 导航链接正确高亮当前路由
- 页面刷新后主题保持（localStorage）
- auth/* 路由隐藏导航栏
- `components.json` 配置正确，`npx shadcn@latest add` 正常工作
