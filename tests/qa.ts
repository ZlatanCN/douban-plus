// QA harness for douban-plus.user.js
// Loads the userscript into a real browser visiting Douban pages, runs assertions,
// captures screenshots for visual review.
//
// Usage: npx tsx tests/qa.ts
// Output: tests/screenshots/*.png + console pass/fail report

import { promisify } from "node:util";

import { chromium } from "playwright";
import type { Page } from "playwright";

import {
  assertAwards,
  assertBodyBg,
  assertCast,
  assertCommentContentFull,
  assertCommentOverlay,
  assertCommentOverlayExpandBtn,
  assertCommentOverlayVote,
  assertComments,
  assertExpandInline,
  assertHero,
  assertIMDb,
  assertInfoFields,
  assertInterestModal,
  assertNoScriptErrors,
  assertNoTVElements,
  assertPhotos,
  assertPosterModal,
  assertRating,
  assertRatingCorrect,
  assertRecommendations,
  assertRoot,
  assertStickyNav,
  assertStreaming,
  assertSummaryTeaser,
  assertTitleCorrect,
  assertTVMeta,
  assertTVSpecific,
  assertTVStreamingPopup,
  assertWrapper,
  captureScreenshots,
} from "./qa/asserts";
import {
  ATV_NOISE_REGEX,
  ATV_STACK_REGEX,
  C,
  DOUBAN_NOISE_REGEX,
  gmShim,
  injectAfterLoad,
  MAX_RETRIES,
  SCENARIOS,
  SCENARIO_DEADLINE_MS,
  TIMEOUT_CONTENT_READY,
  TIMEOUT_PAGE_LOAD,
} from "./qa/constants";
import { hasFailures, printSummary, record } from "./qa/logger";
import { Reporter } from "./qa/reporter";
import type { AssertCtx, Scenario } from "./qa/types";

const delay = promisify(setTimeout);

const browser = await chromium.launch({ headless: true });

const isDoubanNoise = (t: string) => DOUBAN_NOISE_REGEX.test(t);

const executeBody = async (
  page: Page,
  sc: Scenario,
  ourErrors: string[]
): Promise<void> => {
  await page.goto(sc.url, {
    timeout: TIMEOUT_PAGE_LOAD,
    waitUntil: "domcontentloaded",
  });
  try {
    await page.waitForSelector("#content", {
      timeout: TIMEOUT_CONTENT_READY,
    });
  } catch {
    console.log(`  ${C.yellow}WARN${C.reset} ${sc.name} page load timeout`);
  }

  await page.addScriptTag({
    content: `${gmShim}\n${injectAfterLoad}`,
  });
  await page.waitForSelector("#atv-douban-root", {
    timeout: TIMEOUT_CONTENT_READY,
  });

  const ctx: AssertCtx = { ourErrors, page, scenario: sc };

  /* ── Phase 1: Core existence ── */
  await assertRoot(ctx);
  await assertHero(ctx);
  await assertTitleCorrect(ctx);
  await assertRatingCorrect(ctx);
  await assertNoTVElements(ctx);
  await assertTVSpecific(ctx);

  /* ── Phase 2: Content sections ── */
  await assertCast(ctx);
  await assertPhotos(ctx);
  await assertRating(ctx);
  await assertRecommendations(ctx);
  await assertInfoFields(ctx);
  await assertComments(ctx);
  await assertCommentContentFull(ctx);

  /* ── Phase 3: Interactive features ── */
  await assertSummaryTeaser(ctx);
  await assertExpandInline(ctx);
  await assertCommentOverlayExpandBtn(ctx);
  await assertCommentOverlay(ctx);
  await assertCommentOverlayVote(ctx);
  await assertInterestModal(ctx);

  /* ── Phase 4: UI chrome & navigation ── */
  await assertWrapper(ctx);
  await assertIMDb(ctx);
  assertNoScriptErrors(ctx);
  await assertBodyBg(ctx);
  await assertStickyNav(ctx);

  /* ── Phase 5: Edge features ── */
  await assertTVMeta(ctx);
  await assertStreaming(ctx);
  await assertTVStreamingPopup(ctx);
  await assertAwards(ctx);
  await assertPosterModal(ctx);

  /* ── Phase 6: Screenshots ── */
  await captureScreenshots(ctx);
};

const runScenario = async (sc: Scenario): Promise<void> => {
  const ctx = await browser.newContext({
    locale: "zh-CN",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { height: 900, width: 1440 },
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    // oxlint-disable-next-line no-await-in-loop
    const page = await ctx.newPage();
    const ourErrors: string[] = [];

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
      // oxlint-disable-next-line promise/avoid-new
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(
            new Error(`deadline exceeded (${SCENARIO_DEADLINE_MS / 1000}s)`)
          );
        }, SCENARIO_DEADLINE_MS);
      });
      // oxlint-disable-next-line no-await-in-loop
      await Promise.race([executeBody(page, sc, ourErrors), timeoutPromise]);

      return;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(
          `  ${C.yellow}RETRY${C.reset} ${sc.name} (${attempt}/${MAX_RETRIES}): ${(error as Error).message.slice(0, 120)}`
        );
        // oxlint-disable-next-line no-await-in-loop
        await delay(2000);
        continue;
      }
      record(
        sc.name,
        "scenario completed without throw",
        false,
        (error as Error).message
      );
    } finally {
      // oxlint-disable-next-line no-await-in-loop
      await page.close().catch(() => null);
    }
  }
  await ctx.close();
};

const reporter = new Reporter({ scenarios: SCENARIOS });
reporter.start();

process.on("SIGINT", () => {
  reporter.onSIGINT();
});

const timedRun = async (sc: Scenario): Promise<void> => {
  const start = Date.now();
  try {
    await runScenario(sc);
  } finally {
    const elapsed = Math.round((Date.now() - start) / 1000);
    reporter.scenarioDone(sc.name, elapsed);
  }
};

await Promise.allSettled(SCENARIOS.map(timedRun));
await browser.close();

printSummary();
if (hasFailures()) {
  process.exit(1);
}
process.exit(0);
