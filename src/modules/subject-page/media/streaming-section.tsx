import { IconArrow } from "../../../components/common/icons";
import { Section } from "../../../components/layout/section";
import type { Streaming } from "../../../types";

interface StreamingSectionProps {
  streaming: Streaming[];
}

const StreamingSection = ({ streaming }: StreamingSectionProps) =>
  streaming.length ? (
    <Section id="atv-stream" title="在哪儿看">
      <div class="atv-stream-row">
        {streaming.map((item) => (
          <a
            class="atv-stream-card"
            href={item.href}
            key={item.href}
            rel="noopener"
            target="_blank"
          >
            <span>{item.name}</span>
            <span class="atv-stream-arrow">
              <IconArrow />
            </span>
          </a>
        ))}
      </div>
    </Section>
  ) : null;

export { StreamingSection };
export type { StreamingSectionProps };
