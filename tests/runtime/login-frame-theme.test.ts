import { describe, expect, it } from "vitest";

import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "@/modules/subject/runtime/login-frame-theme";

describe("login frame theme", () => {
  it("recognizes only Douban passport login pages", () => {
    expect(
      isDoubanLoginFrame(
        new URL("https://accounts.douban.com/passport/login_popup")
      )
    ).toBeTruthy();
    expect(
      isDoubanLoginFrame(new URL("https://accounts.douban.com/passport/login"))
    ).toBeTruthy();
    expect(
      isDoubanLoginFrame(
        new URL("https://accounts.douban.com/passport/register")
      )
    ).toBeFalsy();
    expect(
      isDoubanLoginFrame(new URL("https://movie.douban.com/subject/1292052/"))
    ).toBeFalsy();
  });

  it("installs one scoped ATV login style tag", () => {
    installLoginFrameTheme();
    installLoginFrameTheme();

    const styles = document.querySelectorAll("#atv-login-frame-theme");
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain(".account-tab-scan");
    expect(styles[0]?.textContent).toContain(".global-phone-input-input");
    expect(styles[0]?.textContent).toContain(".account-quick");
    expect(styles[0]?.textContent).toContain("--atv-login-accent");
  });

  it("installed style tag excludes JS-like patterns", () => {
    installLoginFrameTheme();

    const styles = document.querySelectorAll("#atv-login-frame-theme");
    expect(styles[0]?.textContent).not.toContain("password.value");
    expect(styles[0]?.textContent).not.toContain("addEventListener");
    expect(styles[0]?.textContent).not.toContain("body > #wrapper");
  });
});
