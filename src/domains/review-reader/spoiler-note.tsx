type SpoilerNoteProps = { compact?: boolean };

const SpoilerNote = ({ compact = false }: SpoilerNoteProps) => (
  <p
    class={`atv-review-spoiler-note${compact ? " is-compact" : ""}`}
    role="note"
  >
    {compact ? "剧透" : "这篇剧评可能有剧透"}
  </p>
);

export { SpoilerNote };
