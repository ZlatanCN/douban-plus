import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SubjectSuggestion } from "@/api/subject-suggestions";

const fetchSuggestions = vi.hoisted(() =>
  vi.fn<(query: string, signal?: AbortSignal) => Promise<SubjectSuggestion[]>>()
);

vi.mock(import("@/api/subject-suggestions"), () => ({
  fetchSubjectSuggestions: fetchSuggestions,
  normalizeSubjectQuery: (query: string) =>
    query.trim().replaceAll(/\s+/gu, " "),
}));

const { SubjectSwitcher } =
  await import("@/modules/subject-page/search/subject-switcher");
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

describe(SubjectSwitcher, () => {
  beforeEach(() => {
    fetchSuggestions.mockReset();
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    for (const root of mountedRoots.splice(0)) {
      render(null, root);
      root.remove();
    }
    vi.unstubAllGlobals();
  });

  it("expands from the search trigger and shows the returned catalog rows", async () => {
    fetchSuggestions.mockResolvedValue([suggestion]);
    const root = renderSwitcher();

    await openSwitcher(root);
    const input = await inputQuery(root, "权力");
    await vi.waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });

    expect(fetchSuggestions).toHaveBeenCalledWith(
      "权力",
      expect.any(AbortSignal)
    );
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(root.textContent).toContain("权力的游戏 第一季");
    expect(root.textContent).toContain("Game of Thrones");
    expect(root.textContent).toContain("共 10 集");
  });

  it("shows loading rows throughout the request debounce", async () => {
    fetchSuggestions.mockResolvedValue([suggestion]);
    const root = renderSwitcher();

    await openSwitcher(root);
    await inputQuery(root, "权力");

    await vi.waitFor(
      () => {
        expect(
          root.querySelectorAll(".atv-subject-suggestion-skeletons span")
        ).toHaveLength(3);
      },
      { timeout: 200 }
    );
    expect(fetchSuggestions).not.toHaveBeenCalled();
  });

  it("opens the keyboard-selected candidate in a new tab and resets the switcher", async () => {
    fetchSuggestions.mockResolvedValue([suggestion]);
    const root = renderSwitcher();

    await openSwitcher(root);
    const input = await inputQuery(root, "权力");
    await vi.waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });
    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })
    );
    await Promise.resolve();
    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
    );
    await Promise.resolve();

    expect(window.open).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/3016187/",
      "_blank",
      "noopener"
    );
    expect(root.querySelector(".atv-subject-switcher-input")).toBeNull();
  });

  it("clears a selected candidate as soon as the query changes", async () => {
    fetchSuggestions.mockResolvedValue([suggestion]);
    const root = renderSwitcher();

    await openSwitcher(root);
    const input = await inputQuery(root, "权力");
    await vi.waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });
    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })
    );
    await Promise.resolve();
    await inputQuery(root, "权力的游戏");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
    );
    await Promise.resolve();

    expect(window.open).toHaveBeenCalledWith(
      "https://search.douban.com/movie/subject_search?search_text=%E6%9D%83%E5%8A%9B%E7%9A%84%E6%B8%B8%E6%88%8F",
      "_blank",
      "noopener"
    );
  });

  it("falls back to a native movie search and closes when there is no selected candidate", async () => {
    const root = renderSwitcher();

    await openSwitcher(root);
    const input = await inputQuery(root, "一");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
    );
    await Promise.resolve();

    expect(window.open).toHaveBeenCalledWith(
      "https://search.douban.com/movie/subject_search?search_text=%E4%B8%80",
      "_blank",
      "noopener"
    );
    expect(root.querySelector(".atv-subject-switcher-input")).toBeNull();
  });

  it("opens from the slash shortcut", async () => {
    const root = renderSwitcher();

    await vi.waitFor(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "/" })
      );
      expect(root.querySelector(".atv-subject-switcher-input")).not.toBeNull();
    });
  });

  it("closes with Escape", async () => {
    const root = renderSwitcher();

    await openSwitcher(root);
    root
      .querySelector<HTMLInputElement>(".atv-subject-switcher-input")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
      );
    await Promise.resolve();

    expect(root.querySelector(".atv-subject-switcher-input")).toBeNull();
  });

  it("does not open from a slash typed within contenteditable text", async () => {
    const root = renderSwitcher();

    await vi.waitFor(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "/" })
      );
      expect(root.querySelector(".atv-subject-switcher-input")).not.toBeNull();
    });
    root
      .querySelector<HTMLInputElement>(".atv-subject-switcher-input")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
      );
    await Promise.resolve();

    const editor = document.createElement("div");
    editor.contentEditable = "true";
    const editorText = document.createElement("span");
    editor.append(editorText);
    document.body.append(editor);
    editorText.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "/" })
    );
    await Promise.resolve();
    editor.remove();

    expect(root.querySelector(".atv-subject-switcher-input")).toBeNull();
  });
});
