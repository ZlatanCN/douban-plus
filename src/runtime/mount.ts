import { postVote } from "../api/comment";
import { postReviewVote } from "../api/review";
import { buildApp } from "../build";
import { startAvatarEffect } from "./avatar-effect";
import { extractDoubanData } from "./extract-data";
import { buildHeroCallbacks } from "./hero-callbacks";
import { startRatingsEffect } from "./ratings-effect";
import { extractSeriesMoreLink, watchSeries } from "./series-effect";
import { startStickyReveal, trackActiveSection } from "./sticky-effect";

const setSubjectTitle = (
  doc: Document,
  data: ReturnType<typeof extractDoubanData>
): void => {
  doc.title = `${
    (data.title.primary || data.title.full) +
    (data.year ? ` (${data.year})` : "")
  } · 豆瓣`;
};

const mountSubjectPage = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  if (!doc.querySelector("#content h1")) {
    console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
    return;
  }

  const data = (() => {
    try {
      return extractDoubanData(doc);
    } catch (error) {
      console.warn("[ATV-Douban] 数据提取失败：", error);
      return null;
    }
  })();
  if (!data) {
    return;
  }

  setSubjectTitle(doc, data);

  const { root, stickyNav } = buildApp(data, {
    heroCallbacks: buildHeroCallbacks(data.subjectId, doc),
    onReviewVote: (rid: string, type: "useful" | "useless") =>
      postReviewVote(rid, type, data.subjectId),
    onVote: (cid) => postVote(cid, data.subjectId),
    seriesMoreLink: extractSeriesMoreLink(doc),
  });

  startAvatarEffect(data.comments);

  doc.body.insertBefore(root, doc.body.firstChild);
  doc.body.append(stickyNav);

  startStickyReveal(stickyNav);
  trackActiveSection(stickyNav, doc);
  startRatingsEffect(data.info.imdb || null, data.isTV, doc);
  watchSeries(root, stickyNav, doc);
};

export { mountSubjectPage };
