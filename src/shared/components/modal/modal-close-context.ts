import { createContext } from "preact";
import { useContext } from "preact/hooks";

const ModalCloseContext = createContext<(() => void) | null>(null);

const useModalClose = (): (() => void) => {
  const close = useContext(ModalCloseContext);
  if (!close) {
    throw new Error("useModalClose must be used inside a ModalShell");
  }
  return close;
};

export { ModalCloseContext, useModalClose };
