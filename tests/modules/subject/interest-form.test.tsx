import { render } from "preact";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ModalSession } from "@/components/modal";
import {
  InterestForm,
  initialStatus,
} from "@/modules/subject/interest/interest-form";
import { statusEntries } from "@/modules/subject/interest/interest-form-fields";
import type {
  InterestFormSnapshot,
  InterestState,
  ModalCallbacks,
} from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const animationControls = Object.assign(Promise.resolve(), {
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
  time: 0,
});

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
      isPrivate: boolean;
      rating: number;
      status: string;
      tags: string[];
    }) => Promise<{ ok: boolean }>
  >(() => Promise.resolve({ ok: true })),
  ...overrides,
});

const readySource = (overrides?: Partial<InterestFormSnapshot>) => ({
  kind: "ready" as const,
  snapshot: {
    isPrivate: false,
    myTags: [],
    popularTags: [],
    shareToBroadcast: false,
    status: "wish" as const,
    tags: [],
    ...overrides,
  },
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
    expect(
      statusEntries(false, "do").map((entry) => entry.value)
    ).toStrictEqual(["wish", "do", "collect"]);
  });

  it("treats the fresh snapshot as the source of truth for existing marks", () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        source={readySource({ status: "do" })}
        state={makeState({ marked: false, status: "none" })}
        subjectTitle="测试作品"
      />
    );

    expect(root.querySelector(".atv-interest-modal-eyebrow")?.textContent).toBe(
      "编辑作品标记"
    );
    expect(root.querySelector("#atv-interest-modal-title")?.textContent).toBe(
      "测试作品"
    );
    expect(root.querySelector(".atv-interest-modal-remove")).not.toBeNull();
    expect(
      root
        .querySelector<HTMLButtonElement>('[data-value="do"]')
        ?.getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("orients a new mark around the work title and shows rating only for watched work", async () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        source={readySource({ status: "none" })}
        state={makeState()}
        subjectTitle="纸牌屋 第一季"
      />
    );

    expect(root.querySelector(".atv-interest-modal-eyebrow")?.textContent).toBe(
      "标记作品"
    );
    expect(root.querySelector("#atv-interest-modal-title")?.textContent).toBe(
      "纸牌屋 第一季"
    );
    expect(root.querySelector(".atv-interest-modal-stars")).toBeNull();

    root.querySelector<HTMLButtonElement>('[data-value="collect"]')?.click();
    await Promise.resolve();

    const rating = root.querySelector(".atv-interest-modal-stars");
    expect(rating?.getAttribute("aria-label")).toBe("评分（可选）");
    expect(
      root
        .querySelector<HTMLButtonElement>(".atv-interest-modal-star")
        ?.getAttribute("aria-label")
    ).toBe("设为 1 星评分");
  });

  it("keeps a private mark out of the publishing flow", async () => {
    const onSave = vi.fn<ModalCallbacks["onSave"]>(() =>
      Promise.resolve({ ok: true })
    );
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks({ onSave })}
        onClose={vi.fn<() => void>()}
        source={readySource({ shareToBroadcast: true, status: "none" })}
        state={makeState()}
        subjectTitle="纸牌屋 第一季"
      />
    );

    expect(
      root.querySelector<HTMLInputElement>(
        'input[name="interest-visibility"][value="public"]'
      )?.checked
    ).toBeTruthy();
    expect(
      root.querySelector("#atv-interest-modal-share-broadcast")
    ).not.toBeNull();

    const privateVisibility = root.querySelector<HTMLInputElement>(
      'input[name="interest-visibility"][value="private"]'
    );
    if (privateVisibility) {
      privateVisibility.checked = true;
      privateVisibility.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await Promise.resolve();

    expect(
      root.querySelector("#atv-interest-modal-share-broadcast")
    ).toBeNull();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onSave).toHaveBeenCalledWith({
      comment: "",
      isPrivate: true,
      rating: 0,
      shareToBroadcast: false,
      status: "wish",
      tags: [],
    });
  });

  it("renders status controls, rating, comment and submit", () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        source={readySource({ status: "collect" })}
        state={makeState({ comment: "还不错", hasWatching: true, rating: 3 })}
        subjectTitle="测试作品"
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
      "保存标记"
    );
  });

  it("keeps an existing rating when its selected star is pressed again", async () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        source={readySource({ status: "collect" })}
        state={makeState({ marked: true, rating: 3, status: "collect" })}
        subjectTitle="测试作品"
      />
    );

    root
      .querySelectorAll<HTMLButtonElement>(".atv-interest-modal-star")[2]
      ?.click();
    await Promise.resolve();
    expect(
      root.querySelectorAll(".atv-interest-modal-star.is-full")
    ).toHaveLength(3);
    expect(
      root
        .querySelectorAll<HTMLButtonElement>(".atv-interest-modal-star")[2]
        ?.getAttribute("aria-label")
    ).toBe("设为 3 星评分");

    root
      .querySelectorAll<HTMLButtonElement>(".atv-interest-modal-star")[3]
      ?.click();
    await Promise.resolve();
    expect(
      root.querySelectorAll(".atv-interest-modal-star.is-full")
    ).toHaveLength(4);
    expect(root.querySelector(".atv-interest-modal-rating-clear")).toBeNull();
  });

  it("resets form state for a reopened modal session", async () => {
    const callbacks = makeCallbacks();
    const onClose = vi.fn<() => void>();
    const firstRequest = {};
    const root = renderIntoRoot(
      <ModalSession request={firstRequest}>
        <InterestForm
          callbacks={callbacks}
          onClose={onClose}
          source={readySource({ status: "wish" })}
          state={makeState({ comment: "初始短评" })}
          subjectTitle="测试作品"
        />
      </ModalSession>
    );
    const textarea = root.querySelector<HTMLTextAreaElement>(
      ".atv-interest-modal-comment"
    );
    if (textarea) {
      textarea.value = "尚未保存的修改";
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await Promise.resolve();

    render(
      <ModalSession request={{}}>
        <InterestForm
          callbacks={callbacks}
          onClose={onClose}
          source={readySource({ status: "wish" })}
          state={makeState({ comment: "初始短评" })}
          subjectTitle="测试作品"
        />
      </ModalSession>,
      root
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector<HTMLTextAreaElement>(".atv-interest-modal-comment")
          ?.value
      ).toBe("初始短评")
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
        source={readySource({ status: "wish" })}
        state={makeState({ hasWatching: true })}
        subjectTitle="测试作品"
      />
    );

    root.querySelector<HTMLButtonElement>('[data-value="collect"]')?.click();
    await Promise.resolve();
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
      isPrivate: false,
      rating: 4,
      shareToBroadcast: false,
      status: "collect",
      tags: [],
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
        source={readySource({ status: "wish" })}
        state={makeState({ marked: true, status: "wish" })}
        subjectTitle="测试作品"
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
    expect(root.textContent).toContain("取消这条作品标记？");
    root
      .querySelector<HTMLButtonElement>(
        ".atv-interest-modal-removal-confirmation button:last-child"
      )
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onRemove).toHaveBeenCalledWith("wish");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("keeps the mark read-only while its complete record is loading", () => {
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        onRetry={vi.fn<() => void>()}
        source={{ kind: "loading" }}
        state={makeState({ comment: "初始短评", rating: 3 })}
        subjectTitle="测试作品"
      />
    );

    expect(
      root.querySelector(".atv-interest-modal-tag-skeleton")
    ).not.toBeNull();
    expect(
      root.querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
        ?.disabled
    ).toBeTruthy();
    expect(
      root.querySelector<HTMLTextAreaElement>(".atv-interest-modal-comment")
        ?.disabled
    ).toBeTruthy();
  });

  it("explains an incomplete record and offers an in-place retry", () => {
    const onRetry = vi.fn<() => void>();
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks()}
        onClose={vi.fn<() => void>()}
        onRetry={onRetry}
        source={{ kind: "error", message: "无法读取完整标记" }}
        state={makeState()}
        subjectTitle="测试作品"
      />
    );

    expect(
      root.querySelector(".atv-interest-modal-source-error")?.textContent
    ).toContain("无法读取完整标记");
    root
      .querySelector<HTMLButtonElement>(
        ".atv-interest-modal-source-error button"
      )
      ?.click();
    expect(onRetry).toHaveBeenCalledOnce();
    expect(
      root.querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
        ?.disabled
    ).toBeTruthy();
  });

  it("edits normalized tags, private visibility, and the short-comment allowance", async () => {
    const onSave = vi.fn<
      (data: {
        comment: string;
        isPrivate: boolean;
        rating: number;
        status: string;
        tags: string[];
      }) => Promise<{ ok: boolean }>
    >(() => Promise.resolve({ ok: true }));
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks({ onSave })}
        onClose={vi.fn<() => void>()}
        source={readySource({
          myTags: ["成长"],
          popularTags: ["温情"],
          status: "collect",
          tags: ["人生"],
        })}
        state={makeState({ marked: true })}
        subjectTitle="测试作品"
      />
    );

    const input = root.querySelector<HTMLInputElement>(
      ".atv-interest-modal-tag-input"
    );
    expect(root.querySelector('[data-tag="成长"]')).toBeNull();
    input?.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    await Promise.resolve();
    expect(root.querySelector('[data-tag="成长"]')).not.toBeNull();
    root
      .querySelector<HTMLButtonElement>('[data-tag="成长"]')
      ?.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    await Promise.resolve();
    expect(root.querySelector('[data-tag="成长"]')).toBeNull();
    input?.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    await Promise.resolve();
    root.querySelector<HTMLButtonElement>('[data-tag="成长"]')?.click();
    if (input) {
      input.value = "科幻";
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    root.querySelector<HTMLButtonElement>('[data-tag="温情"]')?.click();
    const privateVisibility = root.querySelector<HTMLInputElement>(
      'input[name="interest-visibility"][value="private"]'
    );
    if (privateVisibility) {
      privateVisibility.checked = true;
      privateVisibility.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const textarea = root.querySelector<HTMLTextAreaElement>(
      ".atv-interest-modal-comment"
    );
    if (textarea) {
      textarea.value = "短评";
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await Promise.resolve();

    expect(
      root.querySelector(".atv-interest-modal-comment-count")?.textContent
    ).toBe("还可输入 348 字");
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledWith({
      comment: "短评",
      isPrivate: true,
      rating: 0,
      shareToBroadcast: false,
      status: "collect",
      tags: ["人生", "成长", "科幻", "温情"],
    });
  });

  it("removes the last tag when Backspace is pressed in an empty tag input", async () => {
    const onSave = vi.fn<ModalCallbacks["onSave"]>(() =>
      Promise.resolve({ ok: true })
    );
    const root = renderIntoRoot(
      <InterestForm
        callbacks={makeCallbacks({ onSave })}
        onClose={vi.fn<() => void>()}
        source={readySource({ tags: ["人生", "温情"] })}
        state={makeState({ marked: true })}
        subjectTitle="测试作品"
      />
    );
    const input = root.querySelector<HTMLInputElement>(
      ".atv-interest-modal-tag-input"
    );

    input?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" })
    );
    await Promise.resolve();
    root
      .querySelector<HTMLButtonElement>(".atv-interest-modal-submit")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledWith({
      comment: "",
      isPrivate: false,
      rating: 0,
      shareToBroadcast: false,
      status: "wish",
      tags: ["人生"],
    });
  });
});
