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

type AssertCtx = {
  page: Page;
  scenario: Scenario;
  ourErrors: string[];
};

export type { AssertCtx, AssertResult, Scenario };
