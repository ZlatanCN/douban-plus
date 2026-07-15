/* ── Controlled HTML render seam ─────────────────────────────────
 * The single owner of raw external HTML entering the Preact tree.
 *
 * Every string rendered through `HtmlContent` is passed through
 * `sanitizeHtml` first, so callers never need to pre-sanitize and a
 * forgotten sanitize can never reach the DOM. This is the choke point
 * the project's XSS surface funnels through (see ADR-0002: external
 * rich HTML is sanitized before controlled Preact HTML rendering).
 */

import type { JSX, ComponentChildren } from "preact";

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "cite",
  "code",
  "del",
  "div",
  "em",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const dangerousTags = new Set([
  "embed",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "style",
]);

const allowedImgAttrs = new Set(["src", "alt", "width", "height"]);

const allowedTableCellAttrs = new Set(["colspan", "rowspan", "scope"]);

/**
 * Sanitize untrusted HTML into a known-safe subset using an allow-list.
 * Anything not explicitly allowed is unwrapped (tag removed, children kept)
 * or dropped (dangerous tags and every non-allowed attribute). The result is
 * safe to inject via `dangerouslySetInnerHTML` because it contains no scripts,
 * no event-handler attributes, and no `javascript:`-style navigation.
 */
const sanitizeHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const element of doc.body.querySelectorAll("*")) {
    if (dangerousTags.has(element.tagName.toLowerCase())) {
      element.remove();
      continue;
    }
    if (!allowedTags.has(element.tagName.toLowerCase())) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of element.attributes) {
      const tagName = element.tagName.toLowerCase();
      const allowedHref = tagName === "a" && attribute.name === "href";
      const safeHref =
        allowedHref && /^(?:https?:|\/|#)/iu.test(attribute.value.trim());
      const allowedImgAttr =
        tagName === "img" && allowedImgAttrs.has(attribute.name);
      const allowedTableCellAttr =
        (tagName === "th" || tagName === "td") &&
        allowedTableCellAttrs.has(attribute.name);
      const allowedClass = attribute.name === "class";
      if (
        !safeHref &&
        !allowedImgAttr &&
        !allowedTableCellAttr &&
        !allowedClass
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return doc.body.innerHTML;
};

/**
 * Render boundary for external rich HTML. The `html` prop is always sanitized
 * before injection, so passing raw scraped content is safe. When `html` is
 * absent, `children` render instead (used for trusted, already-built nodes).
 *
 * The raw `dangerouslySetInnerHTML` prop is intentionally dropped from the
 * spread so a caller can never bypass the sanitizer and push unsanitized HTML
 * straight to the DOM through this seam.
 */
const HtmlContent = ({
  children,
  className,
  html,
  dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
  ...rest
}: JSX.HTMLAttributes<HTMLDivElement> & {
  html?: string;
  children?: ComponentChildren;
}) => (
  <div
    class={className}
    // eslint-disable-next-line react/no-danger -- html is sanitized by sanitizeHtml before it reaches this controlled render boundary.
    dangerouslySetInnerHTML={html ? { __html: sanitizeHtml(html) } : undefined}
    {...rest}
  >
    {html ? null : children}
  </div>
);

export { HtmlContent, sanitizeHtml };
