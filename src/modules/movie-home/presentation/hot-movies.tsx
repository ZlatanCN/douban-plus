import { useState } from "preact/hooks";

import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

import { MovieGrid } from "./movie-grid";

const PAGE_SIZE = 4;

type HotMoviesProps = {
  data: MovieHomeData["hotMovies"];
  initialPage: number;
  onPageChange: (page: number) => void;
};

const HotMovies = ({ data, initialPage, onPageChange }: HotMoviesProps) => {
  const pageCount = Math.max(1, Math.ceil(data.movies.length / PAGE_SIZE));
  const [page, setPage] = useState(Math.min(initialPage, pageCount));
  const visibleMovies = data.movies.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const changePage = (nextPage: number): void => {
    if (nextPage < 1 || nextPage > pageCount || nextPage === page) {
      return;
    }
    setPage(nextPage);
    onPageChange(nextPage);
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
          >{`${page} / ${pageCount}`}</span>
          <button
            aria-disabled={page === pageCount}
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
