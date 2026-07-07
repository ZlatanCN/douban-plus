import { C } from "./constants";
import type { AssertResult, AssertWarn, WarningCategory } from "./types";

const results: AssertResult[] = [];
const warnings: AssertWarn[] = [];

const record = (
  scenario: string,
  name: string,
  pass: boolean,
  detail = ""
): void => {
  results.push({ detail, name, pass, scenario });
};

/** Records a warning — doesn't count as a suite failure, but flagged for review. */
const recordWarn = (
  scenario: string,
  category: WarningCategory,
  name: string,
  detail = ""
): void => {
  warnings.push({ category, detail, name, scenario });
};

const printSummary = (): void => {
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  const ratio = `${passed}/${total}`;

  console.log("");
  console.log(`${C.bold}${"─".repeat(60)}${C.reset}`);

  if (failed.length === 0) {
    console.log(
      `  ${C.bgGreen}${C.bold} ALL ${ratio} PASSED ${C.reset}  ${C.dim}douban-plus QA${C.reset}`
    );
  } else {
    console.log(
      `  ${C.bgRed}${C.bold} ${ratio} FAILED ${C.reset}  ${C.dim}douban-plus QA${C.reset}`
    );
    console.log("");
    console.log(`${C.red}${C.bold}  FAILURES:${C.reset}`);
    console.log("");
    for (const f of failed) {
      console.log(
        `  ${C.red}×${C.reset} ${C.cyan}[${f.scenario}]${C.reset} ${f.name}`
      );
      if (f.detail) {
        console.log(`    ${C.dim}${f.detail}${C.reset}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log("");
    console.log(
      `${C.yellow}${C.bold}  WARNINGS (${warnings.length}):${C.reset}`
    );
    console.log("");
    for (const w of warnings) {
      console.log(
        `  ${C.yellow}!${C.reset} ${C.cyan}[${w.scenario}]${C.reset} ${C.dim}${w.category}${C.reset} ${w.name}`
      );
      if (w.detail) {
        console.log(`    ${C.dim}${w.detail}${C.reset}`);
      }
    }
  }

  console.log(`${C.bold}${"─".repeat(60)}${C.reset}`);
  console.log("");
};

const hasFailures = (): boolean => results.some((r) => !r.pass);
const hasWarnings = (): boolean => warnings.length > 0;

export {
  hasFailures,
  hasWarnings,
  printSummary,
  record,
  recordWarn,
  results,
  warnings,
};
