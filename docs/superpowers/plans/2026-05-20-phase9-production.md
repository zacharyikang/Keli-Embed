# Phase 9: 生产就绪 (PWA + CI/CD + 错误处理 + 收尾)

## Goal

可上线的生产质量应用：离线能力、CI 防护、部署配置、错误处理、最终打磨。

## Architecture

```
.github/workflows/
├── ci.yml                        # Lint → Typecheck → Test → Build
└── content-sync.yml              # content/** 变更时触发

public/
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker (由 @serwist/next 生成)
├── icons/                        # PWA 图标 (192x192, 512x512)
└── og-image.png                  # 社交分享图

components/
├── error-boundary.tsx            # 顶层 Error Boundary
├── error-view.tsx                # 统一友好错误页
├── toast.tsx                     # Toast 提示组件
└── toast-provider.tsx

lib/
└── observability/
    └── track.ts                  # 统一日志上报

vercel.json                       # 部署配置
```

## PWA

使用 `@serwist/next` 实现（比 `next-pwa` 更活跃维护）：

### Service Worker 策略
- App shell 缓存：核心页面（NetworkFirst → Cache fallback）
- API 请求不缓存（写操作必须在线）
- 离线时展示已缓存页面，顶部提示 "离线模式，答题需联网"
- 不缓存 seed.json（Phase 9 不做离线写）

### Manifest

```json
{
  "name": "EmbedStudio",
  "short_name": "EmbedStudio",
  "description": "嵌入式工程师科学刷题",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#C4F542",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 安装提示
- 首次访问 `/today` 后触发 `beforeinstallprompt`
- 用户关闭后 `localStorage('embedstudio:pwa-prompt-dismissed')=true` 不再弹
- 不强制，尊重用户选择

## Error Handling

### Error Boundary

```typescript
// 顶层 Error Boundary 包裹 (app) layout
// 捕获未预期的 render 错误
// 显示 "出了点问题" + 重试按钮
// 不显示原始堆栈

// 页级别 (today / library) 提供更具体的恢复
// 如：题库加载失败 → "题库暂时不可用，请刷新"
```

### Toast

```
全局 Toast Provider (包裹 (app) layout)
- 类型: error / success / warning / info
- 自动 5s 消隐
- 手动关闭按钮
- 同一操作不出多个 toast（防 spam）
```

Toast 触发场景：
- Server Action 失败 → "网络异常，请重试"
- 评价提交失败 → "提交失败，请重试"
- 标记薄弱点成功 → "已标记"
- 会话过期 → "登录已过期" + 跳转

### Observability

```typescript
// lib/observability/track.ts
// Sentry 推迟到 v1.1 (spec §12.5)
// MVP: 结构化的 console.error + Vercel Logs

export function trackError(error: Error, context?: Record<string, unknown>) {
  console.error('[EmbedStudio]', {
    error: { name: error.name, message: error.message, stack: error.stack },
    context,
    timestamp: new Date().toISOString(),
  });
}

export function trackEvent(name: string, data?: Record<string, unknown>) {
  console.log('[EmbedStudio:event]', { name, data, timestamp: new Date().toISOString() });
}
```

不直接 `import Sentry`，业务代码通过 `track()` 上报。

## CI/CD

### GitHub Actions: `ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
```

### GitHub Actions: `content-sync.yml`

```yaml
name: Content Sync
on:
  push:
    paths:
      - 'content/**'

jobs:
  validate-and-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsx scripts/validate-content.ts
      - run: npx tsx scripts/sync-content.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### 条件触发
- `content/**` 变更 → 仅触发 content-sync (不触发 Vercel 部署)
- 代码变更 → 触发全量 CI + Vercel 部署
- Vercel 部署 webhook 在 build 成功后触发 content sync

## Deployment

### vercel.json

```json
{
  "region": "iad1",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Environment Variables

| 变量 | 来源 | 用途 |
|------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Dashboard | 客户端 SDK URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Dashboard | 客户端 anon key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard | 仅服务端（内容同步） |
| NEXT_PUBLIC_SITE_URL | Vercel 自动设定 | SEO canonical URL |

## Polish

- `loading.tsx` — 每个 route segment 添加加载骨架
- 键盘快捷键提示 tooltip（hover 按钮时显示）
- 滚动位置保持（返回时回到上次位置）
- 社交分享 meta: Open Graph, Twitter Card（已在 Phase 8b `/q/[id]` 建立）
- robots.txt（/auth, /api 禁止爬虫）

## Verification

- PWA Lighthouse: installable + offline-capable
- Service worker 缓存页面，断网刷新后仍显示
- Error boundary catch render 异常 → 友好错误页
- Toast 正常显示/消隐，不重复弹出
- CI pipeline 全部通过（lint → typecheck → test → build）
- `vercel deploy` 成功
- 环境变量配置正确，无泄露
- 安全 headers 生效（`curl -I` 验证）
