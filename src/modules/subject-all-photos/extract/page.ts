import { $$, safeText } from "@/shared/utils/dom";

import type {
  SubjectPhotoGroup,
  SubjectPhotoPreview,
  SubjectAllPhotosPageData,
} from "../domain";

const titleFromHeading = (heading: string): string =>
  heading.replace(/\s*的?全部图片\s*$/u, "").trim();

const labelFromHeading = (heading: string): string =>
  heading
    .replace(/\s*\(?\s*共\s*[\d,]+\s*张\s*\)?\s*$/u, "")
    .split("·", 1)[0]
    ?.trim() ?? "";

const countFromHeading = (heading: string): number | null => {
  const count = heading.match(/共\s*(?<count>[\d,]+)\s*张/u)?.groups?.count;
  if (!count) {
    return null;
  }

  const parsed = Number(count.replaceAll(",", ""));
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

const photoPreviewsFromGroup = (group: Element): SubjectPhotoPreview[] =>
  $$<HTMLAnchorElement>(
    "ul.pic-col5 > li:not(.more-pics) > a[href]",
    group
  ).flatMap((link) => {
    const image = link.querySelector<HTMLImageElement>("img[src]");
    const src = image?.currentSrc || image?.src;
    return src ? [{ href: link.href, src }] : [];
  });

const extractGroup = (group: Element): SubjectPhotoGroup | null => {
  const heading = group.querySelector("h2");
  const allLink = heading?.querySelector<HTMLAnchorElement>("a[href]");
  if (!heading || !allLink) {
    return null;
  }

  const headingText = safeText(heading);
  const label = labelFromHeading(headingText);
  const count = countFromHeading(headingText);
  const photos = photoPreviewsFromGroup(group);
  if (!label || count === null || photos.length === 0) {
    return null;
  }

  return { allHref: allLink.href, count, label, photos };
};

const isSubjectHomeHref = (href: string): boolean => {
  try {
    return new URL(href).pathname.match(/^\/subject\/\d+\/?$/u) !== null;
  } catch {
    return false;
  }
};

const extractSubjectAllPhotosPage = (
  doc: Document
): SubjectAllPhotosPageData | null => {
  const title = titleFromHeading(safeText(doc.querySelector("#content h1")));
  const subjectHref = $$<HTMLAnchorElement>(".aside a[href]", doc).find(
    (link) => isSubjectHomeHref(link.href)
  )?.href;
  const uploadHref = $$<HTMLAnchorElement>(".aside a[href]", doc).find((link) =>
    /上传(?:剧照|海报|壁纸)/u.test(safeText(link))
  )?.href;
  const groups = $$<HTMLElement>(".article > .mod", doc).flatMap((group) => {
    const extracted = extractGroup(group);
    return extracted ? [extracted] : [];
  });

  if (!title || !subjectHref || groups.length === 0) {
    return null;
  }

  return { groups, subjectHref, title, uploadHref: uploadHref ?? null };
};

export { extractSubjectAllPhotosPage };
