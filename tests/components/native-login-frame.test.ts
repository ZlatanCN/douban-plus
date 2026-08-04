import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mountNativeLoginFrame } from "@/shared/components/login-modal/native-login-frame";
import type { NativeLoginAdoptionState } from "@/shared/components/login-modal/native-login-frame";

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

describe("native login frame", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    sessionCookie = "";
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => sessionCookie,
    });
    vi.useRealTimers();
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    /* eslint-enable promise/prefer-await-to-callbacks */
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "cookie");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates the official login iframe without a host-page trigger", () => {
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);

    const iframe = host.querySelector<HTMLIFrameElement>("iframe");
    expect({
      iframeClass: iframe?.classList.contains("atv-login-modal-iframe"),
      iframePolicy: iframe?.referrerPolicy,
      iframeSandbox: iframe?.getAttribute("sandbox"),
      iframeTitle: iframe?.title,
      source: iframe?.src,
    }).toStrictEqual({
      iframeClass: true,
      iframePolicy: "strict-origin-when-cross-origin",
      iframeSandbox: "allow-forms allow-scripts allow-same-origin",
      iframeTitle: "豆瓣登录",
      source: trustedLoginSource,
    });
    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);

    stop();
  });

  it("does not adopt login artifacts from the host page", () => {
    document.body.innerHTML = `
      <a class="a_show_login" href="https://example.com/login">登录</a>
      <div class="dui-dialog-msk"></div>
      <iframe src="about:blank"></iframe>
    `;
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);

    expect(document.querySelector(".a_show_login")).not.toBeNull();
    expect(document.querySelector(".dui-dialog-msk")).not.toBeNull();
    expect(
      document.querySelector<HTMLIFrameElement>("body > iframe")?.src
    ).toBe("about:blank");
    expect(host.querySelector<HTMLIFrameElement>("iframe")?.src).toBe(
      trustedLoginSource
    );

    stop();
  });

  it("reports when the official login iframe fails to load", () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    const iframe = host.querySelector("iframe");
    iframe?.dispatchEvent(new Event("error"));
    sessionCookie = "ck=session";
    iframe?.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(900);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
      {
        kind: "error",
        message: "无法载入豆瓣登录组件，请刷新页面后重试。",
      },
    ]);

    stop();
  });

  it("reports the iframe as ready after it loads", () => {
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    const iframe = host.querySelector("iframe");
    iframe?.dispatchEvent(new Event("load"));
    iframe?.dispatchEvent(new Event("error"));

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
      { kind: "ready" },
    ]);

    stop();
  });

  it("does not treat an empty ck cookie as an authenticated session", () => {
    vi.useFakeTimers();
    sessionCookie = "ck=";
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    vi.advanceTimersByTime(900);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);

    stop();
  });

  it("reports authentication through the lifecycle after the iframe mounts", () => {
    vi.useFakeTimers();
    sessionCookie = "ck=session";
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    vi.advanceTimersByTime(300);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
      { kind: "authenticated" },
    ]);

    stop();
  });

  it("stops iframe events, focus work, and authentication checks when disposed", () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    const observer = createStateObserver();

    const stop = mountNativeLoginFrame(host, observer.onStateChange);
    const iframe = host.querySelector("iframe");
    stop();
    sessionCookie = "ck=session";
    iframe?.dispatchEvent(new Event("load"));
    iframe?.dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(2500);

    expect(observer.states).toStrictEqual([
      { kind: "loading" },
      { kind: "mounted" },
    ]);
    expect(host.querySelector("iframe")).toBeNull();
  });
});
