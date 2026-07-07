import "./styles.css";
import { buildHeroCallbacks, mountSubjectPage, watchSeries } from "./runtime";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountSubjectPage(), {
    once: true,
  });
} else {
  mountSubjectPage();
}

export { buildHeroCallbacks, watchSeries };
