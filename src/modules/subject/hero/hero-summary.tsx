import { useEffect, useRef, useState } from "preact/hooks";

import { IconChevron } from "@/components/common/icons";
import { playEntrance, springConfigs } from "@/utils/springs";

type HeroSummaryProps = {
  text: string;
};

const HeroSummary = ({ text }: HeroSummaryProps) => {
  const teaserRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
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

  useEffect(() => {
    if (contentRef.current) {
      playEntrance(contentRef.current, springConfigs.summaryEntrance);
    }
  }, [summaryTransitionKey]);

  const toggle = (): void => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
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
        onClick={toggle}
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
