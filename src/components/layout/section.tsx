import type { ComponentChildren } from "preact";

type SectionProps = {
  children: ComponentChildren;
  id: string;
  moreLink?: { href: string; text: string };
  title: string;
};

const Section = ({ children, id, moreLink, title }: SectionProps) => (
  <section class="atv-section" id={id}>
    {moreLink ? (
      <div class="atv-section-h-row">
        <h2 class="atv-section-h">{title}</h2>
        <a
          class="atv-section-more"
          href={moreLink.href}
          rel="noopener"
          target="_blank"
        >
          {moreLink.text}
        </a>
      </div>
    ) : (
      <h2 class="atv-section-h">{title}</h2>
    )}
    {children}
  </section>
);

export { Section };
export type { SectionProps };
