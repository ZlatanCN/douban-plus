import { afterEach, beforeEach, vi } from "vitest";

import type { DoubanData, RtRating } from "@/modules/subject/domain";

type MockReply =
  | { body: string; finalUrl?: string; status?: number }
  | "timeout";
type MockRoute = (
  url: string,
  method: string
) => MockReply | Promise<MockReply>;

type MockGmXmlHttpRequest = ReturnType<
  typeof vi.fn<NonNullable<typeof globalThis.GM_xmlhttpRequest>>
>;
const mockGmXmlHttpRequest =
  globalThis.GM_xmlhttpRequest as MockGmXmlHttpRequest;

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
    const sendRequest = async (): Promise<void> => {
      let reply: MockReply;
      try {
        reply = await mockRoute(url, request.method ?? "GET");
      } catch {
        request.onerror?.();
        return;
      }
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
    };
    void sendRequest();
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

const setupSubjectRuntimeHooks = (): void => {
  beforeEach(() => mockNetwork(() => ({ body: "", status: 404 })));
  afterEach(() => {
    document.body.innerHTML = "";
    mockGmXmlHttpRequest.mockReset();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
};

export {
  makeClaim,
  makeData,
  makeRtSnapshot,
  mockGmXmlHttpRequest,
  mockNetwork,
  setupSubjectRuntimeHooks,
  type MockReply,
  type MockRoute,
};
