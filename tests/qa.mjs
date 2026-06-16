// QA harness for douban-plus.user.js
// Loads the userscript into a real browser visiting Douban pages, runs assertions,
// captures screenshots for visual review.
//
// Usage: node tests/qa.mjs
// Output: tests/screenshots/*.png + console pass/fail report

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const DOUBAN_NOISE_REGEX =
  /verify_users|rexxar|ERR_NAME_NOT_RESOLVED|status of 418|React error|reactjs\.org|ERR_FAILED|Access to XMLHttpRequest|net::ERR/;
const ATV_NOISE_REGEX = /ATV-Douban|atv-douban-root|atv-/;
const ATV_STACK_REGEX = /ATV-Douban|atv-/;

const TIMEOUT_PAGE_LOAD = 60_000;
const TIMEOUT_CONTENT_READY = 30_000;

const COLOR_BLACK_RGB = "rgb(0, 0, 0)";
const COLOR_GOLD_RGB = "rgb(255, 184, 0)";
const SCROLL_TEST_POSITION = 700;
const STICKY_NAV_MIN_OPACITY = 0.8;
const EXTERNAL_URL_REGEX = /^https:\/\//;
const TV_EPISODE_REGEX = /[集季]/;
const PERSONAGE_LINK_REGEX = /personage/;
const SUBJECT_LINK_REGEX = /subject\/\d+/;
const IMDB_LINK_REGEX = /imdb\.com\/title\/tt/;
const STICKY_NAV_HIDDEN_REGEX = /rgba\(\d+,\s*\d+,\s*\d+,\s*0\)/;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const USERSCRIPT_PATH = join(ROOT, "douban-plus.user.js");
const SCREENSHOT_DIR = join(__dirname, "screenshots");

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const userscriptRaw = readFileSync(USERSCRIPT_PATH, "utf8");

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
const injectAfterLoad = userscriptRaw.replace(
  /^\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\n?/m,
  ""
);

const SCENARIOS = [
  {
    name: "movie-shawshank",
    url: "https://movie.douban.com/subject/1292052/",
    kind: "movie",
  },
  {
    name: "movie-nezha",
    url: "https://movie.douban.com/subject/26794435/",
    kind: "movie",
  },
  {
    name: "movie-wandering-earth-2",
    url: "https://movie.douban.com/subject/35267208/",
    kind: "movie",
  },
  {
    name: "tv-got-s1",
    url: "https://movie.douban.com/subject/3016187/",
    kind: "tv",
  },
];

const results = [];

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
};

function log(pass, label, detail) {
  const mark = pass ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  const detailStr = detail ? ` ${C.dim}${detail}${C.reset}` : "";
  console.log(`  ${mark}  ${label}${detailStr}`);
}

function record(scenario, name, pass, detail = "") {
  results.push({ scenario, name, pass, detail });
  log(pass, name, detail);
}

function printSummary() {
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  const ratio = `${passed}/${total}`;

  console.log("");
  console.log(`${C.bold}${"─".repeat(60)}${C.reset}`);

  if (failed.length === 0) {
    console.log(
      `  ${C.bgGreen}${C.bold} ALL ${ratio} PASSED ${C.reset}  ${C.dim}douban-plus QA${C.reset}`
    );
  } else {
    console.log(
      `  ${C.bgRed}${C.bold} ${ratio} FAILED ${C.reset}  ${C.dim}douban-plus QA${C.reset}`
    );
    console.log("");
    console.log(`${C.red}${C.bold}  FAILURES:${C.reset}`);
    console.log("");
    for (const f of failed) {
      console.log(
        `  ${C.red}×${C.reset} ${C.cyan}[${f.scenario}]${C.reset} ${f.name}`
      );
      if (f.detail) {
        console.log(`    ${C.dim}${f.detail}${C.reset}`);
      }
    }
  }

  console.log(`${C.bold}${"─".repeat(60)}${C.reset}`);
  console.log("");
}

const MAX_RETRIES = 2;
const SCENARIO_DEADLINE_MS = 60_000;

const browser = await chromium.launch({ headless: true });
try {
  for (const sc of SCENARIOS) {
    await runScenario(sc);
  }
} finally {
  await browser.close();
}

async function runScenario(sc) {
  console.log("");
  console.log(
    `${C.bold}${C.cyan}▸ ${sc.name}${C.reset}  ${C.dim}${sc.url}${C.reset}`
  );
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const page = await ctx.newPage();
    const ourErrors = [];
    const isDoubanNoise = (t) => DOUBAN_NOISE_REGEX.test(t);
    page.on("console", (msg) => {
      if (msg.type() !== "error") {
        return;
      }
      const t = msg.text();
      if (isDoubanNoise(t)) {
        return;
      }
      if (ATV_NOISE_REGEX.test(t)) {
        ourErrors.push(t);
      }
    });
    page.on("pageerror", (err) => {
      if (isDoubanNoise(err.message)) {
        return;
      }
      if (ATV_STACK_REGEX.test(err.stack || err.message)) {
        ourErrors.push(err.message);
      }
    });

    try {
      await Promise.race([
        executeBody(page, sc, ourErrors),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`deadline exceeded (${SCENARIO_DEADLINE_MS / 1000}s)`)
              ),
            SCENARIO_DEADLINE_MS
          )
        ),
      ]);
      return;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        console.log(
          `  ${C.yellow}RETRY${C.reset} ${sc.name} (${attempt}/${MAX_RETRIES}): ${e.message.slice(0, 120)}`
        );
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      record(sc.name, "scenario completed without throw", false, e.message);
    } finally {
      await page.close().catch(() => null);
    }
  }
  await ctx.close();
}

async function executeBody(page, sc, ourErrors) {
  await page.goto(sc.url, {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUT_PAGE_LOAD,
  });
  try {
    await page.waitForSelector("#content", {
      timeout: TIMEOUT_CONTENT_READY,
    });
  } catch {
    console.log(`  ${C.yellow}WARN${C.reset} ${sc.name} page load timeout`);
  }

  // Inject GM shim + userscript body
  await page.addScriptTag({ content: `${gmShim}\n${injectAfterLoad}` });
  // Deterministic: root container exists = userscript executed
  await page.waitForSelector("#atv-douban-root", {
    timeout: TIMEOUT_CONTENT_READY,
  });

  // QA #1: root container exists
  const hasRoot = (await page.$("#atv-douban-root")) !== null;
  record(sc.name, "root #atv-douban-root injected", hasRoot);

  // QA #1: hero block visible
  const hasHero = (await page.$("#atv-douban-root .atv-hero")) !== null;
  record(sc.name, "hero section rendered", hasHero);

  // S3: Hero background image loaded (CDN) — wait for load with 10s timeout
  const heroStill = await page
    .waitForSelector("#atv-douban-root .atv-hero-still.is-loaded", {
      timeout: 10_000,
    })
    .catch(() => null);
  record(sc.name, "hero bg image loaded", heroStill !== null);

  // QA #1: title
  const titleText = await page
    .$eval("#atv-douban-root .atv-hero-title", (el) => el.textContent.trim())
    .catch(() => "");
  record(
    sc.name,
    `hero title non-empty (got: "${titleText.slice(0, 40)}")`,
    titleText.length > 0
  );

  // QA #1: rating block exists OR fallback shown
  const ratingNum = await page
    .$eval("#atv-douban-root .atv-rating-score", (el) => el.textContent.trim())
    .catch(() => null);
  const ratingFallback = await page
    .$eval("#atv-douban-root .atv-rating-none", (el) => el.textContent.trim())
    .catch(() => null);
  record(
    sc.name,
    `rating shown (score: "${ratingNum}" / fallback: "${ratingFallback}")`,
    (ratingNum !== null && ratingNum.length > 0) || ratingFallback !== null
  );

  // QA #2: TV-specific — episodes shown
  if (sc.kind === "tv") {
    const heroMeta = await page
      .$eval("#atv-douban-root .atv-hero-meta", (el) => el.textContent)
      .catch(() => "");
    record(
      sc.name,
      `TV hero meta contains 集 or 季 (got: "${heroMeta.slice(0, 80)}")`,
      TV_EPISODE_REGEX.test(heroMeta)
    );
  }

  // QA #4: cast section + each cast card IS an <a> to /personage/
  const castCards = await page.$$("#atv-douban-root .atv-cast-card");
  record(
    sc.name,
    `cast cards rendered (${castCards.length})`,
    castCards.length > 0
  );
  if (castCards.length > 0) {
    const firstCastLink = await castCards[0]
      .evaluate((el) =>
        el.tagName === "A" ? el.href : el.querySelector("a")?.href || ""
      )
      .catch(() => "");
    record(
      sc.name,
      `cast link points to personage page (got: "${firstCastLink.slice(0, 60)}")`,
      PERSONAGE_LINK_REGEX.test(firstCastLink)
    );
  }

  // QA #4: photos section
  const photoTiles = await page.$$("#atv-douban-root .atv-photo-tile");
  record(
    sc.name,
    `photo tiles rendered (${photoTiles.length})`,
    photoTiles.length > 0
  );

  // QA #4: recommendations card IS an <a> to /subject/
  const recCards = await page.$$("#atv-douban-root .atv-rec-card");
  record(
    sc.name,
    `recommendation cards rendered (${recCards.length})`,
    recCards.length > 0
  );
  if (recCards.length > 0) {
    const firstRecLink = await recCards[0]
      .evaluate((el) =>
        el.tagName === "A" ? el.href : el.querySelector("a")?.href || ""
      )
      .catch(() => "");
    record(
      sc.name,
      `rec link to subject page (got: "${firstRecLink.slice(0, 60)}")`,
      SUBJECT_LINK_REGEX.test(firstRecLink)
    );
  }

  // QA: #wrapper hidden but still in DOM (preserves data binding)
  const wrapperState = await page.evaluate(() => {
    const w = document.querySelector("#wrapper");
    if (!w) {
      return "removed";
    }
    const display = getComputedStyle(w).display;
    return display === "none" ? "hidden" : "visible";
  });
  record(
    sc.name,
    `#wrapper hidden but preserved (got: "${wrapperState}")`,
    wrapperState === "hidden"
  );

  // QA #4: IMDb link in info grid (if present)
  const imdbLink = await page
    .$eval('#atv-douban-root a[href*="imdb.com"]', (a) => a.href)
    .catch(() => null);
  if (imdbLink) {
    record(
      sc.name,
      `IMDb link present (${imdbLink.slice(0, 50)})`,
      IMDB_LINK_REGEX.test(imdbLink)
    );
  }

  // QA #8: zero JS errors attributable to OUR script
  record(
    sc.name,
    `no script-originated errors (count: ${ourErrors.length})`,
    ourErrors.length === 0,
    ourErrors.slice(0, 2).join(" | ")
  );

  // Body bg should be black
  const bodyBg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  record(
    sc.name,
    `body bg is black (got: ${bodyBg})`,
    new RegExp(COLOR_BLACK_RGB.replace(/[()]/g, "\\$&")).test(bodyBg)
  );

  // === BUG #2: Comments section renders ===
  const commentCards = await page.$$("#atv-douban-root .atv-comment-card");
  record(
    sc.name,
    `comment cards rendered (${commentCards.length})`,
    commentCards.length > 0
  );
  if (commentCards.length > 0) {
    const firstComment = await commentCards[0].evaluate((card) => ({
      author:
        card.querySelector(".atv-comment-author")?.textContent?.trim() || "",
      body: card.querySelector(".atv-comment-body")?.textContent?.trim() || "",
    }));
    record(
      sc.name,
      `comment has author + body (author: "${firstComment.author.slice(0, 12)}")`,
      firstComment.author.length > 0 && firstComment.body.length > 0
    );
  }

  // S7: Summary teaser non-empty (conditional — present on all detail pages)
  const teaserText = await page
    .$eval(
      "#atv-douban-root .atv-hero-teaser",
      (el) => el.textContent?.trim() || ""
    )
    .catch(() => "");
  record(
    sc.name,
    `summary teaser non-empty (len:${teaserText.length})`,
    teaserText.length > 0
  );

  // === BUG #1: Hero "展开" expands INLINE (no scroll) ===
  const hasMoreBtn = (await page.$("#atv-douban-root .atv-hero-more")) !== null;
  if (hasMoreBtn) {
    const beforeExpand = await page.evaluate(() => {
      const teaser = document.querySelector(
        "#atv-douban-root .atv-hero-teaser"
      );
      return {
        clamped: teaser?.classList.contains("is-clamped"),
        scrollY: window.scrollY,
      };
    });
    await page.click("#atv-douban-root .atv-hero-more");
    // Deterministic: wait for CSS class toggle (clamped→unclamped) + transition complete
    await page.waitForFunction(
      () =>
        document
          .querySelector("#atv-douban-root .atv-hero-teaser")
          ?.classList.contains("is-clamped") === false,
      { timeout: TIMEOUT_CONTENT_READY }
    );
    const afterExpand = await page.evaluate(() => {
      const teaser = document.querySelector(
        "#atv-douban-root .atv-hero-teaser"
      );
      return {
        clamped: teaser?.classList.contains("is-clamped"),
        scrollY: window.scrollY,
      };
    });
    // Inline expand = is-clamped toggled off, AND page did NOT scroll away
    record(
      sc.name,
      `展开 expands inline (clamped ${beforeExpand.clamped}→${afterExpand.clamped}, no scroll jump)`,
      beforeExpand.clamped === true &&
        afterExpand.clamped === false &&
        Math.abs(afterExpand.scrollY - beforeExpand.scrollY) < 50
    );
  }

  // === BUG #3: Sticky nav sticks to viewport top + text visible after scroll ===
  await page.evaluate(
    (scrollPos) => window.scrollTo(0, scrollPos),
    SCROLL_TEST_POSITION
  );
  // Deterministic: wait for sticky nav to settle at top (position: fixed + transition complete)
  await page.waitForFunction(
    () => {
      const nav = document.querySelector(".atv-stickynav");
      if (!nav) {
        return false;
      }
      const cs = getComputedStyle(nav);
      const rect = nav.getBoundingClientRect();
      return (
        cs.position === "fixed" &&
        Math.round(rect.top) <= 2 &&
        Number.parseFloat(cs.opacity) > 0.8
      );
    },
    { timeout: TIMEOUT_CONTENT_READY }
  );
  const navState = await page.evaluate(() => {
    const nav = document.querySelector(".atv-stickynav");
    if (!nav) {
      return null;
    }
    const cs = getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    const titleEl = nav.querySelector(".atv-stickynav-title");
    const titleCs = titleEl ? getComputedStyle(titleEl) : null;
    return {
      isVisible: nav.classList.contains("is-visible"),
      position: cs.position,
      opacity: Number.parseFloat(cs.opacity),
      rectTop: Math.round(rect.top),
      title: titleEl?.textContent?.trim() || "",
      titleColor: titleCs?.color || "",
      titleVisible: titleCs
        ? titleCs.visibility === "visible" &&
          Number.parseFloat(titleCs.opacity || "1") > 0
        : false,
    };
  });
  if (navState) {
    // Nav must: be position:fixed, stuck at top (within 2px), visible (opacity > 0.8), have title text that is visible white-ish
    record(
      sc.name,
      `sticky nav fixed at top after scroll (pos:${navState.position}, top:${navState.rectTop}px, opacity:${navState.opacity})`,
      navState.position === "fixed" &&
        Math.abs(navState.rectTop) <= 2 &&
        navState.opacity > STICKY_NAV_MIN_OPACITY
    );
    record(
      sc.name,
      `sticky nav title VISIBLE (text:"${navState.title.slice(0, 12)}", color:${navState.titleColor})`,
      navState.title.length > 0 &&
        navState.titleVisible &&
        !STICKY_NAV_HIDDEN_REGEX.test(navState.titleColor)
    );
  } else {
    record(sc.name, "sticky nav exists", false, "nav element not found");
  }
  // Reset scroll for clean screenshots
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, {
    timeout: TIMEOUT_CONTENT_READY,
  });

  // === NEW: Streaming section (conditional — not all titles have it) ===
  const streamCards = await page.$$("#atv-douban-root .atv-stream-card");
  if (streamCards.length > 0) {
    const firstStream = await streamCards[0].evaluate((el) => ({
      tag: el.tagName,
      name: el.textContent?.trim() || "",
      href: el.tagName === "A" ? el.href : "",
    }));
    // Card is valid if: real-link <a> with http(s) href
    const valid =
      firstStream.name.length > 0 &&
      firstStream.tag === "A" &&
      EXTERNAL_URL_REGEX.test(firstStream.href);
    record(
      sc.name,
      `streaming cards rendered (${streamCards.length}, ${firstStream.tag} "${firstStream.name.slice(0, 10)}")`,
      valid
    );

    // S4: ALL streaming cards must be valid <a> links
    let allValid = true;
    for (const card of streamCards) {
      const info = await card.evaluate((el) => ({
        tag: el.tagName,
        name: el.textContent?.trim() || "",
        href: el.tagName === "A" ? el.href : "",
      }));
      if (
        info.name.length === 0 ||
        info.tag !== "A" ||
        !EXTERNAL_URL_REGEX.test(info.href)
      ) {
        allValid = false;
        break;
      }
    }
    record(
      sc.name,
      `all ${streamCards.length} streaming cards valid <a>`,
      allValid
    );
  }

  // S2: TV streaming card click → popup navigation (TV only)
  if (sc.kind === "tv") {
    const tvCards = await page.$$("#atv-douban-root .atv-stream-card");
    if (tvCards.length > 0) {
      const popupPromise = page.waitForEvent("popup", { timeout: 15_000 });
      await tvCards[0].click();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded");
      const popupUrl = popup.url();
      record(
        sc.name,
        `streaming card click → popup (url: "${popupUrl.slice(0, 60)}")`,
        EXTERNAL_URL_REGEX.test(popupUrl)
      );
      await popup.close();
    }
  }

  // === Awards as info grid rows (conditional) ===
  const allLabels = await page.$$("#atv-douban-root .atv-info-label");
  let awardCount = 0;
  for (const label of allLabels) {
    const color = await label.evaluate((el) => getComputedStyle(el).color);
    if (color === COLOR_GOLD_RGB) {
      awardCount++;
    }
  }
  if (awardCount > 0) {
    record(sc.name, `awards in info grid (${awardCount} rows)`, awardCount > 0);
  }

  // === S5: Info-grid extraction (director + country) ===
  const infoLabels = await page.$$("#atv-douban-root .atv-info-label");
  for (const label of infoLabels) {
    const text = await label.evaluate((el) => el.textContent?.trim() || "");
    if (text === "导演") {
      const value = await label.evaluate(
        (el) => el.nextElementSibling?.textContent?.trim() || ""
      );
      record(
        sc.name,
        `info-grid 导演 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    }
    if (text === "制片国家/地区") {
      const value = await label.evaluate(
        (el) => el.nextElementSibling?.textContent?.trim() || ""
      );
      record(
        sc.name,
        `info-grid 制片国家/地区 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    }
  }

  // === Poster modal (conditional — placeholder posters have no data.poster) ===
  const posterCard = await page.$("#atv-douban-root .atv-poster-card");
  if (posterCard) {
    posterCard.click();
    // Deterministic: wait for modal to appear
    await page.waitForSelector("#atv-poster-modal.is-open", {
      timeout: TIMEOUT_CONTENT_READY,
    });
    const modal = await page.$("#atv-poster-modal.is-open");
    const modalImg = modal
      ? await page.$("#atv-poster-modal.is-open .atv-modal-img")
      : null;
    record(sc.name, "poster click opens modal with image", !!modalImg);
    // S6: Poster image naturalWidth > 0 (CDN actually loaded)
    if (modalImg) {
      const nw = await modalImg.evaluate((img) => img.naturalWidth);
      record(sc.name, `poster img naturalWidth=${nw}`, nw > 0);
    }
    if (modal) {
      const bb = await modal.boundingBox();
      await page.mouse.click(bb.x + 10, bb.y + 10);
      // Deterministic: wait for modal to close
      await page.waitForFunction(
        () => !document.querySelector("#atv-poster-modal.is-open"),
        { timeout: TIMEOUT_CONTENT_READY }
      );
      const closed = await page.$("#atv-poster-modal.is-open");
      record(sc.name, "modal closes on backdrop click", !closed);
    }
  }

  // Visual: screenshots
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `${sc.name}-hero.png`),
    fullPage: false,
  });
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `${sc.name}-full.png`),
    fullPage: true,
  });

  // Mobile viewport screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  // Deterministic: wait for layout to settle after viewport resize
  await page.waitForFunction(
    () => document.documentElement.clientWidth === 390,
    { timeout: TIMEOUT_CONTENT_READY }
  );
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `${sc.name}-mobile.png`),
    fullPage: true,
  });

  console.log(`  ${C.dim}screenshots saved → ${sc.name}*.png${C.reset}`);
}

printSummary();
const failed = results.filter((r) => !r.pass);
if (failed.length) {
  process.exit(1);
}
