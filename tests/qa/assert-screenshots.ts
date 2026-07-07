import { readdirSync, unlinkSync } from "node:fs";
import path from "node:path";

import {
  clearExternalDoubanOverlays,
  clearOpenOverlays,
} from "./assert-helpers";
import { SCREENSHOT_DIR, TIMEOUT_CONTENT_READY } from "./constants";
import { record } from "./logger";
import type { AssertCtx, Scenario } from "./types";

const SCREENSHOT_SUFFIXES = ["full", "hero", "mobile"] as const;

const parseScreenshotName = (
  fileName: string
): { scenarioName: string; suffix: string } | null => {
  if (!fileName.endsWith(".png")) {
    return null;
  }

  for (const suffix of SCREENSHOT_SUFFIXES) {
    const tail = `-${suffix}.png`;
    if (fileName.endsWith(tail)) {
      return {
        scenarioName: fileName.slice(0, -tail.length),
        suffix,
      };
    }
  }

  return null;
};

const cleanupStaleScreenshots = (scenarios: Scenario[]): void => {
  const currentScenarios = new Set(scenarios.map((scenario) => scenario.name));

  for (const fileName of readdirSync(SCREENSHOT_DIR)) {
    const parsed = parseScreenshotName(fileName);
    if (!parsed || currentScenarios.has(parsed.scenarioName)) {
      continue;
    }

    unlinkSync(path.join(SCREENSHOT_DIR, fileName));
  }
};

const captureScreenshots = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  await clearOpenOverlays(page);
  await clearExternalDoubanOverlays(page);

  const hasExternalLoginModal = await page
    .getByText(/短信登录\/注册|密码登录|海外手机登录|社交帐号登录|登录豆瓣/u)
    .first()
    .isVisible()
    .catch(() => false);
  record(
    scenario.name,
    "screenshots are free of Douban login modal",
    !hasExternalLoginModal
  );
  const hasExternalViewportBlocker = await page.evaluate(() => {
    const root = document.querySelector("#atv-douban-root");
    for (const el of document.body.querySelectorAll("*")) {
      if (
        !(el instanceof HTMLElement) ||
        el === root ||
        el.contains(root) ||
        root?.contains(el)
      ) {
        continue;
      }

      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const zIndex = Number.parseInt(style.zIndex || "0", 10);
      if (
        (style.position === "fixed" || style.position === "absolute") &&
        zIndex >= 10 &&
        rect.width >= window.innerWidth * 0.9 &&
        rect.height >= window.innerHeight * 0.9 &&
        Number.parseFloat(style.opacity || "1") > 0.05 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      ) {
        return true;
      }
    }
    return false;
  });
  record(
    scenario.name,
    "screenshots are free of external viewport blockers",
    !hasExternalViewportBlocker
  );

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

export { captureScreenshots, cleanupStaleScreenshots };
