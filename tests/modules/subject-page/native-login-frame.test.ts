import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearNativeLoginMasks,
  isTrustedLoginIframe,
  mountNativeLoginFrame,
  prepareNativeLoginIframe,
} from "@/modules/subject-page/login/native-login-frame";

describe("native login frame", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });
  it("trusts only Douban passport login iframes", () => {
    const trusted = document.createElement("iframe");
    trusted.src =
      "https://accounts.douban.com/passport/login_popup?source=movie";
    const blank = document.createElement("iframe");
    const untrusted = document.createElement("iframe");
    untrusted.src = "https://example.com/passport/login";
    const insecure = document.createElement("iframe");
    insecure.src = "http://accounts.douban.com/passport/login";
    const credentialed = document.createElement("iframe");
    credentialed.src = "https://user@accounts.douban.com/passport/login";

    expect(isTrustedLoginIframe(trusted)).toBeTruthy();
    expect(isTrustedLoginIframe(blank)).toBeFalsy();
    expect(isTrustedLoginIframe(untrusted)).toBeFalsy();
    expect(isTrustedLoginIframe(insecure)).toBeFalsy();
    expect(isTrustedLoginIframe(credentialed)).toBeFalsy();
  });

  it("extracts a trusted iframe and sets login attributes", () => {
    const dialog = document.createElement("div");
    dialog.className = "account_pop dui-dialog";
    dialog.innerHTML =
      '<iframe width="340" height="448" frameborder="0" scrolling="no" style="display:block" src="https://accounts.douban.com/passport/login_popup?source=movie"></iframe>';

    const result = prepareNativeLoginIframe(dialog);

    expect(result.kind).toBe("ready");
    const { iframe } = result as {
      iframe: HTMLIFrameElement;
      kind: "ready";
    };
    expect(iframe.title).toBe("豆瓣登录");
    expect(iframe.referrerPolicy).toBe("strict-origin-when-cross-origin");
    expect(iframe.classList.contains("atv-login-modal-iframe")).toBeTruthy();
  });

  it("removes native dialog attributes and cleans up DOM", () => {
    const dialog = document.createElement("div");
    dialog.className = "account_pop dui-dialog";
    dialog.innerHTML =
      '<iframe width="340" height="448" frameborder="0" scrolling="no" style="display:block" src="https://accounts.douban.com/passport/login_popup?source=movie"></iframe>';

    prepareNativeLoginIframe(dialog);

    expect(document.querySelector(".account_pop")).toBeNull();
  });

  it("rejects native dialogs without a trusted iframe", () => {
    const dialog = document.createElement("div");
    dialog.innerHTML = '<iframe src="https://example.com/login"></iframe>';

    const result = prepareNativeLoginIframe(dialog);

    expect(result.kind).toBe("error");
    const { message } = result as { kind: "error"; message: string };
    expect(message).toContain("无法载入豆瓣登录组件");
  });

  it("clears native masks and mounts the extracted iframe into the host", () => {
    document.body.innerHTML =
      '<div class="dui-dialog-msk"></div><div class="account_pop dui-dialog"><iframe src="https://accounts.douban.com/passport/login_popup"></iframe></div>';
    const host = document.createElement("div");
    const onError = vi.fn<() => void>();

    clearNativeLoginMasks();
    expect(document.querySelector(".dui-dialog-msk")).toBeNull();

    mountNativeLoginFrame(host, onError);
    // mountNativeLoginFrame now calls onError("") on success to clear
    // the component's loading state.
    expect(onError).toHaveBeenCalledWith("");
    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(host.getAttribute("aria-busy")).toBeNull();
  });

  it("waits for a native iframe to receive its trusted source", () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div class="account_pop dui-dialog"><iframe></iframe></div>';
    const host = document.createElement("div");
    const onError = vi.fn<(message: string) => void>();

    mountNativeLoginFrame(host, onError);
    expect(onError).not.toHaveBeenCalled();

    document
      .querySelector<HTMLIFrameElement>("iframe")
      ?.setAttribute("src", "https://accounts.douban.com/passport/login_popup");
    vi.advanceTimersByTime(100);

    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(onError).toHaveBeenLastCalledWith("");
  });

  it("lets a delegated native login handler run before cancelling navigation", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="wrapper"><a class="a_show_login" href="#login">登录</a></div>
    `;
    const nativeHandler = vi.fn<(event: Event) => void>((event) => {
      expect(event.defaultPrevented).toBeFalsy();
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div class="account_pop dui-dialog"><iframe src="https://accounts.douban.com/passport/login_popup"></iframe></div>'
      );
    });
    document.addEventListener("click", nativeHandler);
    const host = document.createElement("div");
    const onError = vi.fn<(message: string) => void>();

    mountNativeLoginFrame(host, onError);
    vi.advanceTimersByTime(100);
    document.removeEventListener("click", nativeHandler);

    expect(nativeHandler).toHaveBeenCalledOnce();
    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(onError).toHaveBeenLastCalledWith("");
  });

  it("stops polling when the login modal closes", () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    const onError = vi.fn<(message: string) => void>();

    const stop = mountNativeLoginFrame(host, onError);
    stop();
    vi.advanceTimersByTime(2500);

    expect(onError).not.toHaveBeenCalled();
  });
});
