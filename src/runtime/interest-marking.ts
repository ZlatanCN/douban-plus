import { postInterest, removeInterest } from "@/api/interest";
import { proxyInterestAction } from "@/extract/interest";
import { openInterestModal } from "@/modules/subject-page/interest";
import type {
  HeroCallbacks,
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "@/types";

import { createAccountGate } from "./account-gate";
import type { AccountGate } from "./account-gate";

type InterestResult = {
  ok: boolean;
  error?: string;
};

type InterestMarkingAdapters = {
  accountGate?: AccountGate;
  doc?: Document;
  loggedIn?: boolean;
  openModal?: (state: InterestState, callbacks: ModalCallbacks) => void;
  post?: (
    subjectId: string,
    interest: InterestFormState["status"],
    options?: { rating?: number; comment?: string; tags?: string[] }
  ) => Promise<InterestResult>;
  reload?: () => void;
  remove?: (
    subjectId: string,
    currentStatus: InterestState["status"]
  ) => Promise<InterestResult>;
};

const reloadPage = (): void => {
  location.reload();
};

const saveOptionsFromForm = (
  form: InterestFormState
): { comment: string; rating?: number } => ({
  comment: form.comment,
  rating: form.rating > 0 ? form.rating : undefined,
});

const buildModalCallbacks = (
  subjectId: string,
  adapters: Required<
    Pick<InterestMarkingAdapters, "post" | "reload" | "remove">
  >
): ModalCallbacks => ({
  onRemove: async (status) => {
    const result = await adapters.remove(subjectId, status);
    if (result.ok) {
      adapters.reload();
    }
    return result;
  },
  onSave: async (form) => {
    const result = await adapters.post(
      subjectId,
      form.status,
      saveOptionsFromForm(form)
    );
    if (result.ok) {
      adapters.reload();
    }
    return result;
  },
});

const buildInterestMarkingCallbacks = (
  subjectId: string,
  adapters: InterestMarkingAdapters = {}
): HeroCallbacks => {
  const doc = adapters.doc ?? document;
  const accountGate =
    adapters.accountGate ??
    createAccountGate({ loggedIn: adapters.loggedIn ?? true });
  const modalAdapters = {
    post: adapters.post ?? postInterest,
    reload: adapters.reload ?? reloadPage,
    remove: adapters.remove ?? removeInterest,
  };
  const openModal = adapters.openModal ?? openInterestModal;

  return {
    handleCollectClick: () => {
      if (!accountGate.requireLogin("标记看过")) {
        return;
      }
      proxyInterestAction(doc, "collect");
    },
    handleOpenInterest: (state) => {
      if (!accountGate.requireLogin("标记这部作品")) {
        return;
      }
      openModal(state, buildModalCallbacks(subjectId, modalAdapters));
    },
    handleWatchingClick: () => {
      if (!accountGate.requireLogin("标记在看")) {
        return;
      }
      proxyInterestAction(doc, "do");
    },
    handleWishClick: () => {
      if (!accountGate.requireLogin("标记想看")) {
        return;
      }
      proxyInterestAction(doc, "wish");
    },
  };
};

export { buildInterestMarkingCallbacks };
