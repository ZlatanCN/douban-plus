import path from "node:path";
import { pathToFileURL } from "node:url";

import { parseCssSources } from "./css-source.mjs";
import { createAuditState } from "./model.mjs";
import { listRuntimeSources, loadCssSources } from "./project.mjs";
import { parseRuntimeSources } from "./runtime-source.mjs";

const branchStatus = (branch, state) => {
  if (!branch.owned) {
    return "unverified";
  }
  const hasDynamicToken = branch.classes.some((name) =>
    [...state.dynamicClassPrefixes].some((prefix) => name.startsWith(prefix))
  );
  if (hasDynamicToken) {
    return "unverified";
  }
  const hasStaticToken =
    branch.classes.some((name) => state.staticClasses.has(name)) ||
    branch.ids.some((name) => state.staticIds.has(name));
  return hasStaticToken ? "live" : "dead";
};

const ruleStatuses = (state) => {
  const statuses = new Map();
  for (const rule of state.cssRules) {
    const statusesForRule = new Set(
      rule.branches.map((branch) => branchStatus(branch, state))
    );
    let status = "dead";
    if (statusesForRule.has("unverified")) {
      status = "unverified";
    }
    if (statusesForRule.has("live")) {
      status = "live";
    }
    statuses.set(rule.id, status);
  }
  return statuses;
};

const liveCustomProperties = (state, statuses) => {
  const live = new Set(state.customRoots);
  const pending = [...live];
  for (const declaration of state.declarations) {
    if (statuses.get(declaration.ruleId) !== "dead") {
      for (const name of declaration.dependencies) {
        if (!live.has(name)) {
          live.add(name);
          pending.push(name);
        }
      }
    }
  }
  while (pending.length > 0) {
    const name = pending.pop();
    for (const declaration of state.customProperties) {
      if (declaration.name !== name) {
        continue;
      }
      for (const dependency of declaration.dependencies) {
        if (!live.has(dependency)) {
          live.add(dependency);
          pending.push(dependency);
        }
      }
    }
  }
  return live;
};

const locationFor = (finding, state) => {
  if (finding.file) {
    return finding;
  }
  const declaration = state.declarations.find((item) =>
    item.dependencies.includes(finding.name)
  );
  return declaration ?? state.customRootLocations.get(finding.name) ?? finding;
};

const analyzeSources = ({ cssSources, runtimeSources = [] }) => {
  const state = createAuditState();
  parseCssSources(cssSources, state);
  parseRuntimeSources(runtimeSources, state);

  const statuses = ruleStatuses(state);
  const findings = [];
  for (const rule of state.cssRules) {
    for (const branch of rule.branches) {
      const status = branchStatus(branch, state);
      if (status === "dead") {
        findings.push({
          file: branch.file,
          kind: rule.branches.length > 1 ? "dead-selector-branch" : "dead-rule",
          line: branch.line,
          selector: branch.selector,
        });
      } else if (
        status === "unverified" &&
        (branch.classes.length > 0 || branch.ids.length > 0)
      ) {
        state.unverified.push({
          file: branch.file,
          kind: "host-dependent",
          line: branch.line,
          reason: "host-dependent selector",
          selector: branch.selector,
        });
      }
    }
  }

  const liveProperties = liveCustomProperties(state, statuses);
  for (const declaration of state.customProperties) {
    if (!liveProperties.has(declaration.name)) {
      findings.push({ ...declaration, kind: "dead-custom-property" });
    }
  }

  for (const name of liveProperties) {
    if (
      name.startsWith("--atv-") &&
      !state.customProperties.some(
        (declaration) => declaration.name === name
      ) &&
      !state.runtimeProvided.has(name)
    ) {
      findings.push({
        ...locationFor({ name }, state),
        kind: "unresolved-custom-property",
        name,
      });
    }
  }

  const liveKeyframes = new Set(
    state.animationReferences
      .filter((reference) => statuses.get(reference.ruleId) !== "dead")
      .map((reference) => reference.name)
  );
  for (const keyframe of state.keyframes) {
    if (!liveKeyframes.has(keyframe.name)) {
      findings.push({ ...keyframe, kind: "dead-keyframes" });
    }
  }

  return { errors: state.errors, findings, unverified: state.unverified };
};

const printLocation = (finding) => {
  const location = finding.file
    ? `${path.relative(process.cwd(), finding.file)}:${finding.line ?? "?"}`
    : "unknown location";
  const subject = finding.selector ?? finding.name ?? finding.reason ?? "";
  console.error(`  ${location} ${subject}`.trimEnd());
};

const printSummary = (result) => {
  const counts = new Map();
  for (const finding of result.unverified) {
    counts.set(finding.reason, (counts.get(finding.reason) ?? 0) + 1);
  }
  for (const [reason, count] of counts) {
    console.warn(`unverified: ${reason} (${count})`);
  }
};

const main = () => {
  const root = path.resolve("src");
  const result = analyzeSources({
    cssSources: loadCssSources(path.join(root, "styles.css")),
    runtimeSources: listRuntimeSources(root),
  });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const error of result.errors) {
      console.error(
        `CSS audit parse error: ${path.relative(process.cwd(), error.file)} ${error.message}`
      );
    }
    for (const finding of result.findings) {
      console.error(`${finding.kind}:`);
      printLocation(finding);
    }
    printSummary(result);
    if (result.findings.length === 0 && result.errors.length === 0) {
      console.log(
        result.unverified.length > 0
          ? `CSS audit passed with ${result.unverified.length} unverified boundary(s).`
          : "CSS audit passed."
      );
    }
  }
  process.exitCode =
    result.errors.length > 0 || result.findings.length > 0 ? 1 : 0;
};

export { analyzeSources };

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
