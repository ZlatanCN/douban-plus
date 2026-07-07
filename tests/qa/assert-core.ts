import { ROOT_SEL, warn } from "./assert-helpers";
import {
  IMDB_LINK_REGEX,
  SCROLL_TEST_POSITION,
  STICKY_NAV_HIDDEN_REGEX,
  STICKY_NAV_MIN_OPACITY,
  TIMEOUT_CONTENT_READY,
  TV_EPISODE_REGEX,
} from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

const assertRoot = async ({ page, scenario }: AssertCtx): Promise<void> => {
  let ok;
  try {
    await page.waitForSelector(ROOT_SEL, { timeout: TIMEOUT_CONTENT_READY });
    ok = true;
  } catch {
    ok = false;
  }
  record(scenario.name, "root #atv-douban-root injected", ok);
};

const assertHero = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const hasHero = (await page.$(`${ROOT_SEL} .atv-hero`)) !== null;
  record(scenario.name, "hero section rendered", hasHero);

  const heroStill = await page
    .waitForSelector(`${ROOT_SEL} .atv-hero-still.is-loaded`, {
      timeout: 10_000,
    })
    .catch(() => null);
  record(scenario.name, "hero bg image loaded", heroStill !== null);

  const titleText = await page
    .$eval(`${ROOT_SEL} .atv-hero-title`, (el) => el.textContent.trim())
    .catch(() => "");
  record(
    scenario.name,
    `hero title non-empty (got: "${titleText.slice(0, 40)}")`,
    titleText.length > 0
  );
};

const assertRating = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const panel = await page.$(`${ROOT_SEL} .atv-rating-panel`);
  if (!panel) {
    record(scenario.name, "rating panel present", false);
    return;
  }
  const scoreEl = await page.$(`${ROOT_SEL} .atv-rating-panel-score`);
  const emptyEl = await page.$(`${ROOT_SEL} .atv-rating-empty`);

  const found = scoreEl || emptyEl;
  const text = found
    ? await found.evaluate((el) => el.textContent.trim()).catch(() => "")
    : "";
  record(
    scenario.name,
    `rating panel rendered (got: "${text.slice(0, 20)}")`,
    found !== null
  );
};

const assertTVMeta = async ({ page, scenario }: AssertCtx): Promise<void> => {
  if (scenario.kind !== "tv") {
    return;
  }
  const heroMeta = await page
    .$eval(`${ROOT_SEL} .atv-hero-meta`, (el) => el.textContent)
    .catch(() => "");
  record(
    scenario.name,
    `TV hero meta contains 集 or 季 (got: "${heroMeta.slice(0, 80)}")`,
    TV_EPISODE_REGEX.test(heroMeta)
  );
};

const assertIMDb = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const imdbLink = await page
    .$eval(
      `${ROOT_SEL} a[href*="imdb.com"]`,
      (a) => (a as HTMLAnchorElement).href
    )
    .catch(() => null);
  if (imdbLink) {
    record(
      scenario.name,
      `IMDb link present (${imdbLink.slice(0, 50)})`,
      IMDB_LINK_REGEX.test(imdbLink)
    );
  } else {
    warn(ctx, "data-missing", "no IMDb link found");
  }
};

const assertNoScriptErrors = (ctx: AssertCtx): void => {
  const { scenario, ourErrors } = ctx;
  record(
    scenario.name,
    `no script-originated errors (count: ${ourErrors.length})`,
    ourErrors.length === 0,
    ourErrors.slice(0, 2).join(" | ")
  );
};

const assertSummaryTeaser = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const teaserText = await page
    .$eval(`${ROOT_SEL} .atv-hero-teaser`, (el) => el.textContent?.trim() || "")
    .catch(() => "");
  record(
    scenario.name,
    `summary teaser non-empty (len:${teaserText.length})`,
    teaserText.length > 0
  );
};

const assertStickyNav = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  await page.evaluate(
    (scrollPos) => window.scrollTo(0, scrollPos),
    SCROLL_TEST_POSITION
  );
  await page.waitForFunction(
    () => {
      const nav = document.querySelector(".atv-stickynav");
      if (!nav) {
        return false;
      }
      const cs = getComputedStyle(nav);
      const rect = nav.getBoundingClientRect();
      return (
        cs.position === "fixed" &&
        Math.round(rect.top) <= 2 &&
        Number.parseFloat(cs.opacity) > 0.8
      );
    },
    { timeout: TIMEOUT_CONTENT_READY }
  );
  const navState = await page.evaluate(() => {
    const nav = document.querySelector(".atv-stickynav");
    if (!nav) {
      return null;
    }
    const cs = getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    const titleEl = nav.querySelector(".atv-stickynav-title");
    const titleCs = titleEl ? getComputedStyle(titleEl) : null;
    return {
      opacity: Number.parseFloat(cs.opacity),
      position: cs.position,
      rectTop: Math.round(rect.top),
      title: titleEl?.textContent?.trim() || "",
      titleColor: titleCs?.color || "",
      titleVisible: titleCs
        ? titleCs.visibility === "visible" &&
          Number.parseFloat(titleCs.opacity || "1") > 0
        : false,
    };
  });
  if (navState) {
    record(
      scenario.name,
      `sticky nav fixed at top after scroll (pos:${navState.position}, top:${navState.rectTop}px, opacity:${navState.opacity})`,
      navState.position === "fixed" &&
        Math.abs(navState.rectTop) <= 2 &&
        navState.opacity > STICKY_NAV_MIN_OPACITY
    );
    record(
      scenario.name,
      `sticky nav title VISIBLE (text:"${navState.title.slice(0, 12)}", color:${navState.titleColor})`,
      navState.title.length > 0 &&
        navState.titleVisible &&
        !STICKY_NAV_HIDDEN_REGEX.test(navState.titleColor)
    );
  } else {
    record(scenario.name, "sticky nav exists", false, "nav element not found");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, {
    timeout: TIMEOUT_CONTENT_READY,
  });
};

const assertTitleCorrect = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const titleText = await page
    .$eval(`${ROOT_SEL} .atv-hero-title`, (el) => el.textContent.trim())
    .catch(() => "");
  record(
    scenario.name,
    `hero title non-empty (got: "${titleText.slice(0, 40)}")`,
    titleText.length > 0
  );
};

const assertTVTerms = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  if (scenario.kind === "tv") {
    const heroMeta = await page
      .$eval(`${ROOT_SEL} .atv-hero-meta`, (el) => el.textContent)
      .catch(() => "");
    record(
      scenario.name,
      `TV hero meta contains 集/季 (got: "${heroMeta.slice(0, 80)}")`,
      TV_EPISODE_REGEX.test(heroMeta)
    );
  } else {
    const rootText = await page.$eval(
      `${ROOT_SEL}`,
      (el) => el.textContent || ""
    );
    const hasTVTerms = TV_EPISODE_REGEX.test(rootText);
    record(scenario.name, `no TV terms (集/季) on movie page`, !hasTVTerms);
  }
};

export {
  assertHero,
  assertIMDb,
  assertNoScriptErrors,
  assertRating,
  assertRoot,
  assertStickyNav,
  assertSummaryTeaser,
  assertTVMeta,
  assertTVTerms,
  assertTitleCorrect,
};
