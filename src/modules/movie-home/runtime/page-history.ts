const PAGE_STATE_KEY = "atvMovieHomePage";

type HistoryState = Record<string, unknown>;

const isHistoryState = (value: unknown): value is HistoryState =>
  typeof value === "object" && value !== null;

const historyView = (doc: Document): Window => doc.defaultView ?? window;

const readMovieHomePage = (doc: Document): number => {
  const { state } = historyView(doc).history;
  if (!isHistoryState(state)) {
    return 1;
  }

  const page = state[PAGE_STATE_KEY];
  return typeof page === "number" && Number.isInteger(page) && page > 0
    ? page
    : 1;
};

const writeMovieHomePage = (doc: Document, page: number): void => {
  const view = historyView(doc);
  const { state } = view.history;
  view.history.replaceState(
    {
      ...(isHistoryState(state) ? state : {}),
      [PAGE_STATE_KEY]: page,
    },
    ""
  );
};

export { readMovieHomePage, writeMovieHomePage };
