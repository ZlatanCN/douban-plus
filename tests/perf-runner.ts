// Standalone performance and visual regression runner.
// Usage: pnpm run tsx tests/perf-runner.ts
// Sequential test scenarios require await inside loops.
/* eslint-disable no-await-in-loop */

import { setTimeout as sleep } from "node:timers/promises";

import { chromium } from "playwright";
import type { Page } from "playwright";

/* ── Jank monitor injected into the page ── */

const JANK_MONITOR = `
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
    start() { deltas.length = 0; running = true; lastTime = 0; rafId = requestAnimationFrame(tick); },
    stop() { running = false; if (rafId) cancelAnimationFrame(rafId); },
    report() {
      if (deltas.length === 0) return { totalFrames: 0, avgFps: 0, dropped: 0, jankPct: 0, deltas: [] };
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const avgFps = Math.round(1000 / avgDelta);
      const dropped = deltas.filter(d => d > 32).length;   // <31fps
      const jankPct = Math.round((dropped / deltas.length) * 1000) / 10;
      return { totalFrames: deltas.length, avgFps, dropped, jankPct, deltas };
    }
  };
})();
`;

/* ── Pages to test ── */

const TEST_PAGES = [
  {
    kind: "movie",
    name: "movie-wandering-earth-2",
    url: "https://movie.douban.com/subject/35267208/",
  },
  {
    kind: "movie",
    name: "movie-shawshank",
    url: "https://movie.douban.com/subject/1292052/",
  },
  {
    kind: "movie",
    name: "movie-spirited-away",
    url: "https://movie.douban.com/subject/1291561/",
  },
  {
    kind: "tv",
    name: "tv-got-s1",
    url: "https://movie.douban.com/subject/3016187/",
  },
] as const;

/* ── Thresholds ── */

// <1% jank = pass
const PASS = { avgFpsMin: 55, jankPctMax: 1 };
// <2.5% = warn (acceptable)
const WARN = { avgFpsMin: 48, jankPctMax: 2.5 };

/* ── Helpers ── */

const startMonitor = (page: Page) => page.evaluate("window.__atvPerf.start()");
const getReport = (page: Page) =>
  page.evaluate(() =>
    (
      (window as unknown as Record<string, unknown>).__atvPerf as {
        report: () => {
          totalFrames: number;
          avgFps: number;
          dropped: number;
          jankPct: number;
          deltas: number[];
        };
      }
    ).report()
  ) as Promise<{
    totalFrames: number;
    avgFps: number;
    dropped: number;
    jankPct: number;
    deltas: number[];
  }>;

const scrollTo = (page: Page, top: number) =>
  page.evaluate((y) => window.scrollTo({ behavior: "auto", top: y }), top);

/* ── Inject userscript ── */

const GM_SHIM = `
window.GM_addStyle = function(css) {
  const s = document.createElement('style');
  s.textContent = css;
  s.setAttribute('data-atv-shim', '1');
  (document.head || document.documentElement).appendChild(s);
  return s;
};
window.GM_xmlhttpRequest = function(details) {
  console.log('[gmShim] GM_xmlhttpRequest ' + (details.method || 'GET') + ' ' + (details.url || ''));
  if (typeof details.onload === 'function') {
    details.onload({ responseText: '{}', status: 200 });
  }
};
`;

/* ── Metrics ── */

type Metrics = {
  label: string;
  avgFps: number;
  dropped: number;
  jankPct: number;
  totalFrames: number;
  pass: "PASS" | "WARN" | "FAIL";
};

const allMetrics: Metrics[] = [];

const measure = async (
  page: Page,
  label: string,
  fn: () => Promise<void>
): Promise<Metrics> => {
  await startMonitor(page);
  await fn();
  const r = await getReport(page);
  let passLevel: Metrics["pass"];
  if (r.avgFps >= PASS.avgFpsMin && r.jankPct <= PASS.jankPctMax) {
    passLevel = "PASS";
  } else if (r.avgFps >= WARN.avgFpsMin && r.jankPct <= WARN.jankPctMax) {
    passLevel = "WARN";
  } else {
    passLevel = "FAIL";
  }
  const m: Metrics = {
    avgFps: r.avgFps,
    dropped: r.dropped,
    jankPct: r.jankPct,
    label,
    pass: passLevel,
    totalFrames: r.totalFrames,
  };
  allMetrics.push(m);
  return m;
};

/* ── Scenarios per page ── */

const SCENARIOS: Record<string, (page: Page) => Promise<void>> = {
  /* ═══════════════════════════════════════════════════════════════
     基 准 场 景 （保留原有的 8 个）
     ═══════════════════════════════════════════════════════════════ */

  /* ① Slow scroll 0→bottom→0 */
  "①slow-scroll": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const steps = 20;
    for (let i = 1; i <= steps; i += 1) {
      await scrollTo(page, (maxY / steps) * i);
      await sleep(100);
    }
    for (let i = steps; i >= 0; i -= 1) {
      await scrollTo(page, (maxY / steps) * i);
      await sleep(80);
    }
  },

  /* ② Fast scroll full page */
  "②fast-scroll": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    // 6 cycles to accumulate ~60 frames so a single slow frame doesn't spike jank %
    for (let i = 0; i < 6; i += 1) {
      await scrollTo(page, maxY);
      await sleep(50);
      await scrollTo(page, 0);
      await sleep(50);
    }
  },

  /* ③ Nav threshold 200↔600 ×12 */
  "③nav-threshold-x12": async (page) => {
    for (let i = 0; i < 12; i += 1) {
      await scrollTo(page, 200);
      await sleep(20);
      await scrollTo(page, 600);
      await sleep(20);
    }
  },

  /* ④ Section nav jump */
  "④section-jump": async (page) => {
    const ids = [
      "atv-series",
      "atv-cast",
      "atv-photos",
      "atv-reviews",
      "atv-comments",
    ];
    for (const id of ids) {
      const el = await page.$(`#${id}`);
      if (el) {
        await el.scrollIntoViewIfNeeded();
        await sleep(50);
      }
    }
  },

  /* ⑤ Horizontal carousel scroll */
  "⑤carousel-scroll": async (page) => {
    const carousels = await page.$$(".atv-carousel");
    for (const c of carousels) {
      const box = await c.boundingBox();
      if (box && box.width > 200) {
        for (let sx = 100; sx < Math.min(box.width * 2, 1200); sx += 200) {
          await page.evaluate((x) => {
            const els = document.querySelectorAll(".atv-carousel");
            for (const el of els) {
              (el as HTMLElement).scrollLeft = x;
            }
          }, sx);
          await sleep(20);
        }
      }
    }
  },

  /* ⑥ Vertical + horizontal simultaneous */
  "⑥vert+horiz-simult": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    for (let i = 1; i <= 10; i += 1) {
      await scrollTo(page, (maxY / 10) * i);
      await page.evaluate(() => {
        const els = document.querySelectorAll(".atv-carousel");
        for (const el of els) {
          (el as HTMLElement).scrollLeft += 80;
        }
      });
      await sleep(40);
    }
  },

  /* ⑦ High-frequency micro-scroll ×20 */
  "⑦micro-scroll-x20": async (page) => {
    for (let i = 0; i < 20; i += 1) {
      await scrollTo(page, 290 + Math.sin(i) * 15);
      await sleep(6);
    }
  },

  /* ⑧ Mobile viewport 375×812 */
  "⑧mobile-scroll": async (page) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await sleep(200);
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    await scrollTo(page, Math.min(maxY, 2000));
    await sleep(80);
    await scrollTo(page, 0);
    await sleep(80);
    await scrollTo(page, Math.min(maxY, 1000));
    await sleep(80);
    await scrollTo(page, 0);
    await page.setViewportSize({ height: 900, width: 1440 });
    await sleep(100);
  },

  /* ═══════════════════════════════════════════════════════════════
     缺 口 1 — 方 向 与 时 序
     ═══════════════════════════════════════════════════════════════ */

  /* ⑨ 方向反复横跳: 快速 ⬇⬆⬇⬆ 半页振荡 ×8 */
  "⑨dir-reversal-x8": async (page) => {
    const halfY = await page.evaluate(() =>
      Math.max(
        Math.round((document.body.scrollHeight - window.innerHeight) / 2),
        500
      )
    );
    for (let i = 0; i < 8; i += 1) {
      await sleep(15);
      await scrollTo(page, halfY - 200);
      await sleep(15);
    }
  },

  /* ⑩ 离散大跳: 键盘 PageDown/PageUp/Home/End 模拟 */
  "⑩keyboard-pgdn-pgup": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    // PageDown ×4
    for (let i = 1; i <= 4; i += 1) {
      await scrollTo(page, Math.min(i * 700, maxY));
      await sleep(30);
    }
    for (let i = 4; i >= 1; i -= 1) {
      await scrollTo(page, Math.max((i - 1) * 700, 0));
      await sleep(30);
    }
    // Home
    await scrollTo(page, 0);
    await sleep(30);
    // End
    await scrollTo(page, maxY);
    await sleep(30);
  },

  /* ⑪ 底边反弹: 在底部和一屏上之间快速振荡 */
  "⑪bottom-bounce-x6": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const oneScreenUp = Math.max(maxY - 800, 0);
    for (let i = 0; i < 6; i += 1) {
      await sleep(15);
      await scrollTo(page, oneScreenUp);
      await sleep(15);
    }
  },

  /* ⑫ 惯性衰减模拟: 触控板 flick 后自然减速 */
  "⑫inertia-decay": async (page) => {
    await scrollTo(page, 0);
    await sleep(100);
    // 模拟 flick: 起手 500px → 指数衰减 ×8
    let delta = 500;
    let pos = 0;
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    for (let i = 0; i < 12; i += 1) {
      pos = Math.min(pos + delta, maxY);
      await scrollTo(page, pos);
      await sleep(16);
      // 指数衰减
      delta *= 0.65;
    }
    // 等待惯性完全停止
    await sleep(300);
  },

  /* ⑬ 触屏 flick 模拟: 先加速再急停 */
  "⑬touch-flick-stop": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    // 加速段: 快速小步 → 大步
    for (let i = 1; i <= 5; i += 1) {
      await scrollTo(page, Math.min(i * 300, maxY));
      await sleep(8);
    }
    // 急停: 立刻回顶部
    await sleep(16);
    await scrollTo(page, 0);
    await sleep(30);
  },

  /* ═══════════════════════════════════════════════════════════════
     缺 口 2 — 页 面 状 态 干 涉
     ═══════════════════════════════════════════════════════════════ */

  /* ⑭ 冷启动立即滚动: 页面刚挂载就滚 */
  "⑭cold-scroll-immediate": async (page) => {
    // 不等待 is-loaded, 直接滚
    await scrollTo(page, 800);
    await sleep(50);
    await scrollTo(page, 0);
    await sleep(50);
    await scrollTo(page, 400);
  },

  /* ⑮ 切换标签页后恢复滚动 */
  "⑮tab-switch-resume": async (page) => {
    await scrollTo(page, 800);
    await sleep(30);
    // 模拟切换标签页 (visibilitychange → hidden)
    await page.evaluate(`(function(){
      Object.defineProperty(document, "hidden", { configurable: true, get: function(){ return true } });
      document.dispatchEvent(new Event("visibilitychange"));
    })()`);
    // "离开" 500ms
    await sleep(500);
    await page.evaluate(`(function(){
      Object.defineProperty(document, "hidden", { configurable: true, get: function(){ return false } });
      document.dispatchEvent(new Event("visibilitychange"));
    })()`);
    await sleep(50);
    // 恢复滚动
    await scrollTo(page, 0);
    await sleep(50);
    await scrollTo(page, 1500);
  },

  /* ⑯ Scroll + hover: 滚动中鼠标经过触发 hover */
  "⑯scroll+hover": async (page) => {
    await scrollTo(page, 0);
    await sleep(50);
    // 边滚边移动鼠标经过卡片
    for (let i = 0; i <= 10; i += 1) {
      const y = i * 200;
      await scrollTo(page, y);
      // 鼠标放在右侧大约卡片区域
      await page.mouse.move(300 + (i % 3) * 200, 400);
      await sleep(20);
    }
    // 滚回顶部
    await scrollTo(page, 0);
    await sleep(50);
    await scrollTo(page, 1800);
  },

  /* ⑰ 超时疲劳滚动: 持续滚动 8s */
  "⑰fatigue-8s": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const start = Date.now();
    let dir = 1;
    let pos = 0;
    while (Date.now() - start < 8000) {
      pos += dir * 120;
      if (pos >= maxY) {
        pos = maxY;
        dir = -1;
      }
      if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      await scrollTo(page, pos);
      await sleep(16);
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     缺 口 3 — 极 端 输 入
     ═══════════════════════════════════════════════════════════════ */

  /* ⑱ 滚轮加速尖峰: deltaMode=2 (page), 超大跨步 */
  "⑱wheel-spike": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    // 模拟 3 次大跨步滚轮 (≈ 翻三页)
    await scrollTo(page, Math.min(maxY, 2500));
    await sleep(20);
    await scrollTo(page, Math.min(maxY, 5000));
    await sleep(20);
    await scrollTo(page, 0);
    await sleep(20);
  },

  /* ⑲ Scroll 事件洪水: 10ms 内 50 次 scrollTo */
  "⑲scroll-event-flood": async (page) => {
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    const positions = Array.from({ length: 50 }, () =>
      Math.round(Math.random() * maxY)
    );
    for (const pos of positions) {
      await scrollTo(page, pos);
    }
    await sleep(100);
  },

  /* ⑳ 窗口 resize 过程中滚动 */
  "⑳resize+scroll": async (page) => {
    await scrollTo(page, 600);
    await sleep(30);
    // 变窄
    await page.setViewportSize({ height: 900, width: 768 });
    await sleep(100);
    await scrollTo(page, 0);
    await sleep(30);
    await scrollTo(page, 1200);
    await sleep(30);
    // 变宽
    await page.setViewportSize({ height: 900, width: 1440 });
    await sleep(100);
    await scrollTo(page, 0);
    await sleep(30);
    await scrollTo(page, 800);
  },

  /* ㉑ 减少动效 prefers-reduced-motion */
  "㉑reduced-motion-scroll": async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await sleep(100);
    const maxY = await page.evaluate(() =>
      Math.max(document.body.scrollHeight - window.innerHeight, 1000)
    );
    await scrollTo(page, maxY);
    await sleep(50);
    await scrollTo(page, 0);
    await sleep(50);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await sleep(100);
  },
};

/* ── Printable bar ── */

const bar = (pct: number, w = 15): string => {
  const filled = Math.round((pct / 100) * w);
  const empty = w - filled;
  return "█".repeat(filled) + "░".repeat(empty);
};

/* ── Main ── */

const main = async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const scenarioKeys = Object.keys(SCENARIOS);

  console.log(`\n  ${"═".repeat(68)}`);
  console.log(`  DOUBAN PLUS — PERFORMANCE & VISUAL REGRESSION`);
  console.log(`  ${"═".repeat(68)}`);
  console.log(
    `  Pages: ${TEST_PAGES.length}  |  Scenarios: ${scenarioKeys.length}  |  Total: ${TEST_PAGES.length * scenarioKeys.length} runs`
  );
  console.log(`  ${"═".repeat(68)}\n`);

  for (const pageInfo of TEST_PAGES) {
    console.log(`  ── [${pageInfo.kind}] ${pageInfo.name} ──`);
    const context = await browser.newContext({
      locale: "zh-CN",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { height: 900, width: 1440 },
    });
    const page = await context.newPage();

    // Load page
    await page.goto(pageInfo.url, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForSelector("#content", { timeout: 30_000 })
      .catch(() => null);

    // Inject shim + userscript + jank monitor
    const fs = await import("node:fs");
    const userscriptRaw = fs.readFileSync("dist/douban-plus.user.js", "utf-8");
    const injectAfterLoad = userscriptRaw.replace(
      /^\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\n?/mu,
      ""
    );
    await page.addScriptTag({ content: `${GM_SHIM}\n${injectAfterLoad}` });
    await page.waitForSelector("#atv-douban-root", { timeout: 30_000 });
    // Verify ATV app is mounted (confirm injection took effect)
    const atvConfirmed = await page.evaluate(() => {
      const root = document.querySelector("#atv-douban-root");
      const hero = document.querySelector(".atv-hero");
      const stickyNav = document.querySelector(".atv-stickynav");
      return {
        heroExists: !!hero,
        rootChildren: root ? root.children.length : 0,
        rootExists: !!root,
        stickyNavExists: !!stickyNav,
      };
    });
    if (!atvConfirmed.heroExists) {
      throw new Error(
        `ATV app not mounted — hero missing. root=${atvConfirmed.rootExists} children=${atvConfirmed.rootChildren}`
      );
    }
    console.log(
      `  \u001B[2m    [injected] root=${atvConfirmed.rootExists} hero=${atvConfirmed.heroExists} nav=${atvConfirmed.stickyNavExists} children=${atvConfirmed.rootChildren}\u001B[0m`
    );

    await page
      .waitForSelector(".atv-hero-still.is-loaded", { timeout: 15_000 })
      .catch(() => null);
    await page.evaluate(JANK_MONITOR);

    let pagePassed = 0;
    let pageTotal = 0;
    const pageStart = Date.now();

    for (const [label, fn] of Object.entries(SCENARIOS)) {
      try {
        const m = await measure(page, label, () => fn(page));
        pageTotal += 1;
        if (m.pass !== "FAIL") {
          pagePassed += 1;
        }

        let color: string;
        if (m.pass === "PASS") {
          color = "\u001B[32m";
        } else if (m.pass === "WARN") {
          color = "\u001B[33m";
        } else {
          color = "\u001B[31m";
        }
        console.log(
          `  ${color}${m.pass === "PASS" ? "✓" : "✗"}${"\u001B[0m"} ${label.padEnd(28)} ${color}${m.avgFps.toString().padStart(3)} fps\u001B[0m  dropped=${m.dropped}  jank=${String(m.jankPct).padStart(4)}%  ${bar(m.jankPct)}`
        );
      } catch (error) {
        console.log(
          `  \u001B[31m✗\u001B[0m ${label.padEnd(28)} \u001B[31mERROR: ${(error as Error).message.slice(0, 60)}\u001B[0m`
        );
      }
    }

    const elapsed = Math.round((Date.now() - pageStart) / 1000);
    const allPassed = pagePassed === pageTotal;
    const verdict = allPassed
      ? "\u001B[32mPASS\u001B[0m"
      : `\u001B[31m${pagePassed}/${pageTotal}\u001B[0m`;
    console.log(`  ${"─".repeat(50)}`);
    console.log(
      `  ${pageInfo.name}: ${verdict}  \u001B[2m${elapsed}s\u001B[0m\n`
    );

    await page.close();
    await context.close();
  }

  await browser.close();

  /* ── Summary table ── */
  console.log(`  ${"═".repeat(68)}`);
  console.log(`  SUMMARY`);
  console.log(`  ${"═".repeat(68)}`);

  const header = `  ${"Page".padEnd(30)} ${"Scen".padEnd(5)} ${"PASS".padEnd(6)} ${"WARN".padEnd(6)} ${"FAIL".padEnd(6)}`;
  console.log(`\n${header}`);
  console.log(`  ${"─".repeat(60)}`);

  const passCount = allMetrics.filter((m) => m.pass === "PASS").length;
  const warnCount = allMetrics.filter((m) => m.pass === "WARN").length;
  const failCount = allMetrics.filter((m) => m.pass === "FAIL").length;
  const totalAll = allMetrics.length;

  console.log(
    `  ${"TOTAL".padEnd(30)} ${String(totalAll).padEnd(5)} ${String(passCount).padEnd(6)} ${String(warnCount).padEnd(6)} ${String(failCount).padEnd(6)}`
  );
  console.log(`  ${"─".repeat(60)}`);
  console.log(
    `  Thresholds: avgFps ≥ ${PASS.avgFpsMin}  jank ≤ ${PASS.jankPctMax}% (PASS)  |  jank ≤ ${WARN.jankPctMax}% (WARN)`
  );
  console.log(`  ${"═".repeat(68)}\n`);

  process.exit(failCount > 0 ? 1 : 0);
};

main();
