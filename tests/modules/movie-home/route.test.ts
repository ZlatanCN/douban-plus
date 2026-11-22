import { describe, expect, it } from "vitest";

import { movieHomePage } from "@/modules/movie-home";

describe(movieHomePage.matches, () => {
  it("accepts only the movie-site root route", () => {
    expect(
      movieHomePage.matches({ hostname: "movie.douban.com", pathname: "/" })
    ).toBeTruthy();
    expect(
      movieHomePage.matches({
        hostname: "movie.douban.com",
        pathname: "/subject/1292052/",
      })
    ).toBeFalsy();
    expect(
      movieHomePage.matches({
        hostname: "www.douban.com",
        pathname: "/",
      })
    ).toBeFalsy();
  });
});
