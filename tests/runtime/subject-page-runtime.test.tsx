import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/runtime/subject-page-runtime";
import type { DoubanData } from "@/types";

import { renderIntoRoot } from "../helpers/render";

const mockRequest = vi.hoisted(() =>
  vi.fn<(url: string, ...args: unknown[]) => Promise<string>>()
);

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

vi.mock(import("../../src/utils/request"), () => ({
  gmGet: mockRequest,
  gmPost: mockRequest,
}));

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
  title: { full: "肖申克的救赎", original: "", primary: "肖申克的救赎" },
  trailers: [],
  year: "1994",
  ...overrides,
});

describe("Subject page runtime", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    mockRequest.mockReset();
    vi.unstubAllGlobals();
  });

  it("renders the page from a Douban document without leaking that document into Subject page", () => {
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    expect(root.querySelector(".atv-hero")).not.toBeNull();
    expect(root.querySelector(".atv-footer-spacer")).not.toBeNull();
  });

  it("resolves and deduplicates comment profile avatars through the runtime", async () => {
    const profileLink = "https://www.douban.com/people/runtime-avatar/";
    const avatarUrl = "https://example.com/runtime-avatar.jpg";
    mockRequest.mockResolvedValue(`
      <div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div>
    `);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          comments: [
            {
              avatar: "",
              cid: "runtime-avatar",
              content: "头像来自 runtime",
              link: profileLink,
              name: "Runtime viewer",
              ratingWord: "推荐",
              stars: 4,
              time: "2026-07-13",
              voted: false,
              votes: 1,
            },
            {
              avatar: "",
              cid: "runtime-avatar-duplicate",
              content: "同一个 profile",
              link: profileLink,
              name: "Runtime viewer again",
              ratingWord: "推荐",
              stars: 4,
              time: "2026-07-13",
              voted: false,
              votes: 2,
            },
          ],
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect([
        root
          .querySelector<HTMLElement>(
            "[data-cid='runtime-avatar'] .atv-comment-avatar"
          )
          ?.getAttribute("style"),
        root
          .querySelector<HTMLElement>(
            "[data-cid='runtime-avatar-duplicate'] .atv-comment-avatar"
          )
          ?.getAttribute("style"),
      ]).toStrictEqual([
        `background-image: url("${avatarUrl}");`,
        `background-image: url("${avatarUrl}");`,
      ])
    );

    expect(mockRequest).toHaveBeenCalledExactlyOnceWith(
      profileLink,
      document.location.href
    );
  });

  it("loads first-broadcast data through the runtime for a signed-in viewer", async () => {
    mockRequest.mockClear();
    mockRequest.mockResolvedValue(`
      <div class="item basic">
        <label for="p_142">电视台</label>
        <input id="p_142" value="Apple TV+" readonly />
      </div>
    `);
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

    expect(mockRequest).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/36858672/edit",
      location.href
    );
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
    await vi.waitFor(() => expect(observe).toHaveBeenCalledOnce());
    render(null, root);

    await vi.waitFor(() => expect(disconnect).toHaveBeenCalledOnce());
  });
});
