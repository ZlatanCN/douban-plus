import { $$, safeText } from "@/shared/utils/dom";

import type {
  CelebrityWork,
  SubjectCelebritiesPageData,
  SubjectCelebrityCredit,
  SubjectCelebrityGroup,
} from "../domain";

const subjectIdFromPath = (pathname: string): string | null =>
  pathname.match(/^\/subject\/(?<id>\d+)\/celebrities\/?$/u)?.groups?.id ??
  null;

const titleFromHeading = (heading: string): string =>
  heading.replace(/\s*的?全部演职员\s*$/u, "").trim();

const backgroundImageUrls = (style: string): string[] =>
  [...style.matchAll(/url\(["']?(?<url>[^"')]+)["']?\)/gu)].flatMap(
    (match) => match.groups?.url ?? []
  );

const extractAvatar = (credit: Element): string | null => {
  const style = credit.querySelector(".avatar")?.getAttribute("style") ?? "";
  return backgroundImageUrls(style).at(-1) ?? null;
};

const extractWorks = (credit: Element): CelebrityWork[] =>
  $$<HTMLAnchorElement>(".works a[href]", credit).flatMap((link) => {
    const title = safeText(link);
    return title ? [{ href: link.href, title }] : [];
  });

const extractCredit = (credit: Element): SubjectCelebrityCredit | null => {
  const nameLink = credit.querySelector<HTMLAnchorElement>(
    ".info .name a[href], .info a.name[href]"
  );
  const profileLink =
    nameLink ??
    credit.querySelector<HTMLAnchorElement>(
      'a[href*="/personage/"], a[href*="/celebrity/"]'
    );
  const name = safeText(nameLink ?? credit.querySelector(".info .name, .name"));
  if (!name) {
    return null;
  }

  return {
    avatar: extractAvatar(credit),
    credit: safeText(credit.querySelector(".info .role, .role")) || null,
    href: profileLink?.href ?? null,
    name,
    works: extractWorks(credit),
  };
};

const extractGroups = (doc: Document): SubjectCelebrityGroup[] | null => {
  const groups = $$<HTMLElement>("#celebrities > .list-wrapper", doc);
  const extractedGroups: SubjectCelebrityGroup[] = [];

  for (const group of groups) {
    const title = safeText(group.querySelector(":scope > h2"));
    if (!title) {
      continue;
    }

    const credits: SubjectCelebrityCredit[] = [];
    for (const credit of $$<HTMLElement>(
      ".celebrities-list > li.celebrity",
      group
    )) {
      const extractedCredit = extractCredit(credit);
      if (!extractedCredit) {
        return null;
      }
      credits.push(extractedCredit);
    }

    extractedGroups.push({ credits, title });
  }

  return extractedGroups;
};

const extractSubjectCelebritiesPage = (
  doc: Document
): SubjectCelebritiesPageData | null => {
  const subjectId = subjectIdFromPath(
    doc.defaultView?.location.pathname ?? doc.location.pathname
  );
  const title = titleFromHeading(safeText(doc.querySelector("#content h1")));
  const groups = extractGroups(doc);
  if (!subjectId || !title || !groups || groups.length === 0) {
    return null;
  }

  return {
    groups,
    subjectHref: `https://movie.douban.com/subject/${subjectId}/`,
    subjectId,
    title,
  };
};

export { extractSubjectCelebritiesPage, subjectIdFromPath };
