import { postInterest, removeInterest } from "../api/interest";
import { openInterestModal } from "../components";
import { findInterestButtons } from "../extract";
import type {
  HeroCallbacks,
  InterestFormState,
  InterestState,
  ModalCallbacks,
} from "../types";

type InterestResult = { ok: boolean; error?: string };

type InterestMarkingAdapters = {
  doc?: Document;
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
  const interestBtns = findInterestButtons(doc);
  const modalAdapters = {
    post: adapters.post ?? postInterest,
    reload: adapters.reload ?? reloadPage,
    remove: adapters.remove ?? removeInterest,
  };
  const openModal = adapters.openModal ?? openInterestModal;

  return {
    onCollectClick: () => interestBtns.collect?.click(),
    onOpenInterest: (state) => {
      openModal(state, buildModalCallbacks(subjectId, modalAdapters));
    },
    onWatchingClick: () => interestBtns.do?.click(),
    onWishClick: () => interestBtns.wish?.click(),
  };
};

export { buildInterestMarkingCallbacks };
export type { InterestMarkingAdapters };
