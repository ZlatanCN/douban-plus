import { chromium } from "playwright";
import type { Browser } from "playwright";

import { cleanupStaleScreenshots } from "./asserts";
import { SCENARIOS } from "./constants";
import { hasFailures, printSummary } from "./logger";
import { Reporter } from "./reporter";
import { runScenario } from "./scenario-runner";
import type { Scenario } from "./types";

interface QaRunnerOptions {
  launchBrowser?: () => Promise<Browser>;
  scenarios?: Scenario[];
}

const launchEdge = (): Promise<Browser> =>
  chromium.launch({
    channel: "msedge",
    headless: true,
  });

const runQa = async (options: QaRunnerOptions = {}): Promise<number> => {
  const scenarios = options.scenarios ?? SCENARIOS;
  const launchBrowser = options.launchBrowser ?? launchEdge;
  const browser = await launchBrowser();
  const reporter = new Reporter({ scenarios });

  reporter.start();
  cleanupStaleScreenshots(scenarios);

  process.on("SIGINT", () => {
    reporter.onSIGINT();
  });

  const timedRun = async (scenario: Scenario): Promise<void> => {
    const start = Date.now();
    try {
      await runScenario(browser, scenario);
    } finally {
      const elapsed = Math.round((Date.now() - start) / 1000);
      reporter.scenarioDone(scenario.name, elapsed);
    }
  };

  try {
    await Promise.allSettled(scenarios.map(timedRun));
  } finally {
    await browser.close().catch(() => null);
  }

  printSummary();
  return hasFailures() ? 1 : 0;
};

export { runQa };
export type { QaRunnerOptions };
