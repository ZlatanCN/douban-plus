import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";

type SafeImageProps = {
  /** Image source URL — null/undefined/empty renders fallback */
  src: string | null | undefined;
  /** Alt text for the image */
  alt: string;
  /** CSS class on the <img> element */
  className?: string;
  /** Eager or lazy loading. Defaults to "lazy" */
  loading?: "eager" | "lazy";
  /**
   * Reserve a width/height ratio before the image loads.
   * Set to a number (e.g. 0.667 for 2:3) to prevent layout shift.
   */
  aspectRatio?: number;
  /**
   * Stagger entrance index. Each increment adds ~50ms delay.
   * Works with the `atv-stagger-item` CSS class.
   */
  staggerIndex?: number;
  /** Called with natural dimensions when the image finishes loading */
  onLoad?: (dimensions: { width: number; height: number }) => void;
  /**
   * Custom fallback rendered when src is null or the image fails to load.
   * Default: a gray placeholder div with `.atv-safe-image-fallback`.
   */
  fallback?: ComponentChildren;
};

/** Gets the raw aspect-ratio string for CSS (e.g. "4/3" or "1.5") */
const formatAspectRatio = (ratio: number): string => {
  // Prefer fraction syntax for clean ratios
  const fraction = ratio.toFixed(4);
  if (fraction.endsWith("6667")) {
    return "2 / 3";
  }
  if (fraction.endsWith("7500")) {
    return "3 / 4";
  }
  if (fraction.endsWith("3333")) {
    return "4 / 3";
  }
  if (fraction.endsWith("5000")) {
    return "3 / 2";
  }
  if (fraction.endsWith("0000")) {
    return `${Math.round(ratio)}`;
  }
  return String(ratio);
};

const SafeImage = ({
  src,
  alt,
  className,
  loading = "lazy",
  aspectRatio,
  staggerIndex,
  onLoad,
  fallback,
}: SafeImageProps) => {
  const [failed, setFailed] = useState(false);

  // --- Null src → show fallback (cannot retry) ---
  if (!src) {
    return (
      fallback ?? <div aria-hidden="true" class="atv-safe-image-fallback" />
    );
  }

  // --- Load failure → show fallback ---
  if (failed) {
    return (
      fallback ?? <div aria-hidden="true" class="atv-safe-image-fallback" />
    );
  }

  // --- Image element ---
  const img = (
    <img
      alt={alt}
      class={className}
      loading={loading}
      onError={() => setFailed(true)}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalWidth && image.naturalHeight) {
          onLoad?.({ height: image.naturalHeight, width: image.naturalWidth });
        }
      }}
      src={src}
    />
  );

  // --- Wrapper needed for space reservation or stagger ---
  if (aspectRatio !== undefined || staggerIndex !== undefined) {
    const vars: Record<string, string> = {};
    if (aspectRatio !== undefined) {
      vars.aspectRatio = formatAspectRatio(aspectRatio);
    }
    if (staggerIndex !== undefined) {
      vars["--stagger-index"] = String(staggerIndex);
    }

    return (
      <div
        class="atv-safe-image-container"
        style={vars as Record<string, string>}
      >
        {img}
      </div>
    );
  }

  // --- Plain image, no wrapper needed ---
  return img;
};

export { SafeImage };
export type { SafeImageProps };
