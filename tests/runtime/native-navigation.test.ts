import { describe, expect, it, vi } from "vitest";

import { createNativeNavigation } from "@/shared/runtime/native-navigation";
import type {
  NativeNavigationResult,
  NativeNavigationTarget,
} from "@/shared/runtime/native-navigation";

import { createTestDoc } from "../helpers/doc";
import { result, target } from "./native-navigation-fixtures";
import type { PageData } from "./native-navigation-fixtures";

describe(createNativeNavigation, () => {
  it("commits only the latest navigation result", async () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>旧页面</h1></main>',
      "/subject/3016187/comments"
    );
    const first = Promise.withResolvers<NativeNavigationResult<PageData>>();
    const second = Promise.withResolvers<NativeNavigationResult<PageData>>();
    const loadPage = vi
      .fn<
        (
          href: string,
          signal: AbortSignal
        ) => Promise<NativeNavigationResult<PageData>>
      >()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const success =
      vi.fn<
        (
          result: NativeNavigationResult<PageData>,
          target: NativeNavigationTarget
        ) => void
      >();
    const navigator = createNativeNavigation<PageData>({
      doc,
      getTitle: ({ data }) => data.title,
      loadPage,
      onFailure: vi.fn<(value: NativeNavigationTarget) => void>(),
      onPending: vi.fn<(value: NativeNavigationTarget) => void>(),
      onSuccess: success,
    });

    const firstNavigation = navigator.navigate(
      target("https://movie.douban.com/subject/3016187/comments?sort=time")
    );
    const secondNavigation = navigator.navigate(
      target("https://movie.douban.com/subject/3016187/comments?status=P")
    );

    expect(loadPage.mock.calls[0]?.[1].aborted).toBeTruthy();

    first.resolve(
      result(
        "过期页面",
        "https://movie.douban.com/subject/3016187/comments?sort=time"
      )
    );
    second.resolve(
      result(
        "最新页面",
        "https://movie.douban.com/subject/3016187/comments?status=P"
      )
    );

    await expect(
      Promise.all([firstNavigation, secondNavigation])
    ).resolves.toStrictEqual([false, true]);
    expect(doc.querySelector("#content h1")?.textContent).toBe("最新页面");
    expect(doc.title).toBe("最新页面");
    expect(success).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ data: { title: "最新页面" } }),
      expect.objectContaining({ source: "user" })
    );

    navigator.dispose();
    cleanup();
  });

  it("restores the last successful URL when a history navigation fails", async () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>初始页面</h1></main>',
      "/subject/3016187/reviews"
    );
    const successfulHref =
      "http://localhost:3000/subject/3016187/reviews?sort=time";
    const failedHref =
      "http://localhost:3000/subject/3016187/reviews?sort=follow";
    const loadPage = vi
      .fn<
        (
          href: string,
          signal: AbortSignal
        ) => Promise<NativeNavigationResult<PageData>>
      >()
      .mockResolvedValueOnce(result("已提交页面", successfulHref))
      .mockRejectedValueOnce(new Error("network down"));
    const onFailure = vi.fn<(value: NativeNavigationTarget) => void>();
    const replaceState = vi
      .spyOn(doc.defaultView?.history ?? history, "replaceState")
      .mockReturnValue();
    const onSuccess =
      vi.fn<
        (
          result: NativeNavigationResult<PageData>,
          target: NativeNavigationTarget
        ) => void
      >();
    const navigator = createNativeNavigation({
      doc,
      getTitle: ({ data }) => data.title,
      loadPage,
      onFailure,
      onPending: vi.fn<(value: NativeNavigationTarget) => void>(),
      onSuccess,
    });

    await expect(
      navigator.navigate(target(successfulHref, "user"))
    ).resolves.toBeTruthy();
    doc.defaultView?.history.pushState(null, "", failedHref);
    await expect(
      navigator.navigate(target(failedHref, "history"))
    ).resolves.toBeFalsy();

    expect({
      content: doc.querySelector("#content h1")?.textContent,
      failureSource: onFailure.mock.calls[0]?.[0]?.source,
      replaceStateCalls: replaceState.mock.calls,
    }).toStrictEqual({
      content: "已提交页面",
      failureSource: "history",
      replaceStateCalls: [[null, "", successfulHref]],
    });

    replaceState.mockRestore();
    const syncNavigation = await navigator.navigate(target(failedHref, "sync"));
    expect({ href: doc.location.href, syncNavigation }).toStrictEqual({
      href: successfulHref,
      syncNavigation: false,
    });

    navigator.dispose();
    cleanup();
  });

  it("ignores a result after disposal", async () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>旧页面</h1></main>',
      "/subject/3016187/comments"
    );
    const pending = Promise.withResolvers<NativeNavigationResult<PageData>>();
    const success =
      vi.fn<
        (
          result: NativeNavigationResult<PageData>,
          target: NativeNavigationTarget
        ) => void
      >();
    const navigator = createNativeNavigation<PageData>({
      doc,
      getTitle: ({ data }) => data.title,
      loadPage: vi
        .fn<() => Promise<NativeNavigationResult<PageData>>>()
        .mockReturnValue(pending.promise),
      onFailure: vi.fn<(value: NativeNavigationTarget) => void>(),
      onPending: vi.fn<(value: NativeNavigationTarget) => void>(),
      onSuccess: success,
    });

    const navigation = navigator.navigate(
      target("https://movie.douban.com/subject/3016187/comments?sort=time")
    );
    navigator.dispose();
    pending.resolve(
      result(
        "不应采用",
        "https://movie.douban.com/subject/3016187/comments?sort=time"
      )
    );

    await expect(navigation).resolves.toBeFalsy();
    expect(success).not.toHaveBeenCalled();
    expect(doc.querySelector("#content h1")?.textContent).toBe("旧页面");

    cleanup();
  });
});
