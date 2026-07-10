import { openImperativeModal } from "@/components/modal";
import type { InterestState, ModalCallbacks } from "@/types";

import { InterestForm } from "./interest-form";

const openInterestModal = (
  state: InterestState,
  callbacks: ModalCallbacks
): void => {
  openImperativeModal({
    content: (close) => (
      <InterestForm callbacks={callbacks} onClose={close} state={state} />
    ),
    id: "atv-interest-modal",
  });
};

export { openInterestModal };
