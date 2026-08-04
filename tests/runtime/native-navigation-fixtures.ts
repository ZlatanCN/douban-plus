import type {
  NativeNavigationResult,
  NativeNavigationTarget,
} from "@/shared/runtime/native-navigation";

type PageData = {
  title: string;
};

const target = (
  href: string,
  source: NativeNavigationTarget["source"] = "user"
): NativeNavigationTarget => ({
  href,
  label: href,
  source,
});

const content = (title: string): HTMLElement => {
  const source = new DOMParser().parseFromString(
    `<main id="content"><h1>${title}</h1></main>`,
    "text/html"
  );
  const value = source.querySelector<HTMLElement>("#content");
  if (!value) {
    throw new Error("test source content missing");
  }
  return value;
};

const result = (
  title: string,
  href: string
): NativeNavigationResult<PageData> => ({
  data: { title },
  href,
  nativeContent: content(title),
});

export { content, result, target, type PageData };
