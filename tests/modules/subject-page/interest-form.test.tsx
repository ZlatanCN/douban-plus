import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  InterestForm,
  initialStatus,
  statusEntries,
} from "@/modules/subject-page/interest/interest-form";
import type { InterestState, ModalCallbacks } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const animationControls = {
  attachTimeline: vi.fn<(...args: unknown[]) => VoidFunction>(),
  cancel: vi.fn<(...args: unknown[]) => void>(),
  complete: vi.fn<(...args: unknown[]) => void>(),
  duration: 0,
  finished: Promise.resolve(),
  iterationDuration: 0,
  pause: vi.fn<(...args: unknown[]) => void>(),
  play: vi.fn<(...args: unknown[]) => void>(),
  speed: 1,
  startTime: null,
  state: "running" as const,
  stop: vi.fn<(...args: unknown[]) => void>(),
  // eslint-disable-next-line unicorn/no-thenable -- Motion's animation control is awaitable.
  then: vi.fn<(...args: unknown[]) => Promise<void>>(),
  time: 0,
};

const animate = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => typeof animationControls>(
    () => animationControls
  )
);

vi.mock(import("motion"), () => ({ animate }));

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

const makeCallbacks = (
  overrides?: Partial<ModalCallbacks>
): ModalCallbacks => ({
  onRemove: vi.fn<() => Promise<{ ok: boolean }>>(() =>
    Promise.resolve({ ok: true })
  ),
  onSave: vi.fn<
    (data: {
      comment: string;
      rating: number;
      status: string;
    }) => Promise<{ ok: boolean }>
  >(() => Promise.resolve({ ok: true })),
  ...overrides,
});

describe(InterestForm, () => {
  beforeAll(() => {
    /* eslint-disable promise/prefer-await-to-callbacks -- setTimeout is callback-based. */
    vi.spyOn(window, "setTimeout").mockImplementation(
      (callback: () => void) => {
        callback();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });
  it("derives initial status and available statuses from interest state", () => {
    expect(initialStatus(makeState())).toBe("wish");
    expect(initialStatus(makeState({ marked: true, status: "collect" }))).toBe(
      "collect"
    );
    expect(statusEntries(false).map((entry) => entry.value)).toStrictEqual([
      "wish",
      "collect",
    ]);
    expect(statusEntries(true).map((entry) => entry.value)).toStrictEqual([
      "wish",
      "do",
      "collect",
    ]);
  });

  it("renders status controls, rating, comment and submit", () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        state={makeState({ comment: "还不错", hasWatching: true, rating: 3 })}
      />
    );

    expect(root.querySelector("#atv-interest-modal")).not.toBeNull();
    expect(root.querySelectorAll(".atv-interest-modal-status")).toHaveLength(3);
    expect(
      root.querySelectorAll(".atv-interest-modal-star.is-full")
    ).toHaveLength(3);
    expect(
      root.querySelector<HTMLTextAreaElement>(".atv-interest-modal-comment")
        ?.value
    ).toBe("还不错");
    expect(root.querySelector(".atv-interest-modal-submit")?.textContent).toBe(
      "保存"
    );
  });

  it("saves trimmed form data and closes on success", async () => {
    const onSave = vi.fn<
      (data: {
        comment: string;
        rating: number;
        status: string;
      }) => Promise<{ ok: boolean }>
    >(() => Promise.resolve({ ok: true }));
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks({ onSave })}
        onClose={onClose}
        state={makeState({ hasWatching: true })}
      />
    );

    root.querySelector<HTMLButtonElement>('[data-value="collect"]')?.click();
    root.querySelectorAll<HTMLElement>(".atv-interest-modal-star")[3]?.click();
    const textarea = root.querySelector<HTMLTextAreaElement>(
      ".atv-interest-modal-comment"
    );
    if (textarea) {
      textarea.value = "  good  ";
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onSave).toHaveBeenCalledWith({
      comment: "good",
      rating: 4,
      status: "collect",
    });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("shows save errors and removes existing marks", async () => {
    const onSave = vi.fn<
      (data: {
        comment: string;
        rating: number;
        status: string;
      }) => Promise<{ error?: string; ok: boolean }>
    >(() => Promise.resolve({ error: "保存失败", ok: false }));
    const onRemove = vi.fn<() => Promise<{ ok: boolean }>>(() =>
      Promise.resolve({ ok: true })
    );
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks({ onRemove, onSave })}
        onClose={onClose}
        state={makeState({ marked: true, status: "wish" })}
      />
    );

    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector(".atv-interest-modal-error")?.textContent).toBe(
      "保存失败"
    );

    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-remove")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onRemove).toHaveBeenCalledWith("wish");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
