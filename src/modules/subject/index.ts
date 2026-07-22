import type { PageMount } from "@/shared/runtime/page-mount";

import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "./runtime/login-frame-theme";
import { mountSubject as mountSubjectPage } from "./runtime/mount";

const subjectPage: PageMount = {
  matches: (location) =>
    location.hostname === "movie.douban.com" &&
    /^\/subject\/[^/]+\/?$/u.test(location.pathname),
  mount: mountSubjectPage,
};

const mountSubjectLoginFrameIfNeeded = (): boolean => {
  if (!isDoubanLoginFrame()) {
    return false;
  }
  installLoginFrameTheme();
  return true;
};

export { mountSubject } from "./runtime/mount";
export { mountSubjectLoginFrameIfNeeded, subjectPage };
