import { useEffect, useState } from "preact/hooks";

import {
  extractSummary,
  normalizeSummaryText,
} from "@/modules/subject/extract/rating";

const summaryContainerSelector = "#link-report-intra";
const summaryTriggerSelector = "a.a_show_full";

const isVisible = (element: HTMLElement): boolean => {
  const display =
    element.ownerDocument.defaultView?.getComputedStyle(element).display;
  return (
    !element.hidden && element.style.display !== "none" && display !== "none"
  );
};

const readVisibleSummary = (
  doc: Document,
  fallback: string | null
): string | null => {
  const container = doc.querySelector(summaryContainerSelector);
  const visible = container
    ? [...container.children].find(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          !child.classList.contains("pl") &&
          isVisible(child)
      )
    : null;
  const visibleText = normalizeSummaryText(visible?.textContent ?? "").replace(
    /\s*\(展开全部\)\s*$/u,
    ""
  );
  return visibleText || extractSummary(doc) || fallback;
};

const adoptNativeSummary = async (
  doc: Document,
  fallback: string | null
): Promise<string | null> => {
  const before = readVisibleSummary(doc, fallback);
  const trigger = doc.querySelector<HTMLAnchorElement>(summaryTriggerSelector);
  if (!trigger) {
    return before;
  }
  trigger.click();
  await Promise.resolve();
  return readVisibleSummary(doc, before) || before;
};

const useNativeSummary = (
  fallback: string | null,
  doc: Document
): string | null => {
  const [summary, setSummary] = useState(fallback);

  useEffect(() => {
    let active = true;
    setSummary(fallback);
    const adopt = async (): Promise<void> => {
      const result = await adoptNativeSummary(doc, fallback);
      if (active) {
        setSummary(result);
      }
    };
    void adopt();
    return () => {
      active = false;
    };
  }, [doc, fallback]);

  return summary;
};

export { useNativeSummary };
