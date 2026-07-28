import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  DoubanData,
  InfoBlock,
  InterestState,
} from "@/modules/subject/domain";
import { SubjectPage } from "@/modules/subject/runtime/subject-page";
import type { SubjectPageRuntime } from "@/modules/subject/runtime/types";

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

const authenticatedInterest: InterestState = {
  ...initialInterest,
  ck: "session-token",
  comment: "值得反复看",
  date: "2026-07-28",
  loggedIn: true,
  marked: true,
  rating: 4,
  status: "collect",
  tags: ["经典"],
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

const data: DoubanData = {
  awards: [],
  celebrities: [],
  comments: [],
  discussions: { topics: [] },
  info,
  interest: initialInterest,
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
  summary: "",
  title: { full: "Movie", original: "", primary: "Movie", seasonLabel: "" },
  trailers: [],
  year: "",
};

const makeRuntime = (
  read: SubjectPageRuntime["actions"]["interestMarking"]["read"]
): SubjectPageRuntime => ({
  actions: {
    handleCommentVote: () => Promise.resolve({ ok: true }),
    handleReviewVote: () => Promise.resolve({ ok: true }),
    interestMarking: {
      fetch: () =>
        Promise.resolve({
          isPrivate: false,
          myTags: [],
          popularTags: [],
          shareToBroadcast: false,
          status: "none",
          tags: [],
        }),
      post: () => Promise.resolve({ ok: false }),
      read,
      remove: () => Promise.resolve({ ok: false }),
    },
  },
  externalRatings: null,
  firstBroadcastPlatform: null,
  navigation: {
    activeSectionId: "",
    navRef: { current: null },
    onJump: () => {},
    scrolling: false,
    sections: [],
    visible: false,
  },
  photoResolution: { photos: [], status: "ready" },
  resolvedComments: [],
  series: [],
  summary: "",
});

describe("subject login interest refresh", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("refreshes Hero with the authenticated interest state without navigation", async () => {
    const read = vi
      .fn<(subjectId: string) => Promise<InterestState>>()
      .mockResolvedValue(authenticatedInterest);
    const root = document.createElement("div");
    document.body.append(root);
    render(<SubjectPage data={data} runtime={makeRuntime(read)} />, root);

    root
      .querySelector<HTMLButtonElement>(".atv-actions .atv-btn-primary")
      ?.click();
    await vi.waitFor(() =>
      expect(root.querySelector(".test-complete-login")).not.toBeNull()
    );
    root.querySelector<HTMLButtonElement>(".test-complete-login")?.click();

    await vi.waitFor(() => expect(read).toHaveBeenCalledWith("1292052"));
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-interest-badge")?.textContent).toContain(
        "看过"
      )
    );
    expect(
      root.querySelector(".atv-interest-panel-comment")?.textContent
    ).toContain("值得反复看");
  });
});
