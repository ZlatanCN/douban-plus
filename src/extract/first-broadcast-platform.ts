const extractFirstBroadcastPlatform = (doc: Document): string | null => {
  const label = [...doc.querySelectorAll("label")].find(
    (candidate) => candidate.textContent?.trim() === "电视台"
  );
  if (!label?.htmlFor) {
    return null;
  }

  const input = label
    .closest(".item")
    ?.querySelector<HTMLInputElement>("input");
  const platform = input?.value.trim();
  return platform || null;
};

export { extractFirstBroadcastPlatform };
