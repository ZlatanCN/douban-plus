/* ── request — getCk / gmPost / gmGet Tests ────────────────── */
/* getCk reads document.cookie directly.                          */
/* gmPost / gmGet wrap GM_xmlhttpRequest in Promise — the $       */
/* virtual module is resolved via vitest resolve.alias to a       */
/* mock that reads from globalThis.GM_xmlhttpRequest.             */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { getCk, gmGet, gmPost } from "@/utils/request";

import { mockCookie } from "../helpers/doc";

// ----------------------------------------------------------------
// Types matching the ambient declare in request.ts for mock
// ----------------------------------------------------------------
type GmXhrOpts = {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  data?: string;
  onerror: () => void;
  onload: (r: { responseText: string }) => void;
};

// ----------------------------------------------------------------
// Install mock GM_xmlhttpRequest on globalThis BEFORE imports.
// The $ module (aliased to tests/mocks/$) reads from globalThis
// during module evaluation, so this MUST run first.
// ----------------------------------------------------------------
const mockGmXhr = vi.hoisted(() => {
  const fn = vi.fn<(opts: GmXhrOpts) => void>();
  const global = globalThis as { GM_xmlhttpRequest?: typeof fn };
  global.GM_xmlhttpRequest = fn;
  return fn;
});

// ----------------------------------------------------------------
// getCk — reads document.cookie directly, no GM dependency
// ----------------------------------------------------------------
describe(getCk, () => {
  it("reads ck value from document.cookie", () => {
    const restore = mockCookie(document, "ck=abc123;");
    expect(getCk()).toBe("abc123");
    restore();
  });

  it("returns empty string when no ck key present", () => {
    const restore = mockCookie(document, "session=xyz;");
    expect(getCk()).toBe("");
    restore();
  });

  it("returns correct value with multiple cookies present", () => {
    const restore = mockCookie(document, "session=xyz; ck=myck; theme=dark");
    expect(getCk()).toBe("myck");
    restore();
  });

  it("returns empty string when cookie is empty string", () => {
    const restore = mockCookie(document, "");
    expect(getCk()).toBe("");
    restore();
  });

  it("does not match ck when it is part of another cookie name", () => {
    const restore = mockCookie(document, "xck=val");
    expect(getCk()).toBe("");
    restore();
  });

  it("returns empty string when ck value is empty", () => {
    const restore = mockCookie(document, "ck=");
    expect(getCk()).toBe("");
    restore();
  });
});

// ----------------------------------------------------------------
// gmPost — wraps GM_xmlhttpRequest in Promise (method: POST)
// ----------------------------------------------------------------
describe(gmPost, () => {
  beforeEach(() => {
    mockGmXhr.mockReset();
    mockGmXhr.mockImplementation((opts) => {
      opts.onload({ responseText: "" });
    });
  });

  it("calls GM_xmlhttpRequest with method POST and url", async () => {
    await gmPost("https://example.com/api", "data=test");
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://example.com/api",
      })
    );
  });

  it("sends data in the request", async () => {
    await gmPost("https://example.com/api", "key=value&foo=bar");
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({ data: "key=value&foo=bar" })
    );
  });

  it("sets Content-Type header to application/x-www-form-urlencoded", async () => {
    await gmPost("https://example.com/api", "d=1");
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      })
    );
  });

  it("includes Referer header when referer argument is provided", async () => {
    await gmPost(
      "https://example.com/api",
      "d=1",
      "https://movie.douban.com/subject/1292052/"
    );
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: "https://movie.douban.com/subject/1292052/",
        }),
      })
    );
  });

  it("does not set Referer header when referer argument is omitted", async () => {
    await gmPost("https://example.com/api", "d=1");
    const callArgs = mockGmXhr.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.headers?.Referer).toBeUndefined();
  });

  it("resolves with responseText when onload is called", async () => {
    mockGmXhr.mockImplementation((opts) => {
      opts.onload({ responseText: '{"ok":true}' });
    });
    await expect(gmPost("https://example.com", "d=1")).resolves.toBe(
      '{"ok":true}'
    );
  });

  it("rejects with Error when onerror is called", async () => {
    mockGmXhr.mockImplementation((opts) => {
      opts.onerror();
    });
    await expect(gmPost("https://example.com", "d=1")).rejects.toThrow(
      "GM_xmlhttpRequest failed"
    );
  });
});

// ----------------------------------------------------------------
// gmGet — wraps GM_xmlhttpRequest in Promise (method: GET)
// ----------------------------------------------------------------
describe(gmGet, () => {
  beforeEach(() => {
    mockGmXhr.mockReset();
    mockGmXhr.mockImplementation((opts) => {
      opts.onload({ responseText: "" });
    });
  });

  it("calls GM_xmlhttpRequest with method GET and url", async () => {
    await gmGet("https://example.com/data");
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://example.com/data",
      })
    );
  });

  it("resolves with responseText when onload is called", async () => {
    mockGmXhr.mockImplementation((opts) => {
      opts.onload({ responseText: "response-body" });
    });
    await expect(gmGet("https://example.com")).resolves.toBe("response-body");
  });

  it("rejects with Error when onerror is called", async () => {
    mockGmXhr.mockImplementation((opts) => {
      opts.onerror();
    });
    await expect(gmGet("https://example.com")).rejects.toThrow(
      "GM_xmlhttpRequest failed"
    );
  });

  it("includes Referer header when referer argument is provided", async () => {
    await gmGet(
      "https://example.com",
      "https://movie.douban.com/subject/1292052/"
    );
    expect(mockGmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: "https://movie.douban.com/subject/1292052/",
        }),
      })
    );
  });

  it("does not set Referer header when referer argument is omitted", async () => {
    await gmGet("https://example.com");
    const callArgs = mockGmXhr.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.headers?.Referer).toBeUndefined();
  });

  it("sets Content-Type header to application/x-www-form-urlencoded", async () => {
    await gmGet("https://example.com");
    const callArgs = mockGmXhr.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.headers?.["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    );
  });
});
