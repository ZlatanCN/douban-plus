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
  onclick?: (event: MouseEvent) => void;
  /** Arbitrary attributes set via setAttribute() */
  attrs?: Record<string, string>;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: ElementAttrs,
  children?: Array<HTMLElement | string>
): HTMLElementTagNameMap[K];
function el(
  tag: string,
  attrs?: ElementAttrs,
  children?: Array<HTMLElement | string>
): HTMLElement {
  const node = document.createElement(tag);

  if (attrs) {
    if (attrs.className) {
      node.className = Array.isArray(attrs.className)
        ? attrs.className.join(" ")
        : attrs.className;
    } else if (attrs.class) {
      node.className = Array.isArray(attrs.class)
        ? attrs.class.join(" ")
        : attrs.class;
    }
    if (attrs.id != null) {
      node.id = attrs.id;
    }
    if (attrs.textContent != null) {
      node.textContent = attrs.textContent;
    }
    if (attrs.text != null) {
      node.textContent = attrs.text;
    }
    if (attrs.html != null) {
      node.innerHTML = attrs.html;
    }
    if (attrs.href != null) {
      node.setAttribute("href", attrs.href);
    }
    if (attrs.src != null) {
      node.setAttribute("src", attrs.src);
    }
    if (attrs.alt != null) {
      node.setAttribute("alt", attrs.alt);
    }
    if (attrs.target != null) {
      node.setAttribute("target", attrs.target);
    }
    if (attrs.rel != null) {
      node.setAttribute("rel", attrs.rel);
    }
    if (attrs.type != null) {
      node.setAttribute("type", attrs.type);
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
        node.appendChild(document.createTextNode(child));
      } else {
        node.appendChild(child);
      }
    }
  }

  return node;
}

function renderStars(
  score: number,
  opts?: { className?: string; outOfFive?: boolean }
): HTMLElement {
  const o = opts || {};
  const wrap = el("span", { className: o.className || "atv-rating-stars" });
  const out = o.outOfFive ? score : score / 2;
  for (let i = 1; i <= 5; i++) {
    let svg: string;
    if (out >= i - 0.25) {
      svg = ICON_STAR_FULL;
    } else if (out >= i - 0.75) {
      svg = ICON_STAR_HALF;
    } else {
      svg = ICON_STAR_EMPTY;
    }
    wrap.appendChild(el("span", { html: svg }));
  }
  return wrap;
}

export { el, renderStars };
