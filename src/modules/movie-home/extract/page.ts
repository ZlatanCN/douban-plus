import type {
  MovieHomeData,
  MovieHomeMovie,
} from "@/modules/movie-home/domain";

import { extractEditorialSections } from "./editorial";
import {
  completeItems,
  hrefOf,
  hrefValueOf,
  imageOf,
  linkOf,
  textOf,
} from "./native";

const extractHeader = (
  doc: Document
): Pick<MovieHomeData, "navigation" | "search"> | null => {
  const form = doc.querySelector<HTMLFormElement>(
    "#db-nav-movie .nav-search form"
  );
  const query = form?.querySelector<HTMLInputElement>(
    "input[name='search_text']"
  );
  const category = form?.querySelector<HTMLInputElement>("input[name='cat']");
  const action = hrefValueOf(form?.getAttribute("action"), "search");
  const navigation = completeItems(
    [...doc.querySelectorAll("#db-nav-movie .nav-items a")].map((link) =>
      linkOf(link, "douban")
    ),
    "电影导航条目缺失"
  );

  if (
    !action ||
    !query?.name ||
    !category?.name ||
    !category.value ||
    navigation.length === 0
  ) {
    return null;
  }

  return {
    navigation,
    search: {
      action,
      categoryName: category.name,
      categoryValue: category.value,
      queryName: query.name,
    },
  };
};

const extractHotMovie = (item: HTMLElement): MovieHomeMovie | null => {
  const subject = item.querySelector(".title a");
  const subjectHref = hrefOf(subject, "movie-subject");
  const title = item.dataset.title?.trim() || textOf(subject);
  if (!subjectHref || !title) {
    return null;
  }

  const poster = item.querySelector(".poster img");
  const rating =
    item.dataset.rate?.trim() ||
    textOf(item.querySelector(".subject-rate")) ||
    null;
  const ticket = item.querySelector(".ticket_btn a");
  const ticketElementHref = ticket ? hrefOf(ticket, "movie-ticket") : null;
  if (ticket && !ticketElementHref) {
    return null;
  }
  const ticketHref =
    ticketElementHref ?? hrefValueOf(item.dataset.ticket, "movie-ticket");
  if (!ticket && item.dataset.ticket?.trim() && !ticketHref) {
    return null;
  }

  return {
    poster: imageOf(poster?.parentElement ?? item),
    rating,
    subjectHref,
    ticketHref,
    title,
  };
};

const hasMovieEntry = (item: HTMLElement): boolean =>
  Boolean(
    item.dataset.title?.trim() ||
    item.dataset.ticket?.trim() ||
    item.querySelector(".title a, .poster a, .ticket_btn a")
  );

const extractHotMovies = (doc: Document): MovieHomeData["hotMovies"] | null => {
  const section = doc.querySelector("#screening");
  const content = section?.querySelector(".screening-bd .ui-slide-content");
  const headingLinks = [...(section?.querySelectorAll("h2 a") ?? [])];
  const nowPlaying = linkOf(
    headingLinks.find((link) => textOf(link).includes("全部正在热映")) ?? null,
    "movie"
  );
  const upcoming = linkOf(
    headingLinks.find((link) => textOf(link).includes("即将上映")) ?? null,
    "movie"
  );
  const movies = completeItems(
    [...(content?.children ?? [])]
      .filter(
        (item): item is HTMLElement =>
          item instanceof HTMLElement &&
          item.matches(".ui-slide-item") &&
          hasMovieEntry(item)
      )
      .map(extractHotMovie),
    "热映作品条目缺失"
  );

  if (!content || !nowPlaying || !upcoming || movies.length === 0) {
    return null;
  }

  return { nowPlaying, movies, upcoming };
};

const extractMovieHome = (doc: Document): MovieHomeData | null => {
  const nativeSearch = doc.querySelector<HTMLInputElement>("#inp-query");
  if (nativeSearch?.value.trim()) {
    return null;
  }

  try {
    const header = extractHeader(doc);
    const hotMovies = extractHotMovies(doc);
    const editorial = extractEditorialSections(doc);
    if (!header || !hotMovies || !editorial) {
      return null;
    }

    return {
      ...header,
      hotMovies,
      ...editorial,
    };
  } catch (error) {
    console.warn("[ATV-Douban] 电影首页数据提取不完整", error);
    return null;
  }
};

export { extractMovieHome };
