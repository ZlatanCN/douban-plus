const normalizeInterestTags = (
  value: readonly unknown[] | string
): string[] => {
  const values = typeof value === "string" ? [value] : value;
  return [
    ...new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .flatMap((item) => item.trim().split(/\s+/u))
        .filter(Boolean)
    ),
  ];
};

export { normalizeInterestTags };
