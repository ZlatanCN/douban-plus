import { setTimeout as delay } from "node:timers/promises";

import { h, render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { useNativeNavigation } from "@/shared/runtime/native-navigation";
import type {
  NativeNavigationState,
  NativePageLoader,
} from "@/shared/runtime/native-navigation";

import { createTestDoc } from "../helpers/doc";
import { result } from "./native-navigation-fixtures";
import type { PageData } from "./native-navigation-fixtures";

type NavigationHarnessProps = {
  doc: Document;
  loadPage: NativePageLoader<PageData>;
  onState: (state: NativeNavigationState<PageData>) => void;
};

const NavigationHarness = ({
  doc,
  loadPage,
  onState,
}: NavigationHarnessProps) => {
  const state = useNativeNavigation({
    doc,
    getTitle: ({ data }) => data.title,
    initialData: { title: "初始页面" },
    loadPage,
    refreshLabel: "同步内容",
  });
  onState(state);
  return h("output", null, state.data.title);
};

describe(useNativeNavigation, () => {
  it("binds popstate while mounted and disposes the listener on unmount", async () => {
    const doc = document;
    const view = doc.defaultView;
    if (!view) {
      throw new Error("test document has no window");
    }
    const previousBody = doc.body.innerHTML;
    doc.body.innerHTML = '<main id="content"><h1>旧页面</h1></main>';
    const loadPage = vi
      .fn<NativePageLoader<PageData>>()
      .mockResolvedValue(
        result("历史页面", "https://movie.douban.com/subject/3016187/comments")
      );
    let state: NativeNavigationState<PageData> | null = null;
    const root = document.createElement("div");
    const addEventListener = vi.spyOn(view, "addEventListener");
    const removeEventListener = vi.spyOn(view, "removeEventListener");
    render(
      h(NavigationHarness, {
        doc,
        loadPage,
        onState: (next) => (state = next),
      }),
      root
    );
    await vi.waitFor(() => expect(state).not.toBeNull());
    await Promise.resolve();
    await delay(0);
    await Promise.resolve();

    await vi.waitFor(() =>
      expect(addEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function)
      )
    );
    const popstateListener = addEventListener.mock.calls.find(
      ([type]) => type === "popstate"
    )?.[1];
    if (typeof popstateListener !== "function") {
      throw new TypeError("popstate listener was not registered");
    }

    popstateListener(new view.Event("popstate"));
    await vi.waitFor(() => expect(loadPage).toHaveBeenCalledOnce());
    expect(loadPage.mock.calls[0]?.[0]).toBe(view.location.href);

    render(null, root);
    expect(removeEventListener).toHaveBeenCalledWith(
      "popstate",
      popstateListener
    );

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
    doc.body.innerHTML = previousBody;
  });

  it("exposes retry and refresh state without incrementing the sync version", async () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>旧页面</h1></main>',
      "/subject/3016187/comments"
    );
    const loadPage = vi
      .fn<NativePageLoader<PageData>>()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        result(
          "重试页面",
          "https://movie.douban.com/subject/3016187/comments?sort=time"
        )
      )
      .mockResolvedValueOnce(
        result("同步页面", "https://movie.douban.com/subject/3016187/comments")
      );
    let state: NativeNavigationState<PageData> | null = null;
    const root = document.createElement("div");
    render(
      h(NavigationHarness, {
        doc,
        loadPage,
        onState: (next) => (state = next),
      }),
      root
    );
    const readState = (): NativeNavigationState<PageData> => {
      if (!state) {
        throw new Error("navigation state is not mounted");
      }
      return state;
    };
    await vi.waitFor(() => expect(state).not.toBeNull());
    await Promise.resolve();
    await delay(0);
    await Promise.resolve();

    readState().navigate(
      "https://movie.douban.com/subject/3016187/comments?sort=time",
      "最新"
    );
    await vi.waitFor(() => expect(readState().failure).not.toBeNull());
    readState().retry();
    await vi.waitFor(() => expect(readState().data.title).toBe("重试页面"));
    expect(readState().version).toBe(1);

    const refreshed = await readState().refresh();
    await vi.waitFor(() => expect(readState().data.title).toBe("同步页面"));
    expect({ refreshed, version: readState().version }).toStrictEqual({
      refreshed: true,
      version: 1,
    });

    render(null, root);
    cleanup();
  });
});
