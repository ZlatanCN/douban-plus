import { afterEach, describe, expect, it, vi } from "vitest";

import { StickyNav } from "@/shared/components/layout/sticky-nav";

import { renderIntoRoot } from "../../helpers/render";
import { makeProps, noop } from "./sticky-nav-test-support";

describe(StickyNav, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the title from data.title.primary", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("removes hidden navigation from the keyboard focus order", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);

    expect(root.querySelector("nav")?.hasAttribute("inert")).toBeTruthy();
  });

  it("falls back to data.title.full when primary is empty", () => {
    const root = renderIntoRoot(
      <StickyNav
        {...makeProps({
          title: { full: "Fallback Title", primary: "" },
        })}
        onJump={noop}
      />
    );
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "Fallback Title"
    );
  });

  it("renders each section link with href and label", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links).toHaveLength(3);
    expect(links[0].textContent).toBe("演职员");
    expect(links[0].getAttribute("href")).toBe("#atv-cast");
    expect(links[1].textContent).toBe("剧照");
    expect(links[1].getAttribute("href")).toBe("#atv-photos");
  });

  it("renders third section link with label and href", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links[2].textContent).toBe("短评");
    expect(links[2].getAttribute("href")).toBe("#atv-comments");
  });

  it("renders no section links when sections array is empty", () => {
    const root = renderIntoRoot(
      <StickyNav {...makeProps({ sections: [] })} onJump={noop} />
    );
    expect(root.querySelectorAll(".atv-stickynav-jumps a")).toHaveLength(0);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("prevents default and forwards jump link clicks", () => {
    const onJump = vi.fn<(sectionId: string) => void>();
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={onJump} />);
    const link = root.querySelector<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    link?.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTruthy();
    expect(onJump).toHaveBeenCalledWith("atv-cast");
  });

  it.each([
    { name: "middle-button", button: 1 },
    { name: "Alt-modified", altKey: true },
    { name: "Control-modified", ctrlKey: true },
    { name: "Command-modified", metaKey: true },
    { name: "Shift-modified", shiftKey: true },
  ])("leaves $name jump clicks to the browser", ({ name, ...options }) => {
    const onJump = vi.fn<(sectionId: string) => void>();
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={onJump} />);
    const link = root.querySelector<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    link?.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalsy();
    expect(onJump).not.toHaveBeenCalled();
  });
});
