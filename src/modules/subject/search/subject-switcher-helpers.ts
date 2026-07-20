const suggestionListId = "atv-subject-suggestion-list";

type SubjectSwitcherProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

const isTextInputTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest("input, textarea, select, [contenteditable]") !== null;

const nativeSearchUrl = (query: string): string =>
  `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(query)}`;

export { isTextInputTarget, nativeSearchUrl, suggestionListId };
export type { SubjectSwitcherProps };
