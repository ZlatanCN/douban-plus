import { useEffect, useRef, useState } from "preact/hooks";

import { IconChevron } from "@/components/common/icons";

type HeroSummaryProps = {
  expandNativeSummary?: () => Promise<string | null>;
  text: string;
};

const HeroSummary = ({ expandNativeSummary, text }: HeroSummaryProps) => {
  const teaserRef = useRef<HTMLParagraphElement>(null);
  const previousTextRef = useRef(text);
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(text);
  const [showToggle, setShowToggle] = useState(true);
  const [summaryTransitionKey, setSummaryTransitionKey] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => {
      const teaser = teaserRef.current;
      if (teaser) {
        setShowToggle(teaser.scrollHeight - teaser.clientHeight > 4);
      }
    });
  }, [text]);

  useEffect(() => {
    if (previousTextRef.current !== text) {
      previousTextRef.current = text;
      setExpanded(false);
      setSummary(text);
      setSummaryTransitionKey((key) => key + 1);
    }
  }, [text]);

  const toggle = async (): Promise<void> => {
    if (expanded) {
      setExpanded(false);
      setSummaryTransitionKey((key) => key + 1);
      return;
    }
    setExpanded(true);
    setSummaryTransitionKey((key) => key + 1);
    const expandedText = await expandNativeSummary?.();
    if (expandedText) {
      setSummary(expandedText);
    }
  };

  return (
    <div class="atv-hero-summary">
      <p
        class={`atv-hero-teaser${expanded ? "" : " is-clamped"}`}
        ref={teaserRef}
      >
        <span
          class="atv-hero-teaser-content"
          key={`${summaryTransitionKey}-${summary}`}
        >
          {summary}
        </span>
      </p>
      <button
        class={`atv-hero-more${expanded ? " is-open" : ""}`}
        onClick={() => void toggle()}
        style={{ display: showToggle ? undefined : "none" }}
        type="button"
      >
        <span>{expanded ? "收起" : "展开"}</span>
        <IconChevron />
      </button>
    </div>
  );
};

export { HeroSummary };
export type { HeroSummaryProps };
