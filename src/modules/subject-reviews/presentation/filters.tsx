import type { JSX } from "preact";

import type { SubjectReviewsBrowseOption } from "../domain";

type ReviewsFiltersProps = {
  sorts: SubjectReviewsBrowseOption[];
  ratings: SubjectReviewsBrowseOption[];
  selected: (option: SubjectReviewsBrowseOption) => boolean;
  navigate: (event: MouseEvent, option: SubjectReviewsBrowseOption) => void;
  locked: boolean;
  reviewKind: string;
};

const ReviewsFilters = ({
  sorts,
  ratings,
  selected,
  navigate,
  locked,
  reviewKind,
}: ReviewsFiltersProps): JSX.Element => (
  <aside
    aria-label={`${reviewKind}浏览控制台`}
    class="atv-subject-reviews-controls"
  >
    <section>
      <h2>排序</h2>
      <div>
        {sorts.map((option) => (
          <a
            aria-current={selected(option) ? "page" : undefined}
            aria-disabled={locked ? "true" : undefined}
            class={`atv-subject-reviews-option${selected(option) ? " is-active" : ""}`}
            href={option.href}
            key={option.value}
            onClick={(event) => navigate(event, option)}
          >
            {option.label}
          </a>
        ))}
      </div>
    </section>
    <section>
      <h2>评分</h2>
      <div>
        {ratings.map((option) => (
          <a
            aria-current={selected(option) ? "page" : undefined}
            aria-disabled={locked ? "true" : undefined}
            class={`atv-subject-reviews-option${selected(option) ? " is-active" : ""}`}
            href={option.href}
            key={option.value}
            onClick={(event) => navigate(event, option)}
          >
            {option.label}
          </a>
        ))}
      </div>
    </section>
  </aside>
);

export { ReviewsFilters };
