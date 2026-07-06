# douban-plus

Userscript (v0.21.8) that enhances Douban movie/subject pages with richer metadata, ratings (IMDb, Metacritic, Rotten Tomatoes), streaming availability, cast info, and tight layout.

## Architecture

GreaseMonkey-style userscript built with vanilla TypeScript. No framework. DOM is built via `src/build/` modules — pure functions returning `HTMLElement | null`. No virtual DOM, no state management.

Rating data flows through a three-layer seam: **extract → resolve → apply**. The `resolve/` layer is the testable middle — it takes a `ResolutionContext`, runs HTTP fetches in parallel, and returns typed results without touching the DOM.

### Module layout

```
src/
  build/             — DOM builders (one dir per section, no idempotent concern)
    app.ts             — entry: orchestrates all sections, attaches to DOM
    hero/              — hero section parts (bg, poster, meta, actions, summary)
    rating-panels/     — IMDb / Metacritic / Rotten Tomatoes rating panels (extracted 2026-07-06)
    streaming/         — where to watch
    comments/          — comments section
    cast/              — cast list
    photos/            — photo gallery
    recommendations/   — recommendation carousel
    details/           — detail fields
    sticky-nav/        — sticky nav bar
    series/            — series info
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
    apply.ts            — applyImdbResult/applyRtResult/applyMcResult: apply results to DOM
  components/          — reusable UI components
    dom-factory.ts       — el() DOM builder, renderStars()
    sections.ts          — section/header-row builders (moved from build/ 2026-07-06)
    avatar-dom.ts        — applyCommentAvatars(): DOM mutation for comment avatars (split from api/avatar 2026-07-06)
    vote-btn.ts          — buildVoteBtn() with optimistic update + API rollback (extracted 2026-07-06)
    overlay.ts, modal.ts — overlay/modal primitives
    interest-modal*      — interest marking modal
    index.ts             — barrel
  api/                 — data fetching & scraping interfaces
    avatar.ts            — fetchAvatarUrls(): pure data pipeline, fetch + parse + cache, no DOM (cleaned 2026-07-06)
    comment.ts           — postVote() for comment voting via GM POST
    interest.ts          — postInterest/removeInterest for interest marking
    imdb.ts              — fetchImdbRating() via IMDB GraphQL API
    metacritic.ts        — fetchMcRating() via Metacritic scraping
    rotten.ts            — fetchRtRating() via Rotten Tomatoes scraping
  scrapers/            — data scrapers (one per external source: IMDb, MC, RT, streaming)
  main.ts              — entry point. ~260 lines. Orchestrates extract → build → fetch avatars → resolve ratings.
  content/             — content script entry (injected into Douban page)
```

### Rating resolution strategy

`resolveAll` in `orchestrate.ts` uses a **parallel-first** strategy:

1. If H1 has an English title (95%+ of cases) → IMDb + RT + MC fire simultaneously via `Promise.allSettled`. One failure never blocks the others.
2. If no H1 title but IMDb returns one → RT + MC retry with IMDb title as fallback.
3. Error isolation: `Promise.allSettled` wraps every source. A null result means "not available", never "crashed".

All resolvers accept `ResolutionContext` and none touch the DOM. The `apply.ts` module is the single bridge from results to DOM — each applier finds its panel, calls the build function, and replaces the skeleton.

### Resolution seam tests (28 tests across 5 files)

| File | What it covers |
| --- | --- |
| `tests/resolve/context.test.ts` | 7 tests: movie/TV H1 parsing, no-English-title, null imdbId, empty H1 |
| `tests/resolve/imdb.test.ts` | 4 tests: delegating fetch, season passthrough, null/empty imdbId guard |
| `tests/resolve/rt.test.ts` | 5 tests: delegating fetch, param passthrough, null/empty title guard, fetch failure |
| `tests/resolve/mc.test.ts` | 5 tests: delegating fetch, param passthrough, null/empty title guard, fetch failure |
| `tests/resolve/orchestrate.test.ts` | 7 tests: all-three-parallel, fallback path, error isolation, no-identifiers, no-H1-no-IMDb-title |

### Tiered extraction

The `build/` directory was extracted from a single `src/html/` file in two tiers:

1. **Wave 1-3 (MCs)** — Each rating panel was initially a separate file in `build/`. MC panel was redesigned (Tier 1-3: extraction, score bar + Chinese labels, metric calculation fixes). Dividers refactored from `build/streaming` into a shared helper.

2. **Subdirectory (2026-07-06)** — `build/rating-panels/` extracted from flat `build/` files:
   - `imdb.ts`, `mc.ts`, `rt.ts`, `panel.ts` + barrel `index.ts`
   - Previously lived as `imdb-rating.ts`, `mc-rating.ts`, `rt-rating.ts` in `build/`, and `hero-rating-panel.ts` in `build/hero/`
   - `panel.ts` orchestrates rendering of all three rating panels into the hero area

3. **Vote button (2026-07-06)** — `buildVoteBtn()` extracted from duplicated code in `src/build/comments.ts` into `src/components/vote-btn.ts`. The vote button logic (optimistic update + API rollback + animation) was identical in `openCommentOverlay` and the comment card loop. Extracted with 9 unit tests covering happy path, guards, API failure rollback, and server count override. Returns `VoteButtonElement` (HTMLButtonElement + `setVoteState` method) so external code can sync state across instances.

4. **Avatar data pipeline split (2026-07-06)** — `src/api/avatar.ts` was the only module crossing the data-fetching/DOM-construction boundary. Split into two clean modules:
   - `api/avatar.ts` — pure data pipeline: `fetchAvatarUrls(links)` returns `Map<link, url>` with read-through cache, parallel fetch via `Promise.allSettled`, no DOM access
   - `components/avatar-dom.ts` — DOM mutation: `applyCommentAvatars(urlMap, comments)` sets `comment.avatar`, preloads images, applies `backgroundImage` with RAF retry
   - `main.ts` orchestrates with `void (async () => { const urls = await fetchAvatarUrls(links); applyCommentAvatars(urls, comments); })()`
   - 14 tests total (6 data pipeline + 8 DOM), up from 3

### Bug fixes

- **Vote state sync: card ↔ overlay (2026-07-06)** — Two `buildVoteBtn` instances (one in the comment card, one in the overlay) each have independent closure state (`let voted`). Voting in the overlay updates its own closure and the shared `Comment` object, but the card's closure never re-reads it. Fixed by: (a) adding `setVoteState` to `VoteButtonElement` so external code can push state into a button's closure, (b) maintaining a `Map<cid, VoteButtonElement>` in `buildComments`, (c) calling `cardBtn.setVoteState(true, result.count)` from the overlay's `onVote` after a successful vote. Regression test: t23 in `tests/build/comments.test.ts`.

### Data pipeline integrity — avatar split

`src/api/avatar.ts` was the only module crossing the data/DOM boundary. Split on 2026-07-06:

| Layer | File | Export | Responsibility | DOM-free? |
| --- | --- | --- | --- | --- |
| Data pipeline | `api/avatar.ts` | `fetchAvatarUrls(links)` | Cache read-through → fetch → parse → cache → return Map | ✅ |
| DOM mutation | `components/avatar-dom.ts` | `applyCommentAvatars(urlMap, comments)` | Preload images, RAF-retry querySelector, set backgroundImage | ❌ (DOM-only) |
| Orchestration | `main.ts:219` | inline | `await pipeline → apply to DOM` | — |

6 data tests (no DOM needed) + 8 DOM tests (happy-dom) = 14 total, replacing 3 cache-only tests.

### Key design decisions

- **Pure DOM builders**: Functions accept data, return `HTMLElement | null`. No side effects, no async.
- **Scrapers are async**: Each external source gets its own scraper module. Scraping happens before build.
- **No config/layout coupling**: Every rating panel has its own state toggle. No shared visibility model.
- **250-LOC ceiling**: All modules stay under 250 LOC to avoid AI-slop-style oversized files.
- **Bottom exports**: All exports are declared at the bottom of each file via a single `export { ... }` block. Never use `export const` or `export function` inline. This makes the module's public API immediately visible at a glance.
