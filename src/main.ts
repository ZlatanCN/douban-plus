import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "@/runtime/login-frame-theme";
import { hasMatchingPage, mountMatchingPage } from "@/runtime/page-mount";
import type { PageMount } from "@/runtime/page-mount";
import { mountSubject } from "@/runtime/subject-mount";

const pageMounts: readonly PageMount[] = [
  {
    matches: (location) =>
      location.hostname === "movie.douban.com" &&
      /^\/subject\/[^/]+\/?$/u.test(location.pathname),
    mount: mountSubject,
  },
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
