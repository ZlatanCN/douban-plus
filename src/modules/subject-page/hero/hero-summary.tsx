import { useEffect, useRef, useState } from "preact/hooks";

import { IconChevron } from "../../../components/common/icons";

interface HeroSummaryProps {
  text: string;
}

const HeroSummary = ({ text }: HeroSummaryProps) => {
  const teaserRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      const teaser = teaserRef.current;
      if (teaser) {
        setShowToggle(teaser.scrollHeight - teaser.clientHeight > 4);
      }
    });
  }, [text]);

  return (
    <div class="atv-hero-summary">
      <p
        class={`atv-hero-teaser${expanded ? "" : " is-clamped"}`}
        ref={teaserRef}
      >
        {text}
      </p>
      <button
        class={`atv-hero-more${expanded ? " is-open" : ""}`}
        onClick={() => setExpanded((value) => !value)}
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
