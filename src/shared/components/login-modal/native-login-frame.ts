type NativeLoginAdoptionState =
  | { kind: "authenticated" }
  | { kind: "error"; message: string }
  | { kind: "loading" }
  | { kind: "mounted" }
  | { kind: "ready" };
type StopNativeLoginFrameMount = () => void;

const nativeLoginError = "无法载入豆瓣登录组件，请刷新页面后重试。";
const trustedLoginOrigin = "https://accounts.douban.com";
const trustedLoginPath = "/passport/login_popup";
const trustedLoginSource = `${trustedLoginOrigin}${trustedLoginPath}?source=movie`;

const isTrustedLoginIframe = (iframe: HTMLIFrameElement): boolean => {
  const source = iframe.getAttribute("src");
  if (!source) {
    return false;
  }

  try {
    const url = new URL(source, window.location.href);
    return (
      url.origin === trustedLoginOrigin &&
      !url.username &&
      !url.password &&
      url.pathname === trustedLoginPath
    );
  } catch {
    return false;
  }
};

const styleLoginIframe = (iframe: HTMLIFrameElement): void => {
  iframe.title = "豆瓣登录";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.setAttribute("sandbox", "allow-forms allow-scripts allow-same-origin");
  iframe.classList.add("atv-login-modal-iframe");
};

const createTrustedLoginIframe = (): HTMLIFrameElement => {
  const iframe = document.createElement("iframe");
  iframe.src = trustedLoginSource;
  styleLoginIframe(iframe);
  return iframe;
};

const hasAuthenticatedSession = (): boolean =>
  document.cookie.split(";").some((cookie) => {
    const [name, ...values] = cookie.trim().split("=");
    return name === "ck" && values.join("=").trim().length > 0;
  });

const mountIframe = (
  host: HTMLElement,
  iframe: HTMLIFrameElement,
  onStateChange: (state: NativeLoginAdoptionState) => void,
  isStopped: () => boolean
): StopNativeLoginFrameMount => {
  let authenticated = false;
  let failed = false;
  let ready = false;
  let sessionTimer: number | undefined;
  let focusFrame: number | undefined;

  const stopSessionChecks = (): void => {
    if (sessionTimer !== undefined) {
      window.clearInterval(sessionTimer);
      sessionTimer = undefined;
    }
  };
  const onLoad = (): void => {
    if (isStopped() || authenticated || failed || ready) {
      return;
    }
    ready = true;
    onStateChange({ kind: "ready" });
  };
  const onError = (): void => {
    if (isStopped() || authenticated || failed || ready) {
      return;
    }
    failed = true;
    stopSessionChecks();
    onStateChange({ kind: "error", message: nativeLoginError });
  };
  const checkSession = (): void => {
    if (isStopped() || authenticated || failed || !hasAuthenticatedSession()) {
      return;
    }
    authenticated = true;
    stopSessionChecks();
    onStateChange({ kind: "authenticated" });
  };

  iframe.addEventListener("load", onLoad, { once: true });
  iframe.addEventListener("error", onError, { once: true });
  host.replaceChildren(iframe);
  onStateChange({ kind: "mounted" });
  sessionTimer = window.setInterval(checkSession, 300);
  focusFrame = window.requestAnimationFrame(() => {
    if (!isStopped()) {
      iframe.focus();
    }
  });

  return () => {
    iframe.removeEventListener("load", onLoad);
    iframe.removeEventListener("error", onError);
    stopSessionChecks();
    if (focusFrame !== undefined) {
      window.cancelAnimationFrame(focusFrame);
      focusFrame = undefined;
    }
    if (iframe.parentElement === host) {
      iframe.remove();
    }
  };
};

const mountNativeLoginFrame = (
  host: HTMLElement,
  onStateChange: (state: NativeLoginAdoptionState) => void
): StopNativeLoginFrameMount => {
  let stopped = false;

  onStateChange({ kind: "loading" });
  const iframe = createTrustedLoginIframe();
  if (!isTrustedLoginIframe(iframe)) {
    onStateChange({ kind: "error", message: nativeLoginError });
    return () => {
      stopped = true;
    };
  }

  const stopIframeMount = mountIframe(
    host,
    iframe,
    onStateChange,
    () => stopped
  );
  return () => {
    stopped = true;
    stopIframeMount();
  };
};

export { mountNativeLoginFrame };
export type { NativeLoginAdoptionState };
