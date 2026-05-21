# EmbedStudio Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Each phase has a dedicated sub-plan file at `docs/superpowers/plans/`.

**Goal:** Build a production-ready SRS flashcard app for embedded engineers (Next.js 16 + Supabase + Tailwind/shadcn), from zero code to deployable MVP.

**Architecture:** Strict layered architecture — domain types → pure SRS functions → storage interfaces (swappable Supabase/LocalStorage) → business services → Server Actions → UI. ESLint boundaries enforce import direction at compile time.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4 + shadcn/ui, Supabase (Postgres + Auth + RLS), Vitest (unit/integration), Playwright (E2E), Geist fonts

## Sub-Plan Index

| Phase | Design Doc | Code | Status |
|-------|-----------|------|--------|
| 1 - Scaffold + Domain Types | [2026-05-20-phase1-scaffold.md](2026-05-20-phase1-scaffold.md) | ✅ 已实现 | ✅ Complete |
| 2 - SRS Algorithm | [2026-05-20-phase2-srs.md](2026-05-20-phase2-srs.md) | ✅ 已实现 | ✅ Complete |
| 3 - Storage Abstraction | [2026-05-20-phase3-storage.md](2026-05-20-phase3-storage.md) | ❌ 未开始 | 📝 Designed |
| 4 - Services Layer | [2026-05-20-phase4-services.md](2026-05-20-phase4-services.md) | ❌ 未开始 | 📝 Designed |
| 5 - Supabase Backend | [2026-05-20-phase5-supabase.md](2026-05-20-phase5-supabase.md) | ❌ 未开始 | 📝 Designed |
| 6 - UI Design System | [2026-05-20-phase6-ui-shell.md](2026-05-20-phase6-ui-shell.md) | ❌ 未开始 | 📝 Designed |
| 7 - Core Review Flow | [2026-05-20-phase7-core-flow.md](2026-05-20-phase7-core-flow.md) | ❌ 未开始 | 📝 Designed |
| 8a - Content Pipeline | [2026-05-20-phase8a-content-pipeline.md](2026-05-20-phase8a-content-pipeline.md) | ❌ 未开始 | 📝 Designed |
| 8b - Remaining Pages | [2026-05-20-phase8b-remaining-pages.md](2026-05-20-phase8b-remaining-pages.md) | ❌ 未开始 | 📝 Designed |
| 9 - Production Readiness | [2026-05-20-phase9-production.md](2026-05-20-phase9-production.md) | ❌ 未开始 | 📝 Designed |

---

## Phase Dependencies

```
Phase 1 (Foundation)
  ├── Phase 2 (SRS Algorithm) ────┐
  ├── Phase 3 (Storage Interfaces)┤
  └── Phase 6 (UI Shell)  ────────┤
                                   ├── Phase 4 (Services) ────┐
                                   ├── Phase 5 (Supabase) ────┤
                                   └── Phase 7 (Core Flow) ───┤
                                                              ├── Phase 8a (Content Pipeline)
                                                              ├── Phase 8b (Remaining Pages)
                                                              └── Phase 9 (Production)
```

**Parallelization:**
- Phases 2, 3, 6 can run in parallel (all depend only on Phase 1)
- Phases 4, 5 can run in parallel (depend on 2+3; Phase 5 auth forms need Phase 6 shadcn components)
- Phase 7 depends on 4+5+6 (services + supabase + UI components converge here)
- Phase 8a (content pipeline) and 8b (pages) can run in parallel after Phase 7
- Phase 9 runs last

**Key dependency notes:**
- Phase 5 auth forms (`sign-in-form.tsx`, `sign-up-form.tsx`) are created in Phase 5 but need shadcn/ui Button/Card/Input from Phase 6 to render. Create file skeletons in Phase 5, wire up full UI after Phase 6.
- Phase 3 `seed.json` is hand-written (not generated). Phase 8a `extract-seed.ts` provides the refresh mechanism.

**Decisions (confirmed):**
1. **Supabase dev**: Directly use Supabase cloud project (no Docker). `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
2. **Project root**: code lives in `/Users/zachary/Desktop/EmbedStudio/` directly
3. **Language**: Chinese UI + Chinese question content
4. **Runtime**: Node v25.2.1, npm 11.6.2
5. **CardStore interface**: All read/write methods receive `userId` (SupabaseStore ignores it — RLS handles isolation; LocalStore uses it for key namespacing)
6. **save_review_with_log RPC**: userId obtained from `auth.uid()` inside the function, not passed as parameter (prevents client-side forgery)

---

## Phase 1: Project Scaffold + Domain Types + Dev Tooling

**Goal:** Compilable, lintable, testable project shell with all domain types defined and toolchain verified.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase1-scaffold.md`

### Files to Create

| Area | Files |
|------|-------|
| Project init | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json` |
| ESLint | `eslint.config.mjs` — boundary rules for all layers (from spec §5.3) |
| Vitest | `vitest.config.ts` — jsdom environment |
| Global CSS | `app/globals.css` — brand colors via `@theme inline`, dark/light tokens |
| Layout root | `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(marketing)/layout.tsx` — minimal shells |
| Domain types | `lib/domain/question.ts`, `card-state.ts`, `rating.ts`, `review-log.ts`, `direction.ts`, `company.ts`, `user.ts`, `index.ts` |
| Error types | `lib/errors/network-error.ts`, `auth-error.ts`, `validation-error.ts`, `not-found-error.ts`, `index.ts` |
| Utils | `lib/utils/cn.ts` (shadcn className merge) |
| Tests | `tests/domain/card-state.test.ts` (emptyCardState, CardState defaults) |
| Config | `.gitignore`, `.env.local.example` |

### Key Decisions
- **eslint-plugin-import** with `no-restricted-paths` for boundary enforcement (simpler than eslint-plugin-boundaries)
- **Vitest** with `@vitejs/plugin-react` and `jsdom` for component tests
- **shadcn/ui** initialized with CSS variables mode (Neutral color palette, `@/` path alias)
- **All domain types use `Date` objects** — string dates only at serialization boundaries

### Verification
- `npm run dev` starts Next.js dev server
- `npm test` passes (emptyCardState, Rating type checks)
- `npm run lint` passes against boundary rules (test with an intentionally violating import)
- `tsc --noEmit` passes with strict mode

---

## Phase 2: SRS Algorithm (Pure Functions + Complete Tests)

**Goal:** Fully implemented and tested SRS library — zero imports of React/Next/Supabase.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase2-srs.md`

### Files to Create

| File | Responsibility |
|------|----------------|
| `lib/srs/schedule.ts` | Core `schedule(state, rating, now): CardState` — simplified SM-2 |
| `lib/srs/queue.ts` | `buildTodayQueue()`, `pickNewCards()` — 3 priority buckets |
| `lib/srs/weak-mark.ts` | `markAsWeak()`, `maybeUnmarkWeak()` — weak point logic |
| `lib/srs/ease-factor.ts` | EF helpers (clamp floor, adjust per rating) |
| `lib/srs/index.ts` | Barrel re-exports |
| `lib/srs/__tests__/schedule.test.ts` | 30+ cases — all 4 ratings × 3 rep states, EF floor |
| `lib/srs/__tests__/queue.test.ts` | Bucket ordering, limits, empty/edge cases |
| `lib/srs/__tests__/weak-mark.test.ts` | Mark null/existing, auto-unmark after 2× good |

### Verification
- 100+ unit tests passing, coverage >95%
- `tsc --noEmit` passes for all SRS files
- ESLint boundary rule blocks any React import in `lib/srs/`

---

## Phase 3: Storage Abstraction (Interfaces + LocalStore + Contract Tests)

**Goal:** Define storage contract (TypeScript interfaces) + LocalStore implementation + contract tests proving "swappable storage."

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase3-storage.md`

### Files to Create

| Area | Files |
|------|-------|
| Interfaces | `lib/storage/card-store.ts`, `question-store.ts`, `review-log-store.ts`, `profile-store.ts`, `index.ts` |
| Local stores | `lib/storage/local/card-store.ts`, `question-store.ts`, `review-log-store.ts`, `index.ts` |
| Seed data | `public/seed.json` (20+ hand-written sample questions across all directions) |
| Contract tests | `tests/storage/contract-card-store.test.ts`, `tests/storage/contract-question-store.test.ts` |

### Key Decisions
- `saveWithLog` is a single method on `CardStore` (atomicity boundary)
- All CardStore methods receive `userId` — SupabaseStore ignores it (RLS), LocalStore uses it for key namespacing
- `seed.json` is **hand-written** in Phase 3. Phase 8a `extract-seed.ts` provides the refresh mechanism for later.
- Contract tests use `describe.each` to run same body against both store implementations

### Verification
- Contract tests pass against LocalStore
- TypeScript compilation passes with zero `any` types
- `public/seed.json` is valid and parseable

---

## Phase 4: Services Layer (Business Logic + Server Action Shells)

**Goal:** Wire SRS + storage into cohesive business operations. Services testable with LocalStore.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase4-services.md`

### Files to Create

| Area | Files |
|------|-------|
| Review service | `lib/services/review-service.ts` — `submitAnswer(deps, userId, qid, rating, now)` |
| Queue service | `lib/services/queue-service.ts` — `getTodayQueue(deps, userId, now)` |
| Library service | `lib/services/library-service.ts` — `listByCompany()`, `listByDirection()` |
| Stats service | `lib/services/stats-service.ts` — `getStats()`, `directionProgress()` |
| Service barrel | `lib/services/index.ts` |
| Server Actions | `lib/actions/review-actions.ts`, `lib/actions/queue-actions.ts`, `lib/actions/library-actions.ts` |
| Service tests | `tests/services/review-service.test.ts`, `tests/services/queue-service.test.ts` |

### Key Decisions
- All service functions accept `deps: { cardStore, logStore, ... }` as first arg + `userId` as second arg (DI pattern)
- Server Actions extract `userId` from auth context, then delegate to services
- Services throw typed errors from `lib/errors/` (not raw strings)

### Verification
- All service tests pass using LocalStore
- Compile-time check: service files cannot import `lib/storage/supabase/` or `@supabase/*`
- Server Action files compile (runtime requires Supabase — deferred to Phase 5)

---

## Phase 5: Supabase Backend (DB + Auth + SupabaseStore)

**Goal:** Everything Supabase — migrations, RLS, SupabaseStore implementations, auth flow, login/register UI, middleware.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase5-supabase.md`

### Files to Create

| Area | Files |
|------|-------|
| Migrations | `supabase/migrations/001_questions.sql` → `008_auto_create_profile.sql` (8 files) |
| Seed | `supabase/seed.sql` (directions, companies, sample data) |
| Supabase client | `lib/storage/supabase/client.ts` — `createServerSupabase()`, `createBrowserSupabase()`, `createServiceRoleSupabase()` |
| Supabase stores | `lib/storage/supabase/card-store.ts`, `question-store.ts`, `review-log-store.ts`, `profile-store.ts` |
| Auth server | `lib/auth/server.ts` — `getCurrentUser(supabase)` |
| Auth client | `lib/auth/client.ts`, `lib/auth/provider.tsx` |
| Auth forms | `components/auth/sign-in-form.tsx`, `sign-up-form.tsx` (file skeletons, full UI after Phase 6) |
| Auth routes | `app/auth/sign-in/page.tsx`, `app/auth/sign-up/page.tsx`, `app/auth/callback/route.ts` |
| Middleware | `middleware.ts` (protect `/(app)/*` routes) |
| Container test | `tests/storage/supabase-card-store.test.ts` |

### Key Decisions
- `saveWithLog` on SupabaseCardStore uses a Postgres RPC function (atomic transaction)
- RPC gets `userId` from `auth.uid()` internally — NOT passed as parameter (prevents forgery)
- Snake→camelCase conversion isolated to `lib/storage/supabase/` only
- Auth form components belong to Phase 5 (not Phase 6) — file skeletons created, full UI wired after Phase 6 shadcn install

### Verification
- SupabaseStore contract tests pass (same assertions as Phase 3 LocalStore tests)
- Auth flow: sign-up → confirm → redirect → session persists
- RLS policies enforce data isolation (cross-user access attempt blocked)
- Middleware: unauthenticated → redirect to sign-in; authenticated → pass through

---

## Phase 6: UI Design System (Theme + Layout + shadcn Components)

**Goal:** All foundational UI components, dark/light theme, responsive navigation (desktop top-nav / mobile bottom-tabs). Auth forms moved to Phase 5.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase6-ui-shell.md`

### Files to Create

| Area | Files |
|------|-------|
| shadcn config | `components.json` |
| shadcn/ui | `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `progress.tsx`, `tabs.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `input.tsx` |
| Theme | `components/layout/theme-toggle.tsx`, `lib/utils/theme-provider.tsx` |
| Layout | `components/layout/top-nav.tsx`, `components/layout/bottom-tabs.tsx` |

### Key Decisions
- CSS variables already established in Phase 1 via `@theme inline` — Phase 6 extends, doesn't redefine
- Responsive breakpoint at `md` (768px) — top-nav → bottom-tabs
- Theme persists to `localStorage('embedstudio:theme')`, falls back to `prefers-color-scheme`, then dark
- `components.json` created first, then `npx shadcn@latest add` installs all components

### Verification
- Theme toggle switches dark/light with correct CSS variables
- Navigation renders correctly at desktop (768px+) and mobile
- All shadcn UI components render and accept props
- `components.json` config valid

---

## Phase 7: Core Review Flow (Today Page + Question Card + Rating)

**Goal:** Primary user interaction works end-to-end. Logged-in user visits `/today`, sees queue, flips cards, rates them, sees progress.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase7-core-flow.md`

### Files to Create

| Area | Files |
|------|-------|
| Question card | `components/questions/question-card.tsx` — flip animation, dispatch to renderers |
| Renderers | `components/questions/renderers/concept-renderer.tsx`, `choice-renderer.tsx`, `code-reading-renderer.tsx` |
| Rating bar | `components/questions/rating-bar.tsx` — 4 buttons, keyboard shortcuts, disabled states |
| Weak badge | `components/questions/weak-badge.tsx` — mark button + 30-limit tooltip |
| Today page | `app/(app)/today/page.tsx` (RSC), `app/(app)/today/today-client.tsx` (client) |
| Action integration | Wire Server Actions from Phase 4 |
| Component tests | `tests/components/question-card.test.tsx`, `tests/components/rating-bar.test.tsx` |

### Page States
- **Loading:** Skeleton card while queue loads
- **Empty queue:** "今天已完成！明日 N 题待复习" + CTA to Library
- **In-progress:** Normal card flow with progress bar
- **Queue exhausted:** Summary ("今天答了 X 题") + encouragement
- **Network error:** Toast "网络异常，请重试", card stays

### Verification
- Logged-in user sees queue at `/today`
- Space flips card, 1-4 rates it, progress bar updates
- Component tests verify keyboard shortcuts and disabled states
- Full flow: login → /today → answer 3 questions → see progress

---

## Phase 8a: Content Pipeline (Markdown → Supabase + Seed Extraction)

**Goal:** Content engineering pipeline: parse Markdown questions, validate, sync to Supabase, extract seed.json for LocalStore.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase8a-content-pipeline.md`

### Files to Create

| Area | Files |
|------|-------|
| Pipeline core | `lib/content/parse-markdown.ts`, `validate.ts`, `sync.ts`, `extract-seed.ts` |
| CLI scripts | `scripts/validate-content.ts`, `scripts/sync-content.ts`, `scripts/extract-seed.ts` |
| Content source | `content/directions.yaml`, `companies.yaml`, `content/questions/` (7 direction subdirs) |
| Tests | `tests/content/parse-markdown.test.ts`, `tests/content/validate.test.ts` |

### Verification
- Content pipeline parses valid `.md` files, validation catches errors
- `sync.ts` upserts to Supabase, soft-deletes missing files
- `extract-seed.ts` produces valid `seed.json`

---

## Phase 8b: Remaining Pages (Library + Practice + Weak + Stats + Settings + Landing + SEO)

**Goal:** All remaining page routes rendering with real data.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase8b-remaining-pages.md`

### Files to Create

| Area | Files |
|------|-------|
| Library | `app/(app)/library/page.tsx`, `library-client.tsx`, `companies/[slug]/page.tsx`, `directions/[slug]/page.tsx` |
| Library components | `components/library/company-card.tsx`, `direction-card.tsx`, `question-list-item.tsx` |
| Stats | `app/(app)/stats/page.tsx`, `components/stats/heatmap.tsx`, `direction-progress.tsx` |
| Practice | `app/(app)/practice/page.tsx` |
| Weak | `app/(app)/weak/page.tsx` |
| Settings | `app/(app)/settings/page.tsx` |
| Landing | `app/(marketing)/page.tsx` (complete from Phase 1 shell) |
| Single question | `app/q/[id]/page.tsx` (public SEO page) |

### Page States Applied
Every page handles: loading → empty → error → data. Library shows progress per company/direction. Stats shows heatmap. Weak shows empty state guidance.

### Verification
- All routes render with real data
- Library company grid shows correct counts with progress
- Statistics show review history and direction progress
- `/q/[id]` renders a full question page with SEO meta

---

## Phase 9: Production Readiness (PWA + CI/CD + Error Handling + Polish)

**Goal:** Production-quality app — offline-capable, CI-guarded, deployable to Vercel.

**Sub-plan:** `docs/superpowers/plans/2026-05-20-phase9-production.md`

### Files to Create

| Area | Files |
|------|-------|
| PWA | `public/manifest.json`, `public/icons/`, service worker config in `next.config.ts` |
| Error boundaries | `components/error-boundary.tsx`, `components/error-view.tsx` |
| Toast system | `components/toast-provider.tsx`, `components/toast.tsx` |
| Observability | `lib/observability/track.ts` |
| CI/CD | `.github/workflows/ci.yml`, `.github/workflows/content-sync.yml` |
| Deployment | `vercel.json` |
| Polish | `loading.tsx` for route segments, keyboard shortcut hints |

### Verification
- PWA Lighthouse audit: installable, offline-capable
- Error boundary catches render exception → friendly message + retry
- CI pipeline passes on clean run
- `vercel deploy` succeeds with all env vars

---

## Total Scope

| Metric | Count |
|--------|-------|
| Phases | 10 (1-7 + 8a + 8b + 9) |
| Approx. total files | ~170 |
| Unit tests | 100+ (SRS) + 30 (storage contract) + 20 (services) + 10 (components) + 15 (content) |
| Expected dev time (solo) | ~8 weeks full-time per spec §9.1.3 |
| Commits | ~60-80 (frequent small commits per writing-plans discipline) |
