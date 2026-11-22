import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";

import { gmShim, injectAfterLoad } from "../qa/constants";
import { comparisonInBrowser } from "./image-comparison";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FIXTURE_PATH = path.join(ROOT, "tests/fixtures/movie-home.html");
const BASELINE_DIR = path.join(ROOT, "tests/visual/baselines");
const OUTPUT_DIR = "/private/tmp/douban-plus-movie-home-visual";
const UPDATE_BASELINES = process.argv.includes("--update");
const PIXEL_RATIO_THRESHOLD = 0.01;
const STATIC_IMAGE =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const projectRequire = createRequire(import.meta.url);
const monkeyRequire = createRequire(
  projectRequire.resolve("vite-plugin-monkey/package.json")
);
const SYSTEMJS_PATHS = [
  monkeyRequire.resolve("systemjs/dist/system.min.js"),
  monkeyRequire.resolve("systemjs/dist/extras/named-register.min.js"),
] as const;

const VIEWPORTS = [
  { name: "desktop-1024", width: 1024, height: 1200 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

const stabilizePage = async (page: Page): Promise<void> => {
  await page.waitForSelector("#atv-douban-root .atv-movie-home", {
    state: "attached",
  });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition: none !important;
      }

      .atv-section-reveal {
        opacity: 1 !important;
        transform: none !important;
      }

      #atv-douban-root {
        opacity: 1 !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) {
      image.loading = "eager";
    }
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => null))
    );
    window.scrollTo(0, 0);
  });
};

const runViewport = async (
  context: BrowserContext,
  viewport: (typeof VIEWPORTS)[number],
  injectedScript: string
): Promise<string | null> => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  try {
    await page.setViewportSize({
      height: viewport.height,
      width: viewport.width,
    });
    await page.goto("https://movie.douban.com/", {
      waitUntil: "domcontentloaded",
    });
    console.log(`${viewport.name}: fixture loaded`);
    await page.addScriptTag({ content: injectedScript });
    console.log(`${viewport.name}: userscript injected`);
    try {
      await stabilizePage(page);
      console.log(`${viewport.name}: page stabilized`);
      const layout = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
      }));
      console.log(`${viewport.name}: layout ${layout.width}x${layout.height}`);
      if (layout.height > 10_000 || layout.width > viewport.width) {
        throw new Error(
          `${viewport.name} layout overflowed to ${layout.width}x${layout.height}`
        );
      }
    } catch (error) {
      throw new Error(
        `${viewport.name} did not mount the movie homepage. ${errors.join(" | ")}`,
        { cause: error }
      );
    }
    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });
    console.log(`${viewport.name}: screenshot captured`);
    await writeFile(path.join(OUTPUT_DIR, `${viewport.name}.png`), screenshot);

    const baselinePath = path.join(
      BASELINE_DIR,
      `movie-home-${viewport.name}.png`
    );
    if (UPDATE_BASELINES) {
      await writeFile(baselinePath, screenshot);
      console.log(`Updated ${path.relative(ROOT, baselinePath)}`);
      return null;
    }
    if (!existsSync(baselinePath)) {
      return `${viewport.name}: missing ${path.relative(ROOT, baselinePath)}`;
    }

    const comparison = await comparisonInBrowser(
      page,
      await readFile(baselinePath),
      screenshot
    );
    console.log(
      `${viewport.name}: ${(comparison.changedRatio * 100).toFixed(2)}% pixels changed`
    );
    return !comparison.matchingDimensions ||
      comparison.changedRatio > PIXEL_RATIO_THRESHOLD
      ? `${viewport.name}: ${(comparison.changedRatio * 100).toFixed(2)}% pixels changed`
      : null;
  } finally {
    await page.close();
  }
};

const run = async (): Promise<void> => {
  const [fixture, ...systemSources] = await Promise.all([
    readFile(FIXTURE_PATH, "utf-8"),
    ...SYSTEMJS_PATHS.map((systemPath) => readFile(systemPath, "utf-8")),
  ]);
  const injectedScript = `${systemSources.join("\n")}\n${gmShim}\n${injectAfterLoad}`;
  await mkdir(BASELINE_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    locale: "zh-CN",
    reducedMotion: "reduce",
  });

  await context.route("**/*", (route) => {
    if (
      route.request().url() === "https://movie.douban.com/" &&
      route.request().resourceType() === "document"
    ) {
      return route.fulfill({
        body: fixture,
        contentType: "text/html; charset=utf-8",
        status: 200,
      });
    }
    if (route.request().resourceType() === "image") {
      return route.fulfill({
        body: Buffer.from(STATIC_IMAGE, "base64"),
        contentType: "image/png",
        status: 200,
      });
    }
    return route.abort();
  });

  try {
    const results = await Promise.all(
      VIEWPORTS.map((viewport) =>
        runViewport(context, viewport, injectedScript)
      )
    );
    const failures = results.filter((result): result is string =>
      Boolean(result)
    );
    if (failures.length > 0) {
      throw new Error(
        `Movie-home visual baseline failed\n${failures.join("\n")}`
      );
    }
  } finally {
    await context.close();
    await browser.close();
  }
};

await run();
