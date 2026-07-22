import type { JSX } from "preact";

import type {
  InterestFormState,
  InterestState,
} from "@/modules/subject/domain";

import type { InterestFormSource } from "./interest-form-source";
import { StarRatingInput } from "./star-rating-input";
import { InterestTagEditor } from "./tag-editor";
import { VisibilityAndPublishing } from "./visibility-and-publishing";

type InterestFormFieldsProps = {
  disabled: boolean;
  form: InterestFormState;
  onFormChange: (patch: Partial<InterestFormState>) => void;
  onRetry?: () => void;
  onTagDraftChange: (value: string) => void;
  onTagsChange: (update: (tags: string[]) => string[]) => void;
  source: InterestFormSource;
  state: InterestState;
  tagDraft: string;
};

const statusEntries = (
  hasWatching: boolean,
  currentStatus?: InterestFormState["status"]
): { label: string; value: InterestFormState["status"] }[] => [
  { label: "想看", value: "wish" },
  ...(hasWatching || currentStatus === "do"
    ? [{ label: "在看", value: "do" as const }]
    : []),
  { label: "看过", value: "collect" },
];

const InterestFormSkeleton = () => (
  <output
    aria-label="正在读取完整标记"
    aria-live="polite"
    class="atv-interest-modal-tag-skeleton"
  >
    <span />
    <span />
    <span />
  </output>
);

const InterestFormFields = ({
  disabled,
  form,
  onFormChange,
  onRetry,
  onTagDraftChange,
  onTagsChange,
  source,
  state,
  tagDraft,
}: InterestFormFieldsProps) => {
  const statuses = statusEntries(state.hasWatching, form.status);
  const activeStatusIndex = statuses.findIndex(
    (entry) => entry.value === form.status
  );
  const remainingCommentLength = 350 - form.comment.length;

  let tagField: JSX.Element;
  if (source.kind === "loading") {
    tagField = <InterestFormSkeleton />;
  } else if (source.kind === "error") {
    tagField = (
      <div class="atv-interest-modal-source-error" role="alert">
        <span>{source.message}</span>
        {onRetry ? (
          <button onClick={onRetry} type="button">
            重试
          </button>
        ) : null}
      </div>
    );
  } else {
    tagField = (
      <InterestTagEditor
        disabled={disabled}
        draft={tagDraft}
        myTags={source.snapshot.myTags}
        onChange={onTagsChange}
        onDraftChange={onTagDraftChange}
        popularTags={source.snapshot.popularTags}
        tags={form.tags}
      />
    );
  }

  return (
    <>
      <fieldset
        aria-label="标记状态"
        class="atv-interest-modal-statuses"
        style={
          {
            "--atv-interest-status-count": statuses.length,
            "--atv-interest-status-index": activeStatusIndex,
          } as JSX.CSSProperties
        }
      >
        <div aria-hidden="true" class="atv-interest-modal-status-indicator" />
        {statuses.map((entry) => (
          <button
            aria-pressed={entry.value === form.status}
            class={`atv-interest-modal-status${entry.value === form.status ? " is-active" : ""}`}
            data-value={entry.value}
            disabled={disabled}
            key={entry.value}
            onClick={() => onFormChange({ status: entry.value })}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </fieldset>
      {form.status === "collect" ? (
        <StarRatingInput
          disabled={disabled}
          onChange={(rating) => onFormChange({ rating })}
          rating={form.rating}
        />
      ) : null}
      {tagField}
      <label
        class="atv-interest-modal-field-header"
        for="atv-interest-modal-comment"
      >
        <span>简短评论</span>
        <span class="atv-interest-modal-comment-count">{`还可输入 ${remainingCommentLength} 字`}</span>
      </label>
      <textarea
        class="atv-interest-modal-comment"
        disabled={disabled}
        id="atv-interest-modal-comment"
        maxLength={350}
        onInput={(event) =>
          onFormChange({ comment: event.currentTarget.value })
        }
        placeholder="写一段短评…"
        rows={3}
        value={form.comment}
      />
      <VisibilityAndPublishing
        disabled={disabled}
        isPrivate={form.isPrivate}
        onChange={onFormChange}
        shareToBroadcast={form.shareToBroadcast}
      />
    </>
  );
};

export { InterestFormFields, statusEntries };
export type { InterestFormFieldsProps };
