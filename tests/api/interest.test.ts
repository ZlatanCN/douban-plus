/* ── interest — postInterest / removeInterest Tests ──────── */
/* Tests for the API interest module. Mocks gmPost and getCk  */
/* from src/utils/request so no real HTTP calls are made.     */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { postInterest, removeInterest } from "@/api/interest";

const mockGmPost = vi.hoisted(() =>
  vi.fn<(url: string, body: string, referer?: string) => Promise<string>>()
);
const mockGetCk = vi.hoisted(() => vi.fn<() => string>());

vi.mock(import("../../src/utils/request"), () => ({
  getCk: mockGetCk,
  gmPost: mockGmPost,
}));

// ----------------------------------------------------------------
// postInterest
// ----------------------------------------------------------------
describe(postInterest, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns ok=true when gmPost resolves with r=0 (wish)", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    const result = await postInterest("1292052", "wish");

    expect(result).toStrictEqual({ ok: true });
    expect(mockGmPost).toHaveBeenCalledWith(
      "https://movie.douban.com/j/subject/1292052/interest",
      expect.any(String),
      "https://movie.douban.com/subject/1292052/"
    );
  });

  it("returns ok=false with 未登录 and skips gmPost when getCk returns empty", async () => {
    mockGetCk.mockReturnValue("");

    const result = await postInterest("1292052", "wish");

    expect(result).toStrictEqual({ error: "未登录", ok: false });
    expect(mockGmPost).not.toHaveBeenCalled();
  });

  it("returns ok=false with server error message when r=1", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":1,"msg":"失败"}');

    const result = await postInterest("1292052", "wish");

    expect(result).toStrictEqual({ error: "失败", ok: false });
  });

  it("returns ok=false with default error message when r=1 and no msg", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":1}');

    const result = await postInterest("1292052", "wish");

    expect(result).toStrictEqual({ error: "操作失败", ok: false });
  });

  it("includes rating in POST data when rating option is provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("123", "collect", { rating: 4 });

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("rating")).toBe("4");
  });

  it("includes comment in POST data when comment option is provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("123", "wish", { comment: "好看" });

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("comment")).toBe("好看");
  });

  it("includes tags in POST data when tags option is provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("123", "do", { tags: ["a", "b"] });

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("tags")).toBe("a,b");
  });

  it("includes rating, comment, and tags all in POST data when all options provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("123", "collect", {
      comment: "great",
      rating: 5,
      tags: ["x", "y"],
    });

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("rating")).toBe("5");
    expect(params.get("comment")).toBe("great");
    expect(params.get("tags")).toBe("x,y");
  });

  it("returns ok=false with error message, logs warning when gmPost rejects", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockRejectedValue(new Error("Network failure"));

    const result = await postInterest("1292052", "wish");

    expect(result).toStrictEqual({
      error: "Error: Network failure",
      ok: false,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "[ATV-Douban] postInterest error:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it("sends empty rating, comment, tags when no options given", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("123", "wish");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("rating")).toBe("");
    expect(params.get("comment")).toBe("");
    expect(params.get("tags")).toBe("");
  });

  it("sends correct interest value for type do", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("1292052", "do");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("interest")).toBe("do");
  });

  it("sends correct interest value for type collect", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("1292052", "collect");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("interest")).toBe("collect");
  });

  it("sends ck in POST data", async () => {
    mockGetCk.mockReturnValue("mycustomck");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("1292052", "wish");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("ck")).toBe("mycustomck");
  });

  it("sends foldcollect=F and private=empty in POST data", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"r":0}');

    await postInterest("1292052", "wish");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("foldcollect")).toBe("F");
    expect(params.get("private")).toBe("");
  });
});

// ----------------------------------------------------------------
// removeInterest
// ----------------------------------------------------------------
describe(removeInterest, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns ok=true immediately when currentStatus is none (gmPost not called)", async () => {
    const result = await removeInterest("1292052", "none");

    expect(result).toStrictEqual({ ok: true });
    expect(mockGmPost).not.toHaveBeenCalled();
  });

  it("returns ok=true when gmPost resolves", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue("OK");

    const result = await removeInterest("1292052", "wish");

    expect(result).toStrictEqual({ ok: true });
  });

  it("returns ok=false with 未登录 and skips gmPost when getCk returns empty", async () => {
    mockGetCk.mockReturnValue("");

    const result = await removeInterest("1292052", "wish");

    expect(result).toStrictEqual({ error: "未登录", ok: false });
    expect(mockGmPost).not.toHaveBeenCalled();
  });

  it("returns ok=false with error, logs warning when gmPost rejects", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockRejectedValue(new Error("Remove failed"));

    const result = await removeInterest("1292052", "wish");

    expect(result).toStrictEqual({ error: "Error: Remove failed", ok: false });
    expect(warnSpy).toHaveBeenCalledWith(
      "[ATV-Douban] removeInterest error:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it("calls gmPost with correct remove URL", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue("OK");

    await removeInterest("1292052", "wish");

    expect(mockGmPost).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/1292052/remove",
      expect.any(String),
      "https://movie.douban.com/subject/1292052/"
    );
  });

  it("sends ck in POST data for remove", async () => {
    mockGetCk.mockReturnValue("myck");
    mockGmPost.mockResolvedValue("OK");

    await removeInterest("1292052", "wish");

    const params = new URLSearchParams(mockGmPost.mock.calls[0]?.[1] ?? "");
    expect(params.get("ck")).toBe("myck");
  });

  it("removes collect interest correctly", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue("OK");

    const result = await removeInterest("1292052", "collect");

    expect(result).toStrictEqual({ ok: true });
    expect(mockGmPost).toHaveBeenCalledOnce();
  });
});
