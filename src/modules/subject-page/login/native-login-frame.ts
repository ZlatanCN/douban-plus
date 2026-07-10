type NativeLoginFrameResult =
  | { iframe: HTMLIFrameElement; ok: true }
  | { message: string; ok: false };

const nativeDialogSelector =
  ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
const nativeMaskSelector = ".dui-dialog-msk, .ui-mask, .account-mask";
const maxAttempts = 24;
const trustedHosts = new Set(["accounts.douban.com"]);
const loginTriggerSelector = [
  ".a_show_login",
  ".j.a_show_login",
  "a[href*='accounts/login']",
  "a[href*='douban.com/accounts/login']",
  "a[href*='register']",
  "a[href*='douban.com/register']",
].join(", ");

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
  if (!source || source === "about:blank") {
    return true;
  }

  try {
    const url = new URL(source, window.location.href);
    return (
      trustedHosts.has(url.hostname) &&
      url.pathname.startsWith("/passport/login")
    );
  } catch {
    return false;
  }
};

const prepareNativeLoginIframe = (
  dialog: HTMLElement
): NativeLoginFrameResult => {
  const iframe = dialog.querySelector<HTMLIFrameElement>("iframe");
  if (!iframe || !isTrustedLoginIframe(iframe)) {
    return {
      message: "无法载入豆瓣登录组件，请刷新页面后重试。",
      ok: false,
    };
  }

  iframe.title = "豆瓣登录";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.removeAttribute("width");
  iframe.removeAttribute("height");
  iframe.removeAttribute("frameborder");
  iframe.removeAttribute("scrolling");
  iframe.removeAttribute("style");
  iframe.classList.add("atv-login-modal-iframe");
  iframe.remove();
  dialog.remove();

  return { iframe, ok: true };
};

const triggerNativeLoginDialog = (): void => {
  const triggers = [
    ...document.querySelectorAll<HTMLElement>(loginTriggerSelector),
  ];
  const trigger =
    triggers.find((node) => node.offsetParent !== null) ?? triggers[0];
  trigger?.click();
};

const mountNativeLoginFrame = (
  host: HTMLElement,
  onError: (message: string) => void,
  attempt = 0
): void => {
  clearNativeLoginMasks();

  const dialog = findNativeLoginDialog();
  if (dialog) {
    const result = prepareNativeLoginIframe(dialog);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    host.replaceChildren(result.iframe);
    onError("");
    requestAnimationFrame(() => result.iframe.focus());
    return;
  }

  if (attempt === 0) {
    triggerNativeLoginDialog();
    // Douban's click handler synchronously inserts a white
    // .dui-dialog-msk overlay that covers the viewport. Remove it
    // before the next paint so it doesn't flash through our
    // modal's fade-in transition.
    clearNativeLoginMasks();
  }
  if (attempt < maxAttempts) {
    window.setTimeout(() => {
      mountNativeLoginFrame(host, onError, attempt + 1);
    }, 100);
    return;
  }

  onError("无法载入豆瓣登录组件，请刷新页面后重试。");
};

export {
  clearNativeLoginMasks,
  findNativeLoginDialog,
  isTrustedLoginIframe,
  mountNativeLoginFrame,
  prepareNativeLoginIframe,
  triggerNativeLoginDialog,
};
export type { NativeLoginFrameResult };
