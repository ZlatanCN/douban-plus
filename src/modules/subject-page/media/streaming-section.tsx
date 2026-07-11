import type { ComponentType, JSX } from "preact";

import { IconPlay } from "@/components/common/icons";
import { Section } from "@/components/layout/section";
import type { Streaming } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";
import { resolveStreamingProvider } from "./streaming-provider";

type StreamingSectionProps = {
  streaming: Streaming[];
};

type StreamingLogoProps = {
  fallbackLabel: string;
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  imgSrc?: string;
};

const StreamingLogo = ({ fallbackLabel, Icon, imgSrc }: StreamingLogoProps) => {
  if (imgSrc) {
    return <img alt="" class="atv-stream-vendor-icon" src={imgSrc} />;
  }
  return (
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
};

const StreamingSection = ({ streaming }: StreamingSectionProps) =>
  streaming.length ? (
    <Section
      id="atv-stream"
      title={getSubjectSectionCopy("streaming").sectionTitle}
    >
      <div class="atv-stream-row">
        {streaming.map((item) => {
          const provider = resolveStreamingProvider(item);
          const style = {
            "--atv-stream-brand": provider.color,
          } as JSX.CSSProperties;

          return (
            <a
              class={`atv-stream-card${
                provider.combinedSvg ? " atv-stream-card-combined" : ""
              }`}
              data-provider={provider.key}
              href={item.href}
              key={item.href}
              rel="noopener"
              style={style}
              target="_blank"
            >
              {provider.combinedSvg && provider.Icon ? (
                <provider.Icon />
              ) : (
                <>
                  <StreamingLogo
                    fallbackLabel={provider.label}
                    Icon={provider.Icon}
                    imgSrc={item.iconUrl}
                  />
                  <span class="atv-stream-name">{item.name}</span>
                </>
              )}
            </a>
          );
        })}
      </div>
    </Section>
  ) : null;

export { StreamingSection };
export type { StreamingSectionProps };
