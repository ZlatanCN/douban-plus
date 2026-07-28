import type { DoubanData } from "@/modules/subject/domain";
import { getCk, gmGet } from "@/shared/utils/request";

import { extractDoubanData } from "./extract-data";

type SubjectPageSnapshot = {
  data: DoubanData;
  nativeContent: HTMLElement;
};

const resolveResponseUrls = (doc: Document, responseUrl: string): void => {
  for (const element of doc.querySelectorAll<HTMLElement>("[href], [src]")) {
    for (const attribute of ["href", "src"] as const) {
      const value = element.getAttribute(attribute);
      if (!value) {
        continue;
      }
      try {
        const url = new URL(value, responseUrl);
        if (url.protocol === "http:" || url.protocol === "https:") {
          element.setAttribute(attribute, url.href);
        }
      } catch {
        // Leave malformed host markup untouched; the extractor treats it as absent.
      }
    }
  }
};

const readSubjectData = async (
  subjectId: string
): Promise<SubjectPageSnapshot> => {
  if (!subjectId) {
    throw new Error("作品编号无效");
  }

  const subjectUrl = `https://movie.douban.com/subject/${subjectId}/`;
  try {
    const html = await gmGet(subjectUrl, subjectUrl);
    const doc = new DOMParser().parseFromString(html, "text/html");
    resolveResponseUrls(doc, subjectUrl);
    const data = {
      ...extractDoubanData(doc, getCk()),
      subjectId,
    };
    const nativeContent = doc.querySelector<HTMLElement>("#content");
    if (!nativeContent || !data.title.primary) {
      throw new Error("作品页面响应无效");
    }
    return { data, nativeContent };
  } catch (error) {
    console.warn("[ATV-Douban] readSubjectData error:", error);
    throw new Error("无法同步作品页面", { cause: error });
  }
};

export { readSubjectData };
export type { SubjectPageSnapshot };
