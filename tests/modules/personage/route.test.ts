import { describe, expect, it } from "vitest";

import { isPersonageHomepage } from "@/modules/personage/runtime/mount";

describe(isPersonageHomepage, () => {
  it("accepts only canonical numeric personage homepages", () => {
    expect(
      isPersonageHomepage({
        hostname: "www.douban.com",
        pathname: "/personage/27224733/",
      })
    ).toBeTruthy();
    expect(
      isPersonageHomepage({
        hostname: "www.douban.com",
        pathname: "/personage/27224733/photos",
      })
    ).toBeFalsy();
    expect(
      isPersonageHomepage({
        hostname: "movie.douban.com",
        pathname: "/personage/27224733/",
      })
    ).toBeFalsy();
  });
});
