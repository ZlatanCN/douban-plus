import { useEffect, useState } from "preact/hooks";

import { sanitizeHtml } from "@/components/common/html-content";
import { reviewNumericId } from "@/modules/subject-page/reviews/review-identity";

type ReviewContentState =
  | { html: null; status: "loading" }
  | { html: null; status: "error" }
  | { html: string; status: "loaded" };

const readNativeReviewContent = (rid: string): string | null => {
  const numericId = reviewNumericId(rid);
  const nativeItem = document.querySelector(`[id="${rid}"]`);
  const fullContent = nativeItem?.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );
  const text = (fullContent?.textContent ?? "").trim();
  return fullContent && text ? sanitizeHtml(fullContent.innerHTML) : null;
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
  return content ? sanitizeHtml(content.innerHTML) : null;
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
