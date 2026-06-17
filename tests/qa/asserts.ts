import path from "node:path";

import {
  COLOR_BLACK_RGB,
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
import { record } from "./logger";
import type { AssertCtx } from "./types";

const ROOT_SEL = "#atv-douban-root";

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
  const ratingNum = await page
    .$eval(`${ROOT_SEL} .atv-rating-score`, (el) => el.textContent.trim())
    .catch(() => null);
  const ratingFallback = await page
    .$eval(`${ROOT_SEL} .atv-rating-none`, (el) => el.textContent.trim())
    .catch(() => null);
  record(
    scenario.name,
    `rating shown (score: "${ratingNum}" / fallback: "${ratingFallback}")`,
    (ratingNum !== null && ratingNum.length > 0) || ratingFallback !== null
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

const assertWrapper = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const wrapperState = await page.evaluate(() => {
    const w = document.querySelector("#wrapper");
    if (!w) {
      return "removed";
    }
    const { display } = getComputedStyle(w);
    return display === "none" ? "hidden" : "visible";
  });
  record(
    scenario.name,
    `#wrapper hidden but preserved (got: "${wrapperState}")`,
    wrapperState === "hidden"
  );
};

const assertIMDb = async ({ page, scenario }: AssertCtx): Promise<void> => {
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

const assertBodyBg = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const bodyBg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  record(
    scenario.name,
    `body bg is black (got: ${bodyBg})`,
    new RegExp(COLOR_BLACK_RGB.replaceAll(/[()]/gu, "\\$&"), "u").test(bodyBg)
  );
};

const assertComments = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const commentCards = await page.$$(`${ROOT_SEL} .atv-comment-card`);
  record(
    scenario.name,
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
      scenario.name,
      `comment has author + body (author: "${firstComment.author.slice(0, 12)}")`,
      firstComment.author.length > 0 && firstComment.body.length > 0
    );
  }
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

const assertExpandInline = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const hasMoreBtn = (await page.$(`${ROOT_SEL} .atv-hero-more`)) !== null;
  if (!hasMoreBtn) {
    return;
  }

  const beforeExpand = await page.evaluate(() => {
    const teaser = document.querySelector("#atv-douban-root .atv-hero-teaser");
    return {
      clamped: teaser?.classList.contains("is-clamped"),
      scrollY: window.scrollY,
    };
  });
  await page.click(`${ROOT_SEL} .atv-hero-more`);
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

const assertStreaming = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const streamCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (streamCards.length === 0) {
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

const assertTVStreamingPopup = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  if (scenario.kind !== "tv") {
    return;
  }
  const tvCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (tvCards.length === 0) {
    return;
  }

  const popupPromise = page.waitForEvent("popup", { timeout: 15_000 });
  await tvCards[0].click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  const popupUrl = popup.url();
  record(
    scenario.name,
    `streaming card click → popup (url: "${popupUrl.slice(0, 60)}")`,
    EXTERNAL_URL_REGEX.test(popupUrl)
  );
  await popup.close();
};

const assertAwards = async ({ page, scenario }: AssertCtx): Promise<void> => {
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
  }
};

const assertInfoGrid = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const infoLabels = await page.$$(`${ROOT_SEL} .atv-info-label`);
  if (infoLabels.length === 0) {
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

const assertPosterModal = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const posterCard = await page.$(`${ROOT_SEL} .atv-poster-card`);
  if (!posterCard) {
    return;
  }

  posterCard.click();
  await page.waitForSelector("#atv-poster-modal.is-open", {
    timeout: TIMEOUT_CONTENT_READY,
  });
  const modal = await page.$("#atv-poster-modal.is-open");
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

export {
  assertAwards,
  assertBodyBg,
  assertCast,
  assertComments,
  assertExpandInline,
  assertHero,
  assertIMDb,
  assertInfoGrid,
  assertNoScriptErrors,
  assertPhotos,
  assertPosterModal,
  assertRating,
  assertRecommendations,
  assertRoot,
  assertStickyNav,
  assertStreaming,
  assertSummaryTeaser,
  assertTVMeta,
  assertTVStreamingPopup,
  assertWrapper,
  captureScreenshots,
};
