type NativeLoginAdoptionState =
  | { kind: "authenticated" }
  | { kind: "error"; message: string }
  | { kind: "loading" }
  | { kind: "mounted" }
  | { kind: "ready" };
type NativeLoginFrameResult =
  | { iframe: HTMLIFrameElement; kind: "ready" }
  | { kind: "error"; message: string }
  | { kind: "pending" };
type StopNativeLoginFrameMount = () => void;

const nativeDialogSelector =
  ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
const nativeMaskSelector = ".dui-dialog-msk, .ui-mask, .account-mask";
const nativeLoginError = "无法载入豆瓣登录组件，请刷新页面后重试。";
const trustedLoginOrigin = "https://accounts.douban.com";
const maxAttempts = 24;

const clearNativeLoginMasks = (): void => {
  for (const mask of document.querySelectorAll<HTMLElement>(
    nativeMaskSelector
  )) {
    mask.remove();
  }
};

const findNativeLoginDialog = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(nativeDialogSelector);

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
      url.pathname.startsWith("/passport/login")
    );
  } catch {
    return false;
  }
};

const styleLoginIframe = (iframe: HTMLIFrameElement): void => {
  iframe.title = "豆瓣登录";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.removeAttribute("width");
  iframe.removeAttribute("height");
  iframe.removeAttribute("frameborder");
  iframe.removeAttribute("scrolling");
  iframe.removeAttribute("style");
  iframe.classList.add("atv-login-modal-iframe");
};

const prepareNativeLoginIframe = (
  dialog: HTMLElement
): NativeLoginFrameResult => {
  const iframe = dialog.querySelector<HTMLIFrameElement>("iframe");
  if (!iframe) {
    return { kind: "error", message: nativeLoginError };
  }
  const source = iframe.getAttribute("src");
  if (!source || source === "about:blank") {
    return { kind: "pending" };
  }
  if (!isTrustedLoginIframe(iframe)) {
    return { kind: "error", message: nativeLoginError };
  }

  styleLoginIframe(iframe);
  iframe.remove();
  dialog.remove();
  return { iframe, kind: "ready" };
};

const findExistingLoginIframe = (): HTMLIFrameElement | null => {
  for (const iframe of document.querySelectorAll<HTMLIFrameElement>(
    "iframe[src*='passport/login']"
  )) {
    if (isTrustedLoginIframe(iframe)) {
      styleLoginIframe(iframe);
      iframe.remove();
      return iframe;
    }
  }
  return null;
};

const hasAuthenticatedSession = (): boolean =>
  document.cookie.split(";").some((cookie) => cookie.trim().startsWith("ck="));

const mountIframe = (
  host: HTMLElement,
  iframe: HTMLIFrameElement,
  onStateChange: (state: NativeLoginAdoptionState) => void,
  isStopped: () => boolean
): StopNativeLoginFrameMount => {
  let authenticated = false;
  const sessionTimer: { current: number | undefined } = { current: undefined };
  const onLoad = (): void => {
    if (!isStopped() && !authenticated) {
      onStateChange({ kind: "ready" });
    }
  };
  const checkSession = (): void => {
    if (isStopped() || authenticated || !hasAuthenticatedSession()) {
      return;
    }
    authenticated = true;
    if (sessionTimer.current !== undefined) {
      window.clearInterval(sessionTimer.current);
    }
    onStateChange({ kind: "authenticated" });
    window.location.reload();
  };

  host.replaceChildren(iframe);
  iframe.addEventListener("load", onLoad, { once: true });
  onStateChange({ kind: "mounted" });
  sessionTimer.current = window.setInterval(checkSession, 300);
  requestAnimationFrame(() => {
    if (!isStopped()) {
      iframe.focus();
    }
  });
  return () => {
    iframe.removeEventListener("load", onLoad);
    if (sessionTimer.current !== undefined) {
      window.clearInterval(sessionTimer.current);
    }
  };
};

const preventNavigation = (event: Event): void => {
  if (event.target instanceof HTMLAnchorElement) {
    event.preventDefault();
  }
};

const triggerNativeLoginDialog = (): void => {
  // ATV hides the host document's original wrapper, so native triggers can be
  // invisible. Their click handlers still create the dialog, and are the only
  // behavior this module needs to adopt.
  const triggers = [
    ...document.querySelectorAll<HTMLElement>(".a_show_login, .j.a_show_login"),
  ];
  const trigger =
    triggers.find((node) => node.offsetParent !== null) ?? triggers[0];
  if (!trigger) {
    return;
  }

  document.addEventListener("click", preventNavigation, { once: true });
  trigger.click();
};

const mountNativeLoginFrame = (
  host: HTMLElement,
  onStateChange: (state: NativeLoginAdoptionState) => void
): StopNativeLoginFrameMount => {
  let stopped = false;
  let retryTimer: number | undefined;
  let stopIframeMount: StopNativeLoginFrameMount | undefined;
  const stop = (): void => {
    stopped = true;
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
    }
    stopIframeMount?.();
  };
  const mount = (iframe: HTMLIFrameElement): void => {
    stopIframeMount = mountIframe(host, iframe, onStateChange, () => stopped);
  };
  const attemptMount = (attempt: number): void => {
    if (stopped) {
      return;
    }
    clearNativeLoginMasks();

    const dialog = findNativeLoginDialog();
    if (dialog) {
      const result = prepareNativeLoginIframe(dialog);
      if (result.kind === "ready") {
        mount(result.iframe);
        return;
      }
      if (result.kind === "error") {
        onStateChange(result);
        return;
      }
    }

    const directIframe = findExistingLoginIframe();
    if (directIframe) {
      mount(directIframe);
      return;
    }
    if (attempt === 0) {
      triggerNativeLoginDialog();
      clearNativeLoginMasks();
    }
    if (attempt < maxAttempts) {
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        attemptMount(attempt + 1);
      }, 100);
      return;
    }
    onStateChange({ kind: "error", message: nativeLoginError });
  };

  onStateChange({ kind: "loading" });
  attemptMount(0);
  return stop;
};

export { mountNativeLoginFrame };
export type { NativeLoginAdoptionState };
