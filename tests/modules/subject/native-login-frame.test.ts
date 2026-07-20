import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mountNativeLoginFrame } from "@/modules/subject/login/native-login-frame";
import type { NativeLoginAdoptionState } from "@/modules/subject/login/native-login-frame";

type HappyDomNavigationSettings = {
  disableChildFrameNavigation: boolean;
  disableFallbackToSetURL: boolean;
};

/* eslint-disable typescript/consistent-type-definitions -- Global Window requires declaration merging. */
declare global {
  interface Window {
    happyDOM: { settings: { navigation: HappyDomNavigationSettings } };
  }
}
/* eslint-enable typescript/consistent-type-definitions */

const trustedLoginSource =
  "https://accounts.douban.com/passport/login_popup?source=movie";
let sessionCookie = "";

const createStateObserver = (): {
  states: NativeLoginAdoptionState[];
  onStateChange: (state: NativeLoginAdoptionState) => void;
} => {
  const states: NativeLoginAdoptionState[] = [];
  return {
    onStateChange: (state) => states.push(state),
    states,
  };
};

describe("native login adoption", () => {
  let childFrameNavigationDisabled = false;
  let fallbackToSetUrlDisabled = false;
  let reload: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    sessionCookie = "";
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => sessionCookie,
    });
    childFrameNavigationDisabled =
      window.happyDOM.settings.navigation.disableChildFrameNavigation;
    fallbackToSetUrlDisabled =
      window.happyDOM.settings.navigation.disableFallbackToSetURL;
    window.happyDOM.settings.navigation.disableChildFrameNavigation = true;
    window.happyDOM.settings.navigation.disableFallbackToSetURL = true;
    reload = vi.spyOn(window.location, "reload").mockImplementation(() => {});
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

  afterEach(() => {
    Reflect.deleteProperty(document, "cookie");
    window.happyDOM.settings.navigation.disableChildFrameNavigation =
      childFrameNavigationDisabled;
    window.happyDOM.settings.navigation.disableFallbackToSetURL =
      fallbackToSetUrlDisabled;
    reload.mockRestore();
  });

  it("adopts a trusted dialog iframe and reports its lifecycle", () => {
    document.body.innerHTML = `
      <div class="dui-dialog-msk"></div>
      <div class="account_pop dui-dialog">
        <iframe width="340" height="448" frameborder="0" scrolling="no" style="display:block" src="${trustedLoginSource}"></iframe>
      </div>
    `;
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);

    const iframe = host.querySelector<HTMLIFrameElement>("iframe");
    expect({
      dialog: document.querySelector(".account_pop"),
      iframeClass: iframe?.classList.contains("atv-login-modal-iframe"),
      iframePolicy: iframe?.referrerPolicy,
      iframeTitle: iframe?.title,
      mask: document.querySelector(".dui-dialog-msk"),
    }).toStrictEqual({
      dialog: null,
      iframeClass: true,
      iframePolicy: "strict-origin-when-cross-origin",
      iframeTitle: "豆瓣登录",
      mask: null,
    });
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);

    iframe?.dispatchEvent(new Event("load"));

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
      { kind: "ready" },
    ]);
  });

  it("rejects an untrusted dialog iframe without adopting it", () => {
    document.body.innerHTML = `
      <div class="account_pop dui-dialog">
        <iframe src="https://example.com/passport/login"></iframe>
      </div>
    `;
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);

    expect(host.querySelector("iframe")).toBeNull();
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      {
        kind: "error",
        message: "无法载入豆瓣登录组件，请刷新页面后重试。",
      },
    ]);
  });

  it("waits for a dialog iframe to receive a trusted source", () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div class="account_pop dui-dialog"><iframe></iframe></div>';
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);
    document
      .querySelector<HTMLIFrameElement>("iframe")
      ?.setAttribute("src", trustedLoginSource);
    vi.advanceTimersByTime(100);

    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);
  });

  it("adopts a trusted iframe that is already outside a native dialog", () => {
    document.body.innerHTML = `<iframe src="${trustedLoginSource}"></iframe>`;
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);

    expect(host.querySelector("iframe")?.src).toBe(trustedLoginSource);
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);
  });

  it("triggers the native dialog before preventing link navigation", () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<a class="a_show_login" href="#login">登录</a>';
    const nativeHandler = vi.fn<(event: Event) => void>((event) => {
      expect(event.defaultPrevented).toBeFalsy();
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div class="account_pop dui-dialog"><iframe src="${trustedLoginSource}"></iframe></div>`
      );
    });
    document.addEventListener("click", nativeHandler);
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);
    vi.advanceTimersByTime(100);
    document.removeEventListener("click", nativeHandler);

    expect(nativeHandler).toHaveBeenCalledOnce();
    expect(host.querySelector("iframe")?.title).toBe("豆瓣登录");
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);
  });

  it("reports authentication through the lifecycle after the iframe mounts", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<iframe src="${trustedLoginSource}"></iframe>`;
    sessionCookie = "ck=session";
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);
    vi.advanceTimersByTime(300);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
      { kind: "authenticated" },
    ]);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("reports failure when trigger-and-poll cannot adopt a native iframe", () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    const observer = createStateObserver();

    mountNativeLoginFrame(host, observer.onStateChange);
    vi.advanceTimersByTime(2400);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "error", message: "无法载入豆瓣登录组件，请刷新页面后重试。" },
    ]);
  });

  it("stops retries, iframe events, and authentication checks when disposed", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<iframe src="${trustedLoginSource}"></iframe>`;
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    const iframe = host.querySelector("iframe");
    stop();
    sessionCookie = "ck=session";
    iframe?.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(2500);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);
  });
});
