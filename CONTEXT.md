# douban-plus

Userscript (v0.21.8) that enhances Douban movie/subject pages with richer metadata, ratings (IMDb, Metacritic, Rotten Tomatoes), streaming availability, cast info, and tight Apple TV-inspired layout.

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
      ratings/           — Douban / IMDb / Metacritic / Rotten Tomatoes panels
      media/             — streaming, series, cast, photos, recommendations
      details/           — facts, IMDb link, awards
      comments/          — short-comment cards, modal, icon voting, shared vote state
      reviews/           — review cards, modal lifecycle, content loading, up/down vote state
      interest/          — interest marking form and imperative opener
      login/             — ATV login modal shell + trusted Douban iframe host
  components/
    common/            — reusable leaf UI such as poster and stars
    layout/            — Section, sticky nav, nav-section calculation
    modal/             — shared Preact modal shell, close button, focus trap
  styles.css           — single stylesheet manifest imported by main.ts
  styles/              — ownership-oriented CSS files ordered by the manifest
  extract/             — DOM data extraction
    index.ts            — barrel
    title-helpers.ts    — extractEnglishSeriesName, extractSeasonFromH1 (extracted from main.ts 2026-07-06)
  resolve/             — rating resolution seam (extracted to testable layer 2026-07-06)
    types.ts            — ResolutionContext, RatingResultMap, RatingSource
    context.ts          — buildContext(imdbId, isTV, doc): builds context from identifiers + DOM H1
    imdb.ts             — resolveImdb(ctx): wraps fetchImdbRating, guards on ctx.imdbId
    rt.ts               — resolveRt(ctx): wraps fetchRtRating, guards on ctx.englishTitle
    mc.ts               — resolveMc(ctx): wraps fetchMcRating, guards on ctx.englishTitle
    orchestrate.ts      — resolveAll(ctx, deps?): parallel-first strategy with Promise.allSettled
  api/                 — data fetching & scraping interfaces
    avatar.ts            — fetchAvatarUrls(): pure data pipeline, fetch + parse + cache, no DOM (cleaned 2026-07-06)
    comment.ts           — postVote() for comment voting via GM POST
    interest.ts          — postInterest/removeInterest for interest marking
    imdb.ts              — fetchImdbRating() via IMDB GraphQL API
    metacritic.ts        — fetchMcRating() via Metacritic scraping
    rotten.ts            — fetchRtRating() via Rotten Tomatoes scraping
  scrapers/            — data scrapers (one per external source: IMDb, MC, RT, streaming)
  runtime/             — subject page runtime module (deepened 2026-07-08)
    mount.tsx            — external runtime interface: extract → render Preact → start effects
    extract-data.ts      — assembles DoubanData from extract modules
    account-gate.ts      — account-gated action guard and login prompt trigger
    login-frame-theme.ts — account-origin ATV CSS injection for Douban's login iframe
    interest-marking.ts  — deep module for hero interest actions, modal save/remove flow, and original Douban button proxying
    hero-callbacks.ts    — compatibility facade for hero action callbacks
    avatar-effect.ts     — comment avatar fetch/apply effect
    series-effect.ts     — late-loading series observer and nav insertion
    sticky-effect.ts     — sticky nav reveal + active-section tracking
  main.ts              — thin userscript entry. Imports CSS and starts runtime after DOMContentLoaded.
  content/             — content script entry (injected into Douban page)
```

### Rating resolution strategy

`resolveAll` in `orchestrate.ts` uses a **parallel-first** strategy:

1. If H1 has an English title (95%+ of cases) → IMDb + RT + MC fire simultaneously via `Promise.allSettled`. One failure never blocks the others.
2. If no H1 title but IMDb returns one → RT + MC retry with IMDb title as fallback.
3. Error isolation: `Promise.allSettled` wraps every source. A null result means "not available", never "crashed".

All resolvers accept `ResolutionContext` and none touch the DOM. The Preact ratings module is the only consumer of resolved rating data; `useExternalRatings` loads the async results and rating panel components render the state.

### Resolution seam tests (31 tests across 5 files)

| File | What it covers |
| --- | --- |
| `tests/resolve/context.test.ts` | movie/TV H1 parsing, no-English-title, null imdbId, empty H1 |
| `tests/resolve/imdb.test.ts` | 4 tests: delegating fetch, season passthrough, null/empty imdbId guard |
| `tests/resolve/rt.test.ts` | 5 tests: delegating fetch, param passthrough, null/empty title guard, fetch failure |
| `tests/resolve/mc.test.ts` | 5 tests: delegating fetch, param passthrough, null/empty title guard, fetch failure |
| `tests/resolve/orchestrate.test.ts` | parallel resolution, fallback path, error isolation, no-identifiers, no-H1-no-IMDb-title |

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
   - `SubjectPage` owns cross-surface UI state that must stay synchronized between cards and modals. Comment vote state is modeled in `comments/comment-vote-state.ts`; review useful/useless vote state is modeled in `reviews/review-vote-state.ts`.
   - Vote buttons support controlled and standalone modes. Inside `SubjectPage`, card and modal buttons must read/write the same owner state; standalone section tests can still rely on local button state.

2. **Avatar data pipeline split (2026-07-06)** — `src/api/avatar.ts` was the only module crossing the data-fetching/DOM-construction boundary. Split into two clean modules:
   - `api/avatar.ts` — pure data pipeline: `fetchAvatarUrls(links)` returns `Map<link, url>` with read-through cache, parallel fetch via `Promise.allSettled`, no DOM access
   - `components/avatar-dom.ts` — DOM mutation: `applyCommentAvatars(urlMap, comments)` sets `comment.avatar`, preloads images, applies `backgroundImage` with RAF retry
   - `runtime/avatar-effect.ts` orchestrates `await pipeline → apply to DOM`

3. **Subject page runtime module (2026-07-08)** — `src/main.ts` is a thin startup facade over `src/runtime/`:
   - External runtime seam is `mountSubjectPage(doc?)`: guard duplicate mounts, extract `DoubanData`, render Preact, insert DOM, and start post-render effects
   - Runtime effects are localized: avatars, late series data, sticky nav reveal, and active-section tracking each live behind a small internal module
   - External rating resolution now lives inside the Preact `ratings` module through `useExternalRatings`
   - Web API lifecycle matches the platform contracts: `MutationObserver` observes late series DOM and disconnects after insertion; `IntersectionObserver` owns active-section updates for the sticky nav

4. **Interest marking module (2026-07-08)** — `src/runtime/interest-marking.ts` owns the complete "想看 / 在看 / 看过" runtime flow:
   - External seam is `buildInterestMarkingCallbacks(subjectId, adapters?)`, returning the `HeroCallbacks` shape so the page UI does not learn modal/API details
   - The module localizes original Douban button proxy-clicking, modal save/remove callbacks, API result handling, and successful page reload
   - `src/runtime/hero-callbacks.ts` remains as a compatibility facade exporting `buildHeroCallbacks`
   - Tests inject adapters at the module seam instead of mocking global `location.reload()` or reaching through the modal implementation

5. **QA scenario runner module (2026-07-08)** — `tests/qa.ts` is a CLI facade over `tests/qa/runner.ts` and `tests/qa/scenario-runner.ts`:
   - External seam is `runQa(options?)`, which owns browser startup, reporter lifecycle, screenshot cleanup, scenario fan-out, browser shutdown, summary printing, and exit-code calculation
   - `runScenario(browser, scenario)` owns page navigation, userscript injection, ATV error collection, phased assertions, retry, deadline, and cleanup
   - Each attempt gets a fresh Playwright context and closes both page and context in `finally`, matching Playwright's isolation model and avoiding state carry-over from failed attempts
   - Screenshot capture remains part of the scenario assertion phases, not an optional post-process

6. **Account-gated actions (2026-07-08)** — Account writes share `src/runtime/account-gate.ts` and `src/modules/subject-page/login/`:
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
- **Style ownership boundary**: CSS is split under `src/styles/` by UI experience and imported only through `src/styles.css`. Do not import CSS from TSX modules, do not use CSS Modules for ATV selectors, and do not wrap ATV styles in cascade layers because unlayered Douban author CSS would outrank layered userscript styles.
- **Scrapers are async**: Each external source gets its own resolver/scraper module. Remote work happens at explicit seams, not inside extractors.
- **No config/layout coupling**: Every rating panel has its own state and display rules. No shared visibility model.
- **250-LOC ceiling**: All modules stay under 250 LOC to avoid AI-slop-style oversized files.
- **Bottom exports**: All exports are declared at the bottom of each file via a single `export { ... }` block. Never use `export const` or `export function` inline. This makes the module's public API immediately visible at a glance.
