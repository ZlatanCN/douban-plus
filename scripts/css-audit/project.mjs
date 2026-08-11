import fs from "node:fs";
import path from "node:path";

import { parse as parseCss } from "postcss";

const RUNTIME_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

const readSource = (filePath) => ({
  lineOffset: 1,
  path: filePath,
  text: fs.readFileSync(filePath, "utf-8"),
});

const localImportPath = (params) => {
  const match = params.match(
    /^(?:url\(\s*)?["']?(?<path>[^"')\s]+)["']?\s*\)?/u
  );
  const importPath = match?.groups?.path;
  if (
    !importPath ||
    /^[a-z]+:/iu.test(importPath) ||
    importPath.startsWith("//")
  ) {
    return null;
  }
  return importPath;
};

const loadCssSources = (entryPath) => {
  const sources = [];
  const pending = [entryPath];
  const seen = new Set();
  while (pending.length > 0) {
    const filePath = pending.shift();
    if (!filePath || seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);
    const source = readSource(filePath);
    sources.push(source);
    let root;
    try {
      root = parseCss(source.text, { from: filePath });
    } catch {
      continue;
    }
    root.walkAtRules("import", (atRule) => {
      const imported = localImportPath(atRule.params);
      if (!imported) {
        return;
      }
      const importedPath = path.resolve(path.dirname(filePath), imported);
      if (fs.existsSync(importedPath)) {
        pending.push(importedPath);
      }
    });
  }
  return sources;
};

const listRuntimeSources = (rootPath) => {
  const sources = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (RUNTIME_EXTENSIONS.has(path.extname(entry.name))) {
        sources.push(readSource(entryPath));
      }
    }
  };
  visit(rootPath);
  return sources;
};

export { listRuntimeSources, loadCssSources };
