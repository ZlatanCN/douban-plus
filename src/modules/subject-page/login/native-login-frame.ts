type NativeLoginFrameResult =
  | { iframe: HTMLIFrameElement; kind: "ready" }
  | { kind: "error"; message: string }
  | { kind: "pending" };
type StopNativeLoginFrameMount = () => void;

const nativeDialogSelector =
  ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
const nativeMaskSelector = ".dui-dialog-msk, .ui-mask, .account-mask";
const maxAttempts = 24;
const trustedLoginOrigin = "https://accounts.douban.com";

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

const mountIframe = (
  host: HTMLElement,
  iframe: HTMLIFrameElement,
  onError: (message: string) => void,
  isStopped: () => boolean
): void => {
  host.replaceChildren(iframe);
  onError("");
  requestAnimationFrame(() => {
    if (!isStopped()) {
      iframe.focus();
    }
  });
};

const prepareNativeLoginIframe = (
  dialog: HTMLElement
): NativeLoginFrameResult => {
  const iframe = dialog.querySelector<HTMLIFrameElement>("iframe");
  if (!iframe) {
    return {
      kind: "error",
      message: "无法载入豆瓣登录组件，请刷新页面后重试。",
    };
  }
  const source = iframe.getAttribute("src");
  if (!source || source === "about:blank") {
    return { kind: "pending" };
  }
  if (!isTrustedLoginIframe(iframe)) {
    return {
      kind: "error",
      message: "无法载入豆瓣登录组件，请刷新页面后重试。",
    };
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

// <a> trigger navigation would redirect away from ATV. Cancel it only after
// Douban's own direct or delegated click handler has had a chance to create
// the native dialog. At document-idle, Douban's listeners are already
// registered, so this one-time bubbling handler runs after them.
const preventNavigation = (e: Event): void => {
  if (e.target instanceof HTMLAnchorElement) {
    e.preventDefault();
  }
};

const triggerNativeLoginDialog = (): void => {
  // ATV hides the original Douban #wrapper so all native login triggers have
  // offsetParent === null. We must NOT skip hidden elements here — click()
  // fires JS event handlers regardless of CSS visibility, and it's those
  // handlers (attached by Douban to .a_show_login) that create the login dialog.
  //
  // ATV's own DOM also contains links that match a[href*='register'] etc.,
  // pushing native Douban triggers to later positions in document order.
  // Restrict the search to .a_show_login elements to avoid clicking ATV UI.
  const triggers = [
    ...document.querySelectorAll<HTMLElement>(".a_show_login, .j.a_show_login"),
  ];
  // Prefer a visible trigger, but fall back to any (even hidden) .a_show_login.
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
  onError: (message: string) => void
): StopNativeLoginFrameMount => {
  let stopped = false;
  let retryTimer: number | undefined;

  const stop = (): void => {
    stopped = true;
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
    }
  };

  const attemptMount = (attempt: number): void => {
    if (stopped) {
      return;
    }

    clearNativeLoginMasks();

    // 1. Try to find a recognized native dialog wrapper and extract its iframe.
    const dialog = findNativeLoginDialog();
    if (dialog) {
      const result = prepareNativeLoginIframe(dialog);
      if (result.kind === "ready") {
        mountIframe(host, result.iframe, onError, () => stopped);
        return;
      }
      if (result.kind === "error") {
        onError(result.message);
        return;
      }
    }

    // 2. Some Douban pages prerender the login iframe directly in the DOM
    //    without a dialog wrapper matching nativeDialogSelector. Search for
    //    it before attempting to trigger a new dialog.
    const directIframe = findExistingLoginIframe();
    if (directIframe) {
      mountIframe(host, directIframe, onError, () => stopped);
      return;
    }

    // 3. Trigger the native login dialog via DOM click.
    if (attempt === 0) {
      triggerNativeLoginDialog();
      // Douban's click handler synchronously inserts a white
      // .dui-dialog-msk overlay that covers the viewport. Remove it
      // before the next paint so it doesn't flash through our
      // modal's fade-in transition.
      clearNativeLoginMasks();
    }
    if (attempt < maxAttempts) {
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        attemptMount(attempt + 1);
      }, 100);
      return;
    }

    onError("无法载入豆瓣登录组件，请刷新页面后重试。");
  };

  attemptMount(0);
  return stop;
};

export {
  clearNativeLoginMasks,
  findExistingLoginIframe,
  findNativeLoginDialog,
  isTrustedLoginIframe,
  mountNativeLoginFrame,
  prepareNativeLoginIframe,
  triggerNativeLoginDialog,
};
export type { NativeLoginFrameResult, StopNativeLoginFrameMount };
