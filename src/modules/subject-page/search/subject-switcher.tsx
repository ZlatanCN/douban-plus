import type { JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { normalizeSubjectQuery } from "@/api/subject-suggestions";
import type { SubjectSuggestion } from "@/api/subject-suggestions";

import { SearchIcon } from "./search-icon";
import { SuggestionRow } from "./subject-suggestion-row";
import {
  isTextInputTarget,
  nativeSearchUrl,
  suggestionListId,
} from "./subject-switcher-helpers";
import type { SubjectSwitcherProps } from "./subject-switcher-helpers";
import { useSubjectSuggestionRequest } from "./use-subject-suggestion-request";
import type { SuggestionRequest } from "./use-subject-suggestion-request";

const SubjectSwitcher = ({ onOpenChange }: SubjectSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = normalizeSubjectQuery(query);
  const request = useSubjectSuggestionRequest(normalizedQuery);
  const requestMatchesQuery =
    request.status !== "idle" && request.query === normalizedQuery;
  const displayedRequest: SuggestionRequest =
    normalizedQuery && !requestMatchesQuery
      ? { query: normalizedQuery, status: "loading" }
      : request;
  const suggestions =
    displayedRequest.status === "ready" ? displayedRequest.suggestions : [];
  const activeSuggestion = suggestions[activeIndex] ?? null;
  const hasResultsPanel =
    Boolean(normalizedQuery) && displayedRequest.status !== "idle";
  const showFallback =
    displayedRequest.status === "failed" ||
    (displayedRequest.status === "ready" && !suggestions.length);

  const closeSwitcher = useCallback(() => {
    setActiveIndex(-1);
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

  const onInputKeyDown = (
    event: JSX.TargetedKeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, suggestions.length - 1)
      );
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeSuggestion) {
        openSuggestion(activeSuggestion);
      } else {
        submitSearch();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeSwitcher();
    }
  };

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
              activeSuggestion
                ? `atv-subject-suggestion-${activeSuggestion.id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={hasResultsPanel ? suggestionListId : undefined}
            aria-expanded={hasResultsPanel}
            class="atv-subject-switcher-input"
            id="atv-subject-switcher-input"
            onInput={(event) => {
              setActiveIndex(-1);
              setQuery(event.currentTarget.value);
            }}
            onKeyDown={onInputKeyDown}
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
                activeIndex >= 0 ? " is-keyboard-navigating" : ""
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
              {displayedRequest.status === "ready" && suggestions.length
                ? suggestions.map((suggestion, index) => (
                    <SuggestionRow
                      active={index === activeIndex}
                      index={index}
                      key={suggestion.id}
                      onOpen={openSuggestion}
                      suggestion={suggestion}
                    />
                  ))
                : null}
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
