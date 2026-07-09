import { render } from "preact";

import { postVote } from "@/api/comment";
import { postReviewVote } from "@/api/review";
import { computeNavSections, StickyNav } from "@/components/layout";
import { SubjectPage } from "@/modules/subject-page/subject-page";

import { createAccountGate } from "./account-gate";
import { startAvatarEffect } from "./avatar-effect";
import { extractDoubanData } from "./extract-data";
import { buildHeroCallbacks } from "./hero-callbacks";
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
  const accountGate = createAccountGate({ loggedIn: data.interest.loggedIn });

  const root = doc.createElement("div");
  root.id = "atv-douban-root";
  const stickyNav = doc.createElement("nav");
  stickyNav.className = "atv-stickynav";

  render(
    <SubjectPage
      data={data}
      deps={{
        canReviewVote: () => accountGate.requireLogin("给影评投票"),
        canVote: () => accountGate.requireLogin("给短评点有用"),
        handleReviewVote: (rid: string, type: "useful" | "useless") =>
          postReviewVote(rid, type, data.subjectId),
        handleVote: (cid: string) => postVote(cid, data.subjectId),
        heroCallbacks: buildHeroCallbacks(
          data.subjectId,
          doc,
          data.interest.loggedIn
        ),
        seriesMoreLink: extractSeriesMoreLink(doc),
      }}
    />,
    root
  );
  render(
    <StickyNav sections={computeNavSections(data)} title={data.title} />,
    stickyNav
  );

  startAvatarEffect(data.comments);

  doc.body.insertBefore(root, doc.body.firstChild);
  doc.body.append(stickyNav);

  startStickyReveal(stickyNav);
  trackActiveSection(stickyNav, doc);
  watchSeries(root, stickyNav, doc);
};

export { mountSubjectPage };
