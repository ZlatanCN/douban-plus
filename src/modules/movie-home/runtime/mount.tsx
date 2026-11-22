import { render } from "preact";

import { extractMovieHome } from "@/modules/movie-home/extract/page";
import { createMovieHomePaging } from "@/modules/movie-home/paging";
import { MovieHomePage } from "@/modules/movie-home/presentation/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

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

  const paging = createMovieHomePaging(data.hotMovies.movies.length);
  const installed = installEnhancedRoot(doc, (root) =>
    render(<MovieHomePage data={data} initialPage={paging.initialPage} />, root)
  );
  if (!installed) {
    console.warn("[ATV-Douban] 电影首页挂载失败，保留原生页面");
  }
};

const movieHomePage: PageMount = {
  matches: isMovieHome,
  mount: mountMovieHome,
};

export { isMovieHome, mountMovieHome, movieHomePage };
