import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

type UseSwitcherNavOptions<T> = {
  items: readonly T[];
  onSelect: (item: T) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * Owns combobox keyboard navigation: activeIndex state, ArrowUp/Down
 * wrap-around, Enter (select active or submit), and Escape (close). The active
 * index resets automatically when the item list empties (e.g. on close or
 * query change), so callers never clear it by hand.
 */
const useSwitcherNav = <T>({
  items,
  onSelect,
  onSubmit,
  onClose,
}: UseSwitcherNavOptions<T>) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeItem = items[activeIndex] ?? null;

  useEffect(() => {
    if (!items.length) {
      setActiveIndex(-1);
    }
  }, [items.length]);

  const handleReset = (): void => {
    setActiveIndex(-1);
  };

  const handleKeyDown = (
    event: JSX.TargetedKeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, items.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? items.length - 1 : current - 1
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeItem) {
        onSelect(activeItem);
      } else {
        onSubmit();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return { activeIndex, activeItem, handleKeyDown, handleReset };
};

export { useSwitcherNav, type UseSwitcherNavOptions };
