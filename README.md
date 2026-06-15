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

### ScriptCat

1. Install [ScriptCat](https://scriptcat.org/)
2. Create new script and paste the contents of `douban-plus.user.js`
3. Visit any Douban movie/TV detail page

### Tampermonkey

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Create new script and paste the contents of `douban-plus.user.js`
3. Visit any Douban movie/TV detail page

## Development

### Local Setup

```bash
git clone https://github.com/zhujiayou/douban-plus.git
cd douban-plus
npm install
```

### Run Tests

```bash
npm test
```

Tests run Playwright against 4 Douban pages (3 movies + 1 TV show) with 81 assertions.

### Project Structure

```
douban-plus/
├── douban-plus.user.js    # Main userscript (~55KB, self-contained)
├── tests/
│   ├── qa.mjs             # QA harness (81 assertions)
│   └── screenshots/       # Visual regression screenshots
├── package.json
├── LICENSE
└── README.md
```

### How It Works

1. Script injects custom CSS (Apple TV+ color scheme + layout)
2. Extracts data from existing Douban DOM (no API calls)
3. Builds new UI structure (`#atv-douban-root`) and inserts at page top
4. Hides original Douban page (`#wrapper` CSS-hidden, DOM preserved)
5. Wishlist/check buttons proxy-click to original Douban buttons

## FAQ

**Q: Why don't images load?**
A: Douban CDN has anti-hotlink protection. The script sets `referrerPolicy="no-referrer"` to bypass this. Use latest Chrome/Edge/Firefox.

**Q: Do wishlist/check buttons work?**
A: Yes. They proxy-click to original Douban buttons. If you're not logged in, Douban will redirect to login (this is normal).

**Q: Will this support Douban homepage or charts?**
A: No. This script only targets detail pages (`/subject/*`).

## License

[MIT](LICENSE)
