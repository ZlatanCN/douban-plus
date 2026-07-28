import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Comment,
  DoubanData,
  InfoBlock,
  InterestState,
  Review,
} from "@/modules/subject/domain";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";
import type { SubjectPageSnapshot } from "@/modules/subject/runtime/read-subject-data";

const mockReadSubjectData = vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
  return vi.fn<(subjectId: string) => Promise<SubjectPageSnapshot>>();
});

vi.mock(import("@/shared/components/login-modal"), () => ({
  LoginModal: ({ onAuthenticated }: { onAuthenticated?: () => void }) => (
    <button
      class="test-complete-login"
      onClick={() => onAuthenticated?.()}
      type="button"
    >
      完成登录
    </button>
  ),
}));

vi.mock(import("@/modules/subject/runtime/read-subject-data"), () => ({
  readSubjectData: mockReadSubjectData,
}));

const initialInterest: InterestState = {
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
};

const info: InfoBlock = {
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
};

const makeComment = (content: string): Comment => ({
  avatar: "",
  cid: "comment-1",
  content,
  link: "",
  name: "短评作者",
  ratingWord: "",
  stars: 0,
  time: "2026-07-28",
  voted: false,
  votes: 1,
});

const makeReview = (title: string): Review => ({
  avatar: "",
  content: "影评正文",
  id: "review-1",
  link: "",
  name: "影评作者",
  ratingWord: "",
  spoiler: false,
  stars: 0,
  time: "2026-07-28",
  title,
  usefulCount: 1,
  uselessCount: 0,
});

const makeData = (overrides: Partial<DoubanData> = {}): DoubanData => ({
  awards: [],
  celebrities: [],
  comments: [makeComment("登录前短评")],
  discussions: { topics: [] },
  info,
  interest: initialInterest,
  isTV: false,
  photos: [],
  poster: null,
  rankLabel: null,
  rating: null,
  recommendations: [],
  reviews: [makeReview("登录前影评")],
  series: [],
  streaming: [],
  subjectId: "1292052",
  summary: "",
  title: { full: "Movie", original: "", primary: "Movie", seasonLabel: "" },
  trailers: [],
  year: "",
  ...overrides,
});

describe("subject login page data refresh", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockReadSubjectData.mockReset();
  });

  it("replaces the authenticated page snapshot instead of refreshing only Hero", async () => {
    const authenticatedData = makeData({
      comments: [makeComment("登录后短评")],
      interest: {
        ...initialInterest,
        ck: "session-token",
        loggedIn: true,
        marked: true,
        rating: 4,
        status: "collect",
      },
      reviews: [makeReview("登录后影评")],
    });
    const nativeContent = document.createElement("main");
    nativeContent.id = "content";
    nativeContent.innerHTML = "<h1>认证后的原生内容</h1>";
    mockReadSubjectData.mockResolvedValue({
      data: authenticatedData,
      nativeContent,
    });
    const root = document.createElement("div");
    document.body.append(root);
    document.body.insertAdjacentHTML("beforeend", '<main id="content"></main>');

    render(<SubjectPageRuntime data={makeData()} doc={document} />, root);

    root
      .querySelector<HTMLButtonElement>(".atv-actions .atv-btn-primary")
      ?.click();
    await vi.waitFor(() =>
      expect(root.querySelector(".test-complete-login")).not.toBeNull()
    );
    root.querySelector<HTMLButtonElement>(".test-complete-login")?.click();

    await vi.waitFor(() =>
      expect(mockReadSubjectData).toHaveBeenCalledWith("1292052")
    );
    await vi.waitFor(() => expect(root.textContent).toContain("登录后短评"));
    expect(root.textContent).toContain("登录后影评");
    expect(root.querySelector(".atv-interest-badge")?.textContent).toContain(
      "看过"
    );
    expect(document.querySelector("#content")?.textContent).toContain(
      "认证后的原生内容"
    );
  });
});
