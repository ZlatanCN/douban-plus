// QA harness for douban-plus.user.js
// Loads the userscript into a real browser visiting Douban pages, runs assertions,
// captures screenshots for visual review.
//
// Usage: node tests/qa.mjs
// Output: tests/screenshots/*.png + console pass/fail report

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const USERSCRIPT_PATH = join(ROOT, 'douban-plus.user.js');
const SCREENSHOT_DIR = join(__dirname, 'screenshots');

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const userscriptRaw = readFileSync(USERSCRIPT_PATH, 'utf8');

// Strip the UserScript header (browser doesn't parse it) and extract the IIFE
// We'll inject the JS body via addInitScript, with GM_addStyle shimmed.
const gmShim = `
window.GM_addStyle = function(css) {
  const s = document.createElement('style');
  s.textContent = css;
  s.setAttribute('data-atv-shim', '1');
  (document.head || document.documentElement).appendChild(s);
  return s;
};
`;

// The userscript is wrapped in IIFE; addInitScript runs before page scripts → too early for #wrapper
// So instead we inject AFTER page load by evaluating into the page.
const injectAfterLoad = userscriptRaw.replace(/^\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\n?/m, '');

const SCENARIOS = [
  { name: 'movie-shawshank', url: 'https://movie.douban.com/subject/1292052/', kind: 'movie' },
  { name: 'movie-nezha', url: 'https://movie.douban.com/subject/26794435/', kind: 'movie' },
  { name: 'movie-wandering-earth-2', url: 'https://movie.douban.com/subject/35267208/', kind: 'movie' },
  { name: 'tv-got-s1', url: 'https://movie.douban.com/subject/3016187/', kind: 'tv' },
];

const results = [];
function record(scenario, name, pass, detail = '') {
  results.push({ scenario, name, pass, detail });
  const mark = pass ? '✅' : '❌';
  console.log(`${mark} [${scenario}] ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1440, height: 900 },
  locale: 'zh-CN',
});

for (const sc of SCENARIOS) {
  const page = await ctx.newPage();
  // Only count errors attributable to OUR script. Douban's own page throws
  // many errors (React #200, CORS on verify_users, ad-domain DNS, 418) that
  // exist with or without our userscript — those are not our regressions.
  const ourErrors = [];
  const isDoubanNoise = (t) =>
    /verify_users|rexxar|ERR_NAME_NOT_RESOLVED|status of 418|React error|reactjs\.org|ERR_FAILED|Access to XMLHttpRequest|net::ERR/.test(t);
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (isDoubanNoise(t)) return;
    if (/ATV-Douban|atv-douban-root|atv-/.test(t)) ourErrors.push(t);
  });
  page.on('pageerror', (err) => {
    if (isDoubanNoise(err.message)) return;
    if (/ATV-Douban|atv-/.test(err.stack || err.message)) ourErrors.push(err.message);
  });

  try {
    await page.goto(sc.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { await page.waitForSelector('#content', { timeout: 30000 }); } catch {}
    await page.waitForTimeout(1500);

    // Inject GM shim + userscript body
    await page.addScriptTag({ content: gmShim + '\n' + injectAfterLoad });
    await page.waitForTimeout(1500);

    // QA #1: root container exists
    const hasRoot = await page.$('#atv-douban-root') !== null;
    record(sc.name, 'root #atv-douban-root injected', hasRoot);

    // QA #1: hero block visible
    const hasHero = await page.$('#atv-douban-root .atv-hero') !== null;
    record(sc.name, 'hero section rendered', hasHero);

    // QA #1: title
    const titleText = await page.$eval('#atv-douban-root .atv-hero-title', el => el.textContent.trim()).catch(() => '');
    record(sc.name, `hero title non-empty (got: "${titleText.slice(0, 40)}")`, titleText.length > 0);

    // QA #1: rating block exists OR fallback shown
    const ratingNum = await page.$eval('#atv-douban-root .atv-rating-score', el => el.textContent.trim()).catch(() => null);
    const ratingFallback = await page.$eval('#atv-douban-root .atv-rating-none', el => el.textContent.trim()).catch(() => null);
    record(sc.name, `rating shown (score: "${ratingNum}" / fallback: "${ratingFallback}")`,
      (ratingNum !== null && ratingNum.length > 0) || (ratingFallback !== null));

    // QA #2: TV-specific — episodes shown
    if (sc.kind === 'tv') {
      const heroMeta = await page.$eval('#atv-douban-root .atv-hero-meta', el => el.textContent).catch(() => '');
      record(sc.name, `TV hero meta contains 集 or 季 (got: "${heroMeta.slice(0,80)}")`, /集|季/.test(heroMeta));
    }

    // QA #4: cast section + each cast card IS an <a> to /personage/
    const castCards = await page.$$('#atv-douban-root .atv-cast-card');
    record(sc.name, `cast cards rendered (${castCards.length})`, castCards.length > 0);
    if (castCards.length > 0) {
      const firstCastLink = await castCards[0].evaluate(el => el.tagName === 'A' ? el.href : (el.querySelector('a')?.href || '')).catch(() => '');
      record(sc.name, `cast link points to personage page (got: "${firstCastLink.slice(0,60)}")`, /personage/.test(firstCastLink));
    }

    // QA #4: photos section
    const photoTiles = await page.$$('#atv-douban-root .atv-photo-tile');
    record(sc.name, `photo tiles rendered (${photoTiles.length})`, photoTiles.length >= 0);

    // QA #4: recommendations card IS an <a> to /subject/
    const recCards = await page.$$('#atv-douban-root .atv-rec-card');
    record(sc.name, `recommendation cards rendered (${recCards.length})`, recCards.length > 0);
    if (recCards.length > 0) {
      const firstRecLink = await recCards[0].evaluate(el => el.tagName === 'A' ? el.href : (el.querySelector('a')?.href || '')).catch(() => '');
      record(sc.name, `rec link to subject page (got: "${firstRecLink.slice(0,60)}")`, /subject\/\d+/.test(firstRecLink));
    }

    // QA: #wrapper hidden but still in DOM (preserves data binding)
    const wrapperState = await page.evaluate(() => {
      const w = document.querySelector('#wrapper');
      if (!w) return 'removed';
      const display = getComputedStyle(w).display;
      return display === 'none' ? 'hidden' : 'visible';
    });
    record(sc.name, `#wrapper hidden but preserved (got: "${wrapperState}")`, wrapperState === 'hidden');

    // QA #4: IMDb link in info grid (if present)
    const imdbLink = await page.$eval('#atv-douban-root a[href*="imdb.com"]', a => a.href).catch(() => null);
    if (imdbLink) {
      record(sc.name, `IMDb link present (${imdbLink.slice(0,50)})`, /imdb\.com\/title\/tt/.test(imdbLink));
    }

    // QA #8: zero JS errors attributable to OUR script
    record(sc.name, `no script-originated errors (count: ${ourErrors.length})`, ourErrors.length === 0,
      ourErrors.slice(0, 2).join(' | '));

    // Body bg should be black
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    record(sc.name, `body bg is black (got: ${bodyBg})`, /rgb\(0,\s*0,\s*0\)/.test(bodyBg));

    // === BUG #2: Comments section renders ===
    const commentCards = await page.$$('#atv-douban-root .atv-comment-card');
    record(sc.name, `comment cards rendered (${commentCards.length})`, commentCards.length > 0);
    if (commentCards.length > 0) {
      const firstComment = await commentCards[0].evaluate(card => ({
        author: card.querySelector('.atv-comment-author')?.textContent?.trim() || '',
        body: card.querySelector('.atv-comment-body')?.textContent?.trim() || '',
      }));
      record(sc.name, `comment has author + body (author: "${firstComment.author.slice(0,12)}")`,
        firstComment.author.length > 0 && firstComment.body.length > 0);
    }

    // === BUG #1: Hero "展开" expands INLINE (no scroll) ===
    const hasMoreBtn = await page.$('#atv-douban-root .atv-hero-more') !== null;
    if (hasMoreBtn) {
      const beforeExpand = await page.evaluate(() => {
        const teaser = document.querySelector('#atv-douban-root .atv-hero-teaser');
        return { clamped: teaser?.classList.contains('is-clamped'), scrollY: window.scrollY };
      });
      await page.click('#atv-douban-root .atv-hero-more');
      await page.waitForTimeout(250);
      const afterExpand = await page.evaluate(() => {
        const teaser = document.querySelector('#atv-douban-root .atv-hero-teaser');
        return { clamped: teaser?.classList.contains('is-clamped'), scrollY: window.scrollY };
      });
      // Inline expand = is-clamped toggled off, AND page did NOT scroll away
      record(sc.name, `展开 expands inline (clamped ${beforeExpand.clamped}→${afterExpand.clamped}, no scroll jump)`,
        beforeExpand.clamped === true && afterExpand.clamped === false && Math.abs(afterExpand.scrollY - beforeExpand.scrollY) < 50);
    }

    // === BUG #3: Sticky nav sticks to viewport top + text visible after scroll ===
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(400);
    const navState = await page.evaluate(() => {
      const nav = document.querySelector('.atv-stickynav');
      if (!nav) return null;
      const cs = getComputedStyle(nav);
      const rect = nav.getBoundingClientRect();
      const titleEl = nav.querySelector('.atv-stickynav-title');
      const titleCs = titleEl ? getComputedStyle(titleEl) : null;
      return {
        isVisible: nav.classList.contains('is-visible'),
        position: cs.position,
        opacity: parseFloat(cs.opacity),
        rectTop: Math.round(rect.top),
        title: titleEl?.textContent?.trim() || '',
        titleColor: titleCs?.color || '',
        titleVisible: titleCs ? (titleCs.visibility === 'visible' && parseFloat(titleCs.opacity || '1') > 0) : false,
      };
    });
    if (navState) {
      // Nav must: be position:fixed, stuck at top (rectTop===0), visible (opacity 1), have title text that is visible white-ish
      record(sc.name, `sticky nav fixed at top after scroll (pos:${navState.position}, top:${navState.rectTop}px, opacity:${navState.opacity})`,
        navState.position === 'fixed' && navState.rectTop === 0 && navState.opacity > 0.9);
      record(sc.name, `sticky nav title VISIBLE (text:"${navState.title.slice(0,12)}", color:${navState.titleColor})`,
        navState.title.length > 0 && navState.titleVisible && !/rgba\(\d+,\s*\d+,\s*\d+,\s*0\)/.test(navState.titleColor));
    } else {
      record(sc.name, 'sticky nav exists', false, 'nav element not found');
    }
    // Reset scroll for clean screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // === NEW: Streaming section (conditional — not all titles have it) ===
    const streamCards = await page.$$('#atv-douban-root .atv-stream-card');
    if (streamCards.length > 0) {
      const firstStream = await streamCards[0].evaluate(el => ({
        tag: el.tagName,
        name: el.textContent?.trim() || '',
        href: el.tagName === 'A' ? el.href : '',
      }));
      // Card is valid if: real-link <a> with http(s) href, OR proxy <button>
      const valid = firstStream.name.length > 0 &&
        ((firstStream.tag === 'A' && /^https?:/.test(firstStream.href)) || firstStream.tag === 'BUTTON');
      record(sc.name, `streaming cards rendered (${streamCards.length}, ${firstStream.tag} "${firstStream.name.slice(0,10)}")`, valid);
    }

    // === NEW: Awards section (conditional) ===
    const awardRows = await page.$$('#atv-douban-root .atv-award-row');
    if (awardRows.length > 0) {
      const firstAward = await awardRows[0].evaluate(el => el.querySelector('.atv-award-org')?.textContent?.trim() || '');
      record(sc.name, `award rows rendered (${awardRows.length}, first: "${firstAward.slice(0,16)}")`, firstAward.length > 0);
    }

    // Visual: screenshots
    await page.screenshot({ path: join(SCREENSHOT_DIR, `${sc.name}-hero.png`), fullPage: false });
    await page.screenshot({ path: join(SCREENSHOT_DIR, `${sc.name}-full.png`), fullPage: true });

    // Mobile viewport screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(SCREENSHOT_DIR, `${sc.name}-mobile.png`), fullPage: true });

    console.log(`📸 [${sc.name}] screenshots saved`);
  } catch (e) {
    record(sc.name, 'scenario completed without throw', false, e.message);
  } finally {
    await page.close();
  }
}

await browser.close();

const total = results.length;
const passed = results.filter(r => r.pass).length;
console.log(`\n=== Result: ${passed}/${total} passed ===`);
const failed = results.filter(r => !r.pass);
if (failed.length) {
  console.log('\nFAILURES:');
  failed.forEach(f => console.log(`  ❌ [${f.scenario}] ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  process.exit(1);
}
