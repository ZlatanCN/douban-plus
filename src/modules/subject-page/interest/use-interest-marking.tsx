import type { JSX } from "preact";

import { ModalSession } from "@/components/modal";
import type {
  HeroCallbacks,
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "@/types";

import { useModalRequest } from "../use-modal-request";
import { InterestForm } from "./interest-form";

type InterestResult = {
  error?: string;
  ok: boolean;
};

type InterestMarkingAdapters = {
  post: (
    subjectId: string,
    status: InterestFormState["status"],
    options?: { comment?: string; rating?: number }
  ) => Promise<InterestResult>;
  reload: () => void;
  remove: (
    subjectId: string,
    status: InterestState["status"]
  ) => Promise<InterestResult>;
};

type UseInterestMarkingOptions = {
  adapters: InterestMarkingAdapters;
  loggedIn: boolean;
  onFirstMarkSaved: (previous: InterestState, form: InterestFormState) => void;
  onLoginRequired: (action: string) => void;
  subjectId: string;
};

type InterestMarking = {
  callbacks: HeroCallbacks;
  form: JSX.Element | null;
};

const saveOptionsFromForm = (
  form: InterestFormState
): { comment: string; rating?: number } => ({
  comment: form.comment,
  ...(form.rating > 0 ? { rating: form.rating } : {}),
});

const interestFromSavedForm = (
  previous: InterestState,
  form: InterestFormState
): InterestState => ({
  ...previous,
  comment: form.comment,
  marked: true,
  rating: form.rating,
  status: form.status,
});

const useInterestMarking = ({
  adapters,
  loggedIn,
  onFirstMarkSaved,
  onLoginRequired,
  subjectId,
}: UseInterestMarkingOptions): InterestMarking => {
  const activeInterest = useModalRequest<InterestState>();
  const { post, reload, remove } = adapters;

  const requireLogin = (action: string): boolean => {
    if (loggedIn) {
      return true;
    }
    onLoginRequired(action);
    return false;
  };

  const callbacks: HeroCallbacks = {
    handleOpenInterest: (state, action = "标记这部作品") => {
      if (!requireLogin(action)) {
        return;
      }
      activeInterest.handleOpen(state);
    },
  };

  const formCallbacks: ModalCallbacks = {
    onRemove: async (status) => {
      const result = await remove(subjectId, status);
      if (result.ok) {
        reload();
      }
      return result;
    },
    onSave: async (form) => {
      const previous = activeInterest.active?.value;
      const result = await post(
        subjectId,
        form.status,
        saveOptionsFromForm(form)
      );
      if (result.ok) {
        if (previous && !previous.marked) {
          onFirstMarkSaved(previous, form);
        } else {
          reload();
        }
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
          state={activeInterest.active.value}
        />
      </ModalSession>
    ) : null,
  };
};

export { interestFromSavedForm, useInterestMarking };
export type {
  InterestMarking,
  InterestMarkingAdapters,
  UseInterestMarkingOptions,
};
