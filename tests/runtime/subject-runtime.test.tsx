import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DoubanData, RtRating } from "@/modules/subject/domain";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";

type MockReply =
  | { body: string; finalUrl?: string; status?: number }
  | "timeout";
type MockRoute = (
  url: string,
  method: string
) => MockReply | Promise<MockReply>;

const mockGmXmlHttpRequest = vi.hoisted(() =>
  vi.fn<NonNullable<typeof globalThis.GM_xmlhttpRequest>>()
);

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = mockGmXmlHttpRequest as never;
});

let mockRoute: MockRoute = () => ({ body: "", status: 404 });

const mockNetwork = (route: MockRoute): void => {
  mockRoute = route;
  const handleRequest = (request: {
    method?: string;
    onabort?: () => void;
    onerror?: () => void;
    onload?: (response: unknown) => void;
    ontimeout?: () => void;
    url?: string;
  }) => {
    let aborted = false;
    const url = request.url ?? "";
    void Promise.resolve(mockRoute(url, request.method ?? "GET")).then(
      (reply) => {
        if (aborted) {
          return;
        }
        if (reply === "timeout") {
          request.ontimeout?.();
          return;
        }
        request.onload?.({
          finalUrl: reply.finalUrl ?? request.url,
          readyState: 4,
          response: reply.body,
          responseHeaders: "",
          responseText: reply.body,
          status: reply.status ?? 200,
          statusText: "OK",
        } as never);
      }
    );
    return {
      abort: () => {
        aborted = true;
        request.onabort?.();
      },
    } as never;
  };
  mockGmXmlHttpRequest.mockImplementation(handleRequest as never);
};

const makeClaim = (value: string | { id: string }) => ({
  mainsnak: { datavalue: { value }, snaktype: "value" },
  rank: "normal",
});

const makeData = (overrides?: Partial<DoubanData>): DoubanData => ({
  awards: [],
  celebrities: [],
  comments: [],
  discussions: { topics: [] },
  info: {
    aliases: "",
    cast: [],
    country: "",
    director: [],
    episodeRuntime: "",
    episodes: "",
    firstAired: "",
    genres: [],
    imdb: "",
    language: "",
    releaseDate: "",
    runtime: "",
    seasons: "",
    writers: [],
  },
  interest: {
    ck: "",
    comment: "",
    date: "",
    hasWatching: false,
    loggedIn: false,
    marked: false,
    rating: 0,
    status: "none",
    tags: [],
    usefulCount: "",
  },
  isTV: false,
  photos: [],
  poster: null,
  rankLabel: null,
  rating: null,
  recommendations: [],
  reviews: [],
  series: [],
  streaming: [],
  subjectId: "1292052",
  summary: null,
  title: {
    full: "肖申克的救赎",
    original: "",
    primary: "肖申克的救赎",
    seasonLabel: "",
  },
  trailers: [],
  year: "1994",
  ...overrides,
});

const makeRtSnapshot = (
  overrides?: Partial<RtRating>,
  fetchedAt: number = Date.now()
): RtRating => ({
  audienceCount: { kind: "range", lowerBound: 250_000 },
  audienceGroup: "all",
  audienceScore: 98,
  criticsCount: { kind: "exact", value: 147 },
  criticsScore: 89,
  fetchedAt,
  object: {
    kind: "movie",
    rtId: "m/shawshank_redemption",
    subjectId: "1292052",
  },
  sourceUrl: "https://www.rottentomatoes.com/m/shawshank_redemption",
  stale: false,
  ...overrides,
});

describe("Subject page runtime", () => {
  beforeEach(() => mockNetwork(() => ({ body: "", status: 404 })));

  afterEach(() => {
    document.body.innerHTML = "";
    mockGmXmlHttpRequest.mockReset();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("renders the page from a Douban document without leaking that document into Subject page", () => {
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    expect(root.querySelector(".atv-hero")).not.toBeNull();
    expect(root.querySelector(".atv-footer-spacer")).not.toBeNull();
  });

  it("updates an open comment modal when its profile avatar resolves", async () => {
    const profileLink = "https://www.douban.com/people/runtime-modal/";
    const rawAvatarUrl = "https://example.com/runtime-modal-raw.jpg";
    const avatarUrl = "https://example.com/runtime-modal-resolved.jpg";
    const response = Promise.withResolvers<string>();
    mockNetwork((url) =>
      url === profileLink
        ? response.promise.then((body) => ({ body }))
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          comments: [
            {
              avatar: rawAvatarUrl,
              cid: "runtime-modal",
              content: "打开后更新头像",
              link: profileLink,
              name: "Runtime modal viewer",
              ratingWord: "推荐",
              stars: 4,
              time: "2026-07-16",
              voted: false,
              votes: 1,
            },
          ],
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(
        mockGmXmlHttpRequest.mock.calls.some(
          ([request]) => request.url === profileLink
        )
      ).toBeTruthy()
    );
    root.querySelector<HTMLButtonElement>(".atv-comment-expand")?.click();
    await Promise.resolve();

    expect(
      root
        .querySelector<HTMLElement>(".atv-comment-overlay-avatar")
        ?.getAttribute("style")
    ).toBe(`background-image: url("${rawAvatarUrl}");`);

    response.resolve(
      `<div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div>`
    );

    await vi.waitFor(() =>
      expect([
        root
          .querySelector<HTMLElement>(
            "[data-cid='runtime-modal'] .atv-comment-avatar"
          )
          ?.getAttribute("style"),
        root
          .querySelector<HTMLElement>(".atv-comment-overlay-avatar")
          ?.getAttribute("style"),
      ]).toStrictEqual([
        `background-image: url("${avatarUrl}");`,
        `background-image: url("${avatarUrl}");`,
      ])
    );
  });

  it("loads first-broadcast data through the runtime for a signed-in viewer", async () => {
    const editPage = `
      <div class="item basic">
        <label for="p_142">电视台</label>
        <input id="p_142" value="Apple TV+" readonly />
      </div>
    `;
    mockNetwork((url) =>
      url === "https://movie.douban.com/subject/36858672/edit"
        ? { body: editPage }
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          interest: { ...makeData().interest, loggedIn: true },
          subjectId: "36858672",
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-first-broadcast-platform")).not.toBeNull()
    );

    expect(mockGmXmlHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://movie.douban.com/subject/36858672/edit",
      })
    );
  });

  it("shows a scorePercent result for a Douban subject without an IMDb ID", async () => {
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q172241" }] },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [
                    {
                      mainsnak: {
                        datavalue: { value: "m/shawshank_redemption" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q11424" } },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P4529: [
                    {
                      mainsnak: {
                        datavalue: { value: "1292052" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/m/shawshank_redemption") {
        return {
          body: `<!doctype html><html><head>
          <link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption">
          <script type="application/ld+json">{"@type":"Movie","url":"https://www.rottentomatoes.com/m/shawshank_redemption","name":"The Shawshank Redemption","datePublished":"1994"}</script>
          <script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"0%","ratingCount":147},"audienceScore":null}</script>
        </head><body></body></html>`,
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("0%");
    });

    expect(
      [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
        node.textContent?.trim()
      )
    ).toStrictEqual(["0%"]);
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/m/shawshank_redemption"
    );
  });

  it("hides Rotten Tomatoes when the IMDb and Douban mappings conflict", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        const identifier = requestUrl.searchParams.get("srsearch") ?? "";
        const title = identifier.includes("P345=tt0111161")
          ? "Q172241"
          : "Q777";
        return { body: JSON.stringify({ query: { search: [{ title }] } }) };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q172241: {
              claims: {
                P1258: [makeClaim("m/shawshank_redemption")],
                P31: [makeClaim({ id: "Q11424" })],
                P345: [makeClaim("tt0111161")],
              },
            },
            Q777: {
              claims: {
                P1258: [makeClaim("m/shawshank_remake")],
                P31: [makeClaim({ id: "Q11424" })],
                P4529: [makeClaim("1292053")],
              },
            },
          },
        }),
      };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt0111161" },
      subjectId: "1292053",
      title: {
        full: "The Shawshank Redemption",
        original: "The Shawshank Redemption",
        primary: "刺激1995",
        seasonLabel: "",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
  });

  it("shows Rotten Tomatoes while an IMDb match remains pending", async () => {
    const metacritic = Promise.withResolvers<MockReply>();
    const rtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
    mockNetwork((url) => {
      if (url.includes("graphql.imdb.com")) {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt0111161",
                ratingsSummary: { aggregateRating: 9.3, voteCount: 1200 },
                titleText: { text: "The Shawshank Redemption" },
              },
            },
          }),
        };
      }
      if (url.includes("www.metacritic.com")) {
        return metacritic.promise;
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [
                    {
                      mainsnak: {
                        datavalue: { value: "m/shawshank_redemption" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q11424" } },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P345: [
                    {
                      mainsnak: {
                        datavalue: { value: "tt0111161" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P4529: [
                    {
                      mainsnak: {
                        datavalue: { value: "1292052" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (url === rtUrl) {
        return {
          body: `<!doctype html><link rel="canonical" href="${rtUrl}"><script type="application/ld+json">{"@type":"Movie"}</script><script data-json="mediaScorecard" type="application/json">{"criticsScore":{"scorePercent":"89%","ratingCount":147},"audienceScore":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"},"overlay":{"hasAudienceAll":true,"hasAudienceVerified":false,"audienceAll":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"}}}</script>`,
        };
      }
      return { body: "", status: 404 };
    });
    const root = document.createElement("div");
    render(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "tt0111161" },
          title: { ...makeData().title, original: "The Shawshank Redemption" },
        })}
        doc={document}
      />,
      root
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%")
    );
    expect(
      root.querySelector(".is-audience .atv-rt-score-label")?.textContent
    ).toBe("全部观众");
    expect(root.querySelector(".atv-rt-count-row")?.textContent).toContain(
      "250,000+"
    );
    expect(
      root.querySelector(".atv-rating-panel-mc.is-loading")
    ).not.toBeNull();

    metacritic.resolve({ body: "", status: 503 });
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    render(null, root);
  });

  it("keeps a confirmed snapshot for 30 days when refreshing the mapping fails", async () => {
    const stale = makeRtSnapshot({}, Date.now() - 10 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v1",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: stale,
      })
    );
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "upstream unavailable", status: 503 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
    expect(requests.every((url) => url.includes("wikidata.org"))).toBeTruthy();
  });

  it("hides a snapshot older than 30 days", async () => {
    const expired = makeRtSnapshot({}, Date.now() - 31 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v1",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]:
          expired,
      })
    );
    mockNetwork(() => ({ body: "upstream unavailable", status: 503 }));
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
  });

  it("does not use a selected season that conflicts with the work title", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: { ...makeData().info, seasons: "第十季", selectedSeason: "10" },
      isTV: true,
      title: {
        full: "Game of Thrones 第十一季",
        original: "Game of Thrones Season 11",
        primary: "权力的游戏 第十一季",
        seasonLabel: "第十一季",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
    expect(
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
  });

  it("uses the selected season and displays the matching RT season page", async () => {
    const seasonUrl = "https://www.rottentomatoes.com/tv/friends/s11";
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q975761" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q975761: {
                claims: {
                  P1258: [
                    {
                      mainsnak: {
                        datavalue: { value: "tv/friends/s11" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q3464665" } },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P4529: [
                    {
                      mainsnak: {
                        datavalue: { value: "1393859" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (url === seasonUrl) {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/tv/friends/s11"><script type="application/ld+json">{"@type":"TVSeason","seasonNumber":11}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"91%","ratingCount":20},"audienceScore":null}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        seasons: "第十一季",
        selectedSeason: "第十一季",
      },
      isTV: true,
      subjectId: "1393859",
      title: {
        full: "老友记 第十一季",
        original: "Friends Season 11",
        primary: "老友记",
        seasonLabel: "第十一季",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("91%")
    );
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      seasonUrl
    );
    expect(root.querySelector(".atv-rt-label-item")?.textContent).toContain(
      "影评人"
    );
  });

  it("finishes the RT loading state when the Wikidata request times out", async () => {
    mockNetwork((url) =>
      url.includes("wikidata.org/w/api.php")
        ? "timeout"
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
    expect(
      mockGmXmlHttpRequest.mock.calls
        .filter(([request]) => request.url?.includes("wikidata.org"))
        .every(([request]) => request.timeout === 8000)
    ).toBeTruthy();
  });

  it("cleans up the late-series observer when the runtime unmounts", async () => {
    document.body.innerHTML = '<div id="series-items"></div>';
    const disconnect = vi.fn<() => void>();
    const observe = vi.fn<() => void>();
    vi.stubGlobal(
      "MutationObserver",
      class {
        disconnect = disconnect;
        observe = observe;
      }
    );
    const root = document.createElement("div");

    render(<SubjectPageRuntime data={makeData()} doc={document} />, root);
    await vi.waitFor(() =>
      expect(observe.mock.calls.length).toBeGreaterThan(0)
    );
    const observerCount = observe.mock.calls.length;
    render(null, root);

    await vi.waitFor(() =>
      expect(disconnect).toHaveBeenCalledTimes(observerCount)
    );
  });
});
