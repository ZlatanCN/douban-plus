import { ICON_STAR_EMPTY, ICON_STAR_FULL, ICON_STAR_HALF } from "../constants";

type ElementAttrs = {
  className?: string | string[];
  class?: string | string[];
  id?: string;
  textContent?: string;
  text?: string;
  html?: string;
  href?: string;
  src?: string;
  alt?: string;
  target?: string;
  rel?: string;
  type?: string;
  style?: Record<string, string>;
  onclick?: (event: Event) => void;
  /** Arbitrary attributes set via setAttribute() */
  attrs?: Record<string, string>;
};

const strAttrs: [keyof ElementAttrs, string][] = [
  ["id", "id"],
  ["textContent", "textContent"],
  ["text", "textContent"],
  ["href", "href"],
  ["src", "src"],
  ["alt", "alt"],
  ["target", "target"],
  ["rel", "rel"],
  ["type", "type"],
];

type ElementTagMap = {
  a: HTMLAnchorElement;
  button: HTMLButtonElement;
  div: HTMLDivElement;
  form: HTMLFormElement;
  h1: HTMLHeadingElement;
  h2: HTMLHeadingElement;
  img: HTMLImageElement;
  input: HTMLInputElement;
  label: HTMLLabelElement;
  nav: HTMLElement;
  p: HTMLParagraphElement;
  section: HTMLElement;
  span: HTMLSpanElement;
  strong: HTMLElement;
  style: HTMLStyleElement;
  textarea: HTMLTextAreaElement;
  video: HTMLVideoElement;
};

const el = <K extends keyof ElementTagMap>(
  tag: K,
  attrs?: ElementAttrs,
  children?: (HTMLElement | string)[]
): ElementTagMap[K] => {
  const node = document.createElement(tag);

  if (attrs) {
    const cls = attrs.className ?? attrs.class;
    if (cls) {
      node.className = Array.isArray(cls) ? cls.join(" ") : cls;
    }

    for (const [key, attr] of strAttrs) {
      const val = attrs[key];
      if (val) {
        if (attr === "id") {
          node.id = val as string;
        } else if (attr === "textContent") {
          node.textContent = val as string;
        } else {
          node.setAttribute(attr, val as string);
        }
      }
    }

    if (attrs.html) {
      node.innerHTML = attrs.html;
    }

    if (attrs.attrs) {
      for (const k of Object.keys(attrs.attrs)) {
        node.setAttribute(k, attrs.attrs[k]);
      }
    }

    if (attrs.style) {
      for (const k of Object.keys(attrs.style)) {
        node.style.setProperty(k, attrs.style[k]);
      }
    }

    if (attrs.onclick) {
      node.addEventListener("click", attrs.onclick);
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === "string") {
        node.append(document.createTextNode(child));
      } else {
        node.append(child);
      }
    }
  }

  return node as ElementTagMap[K];
};

const renderStars = (
  score: number,
  opts?: { className?: string; outOfFive?: boolean }
): HTMLElement => {
  const o = opts || {};
  const wrap = el("span", { className: o.className || "atv-rating-stars" });
  const out = o.outOfFive ? score : score / 2;
  for (let i = 1; i <= 5; i += 1) {
    let svg: string;
    if (out >= i - 0.25) {
      svg = ICON_STAR_FULL;
    } else if (out >= i - 0.75) {
      svg = ICON_STAR_HALF;
    } else {
      svg = ICON_STAR_EMPTY;
    }
    wrap.append(el("span", { html: svg }));
  }
  return wrap;
};

export { el, renderStars };
