import { useEffect, useRef, useState } from "preact/hooks";

import type { SeriesItem } from "@/modules/subject/domain";
import { extractSeries } from "@/modules/subject/extract/series";
import type { ResolvedSeriesItem } from "@/modules/subject/runtime/types";

type SeriesMoreLink = { href: string; text: string };

type SeriesRuntime = {
  items: ResolvedSeriesItem[];
  moreLink?: SeriesMoreLink;
};

const subjectPath = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const resolveCurrentSeries = (
  items: SeriesItem[],
  doc: Document
): ResolvedSeriesItem[] => {
  const pathname = doc.defaultView?.location.pathname ?? doc.location.pathname;
  return items.map((item) => ({
    ...item,
    isCurrent: Boolean(item.link && subjectPath(item.link) === pathname),
  }));
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
  const items = doc.querySelector("#series-items .items-swiper")
    ? extractSeries(doc)
    : initial;
  return {
    items: resolveCurrentSeries(items, doc),
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
