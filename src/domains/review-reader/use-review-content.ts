import { useEffect, useState } from "preact/hooks";

import { sanitizeHtml } from "@/shared/components/common/html-content";

import { reviewNumericId } from "./review-identity";

type ReviewContentState =
  | { html: null; status: "error" | "loading" }
  | { html: string; status: "loaded" };

const nativeContent = (rid: string): string | null => {
  const numericId = reviewNumericId(rid);
  const content = document.querySelector<HTMLElement>(
    `[id="${rid}"] #review_${numericId}_full .review-content`
  );
  return content?.textContent?.trim() ? sanitizeHtml(content.innerHTML) : null;
};
const readReviewContent = async (rid: string): Promise<string | null> => {
  const response = await fetch(
    `https://movie.douban.com/review/${reviewNumericId(rid)}/`,
    { credentials: "include" }
  );
  if (!response.ok) {
    return null;
  }
  const doc = new DOMParser().parseFromString(
    await response.text(),
    "text/html"
  );
  const content = doc.querySelector<HTMLElement>(".review-content");
  return content ? sanitizeHtml(content.innerHTML) : null;
};
const useReviewContent = (rid: string): ReviewContentState => {
  const [state, setState] = useState<ReviewContentState>(() => {
    const html = nativeContent(rid);
    return html
      ? { html, status: "loaded" }
      : { html: null, status: "loading" };
  });
  useEffect(() => {
    const html = nativeContent(rid);
    if (html) {
      setState({ html, status: "loaded" });
      return;
    }
    let cancelled = false;
    setState({ html: null, status: "loading" });
    const load = async (): Promise<void> => {
      try {
        const value = await readReviewContent(rid);
        if (!cancelled) {
          setState(
            value
              ? { html: value, status: "loaded" }
              : { html: null, status: "error" }
          );
        }
      } catch {
        if (!cancelled) {
          setState({ html: null, status: "error" });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [rid]);
  return state;
};
export { useReviewContent };
export type { ReviewContentState };
