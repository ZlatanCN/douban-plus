import type { Page } from "playwright";

import { TIMEOUT_CONTENT_READY } from "./constants";
import { record, recordWarn } from "./logger";
import type { AssertCtx, WarningCategory } from "./types";

const ROOT_SEL = "#atv-douban-root";

const fail = (ctx: AssertCtx, name: string, detail = ""): void => {
  record(ctx.scenario.name, name, false, detail);
};

const warn = (
  ctx: AssertCtx,
  category: WarningCategory,
  name: string,
  detail = ""
): void => {
  recordWarn(ctx.scenario.name, category, name, detail);
};

const waitForGone = async (page: Page, selector: string): Promise<boolean> => {
  try {
    await page.waitForFunction(
      (sel) => !document.querySelector(sel),
      selector,
      {
        timeout: TIMEOUT_CONTENT_READY,
      }
    );
    return true;
  } catch {
    return false;
  }
};

const closeIfPresent = async (page: Page, selector: string): Promise<void> => {
  const el = await page.$(selector);
  if (!el) {
    return;
  }
  await el.click().catch(() => null);
};

const clearOpenOverlays = async (page: Page): Promise<void> => {
  await page.keyboard.press("Escape").catch(() => null);
  await Promise.all([
    waitForGone(page, "#atv-comment-overlay"),
    waitForGone(page, "#atv-interest-modal"),
    waitForGone(page, "#atv-review-modal"),
    waitForGone(page, "#atv-poster-modal"),
    waitForGone(page, "#atv-video-modal"),
  ]);
};

const clearExternalDoubanOverlays = async (page: Page): Promise<void> => {
  await page.keyboard.press("Escape").catch(() => null);
  await page.evaluate(`(() => {
    const isFixedOverlay = (el) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const zIndex = Number.parseInt(style.zIndex || "0", 10);
      return (
        style.position === "fixed" &&
        zIndex >= 1000 &&
        rect.width > window.innerWidth * 0.4 &&
        rect.height > window.innerHeight * 0.25
      );
    };

    const findOverlayRoot = (el) => {
      let current = el;
      while (current && current !== document.body) {
        if (isFixedOverlay(current)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    const findCompactDialogRoot = (el) => {
      let current = el;
      let best = null;
      while (current && current !== document.body) {
        if (current instanceof HTMLElement) {
          const rect = current.getBoundingClientRect();
          const text = current.textContent || "";
          if (
            rect.width >= 240 &&
            rect.width <= 720 &&
            rect.height >= 160 &&
            rect.height <= 720 &&
            text.length <= 1200
          ) {
            best = current;
          }
        }
        current = current.parentElement;
      }
      return best;
    };

    const authTextRe = new RegExp(
      "短信登录/注册|密码登录|海外手机登录|社交帐号登录|登录豆瓣",
      "u"
    );
    for (const el of document.body.querySelectorAll("*")) {
      if (!authTextRe.test(el.textContent || "")) {
        continue;
      }
      const root = findOverlayRoot(el) || findCompactDialogRoot(el);
      root?.remove();
    }

    for (const el of document.body.querySelectorAll(
      ".account_pop, .account-pop, .account-form, .login-modal, .dui-dialog, .ui-dialog"
    )) {
      const root = findOverlayRoot(el) || findCompactDialogRoot(el);
      root?.remove();
    }

    for (const el of document.body.querySelectorAll("*")) {
      if (
        el.id === "atv-douban-root" ||
        el.contains(document.querySelector("#atv-douban-root"))
      ) {
        continue;
      }
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const zIndex = Number.parseInt(style.zIndex || "0", 10);
      const blocksViewport =
        (style.position === "fixed" || style.position === "absolute") &&
        zIndex >= 10 &&
        rect.width >= window.innerWidth * 0.9 &&
        rect.height >= window.innerHeight * 0.9 &&
        Number.parseFloat(style.opacity || "1") > 0.05 &&
        style.display !== "none" &&
        style.visibility !== "hidden";
      if (blocksViewport) {
        el.remove();
      }
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  })()`);
};

export {
  ROOT_SEL,
  clearExternalDoubanOverlays,
  clearOpenOverlays,
  closeIfPresent,
  fail,
  waitForGone,
  warn,
};
