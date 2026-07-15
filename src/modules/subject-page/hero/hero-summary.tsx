import { useEffect, useRef, useState } from "preact/hooks";

import { IconChevron } from "@/components/common/icons";
import { playEntrance, springConfigs } from "@/utils/springs";

type HeroSummaryProps = {
  expandNativeSummary?: () => Promise<string | null>;
  text: string;
};

const HeroSummary = ({ expandNativeSummary, text }: HeroSummaryProps) => {
  const teaserRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const previousTextRef = useRef(text);
  const summaryRequestRef = useRef(0);
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
      summaryRequestRef.current += 1;
      previousTextRef.current = text;
      setExpanded(false);
      setSummary(text);
      setSummaryTransitionKey((key) => key + 1);
    }
  }, [text]);

  useEffect(() => {
    if (contentRef.current) {
      playEntrance(contentRef.current, springConfigs.summaryEntrance);
    }
  }, [summaryTransitionKey]);

  const toggle = async (): Promise<void> => {
    if (expanded) {
      summaryRequestRef.current += 1;
      setExpanded(false);
      return;
    }
    setExpanded(true);
    const requestId = summaryRequestRef.current + 1;
    summaryRequestRef.current = requestId;
    const expandedText = await expandNativeSummary?.();
    if (
      requestId === summaryRequestRef.current &&
      expandedText &&
      expandedText !== summary
    ) {
      setSummary(expandedText);
      setSummaryTransitionKey((key) => key + 1);
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
          key={summaryTransitionKey}
          ref={contentRef}
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
