import { describe, expect, it, vi } from "vitest";

import { useInterestMarking } from "@/modules/subject-page/interest/use-interest-marking";
import type { InterestFormState, InterestState } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

type InterestMarkingHarnessProps = {
  loggedIn?: boolean;
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
  onLoginRequired = vi.fn<(action: string) => void>(),
  post = failPost,
  reload = noop,
  remove = failRemove,
  state = makeState(),
}: InterestMarkingHarnessProps) => {
  const interestMarking = useInterestMarking({
    adapters: { post, reload, remove },
    loggedIn,
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
  it("opens the enhanced form and refreshes after a successful mark", async () => {
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const reload = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestMarkingHarness post={post} reload={reload} />
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
    expect(reload).toHaveBeenCalledOnce();
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
});
