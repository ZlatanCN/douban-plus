# Douban Plus

> Transform Douban movie/TV detail pages into Apple TV+ style — with Douban green as the accent color.

![Hero Screenshot](tests/screenshots/movie-shawshank-hero.png)

## Features

- Immersive hero banner with blurred background and gradient overlay
- Apple TV+ dark aesthetic (pure black #000, elegant typography)
- Douban green (#41be5d) accent color preserved
- Full TV show support (seasons, episodes, runtime)
- Star ratings with half-star support
- HD poster and still image upgrade
- Horizontal scrolling cast cards with circular avatars
- Original functionality preserved (all links, wishlist/check buttons work)
- Responsive design (mobile vertical layout)

## Installation

### ScriptCat / Tampermonkey

1. Install [ScriptCat](https://scriptcat.org/) or [Tampermonkey](https://www.tampermonkey.net/)
2. Create new script and paste the contents of [`dist/douban-plus.user.js`](dist/douban-plus.user.js)
3. Visit any Douban movie/TV detail page

> **Note for contributors**: If you cloned the repo, run `pnpm run build` first to generate `dist/douban-plus.user.js`.

## Development

### Local Setup

```bash
git clone https://github.com/zhujiayou/douban-plus.git
cd douban-plus
pnpm install
```

### Dev Server (HMR)

```bash
pnpm run dev
```

This starts a Vite dev server with hot module replacement. The userscript is auto-injected into the browser via `vite-plugin-monkey`. Any changes to `src/` files will hot-reload instantly.

> **⚠️ CSP Note**: The dev server injects the userscript via inline scripts, which violates Douban's Content Security Policy. Install the **"Disable-CSP"** browser extension for development.

### Production Build

```bash
pnpm run build
```

Builds to `dist/douban-plus.user.js` (~60KB, single-file userscript).

### Run Tests

```bash
pnpm test
```

Tests run Playwright against 4 Douban pages (3 movies + 1 TV show) with 114 assertions across visual, functional, and layout checks.

### Project Structure

```
douban-plus/
├── src/                       # TypeScript source modules (27 files)
│   ├── index.ts               # Entry point — bootstrap + metadata
│   ├── components/            # UI component builders (hero, cast, etc.)
│   ├── services/              # Data extraction from Douban DOM
│   ├── utils/                 # Utility helpers
│   └── types/                 # TypeScript type definitions
├── dist/
│   └── douban-plus.user.js    # Build output (single-file userscript)
├── tests/
│   ├── qa.mjs                 # Playwright QA harness (114 assertions)
│   └── screenshots/           # Visual regression screenshots
├── vite.config.ts             # Vite + vite-plugin-monkey config
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

### How It Works

1. Script injects custom CSS (Apple TV+ color scheme + layout) during module load
2. Extracts data from existing Douban DOM (no API calls)
3. Builds new UI structure (`#atv-douban-root`) and inserts at page top
4. Hides original Douban page (`#wrapper` CSS-hidden, DOM preserved)
5. Wishlist/check buttons proxy-click to original Douban buttons

> **Note**: CSS is injected during module load (before content guard checks), not deferred. This is intentional — with scoping under `#atv-douban-root`, there is no visible impact even if the guard rejects the page.

## FAQ

**Q: Why don't images load?**
A: Douban CDN has anti-hotlink protection. The script sets `referrerPolicy="no-referrer"` to bypass this. Use latest Chrome/Edge/Firefox.

**Q: Do wishlist/check buttons work?**
A: Yes. They proxy-click to original Douban buttons. If you're not logged in, Douban will redirect to login (this is normal).

**Q: Will this support Douban homepage or charts?**
A: No. This script only targets detail pages (`/subject/*`).

**Q: How do I contribute code?**
A: The source is in `src/` (TypeScript). Run `pnpm run dev` for HMR, `pnpm run build` to produce `dist/douban-plus.user.js`, and `pnpm test` to run the QA suite.

## License

[MIT](LICENSE)
