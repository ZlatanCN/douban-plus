# douban-plus

Userscript (v0.21.8) that enhances Douban movie/subject pages with richer metadata, ratings (IMDb, Metacritic, Rotten Tomatoes), streaming availability, cast info, and tight Apple TV-inspired layout.

## Language

**Host integration boundary**: The narrow layer where douban-plus reads or interoperates with Douban's existing document and browser platform APIs. _Avoid_: imperative UI, DOM-builder

**页面分区**: 详情页中可独立导航的一组相关内容，同时拥有导航标签和页面标题；两者表达同一内容类别，但允许信息密度不同。

**导航标签**: Sticky nav 中指向页面分区的紧凑类别名称，可以省略“热门”“作品”“详细”等范围修饰词，但必须保留“同”等关系词以及“影评 / 剧评”等类型差异。 _Avoid_: 行动提示、营销文案、与页面标题语义不同的别名

**页面标题**: 页面分区内容上方的描述性标题，可以在对应导航标签上增加“热门”“详细”“作品”等范围修饰词。 _Avoid_: 为追求逐字一致而牺牲上下文

**观看平台**: 提供当前作品观看入口的第三方视频服务商，例如爱奇艺、腾讯视频或 Netflix。 _Avoid_: 播放源、在哪儿看、播放平台

**影像**: 当前作品的视觉媒体集合，包括动态预告片和静态剧照。 _Avoid_: 用“剧照”指代同时包含预告片的分区

## Architecture

GreaseMonkey-style userscript built with TypeScript, Vite, vite-plugin-monkey, and Preact. The active subject-page UI is moving to traditional TSX modules: components are functions returning JSX, filenames are kebab-case, and runtime orchestration renders Preact at narrow mount seams.

`src/build/` was the legacy DOM-builder layer from the pre-Preact architecture and has been retired. Do not recreate it. UI work should enter through `src/modules/subject-page/` or shared Preact primitives under `src/components/`.

External rating data flows through **extract → resolve → Preact render**. The `resolve/` layer is the testable middle: it takes a `ResolutionContext`, runs HTTP fetches in parallel, and returns typed results without touching the DOM. The active UI consumes those results in `src/modules/subject-page/ratings/use-external-ratings.ts`; there is no longer a DOM `apply.ts` bridge.

### Module layout

```
src/
  modules/
    subject-page/      — active Preact page module and domain UI experiences
      subject-page.tsx   — page composition seam; callers pass data + deps
      types.ts           — subject-page dependency and callback contracts
      hero/              — hero background, poster, metadata, summary, actions
      ratings/           — Douban panel plus unified IMDb / Metacritic / Rotten Tomatoes external rating display
      media/             — streaming, series, cast, photos, recommendations
      details/           — facts, IMDb link, awards
      comments/          — short-comment cards, modal, icon voting, shared vote state
      reviews/           — review cards, modal lifecycle, content loading, up/down vote state
      interest/          — interest marking form and imperative opener
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
    mount.tsx            — external runtime interface: extract → render Preact → start effects
    extract-data.ts      — assembles DoubanData from extract modules
    account-gate.ts      — account-gated action guard and login prompt trigger
    login-frame-theme.ts — account-origin ATV CSS injection for Douban's login iframe
    interest-marking.ts  — deep module for hero interest actions, modal save/remove flow, and original Douban button proxying
    avatar-effect.ts     — comment avatar fetch/apply effect
    series-effect.ts     — late-loading series observer and nav insertion
    sticky-effect.ts     — sticky nav reveal + active-section tracking
  main.ts              — thin userscript entry. Imports CSS and starts runtime after DOMContentLoaded.
```

### Rating resolution strategy

`resolveAll` in `orchestrate.ts` uses a **parallel-first** strategy:

1. If H1 has an English title (95%+ of cases) → IMDb + RT + MC fire simultaneously via `Promise.allSettled`. One failure never blocks the others.
2. If no H1 title but IMDb returns one → RT + MC retry with IMDb title as fallback.
3. Error isolation: `Promise.allSettled` wraps every source. A null result means "not available", never "crashed".

`resolveAll` accepts `ResolutionContext` and none of the rating resolution implementation touches the DOM. The small IMDb/RT/MC pass-through resolver modules were collapsed on 2026-07-09; `resolveAll` owns identifier guards and calls the fetch adapters directly. The Preact ratings module is the only consumer of resolved rating data; `useExternalRatings` loads the async results and `ExternalRating({ source, rating, resolved })` owns the shared logo + loading/empty/loaded display state for IMDb, Metacritic, and Rotten Tomatoes.

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
| `assert-helpers.ts` | shared helpers for warnings, failures, overlay cleanup |
| `runner.ts` | external QA runner seam: launch browser, run scenarios, close browser, return exit code |
| `scenario-runner.ts` | per-scenario orchestration: fresh context per attempt, userscript injection, assertion phases, retry/deadline |

Warnings are categorized as `data-missing`, `auth-dependent`, or `browser-policy`. They do not fail CI by default. Interaction-blocked or product-uncertain behavior should be recorded as a failure, not downgraded to a warning.

Screenshots are part of the e2e contract. Each scenario owns exactly three screenshots in `tests/screenshots/`: `hero`, `full`, and `mobile`. Before capture, the harness closes ATV overlays, removes external Douban login/backdrop overlays, restores the desktop viewport, and resets `scrollY` to `0`; the mobile capture also resets to the top after resizing. Stale screenshots for scenarios no longer in `SCENARIOS` are cleaned up before the run.

`tests/qa.ts` is a thin CLI entry over `runQa()` (deepened 2026-07-08). The QA runner creates a fresh Playwright `BrowserContext` for every scenario attempt, so retries do not inherit cookies, storage, visited-link state, or mutated page state from a failed attempt. `runQa()` returns an exit code instead of exiting internally; only the CLI facade calls `process.exit()`.

### Current deep modules

1. **Subject page Preact module (2026-07-08)** — `src/modules/subject-page/` owns the active UI:
   - External seam is `SubjectPage({ data, deps })`; runtime passes extracted `DoubanData` and injected callbacks.
   - Internal modules follow user-facing experiences: `hero`, `ratings`, `media`, `details`, `comments`, `reviews`, `interest`, and `login`.
   - Shared leaf primitives live in `src/components/common`, `src/components/layout`, and `src/components/modal`.
   - Tests live under `tests/modules/subject-page/` and exercise module interfaces, not retired builder internals.
   - External rating display uses one deep module, `ratings/external-rating.tsx`: callers pass `source`, `rating`, and `resolved`; source-specific score renderers stay internal so skeleton/empty/loaded behavior has one owner.
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
   - External rating resolution now lives inside the Preact `ratings` module through `useExternalRatings`
   - Web API lifecycle matches the platform contracts: `MutationObserver` observes late series DOM and disconnects after insertion; `IntersectionObserver` owns active-section updates for the sticky nav

5. **Interest marking module (2026-07-08)** — `src/runtime/interest-marking.ts` owns the complete "想看 / 在看 / 看过" runtime flow:
   - External seam is `buildInterestMarkingCallbacks(subjectId, adapters?)`, returning the `HeroCallbacks` shape so the page UI does not learn modal/API details
   - The module localizes original Douban button proxy-clicking, modal save/remove callbacks, API result handling, and successful page reload
   - `src/runtime/mount.tsx` defines `buildHeroCallbacks` as a thin wrapper that delegates to `buildInterestMarkingCallbacks` internally; `src/main.ts` re-exports it for the userscript header
   - Tests inject adapters at the module seam instead of mocking global `location.reload()` or reaching through the modal implementation

6. **QA scenario runner module (2026-07-08)** — `tests/qa.ts` is a CLI facade over `tests/qa/runner.ts` and `tests/qa/scenario-runner.ts`:
   - External seam is `runQa(options?)`, which owns browser startup, reporter lifecycle, screenshot cleanup, scenario fan-out, browser shutdown, summary printing, and exit-code calculation
   - `runScenario(browser, scenario)` owns page navigation, userscript injection, ATV error collection, phased assertions, retry, deadline, and cleanup
   - Each attempt gets a fresh Playwright context and closes both page and context in `finally`, matching Playwright's isolation model and avoiding state carry-over from failed attempts
   - Screenshot capture remains part of the scenario assertion phases, not an optional post-process

7. **Account-gated actions (2026-07-08)** — Account writes share `src/runtime/account-gate.ts` and `src/modules/subject-page/login/`:
   - Account-gated actions are: interest marking, short-comment voting, and review useful/useless voting
   - Logged-out attempts open an ATV modal shell, trigger Douban's native login dialog, extract only the trusted account login iframe, and discard Douban's native dialog wrapper/masks before any optimistic UI update or API call
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
- **Deep subject-page seam**: Runtime calls `SubjectPage({ data, deps })`; module internals own layout, local UI state, modals, voting affordances, and rating panels.
- **Style ownership boundary**: CSS is split under `src/styles/` by UI experience and imported only through `src/styles.css`. Do not import CSS from TSX modules, do not use CSS Modules for ATV selectors, and do not wrap ATV styles in cascade layers because unlayered Douban author CSS would outrank layered userscript styles. Shared modal visual tokens such as the accent bar and base close button styling live in `src/styles/modals.css`; experience files should keep only positioning or state-specific overrides.
- **Scrapers are async**: Each external source gets its own resolver/scraper module. Remote work happens at explicit seams, not inside extractors.
- **No config/layout coupling**: Every rating panel has its own state and display rules. No shared visibility model.
- **250-LOC ceiling**: All modules stay under 250 LOC to avoid AI-slop-style oversized files.
- **Bottom exports**: All exports are declared at the bottom of each file via a single `export { ... }` block. Never use `export const` or `export function` inline. This makes the module's public API immediately visible at a glance.
- **`@/` import alias**: `@/` maps to `src/`. Use `@/components/foo` instead of `../../../components/foo` for imports that go up 2+ levels. Short relative imports (`./foo`, `../bar`) can stay relative. Configured in `tsconfig.json` (paths), `vite.config.ts` (resolve.alias), and `vitest.config.ts` (resolve.alias).
