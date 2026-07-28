import { beforeEach, describe, expect, it, vi } from "vitest";

import { readSubjectData } from "@/modules/subject/runtime/read-subject-data";

const mockGetCk = vi.hoisted(() => vi.fn<() => string>());
const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("@/shared/utils/request"), () => ({
  getCk: mockGetCk,
  gmGet: mockGmGet,
}));

describe(readSubjectData, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns one authenticated snapshot with both parsed data and native content", async () => {
    mockGetCk.mockReturnValue("session-token");
    mockGmGet.mockResolvedValue(`
      <main id="content">
        <h1><span property="v:itemreviewed">认证后的作品</span></h1>
        <a href="/people/example/">作者</a>
        <div id="interest_sect_level"><span class="j a_stars">我看过这部电影</span></div>
      </main>
    `);

    const snapshot = await readSubjectData("1292052");

    expect(snapshot.data).toMatchObject({
      interest: { ck: "session-token", loggedIn: true, status: "collect" },
      subjectId: "1292052",
      title: { primary: "认证后的作品" },
    });
    expect(snapshot.nativeContent.querySelector("a")?.href).toBe(
      "https://movie.douban.com/people/example/"
    );
    expect(mockGmGet).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/1292052/",
      "https://movie.douban.com/subject/1292052/"
    );
  });

  it("rejects an incomplete response before it can replace the live page", async () => {
    mockGmGet.mockResolvedValue('<main id="content"></main>');

    await expect(readSubjectData("1292052")).rejects.toThrow(
      "无法同步作品页面"
    );
  });
});
