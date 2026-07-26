import { render } from "preact";

import { extractPersonageProfile } from "@/modules/personage/extract/profile";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation } from "@/shared/runtime/page-mount";

import { PersonageProfileAdoption } from "./profile-adoption";

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
      render(<PersonageProfileAdoption doc={doc} profile={profile} />, root)
    )
  ) {
    doc.title = `${profile.name}`;
  }
};

export { isPersonageHomepage, mountPersonage };
