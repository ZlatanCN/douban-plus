import { describe, expect, it, vi } from "vitest";

import { hasMatchingPage, mountMatchingPage } from "@/runtime/page-mount";
import type { PageMount } from "@/runtime/page-mount";

const locationFor = (
  pathname: string
): Pick<Location, "hostname" | "pathname"> => ({
  hostname: "movie.douban.com",
  pathname,
});

describe(mountMatchingPage, () => {
  it("mounts the first page definition that accepts the current location", () => {
    const { document } = globalThis;
    const skippedMount = vi.fn<(doc: Document) => void>();
    const subjectMount = vi.fn<(doc: Document) => void>();
    const pages: PageMount[] = [
      { matches: () => false, mount: skippedMount },
      {
        matches: (location) => location.pathname === "/subject/1292052/",
        mount: subjectMount,
      },
    ];

    const mounted = mountMatchingPage(
      pages,
      document,
      locationFor("/subject/1292052/")
    );

    expect(mounted).toBeTruthy();
    expect(skippedMount).not.toHaveBeenCalled();
    expect(subjectMount).toHaveBeenCalledExactlyOnceWith(document);
  });

  it("leaves the document alone when no page definition accepts the location", () => {
    const mount = vi.fn<(doc: Document) => void>();

    const mounted = mountMatchingPage(
      [{ matches: () => false, mount }],
      globalThis.document,
      locationFor("/personage/27224733/")
    );

    expect(mounted).toBeFalsy();
    expect(mount).not.toHaveBeenCalled();
  });
});

describe(hasMatchingPage, () => {
  it("rejects a subject secondary page before shared styles can affect it", () => {
    const pages: PageMount[] = [
      {
        matches: (location) =>
          location.hostname === "movie.douban.com" &&
          /^\/subject\/[^/]+\/?$/u.test(location.pathname),
        mount: vi.fn<(doc: Document) => void>(),
      },
    ];

    expect(
      hasMatchingPage(pages, locationFor("/subject/1291841/celebrities"))
    ).toBeFalsy();
    expect(
      hasMatchingPage(
        pages,
        locationFor("/subject/1291841/discussion/617999326/")
      )
    ).toBeFalsy();
  });
});
