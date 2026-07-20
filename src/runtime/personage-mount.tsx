import { render } from "preact";

import { extractPersonageProfile } from "@/modules/personage/extract";
import { PersonagePage } from "@/modules/personage/personage";

import { installEnhancedRoot } from "./enhanced-document";
import type { PageLocation } from "./page-mount";

const isPersonageHomepage = (location: PageLocation): boolean =>
  location.hostname === "www.douban.com" &&
  /^\/personage\/\d+\/?$/u.test(location.pathname);

const mountPersonage = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const profile = extractPersonageProfile(doc);
  if (!profile) {
    return;
  }

  if (
    installEnhancedRoot(doc, (root) =>
      render(<PersonagePage profile={profile} />, root)
    )
  ) {
    doc.title = `${profile.name} · 豆瓣`;
  }
};

export { isPersonageHomepage, mountPersonage };
