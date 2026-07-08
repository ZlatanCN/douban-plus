/* ── Test Helpers — Self-Tests ────────────────────────────── */
/* Verifies that buildDoc, createTestDoc, mockLocation,        */
/* mockCookie, installMockGM, and cleanupMockGM work properly. */

import { readFileSync } from "node:fs";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  buildDoc,
  createTestDoc,
  mockLocation,
  mockCookie,
  installMockGM,
  cleanupMockGM,
} from "./index";

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="content">
    <h1>Hello, World!</h1>
  </div>
</body>
</html>`;

describe(buildDoc, () => {
  it("parses an HTML string into a Document", () => {
    const doc = buildDoc(MINIMAL_HTML);
    expect(doc).toBeDefined();
    expect(doc.querySelector).toBeDefined();
    expect(doc.defaultView).not.toBeNull();
  });

  it("creates a document with accessible DOM", () => {
    const doc = buildDoc(MINIMAL_HTML);
    expect(doc.querySelector("h1")?.textContent).toBe("Hello, World!");
  });

  it("creates a document with a working defaultView", () => {
    const doc = buildDoc(MINIMAL_HTML);
    expect(doc.defaultView).not.toBeNull();
  });
});

describe(createTestDoc, () => {
  it("returns a document and cleanup function", () => {
    const { cleanup, doc } = createTestDoc(MINIMAL_HTML);
    expect(doc).toBeDefined();
    expect(doc.querySelector).toBeDefined();
    expect(cleanup).toBeTypeOf("function");
    cleanup();
  });

  it("sets pathname on the document's location", () => {
    const { cleanup, doc } = createTestDoc(MINIMAL_HTML, "/subject/1292052/");
    expect(doc.defaultView?.location.pathname).toBe("/subject/1292052/");
    cleanup();
  });

  it("defaults pathname to /subject/1292052/", () => {
    const { cleanup, doc } = createTestDoc(MINIMAL_HTML);
    expect(doc.defaultView?.location.pathname).toBe("/subject/1292052/");
    cleanup();
  });

  it("cleanup does not throw", () => {
    const { cleanup } = createTestDoc(MINIMAL_HTML, "/test/");
    expect(() => cleanup()).not.toThrow();
  });
});

describe(mockLocation, () => {
  it("changes pathname on a built document", () => {
    const doc = buildDoc(MINIMAL_HTML);
    const restore = mockLocation(doc, "/custom/path/");
    expect(doc.defaultView?.location.pathname).toBe("/custom/path/");
    restore();
  });
});

describe(mockCookie, () => {
  it("sets cookie on a document", () => {
    const doc = buildDoc(MINIMAL_HTML);
    const restore = mockCookie(doc, "ck=test123;");
    expect(doc.cookie).toBe("ck=test123;");
    restore();
  });

  it("returns a cleanup function", () => {
    const doc = buildDoc(MINIMAL_HTML);
    const restore = mockCookie(doc, "ck=test;");
    expect(restore).toBeTypeOf("function");
    restore();
  });
});

describe("installMockGM / cleanupMockGM", () => {
  beforeEach(() => {
    cleanupMockGM();
  });

  afterEach(() => {
    cleanupMockGM();
  });

  it("installs GM_xmlhttpRequest on globalThis", () => {
    installMockGM();
    expect(globalThis.GM_xmlhttpRequest).toBeTypeOf("function");
  });

  it("installMockGM returns a vi.fn() mock", () => {
    const mock = installMockGM();
    expect(vi.isMockFunction(mock)).toBeTruthy();
  });

  it("cleanupMockGM removes GM_xmlhttpRequest", () => {
    installMockGM();
    cleanupMockGM();
    expect(globalThis.GM_xmlhttpRequest).toBeUndefined();
  });
});

describe("fixtures are readable", () => {
  const fixtureFiles = [
    "movie-minimal.html",
    "movie-full.html",
    "tv-full.html",
    "no-poster.html",
    "logged-in.html",
    "logged-out.html",
  ];

  it.each(fixtureFiles)("reads %s", (file) => {
    const content = readFileSync(
      `${import.meta.dirname}/../fixtures/${file}`,
      "utf-8"
    );
    expect(content.length).toBeGreaterThan(100);
    expect(content.toLowerCase()).toContain("doctype");
  });
});
