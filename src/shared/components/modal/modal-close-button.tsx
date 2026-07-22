import { IconClose } from "@/shared/components/common/icons";

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
}: ModalCloseButtonProps) => {
  const classNames = className.split(/\s+/u);
  const buttonClass = classNames.includes("atv-modal-close")
    ? className
    : `atv-modal-close ${className}`;
  return (
    <button
      aria-label={ariaLabel}
      class={buttonClass}
      onClick={onClick}
      type="button"
    >
      <IconClose size={size} />
    </button>
  );
};

export { ModalCloseButton };
export type { ModalCloseButtonProps };
