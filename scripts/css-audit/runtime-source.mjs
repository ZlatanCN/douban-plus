import { parse as parseJavaScript } from "@babel/parser";
import valueParser from "postcss-value-parser";

import { parseCssSource } from "./css-source.mjs";
import { splitSelectorBranches } from "./selector.mjs";

const CLASS_TOKEN = /[A-Za-z_][A-Za-z0-9_-]*/gu;

const addUnverified = (source, node, reason, state) => {
  state.unverified.push({
    file: source.path,
    line: node.loc?.start.line ?? 1,
    reason,
  });
};

const addCustomRoot = (name, source, node, state) => {
  state.customRoots.add(name);
  state.customRootLocations.set(name, {
    file: source.path,
    line: node.loc?.start.line ?? 1,
  });
};

const addClassTokens = (value, state) => {
  for (const match of value.matchAll(CLASS_TOKEN)) {
    state.staticClasses.add(match[0]);
  }
};

const getVarReferences = (value) => {
  const names = new Set();
  valueParser(value).walk((node) => {
    if (node.type !== "function" || node.value !== "var") {
      return;
    }
    const name = node.nodes.find(
      (child) => child.type === "word" && child.value.startsWith("--")
    )?.value;
    if (name) {
      names.add(name);
    }
  });
  return names;
};

const templateText = (node) =>
  node.quasis
    .map((quasi, index) =>
      index < node.expressions.length
        ? `${quasi.value.cooked ?? quasi.value.raw} `
        : (quasi.value.cooked ?? quasi.value.raw)
    )
    .join("");

const staticString = (node, bindings, seen = new Set()) => {
  if (!node) {
    return null;
  }
  if (node.type === "StringLiteral") {
    return node.value;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return templateText(node);
  }
  if (node.type === "Identifier" && bindings.has(node.name)) {
    if (seen.has(node.name)) {
      return null;
    }
    seen.add(node.name);
    return staticString(bindings.get(node.name), bindings, seen);
  }
  return null;
};

const collectClassEvidence = (node, bindings, state, seen = new Set()) => {
  if (!node || typeof node !== "object") {
    return;
  }
  if (node.type === "Identifier" && bindings.has(node.name)) {
    if (seen.has(node.name)) {
      return;
    }
    seen.add(node.name);
    collectClassEvidence(bindings.get(node.name), bindings, state, seen);
    return;
  }
  if (node.type === "StringLiteral") {
    addClassTokens(node.value, state);
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) {
      addClassTokens(quasi.value.cooked ?? quasi.value.raw, state);
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        collectClassEvidence(child, bindings, state, seen);
      }
    } else {
      collectClassEvidence(value, bindings, state, seen);
    }
  }
};

const cssTemplate = (node, bindings) => {
  if (node?.type === "StringLiteral" || node?.type === "TemplateLiteral") {
    return node;
  }
  if (node?.type !== "Identifier" || !bindings.has(node.name)) {
    return null;
  }
  const value = bindings.get(node.name);
  return value?.type === "StringLiteral" || value?.type === "TemplateLiteral"
    ? value
    : null;
};

const isCssText = (node) => {
  const text = node.type === "StringLiteral" ? node.value : templateText(node);
  return (
    text.includes("{") && /(?:--[A-Za-z0-9_-]+|[-A-Za-z]+)\s*:/u.test(text)
  );
};

const registerCssTemplate = (node, source, state, locationNode = node) => {
  if (!node) {
    addUnverified(
      source,
      locationNode ?? { loc: { start: { line: 1 } } },
      "dynamic CSS sink",
      state
    );
    return;
  }
  if (!node || !isCssText(node)) {
    return;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length > 0) {
    addUnverified(source, node, "dynamic CSS template", state);
    return;
  }
  const text = node.type === "StringLiteral" ? node.value : templateText(node);
  parseCssSource(
    {
      lineOffset: node.loc?.start.line ?? 1,
      path: source.path,
      text,
    },
    state
  );
};

const addDynamicClassPrefixes = (node, state) => {
  for (let index = 0; index < node.expressions.length; index += 1) {
    const text =
      node.quasis[index].value.cooked ?? node.quasis[index].value.raw;
    const prefix = text.match(/(?:^|\s)(?<prefix>[A-Za-z_][A-Za-z0-9_-]*)$/u)
      ?.groups?.prefix;
    if (prefix) {
      state.dynamicClassPrefixes.add(prefix);
    }
  }
};

const unwrapRuntimeValue = (node) => {
  if (
    ["TSAsExpression", "TSTypeAssertion", "TypeCastExpression"].includes(
      node?.type
    ) ||
    node?.type === "ParenthesizedExpression"
  ) {
    return node.expression;
  }
  return node;
};

const addRuntimeObjectValue = (node, bindings, state, seen) => {
  for (const property of node.properties) {
    if (property.type === "SpreadElement") {
      addRuntimeCssValue(property.argument, bindings, state, new Set(seen));
      continue;
    }
    if (property.type !== "ObjectProperty") {
      continue;
    }
    const name = property.key?.name ?? property.key?.value;
    if (typeof name === "string" && name.startsWith("--")) {
      state.runtimeProvided.add(name);
    }
    addRuntimeCssValue(property.value, bindings, state, new Set(seen));
  }
};

const addRuntimeCssValue = (input, bindings, state, seen = new Set()) => {
  const node = unwrapRuntimeValue(input);
  if (!node) {
    return;
  }
  if (node.type === "ConditionalExpression") {
    addRuntimeCssValue(node.consequent, bindings, state, new Set(seen));
    addRuntimeCssValue(node.alternate, bindings, state, new Set(seen));
    return;
  }
  if (node.type === "StringLiteral") {
    for (const name of getVarReferences(node.value)) {
      state.customRoots.add(name);
    }
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const name of getVarReferences(templateText(node))) {
      state.customRoots.add(name);
    }
    return;
  }
  if (
    node.type === "Identifier" &&
    bindings.has(node.name) &&
    !seen.has(node.name)
  ) {
    seen.add(node.name);
    addRuntimeCssValue(bindings.get(node.name), bindings, state, seen);
    return;
  }
  if (node.type !== "ObjectExpression") {
    return;
  }
  addRuntimeObjectValue(node, bindings, state, seen);
};

const addSelectorEvidence = (value, state) => {
  for (const branch of splitSelectorBranches(value)) {
    for (const name of branch.classes) {
      state.staticClasses.add(name);
    }
    for (const name of branch.ids) {
      state.staticIds.add(name);
    }
  }
};

const bindingMap = (ast) => {
  const bindings = new Map();
  walkAst(ast, (node) => {
    if (
      node.type === "VariableDeclarator" &&
      node.id?.type === "Identifier" &&
      node.init
    ) {
      bindings.set(node.id.name, node.init);
    }
  });
  return bindings;
};

const walkAst = (node, visit) => {
  if (!node || typeof node !== "object") {
    return;
  }
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        walkAst(child, visit);
      }
    } else {
      walkAst(value, visit);
    }
  }
};

const visitJsxAttribute = (node, source, bindings, state) => {
  const name = node.name?.name;
  if (
    name === "class" ||
    name === "className" ||
    (typeof name === "string" && name.endsWith("ClassName"))
  ) {
    const expression =
      node.value?.type === "JSXExpressionContainer"
        ? node.value.expression
        : node.value;
    const value = staticString(expression, bindings);
    if (value !== null) {
      addClassTokens(value, state);
      return;
    }
    collectClassEvidence(expression, bindings, state);
    if (expression?.type === "TemplateLiteral") {
      addDynamicClassPrefixes(expression, state);
      addUnverified(source, node, "dynamic class template", state);
      return;
    }
    addUnverified(source, node, "dynamic class expression", state);
  }
  if (name === "style") {
    const value =
      node.value?.type === "JSXExpressionContainer"
        ? node.value.expression
        : node.value;
    addRuntimeCssValue(value, bindings, state);
  }
};

const visitAssignment = (node, source, bindings, state) => {
  const property = node.left?.property;
  const propertyName = property?.name ?? property?.value;
  if (propertyName === "textContent" || propertyName === "innerHTML") {
    registerCssTemplate(cssTemplate(node.right, bindings), source, state, node);
  }
};

const visitClassNameDefault = (node, bindings, state) => {
  const name = node.left?.name;
  if (
    node.type !== "AssignmentPattern" ||
    (name !== "className" && !name?.endsWith("ClassName"))
  ) {
    return;
  }
  const value = staticString(node.right, bindings);
  if (value !== null) {
    addClassTokens(value, state);
    return;
  }
  collectClassEvidence(node.right, bindings, state);
};

const visitStyleCall = (node, source, bindings, state, method, firstString) => {
  if (method === "getPropertyValue" && firstString?.startsWith("--")) {
    addCustomRoot(firstString, source, node, state);
  }
  if (
    method === "get" &&
    node.callee?.object?.callee?.property?.name === "computedStyleMap" &&
    firstString?.startsWith("--")
  ) {
    addCustomRoot(firstString, source, node, state);
  }
  if (method !== "setProperty" || !firstString) {
    return;
  }
  const [, value] = node.arguments;
  if (firstString.startsWith("--")) {
    state.runtimeProvided.add(firstString);
    return;
  }
  addRuntimeCssValue(value, bindings, state);
};

const visitSelectorCall = (node, source, state, method, firstString) => {
  if (
    !["querySelector", "querySelectorAll", "matches", "closest"].includes(
      method
    )
  ) {
    return false;
  }
  if (firstString === null) {
    addUnverified(source, node, "dynamic DOM selector", state);
    return true;
  }
  addSelectorEvidence(firstString, state);
  return true;
};

const visitClassLookup = (method, firstString, state) => {
  if (method === "getElementsByClassName" && firstString !== null) {
    addClassTokens(firstString, state);
  }
  if (method === "getElementById" && firstString !== null) {
    state.staticIds.add(firstString);
  }
};

const visitClassListCall = (node, source, bindings, state, method) => {
  if (
    !["add", "remove", "toggle", "contains"].includes(method) ||
    node.callee?.object?.property?.name !== "classList"
  ) {
    return;
  }
  for (const argument of node.arguments) {
    const value = staticString(argument, bindings);
    if (value === null) {
      addUnverified(source, node, "dynamic classList value", state);
      continue;
    }
    addClassTokens(value, state);
  }
};

const visitCallExpression = (node, source, bindings, state) => {
  const method = node.callee?.property?.name;
  const [firstArgument] = node.arguments;
  const firstString = staticString(firstArgument, bindings);
  if (
    node.callee?.type === "Identifier" &&
    node.callee.name === "GM_addStyle"
  ) {
    registerCssTemplate(
      cssTemplate(firstArgument, bindings),
      source,
      state,
      node
    );
  }
  visitStyleCall(node, source, bindings, state, method, firstString);
  if (visitSelectorCall(node, source, state, method, firstString)) {
    return;
  }
  visitClassLookup(method, firstString, state);
  visitClassListCall(node, source, bindings, state, method);
};

const visitAttributeCall = (node, source, bindings, state) => {
  const method = node.callee?.property?.name;
  if (method !== "setAttribute") {
    return;
  }
  const [firstArgument, valueArgument] = node.arguments;
  const attribute = staticString(firstArgument, bindings);
  const value = staticString(valueArgument, bindings);
  if (attribute === null || value === null) {
    addUnverified(source, node, "dynamic DOM attribute", state);
    return;
  }
  if (attribute === "class") {
    addClassTokens(value, state);
  }
  if (attribute === "id") {
    state.staticIds.add(value);
  }
};

const parseRuntimeSource = (source, state) => {
  let ast;
  try {
    const isJsx = /\.(?:jsx|tsx)$/u.test(source.path);
    const isTypeScript = /\.(?:ts|tsx)$/u.test(source.path);
    ast = parseJavaScript(source.text, {
      errorRecovery: false,
      plugins: [
        ...(isJsx ? ["jsx"] : []),
        ...(isTypeScript ? ["typescript"] : []),
      ],
      sourceType: "unambiguous",
    });
  } catch (error) {
    state.errors.push({
      file: source.path,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const bindings = bindingMap(ast);
  walkAst(ast, (node) => {
    if (node.type === "JSXAttribute") {
      visitJsxAttribute(node, source, bindings, state);
    }
    if (node.type === "AssignmentExpression") {
      visitAssignment(node, source, bindings, state);
    }
    if (node.type === "AssignmentPattern") {
      visitClassNameDefault(node, bindings, state);
    }
    if (node.type === "CallExpression") {
      visitCallExpression(node, source, bindings, state);
      visitAttributeCall(node, source, bindings, state);
    }
  });
};

const parseRuntimeSources = (sources, state) => {
  for (const source of sources) {
    parseRuntimeSource(source, state);
  }
};

export { parseRuntimeSources };
