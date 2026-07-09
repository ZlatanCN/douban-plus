const reviewNumericId = (rid: string): string =>
  rid.match(/(?<num>\d+)$/u)?.groups?.num ?? rid;

const reviewDisplayName = (name: string): string => name.trim() || "匿名用户";

export { reviewDisplayName, reviewNumericId };
