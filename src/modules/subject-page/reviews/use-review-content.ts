import { useEffect, useState } from "preact/hooks";

import { reviewNumericId } from "./review-identity";

type ReviewContentState =
  | { html: null; status: "loading" }
  | { html: null; status: "error" }
  | { html: string; status: "loaded" };

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "cite",
  "code",
  "del",
  "div",
  "em",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const dangerousTags = new Set([
  "embed",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "style",
]);

const allowedImgAttrs = new Set(["src", "alt", "width", "height"]);

const allowedTableCellAttrs = new Set(["colspan", "rowspan", "scope"]);

const sanitizeReviewHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const element of doc.body.querySelectorAll("*")) {
    if (dangerousTags.has(element.tagName.toLowerCase())) {
      element.remove();
      continue;
    }
    if (!allowedTags.has(element.tagName.toLowerCase())) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of element.attributes) {
      const tagName = element.tagName.toLowerCase();
      const allowedHref = tagName === "a" && attribute.name === "href";
      const safeHref =
        allowedHref && /^(?:https?:|\/|#)/iu.test(attribute.value.trim());
      const allowedImgAttr =
        tagName === "img" && allowedImgAttrs.has(attribute.name);
      const allowedTableCellAttr =
        (tagName === "th" || tagName === "td") &&
        allowedTableCellAttrs.has(attribute.name);
      const allowedClass = attribute.name === "class";
      if (
        !safeHref &&
        !allowedImgAttr &&
        !allowedTableCellAttr &&
        !allowedClass
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return doc.body.innerHTML;
};

const readNativeReviewContent = (rid: string): string | null => {
  const numericId = reviewNumericId(rid);
  const nativeItem = document.querySelector(`[id="${rid}"]`);
  const fullContent = nativeItem?.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );
  const text = (fullContent?.textContent ?? "").trim();
  return fullContent && text ? sanitizeReviewHtml(fullContent.innerHTML) : null;
};

const fetchReviewContent = async (rid: string): Promise<string | null> => {
  const numericId = reviewNumericId(rid);
  const response = await fetch(`https://movie.douban.com/review/${numericId}/`);
  if (!response.ok) {
    return null;
  }
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const content = doc.querySelector<HTMLElement>(".review-content");
  return content ? sanitizeReviewHtml(content.innerHTML) : null;
};

const useReviewContent = (rid: string): ReviewContentState => {
  const [state, setState] = useState<ReviewContentState>(() => {
    const nativeHtml = readNativeReviewContent(rid);
    return nativeHtml
      ? { html: nativeHtml, status: "loaded" }
      : { html: null, status: "loading" };
  });

  useEffect(() => {
    const nativeHtml = readNativeReviewContent(rid);
    if (nativeHtml) {
      setState({ html: nativeHtml, status: "loaded" });
      return;
    }

    let cancelled = false;
    setState({ html: null, status: "loading" });

    const loadReview = async (): Promise<void> => {
      try {
        const html = await fetchReviewContent(rid);
        if (cancelled) {
          return;
        }
        if (!html) {
          setState({ html: null, status: "error" });
          return;
        }
        setState({ html, status: "loaded" });
      } catch {
        if (!cancelled) {
          setState({ html: null, status: "error" });
        }
      }
    };
    void loadReview();

    return () => {
      cancelled = true;
    };
  }, [rid]);

  return state;
};

export { useReviewContent };
export type { ReviewContentState };
