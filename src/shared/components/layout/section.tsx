import type { ComponentChildren } from "preact";
import { useRef } from "preact/hooks";

import { useSectionReveal } from "@/shared/hooks/use-section-reveal";

type SectionProps = {
  actions?: ComponentChildren;
  children: ComponentChildren;
  id: string;
  moreLink?: { href: string; text: string };
  title: string;
};

const Section = ({ actions, children, id, moreLink, title }: SectionProps) => {
  const ref = useRef<HTMLElement | null>(null);
  useSectionReveal(ref);
  const hasHeaderActions = Boolean(actions || moreLink);

  return (
    <section class="atv-section atv-section-reveal" id={id} ref={ref}>
      {hasHeaderActions ? (
        <div class="atv-section-h-row">
          <h2 class="atv-section-h">{title}</h2>
          <div class="atv-section-h-actions">
            {actions}
            {moreLink ? (
              <a
                class="atv-section-more"
                href={moreLink.href}
                rel="noopener"
                target="_blank"
              >
                {moreLink.text}
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <h2 class="atv-section-h">{title}</h2>
      )}
      {children}
    </section>
  );
};

export { Section };
