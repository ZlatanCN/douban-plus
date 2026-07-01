import { C } from "./constants";
import { hasFailures, printSummary, results, warnings } from "./logger";
import type { Scenario } from "./types";

type GroupKind = "movie" | "tv";

const GROUP_LABELS: Record<GroupKind, string> = {
  movie: "电影",
  tv: "电视剧",
};

class Reporter {
  private scenarios: Scenario[];
  private startTime: number;
  private currentKind: GroupKind | null = null;
  private sigintCalled = false;

  constructor(opts: { scenarios: Scenario[] }) {
    this.scenarios = opts.scenarios;
    this.startTime = Date.now();
  }

  start(): void {
    console.log(
      `\n  ${C.dim}Running ${this.scenarios.length} scenarios...${C.reset}\n`
    );
  }

  scenarioDone(name: string, elapsedSec: number): void {
    const sc = this.scenarios.find((s) => s.name === name);
    const kind = sc?.kind ?? "movie";

    if (this.currentKind !== kind) {
      const label = GROUP_LABELS[kind] ?? kind;
      console.log(`  ${C.dim}── ${label} ──${C.reset}`);
      this.currentKind = kind;
    }

    const sr = results.filter((r) => r.scenario === name);
    const sw = warnings.filter((w) => w.scenario === name);
    const passed = sr.filter((r) => r.pass).length;
    const total = sr.length;
    const hasFail = passed < total;

    const icon = hasFail ? `${C.red}✗${C.reset}` : `${C.green}✓${C.reset}`;
    const ratio = `${C.bold}${passed}/${total}${C.reset}`;
    const warnStr =
      sw.length > 0
        ? `${C.yellow}${sw.length} warn${C.reset}`
        : `${C.dim}0 warn${C.reset}`;

    let suffix = "";
    if (hasFail) {
      const failCount = total - passed;
      suffix = ` ${C.red}${failCount} FAIL${C.reset}`;
    }

    console.log(
      `  ${icon} ${name.padEnd(30)}  ${ratio}  ${warnStr}  ${C.dim}${elapsedSec}s${C.reset}${suffix}`
    );
  }

  stop(): void {
    const totalElapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`\n  ${C.dim}Total: ${totalElapsed}s${C.reset}`);
  }

  onSIGINT(): void {
    if (this.sigintCalled) {
      return;
    }
    this.sigintCalled = true;
    console.log(
      `\n  ${C.yellow}SIGINT${C.reset} — flushing completed results...`
    );
    this.stop();
    printSummary();
    process.exit(hasFailures() ? 1 : 0);
  }
}

export { Reporter };
