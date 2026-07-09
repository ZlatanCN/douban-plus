import type { ComponentType, JSX } from "preact";

import { IconPlay } from "@/components/common/icons";
import { Section } from "@/components/layout/section";
import type { Streaming } from "@/types";

import { resolveStreamingProvider } from "./streaming-provider";

type StreamingSectionProps = {
  streaming: Streaming[];
};

type StreamingLogoProps = {
  fallbackLabel: string;
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
};

const StreamingLogo = ({ fallbackLabel, Icon }: StreamingLogoProps) => (
  <span class="atv-stream-logo" aria-hidden="true">
    {Icon ? (
      <Icon />
    ) : (
      <span class="atv-stream-logo-fallback">
        {fallbackLabel.trim().at(0) || <IconPlay />}
      </span>
    )}
  </span>
);

const StreamingSection = ({ streaming }: StreamingSectionProps) =>
  streaming.length ? (
    <Section id="atv-stream" title="在哪儿看">
      <div class="atv-stream-row">
        {streaming.map((item) => {
          const provider = resolveStreamingProvider(item);
          const style = {
            "--atv-stream-brand": provider.color,
          } as JSX.CSSProperties;

          return (
            <a
              class="atv-stream-card"
              data-provider={provider.key}
              href={item.href}
              key={item.href}
              rel="noopener"
              style={style}
              target="_blank"
            >
              <StreamingLogo
                fallbackLabel={provider.label}
                Icon={provider.Icon}
              />
              <span class="atv-stream-name">{item.name}</span>
            </a>
          );
        })}
      </div>
    </Section>
  ) : null;

export { StreamingSection };
export type { StreamingSectionProps };
