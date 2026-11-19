import type { StickyNavData } from "@/modules/subject/domain";

const rect = (left: number, width: number): DOMRectReadOnly =>
  ({
    bottom: 0,
    height: 0,
    left,
    right: left + width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: left,
    y: 0,
  }) as DOMRectReadOnly;

const makeData = (overrides?: Partial<StickyNavData>): StickyNavData => ({
  sections: [
    { id: "atv-cast", label: "演职员" },
    { id: "atv-photos", label: "剧照" },
    { id: "atv-comments", label: "短评" },
  ],
  title: {
    full: "肖申克的救赎 / The Shawshank Redemption",
    primary: "肖申克的救赎",
  },
  ...overrides,
});

const makeProps = (overrides?: Partial<StickyNavData>) => {
  const data = makeData(overrides);
  return {
    sections: data.sections,
    title: data.title.primary || data.title.full,
  };
};

const noop = (): undefined => undefined;

export { makeProps, noop, rect };
