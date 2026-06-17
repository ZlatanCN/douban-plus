import { C } from "./constants";
import type { AssertResult } from "./types";

const results: AssertResult[] = [];

const log = (pass: boolean, label: string, detail?: string): void => {
  const mark = pass ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  const detailStr = detail ? ` ${C.dim}${detail}${C.reset}` : "";
  console.log(`  ${mark}  ${label}${detailStr}`);
};

const record = (
  scenario: string,
  name: string,
  pass: boolean,
  detail = ""
): void => {
  results.push({ detail, name, pass, scenario });
  log(pass, name, detail);
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

  console.log(`${C.bold}${"─".repeat(60)}${C.reset}`);
  console.log("");
};

const hasFailures = (): boolean => results.some((r) => !r.pass);

export { hasFailures, printSummary, record, results };
