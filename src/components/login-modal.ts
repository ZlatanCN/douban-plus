import { el } from "./dom-factory";
import { createOverlay } from "./overlay";

type LoginModalOptions = {
  action: string;
  returnUrl?: string;
};

const LOGIN_MODAL_ID = "atv-login-modal";
const NATIVE_DIALOG_SELECTOR =
  ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
const NATIVE_MASK_SELECTOR = ".dui-dialog-msk, .ui-mask, .account-mask";
const TRUSTED_LOGIN_FRAME_HOSTS = new Set(["accounts.douban.com"]);
const MAX_NATIVE_LOGIN_ATTEMPTS = 24;
const LOGIN_TRIGGER_SELECTOR = [
  ".a_show_login",
  ".j.a_show_login",
  "a[href*='accounts/login']",
  "a[href*='douban.com/accounts/login']",
  "a[href*='register']",
  "a[href*='douban.com/register']",
].join(", ");
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "iframe",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>';

const findNativeLoginDialog = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(NATIVE_DIALOG_SELECTOR);

const clearNativeLoginMasks = (): void => {
  for (const mask of document.querySelectorAll<HTMLElement>(
    NATIVE_MASK_SELECTOR
  )) {
    mask.remove();
  }
};

const isTrustedLoginIframe = (iframe: HTMLIFrameElement): boolean => {
  const source = iframe.getAttribute("src");
  if (!source || source === "about:blank") {
    return true;
  }

  try {
    const url = new URL(source, window.location.href);
    return (
      TRUSTED_LOGIN_FRAME_HOSTS.has(url.hostname) &&
      url.pathname.startsWith("/passport/login")
    );
  } catch {
    return false;
  }
};

const prepareNativeLoginIframe = (
  dialog: HTMLElement
): HTMLIFrameElement | null => {
  const iframe = dialog.querySelector<HTMLIFrameElement>("iframe");
  if (!iframe || !isTrustedLoginIframe(iframe)) {
    return null;
  }

  iframe.title = "豆瓣登录";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
  iframe.removeAttribute("width");
  iframe.removeAttribute("height");
  iframe.removeAttribute("frameborder");
  iframe.removeAttribute("scrolling");
  iframe.removeAttribute("style");
  iframe.classList.add("atv-login-modal-iframe");
  iframe.remove();
  dialog.remove();

  return iframe;
};

const triggerNativeLoginDialog = (): void => {
  const triggers = [
    ...document.querySelectorAll<HTMLElement>(LOGIN_TRIGGER_SELECTOR),
  ];
  const trigger =
    triggers.find((node) => node.offsetParent !== null) ?? triggers[0];
  trigger?.click();
};

const mountNativeLoginDialog = (
  host: HTMLElement,
  status: HTMLElement,
  attempt = 0
): void => {
  clearNativeLoginMasks();

  const dialog = findNativeLoginDialog();
  if (dialog) {
    const iframe = prepareNativeLoginIframe(dialog);
    if (!iframe) {
      status.hidden = false;
      status.textContent = "无法载入豆瓣登录组件，请刷新页面后重试。";
      host.setAttribute("aria-busy", "false");
      return;
    }
    host.replaceChildren(iframe);
    host.setAttribute("aria-busy", "false");
    status.textContent = "";
    status.hidden = true;
    requestAnimationFrame(() => {
      iframe?.focus();
    });
    return;
  }

  if (attempt === 0) {
    triggerNativeLoginDialog();
  }

  if (attempt < MAX_NATIVE_LOGIN_ATTEMPTS) {
    window.setTimeout(() => {
      mountNativeLoginDialog(host, status, attempt + 1);
    }, 100);
    return;
  }

  status.hidden = false;
  status.textContent = "无法载入豆瓣登录组件，请刷新页面后重试。";
  host.setAttribute("aria-busy", "false");
};

const getFocusableElements = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (node) =>
      !node.hasAttribute("disabled") &&
      node.getAttribute("aria-hidden") !== "true"
  );

const keepFocusInside = (event: KeyboardEvent, root: HTMLElement): void => {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(root);
  if (focusable.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }

  const [first] = focusable;
  const last = focusable.at(-1);
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last?.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

const openLoginModal = (options: LoginModalOptions): void => {
  void options.returnUrl;

  document.querySelector(`#${LOGIN_MODAL_ID}`)?.remove();
  clearNativeLoginMasks();

  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  const accent = el("div", { className: "atv-login-modal-accent" });
  const title = el("h2", {
    className: "atv-login-modal-title",
    id: "atv-login-modal-title",
    text: "登录豆瓣后继续",
  });
  const desc = el("p", {
    className: "atv-login-modal-desc",
    id: "atv-login-modal-desc",
    text: `登录后才能${options.action}。`,
  });
  const status = el("p", {
    attrs: { "aria-live": "polite" },
    className: "atv-login-modal-status",
    text: "正在载入豆瓣登录组件…",
  });
  const nativeHost = el("div", {
    attrs: { "aria-busy": "true" },
    className: "atv-login-modal-native",
  });
  const closeBtn = el("button", {
    attrs: { "aria-label": "关闭登录弹窗", type: "button" },
    className: "atv-login-modal-close",
    html: CLOSE_ICON,
  });
  const inner = el(
    "div",
    {
      attrs: { tabindex: "-1" },
      className: "atv-login-modal-inner",
    },
    [accent, closeBtn, title, desc, status, nativeHost]
  );

  // Douban sets `ck` on `.douban.com` on successful login.
  // Poll for it, then close modal + reload current page.
  let loginPollCleaned = false;
  let loginPollTimer: ReturnType<typeof setInterval> | null = null;

  const cleanLoginPoll = (): void => {
    if (loginPollCleaned) {
      return;
    }
    loginPollCleaned = true;
    if (loginPollTimer !== null) {
      clearInterval(loginPollTimer);
      loginPollTimer = null;
    }
  };

  const { overlay, dismiss } = createOverlay({
    className: "atv-login-modal",
    closeButton: closeBtn,
    content: [inner],
    id: LOGIN_MODAL_ID,
    onClose: () => {
      clearNativeLoginMasks();
      cleanLoginPoll();
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    },
  });

  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "atv-login-modal-title");
  overlay.setAttribute("aria-describedby", "atv-login-modal-desc");
  overlay.addEventListener("keydown", (event) => keepFocusInside(event, inner));

  inner.focus();
  mountNativeLoginDialog(nativeHost, status);

  loginPollTimer = setInterval(() => {
    const iframe = nativeHost.querySelector("iframe");
    if (!iframe) {
      return;
    }

    const hasSession = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("ck="));

    if (hasSession) {
      cleanLoginPoll();
      dismiss();
      window.location.reload();
    }
  }, 300);
};

export { openLoginModal };
export type { LoginModalOptions };
