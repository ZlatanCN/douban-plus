import type {
  MovieHomeData,
  MovieHomeListItem,
  MovieHomeRank,
  MovieHomeRecommendation,
  MovieHomeReview,
  WebLink,
} from "@/modules/movie-home/domain";

import { hrefOf, imageOf, invalidSection, linkOf, textOf } from "./native";

type EditorialSections = Pick<
  MovieHomeData,
  "lists" | "ranking" | "recommendations" | "reviews"
>;

const extractRanking = (
  doc: Document
): MovieHomeData["ranking"] | undefined => {
  const section = doc.querySelector("#billboard");
  if (!section) {
    return undefined;
  }

  const items = [
    ...section.querySelectorAll<HTMLTableRowElement>(".billboard-bd tr"),
  ].map((row): MovieHomeRank | null => {
    const href = hrefOf(row.querySelector(".title a"));
    const rank = textOf(row.querySelector(".order"));
    const title = textOf(row.querySelector(".title a"));
    return href && rank && title ? { href, rank, title } : null;
  });
  const moreLink = section.querySelector(".billboard-hd h2 > span a");
  const more = linkOf(moreLink);
  if (!more) {
    return invalidSection("口碑榜入口缺失");
  }
  if (items.some((item) => item === null)) {
    return invalidSection("口碑榜单条目的名次或链接缺失");
  }

  const explanationElement = doc.querySelector(".rating_answer a");
  const explanation = linkOf(explanationElement);
  if (explanationElement && !explanation) {
    return invalidSection("评分说明入口无效");
  }

  return {
    explanation,
    items: items.filter((item): item is MovieHomeRank => item !== null),
    more,
  };
};

const extractLists = (doc: Document): MovieHomeData["lists"] | undefined => {
  const section = doc.querySelector("#doulist");
  if (!section) {
    return undefined;
  }

  const items = [...section.querySelectorAll("ul > li")].map(
    (item): MovieHomeListItem | null => {
      const href = hrefOf(item.querySelector(".title a"));
      const title = textOf(item.querySelector(".title a"));
      const recommendations = textOf(item.querySelector(":scope > span"));
      return href && title && recommendations
        ? { href, recommendations, title }
        : null;
    }
  );
  if (items.some((item) => item === null)) {
    return invalidSection("热门片单条目缺失");
  }

  return {
    items: items.filter((item): item is MovieHomeListItem => item !== null),
  };
};

const extractRecommendations = (
  doc: Document
): MovieHomeData["recommendations"] | undefined => {
  const section = doc.querySelector("#gallery-frames");
  if (!section) {
    return undefined;
  }

  const items = [
    ...section.querySelectorAll("#hot-gallery .gallery-frame"),
  ].map((item): MovieHomeRecommendation | null => {
    const href = hrefOf(item.querySelector("a"));
    const title = textOf(item.querySelector("h3"));
    const summary = textOf(item.querySelector(".gallery-bd p"));
    const image = imageOf(item);
    return href && title && summary && image
      ? { href, image, summary, title }
      : null;
  });
  if (items.some((item) => item === null)) {
    return invalidSection("热门推荐条目缺失");
  }

  return {
    items: items.filter(
      (item): item is MovieHomeRecommendation => item !== null
    ),
  };
};

const extractReviews = (
  doc: Document
): MovieHomeData["reviews"] | undefined => {
  const section = doc.querySelector("#reviews");
  if (!section) {
    return undefined;
  }

  const headingLinks = [...section.querySelectorAll(".reviews-hd h2 a")]
    .map(linkOf)
    .filter((link): link is WebLink => link !== null);
  const more = headingLinks.find((link) => link.label.includes("更多热门影评"));
  const latest = headingLinks.find((link) => link.label.includes("新片影评"));
  if (!more || !latest) {
    return invalidSection("影评列表入口缺失");
  }

  const items = [...section.querySelectorAll(".reviews-bd .review")].map(
    (item): MovieHomeReview | null => {
      const link = item.querySelector(".review-bd h3 a");
      const href = hrefOf(link);
      const title = textOf(link);
      const author = linkOf(item.querySelector(".review-meta > a"));
      const subject = linkOf(
        item.querySelector(".review-meta > a:nth-of-type(2)")
      );
      const fullTextHref = hrefOf(
        item.querySelector(".review-content a:last-of-type")
      );
      const summary =
        item
          .querySelector(".review-content")
          ?.childNodes[0]?.textContent?.trim() ?? "";
      const poster = imageOf(item.querySelector(".review-hd") ?? item);
      return href && title && author && subject && fullTextHref && summary
        ? { author, fullTextHref, href, poster, subject, summary, title }
        : null;
    }
  );
  if (items.some((item) => item === null)) {
    return invalidSection("影评条目的标题、作者、作品或全文入口缺失");
  }

  return {
    items: items.filter((item): item is MovieHomeReview => item !== null),
    latest,
    more,
  };
};

const extractEditorialSections = (doc: Document): EditorialSections | null => {
  try {
    return {
      lists: extractLists(doc) ?? null,
      ranking: extractRanking(doc) ?? null,
      recommendations: extractRecommendations(doc) ?? null,
      reviews: extractReviews(doc) ?? null,
    };
  } catch (error) {
    console.warn("[ATV-Douban] 电影首页区块提取失败", error);
    return null;
  }
};

export { extractEditorialSections, type EditorialSections };
