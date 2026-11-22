import { render } from "preact";

import { extractMovieHome } from "@/modules/movie-home/extract/page";
import { MovieHomePage } from "@/modules/movie-home/presentation/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

import { readMovieHomePage, writeMovieHomePage } from "./page-history";

const isMovieHome = (location: PageLocation): boolean =>
  location.hostname === "movie.douban.com" && location.pathname === "/";

const mountMovieHome = (doc: Document = document): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const data = extractMovieHome(doc);
  if (!data) {
    console.warn("[ATV-Douban] 电影首页数据提取失败，保留原生页面");
    return;
  }

  const pageCount = Math.max(1, Math.ceil(data.hotMovies.movies.length / 4));
  const requestedPage = readMovieHomePage(doc);
  const initialPage = Math.min(requestedPage, pageCount);
  const installed = installEnhancedRoot(doc, (root) =>
    render(
      <MovieHomePage
        data={data}
        initialPage={initialPage}
        onPageChange={(page) => writeMovieHomePage(doc, page)}
      />,
      root
    )
  );
  if (installed && requestedPage !== initialPage) {
    writeMovieHomePage(doc, initialPage);
  }
};

const movieHomePage: PageMount = {
  matches: isMovieHome,
  mount: mountMovieHome,
};

export { isMovieHome, mountMovieHome, movieHomePage };
