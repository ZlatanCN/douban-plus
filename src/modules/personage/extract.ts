import { $$, safeText } from "@/utils/dom";

import type { PersonageFact, PersonageProfile } from "./types";

const personageIdFromPath = (pathname: string): string | null =>
  pathname.match(/^\/personage\/(?<id>\d+)\/?$/u)?.groups?.id ?? null;

const imageUrl = (element: Element | null): string | null => {
  if (!element) {
    return null;
  }
  if (element.localName === "img") {
    const image = element as HTMLImageElement;
    return image.currentSrc || image.src || null;
  }

  const background = element.getAttribute("style") ?? "";
  return (
    background.match(/url\(["']?(?<url>[^"')]+)["']?\)/u)?.groups?.url ?? null
  );
};

const extractFacts = (target: Element): PersonageFact[] =>
  $$<HTMLLIElement>(".subject-property li", target).flatMap((item) => {
    const label = safeText(item.querySelector(".label"));
    const value = safeText(item.querySelector(".value"));
    return label && value ? [{ label, value }] : [];
  });

const extractBiography = (doc: Document): string[] | null => {
  const biography = $$<HTMLParagraphElement>(".subject-intro p", doc)
    .map(safeText)
    .filter((paragraph) => paragraph && paragraph !== "暂无");
  return biography.length > 0 ? biography : null;
};

const extractPersonageProfile = (doc: Document): PersonageProfile | null => {
  const target = doc.querySelector(".subject-target");
  const name = safeText(target?.querySelector(".subject-name"));
  const id = personageIdFromPath(doc.defaultView?.location.pathname ?? "");
  if (!target || !name || !id) {
    return null;
  }

  return {
    biography: extractBiography(doc),
    facts: extractFacts(target),
    id,
    name,
    portrait: imageUrl(
      target.querySelector(".avatar img, .subject-avatar img") ??
        target.querySelector(".avatar, .subject-avatar")
    ),
  };
};

export { extractPersonageProfile, personageIdFromPath };
