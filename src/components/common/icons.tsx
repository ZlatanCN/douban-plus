/* ── SVG icon components ───────────────────────────────── */
/* Replacements for dangerouslySetInnerHTML-based icon rendering */

import type { JSX, ComponentChildren } from "preact";

/**
 * Render raw HTML via innerHTML ref assignment instead of
 * the `dangerouslySetInnerHTML` JSX prop, to avoid react/no-danger.
 */
const HtmlContent = ({
  children,
  className,
  html,
  ...rest
}: JSX.HTMLAttributes<HTMLDivElement> & {
  html?: string;
  children?: ComponentChildren;
}) => {
  const setRef = (el: HTMLDivElement | null) => {
    if (el && html) {
      el.innerHTML = html;
    }
  };
  return (
    <div class={className} ref={setRef} {...rest}>
      {html ? null : children}
    </div>
  );
};

type IconProps = JSX.SVGAttributes<SVGSVGElement>;

const IconStarFull = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
    />
  </svg>
);

const IconStarHalf = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
    <defs>
      <linearGradient id="atvHalfStar">
        <stop offset="50%" stop-color="currentColor" />
        <stop offset="50%" stop-color="currentColor" stop-opacity="0.22" />
      </linearGradient>
    </defs>
    <path
      fill="url(#atvHalfStar)"
      d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
    />
  </svg>
);

const IconStarEmpty = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      fill-opacity="0.22"
      d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
    />
  </svg>
);

const IconPlay = (props: IconProps) => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z"
    />
  </svg>
);

const IconCheck = (props: IconProps) => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M2.5 7.5l3 3 6-7"
    />
  </svg>
);

const IconChevron = (props: IconProps) => (
  <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M2.5 4l3.5 4 3.5-4"
    />
  </svg>
);

const IconArrow = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5"
    />
  </svg>
);

const IconThumb = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z"
    />
  </svg>
);

const IconVoteTriangle = (props: IconProps) => (
  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M6 2.2 10.4 9H1.6L6 2.2z" />
  </svg>
);

const IconExpand = (props: IconProps) => (
  <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 5.5l4 4 4-4"
    />
  </svg>
);

const IconTomato = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
    <circle cx="8" cy="8" r="5.5" fill="currentColor" />
  </svg>
);

const IconPopcorn = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M8 2l6 6-6 6-6-6z" />
  </svg>
);

const IconClose = ({ size = 22, ...props }: IconProps & { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    {...props}
  >
    <path d="M6 6l12 12M18 6l-12 12" />
  </svg>
);

const IconFilmPlaceholder = (props: IconProps) => (
  <svg
    viewBox="0 0 64 96"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    {...props}
  >
    <defs>
      <linearGradient id="atvFilmGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2c2c2e" />
        <stop offset="100%" stop-color="#1c1c1e" />
      </linearGradient>
    </defs>
    <rect width="64" height="96" fill="url(#atvFilmGrad)" />
    <g fill="rgba(255,255,255,0.12)">
      <rect x="4" y="6" width="6" height="6" rx="1" />
      <rect x="4" y="18" width="6" height="6" rx="1" />
      <rect x="4" y="30" width="6" height="6" rx="1" />
      <rect x="4" y="42" width="6" height="6" rx="1" />
      <rect x="4" y="54" width="6" height="6" rx="1" />
      <rect x="4" y="66" width="6" height="6" rx="1" />
      <rect x="4" y="78" width="6" height="6" rx="1" />
      <rect x="54" y="6" width="6" height="6" rx="1" />
      <rect x="54" y="18" width="6" height="6" rx="1" />
      <rect x="54" y="30" width="6" height="6" rx="1" />
      <rect x="54" y="42" width="6" height="6" rx="1" />
      <rect x="54" y="54" width="6" height="6" rx="1" />
      <rect x="54" y="66" width="6" height="6" rx="1" />
      <rect x="54" y="78" width="6" height="6" rx="1" />
    </g>
    <path d="M26 38l14 10-14 10z" fill="rgba(255,255,255,0.28)" />
  </svg>
);

const LogoDouban = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    aria-label="豆瓣"
    fill="#2D963D"
    {...props}
  >
    <path d="M.51 3.06h22.98V.755H.51V3.06Zm20.976 2.537v9.608h-2.137l-1.669 5.76H24v2.28H0v-2.28h6.32l-1.67-5.76H2.515V5.597h18.972Zm-5.066 9.608H7.58l1.67 5.76h5.501l1.67-5.76ZM18.367 7.9H5.634v5.025h12.733V7.9Z" />
  </svg>
);

const LogoImdb = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    aria-label="IMDb"
    fill="#F5C518"
    {...props}
  >
    <path d="M22.3781 0H1.6218C.7411.0583.0587.7437.0018 1.5953l-.001 20.783c.0585.8761.7125 1.543 1.5559 1.6191A.337.337 0 0 0 1.6016 24h20.7971a.4579.4579 0 0 0 .0437-.002c.8727-.0768 1.5568-.8271 1.5568-1.7085V1.7098c0-.8914-.696-1.6416-1.584-1.7078A.3294.3294 0 0 0 22.3781 0zm0 .496a1.2144 1.2144 0 0 1 1.1252 1.2139v20.5797c0 .6377-.4875 1.1602-1.1045 1.2145H1.6016c-.5967-.0543-1.0645-.5297-1.1053-1.1258V1.6284C.5371 1.0185 1.0184.5364 1.6217.496h20.7564zM4.7954 8.2603v7.3636H2.8899V8.2603h1.9055zm6.5367 0v7.3636H9.6707v-4.9704l-.6711 4.9704H7.813l-.6986-4.8618-.0066 4.8618h-1.668V8.2603h2.468c.0748.4476.1492.9694.2307 1.5734l.2712 1.8713.4407-3.4447h2.4817zm2.9772 1.3289c.0742.0404.122.108.1417.2034.0279.0953.0345.3118.0345.6442v2.8548c0 .4881-.0345.7867-.0955.8954-.0609.1152-.2304.1695-.5018.1695V9.5211c.204 0 .3457.0205.4211.0681zm-.0211 6.0347c.4543 0 .8006-.0265 1.0245-.0742.2304-.0477.4204-.1357.5694-.2648.1556-.1218.2642-.298.3251-.5219.0611-.2238.1021-.6648.1021-1.3224v-2.5832c0-.6986-.0271-1.1668-.0742-1.4039-.041-.237-.1431-.4543-.3126-.6437-.1695-.1973-.4198-.3324-.7456-.421-.3191-.0808-.8542-.1285-1.7694-.1285h-1.4244v7.3636h2.3051zm5.14-1.7827c0 .3523-.0199.5762-.0544.6708-.033.0947-.1894.1424-.3046.1424-.1086 0-.19-.0477-.2238-.1351-.041-.0887-.0609-.2986-.0609-.6238v-1.9469c0-.3324.0199-.5423.0543-.6237.0338-.0808.1086-.122.2171-.122.1153 0 .2709.0412.3114.1425.041.0947.0609.2986.0609.6032v1.8926zm-2.4747-5.5809v7.3636h1.7157l.1152-.4675c.1556.1894.3251.3324.5152.4271.1828.0881.4608.1357.678.1357.3047 0 .5629-.0748.7802-.237.2165-.1562.3589-.3462.4198-.5628.0543-.2173.0887-.543.0887-.9841v-2.0675c0-.4409-.0139-.7324-.0344-.8681-.0199-.1357-.0742-.2781-.1695-.4204-.1021-.1425-.2437-.251-.4272-.3325-.1834-.0742-.3999-.1152-.6576-.1152-.2172 0-.4952.0477-.6846.1285-.1835.0887-.353.2238-.5086.4007V8.2603h-1.8309z" />
  </svg>
);

const LogoMetacritic = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    aria-label="Metacritic"
    fill="#FFD500"
    {...props}
  >
    <path d="M11.99 0A12 12 0 1 0 24 12v-.014A12 12 0 0 0 11.99 0Zm-.055 2.564a9.399 9.399 0 0 1 9.407 9.389v.01a9.399 9.399 0 1 1-9.408-9.399Zm-1.61 17.198 2.046-2.046-3.94-3.94c-.165-.166-.345-.373-.442-.608-.221-.47-.318-1.203.221-1.742.664-.664 1.548-.387 2.406.47l3.788 3.788 2.046-2.046-3.954-3.954a2.48 2.48 0 0 1-.456-.622c-.263-.539-.25-1.216.235-1.7.677-.678 1.562-.429 2.544.553l3.677 3.677 2.046-2.046-3.982-3.982c-2.018-2.018-3.912-1.949-5.212-.65-.498.499-.802 1.024-.954 1.618a4.026 4.026 0 0 0-.055 1.686l-.027.028c-.996-.414-2.13-.166-3 .705-1.162 1.161-1.12 2.392-.982 3.11l-.042.043-1.009-.816-1.77 1.77a64.1 64.1 0 0 1 2.213 2.1z" />
  </svg>
);

const LogoRT = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    aria-label="Rotten Tomatoes"
    fill="#FA320A"
    {...props}
  >
    <path d="M5.866 0L4.335 1.262l2.082 1.8c-2.629-.989-4.842 1.4-5.012 2.338 1.384-.323 2.24-.422 3.344-.335-7.042 4.634-4.978 13.148-1.434 16.094 5.784 4.612 13.77 3.202 17.91-1.316C27.26 13.363 22.993.65 10.86 2.766c.107-1.17.633-1.503 1.243-1.602-.89-1.493-3.67-.734-4.556 1.374C7.52 2.602 5.866 0 5.866 0zM4.422 7.217H6.9c2.673 0 2.898.012 3.55.202 1.06.307 1.868.973 2.313 1.904.05.106.092.206.13.305l7.623.008.027 2.912-2.745-.024v7.549l-2.982-.016v-7.522l-2.127.016a2.92 2.92 0 0 1-1.056 1.134c-.287.176-.3.19-.254.264.127.2 2.125 3.642 2.125 3.659l-3.39.019-2.013-3.376c-.034-.047-.122-.068-.344-.084l-.297-.02.037 3.48-3.075-.038zm3.016 2.288l.024.338c.014.186.024.729.024 1.206v.867l.582-.025c.32-.013.695-.049.833-.078.694-.146 1.048-.478 1.087-1.018.027-.378-.063-.636-.303-.87-.318-.309-.761-.416-1.733-.418Z" />
  </svg>
);

const PlayIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="white"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    {...props}
  >
    <polygon points="6 3 20 12 6 21 6 3" fill="white" stroke="none" />
  </svg>
);

export {
  HtmlContent,
  IconArrow,
  IconCheck,
  IconChevron,
  IconClose,
  IconExpand,
  IconFilmPlaceholder,
  IconPlay,
  IconPopcorn,
  IconStarEmpty,
  IconStarFull,
  IconStarHalf,
  IconThumb,
  IconTomato,
  IconVoteTriangle,
  LogoDouban,
  LogoImdb,
  LogoMetacritic,
  LogoRT,
  PlayIcon,
};
