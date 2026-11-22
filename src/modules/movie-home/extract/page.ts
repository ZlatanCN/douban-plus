import type {
  MovieHomeData,
  MovieHomeMovie,
  WebLink,
} from "@/modules/movie-home/domain";

import { extractEditorialSections } from "./editorial";
import {
  MOVIE_HOME_URL,
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
  const action = form?.getAttribute("action") ?? null;
  const navigation = [
    ...doc.querySelectorAll("#db-nav-movie .nav-items a"),
  ].map(linkOf);

  if (
    !action ||
    !query?.name ||
    !category?.name ||
    navigation.length === 0 ||
    navigation.some((item) => item === null)
  ) {
    return null;
  }

  return {
    navigation: navigation.filter((item): item is WebLink => item !== null),
    search: {
      action: new URL(action, MOVIE_HOME_URL).href,
      categoryName: category.name,
      categoryValue: category.value,
      queryName: query.name,
    },
  };
};

const extractHotMovie = (item: HTMLElement): MovieHomeMovie | null => {
  const subject = item.querySelector(".title a");
  const subjectHref = hrefOf(subject);
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

  return {
    poster: imageOf(poster?.parentElement ?? item),
    rating,
    subjectHref,
    ticketHref: hrefOf(ticket) ?? hrefValueOf(item.dataset.ticket),
    title,
  };
};

const extractHotMovies = (doc: Document): MovieHomeData["hotMovies"] | null => {
  const section = doc.querySelector("#screening");
  const content = section?.querySelector(".screening-bd .ui-slide-content");
  const links = [...(section?.querySelectorAll("h2 a") ?? [])].map(linkOf);
  const nowPlaying = links.find((link) => link?.label.includes("全部正在热映"));
  const upcoming = links.find((link) => link?.label.includes("即将上映"));
  const movies = [...(content?.children ?? [])]
    .filter((item): item is HTMLElement =>
      item.matches(".ui-slide-item[data-title]")
    )
    .map(extractHotMovie);

  if (
    !content ||
    !nowPlaying ||
    !upcoming ||
    movies.length === 0 ||
    movies.some((movie) => movie === null)
  ) {
    return null;
  }

  return {
    nowPlaying,
    movies: movies.filter((movie): movie is MovieHomeMovie => movie !== null),
    upcoming,
  };
};

const extractMovieHome = (doc: Document): MovieHomeData | null => {
  const nativeSearch = doc.querySelector<HTMLInputElement>("#inp-query");
  if (nativeSearch?.value.trim()) {
    return null;
  }

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
};

export { extractMovieHome };
