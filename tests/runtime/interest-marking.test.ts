import { describe, expect, it, vi } from "vitest";

import { buildInterestMarkingCallbacks } from "../../src/runtime/interest-marking";
import type { InterestState, ModalCallbacks } from "../../src/types";

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

describe("buildInterestMarkingCallbacks", () => {
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
    callbacks.onWishClick();
    callbacks.onWatchingClick();
    callbacks.onCollectClick();

    expect(clicked).toEqual(["想看", "在看", "看过"]);
  });

  it("opens the modal with save/remove callbacks scoped to the subject", async () => {
    let modalCallbacks: ModalCallbacks | null = null;
    const openModal = vi.fn(
      (_state: InterestState, callbacks: ModalCallbacks) => {
        modalCallbacks = callbacks;
      }
    );
    const post = vi.fn().mockResolvedValue({ ok: true });
    const remove = vi.fn().mockResolvedValue({ ok: true });
    const reload = vi.fn();

    const callbacks = buildInterestMarkingCallbacks("1292052", {
      openModal,
      post,
      reload,
      remove,
    });
    callbacks.onOpenInterest(defaultInterest);

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
    const post = vi.fn().mockResolvedValue({ error: "未登录", ok: false });
    const reload = vi.fn();

    const callbacks = buildInterestMarkingCallbacks("1292052", {
      openModal: (_state, openedCallbacks) => {
        modalCallbacks = openedCallbacks;
      },
      post,
      reload,
    });
    callbacks.onOpenInterest(defaultInterest);
    const result = await assertModalCallbacks(modalCallbacks).onSave({
      comment: "",
      rating: 0,
      status: "wish",
    });

    expect(result).toEqual({ error: "未登录", ok: false });
    expect(post).toHaveBeenCalledWith("1292052", "wish", {
      comment: "",
      rating: undefined,
    });
    expect(reload).not.toHaveBeenCalled();
  });
});
