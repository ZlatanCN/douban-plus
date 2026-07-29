import type {
  SubjectCommentsBrowseOption,
  SubjectCommentsPaginationLink,
} from "../domain";

type CommentsPaginationProps = {
  isBrowsingLocked: boolean;
  navigateBrowse: (
    event: MouseEvent,
    option: SubjectCommentsBrowseOption
  ) => void;
  pagination: SubjectCommentsPaginationLink[];
};

const CommentsPagination = ({
  isBrowsingLocked,
  navigateBrowse,
  pagination,
}: CommentsPaginationProps) => {
  if (pagination.length === 0) {
    return null;
  }

  return (
    <nav aria-label="原生短评分页导航" class="atv-subject-comments-pagination">
      {pagination.map((link) =>
        link.href ? (
          <a
            aria-disabled={isBrowsingLocked ? "true" : undefined}
            href={link.href}
            key={`${link.relation}-${link.href}`}
            onClick={(event) =>
              navigateBrowse(event, {
                active: false,
                href: link.href ?? "",
                label: link.label,
              })
            }
          >
            {link.label}
          </a>
        ) : (
          <span
            aria-current={link.active ? "page" : undefined}
            key={`${link.relation}-${link.label}`}
          >
            {link.label}
          </span>
        )
      )}
    </nav>
  );
};

export { CommentsPagination };
export type { CommentsPaginationProps };
