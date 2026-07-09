import { describe, expect, it, vi } from "vitest";

import { buildInterestMarkingCallbacks } from "@/runtime/interest-marking";
import type { InterestState, ModalCallbacks } from "@/types";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

const parseDoc = (html: string): Document =>
  new DOMParser().parseFromString(html, "text/html");

const assertModalCallbacks = (
  callbacks: ModalCallbacks | null
): ModalCallbacks => {
  expect(callbacks).not.toBeNull();
  return callbacks as ModalCallbacks;
};

const defaultInterest: InterestState = {
  ck: "ck",
  comment: "",
  date: "",
  hasWatching: true,
  loggedIn: true,
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
};

describe(buildInterestMarkingCallbacks, () => {
  it("proxy-clicks original Douban interest buttons", () => {
    const doc = parseDoc(`
      <div id="interest_sect_level">
        <a href="/wish">想看</a>
        <a href="/do">在看</a>
        <a href="/collect">看过</a>
      </div>
    `);
    const clicked: string[] = [];
    for (const link of doc.querySelectorAll<HTMLAnchorElement>("a")) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        clicked.push(link.textContent?.trim() ?? "");
      });
    }

    const callbacks = buildInterestMarkingCallbacks("1292052", { doc });
    callbacks.handleWishClick();
    callbacks.handleWatchingClick();
    callbacks.handleCollectClick();

    expect(clicked).toStrictEqual(["想看", "在看", "看过"]);
  });

  it("opens the modal with save/remove callbacks scoped to the subject", async () => {
    let modalCallbacks: ModalCallbacks | null = null;
    const openModal = vi.fn<
      (state: InterestState, callbacks: ModalCallbacks) => void
    >((_state: InterestState, callbacks: ModalCallbacks) => {
      modalCallbacks = callbacks;
    });
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const remove = vi
      .fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
      .mockResolvedValue({ ok: true });
    const reload = vi.fn<() => void>();

    const callbacks = buildInterestMarkingCallbacks("1292052", {
      openModal,
      post,
      reload,
      remove,
    });
    callbacks.handleOpenInterest(defaultInterest);

    expect(openModal).toHaveBeenCalledWith(defaultInterest, expect.any(Object));
    const openedCallbacks = assertModalCallbacks(modalCallbacks);
    await openedCallbacks.onSave({
      comment: "好看",
      rating: 4,
      status: "collect",
    });
    await openedCallbacks.onRemove("collect");

    expect(post).toHaveBeenCalledWith("1292052", "collect", {
      comment: "好看",
      rating: 4,
    });
    expect(remove).toHaveBeenCalledWith("1292052", "collect");
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not send an empty rating and does not reload on failed save", async () => {
    let modalCallbacks: ModalCallbacks | null = null;
    const post = vi
      .fn<(...args: unknown[]) => Promise<{ error?: string; ok: boolean }>>()
      .mockResolvedValue({ error: "未登录", ok: false });
    const reload = vi.fn<() => void>();

    const callbacks = buildInterestMarkingCallbacks("1292052", {
      openModal: (_state, openedCallbacks) => {
        modalCallbacks = openedCallbacks;
      },
      post,
      reload,
    });
    callbacks.handleOpenInterest(defaultInterest);
    const result = await assertModalCallbacks(modalCallbacks).onSave({
      comment: "",
      rating: 0,
      status: "wish",
    });

    expect(result).toStrictEqual({ error: "未登录", ok: false });
    expect(post).toHaveBeenCalledWith("1292052", "wish", {
      comment: "",
      rating: undefined,
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it("opens the login prompt instead of proxy-clicking when logged out", () => {
    const doc = parseDoc(`
      <div id="interest_sect_level">
        <a href="/wish">想看</a>
      </div>
    `);
    const clicked = vi.fn<(event: Event) => void>();
    doc.querySelector("a")?.addEventListener("click", clicked);
    const requireLogin = vi
      .fn<(action: string) => boolean>()
      .mockReturnValue(false);

    const callbacks = buildInterestMarkingCallbacks("1292052", {
      accountGate: { requireLogin },
      doc,
      loggedIn: false,
    });

    callbacks.handleWishClick();

    expect(requireLogin).toHaveBeenCalledWith("标记想看");
    expect(clicked).not.toHaveBeenCalled();
  });
});
