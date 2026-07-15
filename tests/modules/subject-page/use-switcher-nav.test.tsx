import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSwitcherNav } from "@/modules/subject-page/search/use-switcher-nav";

type Item = { id: string };

const sampleItems: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

const TestHarness = ({
  items,
  handleSelect,
  handleSubmit,
  handleClose,
}: {
  items: Item[];
  handleSelect: (item: Item) => void;
  handleSubmit: () => void;
  handleClose: () => void;
}) => {
  const nav = useSwitcherNav({
    items,
    onClose: handleClose,
    onSelect: handleSelect,
    onSubmit: handleSubmit,
  });
  return (
    <div>
      <span data-testid="active-index">{nav.activeIndex}</span>
      <span data-testid="active-id">
        {nav.activeItem ? nav.activeItem.id : "none"}
      </span>
      <button data-testid="reset" onClick={nav.handleReset} type="button">
        reset
      </button>
      <input data-testid="input" onKeyDown={nav.handleKeyDown} type="text" />
    </div>
  );
};

const renderHarness = (
  items: Item[],
  handlers?: {
    onSelect?: (item: Item) => void;
    onSubmit?: () => void;
    onClose?: () => void;
  }
): HTMLElement => {
  const handleClose = handlers?.onClose ?? vi.fn<() => void>();
  const handleSelect = handlers?.onSelect ?? vi.fn<(item: Item) => void>();
  const handleSubmit = handlers?.onSubmit ?? vi.fn<() => void>();
  const root = document.createElement("div");
  render(
    <TestHarness
      handleClose={handleClose}
      handleSelect={handleSelect}
      handleSubmit={handleSubmit}
      items={items}
    />,
    root
  );
  return root;
};

const pressKey = async (root: HTMLElement, key: string): Promise<void> => {
  root
    .querySelector<HTMLInputElement>('[data-testid="input"]')
    ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  await Promise.resolve();
};

const clickReset = async (root: HTMLElement): Promise<void> => {
  root.querySelector<HTMLButtonElement>('[data-testid="reset"]')?.click();
  await Promise.resolve();
};

const activeIndex = (root: HTMLElement): string =>
  root.querySelector('[data-testid="active-index"]')?.textContent ?? "";

const activeId = (root: HTMLElement): string =>
  root.querySelector('[data-testid="active-id"]')?.textContent ?? "";

describe(useSwitcherNav, () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("moves down the list with ArrowDown and clamps at the end", async () => {
    const root = renderHarness(sampleItems);

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("0");
    expect(activeId(root)).toBe("a");

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("1");

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("2");

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("2");
  });

  it("wraps ArrowUp from the start to the last item", async () => {
    const root = renderHarness(sampleItems);

    await pressKey(root, "ArrowUp");
    expect(activeIndex(root)).toBe("2");
    expect(activeId(root)).toBe("c");
  });

  it("wraps ArrowDown then ArrowUp around the boundary", async () => {
    const root = renderHarness(sampleItems);

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("0");

    await pressKey(root, "ArrowUp");
    expect(activeIndex(root)).toBe("2");
    expect(activeId(root)).toBe("c");

    await pressKey(root, "ArrowUp");
    expect(activeIndex(root)).toBe("1");
  });

  it("selects the active item on Enter", async () => {
    const onSelect = vi.fn<(item: Item) => void>();
    const root = renderHarness(sampleItems, { onSelect });

    await pressKey(root, "ArrowDown");
    await pressKey(root, "ArrowDown");
    await pressKey(root, "Enter");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ id: "b" });
  });

  it("submits when Enter is pressed with no active item", async () => {
    const onSubmit = vi.fn<() => void>();
    const onSelect = vi.fn<(item: Item) => void>();
    const root = renderHarness(sampleItems, { onSelect, onSubmit });

    await pressKey(root, "Enter");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderHarness(sampleItems, { onClose });

    await pressKey(root, "Escape");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clears the active index via reset", async () => {
    const root = renderHarness(sampleItems);

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("0");

    await clickReset(root);
    expect(activeIndex(root)).toBe("-1");
  });

  it("auto-resets the active index when the item list empties", async () => {
    const root = renderHarness(sampleItems);

    await pressKey(root, "ArrowDown");
    expect(activeIndex(root)).toBe("0");

    const handleClose = vi.fn<() => void>();
    const handleSelect = vi.fn<(item: Item) => void>();
    const handleSubmit = vi.fn<() => void>();
    render(
      <TestHarness
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleSubmit={handleSubmit}
        items={[]}
      />,
      root
    );
    await vi.waitFor(() => {
      expect(activeIndex(root)).toBe("-1");
    });
    expect(activeId(root)).toBe("none");
  });

  it("ignores navigation keys when the list is empty", async () => {
    const root = renderHarness([]);

    await pressKey(root, "ArrowDown");
    await pressKey(root, "ArrowUp");
    expect(activeIndex(root)).toBe("-1");
  });
});
