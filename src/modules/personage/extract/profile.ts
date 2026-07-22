import { $$, safeText } from "@/shared/utils/dom";

import type {
  PersonageAward,
  PersonageAwards,
  PersonageCollaborators,
  PersonageFact,
  PersonageGallery,
  PersonageGalleryImage,
  PersonageProfile,
  PersonageWork,
  PersonageWorkRail,
} from "../domain";

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

const largePhotoUrl = (src: string): string => {
  // Only replace known medium-photo path; return as-is if pattern doesn't match
  // to avoid corrupting already-large or differently-formatted URLs
  if (src.includes("/view/photo/photo/")) {
    return src.replace("/view/photo/photo/", "/view/photo/l/");
  }
  return src;
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

const extractCollaborators = (doc: Document): PersonageCollaborators | null => {
  const source = doc.querySelector(".partners-mod-mod");
  if (!source) {
    return null;
  }

  const collaborators = $$<HTMLLIElement>(".partners-mod-item", source)
    .flatMap((item, nativeIndex) => {
      const profileLink = item.querySelector<HTMLAnchorElement>(
        ".partners-mod-info a[title][href]"
      );
      const sharedWorksLink = item.querySelector<HTMLAnchorElement>(
        '.partners-mod-info a[href*="partners#"]'
      );
      const name = safeText(profileLink);
      const sharedWorkCount = Number(safeText(sharedWorksLink));
      if (!(profileLink && name && Number.isFinite(sharedWorkCount))) {
        return [];
      }

      return [
        {
          avatar: imageUrl(item.querySelector("img")),
          href: profileLink.href,
          name,
          nativeIndex,
          sharedWorkCount,
          sharedWorksHref: sharedWorksLink?.href ?? null,
        },
      ];
    })
    .toSorted(
      (left, right) =>
        right.sharedWorkCount - left.sharedWorkCount ||
        left.nativeIndex - right.nativeIndex
    )
    .map(({ nativeIndex: _nativeIndex, ...collaborator }) => collaborator);

  const allCollaboratorsHref =
    source.querySelector<HTMLAnchorElement>("h2 a[href]")?.href ?? null;
  const totalCountMatch = source
    .querySelector<HTMLAnchorElement>("h2 a[href]")
    ?.textContent?.match(/\d+/u)?.[0];

  return {
    allCollaboratorsHref,
    ...(totalCountMatch ? { totalCount: Number(totalCountMatch) } : {}),
    collaborators,
  };
};

const hrefOf = (element: Element | undefined): string | null =>
  element?.localName === "a" ? (element as HTMLAnchorElement).href : null;

const extractAwards = (doc: Document): PersonageAwards | null => {
  const source = doc.querySelector(".subject-awards");
  if (!source) {
    return null;
  }

  const awards = $$<HTMLLIElement>("li", source).flatMap((item) => {
    const [yearElement, ceremonyElement, awardElement, workElement] = [
      ...item.children,
    ];
    const year = safeText(yearElement);
    const ceremony = safeText(ceremonyElement);
    const award = safeText(awardElement);
    if (!(year && ceremony && award)) {
      return [];
    }

    return [
      {
        award,
        ceremony,
        ceremonyHref: hrefOf(ceremonyElement),
        work: safeText(workElement) || null,
        workHref: hrefOf(workElement),
        year,
      } satisfies PersonageAward,
    ];
  });

  const allAwardsLink = source.querySelector<HTMLAnchorElement>("h2 a[href]");
  const allAwardsHref = allAwardsLink?.href ?? null;
  const awardsCountMatch = allAwardsLink?.textContent?.match(/\d+/u)?.[0];

  return {
    allAwardsHref,
    ...(awardsCountMatch ? { totalCount: Number(awardsCountMatch) } : {}),
    awards,
  };
};

const extractGallery = (
  doc: Document,
  personageId: string
): PersonageGallery | null => {
  const galleryPath = `/personage/${personageId}/photos`;
  const source = doc.querySelector(".subject-picture");
  if (!source) {
    return null;
  }
  const allImagesLink = $$<HTMLAnchorElement>("a[href]", source).find(
    (link) =>
      new URL(link.getAttribute("href") ?? "", doc.baseURI).pathname.replace(
        /\/$/u,
        ""
      ) === galleryPath
  );

  const images = $$<HTMLElement>("li.picture", source).flatMap((image) => {
    const src = imageUrl(image);
    if (!src) {
      return [];
    }
    return [
      {
        alt: image.getAttribute("aria-label")?.trim() ?? "",
        largeSrc: largePhotoUrl(src),
        src,
      } satisfies PersonageGalleryImage,
    ];
  });

  return {
    allImagesHref: allImagesLink?.href ?? null,
    images,
  };
};

const extractWorkRail = (
  doc: Document,
  matchesHeading: (heading: string) => boolean
): PersonageWorkRail | null => {
  const source = $$<HTMLElement>(".subject-creations", doc).find((section) =>
    matchesHeading(safeText(section.querySelector("h2")))
  );
  if (!source) {
    return null;
  }

  let lastYear: string | null = null;
  const works = $$<HTMLElement>("li.creation", source).flatMap((item) => {
    const posterLink =
      item.querySelector<HTMLAnchorElement>("a.img_wrap[href]");
    const title = posterLink?.title.trim() ?? "";
    if (!posterLink || !title) {
      return [];
    }

    // Year: recent works use .timeline-year, representative works use .pl
    // The year element only appears on the first work of each year group;
    // subsequent works in the same year inherit from it.
    const yearElement =
      item.querySelector<HTMLElement>(".timeline-year") ??
      item.querySelector<HTMLElement>(".pl");
    const rawYear = yearElement ? safeText(yearElement).trim() : "";
    // Only accept 4-digit year-like values to avoid false positives
    const currentYear = /^\d{4}$/u.test(rawYear) ? rawYear : lastYear;
    if (/^\d{4}$/u.test(rawYear)) {
      lastYear = rawYear;
    }

    return [
      {
        href: posterLink.href,
        poster: imageUrl(posterLink.querySelector("img")) ?? "",
        rating: safeText(item.querySelector(".rating-val")) || null,
        title,
        year: currentYear,
      } satisfies PersonageWork,
    ];
  });

  const allWorksLink = $$<HTMLAnchorElement>("a[href]", source).find((link) =>
    new URL(link.href).pathname.includes("/creations")
  );
  const allWorksHref = allWorksLink?.href;
  const totalCountMatch = allWorksLink?.textContent?.match(/\d+/u)?.[0];

  return {
    allWorksHref: allWorksHref ?? null,
    ...(totalCountMatch ? { totalCount: Number(totalCountMatch) } : {}),
    works,
  };
};

const extractPersonageProfile = (doc: Document): PersonageProfile | null => {
  const target = doc.querySelector(".subject-target");
  const name = safeText(target?.querySelector(".subject-name"));
  const id = personageIdFromPath(doc.defaultView?.location.pathname ?? "");
  if (!target || !name || !id) {
    return null;
  }

  return {
    awards: extractAwards(doc),
    biography: extractBiography(doc),
    collaborators: extractCollaborators(doc),
    facts: extractFacts(target),
    gallery: extractGallery(doc, id),
    id,
    name,
    portrait: imageUrl(
      target.querySelector(".avatar img, .subject-avatar img") ??
        target.querySelector(".avatar, .subject-avatar")
    ),
    recentWorks: extractWorkRail(doc, (heading) => heading.includes("最近")),
    representativeWorks: extractWorkRail(doc, (heading) =>
      heading.includes("收藏人数最多")
    ),
  };
};

export { extractPersonageProfile, personageIdFromPath };
