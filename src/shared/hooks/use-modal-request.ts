import { useCallback, useState } from "preact/hooks";

type ModalRequest<T> = {
  value: T;
};

type ModalRequestController<T> = {
  active: ModalRequest<T> | null;
  handleClose: () => void;
  handleOpen: (value: T) => void;
};

const useModalRequest = <T>(): ModalRequestController<T> => {
  const [active, setActive] = useState<ModalRequest<T> | null>(null);

  const handleClose = useCallback((): void => setActive(null), []);
  const handleOpen = useCallback((value: T): void => {
    setActive({ value });
  }, []);

  return { active, handleClose, handleOpen };
};

export { useModalRequest, type ModalRequest, type ModalRequestController };
