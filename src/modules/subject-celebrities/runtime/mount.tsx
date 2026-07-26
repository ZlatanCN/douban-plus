import { render } from "preact";

import { extractSubjectCelebritiesPage } from "@/modules/subject-celebrities/extract/page";
import { SubjectCelebritiesPage } from "@/modules/subject-celebrities/presentation/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

const isSubjectCelebritiesPage = (location: PageLocation): boolean =>
  location.hostname === "movie.douban.com" &&
  /^\/subject\/\d+\/celebrities\/?$/u.test(location.pathname);

const mountSubjectCelebrities = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const data = extractSubjectCelebritiesPage(doc);
  if (!data) {
    console.warn("[ATV-Douban] 演职员页面数据提取失败，保留原生页面");
    return;
  }

  if (
    installEnhancedRoot(doc, (root) =>
      render(<SubjectCelebritiesPage data={data} doc={doc} />, root)
    )
  ) {
    doc.title = `${data.title} — 演职员`;
  }
};

const subjectCelebritiesPage: PageMount = {
  matches: isSubjectCelebritiesPage,
  mount: mountSubjectCelebrities,
};

export {
  isSubjectCelebritiesPage,
  mountSubjectCelebrities,
  subjectCelebritiesPage,
};
