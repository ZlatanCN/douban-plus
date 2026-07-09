import { IconClose } from "@/components/common/icons";

type ModalCloseButtonProps = {
  ariaLabel: string;
  className?: string;
  onClick: () => void;
  size?: 16 | 18 | 22;
};

const ModalCloseButton = ({
  ariaLabel,
  className = "atv-modal-close",
  onClick,
  size = 22,
}: ModalCloseButtonProps) => (
  <button
    aria-label={ariaLabel}
    class={className}
    onClick={onClick}
    type="button"
  >
    <IconClose size={size} />
  </button>
);

export { ModalCloseButton };
export type { ModalCloseButtonProps };
