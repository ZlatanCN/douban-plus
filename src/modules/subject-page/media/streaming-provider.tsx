import type { ComponentType, SVGAttributes } from "preact";

import {
  findPlatformBrandByContainedName,
  PLATFORM_BRANDS,
} from "@/components/common/platform-brand";
import type {
  PlatformBrand,
  PlatformBrandKey,
} from "@/components/common/platform-brand";
import type { Streaming } from "@/types";

type StreamingProviderKey = PlatformBrandKey | "unknown";
type ProviderIconProps = SVGAttributes<SVGSVGElement>;

type ResolvedStreamingProvider = {
  colorMode?: PlatformBrand["colorMode"];
  surface?: PlatformBrand["surface"];
  key: StreamingProviderKey;
  label: string;
  color: string;
  Icon?: ComponentType<ProviderIconProps>;
  combinedSvg?: boolean;
};

const UNKNOWN_PROVIDER_COLOR = "#41be5d";

const PROVIDER_HOSTS: Partial<Record<PlatformBrandKey, string[]>> = {
  amc: ["amc.com"],
  "apple-tv": ["tv.apple.com"],
  bilibili: ["bilibili.com"],
  hbo: ["hbo.com"],
  "hbo-max": ["max.com", "hbomax.com"],
  hulu: ["hulu.com"],
  iqiyi: ["iqiyi.com"],
  "mango-tv": ["mgtv.com"],
  netflix: ["netflix.com"],
  "paramount-plus": ["paramountplus.com"],
  "prime-video": ["primevideo.com", "amazon.com"],
  "tencent-video": ["v.qq.com"],
  tubi: ["tubi.tv"],
  vimeo: ["vimeo.com"],
  youku: ["youku.com"],
  youtube: ["youtube.com", "youtu.be"],
};

const COMBINED_SVG_BRANDS = new Set<PlatformBrandKey>([
  "bilibili",
  "iqiyi",
  "mango-tv",
  "tencent-video",
  "youku",
]);

const decodeStreamingHref = (href: string): string => {
  try {
    const url = new URL(href);
    const wrapped = url.searchParams.get("url");
    return wrapped || href;
  } catch {
    return href;
  }
};

const hostMatches = (href: string, brand: PlatformBrand): boolean => {
  const decoded = decodeStreamingHref(href);
  const hosts = PROVIDER_HOSTS[brand.key] ?? [];
  try {
    const host = new URL(decoded).hostname.replace(/^www\./u, "");
    return hosts.some((providerHost) => host.endsWith(providerHost));
  } catch {
    return hosts.some((providerHost) => decoded.includes(providerHost));
  }
};

const resolveStreamingProvider = (
  item: Streaming
): ResolvedStreamingProvider => {
  const provider =
    findPlatformBrandByContainedName(item.name) ??
    PLATFORM_BRANDS.find((brand) => hostMatches(item.href, brand));

  if (provider) {
    const { Icon, color, colorMode, key, label, surface } = provider;
    return {
      ...(Icon ? { Icon } : {}),
      color,
      ...(colorMode ? { colorMode } : {}),
      ...(COMBINED_SVG_BRANDS.has(key) ? { combinedSvg: true } : {}),
      key,
      label,
      ...(surface ? { surface } : {}),
    };
  }

  return {
    color: UNKNOWN_PROVIDER_COLOR,
    key: "unknown",
    label: item.name,
  };
};

export { decodeStreamingHref, resolveStreamingProvider };
export type { ResolvedStreamingProvider, StreamingProviderKey };
