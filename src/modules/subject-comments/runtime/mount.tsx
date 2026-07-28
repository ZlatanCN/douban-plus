import { render } from "preact";

import { extractSubjectCommentsPage } from "@/modules/subject-comments/extract/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

import { SubjectCommentsRuntimePage } from "./page";

const isSubjectCommentsPage = (location: PageLocation): boolean =>
  location.hostname === "movie.douban.com" &&
  /^\/subject\/\d+\/comments\/?$/u.test(location.pathname);

const mountSubjectComments = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const data = extractSubjectCommentsPage(doc);
  if (!data) {
    console.warn("[ATV-Douban] 短评总览页数据提取失败，保留原生页面");
    return;
  }

  if (
    installEnhancedRoot(doc, (root) =>
      render(<SubjectCommentsRuntimePage data={data} doc={doc} />, root)
    )
  ) {
    doc.title = `${data.title} — 全部短评`;
  }
};

const subjectCommentsPage: PageMount = {
  matches: isSubjectCommentsPage,
  mount: mountSubjectComments,
};

export { isSubjectCommentsPage, mountSubjectComments, subjectCommentsPage };
