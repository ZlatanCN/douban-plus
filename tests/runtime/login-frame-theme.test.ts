import { describe, expect, it } from "vitest";

import {
  installLoginFrameTheme,
  isDoubanLoginFrame,
} from "../../src/runtime/login-frame-theme";

describe("login frame theme", () => {
  it("recognizes only Douban passport login pages", () => {
    expect(
      isDoubanLoginFrame(
        new URL("https://accounts.douban.com/passport/login_popup")
      )
    ).toBe(true);
    expect(
      isDoubanLoginFrame(new URL("https://accounts.douban.com/passport/login"))
    ).toBe(true);
    expect(
      isDoubanLoginFrame(
        new URL("https://accounts.douban.com/passport/register")
      )
    ).toBe(false);
    expect(
      isDoubanLoginFrame(new URL("https://movie.douban.com/subject/1292052/"))
    ).toBe(false);
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
    expect(styles[0]?.textContent).not.toContain("password.value");
    expect(styles[0]?.textContent).not.toContain("addEventListener");
    expect(styles[0]?.textContent).not.toContain("body > #wrapper");
  });
});
