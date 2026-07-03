/* ── dom-factory — el(), renderStars() Tests ──────────────── */
/* Tests the DOM element factory and star rating renderer.     */

import { describe, it, expect } from "vitest";

import { el, renderStars } from "../../src/components";

/* ── el() — Tag creation ─────────────────────────────────── */

describe("el(tag)", () => {
  it("creates a div element", () => {
    const node = el("div");
    expect(node instanceof HTMLDivElement).toBe(true);
    expect(node.tagName).toBe("DIV");
  });

  it("creates a button element", () => {
    const node = el("button");
    expect(node instanceof HTMLButtonElement).toBe(true);
    expect(node.tagName).toBe("BUTTON");
  });

  it("creates an anchor element", () => {
    const node = el("a");
    expect(node instanceof HTMLAnchorElement).toBe(true);
    expect(node.tagName).toBe("A");
  });

  it("creates an img element", () => {
    const node = el("img");
    expect(node instanceof HTMLImageElement).toBe(true);
    expect(node.tagName).toBe("IMG");
  });

  it("creates an h1 element", () => {
    const node = el("h1");
    expect(node instanceof HTMLHeadingElement).toBe(true);
    expect(node.tagName).toBe("H1");
  });

  it("creates a span element", () => {
    const node = el("span");
    expect(node instanceof HTMLSpanElement).toBe(true);
    expect(node.tagName).toBe("SPAN");
  });

  it("creates a p element", () => {
    const node = el("p");
    expect(node instanceof HTMLParagraphElement).toBe(true);
    expect(node.tagName).toBe("P");
  });

  it("creates a section element", () => {
    const node = el("section");
    expect(node instanceof HTMLElement).toBe(true);
    expect(node.tagName).toBe("SECTION");
  });

  it("creates a nav element", () => {
    const node = el("nav");
    expect(node instanceof HTMLElement).toBe(true);
    expect(node.tagName).toBe("NAV");
  });
});

/* ── el() — Attributes ───────────────────────────────────── */

describe("el(tag, attrs) — attributes", () => {
  it("sets className from a string", () => {
    const node = el("div", { className: "foo bar" });
    expect(node.className).toBe("foo bar");
  });

  it("sets className from an array", () => {
    const node = el("div", { className: ["a", "b", "c"] });
    expect(node.className).toBe("a b c");
  });

  it("sets className via class key from a string", () => {
    const node = el("div", { class: "x y" });
    expect(node.className).toBe("x y");
  });

  it("sets id", () => {
    const node = el("div", { id: "my-id" });
    expect(node.id).toBe("my-id");
  });

  it("sets textContent via the text attribute", () => {
    const node = el("span", { text: "Hello" });
    expect(node.textContent).toBe("Hello");
  });

  it("sets textContent via the textContent attribute", () => {
    const node = el("span", { textContent: "World" });
    expect(node.textContent).toBe("World");
  });

  it("uses the text attribute when both text and textContent are set", () => {
    /* text is processed after textContent in strAttrs, so it wins */
    const node = el("span", { text: "B", textContent: "A" });
    expect(node.textContent).toBe("B");
  });

  it("sets innerHTML via the html attribute", () => {
    const node = el("div", { html: "<strong>bold</strong>" });
    expect(node.innerHTML).toBe("<strong>bold</strong>");
  });

  it("html attribute takes precedence over text", () => {
    const node = el("div", { html: "<i>italic</i>", text: "plain" });
    expect(node.innerHTML).toBe("<i>italic</i>");
    expect(node.textContent).toBe("italic");
  });

  it("sets href on an anchor", () => {
    const node = el("a", { href: "https://example.com" });
    expect(node.getAttribute("href")).toBe("https://example.com");
  });

  it("sets src and alt on an img", () => {
    const node = el("img", { alt: "A photo", src: "/pic.jpg" });
    expect(node.getAttribute("src")).toBe("/pic.jpg");
    expect(node.getAttribute("alt")).toBe("A photo");
  });

  it("sets target and rel on an anchor", () => {
    const node = el("a", { rel: "noopener", target: "_blank" });
    expect(node.getAttribute("target")).toBe("_blank");
    expect(node.getAttribute("rel")).toBe("noopener");
  });

  it("sets the type attribute", () => {
    const node = el("button", { type: "submit" });
    expect(node.getAttribute("type")).toBe("submit");
  });

  it("sets inline style from an object", () => {
    const node = el("div", {
      style: { color: "red", "font-size": "14px" },
    });
    expect(node.style.color).toBe("red");
    expect(node.style.fontSize).toBe("14px");
  });

  it("sets arbitrary attributes via the attrs map", () => {
    const node = el("div", { attrs: { "data-id": "42", role: "button" } });
    expect(node.dataset.id).toBe("42");
    expect(node.getAttribute("role")).toBe("button");
  });

  it("attaches an onclick handler that fires on click", () => {
    let called = false;
    const handler = () => {
      called = true;
    };
    const node = el("button", { onclick: handler });
    node.click();
    expect(called).toBe(true);
  });

  it("attaches an onclick handler with the event argument", () => {
    let capturedType: string | null = null;
    const handler = (e: Event) => {
      capturedType = e.type;
    };
    const node = el("button", { onclick: handler });
    node.click();
    expect(capturedType).toBe("click");
  });
});

/* ── el() — Children ─────────────────────────────────────── */

describe("el(tag, attrs, children)", () => {
  it("appends an array of HTMLElement children", () => {
    const childA = el("span", { text: "A" });
    const childB = el("span", { text: "B" });
    const parent = el("div", undefined, [childA, childB]);
    expect(parent.childNodes).toHaveLength(2);
    expect(parent.children[0]?.textContent).toBe("A");
    expect(parent.children[1]?.textContent).toBe("B");
  });

  it("appends an array of string children as text nodes", () => {
    const parent = el("div", undefined, ["Hello", "World"]);
    expect(parent.childNodes).toHaveLength(2);
    expect(parent.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(parent.childNodes[0]?.textContent).toBe("Hello");
    expect(parent.childNodes[1]?.textContent).toBe("World");
  });

  it("appends mixed HTMLElement and string children", () => {
    const child = el("strong", { text: "bold" });
    const parent = el("p", undefined, ["text ", child, " more"]);
    expect(parent.childNodes).toHaveLength(3);
    expect(parent.childNodes[0]?.textContent).toBe("text ");
    expect(parent.childNodes[1]?.textContent).toBe("bold");
    expect(parent.childNodes[2]?.textContent).toBe(" more");
  });

  it("creates an element with no children when children is undefined", () => {
    const node = el("div");
    expect(node.childNodes).toHaveLength(0);
  });

  it("creates an element with no children when children is an empty array", () => {
    const node = el("div", undefined, []);
    expect(node.childNodes).toHaveLength(0);
  });
});

/* ── renderStars() ───────────────────────────────────────── */

/* happy-dom serialises void elements as <path></path> (not <path/)>,
   so identify star SVGs by distinguishing content markers. */
const starKind = (elChild: HTMLElement): "full" | "half" | "empty" => {
  const html = elChild.innerHTML;
  if (html.includes("fill-opacity")) {
    return "empty";
  }
  if (html.includes("atvHalfStar")) {
    return "half";
  }
  return "full";
};

describe("renderStars(score, opts?) — outOfFive=false (default)", () => {
  const countStars = (
    wrapper: HTMLElement
  ): { full: number; half: number; empty: number } => {
    let full = 0;
    let half = 0;
    let empty = 0;
    for (const child of wrapper.children) {
      const kind = starKind(child as HTMLElement);
      if (kind === "full") {
        full += 1;
      } else if (kind === "half") {
        half += 1;
      } else {
        empty += 1;
      }
    }
    return { empty, full, half };
  };

  it("score=8 renders 4 full, 0 half, 1 empty", () => {
    /* out = 4 → i=5: 4 < 4.25 → EMPTY */
    const stars = renderStars(8);
    expect(stars.children).toHaveLength(5);
    const counts = countStars(stars);
    expect(counts.full).toBe(4);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(1);
  });

  it("score=7.8 renders 4 full, 0 half, 1 empty", () => {
    /* out = 3.9 → i=5: 3.9 < 4.25 → EMPTY */
    const stars = renderStars(7.8);
    expect(stars.children).toHaveLength(5);
    const counts = countStars(stars);
    expect(counts.full).toBe(4);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(1);
  });

  it("score=9.5 renders 5 full stars (full-threshold boundary)", () => {
    /* out = 4.75 → i=5: 4.75 >= 4.75 → FULL (exact threshold for last star) */
    const stars = renderStars(9.5);
    const counts = countStars(stars);
    expect(counts.full).toBe(5);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(0);
  });

  it("score=10 renders 5 full stars (max)", () => {
    /* out = 5 → all five positions are FULL */
    const stars = renderStars(10);
    const counts = countStars(stars);
    expect(counts.full).toBe(5);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(0);
  });

  it("score=0 renders 5 empty stars", () => {
    /* out = 0 → i=1: 0 < 0.25 → EMPTY */
    const stars = renderStars(0);
    const counts = countStars(stars);
    expect(counts.full).toBe(0);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(5);
  });

  it("score=2.3 renders 1 full, 0 half, 4 empty", () => {
    /* out = 1.15 → i=1: 1.15 >= 0.75 → FULL; i=2: 1.15 < 1.25 → EMPTY */
    const stars = renderStars(2.3);
    const counts = countStars(stars);
    expect(counts.full).toBe(1);
    expect(counts.half).toBe(0);
    expect(counts.empty).toBe(4);
  });

  it("score=9 renders 4 full, 1 half, 0 empty (edge)", () => {
    /* out = 4.5 → i=5: 4.5 < 4.75, 4.5 >= 4.25 → HALF */
    const stars = renderStars(9);
    const counts = countStars(stars);
    expect(counts.full).toBe(4);
    expect(counts.half).toBe(1);
    expect(counts.empty).toBe(0);
  });

  it("boundary at full threshold: score=5.5 gives full at position 3", () => {
    /* out = 2.75 = 3 - 0.25 → position 3 is exactly at FULL threshold */
    const stars = renderStars(5.5);
    const spans = stars.querySelectorAll(":scope > span");
    expect(starKind(spans[2] as HTMLElement)).toBe("full");
  });

  it("boundary at half threshold: score=4.5 gives half at position 3", () => {
    /* out = 2.25 = 3 - 0.75 → position 3 is exactly at HALF threshold */
    const stars = renderStars(4.5);
    const spans = stars.querySelectorAll(":scope > span");
    expect(starKind(spans[2] as HTMLElement)).toBe("half");
  });
});

describe("renderStars(score, opts?) — outOfFive=true", () => {
  const assertStarKind = (
    stars: HTMLElement,
    index: number,
    kind: "full" | "half" | "empty"
  ): void => {
    expect(starKind(stars.children[index] as HTMLElement)).toBe(kind);
  };

  it("score=5 renders 5 full stars", () => {
    /* out = 5 → all 5 ≥ 4.25 → FULL */
    const stars = renderStars(5, { outOfFive: true });
    expect(stars.children).toHaveLength(5);
    for (let i = 0; i < 5; i += 1) {
      assertStarKind(stars, i, "full");
    }
  });

  it("score=3 renders 3 full, 2 empty (no half stars)", () => {
    /* out = 3 → i=1-3: FULL; i=4: 3 < 3.25 → EMPTY */
    const stars = renderStars(3, { outOfFive: true });
    for (let i = 0; i < 3; i += 1) {
      assertStarKind(stars, i, "full");
    }
    for (let i = 3; i < 5; i += 1) {
      assertStarKind(stars, i, "empty");
    }
  });

  it("score=0 renders 5 empty stars", () => {
    const stars = renderStars(0, { outOfFive: true });
    for (let i = 0; i < 5; i += 1) {
      assertStarKind(stars, i, "empty");
    }
  });
});

describe("renderStars(score, opts?) — options", () => {
  it("applies a custom className via opts.className", () => {
    const stars = renderStars(8, { className: "my-rating" });
    expect(stars.className).toBe("my-rating");
  });

  it("uses default className when opts.className is not set", () => {
    const stars = renderStars(8);
    expect(stars.className).toBe("atv-rating-stars");
  });

  it("returns an HTMLElement", () => {
    const stars = renderStars(5, { outOfFive: true });
    expect(stars instanceof HTMLElement).toBe(true);
    expect(stars.tagName).toBe("SPAN");
  });
});
