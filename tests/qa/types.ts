import type { Page } from "playwright";

type Scenario = {
  kind: "movie" | "tv";
  name: string;
  url: string;
};

type AssertResult = {
  detail: string;
  name: string;
  pass: boolean;
  scenario: string;
};

type AssertWarn = {
  category: WarningCategory;
  detail: string;
  name: string;
  scenario: string;
};

type WarningCategory = "auth-dependent" | "browser-policy" | "data-missing";

type ScenarioResult = {
  name: string;
  passed: number;
  total: number;
  warnings: number;
  elapsedSec: number;
};

type AssertCtx = {
  page: Page;
  scenario: Scenario;
  ourErrors: string[];
};

export type {
  AssertCtx,
  AssertResult,
  AssertWarn,
  Scenario,
  ScenarioResult,
  WarningCategory,
};
