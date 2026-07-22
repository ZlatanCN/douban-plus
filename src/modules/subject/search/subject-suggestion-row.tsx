import type { SubjectSuggestion } from "@/modules/subject/api/subject-suggestions";

type SuggestionRowProps = {
  active: boolean;
  index: number;
  onOpen: (suggestion: SubjectSuggestion) => void;
  suggestion: SubjectSuggestion;
};

const suggestionMetadata = (suggestion: SubjectSuggestion): string => {
  const details = [suggestion.year];
  if (suggestion.episode) {
    details.push(`共 ${suggestion.episode} 集`);
  }
  return details.filter(Boolean).join(" · ");
};

const SuggestionRow = ({
  active,
  index,
  onOpen,
  suggestion,
}: SuggestionRowProps) => {
  const metadata = suggestionMetadata(suggestion);

  return (
    <button
      aria-selected={active}
      class={`atv-subject-suggestion${active ? " is-active" : ""}`}
      id={`atv-subject-suggestion-${suggestion.id}`}
      onClick={() => onOpen(suggestion)}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Rich poster rows require listbox options; native option elements cannot contain this content.
      role="option"
      type="button"
    >
      <span class="atv-subject-suggestion-poster" aria-hidden="true">
        {suggestion.imageUrl ? (
          <img alt="" loading="lazy" src={suggestion.imageUrl} />
        ) : null}
      </span>
      <span class="atv-subject-suggestion-copy">
        <span class="atv-subject-suggestion-title">
          {suggestion.title}
          {metadata ? (
            <span class="atv-subject-suggestion-metadata">{metadata}</span>
          ) : null}
        </span>
        {suggestion.originalTitle ? (
          <span class="atv-subject-suggestion-original">
            {suggestion.originalTitle}
          </span>
        ) : null}
      </span>
      <span class="atv-subject-suggestion-marker" aria-hidden="true" />
      <span class="atv-screen-reader-only">候选 {index + 1}</span>
    </button>
  );
};

export { SuggestionRow };
