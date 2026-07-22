import { afterEach, describe, expect, it, vi } from "vitest";

import type { Trailer } from "@/modules/subject/domain";
import { VideoModal } from "@/modules/subject/media/video-modal";

import { renderIntoRoot } from "../helpers/render";

const trailer: Trailer = {
  thumbUrl: "",
  title: "预告片",
  trailerPageUrl: "https://movie.douban.com/trailer/123/",
};

describe(VideoModal, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the acquisition result without starting host work", () => {
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderIntoRoot(
      <VideoModal
        acquisition={{
          embedUrl: "https://video.example.com/embed.mp4",
          status: "loaded",
        }}
        onClose={() => {}}
        trailer={trailer}
      />
    );

    expect(root.querySelector("video")?.getAttribute("src")).toBe(
      "https://video.example.com/embed.mp4"
    );
    expect(root.querySelector(".atv-modal-loading")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders a failed acquisition as feedback instead of a visual fallback", () => {
    const root = renderIntoRoot(
      <VideoModal
        acquisition={{ status: "failed" }}
        onClose={() => {}}
        trailer={trailer}
      />
    );

    expect(root.querySelector(".atv-modal-toast")?.textContent).toBe(
      "视频加载失败"
    );
  });
});
