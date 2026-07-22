import { render } from "preact";
import { vi } from "vitest";

import type { SubjectSuggestion } from "@/modules/subject/api/subject-suggestions";

const fetchSuggestions = vi.hoisted(() =>
  vi.fn<(query: string, signal?: AbortSignal) => Promise<SubjectSuggestion[]>>()
);

vi.mock(import("@/modules/subject/api/subject-suggestions"), () => ({
  fetchSubjectSuggestions: fetchSuggestions,
  normalizeSubjectQuery: (query: string) =>
    query.trim().replaceAll(/\s+/gu, " "),
}));

const { SubjectSwitcher } =
  await import("@/modules/subject/search/subject-switcher");
const { renderIntoRoot } = await import("../../helpers/render");

const suggestion = {
  episode: "10",
  id: "3016187",
  imageUrl:
    "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p1910924635.webp",
  originalTitle: "Game of Thrones",
  title: "权力的游戏 第一季",
  url: "https://movie.douban.com/subject/3016187/",
  year: "2011",
};
const mountedRoots: HTMLElement[] = [];

const renderSwitcher = (): HTMLElement => {
  const root = renderIntoRoot(<SubjectSwitcher />);
  mountedRoots.push(root);
  return root;
};

const inputQuery = async (
  root: HTMLElement,
  value: string
): Promise<HTMLInputElement> => {
  const input = root.querySelector<HTMLInputElement>(
    ".atv-subject-switcher-input"
  );
  if (!input) {
    throw new Error("Expected the subject switcher input.");
  }
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await Promise.resolve();
  return input;
};

const openSwitcher = async (root: HTMLElement): Promise<void> => {
  root
    .querySelector<HTMLButtonElement>(".atv-subject-switcher-trigger")
    ?.click();
  await Promise.resolve();
};

const cleanupSwitcherTests = (): void => {
  for (const root of mountedRoots.splice(0)) {
    render(null, root);
    root.remove();
  }
  vi.unstubAllGlobals();
};

export {
  cleanupSwitcherTests,
  fetchSuggestions,
  inputQuery,
  openSwitcher,
  renderSwitcher,
  suggestion,
  SubjectSwitcher,
};
