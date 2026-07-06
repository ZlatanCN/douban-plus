# douban-plus

Userscript (v0.21.8) that enhances Douban movie/subject pages with richer metadata, ratings (IMDb, Metacritic, Rotten Tomatoes), streaming availability, cast info, and tight layout.

## Architecture

GreaseMonkey-style userscript built with vanilla TypeScript. No framework. DOM is built via `src/build/` modules — pure functions returning `HTMLElement | null`. No virtual DOM, no state management.

### Module layout

```
src/
  build/             — DOM builders (one dir per section, no idempotent concern)
    app.ts             — entry: orchestrates all sections, attaches to DOM
    hero/              — hero section parts (bg, poster, meta, actions, summary)
    rating-panels/     — IMDb / Metacritic / Rotten Tomatoes rating panels (extracted 2026-07-06)
    sections/          — section header row builder
    streaming/         — where to watch
    comments/          — comments section
    cast/              — cast list
    photos/            — photo gallery
    recommendations/   — recommendation carousel
    details/           — detail fields
    sticky-nav/        — sticky nav bar
    series/            — series info
  components/          — reusable UI components
    dom-factory.ts       — el() DOM builder, renderStars()
    vote-btn.ts          — buildVoteBtn() with optimistic update + API rollback (extracted 2026-07-06)
    overlay.ts, modal.ts — overlay/modal primitives
    interest-modal*      — interest marking modal
    index.ts             — barrel
  scrapers/            — data scrapers (one per external source: IMDb, MC, RT, streaming)
  content/             — content script entry (injected into Douban page)
```

### Tiered extraction

The `build/` directory was extracted from a single `src/html/` file in two tiers:

1. **Wave 1-3 (MCs)** — Each rating panel was initially a separate file in `build/`. MC panel was redesigned (Tier 1-3: extraction, score bar + Chinese labels, metric calculation fixes). Dividers refactored from `build/streaming` into a shared helper.

2. **Subdirectory (2026-07-06)** — `build/rating-panels/` extracted from flat `build/` files:
   - `imdb.ts`, `mc.ts`, `rt.ts`, `panel.ts` + barrel `index.ts`
   - Previously lived as `imdb-rating.ts`, `mc-rating.ts`, `rt-rating.ts` in `build/`, and `hero-rating-panel.ts` in `build/hero/`
   - `panel.ts` orchestrates rendering of all three rating panels into the hero area

3. **Vote button (2026-07-06)** — `buildVoteBtn()` extracted from duplicated code in `src/build/comments.ts` into `src/components/vote-btn.ts`. The vote button logic (optimistic update + API rollback + animation) was identical in `openCommentOverlay` and the comment card loop. Extracted with 9 unit tests covering happy path, guards, API failure rollback, and server count override. Returns `VoteButtonElement` (HTMLButtonElement + `setVoteState` method) so external code can sync state across instances.

### Bug fixes

- **Vote state sync: card ↔ overlay (2026-07-06)** — Two `buildVoteBtn` instances (one in the comment card, one in the overlay) each have independent closure state (`let voted`). Voting in the overlay updates its own closure and the shared `Comment` object, but the card's closure never re-reads it. Fixed by: (a) adding `setVoteState` to `VoteButtonElement` so external code can push state into a button's closure, (b) maintaining a `Map<cid, VoteButtonElement>` in `buildComments`, (c) calling `cardBtn.setVoteState(true, result.count)` from the overlay's `onVote` after a successful vote. Regression test: t23 in `tests/build/comments.test.ts`.

### Key design decisions

- **Pure DOM builders**: Functions accept data, return `HTMLElement | null`. No side effects, no async.
- **Scrapers are async**: Each external source gets its own scraper module. Scraping happens before build.
- **No config/layout coupling**: Every rating panel has its own state toggle. No shared visibility model.
- **250-LOC ceiling**: All modules stay under 250 LOC to avoid AI-slop-style oversized files.
