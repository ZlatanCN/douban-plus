import { personagePage } from "@/modules/personage";
import { mountSubjectLoginFrameIfNeeded, subjectPage } from "@/modules/subject";
import {
  hasMatchingPage,
  mountMatchingPage,
} from "@/shared/runtime/page-mount";
import type { PageMount } from "@/shared/runtime/page-mount";

const pageMounts: readonly PageMount[] = [subjectPage, personagePage];

const mountPageWhenReady = async (): Promise<void> => {
  if (!hasMatchingPage(pageMounts)) {
    return;
  }

  await import("./styles.css");

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => mountMatchingPage(pageMounts, document),
      { once: true }
    );
  } else {
    mountMatchingPage(pageMounts, document);
  }
};

if (!mountSubjectLoginFrameIfNeeded()) {
  mountPageWhenReady();
}
