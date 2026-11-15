type StructuredPage = {
  canonicalUrl: string | null;
  jsonLd: Record<string, unknown>[];
};

const readStructuredPage = (html: string): StructuredPage => {
  const canonicalUrl = html.match(
    /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'](?<href>[^"']+)["'])[^>]*>/iu
  )?.groups?.href;
  const jsonLd: Record<string, unknown>[] = [];
  for (const match of html.matchAll(
    /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>(?<body>[\s\S]*?)<\/script>/giu
  )) {
    try {
      const parsed: unknown = JSON.parse(match.groups?.body?.trim() ?? "");
      for (const value of Array.isArray(parsed) ? parsed : [parsed]) {
        if (value && typeof value === "object") {
          jsonLd.push(value as Record<string, unknown>);
        }
      }
    } catch {
      // Ignore unrelated invalid JSON-LD; callers validate identity separately.
    }
  }
  return { canonicalUrl: canonicalUrl ?? null, jsonLd };
};

const structuredTypes = (value: Record<string, unknown>): string[] => {
  const type = value["@type"];
  if (Array.isArray(type)) {
    return type.filter((item): item is string => typeof item === "string");
  }
  return typeof type === "string" ? [type] : [];
};

const structuredPageTypes = (page: StructuredPage): Set<string> =>
  new Set(page.jsonLd.flatMap((value) => structuredTypes(value)));

export {
  readStructuredPage,
  structuredPageTypes,
  structuredTypes,
  type StructuredPage,
};
