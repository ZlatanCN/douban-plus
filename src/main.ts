import { buildHeroCallbacks, mountSubjectPage, watchSeries } from "./runtime";
import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "./runtime/login-frame-theme";

const mountSubjectPageWhenReady = (): void => {
  void import("./styles.css");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountSubjectPage(), {
      once: true,
    });
  } else {
    mountSubjectPage();
  }
};

if (isDoubanLoginFrame()) {
  installLoginFrameTheme();
} else {
  mountSubjectPageWhenReady();
}

export { buildHeroCallbacks, watchSeries };
