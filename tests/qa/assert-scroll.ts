/* eslint-disable no-await-in-loop */

import { setTimeout as wait } from "node:timers/promises";

import { TIMEOUT_CONTENT_READY } from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

/**
 * Scroll flash regression test.
 *
 * Simulates a rapid upward scroll from below the hero to provoke the
 * compositor-layer ordering issue where the background still momentarily
 * renders above the overlay elements (vignette, overlay-x, overlay-y).
 *
 * The root cause is `will-change: transform, opacity` on .atv-hero-still:
 * the browser promotes these to GPU compositor layers, and combined with
 * negative z-indices within an `isolation: isolate` context, the compositor
 * can momentarily order the promoted layer above the overlays during fast
 * scrolling.
 */
const assertScrollFlash = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  // 1. Scroll to a position well below the hero (≈1800px so hero is off-screen)
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForFunction(() => window.scrollY >= 1750, {
    timeout: TIMEOUT_CONTENT_READY,
  });

  // 2. Rapid upward scroll — simulate a trackpad flick with many small steps
  //    30 steps × −70px = −2100px, roughly back to top in ~120ms
  for (let step = 0; step < 30; step += 1) {
    await page.evaluate(() => window.scrollBy(0, -70));
    // tiny yield to let the compositor process each delta
    await wait(4);
  }

  // 3. Wait for layout to settle after scroll
  await page.waitForTimeout(200);

  // 4. Check stacking order — verify isolation + z-index hierarchy is intact
  const stackingOk = await page.evaluate(() => {
    const hero = document.querySelector(".atv-hero");
    const bg = document.querySelector(".atv-hero-bg");
    const vignette = document.querySelector(".atv-hero-vignette");

    if (!hero || !bg || !vignette) {
      return { ok: false, reason: "missing hero elements" };
    }

    const heroCS = getComputedStyle(hero);
    const bgCS = getComputedStyle(bg);
    const vignetteCS = getComputedStyle(vignette);

    // isolation: isolate must be present to create the stacking context
    if (heroCS.isolation !== "isolate") {
      return { ok: false, reason: "hero isolation not set" };
    }

    // z-index: bg (-4) must be below vignette (-3)
    const bgZ = Math.trunc(Number(bgCS.zIndex));
    const vZ = Math.trunc(Number(vignetteCS.zIndex));
    if (bgZ >= vZ) {
      return {
        ok: false,
        reason: `bg z-index (${bgZ}) not below vignette (${vZ})`,
      };
    }

    return { ok: true, reason: "stacking order correct" };
  });

  record(
    scenario.name,
    `hero stacking after rapid scroll-up: ${stackingOk.reason}`,
    stackingOk.ok
  );

  // 5. Check that .atv-hero-still does NOT have `will-change`.
  //    will-change promotes to a GPU compositor layer; with negative z-index
  //    and isolation: isolate, the compositor can mis-order layers for a frame.
  const willChangeOk = await page.evaluate(() => {
    const stills = document.querySelectorAll<HTMLElement>(".atv-hero-still");
    if (!stills.length) {
      return { ok: true, reason: "no still elements" };
    }

    for (const el of stills) {
      const wc = getComputedStyle(el).willChange;
      if (wc && wc !== "auto") {
        return {
          ok: false,
          reason: `will-change: ${wc} on .atv-hero-still`,
        };
      }
    }
    return { ok: true, reason: "will-change absent on stills" };
  });

  record(
    scenario.name,
    `hero still will-change check: ${willChangeOk.reason}`,
    willChangeOk.ok
  );

  // 6. Scroll back to top cleanly for subsequent assertions
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, {
    timeout: TIMEOUT_CONTENT_READY,
  });
};

export { assertScrollFlash };
