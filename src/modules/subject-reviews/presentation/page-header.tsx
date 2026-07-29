import type { JSX } from "preact";

type ReviewsPageHeaderProps = {
  title: string;
  subjectHref: string;
  writeHref: string;
  reviewKind: string;
};

const ReviewsPageHeader = ({
  title,
  subjectHref,
  writeHref,
  reviewKind,
}: ReviewsPageHeaderProps): JSX.Element => (
  <header class="atv-subject-reviews-hero">
    <div class="atv-subject-reviews-toolbar">
      <a class="atv-subject-reviews-back" href={subjectHref}>
        <span aria-hidden="true">←</span> 返回作品
      </a>
      <a class="atv-subject-reviews-write" href={writeHref}>
        我来写{reviewKind} <span aria-hidden="true">↗</span>
      </a>
    </div>
    <p class="atv-subject-reviews-kicker">全部{reviewKind}</p>
    <h1>{title}</h1>
  </header>
);

export { ReviewsPageHeader };
