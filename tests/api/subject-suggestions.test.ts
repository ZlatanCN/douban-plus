import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchSubjectSuggestions,
  normalizeSubjectQuery,
} from "@/modules/subject/api/subject-suggestions";

const response = (body: unknown): Response => Response.json(body);

describe(fetchSubjectSuggestions, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns validated movie and TV candidates from Douban's suggestion endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      response([
        {
          episode: "10",
          id: "3016187",
          img: "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p1910924635.webp",
          sub_title: "Game of Thrones",
          title: "权力的游戏 第一季",
          type: "movie",
          url: "https://movie.douban.com/subject/3016187/?suggest=权力",
          year: "2011",
        },
        {
          id: "999",
          title: "不应显示",
          url: "https://example.com/subject/999/",
        },
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSubjectSuggestions("权力")).resolves.toStrictEqual([
      {
        episode: "10",
        id: "3016187",
        imageUrl:
          "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p1910924635.webp",
        originalTitle: "Game of Thrones",
        title: "权力的游戏 第一季",
        url: "https://movie.douban.com/subject/3016187/?suggest=权力",
        year: "2011",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/j/subject_suggest?q=%E6%9D%83%E5%8A%9B"
    );
  });

  it("uses one cached response for equivalent non-empty queries", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSubjectSuggestions("  流浪   地球 ");
    await fetchSubjectSuggestions("流浪 地球");

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/j/subject_suggest?q=%E6%B5%81%E6%B5%AA%20%E5%9C%B0%E7%90%83"
    );
  });

  it("does not request suggestions for an empty query", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSubjectSuggestions("   ")).resolves.toStrictEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe(normalizeSubjectQuery, () => {
  it("trims and collapses query whitespace", () => {
    expect(normalizeSubjectQuery("  流浪   地球 \n")).toBe("流浪 地球");
  });
});
