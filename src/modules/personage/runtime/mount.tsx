import { render } from "preact";

import { extractPersonageProfile } from "@/modules/personage/extract/profile";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation } from "@/shared/runtime/page-mount";

import { PersonagePageRuntime } from "./page-runtime";

const isBiographyExpansionPending = (doc: Document): boolean =>
  [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].some((element) => element.textContent?.includes("展开"));

const adoptPersonageProfile = (doc: Document) => {
  const initialProfile = extractPersonageProfile(doc);
  if (!initialProfile || !isBiographyExpansionPending(doc)) {
    return initialProfile;
  }

  const trigger = [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].find((element) => element.textContent?.includes("展开"));
  trigger?.click();

  return isBiographyExpansionPending(doc) ? null : extractPersonageProfile(doc);
};

const isPersonageHomepage = (location: PageLocation): boolean =>
  location.hostname === "www.douban.com" &&
  /^\/personage\/\d+\/?$/u.test(location.pathname);

const mountPersonageWhenNativePageIsReady = (doc: Document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const profile = adoptPersonageProfile(doc);
  if (!profile) {
    return;
  }

  if (
    installEnhancedRoot(doc, (root) =>
      render(<PersonagePageRuntime doc={doc} initialProfile={profile} />, root)
    )
  ) {
    doc.title = `${profile.name} · 豆瓣`;
  }
};

const mountPersonage = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  if (doc.readyState === "complete" || !isBiographyExpansionPending(doc)) {
    mountPersonageWhenNativePageIsReady(doc);
    return;
  }

  const view = doc.defaultView;
  if (!view) {
    mountPersonageWhenNativePageIsReady(doc);
    return;
  }

  view.addEventListener(
    "load",
    () => mountPersonageWhenNativePageIsReady(doc),
    { once: true }
  );
};

export { isPersonageHomepage, mountPersonage };
