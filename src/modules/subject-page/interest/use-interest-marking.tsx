import type { JSX } from "preact";
import { useState } from "preact/hooks";

import type {
  HeroCallbacks,
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "@/types";

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
  rating: form.rating > 0 ? form.rating : undefined,
});

const useInterestMarking = ({
  adapters,
  loggedIn,
  onLoginRequired,
  subjectId,
}: UseInterestMarkingOptions): InterestMarking => {
  const [activeInterest, setActiveInterest] = useState<InterestState | null>(
    null
  );
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
      setActiveInterest(state);
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
      const result = await post(
        subjectId,
        form.status,
        saveOptionsFromForm(form)
      );
      if (result.ok) {
        reload();
      }
      return result;
    },
  };

  return {
    callbacks,
    form: activeInterest ? (
      <InterestForm
        callbacks={formCallbacks}
        onClose={() => setActiveInterest(null)}
        state={activeInterest}
      />
    ) : null,
  };
};

export { useInterestMarking };
export type {
  InterestMarking,
  InterestMarkingAdapters,
  UseInterestMarkingOptions,
};
