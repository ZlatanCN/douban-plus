import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = path.join(process.cwd(), "src");
const moduleNames = ["personage", "subject"] as const;

const sourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return sourceFiles(entryPath);
      }
      return /\.[jt]sx?$/u.test(entry.name) ? [entryPath] : [];
    })
  );
  return nested.flat();
};

const importsOf = async (filePath: string): Promise<string[]> => {
  const source = await readFile(filePath, "utf-8");
  const patterns = [
    /\bfrom\s+["'](?<specifier>[^"']+)["']/gu,
    /\bimport\s*\(\s*["'](?<specifier>[^"']+)["']/gu,
    /\bimport\s+["'](?<specifier>[^"']+)["']/gu,
  ];
  return patterns.flatMap((pattern) =>
    [...source.matchAll(pattern)].flatMap((match) =>
      match.groups?.specifier ? [match.groups.specifier] : []
    )
  );
};

const importsIn = async (directory: string) => {
  const files = await sourceFiles(directory);
  return Promise.all(
    files.map(async (filePath) => ({
      filePath,
      specifiers: await importsOf(filePath),
    }))
  );
};

const exportedNamesOf = (source: string): string[] =>
  [...source.matchAll(/\bexport\s*\{(?<names>[^}]+)\}/gu)].flatMap((match) =>
    (match.groups?.names ?? "")
      .split(",")
      .map((name) =>
        name
          .trim()
          .split(/\s+as\s+/u)
          .at(-1)
      )
      .filter((name): name is string => Boolean(name))
  );

const sourceRelativeSpecifier = (
  filePath: string,
  specifier: string
): string | null => {
  if (specifier.startsWith("@/")) {
    return specifier.slice(2);
  }
  if (!specifier.startsWith(".")) {
    return null;
  }
  return path.relative(
    sourceRoot,
    path.resolve(path.dirname(filePath), specifier)
  );
};

describe("page module boundaries", () => {
  it("resolves aliased and relative module specifiers before enforcing boundaries", () => {
    const sharedFile = path.join(sourceRoot, "shared", "boundary-test.ts");
    expect(
      sourceRelativeSpecifier(sharedFile, "@/modules/subject/api/comment")
    ).toBe("modules/subject/api/comment");
    expect(
      sourceRelativeSpecifier(sharedFile, "../modules/subject/api/comment")
    ).toBe("modules/subject/api/comment");
  });

  it("exposes only the agreed public API for each page module", async () => {
    const [personageEntry, subjectEntry] = await Promise.all(
      moduleNames.map((moduleName) =>
        readFile(
          path.join(sourceRoot, "modules", moduleName, "index.ts"),
          "utf-8"
        )
      )
    );
    expect(exportedNamesOf(personageEntry).toSorted()).toStrictEqual([
      "mountPersonage",
      "personagePage",
    ]);
    expect(exportedNamesOf(subjectEntry).toSorted()).toStrictEqual([
      "mountSubject",
      "mountSubjectLoginFrameIfNeeded",
      "subjectPage",
    ]);
  });

  it("uses page modules only from the route entry through their public API", async () => {
    const violations: string[] = [];
    for (const { filePath, specifiers } of await importsIn(sourceRoot)) {
      const from = path.relative(sourceRoot, filePath);
      for (const specifier of specifiers) {
        const target = sourceRelativeSpecifier(filePath, specifier);
        if (!target?.startsWith("modules/")) {
          continue;
        }
        const [importedModule, ...rest] = target
          .slice("modules/".length)
          .split("/");
        const isOwnModule = from.startsWith(`modules/${importedModule}/`);
        const isPublicRouteImport =
          from === "main.ts" &&
          rest.length === 0 &&
          moduleNames.includes(importedModule as (typeof moduleNames)[number]);
        if (!isOwnModule && !isPublicRouteImport) {
          violations.push(`${from} -> ${specifier}`);
        }
      }
    }
    expect(violations).toStrictEqual([]);
  });

  it("keeps shared code independent of page modules", async () => {
    const violations: string[] = [];
    for (const { filePath, specifiers } of await importsIn(
      path.join(sourceRoot, "shared")
    )) {
      for (const specifier of specifiers) {
        if (
          sourceRelativeSpecifier(filePath, specifier)?.startsWith("modules/")
        ) {
          violations.push(
            `${path.relative(sourceRoot, filePath)} -> ${specifier}`
          );
        }
      }
    }
    expect(violations).toStrictEqual([]);
  });

  it("groups shared runtime and style primitives by capability", async () => {
    const sharedRoot = path.join(sourceRoot, "shared");
    const entries = await readdir(sharedRoot);

    expect(entries.filter((entry) => entry.endsWith(".css"))).toStrictEqual([]);
    await Promise.all(
      [
        "runtime/enhanced-document.ts",
        "runtime/page-mount.ts",
        "styles/base.css",
        "styles/layout.css",
        "styles/modals.css",
        "styles/tokens.css",
      ].map((sharedPath) => access(path.join(sharedRoot, sharedPath)))
    );
  });

  it("does not retain the retired horizontal page layers", async () => {
    await Promise.all(
      ["api", "extract", "resolve", "runtime", "types.ts"].map((legacyPath) =>
        expect(access(path.join(sourceRoot, legacyPath))).rejects.toMatchObject(
          {
            code: "ENOENT",
          }
        )
      )
    );
  });
});
