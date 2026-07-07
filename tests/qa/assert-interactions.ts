import {
  ROOT_SEL,
  closeIfPresent,
  fail,
  waitForGone,
  warn,
} from "./assert-helpers";
import { TIMEOUT_CONTENT_READY } from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

const assertExpandInline = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const hasMoreBtn = (await page.$(`${ROOT_SEL} .atv-hero-more`)) !== null;
  if (!hasMoreBtn) {
    warn(
      ctx,
      "data-missing",
      "inline expand btn not present — summary too short"
    );
    return;
  }

  const beforeExpand = await page.evaluate(() => {
    const teaser = document.querySelector("#atv-douban-root .atv-hero-teaser");
    return {
      clamped: teaser?.classList.contains("is-clamped"),
      scrollY: window.scrollY,
    };
  });
  const clicked = await page
    .click(`${ROOT_SEL} .atv-hero-more`, { force: true, timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!clicked) {
    fail(ctx, "inline expand button clickable");
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

const assertCommentOverlay = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const overflowCard = await page.$(
    `${ROOT_SEL} .atv-comment-card.has-overflow`
  );
  if (!overflowCard) {
    warn(ctx, "data-missing", "no overflow comment card to open overlay");
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

  const closeStructure = await overlay.evaluate((el) => {
    const inner = el.querySelector(".atv-comment-overlay-inner");
    const closeBtn = inner?.querySelector(".atv-comment-overlay-close");
    return {
      directGenericClose: Boolean(
        el.querySelector(":scope > .atv-modal-close")
      ),
      inSurface: Boolean(closeBtn && inner?.contains(closeBtn)),
    };
  });
  record(
    scenario.name,
    "comment overlay close button is inside surface",
    closeStructure.inSurface && !closeStructure.directGenericClose
  );

  const closeBtn = await overlay.$(".atv-comment-overlay-close");
  if (!closeBtn) {
    fail(ctx, "overlay has close button");
    return;
  }
  await closeBtn.click();
  record(
    scenario.name,
    "overlay closes on X button click",
    await waitForGone(page, "#atv-comment-overlay")
  );

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
    warn(ctx, "data-missing", "no overflow card to test expand button");
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
    await closeIfPresent(
      page,
      "#atv-comment-overlay .atv-comment-overlay-close"
    );
    await waitForGone(page, "#atv-comment-overlay");
  }
};

const assertCommentOverlayVote = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const overflowCard = await page.$(
    `${ROOT_SEL} .atv-comment-card.has-overflow`
  );
  if (!overflowCard) {
    warn(ctx, "data-missing", "no overflow card to test vote in overlay");
    return;
  }

  const bodyEl = await overflowCard.$(".atv-comment-body");
  if (!bodyEl) {
    warn(ctx, "data-missing", "comment body not found for vote test");
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

  await closeIfPresent(page, "#atv-comment-overlay .atv-comment-overlay-close");
  await waitForGone(page, "#atv-comment-overlay");
};

const assertInterestModal = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const primaryBtn = await page.$(`${ROOT_SEL} .atv-btn-primary`);
  if (!primaryBtn) {
    warn(ctx, "data-missing", "no primary action button for interest modal");
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
    warn(
      ctx,
      "auth-dependent",
      "interest modal not opened (logged-out — proxy-click fired)"
    );
    return;
  }
  record(scenario.name, "interest modal opens", true);

  const closeStructure = await modal.evaluate((el) => ({
    headerClose: Boolean(
      el.querySelector(".atv-interest-modal-header > .atv-interest-modal-close")
    ),
    totalCloseButtons: el.querySelectorAll(
      ".atv-interest-modal-close, .atv-modal-close"
    ).length,
  }));
  record(
    scenario.name,
    "interest modal has exactly one header close button",
    closeStructure.headerClose && closeStructure.totalCloseButtons === 1
  );

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
  record(
    scenario.name,
    "interest modal closes on ESC",
    await waitForGone(page, "#atv-interest-modal")
  );

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  record(
    scenario.name,
    "body overflow restored after modal close",
    bodyOverflow === "" || bodyOverflow === "visible"
  );
};

export {
  assertCommentOverlay,
  assertCommentOverlayExpandBtn,
  assertCommentOverlayVote,
  assertExpandInline,
  assertInterestModal,
};
