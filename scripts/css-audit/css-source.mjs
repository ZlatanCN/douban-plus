import { parse as parseCss } from "postcss";
import valueParser from "postcss-value-parser";

import { locationOf } from "./model.mjs";
import { splitSelectorBranches } from "./selector.mjs";

const getVarReferences = (value) => {
  const references = new Set();
  valueParser(value).walk((node) => {
    if (node.type !== "function" || node.value !== "var") {
      return;
    }
    const name = node.nodes.find(
      (child) => child.type === "word" && child.value.startsWith("--")
    )?.value;
    if (name) {
      references.add(name);
    }
  });
  return [...references];
};

const getAnimationNames = (value) => {
  const names = new Set();
  valueParser(value).walk((node) => {
    if (
      node.type === "word" &&
      !/^\d|^(?:none|infinite|normal|reverse|alternate|both|forwards|backwards|running|paused|ease(?:-in|-out)?|linear)$/iu.test(
        node.value
      )
    ) {
      names.add(node.value);
    }
  });
  return [...names];
};

const parseCssSource = (source, state) => {
  let root;
  try {
    root = parseCss(source.text, { from: source.path });
  } catch (error) {
    state.errors.push({
      file: source.path,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const ruleIds = new WeakMap();
  root.walkRules((rule) => {
    const id = `${source.path}:${state.cssRules.length}`;
    ruleIds.set(rule, id);
    let branches;
    try {
      branches = splitSelectorBranches(rule.selector);
    } catch (error) {
      state.errors.push({
        file: source.path,
        line: locationOf(source, rule).line,
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    state.cssRules.push({
      id,
      ...locationOf(source, rule),
      branches: branches.map((branch) => ({
        ...branch,
        ...locationOf(source, rule),
      })),
    });
  });

  const nearestRuleId = (node) => {
    const { parent: initialParent } = node;
    let parent = initialParent;
    while (parent) {
      if (parent.type === "rule") {
        return ruleIds.get(parent) ?? null;
      }
      const { parent: nextParent } = parent;
      parent = nextParent;
    }
    return null;
  };

  root.walkDecls((declaration) => {
    const dependencies = getVarReferences(declaration.value);
    const record = {
      ...locationOf(source, declaration),
      dependencies,
      prop: declaration.prop,
      ruleId: nearestRuleId(declaration),
    };
    state.declarations.push(record);
    if (declaration.prop.startsWith("--")) {
      state.customProperties.push({ ...record, name: declaration.prop });
      return;
    }
    if (
      declaration.prop === "animation" ||
      declaration.prop === "animation-name"
    ) {
      for (const name of getAnimationNames(declaration.value)) {
        state.animationReferences.push({
          ...locationOf(source, declaration),
          name,
          ruleId: record.ruleId,
        });
      }
    }
  });

  root.walkAtRules((atRule) => {
    if (/^(?:-\w+-)?keyframes$/iu.test(atRule.name)) {
      state.keyframes.push({
        ...locationOf(source, atRule),
        name: atRule.params.trim().split(/\s+/u)[0],
      });
    }
  });
};

const parseCssSources = (sources, state) => {
  for (const source of sources) {
    parseCssSource(source, state);
  }
};

export { parseCssSource, parseCssSources };
