import { describe, expect, it } from "vitest";

import { createMovieHomePaging } from "@/modules/movie-home/paging";

describe("movie homepage paging", () => {
  it("owns page size, count, initial selection and clamping", () => {
    const paging = createMovieHomePaging(6);
    const movies = ["one", "two", "three", "four", "five", "six"];

    expect({
      first: paging.moviesOnPage(movies, paging.initialPage),
      initialPage: paging.initialPage,
      last: paging.moviesOnPage(movies, paging.clampPage(8)),
      pageCount: paging.pageCount,
      pageSize: paging.pageSize,
    }).toStrictEqual({
      first: ["one", "two", "three", "four"],
      initialPage: 1,
      last: ["five", "six"],
      pageCount: 2,
      pageSize: 4,
    });
  });

  it("always exposes one empty page for an empty movie collection", () => {
    const paging = createMovieHomePaging(0);

    expect({
      movies: paging.moviesOnPage([], paging.initialPage),
      pageCount: paging.pageCount,
    }).toStrictEqual({ movies: [], pageCount: 1 });
  });
});
