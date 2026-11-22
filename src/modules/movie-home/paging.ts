const PAGE_SIZE = 4;

type MovieHomePaging = {
  clampPage: (page: number) => number;
  initialPage: number;
  moviesOnPage: <Movie>(movies: Movie[], page: number) => Movie[];
  pageCount: number;
  pageSize: number;
};

const createMovieHomePaging = (movieCount: number): MovieHomePaging => {
  const pageCount = Math.max(1, Math.ceil(movieCount / PAGE_SIZE));
  const clampPage = (page: number): number => {
    if (!Number.isInteger(page)) {
      return 1;
    }
    return Math.min(Math.max(page, 1), pageCount);
  };

  return {
    clampPage,
    initialPage: 1,
    moviesOnPage: <Movie>(movies: Movie[], page: number): Movie[] => {
      const visiblePage = clampPage(page);
      return movies.slice(
        (visiblePage - 1) * PAGE_SIZE,
        visiblePage * PAGE_SIZE
      );
    },
    pageCount,
    pageSize: PAGE_SIZE,
  };
};

export { createMovieHomePaging, type MovieHomePaging };
