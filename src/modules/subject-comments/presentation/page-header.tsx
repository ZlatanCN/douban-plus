import type {
  SubjectCommentsBrowseOption,
  SubjectCommentStatus,
} from "../domain";

const numberFormatter = new Intl.NumberFormat("zh-CN");

type CommentsPageHeaderProps = {
  isBrowseSelected: (option: SubjectCommentsBrowseOption) => boolean;
  isBrowsingLocked: boolean;
  navigateBrowse: (
    event: MouseEvent,
    option: SubjectCommentsBrowseOption
  ) => void;
  onWriteClick: () => void;
  statuses: SubjectCommentStatus[];
  subjectHref: string;
  title: string;
  writeActionAvailable: boolean;
};

const CommentsPageHeader = ({
  isBrowseSelected,
  isBrowsingLocked,
  navigateBrowse,
  onWriteClick,
  statuses,
  subjectHref,
  title,
  writeActionAvailable,
}: CommentsPageHeaderProps) => (
  <header class="atv-subject-comments-hero">
    <div class="atv-subject-comments-toolbar">
      <a class="atv-subject-comments-back" href={subjectHref}>
        <span aria-hidden="true">←</span> 返回作品
      </a>
      {writeActionAvailable ? (
        <button
          class="atv-subject-comments-write"
          onClick={onWriteClick}
          type="button"
        >
          我来写短评 <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </div>
    <p class="atv-subject-comments-kicker">全部短评</p>
    <h1>{title}</h1>
    <nav aria-label="短评状态索引" class="atv-subject-comments-status-index">
      {statuses.map((status) => (
        <a
          aria-current={isBrowseSelected(status) ? "page" : undefined}
          aria-disabled={isBrowsingLocked ? "true" : undefined}
          class={`atv-subject-comments-status${isBrowseSelected(status) ? " is-active" : ""}`}
          href={status.href}
          key={status.value}
          onClick={(event) => navigateBrowse(event, status)}
        >
          <span>{status.label}</span>
          <strong>{numberFormatter.format(status.count)}</strong>
        </a>
      ))}
    </nav>
  </header>
);

export { CommentsPageHeader };
export type { CommentsPageHeaderProps };
