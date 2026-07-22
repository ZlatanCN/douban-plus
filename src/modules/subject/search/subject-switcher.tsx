import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { normalizeSubjectQuery } from "@/modules/subject/api/subject-suggestions";
import type { SubjectSuggestion } from "@/modules/subject/api/subject-suggestions";

import { SearchIcon } from "./search-icon";
import { SuggestionRow } from "./subject-suggestion-row";
import {
  isTextInputTarget,
  nativeSearchUrl,
  suggestionListId,
} from "./subject-switcher-helpers";
import type { SubjectSwitcherProps } from "./subject-switcher-helpers";
import { useSubjectSuggestionRequest } from "./use-subject-suggestion-request";
import { useSwitcherNav } from "./use-switcher-nav";

const SubjectSwitcher = ({ onOpenChange }: SubjectSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const closeSwitcher = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const openSwitcher = useCallback(() => {
    setIsOpen(true);
  }, []);

  const openInNewTab = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener");
      closeSwitcher();
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
    onClose: closeSwitcher,
    onSelect: openSuggestion,
    onSubmit: submitSearch,
  });

  useEffect(() => onOpenChange?.(isOpen), [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

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
      openSwitcher();
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [openSwitcher]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeSwitcher();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeSwitcher, isOpen]);

  return (
    <div
      class={`atv-subject-switcher${isOpen ? " is-open" : ""}`}
      ref={rootRef}
    >
      {isOpen ? (
        <div class="atv-subject-switcher-expanded">
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
            onInput={(event) => {
              nav.handleReset();
              setQuery(event.currentTarget.value);
            }}
            onKeyDown={nav.handleKeyDown}
            placeholder="搜索电影、剧集"
            ref={inputRef}
            role="combobox"
            type="search"
            value={query}
          />
          <button
            aria-label="关闭作品搜索"
            class="atv-subject-switcher-close"
            onClick={closeSwitcher}
            type="button"
          >
            Esc
          </button>
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
      ) : (
        <button
          aria-label="搜索作品"
          class="atv-subject-switcher-trigger"
          onClick={openSwitcher}
          type="button"
        >
          <SearchIcon />
          <span>搜索作品</span>
        </button>
      )}
    </div>
  );
};

export { SubjectSwitcher };
