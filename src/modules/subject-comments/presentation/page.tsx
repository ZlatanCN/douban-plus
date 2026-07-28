import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

import { SafeImage } from "@/shared/components/common/safe-image";
import { VoteButton } from "@/shared/components/common/vote-button";
import { useInterestMarking } from "@/shared/components/interest-form";
import type { InterestState } from "@/shared/components/interest-form";
import { doubanInterestActions } from "@/shared/components/interest-form/douban-interest";
import { extractInterestState } from "@/shared/components/interest-form/extract-douban-interest";
import { StickyNav } from "@/shared/components/layout";
import { LoginModal } from "@/shared/components/login-modal";
import { ModalSession } from "@/shared/components/modal";
import { useModalRequest } from "@/shared/hooks/use-modal-request";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";

import type {
  SubjectComment,
  SubjectCommentsBrowseOption,
  SubjectCommentsPageData,
  SubjectCommentsScoreFilter,
} from "../domain";
import type { SubjectCommentsNavigationState } from "../runtime/navigation";

type SubjectCommentsPageProps = {
  data?: SubjectCommentsPageData;
  doc: Document;
  navigation?: SubjectCommentsNavigationState;
};

type LoginRequest = {
  action: string;
  onAuthenticated?: (interest: InterestState) => void;
};

const numberFormatter = new Intl.NumberFormat("zh-CN");

const triggerNativeVote = (doc: Document, commentId: string): void => {
  const item = [
    ...doc.querySelectorAll<HTMLElement>("#comments .comment-item"),
  ].find((candidate) => candidate.dataset.cid === commentId);
  item?.querySelector<HTMLElement>(".vote-comment")?.click();
};

const nativeComment = (doc: Document, commentId: string): HTMLElement | null =>
  [...doc.querySelectorAll<HTMLElement>("#comments .comment-item")].find(
    (candidate) => candidate.dataset.cid === commentId
  ) ?? null;

const votesFromNativeComment = (
  doc: Document,
  commentId: string,
  fallback: SubjectComment["votes"]
): SubjectComment["votes"] => {
  const item = nativeComment(doc, commentId);
  if (!item) {
    return fallback;
  }
  const count = Number(item.querySelector(".vote-count")?.textContent?.trim());
  return {
    canVote: item.querySelector(".vote-comment") !== null,
    count: Number.isSafeInteger(count) && count >= 0 ? count : fallback.count,
  };
};

const Avatar = ({ comment }: { comment: SubjectComment }) => (
  <SafeImage
    alt={`${comment.author.name}的头像`}
    className="atv-subject-comments-avatar"
    fallback={
      <span aria-hidden="true" class="atv-subject-comments-avatar is-fallback">
        {comment.author.name.slice(0, 1)}
      </span>
    }
    src={comment.author.avatar}
  />
);

const BrowseOption = ({
  className,
  locked,
  onNavigate,
  option,
  selected,
}: {
  className: string;
  locked: boolean;
  onNavigate: (event: MouseEvent, option: SubjectCommentsBrowseOption) => void;
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

const Rating = ({ rating }: { rating: number | null }) => {
  if (!rating) {
    return null;
  }

  return (
    <span aria-label={`${rating} 星`} class="atv-subject-comments-rating">
      {"★".repeat(rating)}
    </span>
  );
};

const CommentTime = ({ time }: Pick<SubjectComment, "time">) => {
  if (!time) {
    return null;
  }

  if (time.href) {
    return (
      <a class="atv-subject-comments-time" href={time.href}>
        {time.label}
      </a>
    );
  }

  return <span class="atv-subject-comments-time">{time.label}</span>;
};

const Comment = ({
  comment,
  doc,
}: {
  comment: SubjectComment;
  doc: Document;
}) => {
  const [votes, setVotes] = useState(comment.votes);

  useEffect(() => {
    const item = nativeComment(doc, comment.id);
    const view = doc.defaultView ?? window;
    if (!item || !view.MutationObserver) {
      return;
    }
    const synchronizeVotes = (): void => {
      setVotes((current) => votesFromNativeComment(doc, comment.id, current));
    };
    const observer = new view.MutationObserver(synchronizeVotes);
    observer.observe(item, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [comment.id, doc]);

  const identity = (
    <>
      <Avatar comment={comment} />
      <span class="atv-subject-comments-author-name">
        {comment.author.name}
      </span>
    </>
  );

  return (
    <article class="atv-subject-comments-item">
      <header class="atv-subject-comments-item-header">
        {comment.author.href ? (
          <a class="atv-subject-comments-author" href={comment.author.href}>
            {identity}
          </a>
        ) : (
          <span class="atv-subject-comments-author is-static">{identity}</span>
        )}
        <div class="atv-subject-comments-meta">
          <Rating rating={comment.rating} />
          <CommentTime time={comment.time} />
          {comment.location ? (
            <span class="atv-subject-comments-location">
              {comment.location}
            </span>
          ) : null}
        </div>
      </header>
      <div class="atv-subject-comments-reading-row">
        <p class="atv-subject-comments-content">{comment.content}</p>
        <div aria-label="短评共识刻度" class="atv-subject-comments-consensus">
          <VoteButton
            ariaLabel={`有用，${numberFormatter.format(votes.count)} 人觉得有用`}
            className="atv-comment-votes atv-subject-comments-vote"
            count={votes.count}
            disabled={!votes.canVote}
            onVote={() => {
              if (votes.canVote) {
                triggerNativeVote(doc, comment.id);
                setVotes((current) =>
                  votesFromNativeComment(doc, comment.id, current)
                );
              }
            }}
            voted={!votes.canVote}
          />
        </div>
      </div>
    </article>
  );
};

const SubjectCommentsPage = ({
  data: initialData,
  doc,
  navigation: commentsNavigation,
}: SubjectCommentsPageProps) => {
  const data = commentsNavigation?.data ?? initialData;
  if (!data) {
    throw new Error("短评页缺少阅读数据");
  }
  const navigation = useStickyNavigation(doc, []);
  const controlsRef = useRef<HTMLElement | null>(null);
  const [controlsOverflowing, setControlsOverflowing] = useState(false);
  const [interest, setInterest] = useState(() => extractInterestState(doc));
  const loginAction = useModalRequest<LoginRequest>();
  const {
    active: activeLogin,
    handleClose: handleCloseLogin,
    handleOpen: handleOpenLogin,
  } = loginAction;
  const requestLogin = useCallback(
    (
      action: string,
      onAuthenticated?: (interest: InterestState) => void
    ): void => {
      handleOpenLogin({
        action,
        ...(onAuthenticated ? { onAuthenticated } : {}),
      });
    },
    [handleOpenLogin]
  );
  const interestMarking = useInterestMarking({
    adapters: doubanInterestActions,
    loggedIn: interest.loggedIn,
    onInterestChange: setInterest,
    onLoginRequired: requestLogin,
    subjectId: data.subjectId,
    subjectTitle: data.title,
  });
  const pending = commentsNavigation?.pending ?? null;
  const isBrowsingLocked = pending !== null;
  const isBrowseSelected = (option: SubjectCommentsBrowseOption): boolean =>
    pending ? pending.href === option.href : option.active;
  const navigationVersion = commentsNavigation?.version ?? 0;
  const refreshComments = commentsNavigation?.refresh;
  const handleRetry = commentsNavigation?.retry;
  const handleDismissNavigationFailure = commentsNavigation?.dismissFailure;
  const handleLoginAuthenticated = useCallback(async (): Promise<void> => {
    let nextInterest: InterestState;
    try {
      const [refreshedInterest] = await Promise.all([
        doubanInterestActions.read(data.subjectId),
        refreshComments?.() ?? Promise.resolve(),
      ]);
      nextInterest = refreshedInterest;
    } catch {
      nextInterest = extractInterestState(doc);
    }
    setInterest(nextInterest);
    activeLogin?.value.onAuthenticated?.(nextInterest);
    handleCloseLogin();
  }, [activeLogin, data.subjectId, doc, handleCloseLogin, refreshComments]);

  const navigateBrowse = (
    event: MouseEvent,
    option: SubjectCommentsBrowseOption
  ): void => {
    if (
      !commentsNavigation ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (!isBrowsingLocked && !option.active) {
      commentsNavigation.navigate(option.href, option.label);
    }
  };

  useEffect(() => {
    const controls = controlsRef.current;
    const view = doc.defaultView ?? window;
    if (!controls) {
      return;
    }
    const updateOverflow = (): void => {
      setControlsOverflowing(controls.scrollWidth > controls.clientWidth);
    };
    updateOverflow();
    view.addEventListener("resize", updateOverflow, { passive: true });
    return () => view.removeEventListener("resize", updateOverflow);
  }, [doc, data.scoreFilters.length, data.sorts.length]);

  useLayoutEffect(() => {
    if (navigationVersion === 0) {
      return;
    }
    (doc.defaultView ?? window).scrollTo({ behavior: "auto", top: 0 });
  }, [doc, navigationVersion]);

  return (
    <>
      <StickyNav
        {...navigation}
        className="atv-subject-comments-nav"
        title={data.title}
      />
      <main class="atv-subject-comments">
        <header class="atv-subject-comments-hero">
          <div class="atv-subject-comments-toolbar">
            <a class="atv-subject-comments-back" href={data.subjectHref}>
              <span aria-hidden="true">←</span> 返回作品
            </a>
            {data.writeActionAvailable ? (
              <button
                class="atv-subject-comments-write"
                onClick={() =>
                  interestMarking.callbacks.handleOpenInterest(interest, {
                    action: "写短评",
                    status: "collect",
                  })
                }
                type="button"
              >
                我来写短评 <span aria-hidden="true">↗</span>
              </button>
            ) : null}
          </div>
          <p class="atv-subject-comments-kicker">全部短评</p>
          <h1>{data.title}</h1>
          <nav
            aria-label="短评状态索引"
            class="atv-subject-comments-status-index"
          >
            {data.statuses.map((status) => (
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
        <div class="atv-subject-comments-layout">
          <aside
            aria-label="短评浏览控制台"
            class={`atv-subject-comments-controls${controlsOverflowing ? " is-overflowing" : ""}`}
            ref={controlsRef}
          >
            <section>
              <h2>排序</h2>
              <div class="atv-subject-comments-control-options">
                {data.sorts.map((option) => (
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
            {data.scoreFilters.length > 0 ? (
              <section>
                <h2>评分</h2>
                <div class="atv-subject-comments-control-options">
                  {data.scoreFilters.map((option) => (
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
          <section
            aria-busy={isBrowsingLocked}
            aria-label="短评列表"
            class={`atv-subject-comments-stream${isBrowsingLocked ? " is-loading" : ""}`}
          >
            <p aria-live="polite" class="atv-subject-comments-live">
              {pending ? `正在加载${pending.label}短评` : ""}
            </p>
            {commentsNavigation?.failure ? (
              <output class="atv-subject-comments-navigation-failure">
                <span>短评暂未更新，当前结果仍可继续阅读。</span>
                <button onClick={handleRetry} type="button">
                  重试
                </button>
                <button
                  aria-label="关闭提示"
                  onClick={handleDismissNavigationFailure}
                  type="button"
                >
                  ×
                </button>
              </output>
            ) : null}
            <div class="atv-subject-comments-results" key={navigationVersion}>
              {data.comments.map((comment) => (
                <Comment comment={comment} doc={doc} key={comment.id} />
              ))}
              {data.pagination.length > 0 ? (
                <nav
                  aria-label="原生短评分页导航"
                  class="atv-subject-comments-pagination"
                >
                  {data.pagination.map((link) =>
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
              ) : null}
            </div>
          </section>
        </div>
      </main>
      {activeLogin ? (
        <ModalSession request={activeLogin}>
          <LoginModal
            action={activeLogin.value.action}
            onAuthenticated={handleLoginAuthenticated}
            onClose={handleCloseLogin}
          />
        </ModalSession>
      ) : null}
      {interestMarking.form}
    </>
  );
};

export { SubjectCommentsPage };
export type { SubjectCommentsPageProps };
