import { ROOT_SEL, warn } from "./assert-helpers";
import {
  COLOR_GOLD_RGB,
  EXTERNAL_URL_REGEX,
  PERSONAGE_LINK_REGEX,
  SUBJECT_LINK_REGEX,
} from "./constants";
import { record } from "./logger";
import type { AssertCtx } from "./types";

const assertCast = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const castCards = await page.$$(`${ROOT_SEL} .atv-cast-card`);
  record(
    scenario.name,
    `cast cards rendered (${castCards.length})`,
    castCards.length > 0
  );
  if (castCards.length > 0) {
    const firstCastLink = await castCards[0]
      .evaluate((el) =>
        el.tagName === "A"
          ? (el as HTMLAnchorElement).href
          : el.querySelector("a")?.getAttribute("href") || ""
      )
      .catch(() => "");
    record(
      scenario.name,
      `cast link points to personage page (got: "${firstCastLink.slice(0, 60)}")`,
      PERSONAGE_LINK_REGEX.test(firstCastLink)
    );
  }
};

const assertPhotos = async ({ page, scenario }: AssertCtx): Promise<void> => {
  const photoTiles = await page.$$(`${ROOT_SEL} .atv-photo-tile`);
  record(
    scenario.name,
    `photo tiles rendered (${photoTiles.length})`,
    photoTiles.length > 0
  );
};

const assertRecommendations = async ({
  page,
  scenario,
}: AssertCtx): Promise<void> => {
  const recCards = await page.$$(`${ROOT_SEL} .atv-rec-card`);
  record(
    scenario.name,
    `recommendation cards rendered (${recCards.length})`,
    recCards.length > 0
  );
  if (recCards.length > 0) {
    const firstRecLink = await recCards[0]
      .evaluate((el) =>
        el.tagName === "A"
          ? (el as HTMLAnchorElement).href
          : el.querySelector("a")?.getAttribute("href") || ""
      )
      .catch(() => "");
    record(
      scenario.name,
      `rec link to subject page (got: "${firstRecLink.slice(0, 60)}")`,
      SUBJECT_LINK_REGEX.test(firstRecLink)
    );
  }
};

const assertComments = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const commentCards = await page.$$(`${ROOT_SEL} .atv-comment-card`);
  if (commentCards.length === 0) {
    warn(
      ctx,
      "data-missing",
      "no comment cards rendered (page may have no comments)"
    );
    return;
  }
  record(
    scenario.name,
    `comment cards rendered (${commentCards.length})`,
    commentCards.length > 0
  );
  const firstComment = await commentCards[0].evaluate((card) => ({
    author:
      card.querySelector(".atv-comment-author")?.textContent?.trim() || "",
    body: card.querySelector(".atv-comment-body")?.textContent?.trim() || "",
  }));
  record(
    scenario.name,
    `comment has author + body (author: "${firstComment.author.slice(0, 12)}")`,
    firstComment.author.length > 0 && firstComment.body.length > 0
  );
};

const evaluateStreamCard = (el: Element) => {
  const htmlEl = el as HTMLElement;
  const tag = el.tagName;
  const href = tag === "A" ? (el as HTMLAnchorElement).href : "";
  const nameEl = el.querySelector(".atv-stream-name");
  const name = nameEl?.textContent?.trim() || "";
  const isCombined = el.classList.contains("atv-stream-card--combined");
  const provider = htmlEl.dataset.provider || "";
  const label = isCombined ? provider : name;
  return { href, isCombined, label, name, provider, tag };
};

const assertStreaming = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const streamCards = await page.$$(`${ROOT_SEL} .atv-stream-card`);
  if (streamCards.length === 0) {
    warn(
      ctx,
      "data-missing",
      "no streaming cards — page may lack streaming sources"
    );
    return;
  }

  const firstStream = await streamCards[0].evaluate(evaluateStreamCard);
  const valid =
    firstStream.tag === "A" &&
    EXTERNAL_URL_REGEX.test(firstStream.href) &&
    (firstStream.name.length > 0 || firstStream.isCombined);
  record(
    scenario.name,
    `streaming cards rendered (${streamCards.length}, ${firstStream.tag} "${firstStream.label.slice(0, 10)}")`,
    valid
  );

  const cardInfos = await Promise.all(
    streamCards.map((card) => card.evaluate(evaluateStreamCard))
  );
  const allValid = cardInfos.every(
    (info) =>
      info.tag === "A" &&
      EXTERNAL_URL_REGEX.test(info.href) &&
      (info.name.length > 0 || info.isCombined)
  );
  record(
    scenario.name,
    `all ${streamCards.length} streaming cards valid <a>`,
    allValid
  );
};

const assertAwards = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const allLabels = await page.$$(`${ROOT_SEL} .atv-info-label`);

  const colors = await Promise.all(
    allLabels.map((label) => label.evaluate((el) => getComputedStyle(el).color))
  );
  const awardCount = colors.filter((color) => color === COLOR_GOLD_RGB).length;

  if (awardCount > 0) {
    record(
      scenario.name,
      `awards in info grid (${awardCount} rows)`,
      awardCount > 0
    );
  } else {
    warn(ctx, "data-missing", "no awards found in info grid");
  }
};

const assertInfoGrid = async (ctx: AssertCtx): Promise<void> => {
  const { page, scenario } = ctx;
  const infoLabels = await page.$$(`${ROOT_SEL} .atv-info-label`);
  if (infoLabels.length === 0) {
    warn(ctx, "data-missing", "no info labels in info grid");
    return;
  }

  const labelInfos = await Promise.all(
    infoLabels.map((label) =>
      label.evaluate((el) => ({
        text: el.textContent?.trim() || "",
        value: el.nextElementSibling?.textContent?.trim() || "",
      }))
    )
  );

  for (const { text, value } of labelInfos) {
    if (text === "导演") {
      record(
        scenario.name,
        `info-grid 导演 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    } else if (text === "制片国家/地区") {
      record(
        scenario.name,
        `info-grid 制片国家/地区 (got: "${value.slice(0, 30)}")`,
        value.length > 0
      );
    }
  }
};

export {
  assertAwards,
  assertCast,
  assertComments,
  assertInfoGrid,
  assertPhotos,
  assertRecommendations,
  assertStreaming,
};
