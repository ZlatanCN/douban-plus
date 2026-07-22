import type { ComponentType, JSX } from "preact";

import type { Streaming } from "@/modules/subject/domain";
import { IconPlay } from "@/shared/components/common/icons";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";
import { resolveStreamingProvider } from "./streaming-provider";

type StreamingSectionProps = {
  streaming: Streaming[];
};

type StreamingLogoProps = {
  colorMode?: "intrinsic" | "catalog";
  fallbackLabel: string;
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  imgSrc?: string;
  surface?: "dark" | "paper";
};

const StreamingLogo = ({
  colorMode,
  fallbackLabel,
  Icon,
  imgSrc,
  surface = "dark",
}: StreamingLogoProps) => {
  if (imgSrc) {
    return <img alt="" class="atv-stream-vendor-icon" src={imgSrc} />;
  }
  return (
    <span
      aria-hidden="true"
      class={`atv-stream-logo${colorMode === "intrinsic" ? " is-intrinsic" : " is-catalog"} is-surface-${surface}`}
    >
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
              } is-surface-${provider.surface ?? "dark"}`}
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
                    {...(provider.colorMode
                      ? { colorMode: provider.colorMode }
                      : {})}
                    {...(provider.Icon ? { Icon: provider.Icon } : {})}
                    {...(!provider.Icon && item.iconUrl
                      ? { imgSrc: item.iconUrl }
                      : {})}
                    {...(provider.surface ? { surface: provider.surface } : {})}
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
