import { render } from "preact";

import { installEnhancedRoot } from "./enhanced-document";
import { extractDoubanData } from "./extract-data";
import { SubjectPageRuntime } from "./subject-runtime";

const setSubjectTitle = (
  doc: Document,
  data: ReturnType<typeof extractDoubanData>
): void => {
  doc.title = `${
    (data.title.primary || data.title.full) +
    (data.year ? ` (${data.year})` : "")
  } · 豆瓣`;
};

const mountSubject = (doc: Document = document): void => {
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

  if (
    installEnhancedRoot(doc, (root) =>
      render(<SubjectPageRuntime data={data} doc={doc} />, root)
    )
  ) {
    setSubjectTitle(doc, data);
  }
};

export { mountSubject };
