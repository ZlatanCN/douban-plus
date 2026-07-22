import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: mockGmGet,
}));

const { fetchFirstBroadcastPlatform } =
  await import("@/modules/subject/api/first-broadcast-platform");

const editForm = (platform: string): string => `
  <div class="item basic">
    <label for="p_142">电视台</label>
    <input id="p_142" name="p_142" value="${platform}" readonly />
  </div>
`;

describe(fetchFirstBroadcastPlatform, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads the broadcast platform from the subject edit page", async () => {
    mockGmGet.mockResolvedValue(editForm("Apple TV+"));

    await expect(
      fetchFirstBroadcastPlatform(
        "36858672",
        "https://movie.douban.com/subject/36858672/"
      )
    ).resolves.toBe("Apple TV+");

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/36858672/edit",
      "https://movie.douban.com/subject/36858672/"
    );
  });

  it("degrades to null when the edit page cannot be read", async () => {
    mockGmGet.mockRejectedValue(new Error("network failure"));

    await expect(fetchFirstBroadcastPlatform("36858672")).resolves.toBeNull();
  });

  it("does not request an edit page without a subject id", async () => {
    await expect(fetchFirstBroadcastPlatform("")).resolves.toBeNull();

    expect(mockGmGet).not.toHaveBeenCalled();
  });
});
