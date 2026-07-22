import { afterEach, describe, expect, it, vi } from "vitest";

import type { Trailer } from "@/modules/subject/domain";
import { TrailerModal } from "@/modules/subject/media";

import { renderIntoRoot } from "../../helpers/render";

const trailer: Trailer = {
  thumbUrl: "",
  title: "预告片",
  trailerPageUrl: "https://movie.douban.com/trailer/123/",
};

describe(TrailerModal, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("acquires selected trailer content before rendering the video modal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.resolve(
          new Response(
            '<script type="application/ld+json">{"embedUrl":"https://video.example.com/embed.mp4"}</script>'
          )
        )
      )
    );
    const root = renderIntoRoot(
      <TrailerModal onClose={() => {}} trailer={trailer} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector("video")?.getAttribute("src")).toBe(
        "https://video.example.com/embed.mp4"
      )
    );
  });
});
