import { useEffect, useState } from "preact/hooks";

import {
  ModalCloseButton,
  ModalSessionContent,
  ModalShell,
} from "@/components/modal";
import { useModalClose } from "@/components/modal/modal-close-context";
import type {
  InterestFormSnapshot,
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "@/types";
import { normalizeInterestTags } from "@/utils/interest-tags";

import { InterestFormFields } from "./interest-form-fields";
import type { InterestFormSource } from "./interest-form-source";

type InterestFormProps = {
  callbacks: ModalCallbacks;
  onClose: () => void;
  onRetry?: () => void;
  source: InterestFormSource;
  state: InterestState;
};

const initialStatus = (state: InterestState): InterestFormState["status"] =>
  state.status === "none" ? "wish" : state.status;

const formFrom = (
  state: InterestState,
  snapshot: InterestFormSnapshot | null
): InterestFormState => ({
  comment: state.comment || "",
  isPrivate: snapshot?.isPrivate ?? false,
  rating: state.rating || 0,
  shareToBroadcast: snapshot?.shareToBroadcast ?? false,
  status:
    snapshot?.status && snapshot.status !== "none"
      ? snapshot.status
      : initialStatus(state),
  tags: snapshot?.tags ?? state.tags,
});

const InterestFormContent = ({
  callbacks,
  onRetry,
  source,
  state,
}: Omit<InterestFormProps, "onClose">) => {
  const handleClose = useModalClose();
  const snapshot = source.kind === "ready" ? source.snapshot : null;
  const [loadedSnapshot, setLoadedSnapshot] = useState(snapshot);
  const [form, setForm] = useState<InterestFormState>(() =>
    formFrom(state, snapshot)
  );
  const [tagDraft, setTagDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [error, setError] = useState("");
  const disabled = loading || source.kind !== "ready";
  const isExistingMark = snapshot ? snapshot.status !== "none" : state.marked;

  useEffect(() => {
    if (snapshot && snapshot !== loadedSnapshot) {
      setForm(formFrom(state, snapshot));
      setTagDraft("");
      setLoadedSnapshot(snapshot);
    }
  }, [loadedSnapshot, snapshot, state]);

  const updateForm = (patch: Partial<InterestFormState>): void => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const updateTags = (update: (tags: string[]) => string[]): void => {
    setForm((current) => ({ ...current, tags: update(current.tags) }));
  };
  const save = async (): Promise<void> => {
    if (disabled) {
      return;
    }
    setLoading(true);
    setError("");
    const result = await callbacks.onSave({
      ...form,
      comment: form.comment.trim(),
      tags: normalizeInterestTags([...form.tags, tagDraft]),
    });
    if (result.ok) {
      handleClose();
      return;
    }
    setError(result.error || "保存失败");
    setLoading(false);
  };
  const remove = async (): Promise<void> => {
    if (disabled) {
      return;
    }
    setLoading(true);
    setError("");
    const result = await callbacks.onRemove(form.status);
    if (result.ok) {
      handleClose();
      return;
    }
    setError(result.error || "取消标记失败");
    setLoading(false);
  };

  return (
    <>
      <div class="atv-modal-accent-bar" />
      <div class="atv-interest-modal-header">
        <span
          class="atv-interest-modal-header-title"
          id="atv-interest-modal-title"
        >
          {isExistingMark ? "编辑作品标记" : "标记作品"}
        </span>
        <ModalCloseButton
          ariaLabel="关闭标记弹窗"
          className="atv-interest-modal-close"
          onClick={handleClose}
        />
      </div>
      <div class="atv-interest-modal-body">
        <InterestFormFields
          disabled={disabled}
          form={form}
          onFormChange={updateForm}
          {...(onRetry ? { onRetry } : {})}
          onTagDraftChange={setTagDraft}
          onTagsChange={updateTags}
          source={source}
          state={state}
          tagDraft={tagDraft}
        />
        {confirmingRemoval ? (
          <div class="atv-interest-modal-removal-confirmation" role="alert">
            <span>取消这条作品标记？</span>
            <div>
              <button onClick={() => setConfirmingRemoval(false)} type="button">
                保留标记
              </button>
              <button
                disabled={disabled}
                onClick={() => void remove()}
                type="button"
              >
                确认取消
              </button>
            </div>
          </div>
        ) : (
          <div class="atv-interest-modal-actions">
            <button
              class="atv-interest-modal-submit"
              disabled={disabled}
              onClick={() => void save()}
              type="button"
            >
              {loading ? "保存中..." : "保存标记"}
            </button>
            {isExistingMark ? (
              <button
                class="atv-interest-modal-remove"
                disabled={disabled}
                onClick={() => setConfirmingRemoval(true)}
                type="button"
              >
                取消标记
              </button>
            ) : null}
          </div>
        )}
        <div class="atv-interest-modal-error">{error}</div>
      </div>
    </>
  );
};

const InterestForm = ({
  callbacks,
  onClose,
  onRetry,
  source,
  state,
}: InterestFormProps) => (
  <ModalShell
    ariaLabelledBy="atv-interest-modal-title"
    className="atv-interest-modal"
    id="atv-interest-modal"
    onClose={onClose}
    surfaceClassName="atv-interest-modal-inner"
  >
    <ModalSessionContent>
      <InterestFormContent
        callbacks={callbacks}
        {...(onRetry ? { onRetry } : {})}
        source={source}
        state={state}
      />
    </ModalSessionContent>
  </ModalShell>
);

export { InterestForm, initialStatus };
export type { InterestFormProps };
