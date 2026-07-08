import { useEffect, useState } from "preact/hooks";

import { reviewNumericId } from "./review-identity";

type ReviewContentState =
  | { html: null; status: "loading" }
  | { html: null; status: "error" }
  | { html: string; status: "loaded" };

const stripInlineStyles = (html: string): string =>
  html.replaceAll(/\sstyle="[^"]*"/giu, "");

const findNativeReviewContent = (rid: string): string | null => {
  const numericId = reviewNumericId(rid);
  const nativeItem = document.querySelector(`[id="${rid}"]`);
  const fullContent = nativeItem?.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );
  const text = (fullContent?.textContent ?? "").trim();
  return fullContent && text ? stripInlineStyles(fullContent.innerHTML) : null;
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
          html: stripInlineStyles(content.innerHTML),
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

export { findNativeReviewContent, stripInlineStyles, useReviewContent };
export type { ReviewContentState };
