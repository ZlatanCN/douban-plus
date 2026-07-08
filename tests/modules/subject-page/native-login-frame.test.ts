import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearNativeLoginMasks,
  isTrustedLoginIframe,
  mountNativeLoginFrame,
  prepareNativeLoginIframe,
} from "../../../src/modules/subject-page/login/native-login-frame";

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

    expect(isTrustedLoginIframe(trusted)).toBeTruthy();
    expect(isTrustedLoginIframe(blank)).toBeTruthy();
    expect(isTrustedLoginIframe(untrusted)).toBeFalsy();
  });

  it("extracts a trusted iframe and sets login attributes", () => {
    const dialog = document.createElement("div");
    dialog.className = "account_pop dui-dialog";
    dialog.innerHTML =
      '<iframe width="340" height="448" frameborder="0" scrolling="no" style="display:block" src="https://accounts.douban.com/passport/login_popup?source=movie"></iframe>';

    const result = prepareNativeLoginIframe(dialog);

    expect(result.ok).toBeTruthy();
    const { iframe } = result as { ok: true; iframe: HTMLIFrameElement };
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

    expect(result.ok).toBeFalsy();
    const { message } = result as { ok: false; message: string };
    expect(message).toContain("无法载入豆瓣登录组件");
  });

  it("clears native masks and mounts the extracted iframe into the host", () => {
    document.body.innerHTML =
      '<div class="dui-dialog-msk"></div><div class="account_pop dui-dialog"><iframe src="about:blank"></iframe></div>';
    const host = document.createElement("div");
    const onError = vi.fn<() => void>();

    clearNativeLoginMasks();
    expect(document.querySelector(".dui-dialog-msk")).toBeNull();

    mountNativeLoginFrame(host, onError);
    expect(onError).not.toHaveBeenCalled();
    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(host.getAttribute("aria-busy")).toBe("false");
  });
});
