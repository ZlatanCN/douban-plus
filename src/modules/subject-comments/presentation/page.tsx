import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

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
  SubjectCommentsBrowseOption,
  SubjectCommentsPageData,
} from "../domain";
import type { SubjectCommentsNavigationState } from "../runtime/navigation";
import { Comment } from "./comment-card";
import { CommentsFilters } from "./filters";
import { CommentsPageHeader } from "./page-header";
import { CommentsPagination } from "./pagination";

type SubjectCommentsPageProps = {
  data?: SubjectCommentsPageData;
  doc: Document;
  navigation?: SubjectCommentsNavigationState;
};

type LoginRequest = {
  action: string;
  onAuthenticated?: (interest: InterestState) => void;
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
    if (isBrowsingLocked || option.active) {
      return;
    }
    if (option.requiresLogin && !interest.loggedIn) {
      requestLogin(`查看${option.label}短评`, () => {
        commentsNavigation.navigate(option.href, option.label);
      });
      return;
    }
    commentsNavigation.navigate(option.href, option.label);
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
        <CommentsPageHeader
          isBrowseSelected={isBrowseSelected}
          isBrowsingLocked={isBrowsingLocked}
          navigateBrowse={navigateBrowse}
          onWriteClick={() =>
            interestMarking.callbacks.handleOpenInterest(interest, {
              action: "写短评",
              status: "collect",
            })
          }
          statuses={data.statuses}
          subjectHref={data.subjectHref}
          title={data.title}
          writeActionAvailable={data.writeActionAvailable}
        />
        <div class="atv-subject-comments-layout">
          <CommentsFilters
            controlsOverflowing={controlsOverflowing}
            controlsRef={controlsRef}
            isBrowseSelected={isBrowseSelected}
            isBrowsingLocked={isBrowsingLocked}
            navigateBrowse={navigateBrowse}
            scoreFilters={data.scoreFilters}
            sorts={data.sorts}
          />
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
                <Comment
                  comment={comment}
                  doc={doc}
                  key={comment.id}
                  onLoginRequired={() => requestLogin("给短评投票")}
                />
              ))}
              <CommentsPagination
                isBrowsingLocked={isBrowsingLocked}
                navigateBrowse={navigateBrowse}
                pagination={data.pagination}
              />
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
