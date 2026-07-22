import { useEffect, useRef } from "preact/hooks";

import type { HeroCallbacks, InterestState } from "@/modules/subject/domain";
import { INTEREST_LABELS } from "@/modules/subject/domain";
import {
  IconCheck,
  IconPlay,
  IconStarEmpty,
  IconStarFull,
  IconThumb,
} from "@/shared/components/common/icons";
import { playEntrance, springConfigs } from "@/shared/utils/springs";

type HeroActionsProps = {
  callbacks: HeroCallbacks;
  state: InterestState;
};

const InterestButton = ({
  className,
  label,
  onClick,
}: {
  className: string;
  label: string;
  onClick: () => void;
}) => (
  <button class={className} onClick={onClick} type="button">
    <span>{label === "想看" ? <IconPlay /> : <IconCheck />}</span>
    <span>{label}</span>
  </button>
);

const HeroActions = ({ callbacks, state }: HeroActionsProps) => {
  const interestPanelRef = useRef<HTMLDivElement>(null);
  const previousMarkedRef = useRef(state.marked);

  useEffect(() => {
    const wasMarked = previousMarkedRef.current;
    previousMarkedRef.current = state.marked;

    if (!wasMarked && state.marked && interestPanelRef.current) {
      const animation = playEntrance(
        interestPanelRef.current,
        springConfigs.contentEntrance
      );
      return () => animation.stop();
    }
  }, [state.marked]);

  if (!state.loggedIn) {
    return (
      <div class="atv-actions">
        <InterestButton
          className="atv-btn atv-btn-primary"
          label="想看"
          onClick={() =>
            callbacks.handleOpenInterest(state, {
              action: "标记想看",
              status: "wish",
            })
          }
        />
        {state.hasWatching ? (
          <InterestButton
            className="atv-btn atv-btn-secondary"
            label="在看"
            onClick={() =>
              callbacks.handleOpenInterest(state, {
                action: "标记在看",
                status: "do",
              })
            }
          />
        ) : null}
        <InterestButton
          className="atv-btn atv-btn-secondary"
          label="看过"
          onClick={() =>
            callbacks.handleOpenInterest(state, {
              action: "标记看过",
              status: "collect",
            })
          }
        />
      </div>
    );
  }

  if (!state.marked) {
    return (
      <div class="atv-actions">
        <InterestButton
          className="atv-btn atv-btn-primary"
          label="想看"
          onClick={() =>
            callbacks.handleOpenInterest(state, { status: "wish" })
          }
        />
        {state.hasWatching ? (
          <InterestButton
            className="atv-btn atv-btn-secondary"
            label="在看"
            onClick={() =>
              callbacks.handleOpenInterest(state, { status: "do" })
            }
          />
        ) : null}
        <InterestButton
          className="atv-btn atv-btn-secondary"
          label="看过"
          onClick={() =>
            callbacks.handleOpenInterest(state, { status: "collect" })
          }
        />
      </div>
    );
  }

  const label = INTEREST_LABELS[state.status];

  return (
    <div class="atv-actions">
      <div class="atv-interest-panel" ref={interestPanelRef}>
        <div class="atv-interest-panel-header">
          <button
            class="atv-btn atv-btn-primary is-active atv-interest-badge"
            onClick={() => callbacks.handleOpenInterest(state)}
            type="button"
          >
            <span>
              <IconCheck />
            </span>
            <span>{label}</span>
          </button>
          {state.rating > 0 ? (
            <span class="atv-interest-panel-stars">
              {Array.from({ length: 5 }, (_, index) =>
                index < state.rating ? (
                  <IconStarFull key={index} />
                ) : (
                  <IconStarEmpty key={index} />
                )
              )}
            </span>
          ) : null}
          {state.date ? (
            <span class="atv-interest-panel-date">{state.date}</span>
          ) : null}
          {state.tags.length ? (
            <span class="atv-interest-panel-tags">
              {state.tags.join(" · ")}
            </span>
          ) : null}
        </div>
        {state.comment ? (
          <div class="atv-interest-panel-comment">
            <span>{`"${state.comment}"`}</span>
            {state.usefulCount ? (
              <span class="atv-useful-badge">
                <IconThumb />
                <span>{state.usefulCount.replaceAll(/\D/gu, "")}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { HeroActions };
export type { HeroActionsProps };
