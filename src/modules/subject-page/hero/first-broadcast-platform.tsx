import type { ComponentType, JSX } from "preact";

import {
  LogoAppleTv,
  LogoHbo,
  LogoHboMax,
  LogoNetflix,
  LogoParamountPlus,
} from "@/components/common/icons";

type PlatformBrand = {
  aliases: string[];
  Icon: ComponentType<JSX.IntrinsicElements["svg"]>;
  key: string;
};

const PLATFORM_BRANDS: PlatformBrand[] = [
  {
    Icon: LogoAppleTv,
    aliases: ["apple tv+", "apple tv"],
    key: "apple-tv",
  },
  {
    Icon: LogoHboMax,
    aliases: ["hbo max", "max"],
    key: "hbo-max",
  },
  {
    Icon: LogoHbo,
    aliases: ["hbo"],
    key: "hbo",
  },
  {
    Icon: LogoNetflix,
    aliases: ["netflix"],
    key: "netflix",
  },
  {
    Icon: LogoParamountPlus,
    aliases: ["paramount+"],
    key: "paramount-plus",
  },
];

const normalizePlatformName = (platform: string): string =>
  platform.toLowerCase().replaceAll(/\s+/gu, "");

const findPlatformBrand = (platform: string): PlatformBrand | null => {
  const normalizedPlatform = normalizePlatformName(platform);
  return (
    PLATFORM_BRANDS.find((brand) =>
      brand.aliases.some((alias) =>
        normalizedPlatform.includes(normalizePlatformName(alias))
      )
    ) ?? null
  );
};

const IconBroadcast = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect
      fill="none"
      height="14"
      rx="2"
      stroke="currentColor"
      stroke-width="1.8"
      width="19"
      x="2.5"
      y="3.5"
    />
    <path
      d="m9 8 6 2.5L9 13Z"
      fill="currentColor"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1"
    />
    <path
      d="M8.5 20.5h7"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.8"
    />
  </svg>
);

type FirstBroadcastPlatformProps = {
  platform: string;
};

const FirstBroadcastPlatform = ({
  platform,
}: FirstBroadcastPlatformProps): JSX.Element => {
  const brand = findPlatformBrand(platform);
  const Icon = brand?.Icon;

  return (
    <div
      aria-label={`首播平台：${platform}`}
      class="atv-first-broadcast-platform"
      data-provider={brand?.key ?? "unknown"}
    >
      <span class="atv-first-broadcast-platform-mark" aria-hidden="true">
        {Icon ? <Icon /> : <IconBroadcast />}
      </span>
      <span class="atv-first-broadcast-platform-label">首播平台</span>
      <span class="atv-first-broadcast-platform-name">{platform}</span>
    </div>
  );
};

export { FirstBroadcastPlatform };
export type { FirstBroadcastPlatformProps };
