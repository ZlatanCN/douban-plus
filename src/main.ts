import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "./runtime/login-frame-theme";
import { mountSubjectPage } from "./runtime/mount";

const mountSubjectPageWhenReady = async (): Promise<void> => {
  await import("./styles.css");

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

export { buildHeroCallbacks } from "./runtime/hero-callbacks";
export { watchSeries } from "./runtime/series-effect";
