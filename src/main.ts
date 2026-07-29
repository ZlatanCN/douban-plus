import { personagePage } from "@/modules/personage";
import { subjectPage } from "@/modules/subject";
import { subjectAllPhotosPage } from "@/modules/subject-all-photos";
import { subjectCelebritiesPage } from "@/modules/subject-celebrities";
import { subjectCommentsPage } from "@/modules/subject-comments";
import { subjectReviewsPage } from "@/modules/subject-reviews";
import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "@/shared/components/login-modal";
import {
  hasMatchingPage,
  mountMatchingPage,
} from "@/shared/runtime/page-mount";
import type { PageMount } from "@/shared/runtime/page-mount";

const pageMounts: readonly PageMount[] = [
  subjectCelebritiesPage,
  subjectAllPhotosPage,
  subjectCommentsPage,
  subjectReviewsPage,
  subjectPage,
  personagePage,
];

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

if (isDoubanLoginFrame()) {
  installLoginFrameTheme();
} else {
  mountPageWhenReady();
}
