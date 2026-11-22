import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { movieHomePage } from "@/modules/movie-home";

import { createTestDoc } from "../../helpers/doc";

const movieHomeFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/movie-home.html"),
  "utf-8"
);

const movieTitles = (doc: Document): string[] =>
  [
    ...doc.querySelectorAll<HTMLAnchorElement>(
      "#atv-movie-home-now-playing .atv-movie-home-movie-title a"
    ),
  ].map((link) => link.textContent ?? "");

describe("movie homepage interactions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "");
    document.body.innerHTML = "";
  });

  it("pages through every hot movie in groups of four without writing page state to history", async () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    window.history.replaceState({ atvMovieHomePage: 8, retained: true }, "");
    const replaceState = vi.spyOn(window.history, "replaceState");

    movieHomePage.mount(doc);

    const next = doc.querySelector<HTMLButtonElement>(".atv-movie-home-next");
    expect({
      count: doc.querySelector(".atv-movie-home-page-count")?.textContent,
      movieCount: movieTitles(doc).length,
    }).toStrictEqual({ count: "1 / 2", movieCount: 4 });

    next?.focus();
    next?.click();
    await vi.waitFor(() =>
      expect(doc.querySelector(".atv-movie-home-page-count")?.textContent).toBe(
        "2 / 2"
      )
    );

    expect({
      activeIsNext: doc.activeElement === next,
      historyState: window.history.state,
      historyWrites: replaceState.mock.calls.length,
      movies: movieTitles(doc),
    }).toStrictEqual({
      activeIsNext: true,
      historyState: { atvMovieHomePage: 8, retained: true },
      historyWrites: 0,
      movies: [
        "一个很长很长很长很长很长很长很长很长很长很长的片名",
        "末组作品",
      ],
    });

    cleanup();
  });

  it("starts a newly mounted page at group one regardless of existing history state", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    window.history.replaceState({ atvMovieHomePage: 8 }, "");

    movieHomePage.mount(doc);

    expect(doc.querySelector(".atv-movie-home-page-count")?.textContent).toBe(
      "1 / 2"
    );
    expect(movieTitles(doc)).toStrictEqual([
      "饥饿游戏：收获日出 The Hunger Games: Sunrise on the Reaping",
      "珠穆朗玛：云中彼岸 Everest: The Other Side",
      "试探",
      "没有海报的作品",
    ]);

    cleanup();
  });

  it("submits the native complete search in the current tab", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");

    movieHomePage.mount(doc);

    const form = doc.querySelector<HTMLFormElement>(
      "#atv-douban-root .atv-movie-home-search"
    );
    const query = form?.querySelector<HTMLInputElement>(
      "input[name='search_text']"
    );
    const category = form?.querySelector<HTMLInputElement>("input[name='cat']");

    expect({
      action: form?.action,
      category: category?.value,
      method: form?.method,
      queryType: query?.type,
      target: form?.target,
    }).toStrictEqual({
      action: "https://search.douban.com/movie/subject_search",
      category: "1002",
      method: "get",
      queryType: "search",
      target: "",
    });

    cleanup();
  });
});
