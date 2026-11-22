import { useState } from "preact/hooks";

import type { MovieHomeData } from "@/modules/movie-home/domain";
import { createMovieHomePaging } from "@/modules/movie-home/paging";
import { Section } from "@/shared/components/layout/section";

import { MovieGrid } from "./movie-grid";

type HotMoviesProps = {
  data: MovieHomeData["hotMovies"];
  initialPage: number;
};

const HotMovies = ({ data, initialPage }: HotMoviesProps) => {
  const paging = createMovieHomePaging(data.movies.length);
  const [page, setPage] = useState(paging.clampPage(initialPage));
  const visibleMovies = paging.moviesOnPage(data.movies, page);

  const changePage = (nextPage: number): void => {
    const visiblePage = paging.clampPage(nextPage);
    if (visiblePage === page || nextPage < 1 || nextPage > paging.pageCount) {
      return;
    }
    setPage(visiblePage);
  };

  return (
    <Section
      actions={
        <fieldset aria-label="热映分页" class="atv-movie-home-pagination">
          <button
            aria-disabled={page === 1}
            class="atv-movie-home-previous"
            onClick={() => changePage(page - 1)}
            type="button"
          >
            上一组
          </button>
          <span
            aria-live="polite"
            class="atv-movie-home-page-count"
          >{`${page} / ${paging.pageCount}`}</span>
          <button
            aria-disabled={page === paging.pageCount}
            class="atv-movie-home-next"
            onClick={() => changePage(page + 1)}
            type="button"
          >
            下一组
          </button>
        </fieldset>
      }
      id="atv-movie-home-now-playing"
      title="正在热映"
    >
      <div class="atv-movie-home-hot-links">
        <a href={data.nowPlaying.href}>{data.nowPlaying.label}</a>
        <a href={data.upcoming.href}>{data.upcoming.label}</a>
      </div>
      <MovieGrid movies={visibleMovies} />
    </Section>
  );
};

export { HotMovies };
