import { render } from "preact";

import type { InterestState, ModalCallbacks } from "../../../types";
import { InterestForm } from "./interest-form";

const openInterestModal = (
  state: InterestState,
  callbacks: ModalCallbacks
): void => {
  document.querySelector("#atv-interest-modal")?.remove();

  const host = document.createElement("div");
  document.body.append(host);

  const close = (): void => {
    render(null, host);
    host.remove();
  };

  render(
    <InterestForm callbacks={callbacks} onClose={close} state={state} />,
    host
  );
};

export { openInterestModal };
