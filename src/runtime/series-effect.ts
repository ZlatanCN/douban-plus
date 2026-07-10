import { extractSeries } from "@/extract/series";
import type { SeriesItem } from "@/types";

const extractSeriesMoreLink = (
  doc: Document = document
): { href: string; text: string } | undefined => {
  const link = doc.querySelector<HTMLAnchorElement>(
    "#series-items .items-swiper-title .pl a"
  );
  return link
    ? {
        href: link.href,
        text: (link.textContent || "").replaceAll(/[()（）]/gu, "").trim(),
      }
    : undefined;
};

const watchSeries = (
  onSeries: (items: SeriesItem[]) => void,
  doc: Document = document
): (() => void) => {
  const container = doc.querySelector("#series-items");
  if (!container) {
    return (): undefined => undefined;
  }
  const update = (): void => {
    if (container.querySelector(".items-swiper")) {
      onSeries(extractSeries(doc));
    }
  };
  update();
  const observer = new MutationObserver(update);
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
};

export { extractSeriesMoreLink, watchSeries };
