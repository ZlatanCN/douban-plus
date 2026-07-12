import { render } from "preact";

import { postVote } from "@/api/comment";
import { postReviewVote } from "@/api/review";
import { SubjectPage } from "@/modules/subject-page/subject-page";

import { extractDoubanData } from "./extract-data";
import { extractSeriesMoreLink } from "./series-effect";

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
  const root = doc.createElement("div");
  root.id = "atv-douban-root";
  render(
    <SubjectPage
      data={data}
      deps={{
        canReviewVote: () => true,
        canVote: () => true,
        doc,
        handleReviewVote: (rid: string, type: "useful" | "useless") =>
          postReviewVote(rid, type, data.subjectId),
        handleVote: (cid: string) => postVote(cid, data.subjectId),
        seriesMoreLink: extractSeriesMoreLink(doc),
      }}
    />,
    root
  );
  doc.body.insertBefore(root, doc.body.firstChild);
};

export { mountSubjectPage };
