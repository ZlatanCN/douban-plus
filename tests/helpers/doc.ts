/* ── Test Document Builder ──────────────────────────────── */
/* Helper to create Document instances from HTML strings,     */
/* mock location/cookie, and create full test docs.          */

/**
 * Parse an HTML string into a Document using happy-dom.
 */
const buildDoc = (html: string): Document =>
  new DOMParser().parseFromString(html, "text/html");

/**
 * Mock the defaultView.location.pathname on an existing Document.
 * Returns a cleanup function to restore the original descriptor.
 */
const mockLocation = (doc: Document, pathname: string): (() => void) => {
  const win = doc.defaultView;
  if (!win) {
    return () => null;
  }
  const orig = Object.getOwnPropertyDescriptor(win.location, "pathname");
  Object.defineProperty(win.location, "pathname", {
    configurable: true,
    value: pathname,
    writable: true,
  });
  return () => {
    if (orig) {
      Object.defineProperty(win.location, "pathname", orig);
    }
  };
};

/**
 * Mock document.cookie on an existing Document.
 * Returns a cleanup function to restore the original descriptor.
 */
const mockCookie = (doc: Document, cookie: string): (() => void) => {
  const orig = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(doc, "cookie", {
    configurable: true,
    value: cookie,
    writable: true,
  });
  return () => {
    if (orig) {
      Object.defineProperty(doc, "cookie", orig);
    }
  };
};

/**
 * Create a Document from an HTML string, then set its location.
 * Convenience helper for the common case.
 */
const createTestDoc = (
  html: string,
  pathname = "/subject/1292052/"
): { cleanup: () => void; doc: Document } => {
  const doc = buildDoc(html);
  const cleanups: (() => void)[] = [];
  if (pathname) {
    cleanups.push(mockLocation(doc, pathname));
  }
  return {
    cleanup: () => {
      for (const fn of cleanups) {
        fn();
      }
    },
    doc,
  };
};

export { buildDoc, createTestDoc, mockCookie, mockLocation };
