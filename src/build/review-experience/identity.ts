const reviewNumericId = (rid: string): string => {
  const m = rid.match(/(?<num>\d+)$/u);
  return m?.groups?.num ?? rid;
};

const reviewDisplayName = (name: string): string => name.trim() || "匿名用户";

export { reviewDisplayName, reviewNumericId };
