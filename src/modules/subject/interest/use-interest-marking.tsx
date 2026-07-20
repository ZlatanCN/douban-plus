import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { ModalSession } from "@/components/modal";
import { useModalRequest } from "@/hooks/use-modal-request";
import type {
  HeroCallbacks,
  InterestFormState,
  InterestMarkingActions,
  InterestState,
  InterestWriteOptions,
  ModalCallbacks,
} from "@/types";

import { InterestForm } from "./interest-form";
import type { InterestFormSource } from "./interest-form-source";

type UseInterestMarkingOptions = {
  adapters: InterestMarkingActions;
  loggedIn: boolean;
  onLoginRequired: (action: string) => void;
  onInterestChange: (interest: InterestState) => void;
  subjectId: string;
  subjectTitle: string;
};

type InterestMarking = {
  callbacks: HeroCallbacks;
  form: JSX.Element | null;
};

const saveOptionsFromForm = (
  form: InterestFormState
): InterestWriteOptions => ({
  comment: form.comment,
  isPrivate: form.isPrivate,
  ...(form.status === "collect" && form.rating > 0
    ? { rating: form.rating }
    : {}),
  shareToBroadcast: form.isPrivate ? false : form.shareToBroadcast,
  tags: form.tags,
});

/**
 * Projects a confirmed form submission into the state rendered in Hero.
 * Visibility changes do not alter the current user's own collection data.
 */
const interestFromSavedForm = (
  interest: InterestState,
  form: InterestFormState
): InterestState => ({
  ...interest,
  comment: form.comment,
  marked: true,
  rating: form.status === "collect" ? form.rating : 0,
  status: form.status,
  tags: form.tags,
  usefulCount: "",
});

const interestAfterRemoval = (interest: InterestState): InterestState => ({
  ...interest,
  comment: "",
  date: "",
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
});

const useInterestMarking = ({
  adapters,
  loggedIn,
  onLoginRequired,
  onInterestChange,
  subjectId,
  subjectTitle,
}: UseInterestMarkingOptions): InterestMarking => {
  const activeInterest = useModalRequest<InterestState>();
  const { fetch, post, remove } = adapters;
  const [source, setSource] = useState<InterestFormSource>({
    kind: "loading",
  });
  const [retrySequence, setRetrySequence] = useState(0);

  useEffect(() => {
    if (!activeInterest.active) {
      return;
    }
    let cancelled = false;
    const loadSnapshot = async (): Promise<void> => {
      try {
        const snapshot = await fetch(subjectId);
        if (!cancelled) {
          setSource({ kind: "ready", snapshot });
        }
      } catch (error) {
        if (!cancelled) {
          setSource({
            kind: "error",
            message:
              error instanceof Error ? error.message : "无法读取完整标记",
          });
        }
      }
    };
    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [activeInterest.active, fetch, retrySequence, subjectId]);

  const requireLogin = (action: string): boolean => {
    if (loggedIn) {
      return true;
    }
    onLoginRequired(action);
    return false;
  };

  const callbacks: HeroCallbacks = {
    handleOpenInterest: (state, options = {}) => {
      const action = options.action || "标记这部作品";
      if (!requireLogin(action)) {
        return;
      }
      setSource({ kind: "loading" });
      activeInterest.handleOpen(
        !state.marked && options.status
          ? { ...state, status: options.status }
          : state
      );
    },
  };

  const retry = (): void => {
    setSource({ kind: "loading" });
    setRetrySequence((current) => current + 1);
  };

  const formCallbacks: ModalCallbacks = {
    onRemove: async (status) => {
      const result = await remove(subjectId, status);
      if (result.ok && activeInterest.active) {
        onInterestChange(interestAfterRemoval(activeInterest.active.value));
      }
      return result;
    },
    onSave: async (form) => {
      const result = await post(
        subjectId,
        form.status,
        saveOptionsFromForm(form)
      );
      if (result.ok && activeInterest.active) {
        onInterestChange(
          interestFromSavedForm(activeInterest.active.value, form)
        );
      }
      return result;
    },
  };

  return {
    callbacks,
    form: activeInterest.active ? (
      <ModalSession request={activeInterest.active}>
        <InterestForm
          callbacks={formCallbacks}
          onClose={activeInterest.handleClose}
          onRetry={retry}
          source={source}
          state={activeInterest.active.value}
          subjectTitle={subjectTitle}
        />
      </ModalSession>
    ) : null,
  };
};

export { interestAfterRemoval, interestFromSavedForm, useInterestMarking };
export type { InterestMarking, UseInterestMarkingOptions };
