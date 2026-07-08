import { useState } from "preact/hooks";

import { ModalCloseButton, ModalShell } from "../../../components/modal/index";
import { useModalClose } from "../../../components/modal/modal-close-context";
import type {
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "../../../types";
import { INTEREST_LABELS } from "../../../types";
import { StarRatingInput } from "./star-rating-input";

interface InterestFormProps {
  callbacks: ModalCallbacks;
  onClose: () => void;
  state: InterestState;
}

const statusEntries = (
  hasWatching: boolean
): { label: string; value: InterestFormState["status"] }[] => [
  { label: "想看", value: "wish" },
  ...(hasWatching ? [{ label: "在看", value: "do" as const }] : []),
  { label: "看过", value: "collect" },
];

const initialStatus = (state: InterestState): InterestFormState["status"] =>
  state.marked && state.status !== "none" ? state.status : "wish";

const InterestFormContent = ({
  callbacks,
  state,
}: {
  callbacks: ModalCallbacks;
  state: InterestState;
}) => {
  const handleClose = useModalClose();
  const [status, setStatus] = useState<InterestFormState["status"]>(
    initialStatus(state)
  );
  const [rating, setRating] = useState(state.rating || 0);
  const [comment, setComment] = useState(state.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const titlePrefix = state.marked ? "修改" : "标记";

  const save = async (): Promise<void> => {
    if (loading) {
      return;
    }
    setLoading(true);
    setError("");
    const result = await callbacks.onSave({
      comment: comment.trim(),
      rating,
      status,
    });
    if (result.ok) {
      handleClose();
      return;
    }
    setError(result.error || "操作失败");
    setLoading(false);
  };

  const remove = async (): Promise<void> => {
    if (loading) {
      return;
    }
    setLoading(true);
    setError("");
    const result = await callbacks.onRemove(state.status);
    if (result.ok) {
      handleClose();
      return;
    }
    setError(result.error || "取消标记失败");
    setLoading(false);
  };

  return (
    <>
      <div class="atv-interest-modal-accent" />
      <div class="atv-interest-modal-header">
        <span
          class="atv-interest-modal-header__title"
          id="atv-interest-modal-title"
        >
          {`${titlePrefix}${INTEREST_LABELS[status]}`}
        </span>
        <ModalCloseButton
          ariaLabel="关闭标记弹窗"
          className="atv-interest-modal-close"
          onClick={handleClose}
        />
      </div>
      <div class="atv-interest-modal-body">
        <div class="atv-interest-modal-statuses">
          {statusEntries(state.hasWatching).map((entry) => (
            <button
              class={`atv-interest-modal-status${
                entry.value === status ? " is-active" : ""
              }`}
              data-value={entry.value}
              disabled={loading}
              key={entry.value}
              onClick={() => setStatus(entry.value)}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
        <StarRatingInput
          disabled={loading}
          onChange={setRating}
          rating={rating}
        />
        <textarea
          class="atv-interest-modal-comment"
          maxLength={350}
          onInput={(event) =>
            setComment((event.currentTarget as HTMLTextAreaElement).value)
          }
          placeholder="写一段短评…"
          rows={3}
          value={comment}
        />
        <button
          class="atv-interest-modal-submit"
          disabled={loading}
          onClick={() => void save()}
          type="button"
        >
          {loading ? "保存中..." : "保存"}
        </button>
        {state.marked ? (
          <button
            class="atv-interest-modal-remove"
            disabled={loading}
            onClick={() => void remove()}
            type="button"
          >
            取消标记
          </button>
        ) : null}
        <div class="atv-interest-modal-error">{error}</div>
      </div>
    </>
  );
};

const InterestForm = ({ callbacks, onClose, state }: InterestFormProps) => (
  <ModalShell
    ariaLabelledBy="atv-interest-modal-title"
    className="atv-interest-modal"
    id="atv-interest-modal"
    onClose={onClose}
    surfaceClassName="atv-interest-modal-inner"
  >
    <InterestFormContent callbacks={callbacks} state={state} />
  </ModalShell>
);

export { InterestForm, initialStatus, statusEntries };
export type { InterestFormProps };
