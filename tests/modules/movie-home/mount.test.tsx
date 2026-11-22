import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { movieHomePage } from "@/modules/movie-home";

import { createTestDoc } from "../../helpers/doc";

const movieHomeFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/movie-home.html"),
  "utf-8"
);

describe(movieHomePage.mount, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders all available homepage content through the normal mount entry", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");

    movieHomePage.mount(doc);

    const sectionTitles = [
      ...doc.querySelectorAll<HTMLElement>(
        "#atv-douban-root main .atv-section h2"
      ),
    ].map((heading) => heading.textContent);

    expect({
      contactRemoved: !doc
        .querySelector("#atv-douban-root")
        ?.textContent?.includes("合作联系"),
      enhanced: doc.body.classList.contains("atv-enhanced"),
      firstRating: doc.querySelector(".atv-movie-home-rating")?.textContent,
      movieCount: doc.querySelectorAll(".atv-movie-home-movie").length,
      posterFallback: Boolean(
        doc.querySelector(".atv-movie-home-poster-fallback")
      ),
      sectionTitles,
    }).toStrictEqual({
      contactRemoved: true,
      enhanced: true,
      firstRating: "暂无评分",
      movieCount: 4,
      posterFallback: true,
      sectionTitles: [
        "正在热映",
        "一周口碑榜",
        "热门片单",
        "热门推荐",
        "最受欢迎的影评",
      ],
    });

    cleanup();
  });

  it("leaves the native homepage active when the native search has input", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const nativeSearch = doc.querySelector<HTMLInputElement>("#inp-query");
    if (nativeSearch) {
      nativeSearch.value = "沙丘";
    }

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector<HTMLInputElement>("#inp-query")?.value).toBe(
      "沙丘"
    );

    cleanup();
  });

  it("leaves the native homepage active when one existing hot movie is incomplete", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const brokenTitle = [
      ...doc.querySelectorAll<HTMLAnchorElement>(".screening-bd .title a"),
    ].find((link) => link.textContent?.trim() === "试探");
    brokenTitle?.remove();

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#screening")).not.toBeNull();

    cleanup();
  });

  it("uses the visible hot-movie title when data-title is absent", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const firstMovie = doc.querySelector<HTMLElement>(
      ".screening-bd .ui-slide-item"
    );
    if (firstMovie) {
      delete firstMovie.dataset.title;
    }

    movieHomePage.mount(doc);

    expect(
      [
        ...doc.querySelectorAll(
          "#atv-movie-home-now-playing .atv-movie-home-movie-title a"
        ),
      ].map((link) => link.textContent)
    ).toContain("饥饿游戏：收获日出");

    cleanup();
  });

  it("ignores empty carousel placeholder items without hiding real movies", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const hotList = doc.querySelector(".screening-bd .ui-slide-content");
    const placeholder = doc.createElement("li");
    placeholder.className = "ui-slide-item";
    hotList?.prepend(placeholder);

    movieHomePage.mount(doc);

    expect({
      enhanced: doc.body.classList.contains("atv-enhanced"),
      movieCount: doc.querySelectorAll(".atv-movie-home-movie").length,
    }).toStrictEqual({ enhanced: true, movieCount: 4 });

    cleanup();
  });

  it("leaves the native homepage active when an existing movie link is not a native subject target", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    doc
      .querySelector<HTMLAnchorElement>(".screening-bd .title a")
      ?.setAttribute("href", "https://example.com/subject/36915988/");

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#screening")).not.toBeNull();

    cleanup();
  });

  it("leaves the native homepage active when an existing ticket link is invalid", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    doc
      .querySelector<HTMLAnchorElement>(".screening-bd .ticket_btn a")
      ?.setAttribute("href", "https://movie.douban.com/ticket/not-a-redirect");

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();

    cleanup();
  });

  it("leaves the native homepage active when a required editorial entry link is invalid", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    doc
      .querySelector<HTMLAnchorElement>("#billboard .billboard-hd h2 a")
      ?.setAttribute("href", "https://example.com/chart");

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#billboard")).not.toBeNull();

    cleanup();
  });

  it("leaves the native homepage active when an existing recommendation image link is invalid", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const recommendationImage =
      doc.querySelector<HTMLImageElement>("#hot-gallery img");
    if (recommendationImage) {
      recommendationImage.dataset.original =
        "https://example.com/recommendation.jpg";
    }
    recommendationImage?.setAttribute(
      "src",
      "https://example.com/recommendation.jpg"
    );

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();

    cleanup();
  });

  it("leaves the native homepage active when an existing navigation target is invalid", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    doc
      .querySelector<HTMLAnchorElement>("#db-nav-movie .nav-items a")
      ?.setAttribute("href", "https://example.com/cinema/nowplaying/");

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#db-nav-movie")).not.toBeNull();

    cleanup();
  });

  it("omits a confirmed empty optional section without blocking the page", () => {
    const { cleanup, doc } = createTestDoc(
      movieHomeFixture.replace(
        /<div id="billboard"[\s\S]*?<div id="doulist">/u,
        '<div id="doulist">'
      ),
      "/"
    );

    movieHomePage.mount(doc);

    const titles = [
      ...doc.querySelectorAll<HTMLElement>(
        "#atv-douban-root main .atv-section h2"
      ),
    ].map((heading) => heading.textContent);
    expect(titles).toStrictEqual([
      "正在热映",
      "热门片单",
      "热门推荐",
      "最受欢迎的影评",
    ]);

    cleanup();
  });

  it("allows every existing optional section to be empty", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    for (const row of doc.querySelectorAll("#billboard .billboard-bd tr")) {
      row.remove();
    }
    for (const item of doc.querySelectorAll("#doulist ul > li")) {
      item.remove();
    }
    for (const item of doc.querySelectorAll("#hot-gallery .gallery-frame")) {
      item.remove();
    }
    for (const item of doc.querySelectorAll(".reviews-bd .review")) {
      item.remove();
    }

    movieHomePage.mount(doc);

    expect(
      [
        ...doc.querySelectorAll<HTMLElement>(
          "#atv-douban-root main .atv-section h2"
        ),
      ].map((heading) => heading.textContent)
    ).toStrictEqual(["正在热映"]);

    cleanup();
  });

  it("omits an existing ranking section when Douban confirms it has no rows", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    for (const row of doc.querySelectorAll("#billboard .billboard-bd tr")) {
      row.remove();
    }

    movieHomePage.mount(doc);

    const titles = [
      ...doc.querySelectorAll<HTMLElement>(
        "#atv-douban-root main .atv-section h2"
      ),
    ].map((heading) => heading.textContent);
    expect(titles).toStrictEqual([
      "正在热映",
      "热门片单",
      "热门推荐",
      "最受欢迎的影评",
    ]);

    cleanup();
  });

  it("retains the native page when one existing ranking entry cannot be extracted", () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");
    const brokenRankingLink = [
      ...doc.querySelectorAll<HTMLAnchorElement>("#billboard .title a"),
    ].find((link) => link.textContent?.trim() === "黑球");
    brokenRankingLink?.remove();

    movieHomePage.mount(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#billboard")).not.toBeNull();

    cleanup();
  });

  it("keeps native destinations, ratings, prices and editorial metadata", async () => {
    const { cleanup, doc } = createTestDoc(movieHomeFixture, "/");

    movieHomePage.mount(doc);

    const firstMovie = doc.querySelector(
      "#atv-douban-root .atv-movie-home-movie"
    );
    const review = doc.querySelector("#atv-douban-root .atv-movie-home-review");
    expect({
      hotLinks: [
        ...doc.querySelectorAll<HTMLAnchorElement>(
          ".atv-movie-home-hot-links a"
        ),
      ].map((link) => [link.textContent, link.href]),
      list: [
        ...doc.querySelectorAll<HTMLElement>(".atv-movie-home-lists li"),
      ].map((item) => item.textContent),
      movie: {
        poster: firstMovie?.querySelector("img")?.src,
        subject: firstMovie?.querySelector<HTMLAnchorElement>(
          ".atv-movie-home-movie-title a"
        )?.href,
        ticket: firstMovie?.querySelector<HTMLAnchorElement>(
          ".atv-movie-home-ticket"
        )?.href,
      },
      ranking: [
        ...doc.querySelectorAll<HTMLElement>(".atv-movie-home-ranking li"),
      ].map((item) => item.textContent),
      recommendation: {
        href: doc.querySelector<HTMLAnchorElement>(
          ".atv-movie-home-recommendations > a"
        )?.href,
        text: doc.querySelector(".atv-movie-home-recommendations")?.textContent,
      },
      review: {
        author: review
          ?.querySelector<HTMLAnchorElement>(".atv-movie-home-review-meta a")
          ?.getAttribute("href"),
        fullText: review
          ?.querySelector<HTMLAnchorElement>(
            ".atv-movie-home-review > div > p:last-child a"
          )
          ?.getAttribute("href"),
        subject: review
          ?.querySelectorAll<HTMLAnchorElement>(
            ".atv-movie-home-review-meta a"
          )[1]
          ?.getAttribute("href"),
        title: review?.querySelector("h3 a")?.textContent,
      },
    }).toStrictEqual({
      hotLinks: [
        ["全部正在热映»", "https://movie.douban.com/cinema/nowplaying/"],
        ["即将上映»", "https://movie.douban.com/later/"],
      ],
      list: ["我爱欧洲古装剧25推荐", "世界电影史（考研①号片单）73推荐"],
      movie: {
        poster:
          "https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2937429510.jpg",
        subject: "https://movie.douban.com/subject/36915988/?from=showing",
        ticket: "https://movie.douban.com/ticket/redirect/?movie_id=36915988",
      },
      ranking: ["1可能的爱", "2黑球", "3珠穆朗玛：云中彼岸"],
      recommendation: {
        href: "https://movie.douban.com/annual/2025/?fullscreen=1&dt_from=doubanmovie",
        text: "「豆瓣2025年度电影榜单」正式上线！点击查看完整榜单，开启全年佳片好剧大赏。",
      },
      review: {
        author: "https://www.douban.com/people/aiyuhaoduoyu/",
        fullText: "https://movie.douban.com/review/17914142/",
        subject: "https://movie.douban.com/subject/36847425/?from=reviews",
        title: "关于电影，关于我们",
      },
    });

    const posterImage = firstMovie?.querySelector<HTMLImageElement>("img");
    posterImage?.dispatchEvent(new Event("error"));
    await vi.waitFor(() =>
      expect(
        firstMovie?.querySelector(".atv-poster-placeholder")
      ).not.toBeNull()
    );

    cleanup();
  });
});
