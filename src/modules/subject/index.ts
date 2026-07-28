import type { PageMount } from "@/shared/runtime/page-mount";

import { mountSubject as mountSubjectPage } from "./runtime/mount";

const subjectPage: PageMount = {
  matches: (location) =>
    location.hostname === "movie.douban.com" &&
    /^\/subject\/[^/]+\/?$/u.test(location.pathname),
  mount: mountSubjectPage,
};

export { mountSubject } from "./runtime/mount";
export { subjectPage };
