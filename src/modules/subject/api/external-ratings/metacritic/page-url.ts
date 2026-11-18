const METACRITIC_ORIGIN = "https://www.metacritic.com";

const pagePath = (value: string): string | null => {
  try {
    const url = new URL(value, METACRITIC_ORIGIN);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "www.metacritic.com" &&
        url.hostname !== "metacritic.com") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.pathname.replaceAll(/\/+$/gu, "");
  } catch {
    return null;
  }
};

export { METACRITIC_ORIGIN, pagePath };
