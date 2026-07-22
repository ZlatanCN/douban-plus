import { render } from "preact";

import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation } from "@/shared/runtime/page-mount";

import {
  adoptPersonageProfileWhenReady,
  PersonageProfileAdoption,
} from "./profile-adoption";

const isPersonageHomepage = (location: PageLocation): boolean =>
  location.hostname === "www.douban.com" &&
  /^\/personage\/\d+\/?$/u.test(location.pathname);

const mountPersonage = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  adoptPersonageProfileWhenReady(doc, (profile) => {
    if (doc.querySelector("#atv-douban-root")) {
      return;
    }

    if (
      installEnhancedRoot(doc, (root) =>
        render(
          <PersonageProfileAdoption doc={doc} initialProfile={profile} />,
          root
        )
      )
    ) {
      doc.title = `${profile.name} · 豆瓣`;
    }
  });
};

export { isPersonageHomepage, mountPersonage };
