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

export { el };
