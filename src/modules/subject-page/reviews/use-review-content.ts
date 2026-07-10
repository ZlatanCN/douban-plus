import { useEffect, useState } from "preact/hooks";

import { reviewNumericId } from "./review-identity";

type ReviewContentState =
  | { html: null; status: "loading" }
  | { html: null; status: "error" }
  | { html: string; status: "loaded" };

const stripInlineStyles = (html: string): string =>
  html.replaceAll(/\sstyle="[^"]*"/giu, "");

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "ul",
]);

const sanitizeReviewHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const element of doc.body.querySelectorAll("*")) {
    if (!allowedTags.has(element.tagName.toLowerCase())) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of element.attributes) {
      const allowedHref =
        element.tagName.toLowerCase() === "a" && attribute.name === "href";
      const safeHref =
        allowedHref && /^(?:https?:|\/|#)/iu.test(attribute.value.trim());
      if (!safeHref) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return doc.body.innerHTML;
};

const findNativeReviewContent = (rid: string): string | null => {
  const numericId = reviewNumericId(rid);
  const nativeItem = document.querySelector(`[id="${rid}"]`);
  const fullContent = nativeItem?.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );
  const text = (fullContent?.textContent ?? "").trim();
  return fullContent && text
    ? sanitizeReviewHtml(stripInlineStyles(fullContent.innerHTML))
    : null;
};

const useReviewContent = (rid: string): ReviewContentState => {
  const [state, setState] = useState<ReviewContentState>(() => {
    const nativeHtml = findNativeReviewContent(rid);
    return nativeHtml
      ? { html: nativeHtml, status: "loaded" }
      : { html: null, status: "loading" };
  });

  useEffect(() => {
    const nativeHtml = findNativeReviewContent(rid);
    if (nativeHtml) {
      setState({ html: nativeHtml, status: "loaded" });
      return;
    }

    let cancelled = false;
    const numericId = reviewNumericId(rid);
    setState({ html: null, status: "loading" });

    const loadReview = async (): Promise<void> => {
      try {
        const response = await fetch(
          `https://movie.douban.com/review/${numericId}/`
        );
        if (!response.ok) {
          throw new Error(String(response.status));
        }
        const html = await response.text();
        if (cancelled) {
          return;
        }
        const doc = new DOMParser().parseFromString(html, "text/html");
        const content = doc.querySelector<HTMLElement>(".review-content");
        if (!content) {
          throw new Error("no content");
        }
        setState({
          html: sanitizeReviewHtml(stripInlineStyles(content.innerHTML)),
          status: "loaded",
        });
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

export {
  findNativeReviewContent,
  sanitizeReviewHtml,
  stripInlineStyles,
  useReviewContent,
};
export type { ReviewContentState };
