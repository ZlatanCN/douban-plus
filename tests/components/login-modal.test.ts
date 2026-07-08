import { afterEach, describe, expect, it, vi } from "vitest";

import { openLoginModal } from "../../src/components/login-modal";

const stubRaf = (): void => {
  /* eslint-disable promise/prefer-await-to-callbacks — RAF is a callback API */
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    (callback: FrameRequestCallback): number => {
      callback(0);
      return 0;
    }
  );
  /* eslint-enable promise/prefer-await-to-callbacks */
};

const cleanup = (): void => {
  document.querySelector("#atv-login-modal")?.remove();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  vi.restoreAllMocks();
};

describe("openLoginModal", () => {
  afterEach(cleanup);

  it("mounts only the native Douban login iframe inside an accessible ATV shell", () => {
    stubRaf();
    document.body.innerHTML = `
      <button id="trigger">trigger</button>
      <div class="dui-dialog-msk" style="height: 2000px;"></div>
      <div id="dui-dialog0" class="account_pop dui-dialog" style="position: fixed; top: 307px; left: 626px; width: 340px; height: 448px; visibility: visible;">
        <span class="dui-dialog-shd" style="width: 340px; height: 448px;"></span>
        <div class="dui-dialog-content">
          <a href="#" class="j_close_dialog dui-dialog-close">X</a>
          <div class="hd"><h3>用户登录</h3></div>
          <div class="bd"><iframe srcdoc="<p>login</p>"></iframe></div>
        </div>
      </div>
    `;
    document.querySelector<HTMLButtonElement>("#trigger")?.focus();

    openLoginModal({
      action: "给短评点有用",
      returnUrl: "https://movie.douban.com/subject/1292052/",
    });

    const modal = document.querySelector("#atv-login-modal") as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");
    expect(modal.getAttribute("aria-labelledby")).toBe("atv-login-modal-title");
    expect(modal.textContent).toContain("登录豆瓣后继续");
    expect(modal.textContent).toContain("登录后才能给短评点有用");
    expect(document.querySelector(".dui-dialog-msk")).toBeNull();

    const iframe = modal.querySelector<HTMLIFrameElement>(
      ".atv-login-modal-native > iframe"
    );
    expect(iframe).not.toBeNull();
    expect(iframe?.title).toBe("豆瓣登录");
    expect(iframe?.referrerPolicy).toBe("strict-origin-when-cross-origin");
    expect(iframe?.getAttribute("width")).toBeNull();
    expect(iframe?.getAttribute("height")).toBeNull();
    expect(iframe?.getAttribute("frameborder")).toBeNull();
    expect(iframe?.getAttribute("scrolling")).toBeNull();
    expect(
      modal.querySelector(".atv-login-modal-native")?.getAttribute("aria-busy")
    ).toBe("false");
    expect(modal.querySelector("#dui-dialog0")).toBeNull();
    expect(modal.querySelector(".dui-dialog-close")).toBeNull();
    expect(modal.querySelector(".dui-dialog-shd")).toBeNull();
    expect(modal.querySelector(".atv-login-modal-primary")).toBeNull();
    expect(modal.querySelector("a[href*='accounts/login']")).toBeNull();
  });

  it("asks the page to open the native login dialog when it is not already present", async () => {
    stubRaf();
    const trigger = document.createElement("a");
    trigger.className = "j a_show_login";
    trigger.href = "#login";
    trigger.textContent = "登录";
    trigger.addEventListener("click", () => {
      const mask = document.createElement("div");
      mask.className = "dui-dialog-msk";
      const dialog = document.createElement("div");
      dialog.className = "account_pop dui-dialog";
      dialog.style.position = "fixed";
      dialog.innerHTML = '<iframe srcdoc="<p>login</p>"></iframe>';
      document.body.append(mask, dialog);
    });
    document.body.append(trigger);

    openLoginModal({
      action: "标记想看",
      returnUrl: "https://movie.douban.com/subject/1291561/?from=test",
    });

    await vi.waitFor(() => {
      expect(
        document.querySelector(
          "#atv-login-modal .atv-login-modal-native > iframe"
        )
      ).not.toBeNull();
    });
    expect(document.querySelector("#atv-login-modal .account_pop")).toBeNull();
    expect(document.querySelector(".dui-dialog-msk")).toBeNull();
  });

  it("rejects non-Douban login iframes instead of mounting them", () => {
    stubRaf();
    document.body.innerHTML = `
      <div class="account_pop dui-dialog">
        <iframe src="data:text/html,login"></iframe>
      </div>
    `;

    openLoginModal({ action: "给影评投票" });

    expect(
      document.querySelector("#atv-login-modal .atv-login-modal-native iframe")
    ).toBeNull();
    expect(document.querySelector(".atv-login-modal-status")?.textContent).toBe(
      "无法载入豆瓣登录组件，请刷新页面后重试。"
    );
  });

  it("replaces an existing login modal instead of stacking prompts", () => {
    stubRaf();
    document.body.innerHTML = `
      <div class="account_pop dui-dialog">
        <iframe srcdoc="<p>login</p>"></iframe>
      </div>
    `;

    openLoginModal({ action: "给短评点有用" });
    const firstModal = document.querySelector("#atv-login-modal");

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="account_pop dui-dialog"><iframe srcdoc="<p>login</p>"></iframe></div>'
    );
    openLoginModal({ action: "标记想看" });

    expect(document.querySelectorAll("#atv-login-modal")).toHaveLength(1);
    expect(document.querySelector("#atv-login-modal")).not.toBe(firstModal);
  });

  it("shows a local failure message when the native dialog cannot be loaded", async () => {
    stubRaf();

    openLoginModal({ action: "给影评投票" });

    await vi.waitFor(
      () => {
        expect(
          document.querySelector(".atv-login-modal-status")?.textContent
        ).toBe("无法载入豆瓣登录组件，请刷新页面后重试。");
      },
      { timeout: 3000 }
    );
  });

  it("dismisses from the close button and restores focus", () => {
    stubRaf();
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = "vote";
    document.body.append(trigger);
    trigger.focus();

    openLoginModal({ action: "给影评投票" });
    const modal = document.querySelector("#atv-login-modal");
    const closeBtn = document.querySelector<HTMLButtonElement>(
      ".atv-login-modal-close"
    );

    closeBtn?.click();

    expect(modal?.classList.contains("is-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps tab focus inside the login prompt", () => {
    stubRaf();
    document.body.innerHTML = `
      <div class="account_pop dui-dialog">
        <iframe srcdoc="<p>login</p>"></iframe>
      </div>
    `;

    openLoginModal({ action: "给短评点有用" });
    const closeBtn = document.querySelector<HTMLButtonElement>(
      ".atv-login-modal-close"
    );
    const iframe = document.querySelector<HTMLIFrameElement>(
      ".atv-login-modal-native iframe"
    );

    iframe?.focus();
    iframe?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Tab" })
    );
    expect(document.activeElement).toBe(closeBtn);

    closeBtn?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Tab",
        shiftKey: true,
      })
    );
    expect(document.activeElement).toBe(iframe);
  });
});
