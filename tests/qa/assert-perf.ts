// Sequential test scenarios require await inside loops.
/* eslint-disable no-await-in-loop */

import { setTimeout as wait } from "node:timers/promises";

import type { Page } from "playwright";

import { TIMEOUT_CONTENT_READY } from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

/* ── Jank monitor injected into the page ── */

const JANK_MONITOR_JS = `
window.__atvPerf = (() => {
  const deltas = [];
  let running = false;
  let lastTime = 0;
  let rafId = 0;

  function tick(now) {
    if (!running) return;
    if (lastTime !== 0) deltas.push(now - lastTime);
    lastTime = now;
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      deltas.length = 0;
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
    report() {
      if (deltas.length === 0) return { totalFrames: 0, avgFps: 0, dropped: 0, jankPct: 0 };
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const avgFps = Math.round(1000 / avgDelta);
      const dropped = deltas.filter(d => d > 32).length;
      // <31fps = dropped frame
      const jankPct = Math.round((dropped / deltas.length) * 1000) / 10;
      return { totalFrames: deltas.length, avgFps, dropped, jankPct };
    }
  };
})();
`;

/* ── Helpers ── */

type PerfResult = {
  totalFrames: number;
  avgFps: number;
  dropped: number;
  jankPct: number;
  label: string;
};

const PASS_THRESHOLDS = {
  avgFpsMin: 55,
  jankPctMax: 1,
};

const startMonitor = (page: Page) => page.evaluate("window.__atvPerf.start()");

const measure = async (
  ctx: AssertCtx,
  label: string,
  fn: () => Promise<void>
): Promise<PerfResult> => {
  const { page, scenario } = ctx;
  await startMonitor(page);
  await fn();
  const report = await page.evaluate(() => {
    const r = (window as unknown as Record<string, unknown>).__atvPerf as {
      stop: () => void;
      report: () => PerfResult;
    };
    r.stop();
    return r.report();
  });
  report.label = label;

  const pass =
    report.totalFrames > 0 &&
    report.avgFps >= PASS_THRESHOLDS.avgFpsMin &&
    report.jankPct <= PASS_THRESHOLDS.jankPctMax;

  record(
    scenario.name,
    `${label}: avgFps=${report.avgFps} dropped=${report.dropped} jank=${report.jankPct}% frames=${report.totalFrames}`,
    pass
  );
  return report;
};

const scrollTo = (
  page: Page,
  scrollY: number,
  behavior: ScrollBehavior = "auto"
) =>
  page.evaluate(({ y, b }) => window.scrollTo({ behavior: b, top: y }), {
    b: behavior,
    y: scrollY,
  });

/* ── Test runner ── */

const runPerfTestForPage = async (
  ctx: AssertCtx
): Promise<{
  passed: number;
  total: number;
  results: PerfResult[];
}> => {
  const { page } = ctx;
  const results: PerfResult[] = [];
  let passed = 0;
  let total = 0;

  const run = async (label: string, fn: () => Promise<void>): Promise<void> => {
    const r = await measure(ctx, label, fn);
    results.push(r);
    total += 1;
    if (
      r.avgFps >= PASS_THRESHOLDS.avgFpsMin &&
      r.jankPct <= PASS_THRESHOLDS.jankPctMax
    ) {
      passed += 1;
    }
  };

  // Wait for hero bg image to load before measuring
  await page
    .waitForSelector(".atv-hero-still.is-loaded", { timeout: 15_000 })
    .catch(() => null);

  /* ── ① Slow scroll 0→bottom→0 ── */
  await run("slow-scroll-full", async () => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const steps = 20;
    for (let i = 1; i <= steps; i += 1) {
      await scrollTo(page, Math.round((maxY / steps) * i));
      await wait(100);
    }
    for (let i = steps; i >= 0; i -= 1) {
      await scrollTo(page, Math.round((maxY / steps) * i));
      await wait(80);
    }
  });

  /* ── ② Fast scroll full page ── */
  await run("fast-scroll-full", async () => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    for (let i = 0; i < 6; i += 1) {
      await scrollTo(page, maxY);
      await wait(50);
      await scrollTo(page, 0);
      await wait(50);
    }
  });

  /* ── ③ Nav threshold 200↔600 ×12 ── */
  await run("nav-threshold-x12", async () => {
    for (let i = 0; i < 12; i += 1) {
      await wait(30);
      await scrollTo(page, 600);
      await wait(30);
    }
  });

  /* ── ④ Section nav jump ── */
  await run("section-nav-jump", async () => {
    const sections = [
      "atv-series",
      "atv-cast",
      "atv-photos",
      "atv-reviews",
      "atv-comments",
    ];
    for (const id of sections) {
      const el = await page.$(`#${id}`);
      if (el) {
        await el.scrollIntoViewIfNeeded();
        await wait(50);
      }
    }
  });

  /* ── ⑤ Horizontal carousel scroll ── */
  await run("carousel-scroll", async () => {
    const carousels = await page.$$(".atv-carousel");
    for (const carousel of carousels) {
      const box = await carousel.boundingBox();
      if (box && box.width > 200) {
        // Scroll right in chunks
        for (let sx = 100; sx < Math.min(box.width * 2, 1200); sx += 200) {
          await page.evaluate(
            ({ sel, x }) => {
              const el = document.querySelector(sel);
              if (el) {
                el.scrollLeft = x;
              }
            },
            { sel: ".atv-carousel", x: sx }
          );
          await wait(20);
        }
      }
    }
  });

  /* ── ⑥ Vertical + horizontal simultaneous ── */
  await run("vertical-horizontal-simultaneous", async () => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const steps = 10;
    for (let i = 1; i <= steps; i += 1) {
      await scrollTo(page, Math.round((maxY / steps) * i));
      const carousel = await page.$(".atv-carousel");
      if (carousel) {
        await page.evaluate((x) => {
          const el = document.querySelector(".atv-carousel");
          if (el) {
            el.scrollLeft += x;
          }
        }, 80);
      }
      await wait(50);
    }
  });

  /* ── ⑦ High-frequency micro-scroll ×20 ── */
  await run("micro-scroll-x20", async () => {
    for (let i = 0; i < 20; i += 1) {
      await wait(8);
    }
  });

  /* ── ⑧ Mobile viewport 375×812 ── */
  // Only run if current viewport is close to desktop; mobile test uses its own
  const vp = page.viewportSize();
  if (vp && vp.width >= 1024) {
    await run("mobile-viewport-scroll", async () => {
      // Set mobile viewport
      await page.setViewportSize({ height: 812, width: 375 });
      // let layout settle
      await wait(200);

      const maxY = await page.evaluate(() =>
        Math.max(document.body.scrollHeight - window.innerHeight, 1000)
      );
      await scrollTo(page, Math.min(maxY, 2000));
      await wait(100);
      await scrollTo(page, 0);
      await wait(100);
      await scrollTo(page, Math.min(maxY, 1000));
      await wait(100);
      await scrollTo(page, 0);

      // Restore desktop viewport
      await page.setViewportSize({ height: 900, width: 1440 });
    });
  }

  /* ── ⑨ Rapid scroll-up flash scenario (new) ── */
  await run("rapid-scroll-up-flash", async () => {
    await scrollTo(page, 1800);
    await wait(100);
    // Simulate rapid upward scroll
    for (let step = 0; step < 30; step += 1) {
      await page.evaluate(() => window.scrollBy(0, -70));
      await wait(4);
    }
    await wait(100);
  });

  return { passed, results, total };
};

/* ── Entry point ── */

const assertPerf = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;

  // Inject jank monitor once
  await page.evaluate(JANK_MONITOR_JS);

  // Wait for hero to render
  await page.waitForSelector(".atv-hero", { timeout: TIMEOUT_CONTENT_READY });

  const { passed, total } = await runPerfTestForPage(ctx);
  record(
    scenario.name,
    `performance: ${passed}/${total} scenarios passed`,
    passed === total,
    passed < total
      ? `${total - passed} scenario(s) exceeded jank threshold`
      : undefined
  );
};

export { assertPerf };
export type { PerfResult };
