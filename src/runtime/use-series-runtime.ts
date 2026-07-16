import { useEffect, useRef, useState } from "preact/hooks";

import { extractSeries } from "@/extract/series";
import type { SeriesItem } from "@/types";

type SeriesMoreLink = { href: string; text: string };

type SeriesRuntime = {
  items: SeriesItem[];
  moreLink?: SeriesMoreLink;
};

const extractSeriesMoreLink = (doc: Document): SeriesMoreLink | undefined => {
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

const readSeriesRuntime = (
  initial: SeriesItem[],
  doc: Document
): SeriesRuntime => {
  const moreLink = extractSeriesMoreLink(doc);
  return {
    items: doc.querySelector("#series-items .items-swiper")
      ? extractSeries(doc)
      : initial,
    ...(moreLink ? { moreLink } : {}),
  };
};

const useSeriesRuntime = (
  initial: SeriesItem[],
  doc: Document
): SeriesRuntime => {
  const initialSeries = useRef(initial).current;
  const [result, setResult] = useState(() =>
    readSeriesRuntime(initialSeries, doc)
  );

  useEffect(() => {
    const container = doc.querySelector("#series-items");
    if (!container) {
      setResult(readSeriesRuntime(initialSeries, doc));
      return;
    }
    const update = (): void => setResult(readSeriesRuntime(initialSeries, doc));
    update();
    const observer = new MutationObserver(update);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [doc, initialSeries]);

  return result;
};

export { useSeriesRuntime };
