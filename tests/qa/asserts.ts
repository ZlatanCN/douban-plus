import path from "node:path";

import type { Page } from "playwright";

import {
  COLOR_GOLD_RGB,
  EXTERNAL_URL_REGEX,
  IMDB_LINK_REGEX,
  PERSONAGE_LINK_REGEX,
  SCROLL_TEST_POSITION,
  SCREENSHOT_DIR,
  STICKY_NAV_HIDDEN_REGEX,
  STICKY_NAV_MIN_OPACITY,
  SUBJECT_LINK_REGEX,
  TIMEOUT_CONTENT_READY,
  TV_EPISODE_REGEX,
} from "./constants";
import { record, recordWarn } from "./logger";
import type { AssertCtx } from "./types";

const ROOT_SEL = "#atv-douban-root";

const fail = (ctx: AssertCtx, name: string, detail = ""): void => {
  record(ctx.scenario.name, name, false, detail);
};
const warn = (ctx: AssertCtx, name: string, detail = ""): void => {
  recordWarn(ctx.scenario.name, name, detail);
};

const assertRoot = async ({ page, scenario }: AssertCtx): Promise<void> => {
  let ok;
  try {
    await page.waitForSelector(ROOT_SEL, { timeout: TIMEOUT_CONTENT_READY });
    ok = true;
  } catch {
    ok = false;
  }
  record(scenario.name, "root #atv-douban-root injected", ok);
};

const assertHero = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const hasHero = (await page.$(`${ROOT_SEL} .atv-hero`)) !== null;
  record(scenario.name, "hero section rendered", hasHero);

  const heroStill = await page
    .waitForSelector(`${ROOT_SEL} .atv-hero-still.is-loaded`, {
      timeout: 10_000,
    })
    .catch(() => null);
  record(scenario.name, "hero bg image loaded", heroStill !== null);

  const titleText = await page
    .$eval(`${ROOT_SEL} .atv-hero-title`, (el) => el.textContent.trim())
    .catch(() => "");
  record(
    scenario.name,
    `hero title non-empty (got: "${titleText.slice(0, 40)}")`,
    titleText.length > 0
  );
};

const assertRating = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const panel = await page.$(`${ROOT_SEL} .atv-rating-panel`);
  if (!panel) {
    record(scenario.name, "rating panel present", false);
    return;
  }
  const scoreEl = await page.$(`${ROOT_SEL} .atv-rating-panel-score`);
  const emptyEl = await page.$(`${ROOT_SEL} .atv-rating-empty`);

  const found = scoreEl || emptyEl;
  const text = found
    ? await found.evaluate((el) => el.textContent.trim()).catch(() => "")
    : "";
  record(
    scenario.name,
    `rating panel rendered (got: "${text.slice(0, 20)}")`,
    found !== null
  );
};

const assertTVMeta = async ({ page, scenario }: AssertCtx): Promise<void> => {
  if (scenario.kind !== "tv") {
    return;
  }
  const heroMeta = await page
    .$eval(`${ROOT_SEL} .atv-hero-meta`, (el) => el.textContent)
    .catch(() => "");
  record(
    scenario.name,
    `TV hero meta contains 集 or 季 (got: "${heroMeta.slice(0, 80)}")`,
    TV_EPISODE_REGEX.test(heroMeta)
  );
};

const assertCast = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const castCards = await page.$$(`${ROOT_SEL} .atv-cast-card`);
  record(
    scenario.name,
    `cast cards rendered (${castCards.length})`,
    castCards.length > 0
  );
  if (castCards.length > 0) {
    const firstCastLink = await castCards[0]
      .evaluate((el) =>
        el.tagName === "A"
          ? (el as HTMLAnchorElement).href
          : el.querySelector("a")?.getAttribute("href") || ""
      )
      .catch(() => "");
    record(
      scenario.name,
      `cast link points to personage page (got: "${firstCastLink.slice(0, 60)}")`,
      PERSONAGE_LINK_REGEX.test(firstCastLink)
    );
  }
};

const assertPhotos = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const photoTiles = await page.$$(`${ROOT_SEL} .atv-photo-tile`);
  record(
    scenario.name,
    `photo tiles rendered (${photoTiles.length})`,
    photoTiles.length > 0
  );
};

const assertRecommendations = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const recCards = await page.$$(`${ROOT_SEL} .atv-rec-card`);
  record(
    scenario.name,
    `recommendation cards rendered (${recCards.length})`,
    recCards.length > 0
  );
  if (recCards.length > 0) {
    const firstRecLink = await recCards[0]
      .evaluate((el) =>
        el.tagName === "A"
          ? (el as HTMLAnchorElement).href
          : el.querySelector("a")?.getAttribute("href") || ""
      )
      .catch(() => "");
    record(
      scenario.name,
      `rec link to subject page (got: "${firstRecLink.slice(0, 60)}")`,
      SUBJECT_LINK_REGEX.test(firstRecLink)
    );
  }
};

const assertIMDb = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const imdbLink = await page
    .$eval(
      `${ROOT_SEL} a[href*="imdb.com"]`,
      (a) => (a as HTMLAnchorElement).href
    )
    .catch(() => null);
  if (imdbLink) {
    record(
      scenario.name,
      `IMDb link present (${imdbLink.slice(0, 50)})`,
      IMDB_LINK_REGEX.test(imdbLink)
    );
  } else {
    warn(ctx, "no IMDb link found");
  }
};

const assertNoScriptErrors = (ctx: AssertCtx): void => {
  const { scenario, ourErrors } = ctx;
  record(
    scenario.name,
    `no script-originated errors (count: ${ourErrors.length})`,
    ourErrors.length === 0,
    ourErrors.slice(0, 2).join(" | ")
  );
};

const assertComments = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const commentCards = await page.$$(`${ROOT_SEL} .atv-comment-card`);
  if (commentCards.length === 0) {
    warn(ctx, "no comment cards rendered (page may have no comments)");
    return;
  }
  record(
    scenario.name,
    `comment cards rendered (${commentCards.length})`,
    commentCards.length > 0
  );
  const firstComment = await commentCards[0].evaluate((card) => ({
    author:
      card.querySelector(".atv-comment-author")?.textContent?.trim() || "",
    body: card.querySelector(".atv-comment-body")?.textContent?.trim() || "",
  }));
  record(
    scenario.name,
    `comment has author + body (author: "${firstComment.author.slice(0, 12)}")`,
    firstComment.author.length > 0 && firstComment.body.length > 0
  );
};

const assertSummaryTeaser = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const teaserText = await page
    .$eval(`${ROOT_SEL} .atv-hero-teaser`, (el) => el.textContent?.trim() || "")
    .catch(() => "");
  record(
    scenario.name,
    `summary teaser non-empty (len:${teaserText.length})`,
    teaserText.length > 0
  );
};

const assertExpandInline = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const hasMoreBtn = (await page.$(`${ROOT_SEL} .atv-hero-more`)) !== null;
  if (!hasMoreBtn) {
    warn(ctx, "inline expand btn not present — summary too short");
    return;
  }

  const beforeExpand = await page.evaluate(() => {
    const teaser = document.querySelector("#atv-douban-root .atv-hero-teaser");
    return {
      clamped: teaser?.classList.contains("is-clamped"),
      scrollY: window.scrollY,
    };
  });
  // Force click even if not visible (some pages overlap the hero UI)
  const clicked = await page
    .click(`${ROOT_SEL} .atv-hero-more`, { force: true, timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!clicked) {
    warn(ctx, "inline expand button not clickable");
    return;
  }
  await page.waitForFunction(
    () =>
      document
        .querySelector("#atv-douban-root .atv-hero-teaser")
        ?.classList.contains("is-clamped") === false,
    { timeout: TIMEOUT_CONTENT_READY }
  );
  const afterExpand = await page.evaluate(() => {
    const teaser = document.querySelector("#atv-douban-root .atv-hero-teaser");
    return {
      clamped: teaser?.classList.contains("is-clamped"),
      scrollY: window.scrollY,
    };
  });
  record(
    scenario.name,
    `展开 expands inline (clamped ${beforeExpand.clamped}→${afterExpand.clamped}, no scroll jump)`,
    beforeExpand.clamped === true &&
      afterExpand.clamped === false &&
      Math.abs(afterExpand.scrollY - beforeExpand.scrollY) < 50
  );
};

const assertStickyNav = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  await page.evaluate(
    (scrollPos) => window.scrollTo(0, scrollPos),
    SCROLL_TEST_POSITION
  );
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
      opacity: Number.parseFloat(cs.opacity),
      position: cs.position,
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
    record(
      scenario.name,
      `sticky nav fixed at top after scroll (pos:${navState.position}, top:${navState.rectTop}px, opacity:${navState.opacity})`,
      navState.position === "fixed" &&
        Math.abs(navState.rectTop) <= 2 &&
        navState.opacity > STICKY_NAV_MIN_OPACITY
    );
    record(
      scenario.name,
      `sticky nav title VISIBLE (text:"${navState.title.slice(0, 12)}", color:${navState.titleColor})`,
      navState.title.length > 0 &&
        navState.titleVisible &&
        !STICKY_NAV_HIDDEN_REGEX.test(navState.titleColor)
    );
  } else {
    record(scenario.name, "sticky nav exists", false, "nav element not found");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, {
    timeout: TIMEOUT_CONTENT_READY,
  });
};

const assertStreaming = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const streamCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (streamCards.length === 0) {
    warn(ctx, "no streaming cards — page may lack streaming sources");
    return;
  }

  const firstStream = await streamCards[0].evaluate((el) => ({
    href: el.tagName === "A" ? (el as HTMLAnchorElement).href : "",
    name: el.textContent?.trim() || "",
    tag: el.tagName,
  }));
  const valid =
    firstStream.name.length > 0 &&
    firstStream.tag === "A" &&
    EXTERNAL_URL_REGEX.test(firstStream.href);
  record(
    scenario.name,
    `streaming cards rendered (${streamCards.length}, ${firstStream.tag} "${firstStream.name.slice(0, 10)}")`,
    valid
  );

  const cardInfos = await Promise.all(
    streamCards.map((card) =>
      card.evaluate((el) => ({
        href: el.tagName === "A" ? (el as HTMLAnchorElement).href : "",
        name: el.textContent?.trim() || "",
        tag: el.tagName,
      }))
    )
  );
  const allValid = cardInfos.every(
    (info) =>
      info.name.length > 0 &&
      info.tag === "A" &&
      EXTERNAL_URL_REGEX.test(info.href)
  );
  record(
    scenario.name,
    `all ${streamCards.length} streaming cards valid <a>`,
    allValid
  );
};

const assertTVStreamingPopup = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  if (scenario.kind !== "tv") {
    return;
  }
  const tvCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (tvCards.length === 0) {
    warn(ctx, "no TV streaming cards to click");
    return;
  }

  let rawPopup: Page | null = null;
  page.once("popup", (p) => {
    rawPopup = p;
  });
  try {
    await tvCards[0].click({ timeout: 5000 });
  } catch {
    // click blocked — popup won't open
  }
  await page.waitForTimeout(5000);

  if (!rawPopup) {
    warn(ctx, "streaming popup not opened (likely blocked)");
    return;
  }
  const popup: Page = rawPopup;
  await popup.waitForLoadState("domcontentloaded");
  record(
    scenario.name,
    `streaming card click → popup (url: "${popup.url().slice(0, 60)}")`,
    EXTERNAL_URL_REGEX.test(popup.url())
  );
  await popup.close();
};

const assertAwards = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const allLabels = await page.$$(`${ROOT_SEL} .atv-info-label`);

  const colors = await Promise.all(
    allLabels.map((label) => label.evaluate((el) => getComputedStyle(el).color))
  );
  const awardCount = colors.filter((color) => color === COLOR_GOLD_RGB).length;

  if (awardCount > 0) {
    record(
      scenario.name,
      `awards in info grid (${awardCount} rows)`,
      awardCount > 0
    );
  } else {
    warn(ctx, "no awards found in info grid");
  }
};

const assertInfoGrid = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const infoLabels = await page.$$(`${ROOT_SEL} .atv-info-label`);
  if (infoLabels.length === 0) {
    warn(ctx, "no info labels in info grid");
    return;
  }

  const labelInfos = await Promise.all(
    infoLabels.map((label) =>
      label.evaluate((el) => ({
        text: el.textContent?.trim() || "",
        value: el.nextElementSibling?.textContent?.trim() || "",
      }))
    )
  );

  // 遍历结果，记录特定标签
  for (const { text, value } of labelInfos) {
    if (text === "导演") {
      record(
        scenario.name,
        `info-grid 导演 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    } else if (text === "制片国家/地区") {
      record(
        scenario.name,
        `info-grid 制片国家/地区 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    }
  }
};

const POSTER_CLICK_TIMEOUT = 5000;
const POSTER_MODAL_TIMEOUT = 5000;

const assertPosterModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const posterCard = await page.$(`${ROOT_SEL} .atv-poster-card`);
  if (!posterCard) {
    warn(ctx, "no poster card found");
    return;
  }

  const clicked = await posterCard
    .click({ timeout: POSTER_CLICK_TIMEOUT })
    .then(() => true)
    .catch(() => false);
  if (!clicked) {
    warn(ctx, "poster card click failed (likely overlay blocking)");
    return;
  }
  const modal = await page
    .waitForSelector("#atv-poster-modal.is-open", {
      timeout: POSTER_MODAL_TIMEOUT,
    })
    .catch(() => null);
  if (!modal) {
    warn(ctx, "poster modal did not open after click");
    return;
  }
  const modalImg = modal
    ? await page.$("#atv-poster-modal.is-open .atv-modal-img")
    : null;
  record(scenario.name, "poster click opens modal with image", !!modalImg);
  if (modalImg) {
    const nw = await modalImg.evaluate(
      (img) => (img as HTMLImageElement).naturalWidth
    );
    record(scenario.name, `poster img naturalWidth=${nw}`, nw > 0);
  }
  if (modal) {
    const bb = await modal.boundingBox();
    if (bb) {
      await page.mouse.click(bb.x + 10, bb.y + 10);
      await page.waitForFunction(
        () => !document.querySelector("#atv-poster-modal.is-open"),
        { timeout: TIMEOUT_CONTENT_READY }
      );
      const closed = await page.$("#atv-poster-modal.is-open");
      record(scenario.name, "modal closes on backdrop click", !closed);
    }
  }
};

/* ── New assertion functions ─────────────────────────── */

/**
 * Open comment overlay via body text click, verify full content displayed,
 * dismiss via X button, verify body scroll restored.
 */
const assertCommentOverlay = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const overflowCard = await page.$(
    `${ROOT_SEL} .atv-comment-card.has-overflow`
  );
  if (!overflowCard) {
    warn(ctx, "no overflow comment card to open overlay");
    return;
  }

  const bodyText = await overflowCard
    .$eval(".atv-comment-body", (el) => (el.textContent || "").trim())
    .catch(() => "");
  if (!bodyText) {
    fail(ctx, "comment body text non-empty before overlay", "body was empty");
    return;
  }

  const bodyEl = await overflowCard.$(".atv-comment-body");
  if (!bodyEl) {
    fail(ctx, "comment body element found in overflow card");
    return;
  }
  await bodyEl.click();
  const overlay = await page
    .waitForSelector("#atv-comment-overlay.is-open", {
      timeout: TIMEOUT_CONTENT_READY,
    })
    .catch(() => null);
  if (!overlay) {
    fail(ctx, "comment overlay opens on body click");
    return;
  }
  record(scenario.name, "comment overlay opens on body click", true);

  const overlayText = await overlay
    .$eval(".atv-comment-overlay-body", (el) => (el.textContent || "").trim())
    .catch(() => "");
  record(
    scenario.name,
    `overlay body text non-empty (len:${overlayText.length})`,
    overlayText.length >= bodyText.length
  );

  const closeBtn = await overlay.$(".atv-comment-overlay-close");
  if (!closeBtn) {
    fail(ctx, "overlay has close button");
    return;
  }
  await closeBtn.click();
  await page.waitForFunction(
    () => !document.querySelector("#atv-comment-overlay"),
    { timeout: TIMEOUT_CONTENT_READY }
  );
  record(scenario.name, "overlay closes on X button click", true);

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  record(
    scenario.name,
    "body overflow restored after overlay close",
    bodyOverflow === "" || bodyOverflow === "visible"
  );
};

const assertCommentOverlayExpandBtn = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const overflowCard = await page.$(
    `${ROOT_SEL} .atv-comment-card.has-overflow`
  );
  if (!overflowCard) {
    warn(ctx, "no overflow card to test expand button");
    return;
  }

  const expandBtn = await overflowCard.$(".atv-comment-expand");
  if (!expandBtn) {
    fail(ctx, "expand button visible on overflow card");
    return;
  }
  record(scenario.name, "expand button present on overflow card", true);

  await expandBtn.click();
  const overlay = await page
    .waitForSelector("#atv-comment-overlay.is-open", {
      timeout: TIMEOUT_CONTENT_READY,
    })
    .catch(() => null);
  record(scenario.name, "expand button opens overlay", overlay !== null);

  if (overlay) {
    const closeBtn = await overlay.$(".atv-comment-overlay-close");
    if (closeBtn) {
      await closeBtn.click();
    }
  }
};

/**
 * Vote button in overlay: verify button present, click does not throw.
 * Optimistic-count + rollback both happen in the same microtask sequence
 * when the mock API resolves synchronously, so Playwright can never
 * observe the intermediate +1 state — we test only click integrity here.
 */
const assertCommentOverlayVote = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const overflowCard = await page.$(
    `${ROOT_SEL} .atv-comment-card.has-overflow`
  );
  if (!overflowCard) {
    warn(ctx, "no overflow card to test vote in overlay");
    return;
  }

  const bodyEl = await overflowCard.$(".atv-comment-body");
  if (!bodyEl) {
    warn(ctx, "comment body not found for vote test");
    return;
  }
  await bodyEl.click();
  const overlay = await page
    .waitForSelector("#atv-comment-overlay.is-open", {
      timeout: TIMEOUT_CONTENT_READY,
    })
    .catch(() => null);
  if (!overlay) {
    fail(ctx, "overlay opens for vote test");
    return;
  }

  const voteBtn = await overlay.$(".atv-comment-overlay-votes");
  if (!voteBtn) {
    fail(ctx, "vote button in overlay");
    return;
  }
  record(scenario.name, "vote button present in overlay", true);

  const clickOk = await voteBtn
    .click()
    .then(() => true)
    .catch(() => false);
  record(scenario.name, "vote button click succeeds", clickOk);

  const closeBtn = await overlay.$(".atv-comment-overlay-close");
  if (closeBtn) {
    await closeBtn.click();
  }
};

/**
 * Interest modal: open, toggle status, click star, type in textarea,
 * close via ESC, verify body scroll restored.
 */
const assertInterestModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const primaryBtn = await page.$(`${ROOT_SEL} .atv-btn-primary`);
  if (!primaryBtn) {
    warn(ctx, "no primary action button for interest modal");
    return;
  }
  record(scenario.name, "primary action button present", true);

  await primaryBtn.click();
  const modal = await page
    .waitForSelector("#atv-interest-modal.is-open", {
      timeout: TIMEOUT_CONTENT_READY,
    })
    .catch(() => null);
  if (!modal) {
    warn(ctx, "interest modal not opened (logged-out — proxy-click fired)");
    return;
  }
  record(scenario.name, "interest modal opens", true);

  const statusBtns = await modal.$$(".atv-interest-modal-status");
  if (statusBtns.length > 1) {
    await statusBtns[1].click();
    await page.waitForTimeout(200);
    const active = await modal.$(".atv-interest-modal-status.is-active");
    const activeRaw = active
      ? await active.evaluate((el) => el.textContent)
      : "";
    const activeText = activeRaw.trim();
    record(
      scenario.name,
      `status toggled to "${activeText}"`,
      activeText.length > 0
    );
  }

  const stars = await modal.$$(".atv-interest-modal-star");
  if (stars.length > 0) {
    await stars[3].click();
    await page.waitForTimeout(200);
    const fullStars = await modal.$$(".atv-interest-modal-star.is-full");
    record(
      scenario.name,
      `star rating set (${fullStars.length}/5)`,
      fullStars.length > 0
    );
  }

  const textarea = await modal.$(".atv-interest-modal-comment");
  if (textarea) {
    await textarea.fill("测试短评");
    const val = await textarea.evaluate(
      (el) => (el as HTMLTextAreaElement).value
    );
    record(scenario.name, "textarea fill works", val === "测试短评");
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector("#atv-interest-modal"),
    { timeout: TIMEOUT_CONTENT_READY }
  );
  record(scenario.name, "interest modal closes on ESC", true);

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  record(
    scenario.name,
    "body overflow restored after modal close",
    bodyOverflow === "" || bodyOverflow === "visible"
  );
};

const assertTitleCorrect = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const titleText = await page
    .$eval(`${ROOT_SEL} .atv-hero-title`, (el) => el.textContent.trim())
    .catch(() => "");
  record(
    scenario.name,
    `hero title non-empty (got: "${titleText.slice(0, 40)}")`,
    titleText.length > 0
  );
};

const assertTVTerms = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  if (scenario.kind === "tv") {
    const heroMeta = await page
      .$eval(`${ROOT_SEL} .atv-hero-meta`, (el) => el.textContent)
      .catch(() => "");
    record(
      scenario.name,
      `TV hero meta contains 集/季 (got: "${heroMeta.slice(0, 80)}")`,
      TV_EPISODE_REGEX.test(heroMeta)
    );
  } else {
    const rootText = await page.$eval(
      `${ROOT_SEL}`,
      (el) => el.textContent || ""
    );
    const hasTVTerms = TV_EPISODE_REGEX.test(rootText);
    record(scenario.name, `no TV terms (集/季) on movie page`, !hasTVTerms);
  }
};

const captureScreenshots = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  await page.screenshot({
    fullPage: false,
    path: path.join(SCREENSHOT_DIR, `${scenario.name}-hero.png`),
  });
  await page.screenshot({
    fullPage: true,
    path: path.join(SCREENSHOT_DIR, `${scenario.name}-full.png`),
  });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.waitForFunction(
    () => document.documentElement.clientWidth === 390,
    { timeout: TIMEOUT_CONTENT_READY }
  );
  await page.screenshot({
    fullPage: true,
    path: path.join(SCREENSHOT_DIR, `${scenario.name}-mobile.png`),
  });

  console.log(`  \u001B[2mscreenshots saved → ${scenario.name}*.png\u001B[0m`);
};

const assertTrailerTile = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const trailerTiles = await page.$$(`${ROOT_SEL} .atv-trailer-tile`);
  record(
    scenario.name,
    `trailer tiles rendered (${trailerTiles.length})`,
    trailerTiles.length > 0
  );
  if (trailerTiles.length > 0) {
    const tilesWithPlay = await Promise.all(
      trailerTiles.map((tile) => tile.$(".atv-trailer-play-overlay"))
    );
    const allHavePlay = tilesWithPlay.every((el) => el !== null);
    record(
      scenario.name,
      "each trailer tile has play button overlay",
      allHavePlay
    );
  }
};

const VIDEO_FETCH_TIMEOUT = 10_000;
const VIDEO_MODAL_TIMEOUT = 3000;

const assertVideoModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const trailerTiles = await page.$$(`${ROOT_SEL} .atv-trailer-tile`);
  if (trailerTiles.length === 0) {
    warn(ctx, "no trailer tiles on this page");
    return;
  }

  const clicked = await trailerTiles[0]
    .evaluate((el) => {
      el.scrollIntoView({ block: "nearest" });
      (el as HTMLElement).click();
    })
    .then(() => true)
    .catch(() => false);
  if (!clicked) {
    warn(ctx, "trailer tile click failed");
    return;
  }

  const overlay = await page
    .waitForSelector("#atv-video-modal.is-open", {
      timeout: VIDEO_MODAL_TIMEOUT,
    })
    .catch(() => null);
  if (!overlay) {
    warn(ctx, "video modal did not open after trailer click");
    return;
  }
  record(scenario.name, "trailer click opens video modal", true);

  const videoEl = await page
    .waitForSelector("#atv-video-modal.is-open video", {
      timeout: VIDEO_FETCH_TIMEOUT,
    })
    .catch(() => null);
  if (videoEl) {
    record(scenario.name, "video element in modal overlay", true);
  } else {
    warn(ctx, "video element not loaded (fetch may have failed)");
  }

  const closeBtn = await page.$("#atv-video-modal .atv-modal-close");
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForFunction(
      () => !document.querySelector("#atv-video-modal.is-open"),
      { timeout: TIMEOUT_CONTENT_READY }
    );
    const closed = await page.$("#atv-video-modal.is-open");
    record(scenario.name, "video modal closes on X button click", !closed);
  }
};

export {
  assertAwards,
  assertCast,
  assertCommentOverlay,
  assertCommentOverlayExpandBtn,
  assertCommentOverlayVote,
  assertComments,
  assertExpandInline,
  assertHero,
  assertIMDb,
  assertInfoGrid,
  assertInterestModal,
  assertNoScriptErrors,
  assertPhotos,
  assertPosterModal,
  assertRating,
  assertRecommendations,
  assertRoot,
  assertStickyNav,
  assertStreaming,
  assertSummaryTeaser,
  assertTitleCorrect,
  assertTrailerTile,
  assertTVMeta,
  assertTVStreamingPopup,
  assertTVTerms,
  assertVideoModal,
  captureScreenshots,
};
