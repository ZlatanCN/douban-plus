import { render } from "preact";

import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";

import { extractDoubanData } from "./extract-data";
import { SubjectPageRuntime } from "./page-runtime";

const setSubjectTitle = (
  doc: Document,
  data: ReturnType<typeof extractDoubanData>
): void => {
  const base =
    data.title.seasonLabel && data.title.primary
      ? `${data.title.primary} ${data.title.seasonLabel}`
      : data.title.primary || data.title.full;
  doc.title = `${base}${data.year ? ` (${data.year})` : ""}`;
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
