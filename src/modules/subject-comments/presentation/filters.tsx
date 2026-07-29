import type {
  SubjectCommentsBrowseOption,
  SubjectCommentsScoreFilter,
} from "../domain";

const BrowseOption = ({
  className,
  locked,
  onNavigate,
  option,
  selected,
}: {
  className: string;
  locked: boolean;
  onNavigate: (
    event: MouseEvent,
    option: SubjectCommentsBrowseOption | SubjectCommentsScoreFilter
  ) => void;
  option: SubjectCommentsBrowseOption | SubjectCommentsScoreFilter;
  selected: boolean;
}) => (
  <a
    aria-current={selected ? "page" : undefined}
    aria-disabled={locked ? "true" : undefined}
    class={`${className}${selected ? " is-active" : ""}`}
    href={option.href}
    onClick={(event) => onNavigate(event, option)}
  >
    {option.label}
  </a>
);

type CommentsFiltersProps = {
  controlsOverflowing: boolean;
  controlsRef: { current: HTMLElement | null };
  isBrowseSelected: (option: SubjectCommentsBrowseOption) => boolean;
  isBrowsingLocked: boolean;
  navigateBrowse: (
    event: MouseEvent,
    option: SubjectCommentsBrowseOption
  ) => void;
  scoreFilters: SubjectCommentsScoreFilter[];
  sorts: SubjectCommentsBrowseOption[];
};

const CommentsFilters = ({
  controlsOverflowing,
  controlsRef,
  isBrowseSelected,
  isBrowsingLocked,
  navigateBrowse,
  scoreFilters,
  sorts,
}: CommentsFiltersProps) => (
  <aside
    aria-label="短评浏览控制台"
    class={`atv-subject-comments-controls${controlsOverflowing ? " is-overflowing" : ""}`}
    ref={controlsRef}
  >
    <section>
      <h2>排序</h2>
      <div class="atv-subject-comments-control-options">
        {sorts.map((option) => (
          <BrowseOption
            className="atv-subject-comments-sort-option"
            key={option.href}
            locked={isBrowsingLocked}
            onNavigate={navigateBrowse}
            option={option}
            selected={isBrowseSelected(option)}
          />
        ))}
      </div>
    </section>
    {scoreFilters.length > 0 ? (
      <section>
        <h2>评分</h2>
        <div class="atv-subject-comments-control-options">
          {scoreFilters.map((option) => (
            <BrowseOption
              className="atv-subject-comments-score-option"
              key={option.value}
              locked={isBrowsingLocked}
              onNavigate={navigateBrowse}
              option={option}
              selected={isBrowseSelected(option)}
            />
          ))}
        </div>
      </section>
    ) : null}
  </aside>
);

export { BrowseOption, CommentsFilters };
export type { CommentsFiltersProps };
