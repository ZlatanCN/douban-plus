import type { Page } from "playwright";

interface Scenario {
  kind: "movie" | "tv";
  name: string;
  url: string;
}

interface AssertResult {
  detail: string;
  name: string;
  pass: boolean;
  scenario: string;
}

interface AssertWarn {
  category: WarningCategory;
  detail: string;
  name: string;
  scenario: string;
}

type WarningCategory = "auth-dependent" | "browser-policy" | "data-missing";

interface ScenarioResult {
  name: string;
  passed: number;
  total: number;
  warnings: number;
  elapsedSec: number;
}

interface AssertCtx {
  page: Page;
  scenario: Scenario;
  ourErrors: string[];
}

export type {
  AssertCtx,
  AssertResult,
  AssertWarn,
  Scenario,
  ScenarioResult,
  WarningCategory,
};
