import { describe, expect, it } from "vitest";

import { PosterModal } from "@/shared/components/modal";

import { renderIntoRoot } from "../helpers/render";

describe(PosterModal, () => {
  it("keeps a thumbnail preview in place while the full image loads", async () => {
    const root = renderIntoRoot(
      <PosterModal
        alt="剧照"
        onClose={() => {}}
        previewSrc="https://img.example.com/thumb.jpg"
        src="https://img.example.com/full.jpg"
      />
    );

    const fullImage = root.querySelector<HTMLImageElement>(".atv-modal-img");

    expect(root.querySelector(".atv-image-modal-frame")?.classList).toContain(
      "is-loading"
    );
    expect(
      root.querySelector<HTMLImageElement>(".atv-modal-preview")?.src
    ).toBe("https://img.example.com/thumb.jpg");
    expect(root.querySelector(".atv-image-modal-loading")).not.toBeNull();

    fullImage?.dispatchEvent(new Event("load", { bubbles: true }));
    await Promise.resolve();

    expect(root.querySelector(".atv-image-modal-frame")?.classList).toContain(
      "is-loaded"
    );
    expect(root.querySelector(".atv-image-modal-loading")).toBeNull();
  });

  it("keeps the direct-image path free of a loading treatment", () => {
    const root = renderIntoRoot(
      <PosterModal
        alt="海报"
        onClose={() => {}}
        src="https://img.example.com/poster.jpg"
      />
    );

    expect(root.querySelector(".atv-modal-preview")).toBeNull();
    expect(root.querySelector(".atv-image-modal-loading")).toBeNull();
  });

  it("falls back to the thumbnail when the full image fails", async () => {
    const root = renderIntoRoot(
      <PosterModal
        alt="剧照"
        onClose={() => {}}
        previewSrc="https://img.example.com/thumb.jpg"
        src="https://img.example.com/full.jpg"
      />
    );
    const fullImage = root.querySelector<HTMLImageElement>(".atv-modal-img");

    fullImage?.dispatchEvent(new Event("error", { bubbles: true }));
    await Promise.resolve();

    expect(root.querySelector(".atv-image-modal-frame")?.classList).toContain(
      "is-preview"
    );
    expect(root.querySelector(".atv-image-modal-loading")).toBeNull();
    expect(root.querySelector(".atv-image-modal-error")).toBeNull();
    expect(root.querySelector(".atv-modal-preview")).not.toBeNull();
  });
});
