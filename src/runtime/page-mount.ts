type PageLocation = Pick<Location, "hostname" | "pathname">;

type PageMount = {
  matches: (location: PageLocation) => boolean;
  mount: (doc: Document) => void;
};

const hasMatchingPage = (
  pages: readonly PageMount[],
  location: PageLocation = window.location
): boolean => pages.some(({ matches }) => matches(location));

const mountMatchingPage = (
  pages: readonly PageMount[],
  doc: Document,
  location: PageLocation = window.location
): boolean => {
  const page = pages.find(({ matches }) => matches(location));
  if (!page) {
    return false;
  }

  page.mount(doc);
  return true;
};

export { hasMatchingPage, mountMatchingPage };
export type { PageMount };
