import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Trailer } from "@/modules/subject/domain";
import * as trailerAcquisition from "@/modules/subject/runtime/use-trailer-acquisition";

const trailer: Trailer = {
  thumbUrl: "",
  title: "预告片",
  trailerPageUrl: "https://movie.douban.com/trailer/123/",
};
const anotherTrailer: Trailer = {
  ...trailer,
  trailerPageUrl: "https://movie.douban.com/trailer/456/",
};
const embedUrl = "https://video.example.com/embed.mp4";

const TrailerAcquisitionProbe = ({
  value = trailer,
}: {
  value?: Trailer | null;
}) => {
  const state = trailerAcquisition.useTrailerAcquisition(value);
  return (
    <output
      data-embed-url={state.status === "loaded" ? state.embedUrl : ""}
      data-status={state.status}
    />
  );
};

const roots: Element[] = [];

const renderProbe = (value: Trailer | null = trailer) => {
  const root = document.createElement("div");
  roots.push(root);
  render(<TrailerAcquisitionProbe value={value} />, root);
  return root;
};

describe("Trailer acquisition", () => {
  afterEach(() => {
    for (const root of roots) {
      render(null, root);
    }
    roots.length = 0;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes only the trailer-acquisition interface", () => {
    expect(Object.keys(trailerAcquisition)).toStrictEqual([
      "useTrailerAcquisition",
    ]);
  });

  it("loads an embed URL from trailer LD+JSON", async () => {
    const fetch = vi.fn<() => Promise<Response>>(() =>
      Promise.resolve(
        new Response(
          `<script data-source="douban" type="application/ld+json">{"@graph":[{"video":{"embedUrl":"${embedUrl}"}}]}</script>`,
          { status: 200 }
        )
      )
    );
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe();

    expect(root.querySelector("output")?.dataset.status).toBe("loading");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    expect(root.querySelector("output")?.dataset.embedUrl).toBe(embedUrl);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("reports failure then opens the native trailer page and closes", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.reject(new Error("trailer request failed"))
      )
    );
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const root = renderProbe();

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("failed")
    );
    vi.advanceTimersByTime(1500);

    expect(open).toHaveBeenCalledExactlyOnceWith(
      trailer.trailerPageUrl,
      "_blank",
      "noopener"
    );
    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("fallback")
    );
  });

  it("starts a fresh acquisition when the same trailer is reopened", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.reject(new Error("trailer request failed"))
      )
    );
    const root = renderProbe();

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("failed")
    );
    render(null, root);
    render(<TrailerAcquisitionProbe />, root);

    expect(root.querySelector("output")?.dataset.status).toBe("loading");
  });

  it("aborts an in-flight acquisition when the caller unmounts", async () => {
    let signal: AbortSignal | undefined;
    const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      (_url, init) => {
        const { signal: requestSignal } = init ?? {};
        if (requestSignal instanceof AbortSignal) {
          signal = requestSignal;
        }
        // oxlint-disable-next-line promise/avoid-new -- the test keeps the request in flight until cleanup.
        return new Promise(() => {});
      }
    );
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe();

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    render(null, root);

    expect(signal?.aborted).toBeTruthy();
  });

  it("does not render a previous trailer while a replacement is loading", async () => {
    const fetch = vi
      .fn<(url: string) => Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          '<script type="application/ld+json">{"embedUrl":"https://video.example.com/first.mp4"}</script>'
        )
      )
      .mockResolvedValueOnce(
        new Response(
          '<script type="application/ld+json">{"embedUrl":"https://video.example.com/second.mp4"}</script>'
        )
      );
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe();

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );
    render(<TrailerAcquisitionProbe value={anotherTrailer} />, root);

    expect(root.querySelector("output")?.dataset.status).toBe("loading");
    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );
  });
});
