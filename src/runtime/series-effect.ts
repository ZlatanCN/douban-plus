import { buildSeries } from "../build";
import { el } from "../components";
import { extractSeries } from "../extract";

const extractSeriesMoreLink = (
  doc: Document = document
): { href: string; text: string } | undefined => {
  const linkEl = doc.querySelector("#series-items .items-swiper-title .pl a");
  if (!linkEl) {
    return undefined;
  }
  return {
    href: (linkEl as HTMLAnchorElement).href,
    text: (linkEl.textContent || "").replaceAll(/[()（）]/gu, "").trim(),
  };
};

const insertSeriesSection = (
  root: HTMLElement,
  stickyNav: HTMLElement,
  doc: Document
): void => {
  const items = extractSeries(doc);
  if (items.length === 0) {
    return;
  }

  const series = buildSeries(items, {
    moreLink: extractSeriesMoreLink(doc),
  });
  if (!series) {
    return;
  }

  const ref = root.querySelector("#atv-stream");
  if (ref) {
    ref.after(series);
  } else if (root.firstElementChild) {
    root.firstElementChild.after(series);
  }

  const wrap = stickyNav.querySelector(".atv-stickynav-jumps");
  if (!wrap || wrap.querySelector('a[href="#atv-series"]')) {
    return;
  }

  const link = el("a", { href: "#atv-series", text: "同系列" });
  link.addEventListener("click", (event) => {
    event.preventDefault();
    doc
      .querySelector("#atv-series")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const streamLink = wrap.querySelector('a[href="#atv-stream"]');
  if (streamLink) {
    streamLink.after(link);
  } else {
    wrap.prepend(link);
  }
};

const watchSeries = (
  root: HTMLElement,
  stickyNav: HTMLElement,
  doc: Document = document
): void => {
  const container = doc.querySelector("#series-items");
  if (!container) {
    return;
  }
  if (container.querySelector(".items-swiper")) {
    return;
  }
  if (root.querySelector("#atv-series")) {
    return;
  }

  const observer = new MutationObserver((): void => {
    if (!container.querySelector(".items-swiper")) {
      return;
    }
    observer.disconnect();
    insertSeriesSection(root, stickyNav, doc);
  });

  observer.observe(container, { childList: true, subtree: true });
};

export { extractSeriesMoreLink, watchSeries };
