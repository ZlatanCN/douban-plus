import { render } from "preact";

import {
  diagnoseSubjectReviewsPage,
  extractSubjectReviewsPage,
} from "@/modules/subject-reviews/extract/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

import { SubjectReviewsRuntimePage } from "./page";

const isSubjectReviewsPage = (location: PageLocation): boolean =>
  location.hostname === "movie.douban.com" &&
  /^\/subject\/\d+\/reviews\/?$/u.test(location.pathname);

const MOUNT_RETRY_FRAMES = 2;

/* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is a browser callback API. */
const scheduleMountRetry = (
  doc: Document,
  callback: FrameRequestCallback
): void => {
  const view = doc.defaultView;
  if (view?.requestAnimationFrame) {
    view.requestAnimationFrame(callback);
    return;
  }
  setTimeout(() => callback(Date.now()), 0);
};
/* eslint-enable promise/prefer-await-to-callbacks */

const mountSubjectReviewsWhenReady = (
  doc: Document,
  retriesRemaining: number
): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }
  const data = extractSubjectReviewsPage(doc);
  if (!data) {
    if (retriesRemaining > 0) {
      scheduleMountRetry(doc, () =>
        mountSubjectReviewsWhenReady(doc, retriesRemaining - 1)
      );
      return;
    }
    console.warn("[ATV-Douban] 影评总览页数据提取失败，保留原生页面", {
      diagnostics: diagnoseSubjectReviewsPage(doc),
    });
    return;
  }
  if (
    installEnhancedRoot(doc, (root) =>
      render(<SubjectReviewsRuntimePage data={data} doc={doc} />, root)
    )
  ) {
    doc.title = `${data.title} — 全部${data.reviewKind}`;
  }
};

const mountSubjectReviews = (doc: Document = document): void =>
  mountSubjectReviewsWhenReady(doc, MOUNT_RETRY_FRAMES);

const subjectReviewsPage: PageMount = {
  matches: isSubjectReviewsPage,
  mount: mountSubjectReviews,
};
export { isSubjectReviewsPage, mountSubjectReviews, subjectReviewsPage };
