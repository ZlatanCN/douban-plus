import { describe, expect, it, vi } from "vitest";

import type {
  InterestFormSnapshot,
  InterestFormState,
  InterestState,
} from "@/modules/subject/domain";
import { useInterestMarking } from "@/modules/subject/interest/use-interest-marking";

import { renderIntoRoot } from "../../helpers/render";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

type InterestMarkingHarnessProps = {
  fetch?: (subjectId: string) => Promise<InterestFormSnapshot>;
  loggedIn?: boolean;
  onLoginRequired?: (action: string) => void;
  onInterestChange?: (interest: InterestState) => void;
  post?: (
    subjectId: string,
    status: InterestFormState["status"],
    options?: {
      comment?: string;
      isPrivate?: boolean;
      rating?: number;
      tags?: string[];
    }
  ) => Promise<{ error?: string; ok: boolean }>;
  remove?: (
    subjectId: string,
    status: InterestState["status"]
  ) => Promise<{ error?: string; ok: boolean }>;
  state?: InterestState;
};

const makeState = (overrides?: Partial<InterestState>): InterestState => ({
  ck: "token",
  comment: "",
  date: "",
  hasWatching: false,
  loggedIn: true,
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
  ...overrides,
});

const defaultSnapshot = (
  overrides?: Partial<InterestFormSnapshot>
): InterestFormSnapshot => ({
  isPrivate: false,
  myTags: [],
  popularTags: [],
  shareToBroadcast: false,
  status: "none",
  tags: [],
  ...overrides,
});
const failPost = () => Promise.resolve({ ok: false });
const failRemove = () => Promise.resolve({ ok: false });
const fetchSnapshot = () => Promise.resolve(defaultSnapshot());

const InterestMarkingHarness = ({
  fetch = fetchSnapshot,
  loggedIn = true,
  onLoginRequired = vi.fn<(action: string) => void>(),
  onInterestChange = vi.fn<(interest: InterestState) => void>(),
  post = failPost,
  remove = failRemove,
  state = makeState(),
}: InterestMarkingHarnessProps) => {
  const interestMarking = useInterestMarking({
    adapters: { fetch, post, remove },
    loggedIn,
    onInterestChange,
    onLoginRequired,
    subjectId: "1292052",
    subjectTitle: "测试作品",
  });

  return (
    <>
      <button
        onClick={() => interestMarking.callbacks.handleOpenInterest(state)}
        type="button"
      >
        标记
      </button>
      {interestMarking.form}
    </>
  );
};

const waitForForm = async (root: HTMLElement): Promise<void> => {
  await vi.waitFor(() =>
    expect(root.querySelector(".atv-interest-modal-tag-input")).not.toBeNull()
  );
  await vi.waitFor(() =>
    expect(
      root.querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
        ?.disabled
    ).toBeFalsy()
  );
};

describe("Interest marking", () => {
  it("updates the rendered interest state after a successful first mark", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const onInterestChange = vi.fn<(interest: InterestState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness onInterestChange={onInterestChange} post={post} />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith("1292052", "wish", {
        comment: "",
        isPrivate: false,
        shareToBroadcast: false,
        tags: [],
      })
    );
    await vi.waitFor(() =>
      expect(onInterestChange).toHaveBeenCalledWith(
        makeState({ marked: true, status: "wish" })
      )
    );
  });

  it("does not submit a saved rating after changing away from watched", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const root = renderIntoRoot(<InterestMarkingHarness post={post} />);

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root.querySelector<HTMLButtonElement>('[data-value="collect"]')?.click();
    await Promise.resolve();
    root
      .querySelectorAll<HTMLButtonElement>(".atv-interest-modal-star")[3]
      ?.click();
    root.querySelector<HTMLButtonElement>('[data-value="wish"]')?.click();
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();

    await vi.waitFor(() => expect(post).toHaveBeenCalledOnce());
    const [, status, options] = post.mock.calls[0] ?? [];
    expect(status).toBe("wish");
    expect(options).toMatchObject({
      comment: "",
      isPrivate: false,
      shareToBroadcast: false,
      tags: [],
    });
    expect(options).not.toHaveProperty("rating");
  });

  it("requests login instead of opening a form for a logged-out user", () => {
    const onLoginRequired = vi.fn<(action: string) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        loggedIn={false}
        onLoginRequired={onLoginRequired}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();

    expect(onLoginRequired).toHaveBeenCalledWith("标记这部作品");
    expect(root.querySelector("#atv-interest-modal")).toBeNull();
  });

  it("keeps the form open without changing rendered state after a failed mark", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ error: string; ok: boolean }>>()
      .mockResolvedValue({ error: "未登录", ok: false });
    const onInterestChange = vi.fn<(interest: InterestState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness onInterestChange={onInterestChange} post={post} />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-interest-modal-error")?.textContent).toBe(
        "未登录"
      )
    );

    expect(onInterestChange).not.toHaveBeenCalled();
    expect(root.querySelector("#atv-interest-modal")).not.toBeNull();
  });

  it("removes an existing mark after the inline confirmation", async () => {
    const remove = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const onInterestChange = vi.fn<(interest: InterestState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        fetch={() => Promise.resolve(defaultSnapshot({ status: "collect" }))}
        onInterestChange={onInterestChange}
        remove={remove}
        state={makeState({ marked: true, status: "collect" })}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-remove")
      ?.click();
    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-interest-modal-removal-confirmation")
      ).not.toBeNull()
    );
    root
      .querySelector<HTMLButtonElement>(
        ".atv-interest-modal-removal-confirmation button:last-child"
      )
      ?.click();
    await vi.waitFor(() =>
      expect(remove).toHaveBeenCalledWith("1292052", "collect")
    );
    expect(onInterestChange).toHaveBeenCalledWith(
      makeState({ marked: false, status: "none" })
    );
  });

  it("updates an existing mark without reloading the page", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const onInterestChange = vi.fn<(interest: InterestState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        fetch={() => Promise.resolve(defaultSnapshot({ status: "collect" }))}
        post={post}
        onInterestChange={onInterestChange}
        state={makeState({ marked: true, status: "collect" })}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await vi.waitFor(() =>
      expect(onInterestChange).toHaveBeenCalledWith(
        makeState({ marked: true, status: "collect" })
      )
    );
  });

  it("uses the fresh native snapshot when saving a previously marked work", async () => {
    const fetch = vi
      .fn<() => Promise<InterestFormSnapshot>>()
      .mockResolvedValue({
        isPrivate: true,
        myTags: ["成长"],
        popularTags: [],
        shareToBroadcast: false,
        status: "collect",
        tags: ["人生"],
      });
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const onInterestChange = vi.fn<(interest: InterestState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        fetch={fetch}
        post={post}
        onInterestChange={onInterestChange}
        state={makeState({ marked: false, status: "none" })}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await waitForForm(root);
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith("1292052", "collect", {
        comment: "",
        isPrivate: true,
        shareToBroadcast: false,
        tags: ["人生"],
      })
    );
    await vi.waitFor(() =>
      expect(onInterestChange).toHaveBeenCalledWith(
        makeState({
          marked: true,
          status: "collect",
          tags: ["人生"],
        })
      )
    );
  });
});
