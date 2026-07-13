# douban-plus

Userscript (v0.21.8) that enhances Douban movie/subject pages with richer metadata, ratings (IMDb, Metacritic, Rotten Tomatoes), streaming availability, cast info, and tight Apple TV-inspired layout.

## Language

**Host integration boundary**: The narrow layer where douban-plus reads or interoperates with Douban's existing document and browser platform APIs. _Avoid_: imperative UI, DOM-builder

**作品标记**: 登录用户对当前作品作出的“想看”“在看”或“看过”状态，以及随状态提交或移除的评分和短评。_Avoid_: 兴趣表单、原生按钮代理

**登录可读编辑元信息**: 仅在登录后的 Douban 条目编辑页可读取、但不要求当前用户拥有编辑权限的作品资料字段。_Avoid_: 编辑者专属资料、公开详情元信息

**页面分区**: 详情页中可独立导航的一组相关内容，同时拥有导航标签和页面标题；两者表达同一内容类别，但允许信息密度不同。

**导航标签**: Sticky nav 中指向页面分区的紧凑类别名称，可以省略“热门”“作品”“详细”等范围修饰词，但必须保留“同”等关系词以及“影评 / 剧评”等类型差异。 _Avoid_: 行动提示、营销文案、与页面标题语义不同的别名

**页面标题**: 页面分区内容上方的描述性标题，可以在对应导航标签上增加“热门”“详细”“作品”等范围修饰词。 _Avoid_: 为追求逐字一致而牺牲上下文

**观看平台**: 提供当前作品观看入口的第三方视频服务商，例如爱奇艺、腾讯视频或 Netflix。 _Avoid_: 播放源、在哪儿看、播放平台

**首播平台**: 作品首次或预定首次发布的电视台或流媒体服务商，例如 Apple TV+；不承诺该服务商拥有永久或排他的播放权。_Avoid_: 观看平台、制片公司

**影像**: 当前作品的视觉媒体集合，包括动态预告片和静态剧照。 _Avoid_: 用“剧照”指代同时包含预告片的分区

**影评正文**: 一篇影评的完整可阅读内容，与列表卡片中的摘要不同；内容不可获得时必须明确失败，不以摘要替代。 _Avoid_: 影评摘要、截断正文

**小组讨论 / 讨论区**: 与当前作品关联的话题入口集合（来自"小组讨论"或"讨论区"两种 DOM 结构），增强页只展示话题摘要信息并跳转到豆瓣原生讨论页面；三种 DOM 变体（小组讨论 table + 讨论区 Type 1 `.mod .mv-discussion-list` + 讨论区 Type 2 `.section-discussion`）互斥出现，提取器自动检测。话题链接可能跨多个豆瓣子域名（小组话题使用 `www.douban.com/group/topic/`、条目讨论使用 `movie.douban.com/subject/…/discussion/`）；讨论提取器的 URL 安全验证允许任意 `*.douban.com` 子域名。 _Avoid_: 短评、影评、在增强页内加载正文或回复

**讨论回应数**: 话题已有回应的数量；原生回应单元格留空表示零回应，而 `.mv-hot-discussion-list` 内的隐藏热门讨论行不会被计入，单元格缺失或内容无法解析表示数量未知。

## Architecture

GreaseMonkey-style userscript built with TypeScript, Vite, vite-plugin-monkey, and Preact. The active subject-page UI is moving to traditional TSX modules: components are functions returning JSX, filenames are kebab-case, and runtime orchestration renders Preact at narrow mount seams.

`src/build/` was the legacy DOM-builder layer from the pre-Preact architecture and has been retired. Do not recreate it. UI work should enter through `src/modules/subject-page/` or shared Preact primitives under `src/components/`.

External rating data flows through **extract → resolve → Preact render**. The `resolve/` layer is the testable middle: it takes a `ResolutionContext`, runs HTTP fetches in parallel, and returns typed results without touching the DOM. `src/runtime/use-external-ratings.ts` owns the runtime lifecycle; there is no DOM `apply.ts` bridge.

### Module layout

```
src/
  modules/
    subject-page/      — active Preact page module and domain UI experiences
      subject-page.tsx   — pure page composition seam; runtime passes data + runtime value
      types.ts           — subject-page runtime data and action contracts
      hero/              — hero background, poster, metadata, summary, actions
      ratings/           — Douban panel plus unified IMDb / Metacritic / Rotten Tomatoes external rating display
      media/             — streaming, series, cast, photos, recommendations
      details/           — facts, IMDb link, awards
      comments/          — short-comment cards, modal, icon voting, shared vote state
      reviews/           — review cards, modal lifecycle, content loading, up/down vote state
      interest/          — complete 作品标记 flow: account gate, form, writes, and refresh
      login/             — ATV login modal shell + trusted Douban iframe host
      use-vote-state.ts  — shared keyed owner-state hook for card/modal vote synchronization
  components/
    common/            — reusable leaf UI such as poster and stars
    layout/            — Section, sticky nav, nav-section calculation
    modal/             — canonical Preact modal shell, close button, focus trap, poster/video imperative openers
  styles.css           — single stylesheet manifest imported by main.ts
  styles/              — ownership-oriented CSS files ordered by the manifest
  extract/             — DOM data extraction
    index.ts            — barrel
    title-helpers.ts    — extractEnglishSeriesName, extractSeasonFromH1 (extracted from main.ts 2026-07-06)
  resolve/             — rating resolution seam (extracted to testable layer 2026-07-06)
    types.ts            — ResolutionContext, RatingResultMap, RatingSource
    context.ts          — buildContext(imdbId, isTV, doc): builds context from identifiers + DOM H1
    orchestrate.ts      — resolveAll(ctx, deps?): guards identifiers, calls fetch adapters, parallel-first strategy with Promise.allSettled
  api/                 — data fetching & scraping interfaces
    avatar.ts            — fetchAvatarUrls(): pure data pipeline, fetch + parse + cache, no DOM (cleaned 2026-07-06)
    comment.ts           — postVote() for comment voting via GM POST
    interest.ts          — postInterest/removeInterest for interest marking
    imdb.ts              — fetchImdbRating() via IMDB GraphQL API
    rating-fetcher.ts    — shared slug/cache/sequential-fallback fetcher factory for external rating pages
    metacritic.ts        — fetchMcRating() via Metacritic URL config + JSON-LD parser
    rotten.ts            — fetchRtRating() via Rotten Tomatoes URL config + script JSON parser
  runtime/             — subject page runtime module (deepened 2026-07-08)
    mount.tsx            — external runtime interface: extract → render SubjectPageRuntime
    subject-page-runtime.tsx — deep host integration module: lifecycle, requests, browser state → SubjectPage runtime value
    extract-data.ts      — assembles DoubanData from extract modules
    login-frame-theme.ts — account-origin ATV CSS injection for Douban's login iframe
    avatar-effect.ts     — comment avatar fetch/apply effect
    series-effect.ts     — late-loading series observer and nav insertion
    use-sticky-navigation.ts — sticky nav reveal, active-section tracking, and jump lifecycle
  main.ts              — thin userscript entry. Imports CSS and starts runtime after DOMContentLoaded.
```

### Rating resolution strategy

`resolveAll` in `orchestrate.ts` uses a **parallel-first** strategy:

1. If H1 has an English title (95%+ of cases) → IMDb + RT + MC fire simultaneously via `Promise.allSettled`. One failure never blocks the others.
2. If no H1 title but IMDb returns one → RT + MC retry with IMDb title as fallback.
3. Error isolation: `Promise.allSettled` wraps every source. A null result means "not available", never "crashed".

`resolveAll` accepts `ResolutionContext` and none of the rating resolution implementation touches the DOM. The small IMDb/RT/MC pass-through resolver modules were collapsed on 2026-07-09; `resolveAll` owns identifier guards and calls the fetch adapters directly. The subject-page runtime module loads async results; `ExternalRating({ source, rating, resolved })` owns the shared logo + loading/empty/loaded display state for IMDb, Metacritic, and Rotten Tomatoes.

### Resolution seam tests (18 tests across 2 files)

| File | What it covers |
| --- | --- |
| `tests/resolve/context.test.ts` | movie/TV H1 parsing, no-English-title, null imdbId, empty H1 |
| `tests/resolve/orchestrate.test.ts` | fetch adapter calls, parallel resolution, fallback path, error isolation, no-identifiers, no-H1-no-IMDb-title |

### QA / E2E harness

`pnpm run test:e2e` runs `tests/qa.ts` against real Douban subject pages with Playwright Edge (`channel: "msedge"`). It injects the built userscript from `dist/douban-plus.user.js`, so the harness guards that `dist/` is fresh relative to `src/` and `vite.config.ts`; run `pnpm run build` first after source changes.

The QA assertions are split by responsibility under `tests/qa/`:

| File | Responsibility |
| --- | --- |
| `assert-core.ts` | root/hero/rating/title/sticky-nav/script-error checks |
| `assert-sections.ts` | cast/photos/recommendations/comments/streaming/awards/info-grid |
| `assert-interactions.ts` | inline expansion, comment overlay, voting, interest modal |
| `assert-media.ts` | TV streaming popup, poster modal, trailer/video modal |
| `assert-screenshots.ts` | screenshot lifecycle and screenshot-specific invariants |
| `assert-scroll.ts` | scroll-flash regression: rapid scroll-up stacking order + will-change audit |
| `assert-perf.ts` | per-page jank measurement: FPS monitor injection, slow/fast/micro/ nav-threshold / carousel / mobile scenarios |
| `assert-helpers.ts` | shared helpers for warnings, failures, overlay cleanup |
| `runner.ts` | external QA runner seam: launch browser, run scenarios, close browser, return exit code |
| `scenario-runner.ts` | per-scenario orchestration: fresh context per attempt, userscript injection, assertion phases, retry/deadline |

Warnings are categorized as `data-missing`, `auth-dependent`, or `browser-policy`. They do not fail CI by default. Interaction-blocked or product-uncertain behavior should be recorded as a failure, not downgraded to a warning.

Screenshots are part of the e2e contract. Each scenario owns exactly three screenshots in `tests/screenshots/`: `hero`, `full`, and `mobile`. Before capture, the harness closes ATV overlays, removes external Douban login/backdrop overlays, restores the desktop viewport, and resets `scrollY` to `0`; the mobile capture also resets to the top after resizing. Stale screenshots for scenarios no longer in `SCENARIOS` are cleaned up before the run.

### Standalone performance test runner

`tests/perf-runner.ts` is a standalone performance and visual regression test that runs outside the QA harness:

```
npx tsx tests/perf-runner.ts
```

It tests **4 pages × 21 scenarios = 84 runs**, measuring FPS and jank via an injected `requestAnimationFrame` monitor:

| Category | Scenarios |
| --- | --- |
| Baseline (8) | slow-scroll, fast-scroll, nav-threshold-x12, section-jump, carousel-scroll, vert+horiz-simult, micro-scroll-x20, mobile-scroll |
| Direction & timing (5) | dir-reversal-x8, keyboard-pgdn-pgup, bottom-bounce-x6, inertia-decay, touch-flick-stop |
| Page-state interference (4) | cold-scroll-immediate, tab-switch-resume, scroll+hover, fatigue-8s |
| Extreme input (4) | wheel-spike, scroll-event-flood, resize+scroll, reduced-motion-scroll |

Thresholds: avgFps ≥ 55 & jank ≤ 1% (PASS), jank ≤ 2.5% (WARN). The runner creates a headless Playwright Edge context, injects the built userscript (from `dist/douban-plus.user.js`), and measures per-scenario jank with a zero-dependency FPS monitor. Start with `pnpm run build` to ensure a fresh userscript build.

The 21 scenarios are designed to isolate different performance dimensions: slow scrolling measures compositor jank, fast scrolling reveals layout storm, nav-threshold targets sticky-nav visibility transitions, micro-scroll targets scroll handler overhead, and extreme-input scenarios test resilience against rapid event delivery.

`tests/qa.ts` is a thin CLI entry over `runQa()` (deepened 2026-07-08). The QA runner creates a fresh Playwright `BrowserContext` for every scenario attempt, so retries do not inherit cookies, storage, visited-link state, or mutated page state from a failed attempt. `runQa()` returns an exit code instead of exiting internally; only the CLI facade calls `process.exit()`.

### Current deep modules

1. **Subject page Preact module (2026-07-08)** — `src/modules/subject-page/` owns the active UI:
   - External seam is `SubjectPage({ data, runtime })`; runtime passes extracted `DoubanData`, resolved host data, and user actions without leaking the Douban document.
   - Internal modules follow user-facing experiences: `hero`, `ratings`, `media`, `details`, `comments`, `reviews`, `interest`, and `login`.
   - Shared leaf primitives live in `src/components/common`, `src/components/layout`, and `src/components/modal`.
   - Tests live under `tests/modules/subject-page/` and exercise module interfaces, not retired builder internals.
   - External rating display uses one deep module, `ratings/external-rating.tsx`: callers pass `source`, `rating`, and `resolved`; source-specific score renderers stay internal so skeleton/empty/loaded behavior has one owner.
   - Review-content acquisition uses one deep module, `reviews/use-review-content.ts`: native page HTML and fetched review-page HTML are internal adapters; callers receive only loading, loaded sanitized 影评正文, or error state.
   - `SubjectPage` owns cross-surface UI state that must stay synchronized between cards and modals. The shared keyed owner-state plumbing lives in `use-vote-state.ts`; comment vote behavior is modeled in `comments/comment-vote-state.ts`, and review useful/useless behavior plus persistence is modeled in `reviews/review-vote-state.ts`.
   - Vote buttons support controlled and standalone modes. Inside `SubjectPage`, card and modal buttons must read/write the same owner state; standalone section tests can still rely on local button state.

2. **Avatar data pipeline split (2026-07-06)** — `src/api/avatar.ts` was the only module crossing the data-fetching/DOM-construction boundary. Split into two clean modules:
   - `api/avatar.ts` — pure data pipeline: `fetchAvatarUrls(links)` returns `Map<link, url>` with read-through cache, parallel fetch via `Promise.allSettled`, no DOM access
   - `components/avatar-dom.ts` — DOM mutation: `applyCommentAvatars(urlMap, comments)` sets `comment.avatar`, preloads images, applies `backgroundImage` with RAF retry
   - `runtime/avatar-effect.ts` orchestrates `await pipeline → apply to DOM`

3. **External rating fetcher factory (2026-07-09)** — `src/api/rating-fetcher.ts` owns the common provider algorithm:
   - External seam is `createRatingFetcher({ cache, parse, referer, slugSeparator, urls })`
   - The shared implementation handles empty titles, slug normalization, cache-key construction, TTL cache lookup/write, sequential URL fallback, network-error isolation, and parser-null fallback
   - Provider modules keep only site-specific knowledge: Metacritic URL shapes + JSON-LD parser; Rotten Tomatoes URL shapes + script JSON parser
   - Preserve sequential fallback. These provider URLs are alternatives, not independent sources, so do not parallelize them.

4. **Canonical modal module (2026-07-09)** — `src/components/modal/modal-shell.tsx` is the single modal implementation:
   - `ModalShell` owns dialog semantics, `aria-modal`, body scroll lock, outside-click close, Escape close, close-transition timing, and focus trap behavior
   - Comment, review, interest, login, poster, and video modals all render through `ModalShell`
   - Poster/video no longer use the retired DOM `createOverlay` seam; their imperative openers render Preact content into a temporary host and restore trigger focus on close
   5. **Subject page runtime module (2026-07-08)** — `src/main.ts` is a thin startup facade over `src/runtime/`:
   - External runtime seam is `mountSubjectPage(doc?)`: guard duplicate mounts, extract `DoubanData`, render Preact, insert DOM, and start post-render effects
   - Runtime effects are localized: avatars, late series data, sticky nav reveal, and active-section tracking each live behind a small internal module
   - External rating resolution, first-broadcast lookup, late series observation, native summary expansion, and sticky-nav browser lifecycle live in `SubjectPageRuntime` under `src/runtime/`
   - Web API lifecycle matches the platform contracts: `MutationObserver` observes late series DOM and disconnects after insertion; `IntersectionObserver` owns active-section updates for the sticky nav

5. **作品标记 module (2026-07-12)** — `src/modules/subject-page/interest/use-interest-marking.tsx` owns the complete "想看 / 在看 / 看过" flow:
   - External seam is `useInterestMarking({ subjectId, loggedIn, onLoginRequired, adapters? })`; it returns the Hero callbacks and optional Interest form, so Subject page does not learn form lifecycle or writes
   - The module localizes the account gate, login request, modal state, save/remove callbacks, API result handling, and successful page reload
   - All hero actions open the enhanced form after login; original Douban interest-button proxying is not part of the flow
   - Tests inject write and reload adapters at the module seam, exercising login, failure, save, and removal without reaching through the implementation

6. **QA scenario runner module (2026-07-08)** — `tests/qa.ts` is a CLI facade over `tests/qa/runner.ts` and `tests/qa/scenario-runner.ts`:
   - External seam is `runQa(options?)`, which owns browser startup, reporter lifecycle, screenshot cleanup, scenario fan-out, browser shutdown, summary printing, and exit-code calculation
   - `runScenario(browser, scenario)` owns page navigation, userscript injection, ATV error collection, phased assertions, retry, deadline, and cleanup
   - Each attempt gets a fresh Playwright context and closes both page and context in `finally`, matching Playwright's isolation model and avoiding state carry-over from failed attempts
   - Screenshot capture remains part of the scenario assertion phases, not an optional post-process

7. **Account-gated actions (2026-07-12)** — 作品标记 owns its account gate in `src/modules/subject-page/interest/use-interest-marking.tsx`; short-comment and review voting keep their page-level guards, while all three reuse `src/modules/subject-page/login/` for login presentation:

- Account-gated actions are: interest marking, short-comment voting, and review useful/useless voting
  - Logged-out attempts open an ATV modal shell, trigger Douban's native login dialog, extract only the trusted account login iframe, and discard Douban's native dialog wrapper/masks before any optimistic UI update or API call
  - `mountNativeLoginFrame` has three fallback layers: (1) find a recognized dialog wrapper via `nativeDialogSelector`, (2) search for a pre-rendered login iframe directly by `src` pattern, (3) trigger Douban's `.a_show_login` click handler and poll for the dialog. Layer 3 is the primary path on most Douban pages.
  - `triggerNativeLoginDialog` restricts its search to `.a_show_login` and `.j.a_show_login` only (not generic `a[href*='register']` etc.) because ATV's own DOM also contains register links that would be clicked instead. Hidden elements (inside `#wrapper` with `display: none`) are intentionally included — `element.click()` fires JS event handlers regardless of CSS visibility, and Douban's `.a_show_login` handlers create the login dialog.
  - When clicking an `<a>` trigger, a `once` `preventDefault` listener is attached first to prevent navigation away from ATV, then `click()` is called. This is safe because Douban's own handler also calls `preventDefault`.
  - The userscript also matches `accounts.douban.com/passport/login*` and runs only `src/runtime/login-frame-theme.ts` there, so the iframe receives ATV login styling without copying login DOM, reading credentials, binding submit handlers, or running the subject-page app in the account origin
  - Comment and review vote controls receive preflight guards so counts do not briefly change and roll back when the user is logged out
  - API modules still keep their `ck` checks as the final safety net

### Data pipeline integrity — avatar split

`src/api/avatar.ts` was the only module crossing the data/DOM boundary. Split on 2026-07-06:

| Layer | File | Export | Responsibility | DOM-free? |
| --- | --- | --- | --- | --- |
| Data pipeline | `api/avatar.ts` | `fetchAvatarUrls(links)` | Cache read-through → fetch → parse → cache → return Map | ✅ |
| DOM mutation | `components/avatar-dom.ts` | `applyCommentAvatars(urlMap, comments)` | Preload images, RAF-retry querySelector, set backgroundImage | ❌ (DOM-only) |
| Orchestration | `runtime/avatar-effect.ts` | `startAvatarEffect(comments)` | `await pipeline → apply to DOM` | — |

6 data tests (no DOM needed) + 8 DOM tests (happy-dom) = 14 total, replacing 3 cache-only tests.

### Key design decisions

- **Preact TSX modules**: UI components are functions returning TSX. Filenames are kebab-case; component identifiers stay PascalCase.
- **Deep subject-page seam**: Runtime calls `SubjectPageRuntime({ data, doc })`, which calls `SubjectPage({ data, runtime })`; Subject page internals own layout, local UI state, modals, voting affordances, and rating panels without touching the Douban document or network.
- **Style ownership boundary**: CSS is split under `src/styles/` by UI experience and imported only through `src/styles.css`. Do not import CSS from TSX modules, do not use CSS Modules for ATV selectors, and do not wrap ATV styles in cascade layers because unlayered Douban author CSS would outrank layered userscript styles. Shared modal visual tokens such as the accent bar and base close button styling live in `src/styles/modals.css`; experience files should keep only positioning or state-specific overrides.
- **Scrapers are async**: Each external source gets its own resolver/scraper module. Remote work happens at explicit seams, not inside extractors.
- **No config/layout coupling**: Every rating panel has its own state and display rules. No shared visibility model.
- **250-LOC ceiling**: All modules stay under 250 LOC to avoid AI-slop-style oversized files.
- **Bottom exports**: All exports are declared at the bottom of each file via a single `export { ... }` block. Never use `export const` or `export function` inline. This makes the module's public API immediately visible at a glance.
- **`@/` import alias**: `@/` maps to `src/`. Use `@/components/foo` instead of `../../../components/foo` for imports that go up 2+ levels. Short relative imports (`./foo`, `../bar`) can stay relative. Configured in `tsconfig.json` (paths), `vite.config.ts` (resolve.alias), and `vitest.config.ts` (resolve.alias).
