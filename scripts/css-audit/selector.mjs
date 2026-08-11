import selectorParser from "postcss-selector-parser";

const parseSelectorBranch = (selector) => {
  const classes = new Set();
  const ids = new Set();
  const attributes = new Set();

  selectorParser((root) => {
    root.walkClasses((node) => classes.add(node.value));
    root.walkIds((node) => ids.add(node.value));
    root.walkAttributes((node) => {
      if (node.attribute) {
        attributes.add(node.attribute);
      }
    });
  }).processSync(selector);

  return {
    attributes: [...attributes],
    classes: [...classes],
    ids: [...ids],
    owned: [...classes, ...ids].some(
      (name) => name.startsWith("atv-") || name.startsWith("atv")
    ),
    selector: selector.trim(),
  };
};

const splitSelectorBranches = (selector) => {
  const branches = [];
  selectorParser((root) => {
    root.each((node) => branches.push(node.toString()));
  }).processSync(selector);
  return branches.map(parseSelectorBranch);
};

export { splitSelectorBranches };
