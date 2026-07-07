import { setTimeout as delay } from "node:timers/promises";

import type { Browser, BrowserContext, Page } from "playwright";

import {
  assertAwards,
  assertCast,
  assertCommentOverlay,
  assertCommentOverlayExpandBtn,
  assertCommentOverlayVote,
  assertComments,
  assertExpandInline,
  assertHero,
  assertIMDb,
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
} from "./asserts";
import {
  ATV_NOISE_REGEX,
  ATV_STACK_REGEX,
  C,
  DOUBAN_NOISE_REGEX,
  gmShim,
  injectAfterLoad,
  MAX_RETRIES,
  SCENARIO_DEADLINE_MS,
  TIMEOUT_CONTENT_READY,
  TIMEOUT_PAGE_LOAD,
} from "./constants";
import { record } from "./logger";
import type { AssertCtx, Scenario } from "./types";

const createScenarioContext = (browser: Browser): Promise<BrowserContext> =>
  browser.newContext({
    locale: "zh-CN",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { height: 900, width: 1440 },
  });

const isDoubanNoise = (text: string): boolean => DOUBAN_NOISE_REGEX.test(text);

const collectAtvErrors = (page: Page, ourErrors: string[]): void => {
  page.on("console", (msg) => {
    if (msg.type() !== "error") {
      return;
    }
    const text = msg.text();
    if (isDoubanNoise(text)) {
      return;
    }
    if (ATV_NOISE_REGEX.test(text)) {
      ourErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    if (isDoubanNoise(error.message)) {
      return;
    }
    if (ATV_STACK_REGEX.test(error.stack || error.message)) {
      ourErrors.push(error.message);
    }
  });
};

const waitForContent = async (
  page: Page,
  scenario: Scenario
): Promise<void> => {
  await page.goto(scenario.url, {
    timeout: TIMEOUT_PAGE_LOAD,
    waitUntil: "domcontentloaded",
  });
  try {
    await page.waitForSelector("#content", {
      timeout: TIMEOUT_CONTENT_READY,
    });
  } catch {
    console.log(
      `  ${C.yellow}WARN${C.reset} ${scenario.name} page load timeout`
    );
  }
};

const injectUserscript = async (page: Page): Promise<void> => {
  await page.addScriptTag({
    content: `${gmShim}\n${injectAfterLoad}`,
  });
  await page.waitForSelector("#atv-douban-root", {
    timeout: TIMEOUT_CONTENT_READY,
  });
};

const runAssertionPhases = async (ctx: AssertCtx): Promise<void> => {
  await assertRoot(ctx);
  await assertHero(ctx);
  await assertTitleCorrect(ctx);
  await assertRating(ctx);
  await assertTVTerms(ctx);

  await assertCast(ctx);
  await assertPhotos(ctx);
  await assertRecommendations(ctx);
  await assertComments(ctx);

  await assertSummaryTeaser(ctx);
  await assertExpandInline(ctx);
  await assertCommentOverlayExpandBtn(ctx);
  await assertCommentOverlay(ctx);
  await assertCommentOverlayVote(ctx);
  await assertInterestModal(ctx);

  await assertIMDb(ctx);
  assertNoScriptErrors(ctx);
  await assertStickyNav(ctx);

  await assertTVMeta(ctx);
  await assertStreaming(ctx);
  await assertTVStreamingPopup(ctx);
  await assertAwards(ctx);
  await assertPosterModal(ctx);
  await assertTrailerTile(ctx);
  await assertVideoModal(ctx);

  await captureScreenshots(ctx);
};

const runScenarioAttempt = async (
  browser: Browser,
  scenario: Scenario
): Promise<void> => {
  const context = await createScenarioContext(browser);
  const page = await context.newPage();
  const ourErrors: string[] = [];
  collectAtvErrors(page, ourErrors);

  try {
    await waitForContent(page, scenario);
    await injectUserscript(page);
    await runAssertionPhases({ ourErrors, page, scenario });
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
  }
};

const withScenarioDeadline = async (task: Promise<void>): Promise<void> => {
  // oxlint-disable-next-line promise/avoid-new
  const timeout = new Promise<never>((_resolve, reject) => {
    globalThis.setTimeout(() => {
      reject(new Error(`deadline exceeded (${SCENARIO_DEADLINE_MS / 1000}s)`));
    }, SCENARIO_DEADLINE_MS);
  });
  await Promise.race([task, timeout]);
};

const runScenario = async (
  browser: Browser,
  scenario: Scenario
): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      // oxlint-disable-next-line no-await-in-loop
      await withScenarioDeadline(runScenarioAttempt(browser, scenario));
      return;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(
          `  ${C.yellow}RETRY${C.reset} ${scenario.name} (${attempt}/${MAX_RETRIES}): ${(error as Error).message.slice(0, 120)}`
        );
        // oxlint-disable-next-line no-await-in-loop
        await delay(2000);
        continue;
      }
      record(
        scenario.name,
        "scenario completed without throw",
        false,
        (error as Error).message
      );
    }
  }
};

export { runScenario };
