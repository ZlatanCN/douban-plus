/* oxlint-disable jsx-a11y/no-redundant-roles -- The expanded search input exposes the active suggestion-list combobox state. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

import { normalizeSubjectQuery } from "@/modules/subject/api/subject-suggestions";
import type { SubjectSuggestion } from "@/modules/subject/api/subject-suggestions";

import { SuggestionRow } from "./subject-suggestion-row";
import { useSubjectSuggestionRequest } from "./use-subject-suggestion-request";
import { useSwitcherNav } from "./use-switcher-nav";

const suggestionListId = "atv-subject-suggestion-list";

type SubjectSwitcherProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

const isTextInputTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest("input, textarea, select, [contenteditable]") !== null;

const nativeSearchUrl = (query: string): string =>
  `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(query)}`;

const SearchIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
    <circle
      cx="6.5"
      cy="6.5"
      fill="none"
      r="5"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M10.5 10.5 15 15"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.5"
    />
  </svg>
);

const SubjectSwitcher = ({ onOpenChange }: SubjectSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animateSearch, setAnimateSearch] = useState(true);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = normalizeSubjectQuery(query);
  const displayedRequest = useSubjectSuggestionRequest(normalizedQuery);
  const suggestions =
    displayedRequest.status === "ready" ? displayedRequest.suggestions : [];
  const hasResultsPanel =
    Boolean(normalizedQuery) && displayedRequest.status !== "idle";
  const showFallback =
    displayedRequest.status === "failed" ||
    (displayedRequest.status === "ready" && !suggestions.length);

  /* -------- open / close -------- */
  const closeSwitcher = useCallback((animate = true) => {
    setAnimateSearch(animate);
    setIsOpen(false);
    setQuery("");
  }, []);

  const openSwitcher = useCallback((animate = true) => {
    setAnimateSearch(animate);
    setIsOpen(true);
  }, []);

  useLayoutEffect(() => {
    const wrapper = rootRef.current?.closest(
      ".atv-stickynav-subject-switcher"
    ) as HTMLElement | null;
    const switcher = rootRef.current;
    if (!wrapper || !switcher) {
      return;
    }

    wrapper.dataset.state = isOpen ? "open" : "closed";
    const nav = wrapper.closest(".atv-stickynav");
    const title = nav?.querySelector<HTMLElement>(".atv-stickynav-title");
    const expanded = switcher.querySelector<HTMLElement>(
      ".atv-subject-switcher-expanded"
    );
    if (!(nav && title && expanded)) {
      return;
    }

    const updateMaxWidth = (): void => {
      // Computed CSS lengths keep their `px` suffix, so parse the numeric part.
      // oxlint-disable-next-line unicorn/prefer-number-coercion
      const navGap = Number.parseFloat(window.getComputedStyle(nav).columnGap);
      const preferredWidth = Math.min(
        window.innerWidth * (window.innerWidth <= 768 ? 0.78 : 0.44),
        520
      );
      const availableWidth = Math.max(
        0,
        switcher.getBoundingClientRect().right -
          title.getBoundingClientRect().right -
          (Number.isFinite(navGap) ? navGap : 0)
      );
      expanded.style.maxWidth = `${Math.min(preferredWidth, availableWidth)}px`;
    };

    updateMaxWidth();
    window.addEventListener("resize", updateMaxWidth);
    return () => window.removeEventListener("resize", updateMaxWidth);
  }, [isOpen]);

  useEffect(() => onOpenChange?.(isOpen), [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // "/" keyboard shortcut to open
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent): void => {
      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTextInputTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      openSwitcher(false);
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [openSwitcher]);

  // Outside-pointer-down to close
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !document
          .querySelector(".atv-subject-switcher-expanded")
          ?.contains(event.target)
      ) {
        closeSwitcher(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeSwitcher, isOpen]);

  const openInNewTab = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener");
      closeSwitcher(false);
    },
    [closeSwitcher]
  );

  const openSuggestion = useCallback(
    (suggestion: SubjectSuggestion) => openInNewTab(suggestion.url),
    [openInNewTab]
  );

  const submitSearch = useCallback(() => {
    if (normalizedQuery) {
      openInNewTab(nativeSearchUrl(normalizedQuery));
    }
  }, [normalizedQuery, openInNewTab]);

  const nav = useSwitcherNav({
    items: suggestions,
    onClose: () => closeSwitcher(false),
    onSelect: openSuggestion,
    onSubmit: submitSearch,
  });

  /* -------- render -------- */

  return (
    <div
      class="atv-subject-switcher"
      data-animation={animateSearch ? "enabled" : "none"}
      data-state={isOpen ? "open" : "closed"}
      ref={rootRef}
    >
      {/* ---- Trigger (always in DOM, faded when open) ---- */}
      <button
        aria-label="搜索作品"
        class="atv-subject-switcher-trigger"
        onClick={(event) => openSwitcher(event.detail > 0)}
        type="button"
      >
        <SearchIcon />
        <span>搜索作品</span>
      </button>

      {/* ---- Expanded search bar (always in DOM, revealed when open) ---- */}
      <div class="atv-subject-switcher-expanded">
        <div class="atv-subject-switcher-field">
          <label
            class="atv-screen-reader-only"
            htmlFor="atv-subject-switcher-input"
          >
            搜索电影、剧集
          </label>
          <span class="atv-subject-switcher-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            role="combobox"
            aria-activedescendant={
              nav.activeItem
                ? `atv-subject-suggestion-${nav.activeItem.id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={hasResultsPanel ? suggestionListId : undefined}
            aria-expanded={hasResultsPanel}
            class="atv-subject-switcher-input"
            id="atv-subject-switcher-input"
            list={undefined}
            onInput={(event) => {
              nav.handleReset();
              setQuery(event.currentTarget.value);
            }}
            onKeyDown={nav.handleKeyDown}
            placeholder="搜索电影、剧集"
            ref={inputRef}
            type="text"
            value={query}
          />
          <button
            aria-label="关闭作品搜索"
            class="atv-subject-switcher-close"
            onClick={(event) => closeSwitcher(event.detail > 0)}
            type="button"
          >
            Esc
          </button>
        </div>

        {/* ---- Suggestion / status panel ---- */}
        {hasResultsPanel ? (
          <div
            class={`atv-subject-suggestion-rail${
              nav.activeIndex >= 0 ? " is-keyboard-navigating" : ""
            }`}
            id={suggestionListId}
            role={suggestions.length ? "listbox" : "status"}
          >
            {displayedRequest.status === "loading" ? (
              <div
                class="atv-subject-suggestion-skeletons"
                aria-label="正在搜索作品"
              >
                <span />
                <span />
                <span />
              </div>
            ) : null}
            {displayedRequest.status === "ready" && suggestions.length ? (
              <div role="presentation">
                {suggestions.map((suggestion, index) => (
                  <SuggestionRow
                    active={index === nav.activeIndex}
                    index={index}
                    key={suggestion.id}
                    onOpen={openSuggestion}
                    suggestion={suggestion}
                  />
                ))}
              </div>
            ) : null}
            {showFallback ? (
              <button
                class="atv-subject-search-fallback"
                onClick={submitSearch}
                type="button"
              >
                在豆瓣搜索「{normalizedQuery}」
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { SubjectSwitcher };
