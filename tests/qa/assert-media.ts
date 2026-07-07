import type { Page } from "playwright";

import {
  ROOT_SEL,
  clearOpenOverlays,
  fail,
  waitForGone,
  warn,
} from "./assert-helpers";
import { EXTERNAL_URL_REGEX, TIMEOUT_CONTENT_READY } from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

const POSTER_MODAL_TIMEOUT = 5000;
const VIDEO_FETCH_TIMEOUT = 10_000;
const VIDEO_MODAL_TIMEOUT = 3000;

const assertTVStreamingPopup = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  if (scenario.kind !== "tv") {
    return;
  }
  const tvCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (tvCards.length === 0) {
    warn(ctx, "data-missing", "no TV streaming cards to click");
    return;
  }

  let rawPopup: Page | null = null;
  page.once("popup", (p) => {
    rawPopup = p;
  });
  try {
    await tvCards[0].click({ timeout: 5000 });
  } catch {
    // Browser policy or page-level blockers can suppress the popup in CI.
  }
  await page.waitForTimeout(5000);

  if (!rawPopup) {
    warn(ctx, "browser-policy", "streaming popup not opened (likely blocked)");
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

const assertPosterModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  await clearOpenOverlays(page);

  const posterCard = await page.$(`${ROOT_SEL} .atv-poster-card`);
  if (!posterCard) {
    warn(ctx, "data-missing", "no poster card found");
    return;
  }

  const clicked = await posterCard
    .evaluate((el) => {
      el.scrollIntoView({ block: "center" });
      (el as HTMLElement).click();
    })
    .then(() => true)
    .catch(() => false);
  if (!clicked) {
    fail(ctx, "poster card click succeeds");
    return;
  }
  const modal = await page
    .waitForSelector("#atv-poster-modal.is-open", {
      timeout: POSTER_MODAL_TIMEOUT,
    })
    .catch(() => null);
  if (!modal) {
    fail(ctx, "poster modal opens after click");
    return;
  }
  const modalImg = await page.$("#atv-poster-modal.is-open .atv-modal-img");
  record(scenario.name, "poster click opens modal with image", !!modalImg);
  if (modalImg) {
    const nw = await modalImg.evaluate(
      (img) => (img as HTMLImageElement).naturalWidth
    );
    record(scenario.name, `poster img naturalWidth=${nw}`, nw > 0);
  }

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

const assertVideoModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  await clearOpenOverlays(page);

  const trailerTiles = await page.$$(`${ROOT_SEL} .atv-trailer-tile`);
  if (trailerTiles.length === 0) {
    warn(ctx, "data-missing", "no trailer tiles on this page");
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
    fail(ctx, "trailer tile click succeeds");
    return;
  }

  const overlay = await page
    .waitForSelector("#atv-video-modal.is-open", {
      timeout: VIDEO_MODAL_TIMEOUT,
    })
    .catch(() => null);
  if (!overlay) {
    fail(ctx, "video modal opens after trailer click");
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
    warn(
      ctx,
      "browser-policy",
      "video element not loaded (fetch may have failed)"
    );
  }

  const closeBtn = await page.$("#atv-video-modal .atv-modal-close");
  if (closeBtn) {
    await closeBtn.click();
    record(
      scenario.name,
      "video modal closes on X button click",
      await waitForGone(page, "#atv-video-modal")
    );
  }
};

export {
  assertPosterModal,
  assertTrailerTile,
  assertTVStreamingPopup,
  assertVideoModal,
};
