/* ── dom-factory — el() Tests ───────────────────────────── */
/* Tests the DOM element factory.                           */

import { describe, it, expect } from "vitest";

import { el } from "@/components/dom-factory";

/* ── el() — Tag creation ─────────────────────────────────── */

describe("el(tag)", () => {
  it("creates a div element", () => {
    const node = el("div");
    expect(node instanceof HTMLDivElement).toBeTruthy();
    expect(node.tagName).toBe("DIV");
  });

  it("creates a button element", () => {
    const node = el("button");
    expect(node instanceof HTMLButtonElement).toBeTruthy();
    expect(node.tagName).toBe("BUTTON");
  });

  it("creates an anchor element", () => {
    const node = el("a");
    expect(node instanceof HTMLAnchorElement).toBeTruthy();
    expect(node.tagName).toBe("A");
  });

  it("creates an img element", () => {
    const node = el("img");
    expect(node instanceof HTMLImageElement).toBeTruthy();
    expect(node.tagName).toBe("IMG");
  });

  it("creates an h1 element", () => {
    const node = el("h1");
    expect(node instanceof HTMLHeadingElement).toBeTruthy();
    expect(node.tagName).toBe("H1");
  });

  it("creates a span element", () => {
    const node = el("span");
    expect(node instanceof HTMLSpanElement).toBeTruthy();
    expect(node.tagName).toBe("SPAN");
  });

  it("creates a p element", () => {
    const node = el("p");
    expect(node instanceof HTMLParagraphElement).toBeTruthy();
    expect(node.tagName).toBe("P");
  });

  it("creates a section element", () => {
    const node = el("section");
    expect(node instanceof HTMLElement).toBeTruthy();
    expect(node.tagName).toBe("SECTION");
  });

  it("creates a nav element", () => {
    const node = el("nav");
    expect(node instanceof HTMLElement).toBeTruthy();
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
    expect(called).toBeTruthy();
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
