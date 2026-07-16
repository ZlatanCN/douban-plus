import { describe, expect, it, vi } from "vitest";

import {
  interestFromSavedForm,
  useInterestMarking,
} from "@/modules/subject-page/interest/use-interest-marking";
import type { InterestFormState, InterestState } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

type InterestMarkingHarnessProps = {
  loggedIn?: boolean;
  onFirstMarkSaved?: (previous: InterestState, form: InterestFormState) => void;
  onLoginRequired?: (action: string) => void;
  post?: (
    subjectId: string,
    status: InterestFormState["status"],
    options?: { comment?: string; rating?: number }
  ) => Promise<{ error?: string; ok: boolean }>;
  reload?: () => void;
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

const failPost = () => Promise.resolve({ ok: false });
const noop = (): undefined => undefined;
const failRemove = () => Promise.resolve({ ok: false });

const InterestMarkingHarness = ({
  loggedIn = true,
  onFirstMarkSaved = noop,
  onLoginRequired = vi.fn<(action: string) => void>(),
  post = failPost,
  reload = noop,
  remove = failRemove,
  state = makeState(),
}: InterestMarkingHarnessProps) => {
  const interestMarking = useInterestMarking({
    adapters: { post, reload, remove },
    loggedIn,
    onFirstMarkSaved,
    onLoginRequired,
    subjectId: "1292052",
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

describe("Interest marking", () => {
  it("updates the caller after a successful first mark without refreshing", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const reload = vi.fn<() => void>();
    const onFirstMarkSaved =
      vi.fn<(previous: InterestState, form: InterestFormState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        onFirstMarkSaved={onFirstMarkSaved}
        post={post}
        reload={reload}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(post).toHaveBeenCalledWith("1292052", "wish", {
      comment: "",
      rating: undefined,
    });
    expect(onFirstMarkSaved).toHaveBeenCalledWith(makeState(), {
      comment: "",
      rating: 0,
      status: "wish",
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it("creates a marked state without inventing server-derived values", () => {
    const previous = makeState({
      date: "2026-07-16",
      tags: ["科幻"],
      usefulCount: "12 有用",
    });

    expect(
      interestFromSavedForm(previous, {
        comment: "年度最佳",
        rating: 4,
        status: "collect",
      })
    ).toStrictEqual({
      ...previous,
      comment: "年度最佳",
      marked: true,
      rating: 4,
      status: "collect",
    });
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

  it("keeps the form open and does not refresh after a failed mark", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ error: string; ok: boolean }>>()
      .mockResolvedValue({ error: "未登录", ok: false });
    const reload = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness post={post} reload={reload} />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-interest-modal-error")?.textContent).toBe(
        "未登录"
      )
    );

    expect(reload).not.toHaveBeenCalled();
    expect(root.querySelector("#atv-interest-modal")).not.toBeNull();
  });

  it("removes an existing mark and refreshes on success", async () => {
    const remove = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const reload = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        reload={reload}
        remove={remove}
        state={makeState({ marked: true, status: "collect" })}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-remove")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(remove).toHaveBeenCalledWith("1292052", "collect");
    expect(reload).toHaveBeenCalledOnce();
  });

  it("refreshes after saving an existing mark", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const reload = vi.fn<() => void>();
    const onFirstMarkSaved =
      vi.fn<(previous: InterestState, form: InterestFormState) => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness
        onFirstMarkSaved={onFirstMarkSaved}
        post={post}
        reload={reload}
        state={makeState({ marked: true, status: "collect" })}
      />
    );

    root.querySelector<HTMLButtonElement>("button")?.click();
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onFirstMarkSaved).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
  });
});
