/* ── comment — postVote Tests ──────────────────────────────── */
/* Tests the postVote function for comment voting.              */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { postVote } from "../../src/api/comment";

const mockGmPost = vi.hoisted(() => vi.fn());
const mockGetCk = vi.hoisted(() => vi.fn());

vi.mock("../../src/utils/request", () => ({
  getCk: mockGetCk,
  gmPost: mockGmPost,
}));

describe("postVote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns { ok: true, count } when gmPost succeeds with r=0", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"count":5,"r":0}');

    const result = await postVote("123");

    expect(result).toEqual({ count: 5, ok: true });
    expect(mockGmPost).toHaveBeenCalledWith(
      "https://movie.douban.com/j/comment/vote",
      "id=123&ck=ck123",
      undefined
    );
  });

  it("returns { ok: false } and skips gmPost when getCk returns empty string", async () => {
    mockGetCk.mockReturnValue("");

    const result = await postVote("123");

    expect(result).toEqual({ ok: false });
    expect(mockGmPost).not.toHaveBeenCalled();
  });

  it("returns { ok: false } when server responds with r=1", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"count":0,"r":1}');

    const result = await postVote("123");

    expect(result).toEqual({ ok: false });
  });

  it("returns { ok: false } and logs warning when gmPost rejects", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockRejectedValue(new Error("Network error"));

    const result = await postVote("123");

    expect(result).toEqual({ ok: false });
    warnSpy.mockRestore();
  });

  it("passes subject referer to gmPost when subjectId is provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"count":1,"r":0}');

    await postVote("123", "456");

    expect(mockGmPost).toHaveBeenCalledWith(
      "https://movie.douban.com/j/comment/vote",
      "id=123&ck=ck123",
      "https://movie.douban.com/subject/456/"
    );
  });

  it("omits referer from gmPost when subjectId is not provided", async () => {
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue('{"count":1,"r":0}');

    await postVote("123");

    const [callArgs] = mockGmPost.mock.calls;
    expect(callArgs).toBeDefined();
    expect(callArgs?.[2]).toBeUndefined();
  });

  it("sends id and ck as form-encoded POST data", async () => {
    mockGetCk.mockReturnValue("myck123");
    mockGmPost.mockResolvedValue('{"count":1,"r":0}');

    await postVote("456");

    expect(mockGmPost).toHaveBeenCalledWith(
      expect.any(String),
      "id=456&ck=myck123",
      undefined
    );
  });

  it("calls console.warn with error message when gmPost throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const testError = new Error("fail");
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockRejectedValue(testError);

    await postVote("123");

    expect(warnSpy).toHaveBeenCalledWith(
      "[ATV-Douban] postVote error:",
      testError
    );
    warnSpy.mockRestore();
  });

  it("returns { ok: false } when gmPost returns invalid JSON", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetCk.mockReturnValue("ck123");
    mockGmPost.mockResolvedValue("not-json");

    const result = await postVote("123");

    expect(result).toEqual({ ok: false });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
