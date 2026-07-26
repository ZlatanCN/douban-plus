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

/** Shared spring-like cubic bezier for both WAAPI and CSS transitions. */
const springEasing = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Captures the current left-edge position of the expanded element for FLIP. */
const captureExpandedLeft = (el: HTMLElement): number | null => {
  const expanded = el.querySelector(
    ".atv-subject-switcher-expanded"
  ) as HTMLElement | null;
  if (!expanded) {
    return null;
  }
  return expanded.getBoundingClientRect().left;
};

const SubjectSwitcher = ({ onOpenChange }: SubjectSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const [flipSnapshot, setFlipSnapshot] = useState<number | null>(null);

  const normalizedQuery = normalizeSubjectQuery(query);
  const displayedRequest = useSubjectSuggestionRequest(normalizedQuery);
  const suggestions =
    displayedRequest.status === "ready" ? displayedRequest.suggestions : [];
  const hasResultsPanel =
    Boolean(normalizedQuery) && displayedRequest.status !== "idle";
  const showFallback =
    displayedRequest.status === "failed" ||
    (displayedRequest.status === "ready" && !suggestions.length);

  /* -------- open / close with FLIP snapshot -------- */
  const closeSwitcher = useCallback(() => {
    const el = rootRef.current;
    if (el) {
      setFlipSnapshot(captureExpandedLeft(el));
    }
    setIsOpen(false);
    setQuery("");
  }, []);

  const openSwitcher = useCallback(() => {
    const el = rootRef.current;
    if (el) {
      setFlipSnapshot(captureExpandedLeft(el));
    }
    setIsOpen(true);
  }, []);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }

    // Sync the wrapper's data-state so CSS centering changes apply.
    const wrapper = el.closest(
      ".atv-stickynav-subject-switcher"
    ) as HTMLElement | null;
    if (!wrapper) {
      return;
    }
    wrapper.dataset.state = isOpen ? "open" : "closed";

    // The expanded element is the one that repositions (absolute nav-center vs
    // in-flow right-aligned). FLIP on the expanded, not the wrapper.
    const expanded = el.querySelector(
      ".atv-subject-switcher-expanded"
    ) as HTMLElement | null;
    if (!expanded) {
      return;
    }

    // FLIP: if we captured a pre-state-change snapshot, animate from it.
    const snap = flipSnapshot;
    if (snap === null) {
      return;
    }

    animRef.current?.cancel();

    // Read the new layout position (post-state-change).
    // For open:  absolute → centered via left: 50%; transform: translateX(-50%)
    // For close: in-flow → right-aligned after the trigger
    const newLeft = expanded.getBoundingClientRect().left;

    const dx = snap - newLeft;

    // No meaningful movement → skip animation.
    if (Math.abs(dx) < 0.5) {
      return;
    }

    // Compensate: visually stay at the OLD position via transform.
    expanded.style.transform = `translateX(${dx}px)`;
    void expanded.offsetHeight;

    // WAAPI animates from compensated position to target CSS position.
    // Open:  end = translateX(-50%)  (the CSS centering transform)
    // Close: end = none             (in-flow, no CSS transform)
    const targetTransform = isOpen ? "translateX(-50%)" : "none";
    const anim = expanded.animate(
      [{ transform: `translateX(${dx}px)` }, { transform: targetTransform }],
      {
        duration: isOpen ? 400 : 350,
        easing: springEasing,
        fill: "both",
      }
    );

    anim.onfinish = () => {
      expanded.style.transform = "";
      anim.cancel();
      animRef.current = null;
    };
    animRef.current = anim;

    return () => {
      animRef.current?.cancel();
    };
  }, [isOpen, flipSnapshot]);
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
      openSwitcher();
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
        closeSwitcher();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeSwitcher, isOpen]);

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

  /* -------- render -------- */

  return (
    <div
      class="atv-subject-switcher"
      data-state={isOpen ? "open" : "closed"}
      ref={rootRef}
    >
      {/* ---- Trigger (always in DOM, faded when open) ---- */}
      <button
        aria-label="搜索作品"
        class="atv-subject-switcher-trigger"
        onClick={openSwitcher}
        type="button"
      >
        <SearchIcon />
        <span>搜索作品</span>
      </button>

      {/* ---- Expanded search bar (always in DOM, revealed when open) ---- */}
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
