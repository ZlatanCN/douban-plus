import { render } from "preact";
import type { ComponentChild } from "preact";

const renderIntoRoot = (node: ComponentChild): HTMLElement => {
  const root = document.createElement("div");
  render(node, root);
  return root;
};

const renderSingle = <T extends Element = HTMLElement>(
  node: ComponentChild
): T => {
  const root = renderIntoRoot(node);
  const child = root.firstElementChild;
  if (!child) {
    throw new Error("Expected render to produce an element.");
  }
  return child as T;
};

export { renderIntoRoot, renderSingle };
